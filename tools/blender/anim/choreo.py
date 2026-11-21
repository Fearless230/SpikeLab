"""Choreography: clip data (keys, foot plants) -> smoothed pose parameters per frame -> bone rotations.
The clip data starts from the site's original clips (clips_base.json) and is corrected by research.py."""
import json, math, numpy as np, os, copy
from solver import Rig, to_local, quat, D2R

HERE = os.path.dirname(os.path.abspath(__file__))
OLD_STAND = 1.005           # straight-leg pelvis height of the old rig (legs .93 + ankle .075)

def sm(t): t = min(1, max(0, t)); return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t

def track(keys, t):
    if keys is None: return 0.
    if isinstance(keys, (int, float)): return float(keys)
    if isinstance(keys, dict):          # dense samples
        a = keys['dense']; T = [k[0] for k in a]; V = [k[1] for k in a]; return float(np.interp(t, T, V))
    if callable(keys): return keys(t)
    n = len(keys)
    if t <= keys[0][0]: return keys[0][1]
    if t >= keys[-1][0]: return keys[-1][1]
    i = 0
    while i < n - 2 and t > keys[i + 1][0]: i += 1
    t0, v0 = keys[i]; t1, v1 = keys[i + 1]; u = (t - t0) / ((t1 - t0) or 1)
    def m(j):
        if j <= 0 or j >= n - 1: return 0
        a, b, c = keys[j - 1], keys[j], keys[j + 1]
        d0 = (b[1] - a[1]) / ((b[0] - a[0]) or 1); d1 = (c[1] - b[1]) / ((c[0] - b[0]) or 1)
        if d0 * d1 <= 0: return 0
        return 2 / (1 / d0 + 1 / d1)
    h = t1 - t0; m0 = m(i) * h; m1 = m(i + 1) * h; u2 = u * u; u3 = u2 * u
    return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * m1

def foot_at(plants, t, pel):
    """Ball-of-foot target: planted (with heel peel before toe-off and heel strike on contact) or swinging between plants."""
    for p in plants:
        if p['t0'] <= t <= p['t1']:
            roll = p.get('roll', True) is not False
            heel = sm((t - (p['t1'] - .13)) / .13) * p.get('toe', 32) if roll else 0
            strike = (1 - sm((t - p['t0']) / .09)) * -16 if p.get('heel') else 0
            pitch = p['pitchFix'] if p.get('pitchFix') is not None else heel + strike
            return dict(x=p['x'], y=0., z=p['z'], yaw=p.get('yaw', 0), pitch=pitch, knee=p.get('knee', .12))
    for a, b in zip(plants, plants[1:]):
        if a['t1'] < t < b['t0']:
            s = (t - a['t1']) / (b['t0'] - a['t1'])
            if a.get('air'):
                pa, pb, pc = pel(a['t1']), pel(b['t0']), pel(t)
                A0 = [a['x'] - pa[0], 0 - pa[1], a['z'] - pa[2]]; B0 = [b['x'] - pb[0], 0 - pb[1], b['z'] - pb[2]]
                ks = [[0, *A0, a.get('toe', 32)]] + [list(k) for k in a['air']] + [[1, *B0, -10 if b.get('heel') else 0]]
                j = 0
                while j < len(ks) - 2 and s > ks[j + 1][0]: j += 1
                k0, k1 = ks[j], ks[j + 1]; u = sm((s - k0[0]) / ((k1[0] - k0[0]) or 1))
                return dict(x=pc[0] + lerp(k0[1], k1[1], u), y=max(0., pc[1] + lerp(k0[2], k1[2], u)), z=pc[2] + lerp(k0[3], k1[3], u),
                            yaw=lerp(a.get('yaw', 0), b.get('yaw', 0), u), pitch=lerp(k0[4], k1[4], u), knee=.15)
            u = sm(s); h = (a['h'] if a.get('h') is not None else .11) * math.sin(math.pi * min(1, s * 1.05))
            return dict(x=lerp(a['x'], b['x'], u), y=h, z=lerp(a['z'], b['z'], u), yaw=lerp(a.get('yaw', 0), b.get('yaw', 0), u),
                        pitch=lerp(a.get('toe', 32), -15 if b.get('heel') else 0, sm(s * 1.3)), knee=a.get('knee', .12))
    p = plants[0] if t < plants[0]['t0'] else plants[-1]
    return dict(x=p['x'], y=0., z=p['z'], yaw=p.get('yaw', 0), pitch=0., knee=p.get('knee', .12))

CH = ['yaw', 'lean', 'side', 'twist', 'crunch', 'arch', 'hp', 'hy', 'jaw', 'shrug']
ARM = ['f', 'a', 't', 'e', 'w', 'p', 'c']          # flex, habd, twist, elbow, wrist, pronation, curl
ARM_DEF = dict(f=0, a=0, t=0, e=0, w=0, p=75, c=22)

class Clip:
    def __init__(self, name, data, rig):
        self.name = name; self.d = data; self.rig = rig; self.dur = data['dur']
        self.dy = rig.stand - OLD_STAND

    def raw(self, t):
        C = self.d['ch']; g = lambda k, dv=0.: track(C[k], t) if k in C else dv
        dy = self.dy
        pel = lambda tt: (track(C['x'], tt), track(C['y'], tt) + dy, track(C['z'], tt) if 'z' in C else 0.)
        P = {k: g(k) for k in CH}
        P['pos'] = np.array(pel(t))
        P['side2'] = P['side']
        P['arm'] = {}
        for Sd, pre in (('L', 'l'), ('R', 'r')):
            P['arm'][Sd] = [g(pre + k, ARM_DEF[k]) for k in ARM]
        P['foot'] = {Sd: foot_at(self.d['feet'][Sd], t, pel) for Sd in ('L', 'R')}
        return P

    def reach(self, P, mg=0.):
        rig = self.rig; RM = (rig.L1 + rig.L2) * .985 - mg
        for _ in range(3):
            fixed = False
            for Sd in ('L', 'R'):
                f = P['foot'][Sd]; H = rig.hip_world(P, Sd); _, A = rig.foot_targets(f)
                dd = np.linalg.norm(A - H)
                if dd <= RM: continue
                fixed = True; hx, hz = A[0] - H[0], A[2] - H[2]; hd = math.hypot(hx, hz)
                if hd < RM * .97:
                    top = A[1] + math.sqrt(RM * RM - hd * hd); P['pos'][1] -= max(0, H[1] - top)
                else:
                    shf = (hd - RM * .96) / hd; P['pos'][0] += hx * shf; P['pos'][2] += hz * shf
                    top = A[1] + math.sqrt(RM * RM - (RM * .96) ** 2); P['pos'][1] -= max(0, H[1] - top)
            if not fixed: break
        return P

    def natural(self, P):
        """Stepping: hips and arms counter-rotate against the legs (only arms that are free, not mid-skill)."""
        yaw = P['yaw'] * D2R; c, s = math.cos(yaw), math.sin(yaw)
        fx = lambda f: f['x'] * c - f['z'] * s
        fL, fR = P['foot']['L'], P['foot']['R']
        if (fL['y'] < .05 or fR['y'] < .05) and P['pos'][1] < self.rig.stand + .07:
            k = max(-1, min(1, (fx(fR) - fx(fL)) / .6))
            P['yaw'] += k * 7; P['twist'] -= k * 9
            for Sd, sg in (('L', 1), ('R', -1)):
                a = P['arm'][Sd]; free = 1 - sm((abs(a[0] - 15) - 45) / 30)
                if free > 0: a[0] += sg * k * 24 * free; a[3] += abs(k) * 12 * free
        return P

    def bake(self, fps=30):
        """Sample at 120 Hz, keep feet reachable, smooth the pelvis and every angle, then solve the skeleton at fps."""
        dt = 1 / 120; n = int(math.ceil(self.dur / dt)); raw = []
        for i in range(n): raw.append(self.reach(self.raw(i * dt), .015))
        X = np.array([r['pos'] for r in raw])
        def blur(A, sig):
            r = int(math.ceil(sig * 3 / dt)); k = np.exp(-.5 * (np.arange(-r, r + 1) * dt / sig) ** 2); k /= k.sum()
            idx = (np.arange(n)[:, None] + np.arange(-r, r + 1)[None, :]) % n
            return (A[idx] * k[None, :, None]).sum(1) if A.ndim == 2 else (A[idx] * k[None, :]).sum(1)
        sig = self.d.get('smooth', {})
        def passes(X, mg):
            for i in range(n):
                P = dict(raw[i]); P['pos'] = X[i].copy(); self.reach(P, mg); X[i] = P['pos']
            return X
        X = blur(X, sig.get('pel', .035)); X = passes(X, .015); X = blur(X, .022); X = passes(X, .010); X = blur(X, .010); X = passes(X, .004)
        keys = CH
        A = np.array([[r[k] for k in keys] for r in raw]); A = blur(A, sig.get('trunk', .028))
        ARMS = np.array([[v for Sd in ('L', 'R') for v in r['arm'][Sd]] for r in raw]); ARMS = blur(ARMS, sig.get('arm', .018))
        self.samples = []
        out = []
        for fi in range(int(round(self.dur * fps))):
            t = fi / fps; u = t / dt; i0 = int(u) % n; i1 = (i0 + 1) % n; f = u - int(u)
            P = self.raw(t)
            P['pos'] = X[i0] + (X[i1] - X[i0]) * f
            for j, k in enumerate(keys): P[k] = A[i0, j] + (A[i1, j] - A[i0, j]) * f
            P['side2'] = P['side']
            av = ARMS[i0] + (ARMS[i1] - ARMS[i0]) * f
            P['arm'] = {'L': list(av[:7]), 'R': list(av[7:])}
            P = self.natural(P)
            R, Xb = self.rig.solve(P)
            out.append((to_local(self.rig, R), Xb[0].copy(), R, Xb))
            self.samples.append(P)
        return out

def load_clips(rig):
    base = json.load(open(os.path.join(HERE, 'clips_base.json')))
    import research
    data = research.apply(copy.deepcopy(base))
    return {k: Clip(k, v, rig) for k, v in data.items()}
