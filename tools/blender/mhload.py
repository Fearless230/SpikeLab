"""Load MakeHuman CC0 assets (base mesh, targets, skeleton joints, weights) into numpy, and compose body shapes."""
import os, numpy as np, json, os, re
MH = os.environ.get('MH_ASSETS', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mh_assets'))
def load_obj(path=MH + '/base.obj'):
    V, VT, F, FT, FG = [], [], [], [], []
    groups = []; g = -1
    for line in open(path):
        if line.startswith('v '): V.append([float(x) for x in line.split()[1:4]])
        elif line.startswith('vt '): VT.append([float(x) for x in line.split()[1:3]])
        elif line.startswith('g '):
            groups.append(line.split()[1]); g = len(groups) - 1
        elif line.startswith('f '):
            parts = [p.split('/') for p in line.split()[1:]]
            F.append([int(p[0]) - 1 for p in parts]); FT.append([int(p[1]) - 1 if len(p) > 1 and p[1] else -1 for p in parts]); FG.append(g)
    return np.array(V), np.array(VT), F, FT, np.array(FG), groups
def load_target(name):
    f = os.path.join(MH, 't', name.replace('/', '_'))
    idx, d = [], []
    for line in open(f):
        if line.startswith('#') or not line.strip(): continue
        p = line.split(); idx.append(int(p[0])); d.append([float(x) for x in p[1:4]])
    return np.array(idx, int), np.array(d)
_tc = {}
def T(name):
    if name not in _tc: _tc[name] = load_target(name)
    return _tc[name]
def three(v):  # value 0..1 -> weights for (min, average, max)
    if v < .5: return {'min': (.5 - v) / .5, 'average': v / .5, 'max': 0}
    return {'min': 0, 'average': (1 - v) / .5, 'max': (v - .5) / .5}
def compose(V0, gender=1., muscle=.5, weight=.5, height=.5, prop=1.):
    """MakeHuman macro model, young adult, ethnic mix 1/3 each."""
    V = V0.copy()
    def add(name, w):
        if abs(w) < 1e-6: return
        i, d = T(name); V[i] += d * w
    gw = {'female': 1 - gender, 'male': gender}
    for g, w in gw.items():
        for eth in ('african', 'asian', 'caucasian'): add(f'macrodetails/{eth}-{g}-young.target', w / 3)
    mw, ww = three(muscle), three(weight)
    for g, w in gw.items():
        for m, a in mw.items():
            for wt, b in ww.items():
                if m == 'average' and wt == 'average': continue
                if wt == 'max' and False: pass
                add(f'macrodetails/universal-{g}-young-{m}muscle-{wt}weight.target', w * a * b)
    hw = (height - .5) / .5
    mh = {'max': max(0, (muscle - .5) / .5), 'average': 1 - max(0, (muscle - .5) / .5)}
    for g, w in gw.items():
        for m, a in mh.items():
            if hw > 0: add(f'macrodetails/height/{g}-young-{m}muscle-averageweight-maxheight.target', w * a * hw)
            elif hw < 0: add(f'macrodetails/height/{g}-young-{m}muscle-averageweight-minheight.target', w * a * -hw)
            add(f'macrodetails/proportions/{g}-young-{m}muscle-averageweight-idealproportions.target', w * a * prop)
    return V
def skeleton():
    return json.load(open(MH + '/default.mhskel'))
def weights():
    return json.load(open(MH + '/default_weights.mhw'))['weights']
def joint_pos(V, skel, name):
    return V[skel['joints'][name]].mean(0)
