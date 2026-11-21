"""Research-based corrections to the technique clips.

Reference values (see README in tools/blender for sources):
- Spike (Fuchs et al. 2019, J Sports Sci 37:2411; elite men / women): approach 3.75 / 2.88 m/s, orientation step 1.52 / 1.18 m,
  plant step short, min dominant knee 90 / 96 deg (included), non-dominant 116 / 121, trunk incline at plant 38 / 33 deg,
  jump height 0.64 / 0.37 m, peak shoulder flexion velocity ~880-925 deg/s.
- Shoulder at contact: abduction ~122-130 deg, internal rotation ~80 deg, near-full elbow extension (JSSM 22:488; Reeser 2010).
- Air phase: knees flex then extend ("hang"); landings are often one foot first (35-67% of attacks).
- Block (Ficklin 2014; Neves 2011): ~1.1-1.2 s for a 3 m move, take-off 2.5-2.7 m/s vertical, 0.32-0.38 m jump,
  0.40-0.46 s in the air, hands ~35 cm over the net and ~15 cm above it; swing block arms low then forward-up.
- Jump serve (Coleman 1997; Tant): hand ~16 m/s, ball ~24 m/s, broad jump into the court, same arm action as the spike.
- Jump set (Tant; Cabarkapa): elbow included angle ~121 deg at the low point, ~140 at contact, ~150 at release; knees extend before elbows.
- Forearm pass (Ridgway & Hamilton): platform still, legs do the work, ball leaves at ~64 deg; contact on the forearms above the wrists.
- Float serve: toss 30-45 cm above the hand, high elbow, contact with the heel of the hand, short punch, no follow-through.
- Jump float: toss 0.9-1.2 m, 2-3 step approach, palm to the target.

Arm vector per side: f flex, a horizontal abduction, t humeral twist (+ internal), e elbow flex, w wrist (+ palm flexion),
p pronation (+ palm turns medially), c finger curl.  Overhead with the palm toward the net needs t + p ~ 180.
"""
import math, copy
g = 9.81

def fly_y(y0, v0, tTO):
    return lambda t: y0 + v0 * (t - tTO) - .5 * g * (t - tTO) ** 2

def dense(fn, t0, t1, dt=1 / 120):
    n = int(round((t1 - t0) / dt)); return {'dense': [[t0 + i * dt, fn(t0 + i * dt)] for i in range(n + 1)]}

def jump_y(pre, y0, v0, tTO, tLand, post, dur):
    """pre/post: keyframes around a ballistic flight (exact parabola between take-off and landing)."""
    fly = fly_y(y0, v0, tTO)
    def f(t):
        if t < tTO: return trk(pre + [[tTO, y0]], t)
        if t < tLand: return fly(t)
        return trk([[tLand, fly(tLand)]] + post, t)
    return dense(f, 0, dur)

def trk(keys, t):
    from choreo import track
    return track(keys, t)

def arms(ch, side, **kw):
    for k, v in kw.items(): ch[side + k] = v

def apply(C):
    spike(C); pipe(C); slide(C); block(C); jumpset(C); dig(C); serve(C); floatserve(C); jumpfloat(C); sprawl(C); ready(C)
    ready_arms(C)
    # walking phases: the pelvis travels over the middle of the feet (the original keys ran ahead of the steps)
    for name, t0, t1 in (('serve', 2.9, 5.0), ('jumpfloat', 2.6, 4.4), ('float', 2.2, 3.8), ('spike', 2.75, 4.6), ('pipe', 2.75, 4.6), ('slide', 2.4, 4.2), ('set', 2.5, 3.9)):
        walk_follow(C[name], t0, t1)
    return C

def ready_arms(C):
    """Neutral ready position for the arms (start, end and every return to it): arms in front of the body rather than
    flared to the sides, elbows bent about 80 degrees, hands at waist height about shoulder-width apart."""
    fix = {'a': ((14, 31), 8), 'e': ((55, 66), 72), 'f': ((30, 41), 32)}
    for c in C.values():
        ch = c['ch']
        for S in 'lr':
            for k, ((lo, hi), new) in fix.items():
                tr = ch.get(S + k)
                if tr is None: continue
                if not isinstance(tr, list):
                    if lo <= tr <= hi: ch[S + k] = new
                    continue
                v0 = tr[0][1]
                if lo <= v0 <= hi:
                    for key in tr:
                        if abs(key[1] - v0) < 1e-6: key[1] = new

def walk_follow(c, t0, t1, blend=.25):
    from choreo import foot_at, track
    import numpy as np
    ch = c['ch']; dur = c['dur']; zero = lambda tt: (0., 0., 0.)
    xs, zs = ch['x'], ch.get('z', 0.)
    def mid(t):
        L = foot_at(c['feet']['L'], t, zero); R = foot_at(c['feet']['R'], t, zero)
        yaw = math.radians(track(ch.get('yaw', 0), t)); back = .11
        return ((L['x'] + R['x']) / 2 - math.cos(yaw) * back, (L['z'] + R['z']) / 2 + math.sin(yaw) * back)
    T = np.arange(0, dur + 1e-9, 1 / 120)
    M = np.array([mid(t) for t in T])
    k = int(.18 * 120); ker = np.ones(2 * k + 1) / (2 * k + 1)
    Mx = np.convolve(np.pad(M[:, 0], k, mode='edge'), ker, 'valid'); Mz = np.convolve(np.pad(M[:, 1], k, mode='edge'), ker, 'valid')
    def w(t): return min(1, max(0, (t - t0) / blend)) * min(1, max(0, (t1 - t) / blend)) if t1 < dur - 1e-6 else min(1, max(0, (t - t0) / blend))
    X = [[float(t), float(track(xs, t) * (1 - w(t)) + Mx[i] * w(t))] for i, t in enumerate(T)]
    Z = [[float(t), float(track(zs, t) * (1 - w(t)) + Mz[i] * w(t))] for i, t in enumerate(T)]
    ch['x'] = {'dense': X}; ch['z'] = {'dense': Z}

# ---------------------------------------------------------------- spike
def spike(C):
    c = C['spike']; ch = c['ch']; tTO, dur = 1.6, 4.6
    v0 = 3.55; y0 = 1.02          # take-off with the legs fully extended and the ankles pushing (pelvis above standing height)
    air = v0 / g * 2 - .02; tLand = round(tTO + air, 3); c['tLand'] = tLand
    c['contact'] = 1.95
    # countermovement on the plant: dominant knee ~90 deg, trunk ~38 deg; explosive rise; controlled landing (~70 deg knees)
    ch['y'] = jump_y([[0, .93], [.35, .92], [.7, .9], [1.0, .86], [1.3, .80], [1.44, .71], [1.5, .74], [1.55, .86]], y0, v0, tTO, tLand,
                     [[tLand + .1, .77], [tLand + .2, .76], [tLand + .45, .88], [tLand + .7, .93], [3.6, .9], [4.0, .9], [4.6, .93]], dur)
    ch['lean'] = [[0, 20], [.4, 18], [1.0, 22], [1.3, 30], [1.44, 37], [1.52, 30], [tTO, 10], [1.72, -4], [1.84, -10], [1.95, -4], [2.05, 16], [2.2, 16],
                  [tLand, 20], [tLand + .12, 27], [tLand + .4, 14], [3.4, 12], [4.2, 18], [4.6, 20]]
    # cock: trunk rotates back and arches; swing: hips lead, trunk flexes and rotates through; tilt toward the non-hitting side at contact
    ch['twist'] = [[0, 0], [1.55, 0], [1.7, -18], [1.85, -40], [1.93, -12], [2.0, 20], [2.12, 30], [2.35, 6], [2.6, 0]]
    ch['arch'] = [[0, 0], [1.64, 0], [1.78, 18], [1.86, 24], [1.93, 6], [2.0, 0]]
    ch['crunch'] = [[0, 0], [1.92, 0], [2.0, 16], [2.1, 20], [2.25, 10], [tLand + .1, 8], [tLand + .3, 2], [2.9, 0]]
    ch['side'] = [[0, 0], [1.75, -2], [1.88, -6], [1.95, -14], [2.05, -8], [2.25, 0]]
    ch['hp'] = [[0, 6], [1.4, 2], [1.75, -30], [1.95, -26], [2.1, 4], [2.6, 0], [4.6, 6]]
    # hitting arm: full back-swing on the plant (~ -70 deg), drive up, bow and arrow (elbow high and back, shoulder externally rotated),
    # contact high in front with a near-straight elbow and the palm on the ball, follow-through across the body (internal rotation + pronation)
    arms(ch, 'r',
         f=[[0, 35], [.7, 45], [1.0, 20], [1.3, -48], [1.44, -60], [1.52, -38], [1.6, 50], [1.67, 112], [1.74, 148], [1.84, 152], [1.9, 162], [1.95, 168], [2.0, 150], [2.08, 95], [2.18, 40], [2.35, 20], [2.6, 25], [3.0, 30], [4.6, 35]],
         a=[[0, 25], [1.44, 8], [1.6, 10], [1.67, 30], [1.74, 62], [1.84, 72], [1.9, 40], [1.95, 12], [2.02, -12], [2.12, -38], [2.3, -5], [2.6, 15], [4.6, 25]],
         t=[[0, 0], [1.6, 0], [1.67, -35], [1.76, -75], [1.86, -88], [1.91, -40], [1.95, 65], [2.02, 95], [2.15, 70], [2.4, 10], [2.7, 0]],
         e=[[0, 62], [1.0, 30], [1.3, 10], [1.44, 6], [1.6, 40], [1.67, 95], [1.76, 115], [1.84, 125], [1.9, 70], [1.95, 6], [2.02, 14], [2.15, 40], [2.5, 50], [3.0, 55], [4.6, 62]],
         w=[[0, 0], [1.86, -35], [1.93, -20], [1.96, 25], [2.04, 50], [2.2, 15], [2.4, 0]],
         p=[[0, 75], [1.6, 70], [1.84, 60], [1.95, 100], [2.05, 140], [2.2, 110], [2.6, 75]],
         c=[[0, 22], [1.84, 10], [1.95, 4], [2.05, 20], [2.4, 22]])
    # non-hitting arm: drives up and points at the ball, then pulls down hard into the body just before contact
    arms(ch, 'l',
         f=[[0, 35], [.7, 22], [1.0, 40], [1.3, -48], [1.44, -60], [1.52, -34], [1.6, 85], [1.7, 145], [1.84, 150], [1.91, 118], [1.97, 55], [2.08, 10], [2.25, -5], [2.5, 25], [3.0, 30], [4.6, 35]],
         a=[[0, 25], [1.44, 6], [1.7, -8], [1.85, -6], [1.97, -30], [2.08, -35], [2.3, 10], [4.6, 25]],
         t=[[0, 0], [1.7, 40], [1.85, 60], [2.0, 10], [2.3, 0]],
         e=[[0, 62], [1.0, 30], [1.3, 12], [1.44, 6], [1.6, 15], [1.8, 10], [1.91, 40], [1.97, 95], [2.1, 105], [2.3, 60], [3.0, 55], [4.6, 62]],
         p=[[0, 75], [1.7, 100], [1.85, 120], [2.0, 90], [2.4, 75]], c=[[0, 22], [1.7, 12], [1.97, 45], [2.3, 22]])
    # legs in the air: fully extended off the floor, then the knees bend with the feet behind the body (hips extended, the
    # "bow" that pairs with the arched trunk), and reach forward again for the landing
    R, L = c['feet']['R'], c['feet']['L']
    R[2]['air'] = [[.10, -.02, -1.08, .08, 50], [.30, -.26, -.92, .10, 45], [.48, -.30, -.88, .09, 40], [.66, -.08, -.98, .08, 20], [.84, .06, -1.02, .1, 4]]
    L[2]['air'] = [[.10, .01, -1.08, -.06, 50], [.30, -.20, -.95, -.08, 42], [.48, -.22, -.92, -.1, 36], [.66, -.02, -1.0, -.12, 16], [.84, .08, -1.02, -.12, 2]]
    # one foot first: the left (non-hitting side) touches down a few hundredths before the right
    L[3]['t0'] = tLand; R[3]['t0'] = tLand + .05
    for p in (L[3], R[3]): p['heel'] = False; p['toe'] = 30
    c['smooth'] = {'arm': .012, 'trunk': .022}
    c['labels'] = [[0, "Ready: weight forward"], [.4, "Step 1 (right): direction"], [.68, "Step 2 (left): build speed"], [1.0, "Step 3 (right): long, fast, arms back"],
                   [1.42, "Step 4 (left): close and plant"], [1.55, "Take-off: arms drive up"], [1.72, "Bow and arrow: elbow high, non-hitting arm points at the ball"],
                   [1.9, "Contact: high, in front, arm almost straight"], [2.0, "Follow through across the body"], [tLand - .02, "Land on both feet, knees bent"],
                   [2.75, "Transition off the net"], [4.2, "Ready for the next ball"]]

def pipe(C):
    s = C['spike']; p = C['pipe']; base_x = p['ch']['x']
    p['ch'] = copy.deepcopy(s['ch']); p['ch']['x'] = base_x
    for k in ('tLand', 'contact', 'smooth'): p[k] = copy.deepcopy(s.get(k))
    for S in 'LR':
        for i, pl in enumerate(p['feet'][S]):
            sp = s['feet'][S][i]
            for k in ('air', 'heel', 'toe'):
                if k in sp: pl[k] = copy.deepcopy(sp[k])
            if i == 3: pl['t0'] = sp['t0']
    p['labels'] = [[l[0], l[1]] for l in s['labels']]
    for l in p['labels']:
        if l[1].startswith('Take-off'): l[1] = 'Take-off behind the 3 m line'
        if l[1].startswith('Land'): l[1] = 'Land past the line: that is legal'

# ---------------------------------------------------------------- slide (one-foot take-off off the left, drifting along the net)
def slide(C):
    c = C['slide']; ch = c['ch']
    arms(ch, 'r', t=[[0, 0], [1.4, -25], [1.56, -55], [1.62, -10], [1.68, 70], [1.78, 90], [2.0, 20], [2.3, 0]],
         p=[[0, 75], [1.5, 60], [1.68, 100], [1.8, 135], [2.2, 75]], w=[[0, 0], [1.56, -30], [1.66, 10], [1.72, 45], [2.0, 0]], c=[[0, 22], [1.5, 8], [1.7, 4], [1.85, 20]])
    arms(ch, 'l', p=[[0, 75], [1.5, 110], [1.8, 80]], c=[[0, 22], [1.5, 12], [1.75, 40], [2.1, 22]], t=[[0, 0], [1.5, 40], [1.8, 0]])
    ch['side'] = [[0, 0], [1.1, 8], [1.3, 14], [1.36, 10], [1.55, -6], [1.68, -12], [1.85, -4], [2.0, 0]]
    c['smooth'] = {'arm': .012}

# ---------------------------------------------------------------- block (middle: read, shuffle, load, press, land)
def block(C):
    c = C['block']; ch = c['ch']; tTO = 1.25; v0 = 2.85; y0 = .93; dur = 3.8
    air = 2 * v0 / g; tLand = round(tTO + air - .015, 3); c['tLand'] = tLand
    c['contact'] = round(tTO + v0 / g + .01, 3)
    ch['y'] = jump_y([[0, .88], [.5, .88], [.8, .86], [1.02, .80], [1.12, .71], [1.18, .74]], y0, v0, tTO, tLand,
                     [[tLand + .12, .76], [tLand + .4, .88], [3.8, .88]], dur)
    ch['lean'] = [[0, 8], [1.1, 14], [tTO, 2], [1.4, -2], [c['contact'], 4], [1.7, 8], [tLand + .1, 14], [2.4, 8], [3.8, 8]]
    ch['crunch'] = [[0, 0], [1.4, 0], [c['contact'], 10], [1.75, 2], [2.0, 0]]
    ch['shrug'] = [[0, 0], [1.25, 0], [1.4, 10], [c['contact'], 14], [1.72, 6], [1.9, 0]]
    # hands go up early and forward over the net (~35 cm penetration): shoulders flexed ~150-158, elbows straight, palms to the net
    for S in 'lr':
        # ready at the net: hands in front of the face, elbows bent, palms to the net (pronation, not humeral twist, so the hands don't cross)
        arms(ch, S, f=[[0, 88], [.8, 88], [1.02, 80], [1.14, 74], [1.3, 135], [1.42, 152], [c['contact'], 156], [1.68, 150], [1.82, 128], [tLand + .1, 95], [2.4, 88], [3.8, 88]],
             a=[[0, 32], [1.0, 32], [1.3, 14], [1.45, 6], [c['contact'], 4], [1.8, 14], [2.4, 32], [3.8, 32]],
             t=[[0, 5], [1.0, 5], [1.3, 40], [1.42, 70], [1.62, 60], [1.82, 10], [3.8, 5]],
             e=[[0, 82], [1.0, 80], [1.14, 86], [1.3, 40], [1.45, 6], [c['contact'], 4], [1.75, 26], [tLand + .1, 70], [2.4, 82], [3.8, 82]],
             w=[[0, -25], [1.0, -25], [1.4, 10], [c['contact'], -18], [1.75, 0], [2.4, -25], [3.8, -25]],
             p=[[0, 150], [1.0, 150], [1.3, 125], [1.45, 110], [1.8, 110], [2.3, 150], [3.8, 150]], c=[[0, 15], [1.3, 2], [1.75, 2], [2.2, 15]])
    for S in 'LR':
        for pl in c['feet'][S]:
            if pl['t0'] >= 1.9 and pl['t0'] < 2.0: pl['t0'] = tLand + (.01 if S == 'L' else 0)
    c['labels'] = [[0, "Ready: hands up at the net"], [.5, "Read the setter"], [.7, "Shuffle step"], [1.02, "Close and load"], [tTO, "Jump straight up"],
                   [1.36, "Press over the net, shoulders shrug up"], [c['contact'] - .02, "Seal: thumbs up, fingers spread, wrists firm"], [1.72, "Pull hands back"],
                   [tLand - .02, "Land on two feet"], [2.6, "Shuffle back to base"]]

# ---------------------------------------------------------------- jump set
def jumpset(C):
    c = C['set']; ch = c['ch']; tTO = 1.36; v0 = 2.35; y0 = .93; dur = 3.9
    tLand = round(tTO + 2 * v0 / g - .01, 3); c['tLand'] = tLand; c['contact'] = round(tTO + v0 / g + .02, 3); tc = c['contact']
    ch['y'] = jump_y([[0, .9], [.3, .9], [.7, .92], [1.05, .88], [1.2, .77], [1.28, .80]], y0, v0, tTO, tLand, [[tLand + .12, .80], [tLand + .38, .92], [3.9, .9]], dur)
    # hands high early, window above the forehead; knees extend before the elbows; elbow ~121 -> 140 -> 150 deg included
    for S in 'lr':
        arms(ch, S, f=[[0, 40], [.6, 35], [1.0, 105], [1.2, 128], [tTO, 136], [tc - .06, 140], [tc, 146], [tc + .1, 160], [tc + .2, 165], [2.2, 60], [3.9, 40]],
             a=[[0, 25], [1.0, 38], [tc, 40], [tc + .15, 25], [2.2, 25], [3.9, 25]],
             t=[[0, 0], [.8, 30], [1.1, 75], [tc + .2, 70], [2.3, 0]],
             e=[[0, 62], [.6, 70], [1.0, 100], [1.2, 70], [tc - .06, 59], [tc, 40], [tc + .07, 30], [tc + .18, 12], [2.2, 50], [3.9, 62]],
             w=[[0, 0], [1.0, -45], [tc - .05, -60], [tc + .05, -25], [tc + .15, 15], [2.2, 0]],
             p=[[0, 75], [.8, 95], [1.1, 110], [tc + .2, 105], [2.3, 75]], c=[[0, 22], [1.0, 30], [tc, 34], [tc + .15, 18], [2.3, 22]])
    for S in 'LR':
        for pl in c['feet'][S]:
            if 1.85 < pl['t0'] < 2.0: pl['t0'] = tLand + (.02 if S == 'L' else 0)

# ---------------------------------------------------------------- dig (libero, forearm platform)
def dig(C):
    c = C['dig']; ch = c['ch']; tc = c['contact']
    for S in 'lr':
        # platform: arms straight and together, forearms flat (supinated), thumbs parallel, hands clasped
        arms(ch, S, f=[[0, 38], [.82, 42], [1.05, 58], [1.2, 64], [tc, 62], [1.5, 66], [1.9, 40], [3.4, 38]],
             a=[[0, 25], [1.0, -10], [1.1, -24], [1.5, -24], [1.9, 20], [3.4, 25]],
             t=[[0, 0], [1.0, -5], [1.6, -5], [1.9, 0]],
             e=[[0, 60], [1.0, 12], [1.1, 2], [1.5, 2], [1.9, 55], [3.4, 60]],
             w=[[0, 0], [1.05, 20], [1.5, 20], [1.9, 0]],
             p=[[0, 75], [.95, 30], [1.08, 2], [1.55, 2], [1.9, 75]], c=[[0, 22], [1.0, 40], [1.08, 55], [1.55, 55], [1.9, 22]])
    # legs do the work: low and wide, small lift through contact; trunk leans so the platform angles to the setter (~64 deg pass)
    ch['y'] = [[0, .82], [.6, .82], [.72, .9], [.82, .76], [1.12, .66], [tc, .64], [1.45, .70], [1.8, .80], [3.4, .82]]
    ch['hp'] = [[0, -12], [tc, -2], [1.6, -18], [2.0, -10], [3.4, -12]]

# ---------------------------------------------------------------- jump serve
def serve(C):
    c = C['serve']; ch = c['ch']; tTO = 1.62; v0 = 3.25; y0 = .92; dur = 5.0
    tLand = round(tTO + 2 * v0 / g - .02, 3); c['tLand'] = tLand; c['contact'] = round(tTO + v0 / g + .03, 3); tc = c['contact']
    ch['y'] = jump_y([[0, .93], [.5, .93], [.9, .9], [1.25, .86], [1.48, .74], [1.55, .78]], y0, v0, tTO, tLand,
                     [[tLand + .12, .77], [tLand + .4, .9], [3.2, .93], [5.0, .93]], dur)
    sh = tc - 2.0
    def shift(keys, after=1.6): return [[k[0] + (sh if k[0] >= after else 0), k[1]] for k in keys]
    arms(ch, 'r',
         f=[[0, 60], [.3, 95], [.5, 172], [.62, 160], [1.0, 40], [1.3, -50], [1.5, -65], [1.62, 70], [1.72, 128], [1.84, 120], [tc - .06, 118], [tc, 164], [tc + .06, 140], [tc + .15, 70], [tc + .3, 25], [2.6 + sh, 22], [3.0, 30], [4.6, 40], [5.0, 60]],
         a=[[0, 30], [.5, 10], [1.0, 20], [1.5, 8], [1.74, 55], [1.84, 95], [tc - .06, 90], [tc, 15], [tc + .1, -25], [tc + .3, 0], [5.0, 30]],
         t=[[0, 0], [.4, 90], [.6, 60], [1.0, 0], [1.74, -30], [tc - .06, -60], [tc, 70], [tc + .1, 95], [tc + .3, 20], [3.0, 0]],
         e=[[0, 80], [.3, 40], [.5, 8], [1.0, 30], [1.3, 12], [1.5, 10], [1.62, 40], [1.74, 85], [tc - .06, 118], [tc, 6], [tc + .1, 18], [tc + .3, 40], [3.0, 55], [5.0, 80]],
         w=[[0, 30], [.45, 40], [.55, -10], [1.0, 0], [tc - .05, -30], [tc, 25], [tc + .1, 50], [tc + .3, 0], [5.0, 30]],
         p=[[0, 75], [.3, 80], [.5, 90], [1.0, 75], [tc - .06, 60], [tc, 100], [tc + .1, 140], [tc + .35, 75]], c=[[0, 30], [.5, 10], [1.0, 22], [tc, 4], [tc + .15, 20]])
    arms(ch, 'l',
         f=[[0, 45], [.5, 60], [1.0, 30], [1.3, -50], [1.5, -60], [1.62, 100], [1.74, 165], [tc - .1, 160], [tc - .03, 110], [tc + .05, 40], [tc + .25, -5], [2.6 + sh, 25], [3.0, 30], [5.0, 45]],
         e=[[0, 50], [1.0, 30], [1.3, 12], [1.5, 10], [1.62, 20], [tc - .1, 12], [tc - .03, 50], [tc + .08, 95], [tc + .3, 60], [3.0, 55], [5.0, 50]],
         p=[[0, 75], [1.7, 110], [tc, 90], [2.6, 75]], c=[[0, 22], [1.7, 12], [tc, 45], [2.6, 22]])
    for k in ('twist', 'arch', 'crunch'): ch[k] = shift(ch[k])
    ch['side'] = [[0, 0], [tc - .1, -6], [tc, -14], [tc + .1, -6], [tc + .3, 0]]
    for S in 'LR':
        for pl in c['feet'][S]:
            if abs(pl['t0'] - 2.42) < .05: pl['t0'] = tLand + (.02 if S == 'L' else .05)

# ---------------------------------------------------------------- standing float serve
def floatserve(C):
    c = C['float']; ch = c['ch']; tc = c['contact']
    # low toss (~40 cm above the tossing hand), high elbow with the hand by the ear, short firm punch with the heel of the hand
    arms(ch, 'r', f=[[0, 62], [.5, 62], [.8, 100], [1.05, 120], [1.25, 125], [tc, 158], [tc + .1, 152], [tc + .22, 140], [2.1, 40], [3.8, 62]],
         a=[[0, 15], [.8, 70], [1.05, 100], [1.25, 95], [tc, 25], [tc + .2, 25], [2.1, 20], [3.8, 15]],
         t=[[0, 0], [.8, 0], [1.05, -40], [1.25, -45], [tc - .02, 60], [tc + .25, 70], [2.1, 10], [3.8, 0]],
         e=[[0, 70], [.5, 60], [.8, 100], [1.05, 125], [1.25, 115], [tc, 8], [tc + .2, 8], [2.1, 40], [3.8, 70]],
         w=[[0, 0], [1.3, -15], [tc, -12], [tc + .3, -12], [2.0, 0]],
         p=[[0, 75], [1.05, 60], [tc, 115], [tc + .3, 115], [2.2, 75]], c=[[0, 22], [1.1, 10], [tc, 6], [tc + .3, 8], [2.2, 22]])
    arms(ch, 'l', p=[[0, 0], [.8, 0], [1.1, 60], [2.0, 75]], c=[[0, 30], [.75, 30], [.85, 10], [1.4, 30], [2.0, 22]])

# ---------------------------------------------------------------- jump float
def jumpfloat(C):
    c = C['jumpfloat']; ch = c['ch']; tc = c['contact']
    arms(ch, 'r', t=[[0, 0], [tTO_ := 1.6, -30], [1.72, -45], [tc, 65], [tc + .25, 70], [2.4, 0]],
         p=[[0, 75], [1.7, 60], [tc, 115], [tc + .3, 115], [2.5, 75]], w=[[0, 0], [1.8, -15], [tc + .3, -12], [2.4, 0]], c=[[0, 22], [1.7, 8], [tc, 5], [tc + .3, 8], [2.5, 22]])
    arms(ch, 'l', p=[[0, 0], [.7, 0], [1.0, 60], [2.0, 75]], c=[[0, 30], [.6, 30], [.75, 10], [1.4, 30], [2.0, 22]])

# ---------------------------------------------------------------- sprawl / pancake
def sprawl(C):
    c = C['sprawl']; ch = c['ch']; tc = c['contact']
    # pancake: hitting-side hand flat on the floor, palm down, under the ball
    arms(ch, 'r', t=[[0, 0], [1.1, 40], [tc, 90], [1.8, 90], [2.2, 0]], p=[[0, 75], [1.1, 85], [tc, 95], [1.8, 95], [2.3, 75]], c=[[0, 22], [1.2, 2], [1.8, 2], [2.2, 22]])
    arms(ch, 'l', t=[[0, 0], [1.2, 50], [2.0, 50], [2.4, 0]], p=[[0, 75], [1.2, 90], [2.0, 90], [2.4, 75]], c=[[0, 22], [1.3, 10], [2.2, 22]])

def ready(C):
    c = C['ready']; ch = c['ch']
    for S in 'lr': arms(ch, S, p=[[0, 70]], c=[[0, 25]])
