"""Baukasten für Blender ohne Oberfläche: Materialien, Formen (als ein Mesh je Gebäude), Licht, Kamera, Rendern.

Alle Maße in Metern, Z ist oben. Ein Gebäude wird mit Builder zusammengesetzt und am Ende ein einziges Objekt.
"""
import bpy, bmesh, math, random, json
from mathutils import Matrix, Vector

# ---------- Szene ----------

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _MATS.clear()


_MATS = {}


def mat(name, color, rough=0.8, metal=0.0, emit=None, strength=0.0, alpha=1.0):
    """Principled-Material, nach Name zwischengespeichert. color/emit als (r, g, b) 0..1."""
    if name in _MATS:
        return _MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if emit is not None:
        p.inputs['Emission Color'].default_value = (*emit, 1)
        p.inputs['Emission Strength'].default_value = strength
    if alpha < 1:
        p.inputs['Alpha'].default_value = alpha
    _MATS[name] = m
    return m


def noise_mat(name, c1, c2, scale=0.08, rough=0.95):
    """Boden mit Flecken: zwei Farben über Rauschen gemischt."""
    if name in _MATS:
        return _MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    p.inputs['Roughness'].default_value = rough
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = scale
    nz.inputs['Detail'].default_value = 8
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = (*c1, 1)
    ramp.color_ramp.elements[1].position = 0.7
    ramp.color_ramp.elements[1].color = (*c2, 1)
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    nt.links.new(nz.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
    _MATS[name] = m
    return m


# ---------- Formen ----------

class Builder:
    """Sammelt Kästen, Zylinder und Kegel in einem bmesh; finish() macht daraus ein Objekt."""

    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.mats = []
        self.lit = []  # Mittelpunkte leuchtender Fenster (für das Flackern im Browser)

    def _mi(self, m):
        if m not in self.mats:
            self.mats.append(m)
        return self.mats.index(m)

    def _faces(self, verts, m):
        mi = self._mi(m)
        for f in {f for v in verts for f in v.link_faces}:
            f.material_index = mi

    def box(self, x, y, z, sx, sy, sz, m, rz=0.0, rx=0.0, ry=0.0):
        """Kasten mit Mittelpunkt (x, y, z) und Kantenlängen sx, sy, sz."""
        mat_ = (Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(ry, 4, 'Y')
                @ Matrix.Rotation(rx, 4, 'X') @ Matrix.Diagonal((sx, sy, sz, 1)))
        r = bmesh.ops.create_cube(self.bm, size=1.0, matrix=mat_)
        self._faces(r['verts'], m)
        if m.name.endswith('_lit'):
            self.lit.append((x, y, z))

    def cyl(self, x, y, z, r1, h, m, segs=12, r2=None, rx=0.0, ry=0.0, rz=0.0):
        """Zylinder oder Kegel, Mittelpunkt (x, y, z), Höhe h entlang Z (vor der Drehung)."""
        mat_ = (Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(ry, 4, 'Y')
                @ Matrix.Rotation(rx, 4, 'X'))
        r = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r1,
                                  radius2=r1 if r2 is None else r2, depth=h, matrix=mat_)
        self._faces(r['verts'], m)

    def sphere(self, x, y, z, r, m, segs=16, rings=8, sz=1.0):
        r_ = bmesh.ops.create_uvsphere(self.bm, u_segments=segs, v_segments=rings, radius=r,
                                       matrix=Matrix.Translation((x, y, z)) @ Matrix.Diagonal((1, 1, sz, 1)))
        self._faces(r_['verts'], m)

    def windows(self, x0, y0, z0, along, cols, rows, dx, dz, w, h, m, face='y-', skip=0.3, seed=0, depth=0.06):
        """Fensterraster auf einer Wand. (x0, y0, z0) = Mitte des ersten Fensters; along 'x' oder 'y'."""
        rnd = random.Random(seed)
        for r in range(rows):
            for c in range(cols):
                if rnd.random() < skip:
                    continue
                if along == 'x':
                    self.box(x0 + c * dx, y0, z0 + r * dz, w, depth, h, m)
                else:
                    self.box(x0, y0 + c * dx, z0 + r * dz, depth, w, h, m)

    def crenels(self, cx, cy, z, sx, sy, m, size=0.35, gap=0.35):
        """Zinnen rund um ein Rechteck (Mitte cx, cy, Oberkante z)."""
        step = size + gap
        for i in range(int(sx / step) + 1):
            x = cx - sx / 2 + i * step + size / 2
            if x > cx + sx / 2:
                break
            self.box(x, cy - sy / 2, z + size / 2, size, size, size, m)
            self.box(x, cy + sy / 2, z + size / 2, size, size, size, m)
        for i in range(int(sy / step) + 1):
            y = cy - sy / 2 + i * step + size / 2
            if y > cy + sy / 2:
                break
            self.box(cx - sx / 2, y, z + size / 2, size, size, size, m)
            self.box(cx + sx / 2, y, z + size / 2, size, size, size, m)

    def finish(self, loc=(0, 0, 0), rot=0.0, bevel=0.0):
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me)
        self.bm.free()
        ob = bpy.data.objects.new(self.name, me)
        for m in self.mats:
            me.materials.append(m)
        ob.location = loc
        ob.rotation_euler[2] = rot
        bpy.context.scene.collection.objects.link(ob)
        ob['lit'] = [c for p in self.lit for c in p]
        if bevel > 0:
            mod = ob.modifiers.new('bevel', 'BEVEL')
            mod.width = bevel
            mod.segments = 1
            mod.limit_method = 'ANGLE'
        return ob


# ---------- Welt, Licht, Kamera ----------

def world(top, horizon, strength=1.0, fog=0.0, fog_color=(0.5, 0.35, 0.3), horizon_at=0.45, fog_end=400.0):
    """Himmel als Verlauf über die Bildhöhe (Bildkoordinaten: 0 unten, 1 oben): Horizontfarbe bei horizon_at,
    Zenitfarbe oben. Optional Dunst als Volumen bis fog_end Meter."""
    w = bpy.data.worlds.new('Welt')
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes.get('Background')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = horizon_at
    ramp.color_ramp.elements[0].color = (*horizon, 1)
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color = (*top, 1)
    nt.links.new(tc.outputs['Window'], sep.inputs['Vector'])
    nt.links.new(sep.outputs['Y'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = strength
    if fog > 0:
        vol = nt.nodes.new('ShaderNodeVolumePrincipled')
        vol.inputs['Density'].default_value = fog
        vol.inputs['Color'].default_value = (*fog_color, 1)
        out = nt.nodes.get('World Output')
        nt.links.new(vol.outputs['Volume'], out.inputs['Volume'])
        ee = bpy.context.scene.eevee
        for k, v in (('volumetric_end', fog_end), ('volumetric_tile_size', '8')):
            try:
                setattr(ee, k, v)
            except Exception:
                pass
    return w


def fog_box(center, size, density=0.002, color=(0.7, 0.45, 0.35), anisotropy=0.3):
    """Dunst als Volumen-Quader (ein Welt-Volumen würde in EEVEE Sonne und Himmel ganz schlucken)."""
    m = bpy.data.materials.new('Dunst')
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    out = [n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'][0]
    vol = nt.nodes.new('ShaderNodeVolumePrincipled')
    vol.inputs['Density'].default_value = density
    vol.inputs['Color'].default_value = (*color, 1)
    vol.inputs['Anisotropy'].default_value = anisotropy
    nt.links.new(vol.outputs['Volume'], out.inputs['Volume'])
    bld = Builder('Dunst')
    bld.box(center[0], center[1], center[2], size[0], size[1], size[2], m)
    ob = bld.finish()
    ee = bpy.context.scene.eevee
    try:
        ee.volumetric_end = 900.0
    except Exception:
        pass
    return ob


def sun(direction_deg=(50, 0, -35), energy=3.0, color=(1.0, 0.75, 0.55), angle=2.0):
    l = bpy.data.lights.new('Sonne', 'SUN')
    l.energy = energy
    l.color = color
    l.angle = math.radians(angle)
    o = bpy.data.objects.new('Sonne', l)
    o.rotation_euler = [math.radians(a) for a in direction_deg]
    bpy.context.scene.collection.objects.link(o)
    return o


def point(loc, energy=500, color=(1, 0.6, 0.3), radius=0.5):
    l = bpy.data.lights.new('Licht', 'POINT')
    l.energy = energy
    l.color = color
    l.shadow_soft_size = radius
    o = bpy.data.objects.new('Licht', l)
    o.location = loc
    bpy.context.scene.collection.objects.link(o)
    return o


def camera(loc, look_at, lens=50.0, ortho=None):
    c = bpy.data.cameras.new('Kamera')
    if ortho:
        c.type = 'ORTHO'
        c.ortho_scale = ortho
    else:
        c.lens = lens
    c.clip_end = 5000
    o = bpy.data.objects.new('Kamera', c)
    o.location = loc
    d = Vector(look_at) - Vector(loc)
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.collection.objects.link(o)
    bpy.context.scene.camera = o
    return o


def render(path, w, h, samples=32, transparent=False, exposure=0.0):
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = transparent
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA' if transparent else 'RGB'
    sc.render.filepath = path
    try:
        sc.eevee.taa_render_samples = samples
    except AttributeError:
        pass
    sc.view_settings.exposure = exposure
    for k, v in (('use_raytracing', True), ('use_shadows', True)):
        try:
            setattr(sc.eevee, k, v)
        except Exception:
            pass
    bpy.ops.render.render(write_still=True)


def project(points):
    """Weltpunkte → Pixel (x, y von oben links) im gerenderten Bild."""
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    w, h = sc.render.resolution_x, sc.render.resolution_y
    out = []
    for p in points:
        v = world_to_camera_view(sc, sc.camera, Vector(p))
        out.append([round(v.x * w, 1), round((1 - v.y) * h, 1)])
    return out


def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)


# ---------- Comic ----------

def toonify(outline=0.1, skip=('Dunst',), bands=((0.0, 0.45), (0.37, 0.78), (0.57, 1.0), (0.76, 1.2))):
    """Ganze Szene im Comic-Look (nur EEVEE): Licht in harten Stufen über Shader to RGB, Leuchtendes bleibt leuchtend,
    schwarzer Umriss als umgedrehte Hülle an jedem Mesh. Grundfarbe aus dem Principled-Knoten, bei Rausch-Materialien
    das Mittel der Farbrampe."""
    out = bpy.data.materials.new('Umriss')
    out.use_nodes = True
    nt = out.node_tree
    nt.nodes.remove(nt.nodes['Principled BSDF'])
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (0.01, 0.01, 0.015, 1)
    nt.links.new(em.outputs[0], next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL').inputs['Surface'])
    out.use_backface_culling = True
    for m in list(bpy.data.materials):
        if m is out or m.name.split('.')[0] in skip or not m.use_nodes:
            continue
        nt = m.node_tree
        p = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if p is None:
            continue
        ramp = next((n for n in nt.nodes if n.type == 'VALTORGB'), None)
        if ramp:
            els = ramp.color_ramp.elements
            c = [sum(e.color[i] for e in els) / len(els) for i in range(3)]
        else:
            c = list(p.inputs['Base Color'].default_value[:3])
        es = p.inputs['Emission Strength'].default_value
        ec = list(p.inputs['Emission Color'].default_value[:3])
        for n in list(nt.nodes):
            if n.type != 'OUTPUT_MATERIAL':
                nt.nodes.remove(n)
        o = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
        em = nt.nodes.new('ShaderNodeEmission')
        nt.links.new(em.outputs[0], o.inputs['Surface'])
        if es > 0:
            em.inputs['Color'].default_value = (*ec, 1)
            em.inputs['Strength'].default_value = min(es, 1.5)
            continue
        d = nt.nodes.new('ShaderNodeBsdfDiffuse')
        d.inputs['Color'].default_value = (1, 1, 1, 1)
        s2r = nt.nodes.new('ShaderNodeShaderToRGB')
        nt.links.new(d.outputs[0], s2r.inputs[0])
        half = nt.nodes.new('ShaderNodeMath')
        half.operation = 'MULTIPLY'
        half.inputs[1].default_value = 0.5
        nt.links.new(s2r.outputs['Color'], half.inputs[0])
        rp = nt.nodes.new('ShaderNodeValToRGB')
        cr = rp.color_ramp
        cr.interpolation = 'CONSTANT'
        for i, (pos, k) in enumerate(bands):
            e = cr.elements[i] if i < 2 else cr.elements.new(pos)
            e.position = pos
            e.color = (*[min(1.0, x * k + (0.04 if k > 1 else 0)) for x in c], 1)
        nt.links.new(half.outputs[0], rp.inputs['Fac'])
        nt.links.new(rp.outputs['Color'], em.inputs['Color'])
    for ob in list(bpy.context.scene.objects):  # Volumen (Dunst, Smog, auch 'Dunst.001') bekommen keinen Umriss
        if ob.type != 'MESH' or any(ms is not None and ms.name.split('.')[0] in skip for ms in ob.data.materials):
            continue
        ob.data.materials.append(out)
        so = ob.modifiers.new('umriss', 'SOLIDIFY')
        so.thickness = outline
        so.offset = 1.0
        so.use_flip_normals = True
        so.use_rim = False
        so.material_offset = len(ob.data.materials) - 1
    bpy.context.scene.view_settings.view_transform = 'Standard'
