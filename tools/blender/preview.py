"""Render preview stills of player.blend with Cycles (CPU). Usage:
blender -b player.blend --python preview.py -- out.png view=front|side|back|three|face pose=rest|test show=a,b hide=c samples=24 res=600"""
import sys, math, bpy
from mathutils import Vector, Euler
args = dict(a.split('=', 1) for a in sys.argv[sys.argv.index('--') + 2:] if '=' in a); out = sys.argv[sys.argv.index('--') + 1]
scn = bpy.context.scene
scn.render.engine = 'CYCLES'; scn.cycles.device = 'CPU'; scn.cycles.samples = int(args.get('samples', 24)); scn.cycles.use_denoising = False
res = int(args.get('res', 600)); scn.render.resolution_x = int(res * float(args.get('aspect', .75))); scn.render.resolution_y = res
show = set(args.get('show', 'skin,jersey_short,shorts,socks_crew,shoes,kneepads,hair_short,headband_thin,brows,eye.L,eye.R').split(','))
for ob in bpy.data.objects:
    if ob.type == 'MESH': ob.hide_render = ob.name not in show
arm = bpy.data.objects['PlayerRig']
if args.get('action'): arm_ = bpy.data.objects['PlayerRig']; arm_.animation_data.action = bpy.data.actions[args['action']]
if args.get('frame'): scn.frame_set(int(args['frame']))
if args.get('follow') != '0' and args.get('frame'):
    hb = bpy.data.objects['PlayerRig'].pose.bones['hips']; hw = bpy.data.objects['PlayerRig'].matrix_world @ hb.head
    args.setdefault('tx', str(hw.x)); args.setdefault('ty', str(max(.95, hw.z)))
pose = args.get('pose', 'rest')
if pose == 'test':
    pb = arm.pose.bones
    for n, e in {'thigh.L': (-80, 0, 0), 'shin.L': (95, 0, 0), 'upperarm.R': (0, 0, 0), 'spine1': (15, 0, 0), 'spine2': (10, 0, 0), 'forearm.R': (-70, 0, 0), 'upperarm.L': (-120, 0, 0)}.items():
        pb[n].rotation_mode = 'XYZ'; pb[n].rotation_euler = Euler([math.radians(a) for a in e])
# world + lights
w = bpy.data.worlds.new('w'); scn.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.32, .33, .42, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .6
for nm, loc, en, sz in (('key', (3, -3, 4), 900, 2), ('fill', (-3, 2, 2.5), 300, 3), ('rim', (-2, -3, 3), 400, 1)):
    l = bpy.data.lights.new(nm, 'AREA'); l.energy = en; l.size = sz; o = bpy.data.objects.new(nm, l); scn.collection.objects.link(o); o.location = loc
    d = Vector((0, 0, 1)) - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
pl = bpy.data.meshes.new('floor'); pl.from_pydata([(-6, -6, 0), (6, -6, 0), (6, 6, 0), (-6, 6, 0)], [], [(0, 1, 2, 3)]); fo = bpy.data.objects.new('floor', pl); scn.collection.objects.link(fo)
fm = bpy.data.materials.new('floor'); fm.use_nodes = True; fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.55, .32, .16, 1); pl.materials.append(fm)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); scn.collection.objects.link(cam); scn.camera = cam
view = args.get('view', 'front'); tgt = Vector((0, 0, float(args.get('ty', .98)))); dist = float(args.get('dist', 4.6))
dirs = {'front': (1, 0, 0), 'side': (0, -1, 0), 'back': (-1, 0, 0), 'three': (.75, -.66, 0), 'left': (0, 1, 0), 'face': (1, -.35, 0)}
d = Vector(dirs.get(view, (1, 0, 0))).normalized()
if view == 'face': tgt = Vector((0, 0, 1.78)); dist = float(args.get('dist', .9))
if args.get('tx'): tgt.x = float(args['tx'])
cam.location = tgt + d * dist + Vector((0, 0, float(args.get('cz', .15)))); cam.data.lens = float(args.get('lens', 50))
cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
scn.render.filepath = out; bpy.ops.render.render(write_still=True)
