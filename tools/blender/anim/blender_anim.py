"""Bake every technique clip into a Blender action on PlayerRig (per-frame quaternions, hips location).
Run: blender -b player.blend --python blender_anim.py -- [clip,clip...]"""
import os, sys, os, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) if os.path.basename(os.path.dirname(os.path.abspath(__file__))) == 'anim' else os.path.dirname(os.path.abspath(__file__)))
import bpy, numpy as np
from mathutils import Matrix, Quaternion
from solver import Rig, quat
import choreo

FPS = 30
C = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0.]])           # clip -> Blender
only = sys.argv[sys.argv.index('--') + 1].split(',') if '--' in sys.argv and len(sys.argv) > sys.argv.index('--') + 1 else None
rig = Rig(); clips = choreo.load_clips(rig)
arm = bpy.data.objects['PlayerRig']; scn = bpy.context.scene; scn.render.fps = FPS
arm.animation_data_create()
rest = {b.name: np.array(b.matrix_local.to_3x3()) for b in arm.data.bones}
head0 = {b.name: np.array(b.head_local) for b in arm.data.bones}
for name, clip in clips.items():
    if only and name not in only: continue
    frames = clip.bake(FPS)
    act = bpy.data.actions.get(name) or bpy.data.actions.new(name)
    act.fcurves.clear(); act.use_fake_user = True
    nf = len(frames)
    for bi, bn in enumerate(rig.names):
        Rb = rest[bn]; pb = arm.pose.bones[bn]; pb.rotation_mode = 'QUATERNION'
        Q = np.zeros((nf, 4))
        for fi, (L, X0, _, _) in enumerate(frames):
            LB = C @ L[bi] @ C.T; Bm = Rb.T @ LB @ Rb; Q[fi] = quat(Bm)
        for fi in range(1, nf):                       # keep quaternion signs continuous
            if Q[fi] @ Q[fi - 1] < 0: Q[fi] = -Q[fi]
        dp = f'pose.bones["{bn}"]'
        for k in range(4):
            fc = act.fcurves.new(dp + '.rotation_quaternion', index=k, action_group=bn)
            fc.keyframe_points.add(nf); co = np.stack([np.arange(nf) + 1, Q[:, k]], 1).ravel(); fc.keyframe_points.foreach_set('co', co)
            for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
        if bn == 'hips':
            Lc = np.array([Rb.T @ (C @ X0 - head0[bn]) for (_, X0, _, _) in frames])
            for k in range(3):
                fc = act.fcurves.new(dp + '.location', index=k, action_group=bn)
                fc.keyframe_points.add(nf); fc.keyframe_points.foreach_set('co', np.stack([np.arange(nf) + 1, Lc[:, k]], 1).ravel())
                for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
    act['fps'] = FPS; act['dur'] = clip.dur; act['contact'] = clip.d['contact'] if clip.d['contact'] is not None else -1
    act['tTO'] = clip.d.get('tTO') or -1; act['tLand'] = clip.d.get('tLand') or -1; act['hand'] = clip.d.get('hand', 'R')
    act['labels'] = json.dumps(clip.d.get('labels', []))
    act.frame_range = (1, nf)
    print('baked', name, nf, 'frames')
arm.animation_data.action = bpy.data.actions.get('spike')
bpy.ops.wm.save_mainfile()
