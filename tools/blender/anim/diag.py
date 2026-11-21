"""Measure a baked clip against the biomechanics targets: knee/hip angles, trunk lean, jump height, hand height, foot slide."""
import sys, math, numpy as np
from solver import Rig
import choreo
def ang(a, b, c):
    u, v = a - b, c - b; return math.degrees(math.acos(np.clip(u @ v / np.linalg.norm(u) / np.linalg.norm(v), -1, 1)))
rig = Rig(); clips = choreo.load_clips(rig); i = rig.i
names = sys.argv[1].split(',') if len(sys.argv) > 1 else list(clips)
for nm in names:
    c = clips[nm]; fr = c.bake(30); fps = 30
    rows = []
    for k, (L, X0, R, X) in enumerate(fr):
        t = k / fps
        kn = {S: 180 - ang(X[i[f'thigh.{S}']], X[i[f'shin.{S}']], X[i[f'foot.{S}']]) for S in 'LR'}
        hip = {S: ang(X[i['spine2']], X[i[f'thigh.{S}']], X[i[f'shin.{S}']]) for S in 'LR'}
        up = R[i['chest']] @ np.array([0, 1., 0]); lean = math.degrees(math.atan2(up[0] * math.cos(0) , up[1]))
        hand = {S: (X[i[f'hand.{S}']] + R[i[f'hand.{S}']] @ (rig.t(f'hand.{S}') - rig.h(f'hand.{S}')))[1] for S in 'LR'}
        toe = {S: X[i[f'toe.{S}']][1] for S in 'LR'}
        rows.append((t, X0[1], kn['L'], kn['R'], 180 - hip['L'], 180 - hip['R'], math.degrees(math.acos(np.clip(up[1], -1, 1))), hand['L'], hand['R'], toe['L'], toe['R']))
    A = np.array(rows)
    print(f'== {nm} dur {c.dur} contact {c.d["contact"]}  stand pelvis {rig.stand:.3f}')
    print('pelvis min %.3f max %.3f  -> jump rise %.3f' % (A[:, 1].min(), A[:, 1].max(), A[:, 1].max() - rig.stand))
    print('knee flex max L %.0f R %.0f | hip flex max L %.0f R %.0f | trunk incline max %.0f | hand max L %.2f R %.2f' % (A[:, 2].max(), A[:, 3].max(), A[:, 4].max(), A[:, 5].max(), A[:, 6].max(), A[:, 7].max(), A[:, 8].max()))
    step = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    print('   t   pelv  kneeL kneeR hipL hipR trunk handL handR')
    for r in A[::step]: print('%5.2f %5.2f %5.0f %5.0f %4.0f %4.0f %5.0f %5.2f %5.2f' % tuple(r[:9]))
    if c.d['contact'] is not None:
        k = int(round(c.d['contact'] * fps)); r = A[min(k, len(A) - 1)]
        print('AT CONTACT t=%.2f pelvis %.2f trunk %.0f handL %.2f handR %.2f' % (r[0], r[1], r[6], r[7], r[8]))
