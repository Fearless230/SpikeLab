"""More technique clips, derived from the research-corrected base clips (research.py runs first).

Attack variations (same approach and jump physics as the spike, different footwork, timing and hand):
  quick     middle's quick (1 / 31): two-step approach, take-off before the set, compact arm swing
  shoot     fast outside set (go / shoot): three-step approach, faster run-in
  tip       off-speed tip: full disguise, then stiff fingertips at full reach and no follow-through
  roll      roll shot: slower swing, contact under the ball, wrist rolls over for topspin
  cut       cut shot: contact on the outside of the ball, arm and wrist cut across the body
  dump      setter dump: jump-set disguise, near (right) hand drops, far (left) hand pushes the ball over
Defence:
  collapse  collapse dig: step under a low ball and sit down through it with the platform up
  sidedive  lateral extension: lunge wide, lay out on the side, one-hand pancake, roll up
  tomahawk  overhead dig: hands joined above the forehead for a ball at the face or over the shoulder

Times are in seconds, angles in degrees; see research.py for the arm-channel conventions.
Sources for the coaching points: USA Volleyball and Volleyball Canada coaching material, FIVB coaches manual."""
import copy

# ---------------------------------------------------------------- helpers
def _mapper(pts):
    """Piecewise-linear time map from (old, new) breakpoints; slope 1 after the last point."""
    pts = sorted(pts)
    def m(t):
        if t <= pts[0][0]: return pts[0][1] + (t - pts[0][0])
        for (o0, n0), (o1, n1) in zip(pts, pts[1:]):
            if t <= o1: return n0 + (t - o0) * (n1 - n0) / (o1 - o0)
        return pts[-1][1] + (t - pts[-1][0])
    return m

def _map_track(v, m):
    if isinstance(v, (int, float)) or v is None: return v
    if isinstance(v, dict): return {'dense': [[m(t), y] for t, y in v['dense']]}
    return [[m(k[0]), k[1]] for k in v]

def retime(c, pts):
    m = _mapper(pts)
    ch = c['ch']
    for k in list(ch): ch[k] = _map_track(ch[k], m)
    for S in 'LR':
        for p in c['feet'][S]: p['t0'] = m(p['t0']); p['t1'] = m(p['t1'])
    for k in ('contact', 'tTO', 'tLand'):
        if c.get(k) is not None: c[k] = round(m(c[k]), 3)
    c['labels'] = [[round(m(t), 3), s] for t, s in c.get('labels', [])]
    c['dur'] = round(m(c['dur']), 3)
    return m

def sample(v, t):
    from choreo import track
    return track(v, t)

def splice(keys, t0, new):
    """Keep the keys before t0 and continue with new ones."""
    if keys is None or isinstance(keys, (int, float)): keys = [[0, keys or 0]]
    if isinstance(keys, dict): keys = keys['dense'][::4]
    return [k for k in keys if k[0] < t0] + new

def scale_after(keys, t0, k, about=0.):
    if not isinstance(keys, list): return keys
    return [[t, about + (v - about) * k] if t >= t0 else [t, v] for t, v in keys]

def arms(ch, side, t0, **kw):
    for k, v in kw.items(): ch[side + k] = splice(ch.get(side + k), t0, v)

def pull_back(c, dx, t_from):
    """The walk back after landing ends where the clip starts (the start stance moved forward by dx)."""
    f = lambda x: x + dx * min(1., max(0., (-1.2 - x) / 2.4))
    for S in 'LR':
        for p in c['feet'][S]:
            if p['t0'] > t_from: p['x'] = f(p['x'])
    ch = c['ch']
    ch['x'] = [[t, f(v) if t > t_from else v] for t, v in ch['x']]
    ch['x'] = [[t, v] for t, v in ch['x']]

def derive(C, src, name):
    c = copy.deepcopy(C[src]); C[name] = c; return c

# ---------------------------------------------------------------- quick (middle: 1 / 31)
def quick(C):
    c = derive(C, 'spike', 'quick'); ch = c['ch']; F = c['feet']
    # two-step approach (right, left): drop the first two steps, start off the net at about 2.4 m
    del F['R'][1]; del F['L'][1]
    for p in (F['R'][0], F['L'][0]): p['x'] += 1.15
    retime(c, [(0, 0), (.35, .35), (1.28, .80)]); ch = c['ch']
    F['R'][0]['t1'] = .40; F['L'][0]['t1'] = .84
    x_old = ch['x']; dur = c['dur']
    ch['x'] = [[0, -2.42], [.35, -2.42], [.6, -2.02]] + [[t / 60, sample(x_old, t / 60)] for t in range(48, int(dur * 60) + 1)]
    pull_back(c, 1.15, c['tLand'] + .5)
    # short arm swing: arms go back a little and come up early so the hitter is ready when the set arrives
    for S in 'rl':
        ch[S + 'f'] = [[t, v * .4 if (v < 0 and .6 < t < 1.2) else v] for t, v in ch[S + 'f']]
    ch['lean'] = [[t, min(v, 28) if t < 1.2 else v] for t, v in ch['lean']]
    tc = c['contact']; tl = c['tLand']
    c['labels'] = [[0, "Start off the net, about 3 m from the setter"], [.36, "Step 1 (right) as the pass reaches the setter"],
                   [.78, "Step 2 (left): plant in front of the setter"], [round(c['tTO'] - .03, 3), "Take off before the set"],
                   [round(c['tTO'] + .14, 3), "Arm already up: short, fast swing"], [round(tc - .04, 3), "Contact at the top: snap the wrist"],
                   [round(tc + .08, 3), "Hit through the seam or cut it"], [round(tl - .02, 3), "Land on both feet"], [round(tl + .4, 3), "Back off the net, block again"]]

# ---------------------------------------------------------------- shoot / go (fast set to the left pin)
def shoot(C):
    c = derive(C, 'spike', 'shoot'); ch = c['ch']; F = c['feet']
    # three-step approach (left, right, left): drop the first right step
    del F['R'][1]
    for p in (F['R'][0], F['L'][0]): p['x'] += .55
    retime(c, [(0, 0), (.35, .30), (.97, .70), (1.28, .98)]); ch = c['ch']
    F['L'][0]['t1'] = .42; F['R'][0]['t1'] = .72
    x_old = ch['x']; dur = c['dur']
    ch['x'] = [[0, -3.17], [.3, -3.17], [.5, -2.95]] + [[t / 60, sample(x_old, t / 60)] for t in range(42, int(dur * 60) + 1)]
    pull_back(c, .55, c['tLand'] + .5)
    tc = c['contact']; tl = c['tLand']
    c['labels'] = [[0, "Start wide, outside the antenna line"], [.32, "Step 1 (left): go as the setter touches the ball"],
                   [.7, "Step 2 (right): long and fast"], [.94, "Step 3 (left): plant, hips open to the setter"],
                   [round(c['tTO'] - .02, 3), "Take off: the set is already on its way"], [round(tc - .2, 3), "Bow and arrow, quick"],
                   [round(tc - .03, 3), "Contact in front: hit before the block closes"], [round(tl - .02, 3), "Land on both feet"], [round(tl + .4, 3), "Cover and transition"]]

# ---------------------------------------------------------------- tip
def tip(C):
    c = derive(C, 'spike', 'tip'); ch = c['ch']; tl = c['tLand']
    arms(ch, 'r', 1.85,
         f=[[1.9, 160], [1.95, 174], [2.03, 170], [2.14, 150], [2.32, 90], [2.55, 35], [3.0, 30], [4.6, 35]],
         a=[[1.9, 34], [1.95, 10], [2.05, 4], [2.25, 10], [2.6, 15], [4.6, 25]],
         t=[[1.9, -45], [1.96, 15], [2.1, 22], [2.4, 6], [2.7, 0]],
         e=[[1.9, 66], [1.95, 12], [2.0, 6], [2.12, 14], [2.32, 40], [3.0, 55], [4.6, 62]],
         w=[[1.92, -12], [1.97, -8], [2.03, 18], [2.15, 10], [2.4, 0]],
         p=[[1.91, 82], [1.97, 95], [2.12, 95], [2.6, 75]],
         c=[[1.9, 4], [1.97, 8], [2.1, 20], [2.4, 22]])
    ch['crunch'] = [[0, 0], [1.92, 0], [2.02, 6], [2.15, 8], [2.3, 4], [tl + .1, 8], [tl + .3, 2], [2.9, 0]]
    ch['twist'] = splice(ch['twist'], 1.87, [[1.94, -18], [2.02, -4], [2.15, 4], [2.4, 2], [2.6, 0]])
    ch['arch'] = splice(ch['arch'], 1.87, [[1.94, 12], [2.02, 5], [2.12, 0]])
    ch['side'] = scale_after(ch['side'], 1.86, .5)
    c['smooth'] = {'arm': .014, 'trunk': .022}
    tc = c['contact']
    c['labels'] = [[0, "Ready: same approach as a full swing"], [.4, "Step 1 (right): direction"], [.68, "Step 2 (left): build speed"],
                   [1.0, "Step 3 (right): long, fast, arms back"], [1.42, "Step 4 (left): close and plant"], [1.55, "Take-off: sell the swing"],
                   [1.72, "Bow and arrow: the block must jump"], [1.88, "Late decision: slow only the hand"],
                   [tc - .02, "Contact: stiff fingertips at full reach"], [2.02, "Push over the block, no follow-through"],
                   [tl - .02, "Land on both feet"], [2.75, "Cover: tips are often dug"], [4.2, "Ready for the next ball"]]

# ---------------------------------------------------------------- roll shot
def roll(C):
    c = derive(C, 'spike', 'roll'); ch = c['ch']; tl = c['tLand']
    arms(ch, 'r', 1.85,
         f=[[1.9, 146], [1.96, 156], [2.02, 158], [2.12, 138], [2.28, 80], [2.5, 30], [3.0, 30], [4.6, 35]],
         a=[[1.9, 44], [1.96, 16], [2.04, 0], [2.16, -10], [2.36, 5], [2.6, 15], [4.6, 25]],
         t=[[1.9, -55], [1.96, -8], [2.04, 32], [2.16, 40], [2.42, 10], [2.7, 0]],
         e=[[1.9, 92], [1.96, 32], [2.02, 14], [2.12, 20], [2.32, 40], [3.0, 55], [4.6, 62]],
         w=[[1.9, -45], [1.97, -40], [2.02, -8], [2.08, 42], [2.18, 62], [2.32, 20], [2.5, 0]],
         p=[[1.9, 70], [1.98, 90], [2.12, 110], [2.6, 75]],
         c=[[1.9, 10], [1.98, 14], [2.08, 40], [2.32, 22]])
    ch['crunch'] = [[0, 0], [1.93, 0], [2.02, 10], [2.14, 14], [2.3, 6], [tl + .1, 8], [tl + .3, 2], [2.9, 0]]
    ch['twist'] = scale_after(ch['twist'], 1.93, .6)
    c['smooth'] = {'arm': .014, 'trunk': .022}
    tc = c['contact']
    c['labels'] = [[0, "Ready: same approach as a full swing"], [.68, "Build speed"], [1.42, "Close and plant"], [1.55, "Take-off: sell the swing"],
                   [1.72, "Bow and arrow"], [1.88, "Swing at half speed"], [tc - .02, "Contact under the ball, open hand"],
                   [2.05, "Roll the wrist up and over: topspin"], [tl - .02, "Land on both feet"], [2.75, "Cover and transition"], [4.2, "Ready for the next ball"]]

# ---------------------------------------------------------------- cut shot
def cut(C):
    c = derive(C, 'spike', 'cut'); ch = c['ch']
    arms(ch, 'r', 1.86,
         a=[[1.9, 46], [1.95, 26], [2.0, -22], [2.08, -55], [2.2, -45], [2.4, -5], [2.6, 15], [4.6, 25]],
         p=[[1.92, 88], [1.97, 150], [2.05, 166], [2.2, 120], [2.6, 75]],
         w=[[1.92, -16], [1.97, 30], [2.04, 56], [2.2, 15], [2.4, 0]])
    ch['twist'] = scale_after(ch['twist'], 1.93, .55)
    ch['side'] = splice(ch['side'], 1.88, [[1.95, -18], [2.05, -12], [2.25, 0]])
    tc = c['contact']; tl = c['tLand']
    c['labels'] = [[0, "Ready: weight forward"], [.4, "Step 1 (right): direction"], [1.0, "Step 3: drift the approach outside the ball"],
                   [1.42, "Close and plant"], [1.55, "Take-off"], [1.72, "Bow and arrow: show line"], [tc - .03, "Contact on the outside of the ball"],
                   [2.0, "Pronate hard: the hand cuts across"], [2.1, "Ball drops short, inside the block"], [tl - .02, "Land on both feet"], [2.75, "Transition"], [4.2, "Ready"]]

# ---------------------------------------------------------------- setter dump
def dump(C):
    c = derive(C, 'set', 'dump'); ch = c['ch']; tc = c['contact']
    # near hand (right, toward the net) drops away just before contact; far hand (left) pushes the ball over the net
    arms(ch, 'r', tc - .12,
         f=[[tc - .06, 120], [tc, 60], [tc + .15, 25], [2.3, 40], [3.9, 40]],
         a=[[tc - .06, 30], [tc + .1, 20], [3.9, 25]],
         t=[[tc, 20], [tc + .2, 0]],
         e=[[tc - .06, 80], [tc, 90], [tc + .15, 70], [2.4, 62], [3.9, 62]],
         w=[[tc, 0], [3.9, 0]], p=[[tc, 75], [3.9, 75]], c=[[tc, 25], [3.9, 22]])
    arms(ch, 'l', tc - .08,
         f=[[tc - .03, 150], [tc, 160], [tc + .07, 150], [tc + .2, 110], [2.3, 50], [3.9, 40]],
         a=[[tc - .03, 20], [tc, -10], [tc + .08, -40], [tc + .25, -10], [2.3, 25], [3.9, 25]],
         e=[[tc - .03, 45], [tc, 18], [tc + .06, 10], [tc + .2, 30], [2.3, 50], [3.9, 62]],
         w=[[tc - .03, -45], [tc + .02, -10], [tc + .08, 40], [tc + .2, 10], [2.3, 0]],
         c=[[tc, 18], [tc + .08, 10], [tc + .3, 22]])
    ch['side'] = [[0, 0], [tc - .1, 0], [tc, 8], [tc + .12, 10], [tc + .35, 0]]
    ch['twist'] = [[0, 0], [tc - .1, 0], [tc + .02, 14], [tc + .15, 18], [tc + .4, 0]]
    c['labels'] = [[0, "Base: read the pass"], [.35, "Release to target"], [.95, "Square to the left pin, as for a set"],
                   [1.2, "Hands up early: the dump must look like a set"], [1.36, "Jump set"], [tc - .06, "Ball above the forehead"],
                   [tc, "Near hand drops, far hand pushes"], [tc + .08, "Ball down over the net, behind the block"], [1.95, "Land balanced"], [2.7, "Cover"]]

# ---------------------------------------------------------------- collapse dig
def collapse(C):
    c = derive(C, 'dig', 'collapse'); ch = c['ch']; tc = 1.36; c['contact'] = tc
    ch['x'] = [[0, -6.2], [.82, -6.2], [1.12, -5.98], [tc, -5.92], [2.2, -5.95], [2.8, -6.15], [3.4, -6.2]]
    ch['z'] = 0
    ch['y'] = [[0, .82], [.6, .82], [.72, .9], [.82, .76], [1.02, .6], [1.18, .44], [tc, .31], [1.55, .26], [1.9, .3], [2.25, .55], [2.6, .78], [3.4, .82]]
    ch['lean'] = [[0, 30], [.82, 32], [1.1, 30], [tc, 14], [1.6, -8], [1.9, 0], [2.3, 30], [3.4, 30]]
    ch['yaw'] = 0; ch['side'] = 0
    ch['hp'] = [[0, -12], [tc, -20], [1.7, -24], [2.2, -10], [3.4, -12]]
    F = c['feet']
    F['L'] = [dict(t0=0, t1=.72, x=-6.25, z=-.3, yaw=-6, roll=False), dict(t0=.8, t1=1.0, x=-6.25, z=-.34, yaw=-6, h=.04, roll=False),
              dict(t0=1.1, t1=2.3, x=-5.62, z=-.36, yaw=-18, roll=False, knee=.3), dict(t0=2.75, t1=3.4, x=-6.25, z=-.3, yaw=-6, roll=False)]
    F['R'] = [dict(t0=0, t1=.72, x=-6.15, z=.3, yaw=6, roll=False), dict(t0=.8, t1=.9, x=-6.15, z=.34, yaw=6, h=.04, roll=False),
              dict(t0=1.0, t1=2.35, x=-5.75, z=.42, yaw=22, roll=False, knee=.3), dict(t0=2.85, t1=3.4, x=-6.15, z=.3, yaw=6, roll=False)]
    for S in 'lr':
        arms(ch, S, 0,
             f=[[0, 38], [.82, 42], [1.05, 52], [1.2, 56], [tc, 52], [1.55, 58], [1.9, 40], [3.4, 38]],
             a=[[0, 25], [1.0, -10], [1.1, -24], [1.6, -24], [1.95, 20], [3.4, 25]],
             t=[[0, 0], [1.0, -5], [1.6, -5], [1.95, 0]],
             e=[[0, 60], [1.0, 12], [1.1, 2], [1.6, 2], [1.95, 55], [3.4, 60]],
             w=[[0, 0], [1.05, 20], [1.6, 20], [1.95, 0]],
             p=[[0, 75], [.95, 30], [1.08, 2], [1.6, 2], [1.95, 75]], c=[[0, 22], [1.0, 40], [1.08, 55], [1.6, 55], [1.95, 22]])
    c['labels'] = [[0, "Low ready, weight on the toes"], [.7, "Split step"], [.9, "Ball is short and low: step in"],
                   [1.1, "Drop the hips, platform out early"], [tc - .02, "Contact low: sit down through the ball"],
                   [1.6, "Seat touches down, platform angled up"], [2.0, "Rock forward onto the feet"], [2.6, "Back to base"]]

# ---------------------------------------------------------------- lateral extension (side dive)
def sidedive(C):
    c = derive(C, 'sprawl', 'sidedive'); ch = c['ch']; tc = 1.38; c['contact'] = tc
    ch['x'] = [[0, -5.6], [1.0, -5.6], [2.6, -5.55], [4.0, -5.6]]
    ch['z'] = [[0, 0], [.85, 0], [1.05, .45], [1.22, .95], [tc, 1.3], [1.7, 1.45], [2.3, 1.4], [3.0, .8], [3.6, .1], [4.0, 0]]
    ch['y'] = [[0, .78], [.65, .78], [.72, .86], [.85, .72], [1.05, .58], [1.22, .42], [tc, .33], [1.6, .28], [2.0, .29], [2.35, .44], [2.7, .74], [3.0, .8], [4.0, .78]]
    ch['lean'] = [[0, 32], [.85, 34], [1.1, 30], [tc, 22], [1.8, 18], [2.3, 30], [2.7, 26], [4.0, 32]]
    ch['side'] = [[0, 0], [.95, 4], [1.12, 22], [tc, 50], [1.65, 60], [2.0, 58], [2.35, 28], [2.7, 4], [3.0, 0]]
    ch['yaw'] = [[0, 0], [.9, 0], [1.2, -8], [2.2, -8], [3.0, 0]]
    ch['hp'] = [[0, -14], [tc, -10], [1.8, -16], [2.5, -10], [4.0, -14]]
    ch['twist'] = 0; ch['crunch'] = 0; ch['arch'] = 0
    F = c['feet']
    F['L'] = [dict(t0=0, t1=.7, x=-5.6, z=-.3, yaw=-6, roll=False), dict(t0=.78, t1=.86, x=-5.6, z=-.32, yaw=-6, h=.04, roll=False),
              dict(t0=.98, t1=1.22, x=-5.62, z=.25, yaw=10, toe=40,
                   air=[[.15, -.05, -.62, -.62, 20], [.5, -.05, -.22, -.95, 10], [.85, -.05, -.24, -.95, 5]]),
              dict(t0=2.45, t1=2.85, x=-5.6, z=.9, yaw=-4), dict(t0=3.25, t1=3.45, x=-5.6, z=.3, yaw=-6, h=.06), dict(t0=3.7, t1=4.0, x=-5.6, z=-.3, yaw=-6, roll=False)]
    F['R'] = [dict(t0=0, t1=.7, x=-5.6, z=.3, yaw=6, roll=False), dict(t0=.8, t1=.92, x=-5.6, z=.34, yaw=6, h=.04, roll=False),
              dict(t0=1.08, t1=1.42, x=-5.6, z=1.38, yaw=30, toe=30, knee=.35,
                   air=[[.2, -.05, -.25, -.05, 10], [.6, -.05, -.24, -.25, 5], [.9, -.05, -.25, -.3, 0]]),
              dict(t0=2.5, t1=3.0, x=-5.55, z=1.6, yaw=10), dict(t0=3.3, t1=3.55, x=-5.6, z=.9, yaw=6, h=.06), dict(t0=3.75, t1=4.0, x=-5.6, z=.3, yaw=6, roll=False)]
    arms(ch, 'r', 0,
         f=[[0, 40], [.85, 45], [1.05, 100], [1.22, 150], [tc, 172], [1.7, 172], [2.05, 120], [2.35, 60], [2.8, 38], [4.0, 40]],
         a=[[0, 25], [1.0, 30], [tc, 20], [1.8, 20], [2.3, 20], [4.0, 25]],
         t=[[0, 0], [1.1, 40], [tc, 90], [1.8, 90], [2.2, 0]], e=[[0, 60], [1.05, 20], [1.3, 4], [1.8, 4], [2.1, 40], [2.6, 60], [4.0, 60]],
         w=[[0, 0], [1.3, -50], [tc, -60], [1.8, -55], [2.1, 0]], p=[[0, 75], [1.1, 85], [tc, 95], [1.8, 95], [2.3, 75]], c=[[0, 22], [1.2, 2], [1.8, 2], [2.2, 22]])
    arms(ch, 'l', 0,
         f=[[0, 40], [.85, 45], [1.1, 70], [tc, 80], [1.7, 70], [2.0, 90], [2.3, 50], [2.8, 38], [4.0, 40]],
         a=[[0, 25], [1.1, -10], [tc, -20], [1.8, -10], [2.2, 25], [4.0, 25]],
         e=[[0, 60], [1.1, 50], [tc, 60], [1.8, 80], [2.1, 40], [2.6, 60], [4.0, 60]],
         t=[[0, 0], [1.2, 30], [2.0, 30], [2.4, 0]], p=[[0, 75], [1.2, 90], [2.0, 90], [2.4, 75]], w=[[0, 0], [1.9, -50], [2.2, 0]], c=[[0, 22], [1.3, 10], [2.2, 22]])
    c['labels'] = [[0, "Low base, weight forward"], [.72, "Split step"], [.9, "Ball wide: push off the far foot"],
                   [1.08, "Long lunge step toward the ball"], [1.24, "Lay out low, reach with the near arm"],
                   [tc - .02, "Pancake: palm flat under the ball"], [1.6, "Land on the hip and thigh, not the elbow"],
                   [2.0, "Roll or push up with the free hand"], [2.6, "Feet under you, back to base"]]

# ---------------------------------------------------------------- tomahawk / overhead dig
def tomahawk(C):
    c = derive(C, 'dig', 'tomahawk'); ch = c['ch']; tc = c['contact']
    ch['y'] = [[0, .82], [.6, .82], [.72, .9], [.82, .78], [1.12, .74], [tc, .76], [1.45, .8], [1.8, .82], [3.4, .82]]
    ch['lean'] = [[0, 30], [.7, 24], [.82, 26], [1.1, 10], [tc, 2], [1.5, 6], [2.0, 24], [3.4, 30]]
    ch['z'] = [[0, 0], [.85, 0], [1.12, .3], [tc, .32], [2.3, .32], [2.9, 0], [3.4, 0]]
    ch['hp'] = [[0, -12], [1.0, -26], [tc, -32], [1.6, -18], [2.0, -10], [3.4, -12]]
    for S in 'lr':
        arms(ch, S, 0,
             f=[[0, 38], [.82, 45], [1.0, 115], [1.15, 142], [tc, 148], [1.48, 150], [1.75, 90], [2.1, 40], [3.4, 38]],
             a=[[0, 25], [.9, 10], [1.1, -12], [tc, -16], [1.5, -10], [1.9, 20], [3.4, 25]],
             t=[[0, 0], [1.0, 20], [tc, 25], [1.6, 10], [1.9, 0]],
             e=[[0, 60], [1.0, 55], [1.15, 34], [tc, 28], [1.5, 30], [1.9, 55], [3.4, 60]],
             w=[[0, 0], [1.1, -20], [tc, -24], [1.6, 0]],
             p=[[0, 75], [1.0, 100], [tc, 110], [1.6, 90], [1.9, 75]], c=[[0, 22], [1.0, 55], [tc, 70], [1.6, 50], [1.9, 22]])
    c['labels'] = [[0, "Low ready"], [.7, "Split step"], [.9, "Ball is high: at the face or over the shoulder"],
                   [1.1, "Hands up, joined: fists or tomahawk"], [tc - .02, "Contact above the forehead, firm wrists"],
                   [1.45, "Push up and toward the middle of the court"], [2.0, "Back to base"]]

def apply(C):
    for f in (quick, shoot, tip, roll, cut, dump, collapse, sidedive, tomahawk): f(C)
    return C
