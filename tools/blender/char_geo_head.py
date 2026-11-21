"""Volleyball player character: geometry, skeleton and skin weights, built from the CC0 MakeHuman base mesh.

Everything here is in clip space (metres): +x forward (toward the net), +y up, +z the player's right.
The result is a dict of parts; blender_build.py turns it into a rigged Blender scene, which is the editable source.
"""
import numpy as np, math
from mhload import load_obj, compose, skeleton, weights, joint_pos

NBODY = 13380
HEIGHT = 1.90          # barefoot standing height the base shapes are normalised to (the app rescales per player)
SOLE = 0.024           # shoe sole: the whole figure is lifted by this so shoes stand on y = 0

SHAPES = {             # MakeHuman macro settings per body shape (young adult, mixed ethnicity)
    'athletic': dict(gender=1, muscle=.78, weight=.42, height=.65),
    'lean':     dict(gender=1, muscle=.62, weight=.22, height=.65),
    'power':    dict(gender=1, muscle=1.0, weight=.68, height=.65),
    'female':   dict(gender=0, muscle=.74, weight=.40, height=.65),
}

# ---------- skeleton: 33 bones (fits the WebGL uniform budget on phones) ----------
# name: (parent, head joint, tail joint); joints are MakeHuman joint names or callables
BONES = [
    ('hips', None), ('spine1', 'hips'), ('spine2', 'spine1'), ('chest', 'spine2'), ('neck', 'chest'), ('head', 'neck'), ('jaw', 'head'),
]
for s in ('L', 'R'):
    BONES += [(f'clavicle.{s}', 'chest'), (f'upperarm.{s}', f'clavicle.{s}'), (f'forearm.{s}', f'upperarm.{s}'), (f'forearmTwist.{s}', f'forearm.{s}'),
              (f'hand.{s}', f'forearmTwist.{s}'), (f'thumb1.{s}', f'hand.{s}'), (f'thumb2.{s}', f'thumb1.{s}'), (f'fingers1.{s}', f'hand.{s}'), (f'fingers2.{s}', f'fingers1.{s}'),
              (f'thigh.{s}', 'hips'), (f'shin.{s}', f'thigh.{s}'), (f'foot.{s}', f'shin.{s}'), (f'toe.{s}', f'foot.{s}')]
BNAME = [b[0] for b in BONES]; BPAR = [BNAME.index(b[1]) if b[1] else -1 for b in BONES]

def mh_to_mine(mh):
    side = mh[-2:] if mh[-2:] in ('.L', '.R') else ''
    base = mh[:-2] if side else mh
    S = side[1:] if side else ''
    if base in ('root', 'pelvis'): return 'hips'
    if base in ('spine05', 'spine04'): return 'spine1'
    if base in ('spine03', 'spine02'): return 'spine2'
    if base in ('spine01', 'breast'): return 'chest'
    if base.startswith('neck'): return 'neck'
    if base in ('jaw', 'special04', 'oris02', 'oris01', 'oris06', 'oris07') or base.startswith('tongue'): return 'jaw'
    if base in ('clavicle', 'shoulder01'): return f'clavicle.{S}'
    if base.startswith('upperarm'): return f'upperarm.{S}'
    if base == 'lowerarm01': return f'forearm.{S}'
    if base == 'lowerarm02': return f'forearmTwist.{S}'
    if base == 'wrist' or base.startswith('metacarpal'): return f'hand.{S}'
    if base == 'finger1-1': return f'thumb1.{S}'
    if base.startswith('finger1-'): return f'thumb2.{S}'
    if base.startswith('finger') and base.endswith('-1'): return f'fingers1.{S}'
    if base.startswith('finger'): return f'fingers2.{S}'
    if base.startswith('upperleg'): return f'thigh.{S}'
    if base.startswith('lowerleg'): return f'shin.{S}'
    if base == 'foot': return f'foot.{S}'
    if base.startswith('toe'): return f'toe.{S}'
    return 'head'

def to_clip(Vmh):
    return np.stack([Vmh[:, 2], Vmh[:, 1], -Vmh[:, 0]], 1)

def joints_for(V, sk):
    """Clip-space head/tail per bone from MakeHuman joints (V already in clip space and normalised)."""
    J = lambda n: joint_pos(V, sk, n)
    def avg(names): return np.mean([J(n) for n in names], 0)
    H, T = {}, {}
    pel = J('spine05____head')
    H['hips'] = pel; T['hips'] = J('spine05____tail')
    H['spine1'] = pel.copy(); T['spine1'] = J('spine03____head')
    H['spine2'] = J('spine03____head'); T['spine2'] = J('spine01____head')
    H['chest'] = J('spine01____head'); T['chest'] = J('neck01____head')
    H['neck'] = J('neck01____head'); T['neck'] = J('head____head')
    H['head'] = J('head____head'); T['head'] = J('head____tail')
    H['jaw'] = J('jaw____head'); T['jaw'] = J('jaw____tail')
    for s in ('L', 'R'):
        H[f'clavicle.{s}'] = J(f'clavicle.{s}____head'); T[f'clavicle.{s}'] = J(f'upperarm01.{s}____head')
        H[f'upperarm.{s}'] = J(f'upperarm01.{s}____head'); T[f'upperarm.{s}'] = J(f'lowerarm01.{s}____head')
        H[f'forearm.{s}'] = J(f'lowerarm01.{s}____head'); T[f'forearm.{s}'] = J(f'wrist.{s}____head')
        H[f'forearmTwist.{s}'] = J(f'lowerarm02.{s}____head'); T[f'forearmTwist.{s}'] = J(f'wrist.{s}____head')
        H[f'hand.{s}'] = J(f'wrist.{s}____head'); T[f'hand.{s}'] = avg([f'finger{k}-1.{s}____head' for k in (2, 3, 4, 5)])
        H[f'thumb1.{s}'] = J(f'finger1-1.{s}____head'); T[f'thumb1.{s}'] = J(f'finger1-2.{s}____head')
        H[f'thumb2.{s}'] = J(f'finger1-2.{s}____head'); T[f'thumb2.{s}'] = J(f'finger1-3.{s}____tail')
        H[f'fingers1.{s}'] = T[f'hand.{s}']; T[f'fingers1.{s}'] = avg([f'finger{k}-2.{s}____head' for k in (2, 3, 4, 5)])
        H[f'fingers2.{s}'] = T[f'fingers1.{s}']; T[f'fingers2.{s}'] = avg([f'finger{k}-3.{s}____tail' for k in (2, 3, 4, 5)])
        H[f'thigh.{s}'] = J(f'upperleg01.{s}____head'); T[f'thigh.{s}'] = J(f'lowerleg01.{s}____head')
        H[f'shin.{s}'] = J(f'lowerleg01.{s}____head'); T[f'shin.{s}'] = J(f'foot.{s}____head')
        H[f'foot.{s}'] = J(f'foot.{s}____head'); T[f'foot.{s}'] = avg([f'toe{k}-1.{s}____head' for k in (1, 2, 3, 4, 5)])
        H[f'toe.{s}'] = T[f'foot.{s}']; T[f'toe.{s}'] = avg([f'toe{k}-{3 if k > 1 else 2}.{s}____tail' for k in (1, 2, 3, 4, 5)])
    return np.array([H[n] for n in BNAME]), np.array([T[n] for n in BNAME])

def normals(P, F):
    N = np.zeros_like(P)
    for f in F:
        f = list(f)
        for k in range(len(f)):
            a, b, c = P[f[k - 1]], P[f[k]], P[f[(k + 1) % len(f)]]
            N[f[k]] += np.cross(c - b, a - b)
    l = np.linalg.norm(N, axis=1, keepdims=True); l[l < 1e-12] = 1
    return N / l

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

class Builder:
    def __init__(self):
        V0, VT, F, FT, FG, groups = load_obj()
        self.groups = groups; self.Fall = F; self.FG = FG; self.FT = FT; self.VT = VT
        sk = skeleton(); self.sk = sk
        self.shapes = {}; self.joints = {}
        for name, kw in SHAPES.items():
            V = to_clip(compose(V0, **kw))
            b = V[:NBODY]; lo = b[:, 1].min(); s = HEIGHT / (b[:, 1].max() - lo)
            if name == 'athletic': self.raw_h = b[:, 1].max() - lo
            V = (V - [0, lo, 0]) * s
            # stand between the ankles
            a = (joint_pos(V, sk, 'foot.L____head') + joint_pos(V, sk, 'foot.R____head')) / 2
            V = V - [a[0], 0, a[2]]; V[:, 1] += SOLE
            # exact left/right symmetry (mirror the left half onto the right through the MakeHuman pairing)
            self.shapes[name] = V
            self.joints[name] = joints_for(V, sk)
        self.sym()
        self.P = self.shapes['athletic']
        self.Fbody = [F[k] for k in range(len(F)) if FG[k] == 0]
        self.N = normals(self.P[:NBODY], self.Fbody)
        self.weights()
        H, T = self.joints['athletic']; self.H, self.T = H, T

    def sym(self):
        """Pair every vertex with its mirror and average, so lefty mirroring in the app is exact."""
        P = self.shapes['athletic'][:NBODY]
        from scipy.spatial import cKDTree
        m = P * [1, 1, -1]
        d, idx = cKDTree(P).query(m)
        self.mirror = idx
        bad = (d > 2e-3).sum()
        for name, V in self.shapes.items():
            b = V[:NBODY]; mb = b[idx] * [1, 1, -1]
            V[:NBODY] = (b + mb) / 2
            H, T = joints_for(V, self.sk)
            for arr in (H, T):
                for i, n in enumerate(BNAME):
                    if n.endswith('.L'):
                        j = BNAME.index(n[:-2] + '.R'); avg = (arr[i] + arr[j] * [1, 1, -1]) / 2; arr[i] = avg; arr[j] = avg * [1, 1, -1]
                    elif '.' not in n: arr[i][2] = 0
            self.joints[name] = (H, T)
        print('symmetry pairs off by >2mm:', bad)

    def weights(self):
        W = weights(); n = NBODY
        acc = np.zeros((n, len(BNAME)))
        for mhb, lst in W.items():
            b = BNAME.index(mh_to_mine(mhb))
            for vi, w in lst:
                if vi < n: acc[vi, b] += w
        # mirror-average so both sides skin identically
        mi = self.mirror; sw = np.arange(len(BNAME))
        for i, nme in enumerate(BNAME):
            if nme.endswith('.L'): j = BNAME.index(nme[:-2] + '.R'); sw[i] = j; sw[j] = i
        acc = (acc + acc[mi][:, sw]) / 2
        idx = np.argsort(-acc, 1)[:, :4]; w = np.take_along_axis(acc, idx, 1)
        w[w < .01] = 0; s = w.sum(1, keepdims=True); s[s == 0] = 1; w /= s
        self.J4 = idx.astype(np.int32); self.W4 = w.astype(np.float32); self.acc = acc

    # ---------- helpers on the body ----------
    def bone(self, n): i = BNAME.index(n); return self.H[i], self.T[i]
    def seg_param(self, P, a, b):
        d = b - a; t = ((P - a) @ d) / (d @ d); return t, np.linalg.norm(P - (a + np.outer(np.clip(t, 0, 1), d)), axis=1)
    def dominant(self, names):
        ids = [BNAME.index(n) for n in names]; return self.acc[:, ids].sum(1)

