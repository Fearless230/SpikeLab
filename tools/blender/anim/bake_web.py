"""Bake clips straight into js/player-data.js without Blender (numpy only).
The rig is rebuilt from the bone data already in player-data.js; the motion comes from choreo.py, research.py and research_more.py.
Run from anywhere:  python3 tools/blender/anim/bake_web.py quick,shoot,tip      (or `all`; --fps=60 is the default;
--check spike compares a re-bake with the exported clip at its own frame rate)"""
import os, sys, json, re, base64
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..')); OUT = os.path.join(REPO, 'js', 'player-data.js')
import solver, choreo

def load_player():
    line = [l for l in open(OUT).read().split('\n') if l.startswith('window.VB_PLAYER=')][0]
    return json.loads(line[len('window.VB_PLAYER='):].rstrip(';'))

class WebRig(solver.Rig):
    """solver.Rig built from the exported bone data instead of the MakeHuman assets."""
    def __init__(self, P):
        b = P['bones']; self.names = b['names']; self.par = b['parents']
        self.H = np.array(b['heads']['athletic']); self.T = np.array(b['tails']); self.i = {n: k for k, n in enumerate(self.names)}
        h = lambda n: self.H[self.i[n]]; t = lambda n: self.T[self.i[n]]; self.h, self.t = h, t
        self.seg = {k: np.array(v) for k, v in b['seg'].items()}
        self.L1 = np.linalg.norm(t('thigh.R') - h('thigh.R')); self.L2 = np.linalg.norm(t('shin.R') - h('shin.R'))
        a0 = h('foot.R'); b0 = h('toe.R'); self.ankle_from_ball = a0 - np.array([b0[0], 0, b0[2]])
        self.heel_from_ball = np.array([a0[0] - .045 - b0[0], 0, 0]) + np.array([0, 0, a0[2] - b0[2]])
        self.hipw = abs(h('thigh.R')[2] - h('hips')[2]); self.stand = h('hips')[1]; self.ankle_h = a0[1]

def encode(frames):
    Q = np.array([[solver.quat(L) for L in Ls] for (Ls, _, _, _) in frames])
    for fi in range(1, len(Q)):
        flip = (Q[fi] * Q[fi - 1]).sum(-1) < 0; Q[fi][flip] *= -1
    R = np.array([X0 for (_, X0, _, _) in frames])
    b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
    return Q, R, b64(np.round(Q * 32767).astype(np.int16)), b64(R.astype(np.float32))

if __name__ == '__main__':
    args = sys.argv[1:]; check = '--check' in args
    FPS = int(next((a.split('=')[1] for a in args if a.startswith('--fps=')), 60))
    names = [a for a in args if not a.startswith('--')]
    P = load_player(); clips = choreo.load_clips(WebRig(P)); s = open(OUT).read(); nb = len(P['bones']['names'])
    names = list(clips) if names and names[0] == 'all' else (names[0].split(',') if names else [])
    for name in names:
        c = clips[name]; fps = FPS if not check else P['clips'][name]['fps']; fr = c.bake(fps); Q, R, q64, r64 = encode(fr)
        if check:
            e = P['clips'][name]; Q0 = np.frombuffer(base64.b64decode(e['q']), np.int16).reshape(e['n'], nb, 4) / 32767; n = min(len(Q), len(Q0))
            print(name, 'max rotation difference', float(np.abs(np.abs((Q[:n] * Q0[:n]).sum(-1)) - 1).max())); continue
        d = c.d; rec = {'fps': fps, 'n': len(fr), 'dur': c.dur, 'contact': d['contact'] if d['contact'] is not None else -1, 'tTO': d.get('tTO') or -1,
                        'tLand': d.get('tLand') or -1, 'hand': d.get('hand', 'R'), 'labels': d.get('labels', []), 'q': q64, 'root': r64}
        js = '"%s":%s' % (name, json.dumps(rec, separators=(',', ':')))
        m = re.search(r'"%s":\{"fps".*?"root":"[^"]*"\}' % re.escape(name), s)
        s = s[:m.start()] + js + s[m.end():] if m else s.replace('"clips":{', '"clips":{' + js + ',', 1)
        print('baked', name, len(fr), 'frames')
    if not check: open(OUT, 'w').write(s)
