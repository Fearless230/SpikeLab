"""Export player.blend (rig, mesh pieces, body shapes, technique actions) to js/player-data.js for the site's WebGL engine.
Run: blender -b player.blend --python export_web.py -- /path/to/js/player-data.js
Everything is written in clip space: +x toward the net, +y up, +z the player's right; metres.
Bone data: local rotation of each bone relative to its parent, with the rest (bind) pose = identity."""
import os, sys, json, math, base64
import bpy, numpy as np

OUT = sys.argv[sys.argv.index('--') + 1]
C = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0.]])            # clip -> Blender
CT = C.T
arm = bpy.data.objects['PlayerRig']
BN = [b.name for b in arm.data.bones]
PAR = [BN.index(b.parent.name) if b.parent else -1 for b in arm.data.bones]
b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
out = {'v': 1, 'bones': {'names': BN, 'parents': PAR}, 'pieces': {}, 'clips': {}}
SJ = json.loads(arm['shape_joints'])
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) if os.path.basename(os.path.dirname(os.path.abspath(__file__))) == 'anim' else os.path.dirname(os.path.abspath(__file__)))
from char_geo_head import BNAME as CHAR_ORDER
ORD = [CHAR_ORDER.index(n) for n in BN]                     # builder order -> Blender bone order
out['bones']['heads'] = {k: (np.array(v['H'])[ORD] @ C).round(5).tolist() for k, v in SJ.items()}     # Blender -> clip: v @ C == C^T v

def uv_cyl(P, cx, cz, vmin, vmax, u0=0.):
    """Cylindrical UV around a vertical axis: u = angle / 2pi (0.5 = front centre), v = height."""
    a = np.arctan2(P[:, 2] - cz, P[:, 0] - cx)            # 0 = front (+x), +pi/2 = right side
    u = (-a / (2 * math.pi) + .5 + u0) % 1.0
    v = (P[:, 1] - vmin) / (vmax - vmin)
    return np.stack([u, v], 1)

dg = bpy.context.evaluated_depsgraph_get()
REST = {}
for ob in arm.children:
    if ob.type != 'MESH': continue
    piece = ob.get('piece', ob.name)
    amod = ob.modifiers.get('Armature'); amod.show_viewport = False
    keys = ob.data.shape_keys.key_blocks if ob.data.shape_keys else []
    for k in keys: k.value = 0
    def evaluate():
        dg.update(); e = ob.evaluated_get(dg); m = e.to_mesh()
        P = np.array([v.co for v in m.vertices]) @ C
        return e, m, P
    e, m, P = evaluate()
    nv = len(m.vertices)
    # weights
    gi = {g.index: BN.index(g.name) for g in ob.vertex_groups if g.name in BN}
    J = np.zeros((nv, 4), np.uint8); W = np.zeros((nv, 4), np.float32)
    for v in m.vertices:
        gs = sorted([(g.weight, gi[g.group]) for g in v.groups if g.group in gi and g.weight > 1e-4], reverse=True)[:4]
        s = sum(w for w, _ in gs) or 1
        for k, (w, b) in enumerate(gs): J[v.index, k] = b; W[v.index, k] = w / s
    W8 = np.round(W * 255).astype(np.int32); W8[:, 0] += 255 - W8.sum(1); W8 = W8.clip(0, 255).astype(np.uint8)
    # triangles grouped by material
    tris = {}
    for poly in m.polygons:
        vs = list(poly.vertices)
        for k in range(1, len(vs) - 1): tris.setdefault(poly.material_index, []).extend([vs[0], vs[k], vs[k + 1]])
    VC = None
    if 'Col' in m.color_attributes:
        ca = m.color_attributes['Col']; VC = np.array([c.color for c in ca.data])
    # body shapes
    morphs = {}
    for k in keys[1:]:
        k.value = 1; _, m2, P2 = evaluate(); morphs[k.name] = P2 - P; e.to_mesh_clear(); k.value = 0
        e, m, P = evaluate()
    # clothing edges (hems, cuffs, collar): the cut follows the body's triangles and comes out zig-zagged, so smooth each
    # open edge loop along itself and move the outer edge of the rim with it
    if piece.startswith(('jersey', 'shorts', 'armsleeve', 'socks', 'kneepads', 'headband')):
        polys = [list(pl.vertices) for pl in m.polygons]
        from collections import Counter as _C, defaultdict as _dd
        ec = _C(tuple(sorted((pl[k], pl[(k + 1) % len(pl)]))) for pl in polys for k in range(len(pl)))
        bn = _dd(set)
        for (a, b), c in ec.items():
            if c == 1: bn[a].add(b); bn[b].add(a)
        ring = [v for v in bn if len(bn[v]) == 2]
        # partner on the outer edge: in the rim quad, the vertex joined to this one by a non-boundary edge
        nb = _dd(set)
        for pl in polys:
            for k in range(len(pl)): a, b = pl[k], pl[(k + 1) % len(pl)]; nb[a].add(b); nb[b].add(a)
        partner = {}
        for v in ring:
            c = [u for u in nb[v] if u not in bn and np.linalg.norm(P[u] - P[v]) < .02]
            if c: partner[v] = min(c, key=lambda u: np.linalg.norm(P[u] - P[v]))
        Q = P.copy()
        for _ in range(8):
            R = Q.copy()
            for v in ring:
                a, b = tuple(bn[v]); R[v] = Q[v] + .5 * ((Q[a] + Q[b]) / 2 - Q[v])
            Q = R
        D = Q - P
        for v, u in partner.items(): Q[u] = P[u] + D[v]
        P = Q
    amod.show_viewport = True
    mats = [s.material.name if s.material else 'skin' for s in ob.material_slots]
    # UVs for textured pieces (jersey number and trim, shorts stripe, hair strands): split vertices across the back seam
    UV = None
    if piece.startswith('jersey') or piece == 'shorts' or piece.startswith('hair'):
        if piece.startswith('hair'):
            hd = out['bones']['heads']['athletic'][BN.index('head')]; UV = uv_cyl(P, hd[0] - .01, 0, hd[1] - .12, hd[1] + .22)
        elif piece == 'shorts':
            UV = uv_cyl(P, 0.0, 0.0, 0.55, 1.30)
        else:
            UV = uv_cyl(P, 0.0, 0.0, 0.88, 1.70)
        # vertices whose triangles straddle the seam get a duplicate with u + 1
        extra = {}; Pn = [P]; Jn = [J]; Wn = [W8]; UVn = [UV]; VCn = [VC] if VC is not None else None; Mn = {k: [v] for k, v in morphs.items()}
        cnt = nv
        for mi, ix in tris.items():
            for t in range(0, len(ix), 3):
                tri = ix[t:t + 3]; us = UV[tri, 0]
                if us.max() - us.min() > .5:
                    for q in range(3):
                        v = tri[q]
                        if UV[v, 0] < .5:
                            if v not in extra:
                                extra[v] = cnt; cnt += 1
                                Pn.append(P[v:v + 1]); Jn.append(J[v:v + 1]); Wn.append(W8[v:v + 1]); UVn.append(UV[v:v + 1] + [1, 0])
                                for k in Mn: Mn[k].append(morphs[k][v:v + 1])
                            ix[t + q] = extra[v]
        P = np.concatenate(Pn); J = np.concatenate(Jn); W8 = np.concatenate(Wn); UV = np.concatenate(UVn); morphs = {k: np.concatenate(v) for k, v in Mn.items()}
        nv = len(P)
    REST[piece if piece != 'eyes' else ob.name] = (P.copy(), [t for v in tris.values() for t in v])
    groups = []; idx = []
    for mi in sorted(tris):
        groups.append([mats[mi], len(idx), len(tris[mi])]); idx.extend(tris[mi])
    idx = np.array(idx, np.uint32)
    rec = {'n': int(nv), 'groups': groups, 'p': b64(np.round(P * 10000).astype(np.int16)), 'j': b64(J), 'w': b64(W8),
           'i': b64(idx.astype(np.uint16) if nv < 65536 else idx), 'i32': nv >= 65536}
    if UV is not None: rec['uv'] = b64(np.round(UV * 16384).clip(0, 65535).astype(np.uint16))
    if VC is not None: rec['c'] = b64(np.round(np.array(VC).clip(0, 1) * 255).astype(np.uint8))
    rec['m'] = {}
    for k, D in morphs.items():
        sc = float(np.abs(D).max()) / 127 or 1e-6
        rec['m'][k] = {'s': sc, 'd': b64(np.round(D / sc).astype(np.int8))}
    out['pieces'][piece if piece != 'eyes' else ob.name] = rec
    print('piece', piece, ob.name, nv, len(idx) // 3)

# ---------- skin coverage ----------
# Skin that sits under a piece of clothing can poke through it when the body bends (most visibly at the shoulders and the
# waist). For each skin vertex, flag the pieces that cover it (well inside the piece's edges); the app drops a skin
# triangle when every corner is covered by something the player is wearing.
from scipy.spatial import cKDTree
COV = [('jersey_short', .016), ('jersey_sleeveless', .016), ('shorts', .016), ('socks_crew', .010), ('socks_high', .010), ('kneepads', .010), ('shoes', .012), ('armsleeve', .010)]
SP, ST = REST['skin']; ST = np.array(ST).reshape(-1, 3)
SN = np.zeros_like(SP); fn = np.cross(SP[ST[:, 1]] - SP[ST[:, 0]], SP[ST[:, 2]] - SP[ST[:, 0]])
for k in range(3): np.add.at(SN, ST[:, k], fn)
SN /= np.linalg.norm(SN, axis=1, keepdims=True) + 1e-12
cov = np.zeros(len(SP), np.uint16)
for bit, (pc, margin) in enumerate(COV):
    if pc not in REST: continue
    PP, TT = REST[pc]; TT = np.array(TT).reshape(-1, 3)
    from collections import Counter as _C
    ec = _C(tuple(sorted(e)) for t in TT for e in ((t[0], t[1]), (t[1], t[2]), (t[2], t[0])))
    bnd = np.array(sorted({v for e, c in ec.items() if c == 1 for v in e}))
    used = np.unique(TT)
    dist_b = cKDTree(PP[bnd]).query(PP[used])[0] if len(bnd) else np.full(len(used), 1.)
    tree = cKDTree(PP[used])
    # the clothing surface just outside the skin, along the skin normal
    # (a smoothed shell can sink below convex skin such as the deltoid, so also accept a nearby point on either side)
    d, j = tree.query(SP + SN * .006)
    d2, j2 = tree.query(SP)
    inside = ((d < .012) & (dist_b[j] > margin)) | ((d2 < .02) & (dist_b[j2] > margin))
    if pc == 'armsleeve':
        cov |= (inside & (SP[:, 2] < 0)).astype(np.uint16) << bit
        cov |= (inside & (SP[:, 2] >= 0)).astype(np.uint16) << (bit + 1)
    else:
        cov |= inside.astype(np.uint16) << bit
    print('cover', pc, int(inside.sum()))
out['pieces']['skin']['cov'] = b64(cov)
out['covBits'] = [c for c, _ in COV[:-1]] + ['armsleeve.L', 'armsleeve.R']

# ---------- actions ----------
rest = {b.name: np.array(b.matrix_local.to_3x3()) for b in arm.data.bones}
head0 = {b.name: np.array(b.head_local) for b in arm.data.bones}
def qmat(q):
    w, x, y, z = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)], [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)], [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]])
import sys as _s; _s.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'anim'))
from solver import quat, Rig, CAN
_rig = Rig()
out['bones']['palm'] = {S: (_rig.seg[f'hand.{S}'] @ CAN.T @ np.array([1., 0, 0])).round(5).tolist() for S in 'LR'}
out['bones']['tails'] = _rig.T[ORD].round(5).tolist()
# rest frames of the limb segments (columns: segment direction, flex axis, third axis), used to drive the rig from joint positions
out['bones']['seg'] = {k: np.asarray(v).round(5).tolist() for k, v in _rig.seg.items()}
for act in bpy.data.actions:
    nf = int(act.frame_range[1] - act.frame_range[0] + 1); f0 = act.frame_range[0]
    Q = np.zeros((nf, len(BN), 4)); ROOT = np.zeros((nf, 3))
    for bi, bn in enumerate(BN):
        fq = [act.fcurves.find(f'pose.bones["{bn}"].rotation_quaternion', index=k) for k in range(4)]
        Rb = rest[bn]
        for fi in range(nf):
            fr = f0 + fi
            q = np.array([fc.evaluate(fr) if fc else (1. if k == 0 else 0.) for k, fc in enumerate(fq)]); q /= np.linalg.norm(q)
            L = CT @ (Rb @ qmat(q) @ Rb.T) @ C
            Q[fi, bi] = quat(L)
        for fi in range(1, nf):
            if Q[fi, bi] @ Q[fi - 1, bi] < 0: Q[fi, bi] = -Q[fi, bi]
        if bn == 'hips':
            fl = [act.fcurves.find(f'pose.bones["{bn}"].location', index=k) for k in range(3)]
            for fi in range(nf):
                loc = np.array([fc.evaluate(f0 + fi) if fc else 0 for fc in fl])
                ROOT[fi] = CT @ (head0[bn] + Rb @ loc)
    out['clips'][act.name] = {'fps': act.get('fps', 30), 'n': nf, 'dur': act.get('dur', nf / 30), 'contact': act.get('contact', -1),
                              'tTO': act.get('tTO', -1), 'tLand': act.get('tLand', -1), 'hand': act.get('hand', 'R'), 'labels': json.loads(act.get('labels', '[]')),
                              'q': b64(np.round(Q * 32767).astype(np.int16)), 'root': b64(ROOT.astype(np.float32))}
    print('clip', act.name, nf)
s = json.dumps(out, separators=(',', ':'))
with open(OUT, 'w') as f:
    f.write('/* player-data.js: generated by tools/blender/export_web.py from tools/blender/player.blend. Do not edit by hand.\n'
            '   Rigged volleyball player (CC0 MakeHuman base mesh) and baked technique animations. */\n')
    f.write('window.VB_PLAYER=' + s + ';\n')
print('wrote', OUT, len(s) // 1024, 'KB')
