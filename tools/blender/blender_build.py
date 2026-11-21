"""Build the rigged volleyball player in Blender from char_geo parts and save player.blend.
Run: blender -b --python blender_build.py
Clip space (x fwd, y up, z right) maps to Blender as (X, Y, Z) = (x, -z, y)."""
import os, sys, json, math
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) if os.path.basename(os.path.dirname(os.path.abspath(__file__))) == 'anim' else os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh, numpy as np
from mathutils import Vector, Matrix
import char_parts as CG

OUT = os.path.abspath(sys.argv[sys.argv.index('--') + 1]) if '--' in sys.argv else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'player.blend')
B = CG.build(); parts = CG.parts
def C2B(p): p = np.asarray(p); return np.stack([p[..., 0], -p[..., 2], p[..., 1]], -1)

bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
col = bpy.data.collections.new('Player'); scn.collection.children.link(col)

# ---------- armature ----------
arm_data = bpy.data.armatures.new('PlayerRig'); arm = bpy.data.objects.new('PlayerRig', arm_data); col.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
H, T = B.joints['athletic']; Hb, Tb = C2B(H), C2B(T)
eb = {}
for i, n in enumerate(CG.BNAME):
    b = arm_data.edit_bones.new(n); b.head = Vector(Hb[i]); b.tail = Vector(Tb[i])
    if (b.tail - b.head).length < 1e-3: b.tail = b.head + Vector((0, 0, .05))
    d = (b.tail - b.head).normalized()
    up = Vector((1, 0, 0)) if abs(d.x) < .8 else Vector((0, 0, 1))
    b.align_roll(up)
    eb[n] = b
for i, n in enumerate(CG.BNAME):
    if CG.BPAR[i] >= 0: eb[n].parent = eb[CG.BNAME[CG.BPAR[i]]]
bpy.ops.object.mode_set(mode='OBJECT')
arm.show_in_front = True
# joints of the other body shapes, for the web exporter (bones move when the body shape changes)
arm['shape_joints'] = json.dumps({k: {'H': C2B(v[0]).round(5).tolist(), 'T': C2B(v[1]).round(5).tolist()} for k, v in B.joints.items()})

# ---------- materials ----------
MATS = {'skin': (.79, .55, .41), 'jersey': (.93, .23, .32), 'shorts': (.09, .08, .30), 'sock': (.95, .95, .96), 'shoe': (.96, .95, .93), 'sole': (.09, .08, .30),
        'pad': (.11, .11, .16), 'sleeve': (.09, .08, .30), 'hair': (.17, .11, .09), 'band': (1, 1, 1), 'beard': (.17, .11, .09), 'brow': (.13, .09, .07),
        'eye': (.95, .94, .91), 'iris': (.30, .19, .10), 'pupil': (.02, .02, .02), 'teeth': (.94, .91, .86)}
mats = {}
for k, c in MATS.items():
    m = bpy.data.materials.new(k); m.use_nodes = True; bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*[x ** 2.2 for x in c], 1); bsdf.inputs['Roughness'].default_value = .55 if k in ('skin', 'eye') else .8
    mats[k] = m
    if k == 'skin':
        nt = m.node_tree; ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'
        mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1
        mul.inputs['A'].default_value = (*[x ** 2.2 for x in c], 1); nt.links.new(ca.outputs['Color'], mul.inputs['B'])
        br = nt.nodes.new('ShaderNodeMix'); br.data_type = 'RGBA'; br.blend_type = 'MIX'; br.inputs['B'].default_value = (.035, .022, .016, 1)
        nt.links.new(mul.outputs['Result'], br.inputs['A']); nt.links.new(ca.outputs['Alpha'], br.inputs['Factor'])
        nt.links.new(br.outputs['Result'], bsdf.inputs['Base Color']); bsdf.inputs['Subsurface Weight'].default_value = .15

def make(name, P, F, src, mat, VC=None, extra_mats=None, face_mat=None):
    me = bpy.data.meshes.new(name); me.from_pydata(C2B(P).tolist(), [], F); me.update()
    ob = bpy.data.objects.new(name, me); col.objects.link(ob)
    me.materials.append(mats[mat])
    for em in (extra_mats or []): me.materials.append(mats[em])
    if face_mat is not None:
        for p, mi in zip(me.polygons, face_mat): p.material_index = mi
    for p in me.polygons: p.use_smooth = True
    # skin weights from the body vertex each piece was made from
    vg = {n: ob.vertex_groups.new(name=n) for n in CG.BNAME}
    J, W = B.J4[src], B.W4[src]
    for vi in range(len(P)):
        for k in range(4):
            if W[vi, k] > 0: vg[CG.BNAME[J[vi, k]]].add([vi], float(W[vi, k]), 'REPLACE')
    # body shapes as shape keys
    ob.shape_key_add(name='Basis')
    for sname in ('lean', 'power', 'female'):
        sk = ob.shape_key_add(name=sname); D = C2B(B.shapes[sname][src] - B.shapes['athletic'][src])
        base = C2B(P)
        sk.data.foreach_set('co', (base + D).ravel())
    if VC is not None:
        ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
        for i, c in enumerate(VC): ca.data[i].color = tuple(c)
    mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = arm; ob.parent = arm
    ob['src'] = json.dumps(src.tolist()) if len(src) < 4000 else ''
    return ob

for name, p in parts.items():
    fm = None; extra = None
    if name == 'shoes':
        sole = p['sole']; fm = [1 if sum(sole[v] for v in f) >= 3 else 0 for f in p['F']]; extra = ['sole']
    ob = make(name, p['P'], p['F'], p['src'], p['mat'], p.get('VC'), extra, fm)
    if name.startswith('hair') or name.startswith('headband') or name in ('beard_full', 'kneepads'):
        s = ob.modifiers.new('Subd', 'SUBSURF'); s.levels = 1; s.render_levels = 1
        ob.modifiers.move(len(ob.modifiers) - 1, 0)
    ob['piece'] = name

# ---------- eyes ----------
for s, c in zip(('L', 'R'), B.eyes):
    r = B.eye_r
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=24, radius=r)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'))
    me = bpy.data.meshes.new('eye.' + s); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new('eye.' + s, me); col.objects.link(ob)
    me.materials.append(mats['eye']); me.materials.append(mats['iris']); me.materials.append(mats['pupil'])
    cb = Vector(C2B(c))
    for v in me.vertices: v.co = v.co + cb
    for poly in me.polygons:
        d = (poly.center - cb).normalized(); poly.use_smooth = True
        if d.x > .955: poly.material_index = 2
        elif d.x > .86: poly.material_index = 1
    vgp = ob.vertex_groups.new(name='head'); vgp.add(list(range(len(me.vertices))), 1., 'REPLACE')
    for n in CG.BNAME:
        if n != 'head': ob.vertex_groups.new(name=n)
    mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = arm; ob.parent = arm; ob['piece'] = 'eyes'
    ob.shape_key_add(name='Basis')
    for sname in ('lean', 'power', 'female'):
        k = ob.shape_key_add(name=sname)
        hi = CG.BNAME.index('head'); dd = C2B(B.joints[sname][0][hi] - B.joints['athletic'][0][hi])
        k.data.foreach_set('co', (np.array([v.co for v in me.vertices]) + dd).ravel())

bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('saved', OUT)
