"""Clothing, hair and gear cut from the body surface along smooth iso-lines, so every edge is clean.
Each piece is a shell: the body faces inside a region, pushed out along the normal, with the boundary slid onto
the exact cut line and a rim that closes the gap to the skin."""
import numpy as np
from collections import defaultdict, Counter
from char_geo_head import *

parts = {}

def adjacency(F, n):
    adj = [set() for _ in range(n)]
    for f in F:
        for a in f:
            for b in f:
                if a != b: adj[a].add(b)
    return adj

def laplace(P, F, fixed, it=10, lam=.5):
    adj = adjacency(F, len(P)); P = P.copy()
    for _ in range(it):
        Q = P.copy()
        for i, nb in enumerate(adj):
            if fixed[i] or not nb: continue
            Q[i] = P[i] + lam * (P[list(nb)].mean(0) - P[i])
        P = Q
    return P

def shell(B, name, field, offset, mat, rim=True, rim_in=-.0008, smooth=0, smooth_fixed_border=True, keep=None):
    """field: per body vertex, metres, < 0 inside. offset(src, P) -> metres along the normal."""
    f = field
    F = [fc for fc in B.Fbody if min(f[v] for v in fc) < 0]
    if keep is not None: F = [fc for fc in F if keep(fc)]
    vs = sorted(set(v for fc in F for v in fc)); remap = {v: i for i, v in enumerate(vs)}
    src = np.array(vs); P = B.P[src].copy(); Nn = B.N[src].copy()
    faces = [[remap[v] for v in fc] for fc in F]
    # slide outside vertices onto the iso-line along edges to inside neighbours (face-adjacent, so diagonals count)
    nb = defaultdict(set)
    for fc in faces:
        for a in fc:
            for b in fc:
                if a != b: nb[a].add(b)
    fl = f[src]; P0 = P.copy()
    for i in range(len(src)):
        if fl[i] < 0: continue
        pts = []; ws = []
        for j in nb[i]:
            if fl[j] < 0:
                t = fl[i] / (fl[i] - fl[j]); pts.append(P0[i] + (P0[j] - P0[i]) * t); ws.append(1 / (1e-4 + np.linalg.norm(P0[j] - P0[i]) * t))
        if pts: P[i] = np.average(pts, axis=0, weights=ws)
    # normals at the slid positions: take them from the surface (re-estimated from the shell faces)
    Nn = normals(P, faces)
    off = offset(src, P)
    out = P + Nn * off[:, None]
    if smooth:
        cnt = Counter()
        for fc in faces:
            for k in range(len(fc)): cnt[tuple(sorted((fc[k], fc[(k + 1) % len(fc)])))] += 1
        border = np.zeros(len(src), bool)
        for (a, b), c in cnt.items():
            if c == 1: border[a] = border[b] = True
        out = laplace(out, faces, border if smooth_fixed_border else np.zeros(len(src), bool), it=smooth)
    if rim:
        ec = Counter()
        for fc in faces:
            for k in range(len(fc)): ec[tuple(sorted((fc[k], fc[(k + 1) % len(fc)])))] += 1
        bnd = [(fc[k], fc[(k + 1) % len(fc)]) for fc in faces for k in range(len(fc)) if ec[tuple(sorted((fc[k], fc[(k + 1) % len(fc)])))] == 1]
        inner = {}; Pl = list(out); srcl = list(src)
        for a, b in bnd:
            for v in (a, b):
                if v not in inner: inner[v] = len(Pl); Pl.append(P[v] + Nn[v] * rim_in); srcl.append(src[v])
            faces.append([b, a, inner[a], inner[b]])
        out = np.array(Pl); src = np.array(srcl)
    parts[name] = dict(P=out, src=src, F=faces, mat=mat)
    return parts[name]

def build():
    B = Builder(); P = B.P[:NBODY]; N = B.N
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    Hh, _ = B.bone('head'); neck0, _ = B.bone('neck'); chest0, _ = B.bone('chest')
    hipL, kneeL = B.bone('thigh.L'); _, ankL = B.bone('shin.L')
    top = P[:, 1].max(); eye = joint_pos(B.P, B.sk, 'eye.L____head'); eye_y = eye[1]
    m5, m1 = joint_pos(B.P, B.sk, 'oris05____head'), joint_pos(B.P, B.sk, 'oris01____head')
    mouth_y = (m5[1] + m1[1]) / 2; mouth_x = max(m5[0], m1[0])
    side = np.sign(z)
    dom = B.dominant
    armw = dom([n for n in BNAME if n.split('.')[0] in ('upperarm', 'forearm', 'forearmTwist', 'hand', 'thumb1', 'thumb2', 'fingers1', 'fingers2')])
    clw = dom(['clavicle.L', 'clavicle.R'])
    legw = dom([n for n in BNAME if n.split('.')[0] in ('thigh', 'shin', 'foot', 'toe')])
    headw = dom(['head', 'jaw'])
    neckw = dom(['neck'])
    footw = dom(['foot.L', 'foot.R', 'toe.L', 'toe.R'])
    # arm / leg parameters (0 at the proximal joint, 1 at the middle joint, 2 at the distal joint)
    ap = np.full(len(P), -1.0); lp = np.full(len(P), -1.0); ad = np.zeros(len(P))
    for s in (-1, 1):
        S = 'L' if s < 0 else 'R'
        a, e = B.bone(f'upperarm.{S}'); _, w = B.bone(f'forearm.{S}')
        t1, d1 = B.seg_param(P, a, e); t2, _ = B.seg_param(P, e, w)
        ap = np.where(side == s, np.where(t2 > 0, 1 + t2, t1), ap)
        h, k = B.bone(f'thigh.{S}'); _, an = B.bone(f'shin.{S}')
        u1, _ = B.seg_param(P, h, k); u2, _ = B.seg_param(P, k, an)
        lp = np.where(side == s, np.where(u2 > 0, 1 + u2, u1), lp)
    upper_len = np.linalg.norm(B.bone('upperarm.L')[1] - B.bone('upperarm.L')[0])
    thigh_len = np.linalg.norm(hipL - kneeL); shin_len = np.linalg.norm(kneeL - ankL)
    is_arm = armw > .5; is_leg = legw > .5
    def U(*fs): return np.maximum.reduce(fs)     # intersection of "inside" (all negative)
    BIG = 1.0
    # ---------- jersey ----------
    hem_y = hipL[1] + .005
    collar = neck0[1] - .006 - .035 * smoothstep(0, .09, x) * (x > 0) - .012 * smoothstep(0, -.08, x) * (x < 0)
    f_collar = np.where(headw > .5, BIG, y - collar)
    f_hem = hem_y - y
    f_torso = np.where(is_leg & (lp > .05), BIG, U(f_collar, f_hem))
    sleeve_end = .40
    f_sleeve = np.where(is_arm, (ap - sleeve_end) * upper_len, -.01)
    f_short = np.where(is_arm & (ap > sleeve_end + .5), BIG, U(f_torso, f_sleeve))
    # sleeveless: armhole around the shoulder joint
    shc = {s: B.bone(f'upperarm.{"L" if s < 0 else "R"}')[0] for s in (-1, 1)}
    dsh = np.where(side < 0, np.linalg.norm(P - shc[-1] * [1, 1, 1], axis=1), np.linalg.norm(P - shc[1], axis=1))
    armhole = .095 - .02 * smoothstep(0, -.1, x - shc[1][0])          # cut deeper at the back
    f_less = np.where(is_arm & (ap > .15), BIG, U(f_torso, armhole - dsh + np.where(y > chest0[1] - .06, 0, -BIG)))
    def joff(src, Pp):
        yy = Pp[:, 1]
        o = .0055 + .0035 * smoothstep(1.20, 1.0, yy) + .0025 * np.clip(-B.N[src, 1], 0, 1)
        o += .009 * smoothstep(hem_y + .16, hem_y, yy)                  # hangs away from the waist, over the shorts
        o += .003 * smoothstep(.15, .40, B.ap[src].clip(0)) * (B.ap[src] > 0)
        return o
    B.ap, B.lp = ap, lp
    shell(B, 'jersey_short', f_short, joff, 'jersey', smooth=6)
    shell(B, 'jersey_sleeveless', f_less, joff, 'jersey', smooth=6)
    # ---------- shorts (waistband sits under the jersey hem) ----------
    waist = hipL[1] + .12
    leg_hem = .40 + .03 * (x > 0)                                          # fraction of thigh, a touch longer at the front
    f_waist = y - waist
    f_leg = np.where(is_leg, (lp - leg_hem) * thigh_len, -.01)
    f_shorts = np.where(is_arm | (headw > .3), BIG, U(f_waist, f_leg, np.where(y < hipL[1] - .35, BIG, -1)))
    def soff(src, Pp):
        l = np.clip(B.lp[src], 0, 1)
        return .006 + .010 * smoothstep(.10, .34, l) * (B.lp[src] > 0) + .003 * np.clip(-B.N[src, 1], 0, 1) - .0015 * smoothstep(waist - .1, waist, Pp[:, 1])
    shell(B, 'shorts', f_shorts, soff, 'shorts', smooth=3)
    # ---------- socks ----------
    def sock(lo):
        return np.where(is_leg & (footw < .5), U((lo - lp) * shin_len, (y - (SOLE + .085))) * 1, BIG) * -1 * -1
    f_crew = np.where(is_leg & (lp > 1.5), U((1.74 - lp) * shin_len, (SOLE + .07) - y), BIG)
    f_high = np.where(is_leg & (lp > .9), U((1.10 - lp) * shin_len, (SOLE + .07) - y), BIG)
    shell(B, 'socks_crew', f_crew, lambda s, p: np.full(len(s), .0025), 'sock', rim_in=-.0015)
    shell(B, 'socks_high', f_high, lambda s, p: np.full(len(s), .0025), 'sock', rim_in=-.0015)
    # ---------- shoes: foot surface, smoothed (no toes), widened, with a flat sole ----------
    collar_y = SOLE + .095 + .01 * smoothstep(0, -.1, x)
    f_shoe = np.where((footw > .2) | (is_leg & (lp > 1.6)), y - collar_y, BIG)
    sh = shell(B, 'shoes', f_shoe, lambda s, p: np.full(len(s), .006), 'shoe', smooth=14, rim_in=-.002)
    Ps = sh['P']
    for s in (-1, 1):
        S = 'L' if s < 0 else 'R'
        a, toe = B.bone(f'foot.{S}'); m = np.sign(Ps[:, 2]) == s
        c = np.array([a[0] + .03, 0, a[2]])
        # widen slightly around the forefoot and lift the toe box so it reads as a shoe
        rel = Ps[m] - c; Ps[m, 2] = c[2] + rel[:, 2] * 1.06
        fr = smoothstep(a[0] + .05, toe[0] + .07, Ps[m, 0])
        Ps[m, 1] = Ps[m, 1] + .006 * fr * (Ps[m, 1] > SOLE + .01)
    low = Ps[:, 1] < SOLE + .012
    Ps[:, 1] = np.where(Ps[:, 1] < SOLE + .006, np.interp(Ps[:, 1], [SOLE - .02, SOLE + .006], [0.0, SOLE * .55]), Ps[:, 1])
    sh['sole'] = Ps[:, 1] < SOLE * .6 + .004
    # ---------- knee pads ----------
    f_kp = np.where(is_leg, np.abs(lp - 1.0) * thigh_len - .085, BIG)
    def kpo(src, Pp):
        k = smoothstep(.085, .04, np.abs(B.lp[src] - 1.0) * thigh_len)
        fr = np.clip(B.N[src, 0] * .5 + .5, 0, 1) ** 1.5
        return .004 + .012 * k * (.35 + .65 * fr)
    shell(B, 'kneepads', f_kp, kpo, 'pad', rim_in=-.001)
    # ---------- compression arm sleeve ----------
    f_as = np.where(is_arm, U((.30 - ap) * upper_len, (ap - 1.93) * upper_len), BIG)
    shell(B, 'armsleeve', f_as, lambda s, p: np.full(len(s), .0021), 'sleeve', rim_in=-.0005)
    # ---------- hair ----------
    rel = P - [Hh[0], 0, 0]
    ang = np.degrees(np.arctan2(np.abs(rel[:, 2]), rel[:, 0]))
    hl = np.interp(ang, [0, 28, 50, 68, 85, 100, 120, 145, 165, 180], [eye_y + .066, eye_y + .060, eye_y + .046, eye_y + .040, eye_y + .040, eye_y + .030, eye_y - .005, eye_y - .055, eye_y - .075, eye_y - .080])
    ear = np.exp(-((ang - 95) / 14) ** 2 - ((y - (eye_y - .005)) / .028) ** 2)
    f_hair = np.where(headw > .5, hl - y + .02 * ear, BIG)
    B.hl = hl; B.hang = ang
    crown = lambda p: smoothstep(eye_y + .03, top - .005, p[:, 1])
    edge = lambda src, p: np.clip((p[:, 1] - B.hl[src]) / .022, 0, 1)
    shell(B, 'hair_buzz', f_hair, lambda s, p: (.0018 + .0012 * crown(p)) * (.4 + .6 * edge(s, p)), 'hair', rim_in=.0003)
    shell(B, 'hair_short', f_hair, lambda s, p: (.005 + .020 * crown(p) ** 1.3 + .004 * np.clip((B.hang[s] < 40) * 1.0, 0, 1)) * (.3 + .7 * edge(s, p)), 'hair', rim_in=.0006, smooth=3)
    shell(B, 'hair_cap', f_hair, lambda s, p: (.006 + .007 * crown(p)) * (.35 + .65 * edge(s, p)), 'hair', rim_in=.0006, smooth=2)
    # ---------- headband ----------
    bc = np.interp(ang, [0, 90, 180], [eye_y + .078, eye_y + .066, eye_y + .015])
    f_band = np.where(headw > .5, np.abs(y - bc) - .013, BIG)
    shell(B, 'headband_thin', f_band, lambda s, p: np.full(len(s), .0042), 'band', rim_in=-.0005)
    shell(B, 'headband_thick', f_band, lambda s, p: .0045 + (.005 + .020 * crown(p) ** 1.3 + .004 * (B.hang[s] < 40)) * (.3 + .7 * edge(s, p)) * .85, 'band', rim_in=-.0005)
    # ---------- facial hair ----------
    face = (headw > .5) & (ang < 105)
    lipd = np.abs(y - mouth_y)
    cheek = np.interp(ang, [0, 30, 55, 80, 105], [mouth_y + .012, mouth_y + .030, eye_y - .040, eye_y - .028, eye_y - .020])
    f_beard = np.where(face | (neckw > .3), U(y - cheek, (neck0[1] + .035) - y, np.where(ang < 30, .010 - lipd, -1)), BIG)
    f_mous = np.where(face, U(np.abs(y - (mouth_y + .015)) - .008, ang - 34, (mouth_y + .009) - y), BIG)
    f_goat = np.where(face, U(np.abs(y - (mouth_y - .032)) - .024, ang - 22), BIG)
    shell(B, 'beard_full', np.minimum(f_beard, f_mous), lambda s, p: np.full(len(s), .0035), 'beard', rim_in=.0004, smooth=2)
    shell(B, 'beard_stubble', np.minimum(f_beard, f_mous), lambda s, p: np.full(len(s), .0008), 'beard', rim=False)
    shell(B, 'beard_moustache', f_mous, lambda s, p: np.full(len(s), .0018), 'beard', rim_in=.0004)
    shell(B, 'beard_goatee', np.minimum(f_mous, f_goat), lambda s, p: np.full(len(s), .0024), 'beard', rim_in=.0004)
    # ---------- skin: drop faces that are always covered ----------
    covered = (f_torso < -.03) & (f_less < -.03) | (f_shorts < -.04) & (y > hipL[1] - .22) | (f_shoe < -.03) & (y < SOLE + .06)
    bodyF = [fc for fc in B.Fbody if not all(covered[v] for v in fc)]
    vs = sorted(set(v for fc in bodyF for v in fc)); remap = {v: i for i, v in enumerate(vs)}
    # tone: lips, brows (darkened toward the hair colour in the app), nails
    vc = np.ones((NBODY, 4)); vc[:, 3] = 0           # rgb multiplier, a = brow amount
    lip = face & (ang < 28)
    vc[:, :3] *= (1 - .17 * np.exp(-(lipd / .0075) ** 2)[:, None] * lip[:, None] * [0.6, 1.4, 1.35])
    eyez = abs(eye[2])
    dz = np.abs(np.abs(z) - eyez)
    browc = eye_y + .022 + .004 * (1 - (dz / .025) ** 2) - .004 * (np.abs(z) > eyez) * (dz / .025)
    bw = np.exp(-((y - browc) / .0055) ** 2) * smoothstep(.030, .012, dz - .002 * (np.abs(z) < eyez)) * face * (x > eye[0] - .02)
    vc[:, 3] = np.clip(bw * 1.2, 0, 1)
    tips = dom([n for n in BNAME if n.split('.')[0] in ('fingers2', 'thumb2')])
    vc[tips > .8, :3] *= [1.04, .98, .97]
    parts['skin'] = dict(P=B.P[vs], src=np.array(vs), F=[[remap[v] for v in fc] for fc in bodyF], mat='skin', VC=vc[vs])
    B.eyes = [joint_pos(B.P, B.sk, f'eye.{s}____head') for s in ('L', 'R')]
    B.eye_r = .1495 * (HEIGHT / B.raw_h)
    return B

if __name__ == '__main__':
    B = build()
    for k, p in parts.items(): print('%-18s %6d v %6d f' % (k, len(p['P']), len(p['F'])))
