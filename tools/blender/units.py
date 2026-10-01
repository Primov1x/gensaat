# Einheiten nah an den Original-Designs (Mk-VII-Marine, Terminator, Ork-Boy) im Comic-Look.
# Teile werden richtig modelliert: Loft-Röhren mit Unterteilung, Drehkörper (Schulterpanzer, Knieschutz), ausgeschnittene
# Embleme (Adler, Ordenssymbol), gebogenes Sichelmagazin. Jede Einheit ist eine Sammlung und wird als Instanz aufgestellt.
# Aufruf: blender -b --factory-startup -P units.py -- <ausgabe> <blatt|aufstellung|tisch|alles> [schnell]
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import kit
from mathutils import Vector, Matrix, Euler

args = sys.argv[sys.argv.index('--') + 1:]
outdir, what, quick = args[0], args[1], 'schnell' in args
rad = math.radians


def V(*a):
    return Vector(a)


kit.reset()
SC = bpy.context.scene

# ---------- Comic-Materialien ----------

MATS, OUTLINES = {}, []
_out = None


def outline_mat():
    global _out
    if _out is None:
        _out = bpy.data.materials.new('Umriss')
        _out.use_nodes = True
        nt = _out.node_tree
        nt.nodes.remove(nt.nodes['Principled BSDF'])
        em = nt.nodes.new('ShaderNodeEmission')
        em.inputs['Color'].default_value = (0.01, 0.01, 0.015, 1)
        nt.links.new(em.outputs[0], next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL').inputs['Surface'])
        _out.use_backface_culling = True
    return _out


def toon(name, c, kind='matte'):
    """Licht in harten Stufen. kind: matte, metal (zusätzlich gestuftes Glanzlicht), glow (leuchtet)."""
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    em = nt.nodes.new('ShaderNodeEmission')
    nt.links.new(em.outputs[0], out.inputs['Surface'])
    MATS[name] = m
    if kind == 'glow':
        em.inputs['Color'].default_value = (*c, 1)
        em.inputs['Strength'].default_value = 1.6
        return m
    d = nt.nodes.new('ShaderNodeBsdfDiffuse')
    d.inputs['Color'].default_value = (1, 1, 1, 1)
    s2r = nt.nodes.new('ShaderNodeShaderToRGB')
    nt.links.new(d.outputs[0], s2r.inputs[0])
    half = nt.nodes.new('ShaderNodeMath')
    half.operation = 'MULTIPLY'
    half.inputs[1].default_value = 0.5
    nt.links.new(s2r.outputs['Color'], half.inputs[0])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    cr = ramp.color_ramp
    cr.interpolation = 'CONSTANT'
    for i, (pos, k) in enumerate(((0.0, 0.42), (0.36, 0.74), (0.56, 1.0), (0.8, 1.16))):
        e = cr.elements[i] if i < 2 else cr.elements.new(pos)
        e.position = pos
        e.color = (*[min(1.0, x * k + (0.03 if k > 1 else 0)) for x in c], 1)
    nt.links.new(half.outputs[0], ramp.inputs['Fac'])
    col = ramp.outputs['Color']
    if kind == 'metal':
        p2 = nt.nodes.new('ShaderNodeBsdfPrincipled')
        p2.inputs['Base Color'].default_value = (1, 1, 1, 1)
        p2.inputs['Metallic'].default_value = 1.0
        p2.inputs['Roughness'].default_value = 0.3
        s2 = nt.nodes.new('ShaderNodeShaderToRGB')
        nt.links.new(p2.outputs[0], s2.inputs[0])
        mr = nt.nodes.new('ShaderNodeMapRange')
        nt.links.new(s2.outputs['Color'], mr.inputs['Value'])
        mr.inputs['From Min'].default_value = 0.85
        mr.inputs['From Max'].default_value = 0.9
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        ins = {s.identifier: s for s in mix.inputs}
        nt.links.new(mr.outputs['Result'], ins['Factor_Float'])
        nt.links.new(col, ins['A_Color'])
        ins['B_Color'].default_value = (*[min(1.0, x * 1.5 + 0.35) for x in c], 1)
        col = next(s for s in mix.outputs if s.identifier == 'Result_Color')
    nt.links.new(col, em.inputs['Color'])
    return m


def palette(chapter='ultramarines'):
    return {
        'A': toon('ruestung', (0.03, 0.11, 0.48)),          # Ordensblau
        'T': toon('gold', (0.78, 0.52, 0.1), 'metal'),       # Rand, Adler
        'D': toon('schwarz', (0.025, 0.025, 0.03)),          # Gelenke, Kabel
        'G': toon('waffe', (0.04, 0.04, 0.05)),              # Bolter
        'S': toon('stahl', (0.45, 0.47, 0.5), 'metal'),      # Metallteile
        'W': toon('weiss', (0.85, 0.85, 0.82)),              # Symbole
        'E': toon('augen', (1.0, 0.12, 0.04), 'glow'),
        'R': toon('wachs', (0.6, 0.04, 0.03)),
        'P': toon('pergament', (0.9, 0.82, 0.6)),
        'L': toon('leder', (0.22, 0.1, 0.04)),
        'K': toon('knochen', (0.85, 0.78, 0.55)),
        'Q': toon('kraftfeld', (0.35, 0.65, 1.0), 'glow'),
        'C': toon('kabel', (0.13, 0.13, 0.15), 'metal'),          # geripptes Bauchteil
    }

# ---------- Objekte ----------

COLL = ROOT = None
OL = 0.012


def begin(name):
    """Neue Einheit: eigene Sammlung mit Wurzel; alles wird um den Ursprung gebaut."""
    global COLL, ROOT
    COLL = bpy.data.collections.new(name)
    SC.collection.children.link(COLL)
    ROOT = bpy.data.objects.new(name + '_Wurzel', None)
    COLL.objects.link(ROOT)
    return COLL


def mk(name, bm, mats, sub=0, bevel=0.0, smooth=True, crease_sharp=False, ol=True):
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    COLL.objects.link(ob)
    ob.parent = ROOT
    for m in mats:
        me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = smooth
    if bevel:
        b = ob.modifiers.new('bevel', 'BEVEL')
        b.width, b.segments, b.limit_method, b.angle_limit, b.harden_normals = bevel, 3, 'ANGLE', rad(30), True
    if sub:
        s = ob.modifiers.new('sub', 'SUBSURF')
        s.levels = s.render_levels = sub
    if ol:
        me.materials.append(outline_mat())
        so = ob.modifiers.new('umriss', 'SOLIDIFY')
        so.thickness, so.offset, so.use_flip_normals, so.use_rim = OL, 1.0, True, False
        so.material_offset = len(me.materials) - 1
        OUTLINES.append(so)
    return ob


def setmat(bm, faces, idx):
    for f in faces:
        f.material_index = idx

# ---------- Formen ----------

def frame_from(d, ref=None):
    """Orthonormale Basis (ax, ay, d) zu Richtung d; ax möglichst nach Welt-X."""
    d = d.normalized()
    ref = ref or (V(1, 0, 0) if abs(d.x) < 0.9 else V(0, 1, 0))
    ax = (ref - d * ref.dot(d)).normalized()
    return ax, d.cross(ax), d


def superellipse(rx, ry, e, n):
    pts = []
    for k in range(n):
        t = 2 * math.pi * k / n
        c, s = math.cos(t), math.sin(t)
        pts.append((rx * math.copysign(abs(c) ** (2 / e), c), ry * math.copysign(abs(s) ** (2 / e), s)))
    return pts


def loft(name, rings, mat, n=16, sub=2, ref=None, mats=None, ol=True):
    """Röhre durch Ringe [(Mitte, rx, ry, e)]; e=2 rund, größer = kantiger. Enden geschlossen, mit Unterteilung."""
    bm = bmesh.new()
    loops = []
    pts = [Vector(r[0]) for r in rings]
    for i, (c, rx, ry, e) in enumerate(rings):
        d = pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]
        ax, ay, _ = frame_from(d, ref)
        loops.append([bm.verts.new(Vector(c) + ax * px + ay * py) for px, py in superellipse(rx, ry, e, n)])
    for i in range(len(loops) - 1):
        a, b = loops[i], loops[i + 1]
        for k in range(n):
            f = bm.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]))
            f.material_index = mats[i] if mats else 0
    bm.faces.new(list(reversed(loops[0])))
    bm.faces.new(loops[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ms = [mat] if not mats else mat
    return mk(name, bm, ms, sub=sub, ol=ol)


def revolve(name, profile, mats, seg_mats, M=Matrix(), steps=40, sub=1):
    """Drehkörper um Z aus Profil [(r, z)] von oben nach unten; seg_mats[i] = Material zwischen Punkt i und i+1."""
    bm = bmesh.new()
    lay = bm.verts.layers.int.new('pi')
    vs = []
    for i, (r, z) in enumerate(profile):
        v = bm.verts.new((r, 0, z))
        v[lay] = i
        vs.append(v)
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=steps, use_merge=True)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    for f in bm.faces:
        f.material_index = seg_mats[min(v[lay] for v in f.verts)]
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mk(name, bm, mats, sub=sub)


def emblem(name, outline, depth, mat, M, mirror=False, bevel=0.003):
    """Flaches Emblem aus Umriss [(x, z)] (vorn = -Y), nach hinten ausgestoßen; mirror ergänzt die linke Hälfte."""
    pts = list(outline)
    if mirror:
        pts = pts + [(-x, z) for x, z in reversed(outline) if abs(x) > 1e-6]
    bm = bmesh.new()
    f = bm.faces.new([bm.verts.new((x, 0, z)) for x, z in pts])
    if f.normal.y > 0:
        f.normal_flip()
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(0, depth, 0), verts=[e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    return mk(name, bm, [mat], bevel=bevel, smooth=False)


def box(name, c, s, mat, R=Matrix(), bevel=0.006, sub=0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(c) @ R.to_4x4() @ Matrix.Diagonal((*s, 1)))
    return mk(name, bm, [mat], bevel=bevel, sub=sub, smooth=not sub == 0 or True)


def ell(name, c, r, mat, R=Matrix(), segs=24):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=segs // 2, radius=1.0,
                              matrix=Matrix.Translation(c) @ R.to_4x4() @ Matrix.Diagonal((*r, 1)))
    return mk(name, bm, [mat])


def cyl(name, p0, p1, r0, r1, mat, segs=20, bevel=0.004):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r0, radius2=r1, depth=d.length,
                          matrix=Matrix.Translation((p0 + p1) / 2) @ V(0, 0, 1).rotation_difference(d).to_matrix().to_4x4())
    return mk(name, bm, [mat], bevel=bevel)


def orient(front, up=V(0, 0, 1)):
    """Drehung, die -Y (Vorderseite eines Emblems) auf 'front' legt und Z möglichst nach 'up'."""
    f = front.normalized()
    x = (-f).cross(up).normalized() if abs(f.dot(up)) < 0.99 else V(1, 0, 0)
    y = -f
    z = x.cross(y)
    return Matrix((x, y, z)).transposed()


def two_bone(s, h, l1, l2, pole):
    """Ellbogen/Knie zwischen s und h mit Längen l1, l2, gebeugt Richtung pole."""
    d = h - s
    dist = min(d.length, l1 + l2 - 1e-4)
    a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist)
    hgt = math.sqrt(max(0.0, l1 * l1 - a * a))
    dn = d.normalized()
    p = (pole - dn * pole.dot(dn)).normalized()
    return s + dn * a + p * hgt

# ---------- Embleme (Umrisse) ----------

AQUILA = [(0.0, 0.06), (0.05, 0.1), (0.07, 0.2), (0.11, 0.26), (0.17, 0.25), (0.14, 0.21), (0.16, 0.17), (0.12, 0.14),
          (0.2, 0.17), (0.45, 0.27), (0.75, 0.36), (1.0, 0.4), (0.9, 0.24), (0.8, 0.27), (0.7, 0.1), (0.6, 0.15),
          (0.5, -0.03), (0.4, 0.03), (0.3, -0.14), (0.2, -0.08), (0.12, -0.22), (0.07, -0.4), (0.0, -0.32)]
ARROW = [(-0.13, -0.5), (0.13, -0.5), (0.13, 0.04), (0.33, 0.04), (0.0, 0.5), (-0.33, 0.04), (-0.13, 0.04)]
CRUX = [(-0.1, 0.12), (-0.26, 0.5), (0.26, 0.5), (0.1, 0.12), (0.12, 0.1), (0.5, 0.26), (0.5, -0.26), (0.12, -0.1),
        (0.1, -0.12), (0.26, -0.5), (-0.26, -0.5), (-0.1, -0.12), (-0.12, -0.1), (-0.5, -0.26), (-0.5, 0.26), (-0.12, 0.1)]


def omega_parts():
    """Umgedrehtes Omega: Bogen unten, zwei Füße oben (aus drei Teilen)."""
    arc = []
    ro, ri, cz = 0.42, 0.25, 0.08
    for k in range(17):
        a = rad(150 + k * 15)
        arc.append((ro * math.cos(a), cz + ro * math.sin(a)))
    for k in range(17):
        a = rad(390 - k * 15)
        arc.append((ri * math.cos(a), cz + ri * math.sin(a)))
    fz = cz + 0.5 * (ro + ri) * math.sin(rad(150))
    foot = lambda sx: [(sx * 0.2, fz + 0.08), (sx * 0.55, fz + 0.08), (sx * 0.55, fz - 0.06), (sx * 0.2, fz - 0.06)]
    return [arc, foot(-1), list(reversed(foot(1)))]

# ---------- Teile ----------

def pauldron(name, base, sx, P, scale=(0.84, 0.92, 1.25), tilt=17, icon=None):
    """Schulterpanzer als Drehkörper: Kuppel in Ordensfarbe, goldener Wulstrand; optional Symbol außen."""
    prof = [(0.0, 0.215), (0.07, 0.212), (0.13, 0.195), (0.18, 0.16), (0.215, 0.11), (0.235, 0.05), (0.24, 0.0),
            (0.262, 0.004), (0.272, -0.03), (0.25, -0.045), (0.2, -0.04), (0.0, -0.03)]
    seg = [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0]
    R = Matrix.Rotation(rad(tilt * sx), 4, 'Y')
    M = Matrix.Translation(base) @ R @ Matrix.Diagonal((*scale, 1))
    revolve(name, prof, [P['A'], P['T']], seg, M)
    if icon:
        phi = rad(-25) if sx > 0 else rad(180 + 25)
        loc_l = V(0.218 * math.cos(phi), 0.218 * math.sin(phi), 0.1)
        p = M @ loc_l
        n = (R.to_3x3() @ V(math.cos(phi) / scale[0], math.sin(phi) / scale[1], 0.3)).normalized()
        Mi = Matrix.Translation(p + n * 0.004) @ orient(n).to_4x4() @ Matrix.Diagonal((0.13, 1, 0.13, 1))
        mat, outl = icon
        if outl == 'omega':
            for i, part in enumerate(omega_parts()):
                emblem(f'{name}_symbol{i}', part, 0.08, mat, Mi)
        else:
            emblem(f'{name}_symbol', outl, 0.08, mat, Mi)


def kneepad(name, knee, P, size=1.0, tilt=12):
    prof = [(0.0, 0.07), (0.06, 0.066), (0.1, 0.05), (0.12, 0.02), (0.125, 0.0), (0.135, -0.01), (0.12, -0.02), (0.0, -0.01)]
    M = (Matrix.Translation(knee) @ Matrix.Rotation(rad(90 + tilt), 4, 'X') @ Matrix.Diagonal((size, size * 1.15, size, 1)))
    revolve(name, prof, [P['A'], P['T']], [0, 0, 0, 0, 1, 1, 0], M, steps=32)


def helmet(pre, c, P, h=1.0):
    """Mk-VII-Helm: Kuppel, Gesichtsmaske mit Mittelgrat, dreieckiges Atemgitter mit Lamellen, Brauengrat,
    runde Augenlinsen, Ohrscheiben, Atemröhrchen."""
    c = Vector(c)
    ell(pre + 'kuppel', c + V(0, 0.01, 0.01 * h), (0.118 * h, 0.13 * h, 0.135 * h), P['A'], segs=32)
    bm = bmesh.new()                                   # Maske: gebogene Platte, Mitte nach vorn gezogen
    rows = []
    for zi, (z, w, fwd) in enumerate(((0.03, 1.0, 0.0), (-0.03, 0.95, 0.012), (-0.08, 0.78, 0.03), (-0.12, 0.5, 0.045))):
        row = []
        for xi in range(7):
            a = rad(-62 + xi * 124 / 6) * w
            cen = 1.0 - abs(xi - 3) / 3
            r = 0.122 + fwd * cen + 0.008
            row.append(bm.verts.new(c + V(r * math.sin(a) * h, -r * math.cos(a) * h, z * h)))
        rows.append(row)
    for i in range(3):
        for k in range(6):
            bm.faces.new((rows[i][k], rows[i][k + 1], rows[i + 1][k + 1], rows[i + 1][k]))
    r = bmesh.ops.solidify(bm, geom=bm.faces, thickness=0.022 * h)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mk(pre + 'maske', bm, [P['A']], sub=2)
    grill = [(0.0, 0.0), (0.04, 0.0), (0.03, -0.026), (0.0, -0.055)]
    Mg = (Matrix.Translation(c + V(0, -0.163 * h, -0.06 * h)) @ Matrix.Rotation(rad(-14), 4, 'X') @
          Matrix.Diagonal((h, 1, h, 1)))
    emblem(pre + 'gitter', grill, 0.03, P['D'], Mg, mirror=True, bevel=0.002)
    for i in range(-1, 2):
        x = i * 0.014 * h
        box(pre + f'lamelle{i}', c + V(x, -0.166 * h, -0.078 * h + abs(i) * 0.006 * h), (0.005 * h, 0.008 * h, (0.036 - abs(i) * 0.01) * h),
            P['S'], Matrix.Rotation(rad(-14), 3, 'X'), bevel=0.001)
    for sx in (-1, 1):
        ell(pre + f'auge{sx}', c + V(0.05 * sx * h, -0.118 * h, 0.012 * h), (0.03 * h, 0.014 * h, 0.026 * h), P['E'],
            Matrix.Rotation(rad(-22 * sx), 3, 'Z'))
        cyl(pre + f'ohr{sx}', c + V(0.112 * sx * h, 0.005, -0.005 * h), c + V(0.132 * sx * h, 0.005, -0.005 * h),
            0.045 * h, 0.04 * h, P['A'], segs=24)
        cyl(pre + f'ohrknopf{sx}', c + V(0.132 * sx * h, 0.005, -0.005 * h), c + V(0.14 * sx * h, 0.005, -0.005 * h),
            0.02 * h, 0.016 * h, P['T'], segs=16)
        cyl(pre + f'atem{sx}', c + V(0.05 * sx * h, -0.135 * h, -0.075 * h), c + V(0.062 * sx * h, -0.155 * h, -0.1 * h),
            0.014 * h, 0.012 * h, P['S'], segs=12)
    bm = bmesh.new()                                   # Brauengrat: flacher Bogen über den Augen, leicht V
    pts = []
    for k in range(9):
        a = rad(-50 + k * 12.5)
        pts.append(c + V(0.126 * math.sin(a) * h, -0.126 * math.cos(a) * h, (0.04 + abs(k - 4) * 0.004) * h))
    loft_pts = [(p, 0.012 * h, 0.008 * h, 2.5) for p in pts]
    loft(pre + 'braue', loft_pts, P['A'], n=10, sub=1, ref=V(0, 0, 1))


def bolter(pre, P, frame, g=1.0):
    """Bolter (Godwyn-Muster) im Rahmen (Ursprung = Griff, u vorn, up oben, r rechts)."""
    o, u, up, r = frame
    R = Matrix((r, u, up)).transposed()           # lokale Achsen: X = r (Breite), Y = u (Länge), Z = up (Höhe)

    def at(a, c, b=0.0):
        return o + u * (a * g) + up * (c * g) + r * (b * g)

    def bx(n, a, c, s, m, bev=0.008, rot=None):
        RR = R @ rot if rot else R
        box(pre + n, at(a, c), (s[0] * g, s[1] * g, s[2] * g), m, RR, bevel=bev * g)
    bx('gehaeuse', 0.08, 0.1, (0.085, 0.42, 0.13), P['G'])
    bx('schiene', 0.1, 0.185, (0.045, 0.36, 0.04), P['G'])
    bx('visier', -0.04, 0.215, (0.03, 0.05, 0.035), P['S'], 0.004)
    bx('korn', 0.25, 0.21, (0.02, 0.03, 0.03), P['S'], 0.004)
    bx('mantel', 0.38, 0.09, (0.08, 0.2, 0.1), P['G'])
    bx('muendung', 0.505, 0.095, (0.1, 0.055, 0.13), P['S'], 0.01)
    bx('schlitz', 0.535, 0.095, (0.105, 0.012, 0.02), P['D'], 0.002)
    cyl(pre + 'lauf', at(0.52, 0.095), at(0.54, 0.095), 0.024 * g, 0.024 * g, P['D'], segs=16)
    bx('auswurf', 0.12, 0.13, (0.088, 0.1, 0.04), P['D'], 0.003)
    bx('messing', 0.0, 0.07, (0.088, 0.2, 0.02), P['T'], 0.003)
    bx('griff', -0.02, -0.04, (0.06, 0.06, 0.13), P['G'], 0.01, Matrix.Rotation(rad(-15), 3, 'X'))
    bx('abzug', 0.035, -0.015, (0.02, 0.06, 0.035), P['G'], 0.004)
    bx('schaft', -0.19, 0.08, (0.07, 0.16, 0.1), P['G'])
    bx('kappe', -0.275, 0.07, (0.075, 0.02, 0.12), P['S'], 0.004)
    bm = bmesh.new()                                   # Sichelmagazin: Rechteck um eine Querachse gedreht
    q = [bm.verts.new(V(x, y, 0)) for x, y in ((-0.032, -0.03), (0.032, -0.03), (0.032, 0.03), (-0.032, 0.03))]
    f = bm.faces.new(q)
    bmesh.ops.spin(bm, geom=[f] + q + list(f.edges), cent=(0, 0.25, 0), axis=(1, 0, 0), angle=rad(-38), steps=8,
                   use_duplicate=False)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    Mm = Matrix.Translation(at(0.14, 0.045)) @ R.to_4x4() @ Matrix.Diagonal((g, g, g, 1))
    bmesh.ops.transform(bm, matrix=Mm, verts=bm.verts)
    mk(pre + 'magazin', bm, [P['G']], bevel=0.006)
    Me = Matrix.Translation(at(0.18, 0.115, 0.045)) @ (R @ Matrix.Rotation(rad(90), 3, 'Z')).to_4x4() @ Matrix.Diagonal((0.07 * g, 1, 0.05 * g, 1))
    emblem(pre + 'adler', AQUILA, 0.006, P['T'], Me, mirror=True, bevel=0.001)


def skull(name, c, s, P):
    """Kleiner Totenkopf: Schädel, Augenhöhlen, Kiefer (Knochen)."""
    c = Vector(c)
    ell(name + '_kopf', c + V(0, 0, 0.1 * s), (0.85 * s, 0.7 * s, 0.8 * s), P['K'], segs=20)
    box(name + '_kiefer', c + V(0, -0.1 * s, -0.55 * s), (0.9 * s, 0.6 * s, 0.45 * s), P['K'], bevel=0.12 * s)
    for sx in (-1, 1):
        ell(name + f'_auge{sx}', c + V(0.33 * sx * s, -0.62 * s, 0.05 * s), (0.22 * s, 0.1 * s, 0.24 * s), P['D'], segs=12)
    ell(name + '_nase', c + V(0, -0.66 * s, -0.25 * s), (0.08 * s, 0.06 * s, 0.12 * s), P['D'], segs=10)


def gun_frame(o, u, up0):
    u = u.normalized()
    up = (up0 - u * up0.dot(u)).normalized()
    return (o, u, up, u.cross(up))

# ---------- Marine ----------

def marine(P, h=1.0):
    begin('Marine')
    # Beine: links (+x) vor, rechts zurück
    for sx, fy in ((1, -0.07), (-1, 0.09)):
        hip, ank = V(0.15 * sx, 0.0, 0.98), V(0.21 * sx, fy, 0.16)
        knee = two_bone(hip, ank, 0.43, 0.41, V(0, -1, 0))
        loft(f'oberschenkel{sx}', [(hip + V(0, 0, 0.04), 0.145, 0.135, 2.6), ((hip + knee) / 2, 0.145, 0.135, 2.6),
                                    (knee + V(0, 0, 0.04), 0.115, 0.11, 2.4)], P['A'])
        ell(f'kniegelenk{sx}', knee, (0.075, 0.075, 0.07), P['D'])
        kneepad(f'knie{sx}', knee + V(0, -0.095, 0.02), P, size=1.05)
        d = (ank - knee).normalized()
        loft(f'schiene{sx}', [(knee + d * 0.06, 0.11, 0.105, 3.0), (knee + d * 0.2, 0.125, 0.125, 3.2),
                              (ank + V(0, -0.015, 0.03), 0.14, 0.15, 3.4)], P['A'], ref=V(1, 0, 0))
        cyl(f'grat{sx}', knee + d * 0.1 + V(0, -0.11, 0), ank + V(0, -0.15, 0.08), 0.022, 0.03, P['A'], segs=12)
        loft(f'stiefel{sx}', [(V(ank.x, ank.y + 0.12, 0.09), 0.12, 0.085, 4.0), (V(ank.x, ank.y, 0.09), 0.135, 0.095, 4.0),
                              (V(ank.x, ank.y - 0.16, 0.065), 0.12, 0.065, 3.4), (V(ank.x, ank.y - 0.24, 0.045), 0.085, 0.04, 2.8)],
             P['A'], ref=V(1, 0, 0))
        box(f'sohle{sx}', V(ank.x, ank.y - 0.05, 0.015), (0.25, 0.42, 0.03), P['D'], bevel=0.01)
    # Becken, Gürtel, Schurzplatten, Bauch
    loft('becken', [(V(0, 0.0, 0.9), 0.26, 0.17, 3.0), (V(0, 0.0, 1.06), 0.28, 0.19, 3.0)], P['D'], ref=V(1, 0, 0))
    loft('guertel', [(V(0, 0.0, 1.05), 0.28, 0.2, 4.0), (V(0, 0.0, 1.11), 0.28, 0.2, 4.0)], P['L'], sub=1, ref=V(1, 0, 0))
    loft('schrittplatte', [(V(0, -0.2, 1.04), 0.17, 0.03, 3.2), (V(0, -0.205, 0.94), 0.11, 0.03, 3.0),
                           (V(0, -0.19, 0.83), 0.04, 0.022, 2.5)], P['A'], ref=V(1, 0, 0))
    for sx in (-1, 1):
        R = Matrix.Rotation(rad(-8), 3, 'X') @ Matrix.Rotation(rad(14 * sx), 3, 'Z')
        box(f'beinplatte{sx}', V(0.18 * sx, -0.17, 0.97), (0.2, 0.035, 0.22), P['A'], R, bevel=0.014)
        box(f'seitenplatte{sx}', V(0.32 * sx, 0.0, 0.98), (0.035, 0.24, 0.22), P['A'], Matrix.Rotation(rad(12 * sx), 3, 'Y'), bevel=0.014)
    # Bauch wie Mk VII: Brustpanzer bildet unten einen Bogen, darin Kabelpaket aus Querwülsten, seitlich Längskabel
    loft('bauch', [(V(0, 0.0, 1.1), 0.24, 0.16, 3.4), (V(0, 0.0, 1.27), 0.25, 0.17, 3.4)], P['D'], ref=V(1, 0, 0))
    for sx in (-1, 1):
        R = Matrix.Rotation(rad(-24 * sx), 3, 'Z') @ Matrix.Rotation(rad(-6), 3, 'X')
        box(f'brustlappen{sx}', V(0.19 * sx, -0.135, 1.2), (0.15, 0.06, 0.2), P['A'], R, bevel=0.025)
        for j in range(2):
            x = sx * (0.095 + 0.028 * j)
            cyl(f'laengskabel{sx}{j}', V(x, -0.155, 1.105), V(x, -0.155, 1.27), 0.014, 0.014, P['C'], segs=10, bevel=0)
    for i in range(6):
        w = 0.15 - abs(i - 2.5) * 0.008
        box(f'querwulst{i}', V(0, -0.172, 1.122 + i * 0.027), (w, 0.04, 0.021), P['C'], bevel=0.009)
    # Gürtel: Schließe als Platte mit runder Scheibe; Kampfmesser rechts, Granate links
    box('schliessplatte', V(0, -0.212, 1.08), (0.15, 0.03, 0.085), P['T'], bevel=0.008)
    revolve('schnallenscheibe', [(0, 0.012), (0.035, 0.01), (0.045, 0.0), (0.035, -0.01), (0, -0.012)], [P['T']], [0, 0, 0, 0],
            Matrix.Translation(V(0, -0.232, 1.08)) @ Matrix.Rotation(rad(90), 4, 'X'), steps=24)
    cyl('messerscheide', V(-0.25, -0.17, 1.03), V(-0.19, -0.215, 0.83), 0.024, 0.02, P['D'], segs=12)
    ell('messerknauf', V(-0.255, -0.166, 1.05), (0.025, 0.025, 0.025), P['S'], segs=12)
    box('granatentasche', V(0.25, -0.18, 1.0), (0.07, 0.045, 0.085), P['D'], bevel=0.01)
    ell('granate', V(0.25, -0.2, 1.065), (0.026, 0.026, 0.026), P['S'], segs=12)
    box('gesaessplatte', V(0, 0.2, 0.98), (0.42, 0.045, 0.22), P['A'], Matrix.Rotation(rad(10), 3, 'X'), bevel=0.016)
    # Brustpanzer und Adler
    loft('brust', [(V(0, 0.02, 1.25), 0.3, 0.18, 3.4), (V(0, 0.0, 1.36), 0.35, 0.225, 3.2), (V(0, 0.01, 1.52), 0.36, 0.23, 3.3),
                   (V(0, 0.03, 1.63), 0.31, 0.2, 3.6)], P['A'], ref=V(1, 0, 0))
    Ma = (Matrix.Translation(V(0, -0.24, 1.46)) @ Matrix.Rotation(rad(-8), 4, 'X') @ Matrix.Diagonal((0.34, 1, 0.28, 1)))
    emblem('adler', AQUILA, 0.03, P['T'], Ma, mirror=True, bevel=0.004)
    skull('brustschaedel', V(0, -0.262, 1.462), 0.05, P)
    # Kragen, Rucksack mit Schloten
    loft('kragen', [(V(0, 0.04, 1.6), 0.17, 0.14, 2.6), (V(0, 0.07, 1.7), 0.15, 0.12, 2.6)], P['A'], ref=V(1, 0, 0))
    loft('rucksack', [(V(0, 0.33, 1.24), 0.26, 0.1, 4.0), (V(0, 0.34, 1.5), 0.29, 0.11, 4.0), (V(0, 0.33, 1.76), 0.25, 0.1, 4.0)],
         P['A'], ref=V(1, 0, 0))
    box('ruecken_mitte', V(0, 0.39, 1.78), (0.14, 0.12, 0.1), P['A'], bevel=0.02)
    for i in range(3):
        box(f'luefter{i}', V(-0.06 + i * 0.06, 0.45, 1.62), (0.035, 0.02, 0.12), P['D'], bevel=0.005)
    for sx in (-1, 1):
        b0, b1 = V(0.15 * sx, 0.39, 1.66), V(0.165 * sx, 0.48, 1.93)
        cyl(f'schlot{sx}', b0, b1, 0.06, 0.065, P['A'], segs=24)
        for t in (0.35, 0.7):
            cyl(f'schlotring{sx}{t}', b0.lerp(b1, t - 0.03), b0.lerp(b1, t + 0.03), 0.07, 0.07, P['D'], segs=24)
        cyl(f'schlotloch{sx}', b1 - (b1 - b0).normalized() * 0.01, b1 + (b1 - b0).normalized() * 0.005, 0.045, 0.045, P['D'], segs=20)
    # Kopf
    helmet('helm_', V(0, -0.02, 1.775), P, 1.12 * h)
    # Schulterpanzer: links Ordenssymbol, rechts Trupp-Pfeil
    pauldron('schulter_l', V(0.37, 0.0, 1.52), 1, P, scale=(0.92, 0.98, 1.28), icon=(P['W'], 'omega'))
    pauldron('schulter_r', V(-0.37, 0.0, 1.52), -1, P, scale=(0.92, 0.98, 1.28), icon=(P['W'], ARROW))
    # Bolter quer vor der Brust (Mündung zur linken Schulter), Hände per Zwei-Knochen-Arm
    fr = gun_frame(V(-0.04, -0.32, 1.38), V(0.35, -1, 0.05), V(0, 0, 1))
    bolter('bolter_', P, fr)
    o, u, up, r = fr
    hands = {-1: o, 1: o + u * 0.33 + up * 0.02}
    poles = {-1: V(-1, 0.3, -0.8), 1: V(0.6, 0.0, -1)}
    for sx in (-1, 1):
        sh = V(0.34 * sx, 0.02, 1.55)
        el = two_bone(sh, hands[sx], 0.35, 0.38, poles[sx])
        loft(f'oberarm{sx}', [(sh, 0.085, 0.085, 2.4), (el, 0.08, 0.08, 2.4)], P['A'])
        ell(f'ellbogen{sx}', el, (0.06, 0.06, 0.06), P['D'])
        d = (hands[sx] - el).normalized()
        loft(f'unterarm{sx}', [(el + d * 0.04, 0.075, 0.075, 3.0), (el + d * 0.17, 0.09, 0.09, 3.2),
                               (hands[sx] - d * 0.06, 0.085, 0.085, 3.0)], P['A'])
        ell(f'hand{sx}', hands[sx] - d * 0.01, (0.07, 0.075, 0.065), P['A'], Matrix(), segs=20)
    # Reinheitssiegel am rechten Knie und auf der Brust
    for i, (p, n) in enumerate(((V(-0.12, -0.24, 1.36), V(0, -1, 0.1)), (V(-0.18, -0.245, 0.6), V(0, -1, 0.2)))):
        cyl(f'siegel{i}', p, p - n.normalized() * 0.015, 0.03, 0.03, P['R'], segs=16)
        for dx in (-0.012, 0.012):
            box(f'streifen{i}{dx}', p + V(dx, -0.012, -0.075), (0.02, 0.004, 0.11), P['P'], Matrix.Rotation(rad(dx * 300), 3, 'Y'), bevel=0.001)
    return COLL

# ---------- Hilfen für Haut und gebogene Platten ----------

def skin(name, nodes, edges, radii, mat, levels=2):
    """Organischer Körper: Knotengerüst mit Skin-Modifier und Unterteilung (bleibt als Modifier-Stapel)."""
    me = bpy.data.meshes.new(name)
    me.from_pydata([Vector(v) for v in nodes], edges, [])
    ob = bpy.data.objects.new(name, me)
    COLL.objects.link(ob)
    ob.parent = ROOT
    ob.modifiers.new('skin', 'SKIN')
    for i, r in enumerate(radii):
        me.skin_vertices[0].data[i].radius = r
    me.skin_vertices[0].data[0].use_root = True
    sub = ob.modifiers.new('sub', 'SUBSURF')
    sub.levels = sub.render_levels = levels
    ob.modifiers['skin'].use_smooth_shade = True
    me.materials.append(mat)
    me.materials.append(outline_mat())
    so = ob.modifiers.new('umriss', 'SOLIDIFY')
    so.thickness, so.offset, so.use_flip_normals, so.use_rim, so.material_offset = OL, 1.0, True, False, 1
    OUTLINES.append(so)
    return ob


def plate(name, M, rad_, a0, a1, z0, z1, th, mat, nx=8, nz=3, bulge=0.0):
    """Gebogenes Blech: Ausschnitt eines Zylindermantels (Radius rad_, Winkel a0..a1, Höhe z0..z1), mit Dicke."""
    bm = bmesh.new()
    rows = []
    for zi in range(nz + 1):
        z = z0 + (z1 - z0) * zi / nz
        row = []
        for xi in range(nx + 1):
            a = a0 + (a1 - a0) * xi / nx
            r = rad_ + bulge * math.sin(math.pi * zi / nz)
            row.append(bm.verts.new(M @ V(r * math.cos(a), r * math.sin(a), z)))
        rows.append(row)
    for zi in range(nz):
        for xi in range(nx):
            bm.faces.new((rows[zi][xi], rows[zi][xi + 1], rows[zi + 1][xi + 1], rows[zi + 1][xi]))
    bmesh.ops.solidify(bm, geom=bm.faces, thickness=th)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mk(name, bm, [mat], sub=1)


def arm(pre, sh, hand, l1, l2, pole, P, r=(0.085, 0.08, 0.075, 0.09, 0.085), elbow_r=0.06):
    el = two_bone(sh, hand, l1, l2, pole)
    loft(pre + 'oberarm', [(sh, r[0], r[0], 2.4), (el, r[1], r[1], 2.4)], P['A'])
    ell(pre + 'ellbogen', el, (elbow_r, elbow_r, elbow_r), P['D'])
    d = (hand - el).normalized()
    loft(pre + 'unterarm', [(el + d * 0.04, r[2], r[2], 3.0), (el + d * 0.45 * l2, r[3], r[3], 3.2),
                            (hand - d * 0.06, r[4], r[4], 3.0)], P['A'])
    return el, d

# ---------- Terminator ----------

def storm_bolter(pre, P, frame):
    o, u, up, r = frame
    R = Matrix((r, u, up)).transposed()

    def bx(n, a, c, b, s, m, bev=0.008):
        box(pre + n, o + u * a + up * c + r * b, s, m, R, bevel=bev)
    for b in (-0.05, 0.05):
        bx(f'koerper{b}', 0.12, 0.12, b, (0.085, 0.42, 0.12), P['G'])
        bx(f'muendung{b}', 0.35, 0.12, b, (0.09, 0.05, 0.11), P['S'], 0.01)
        bx(f'loch{b}', 0.377, 0.12, b, (0.04, 0.006, 0.04), P['D'], 0.002)
    bx('magazin', 0.06, 0.21, 0.0, (0.09, 0.14, 0.08), P['G'])
    bx('messing', 0.12, 0.12, 0.0, (0.2, 0.08, 0.06), P['T'], 0.004)
    bx('griff', 0.0, 0.0, 0.0, (0.06, 0.07, 0.14), P['G'], 0.01)


def power_fist(pre, P, wrist, d, side):
    """Energiefaust: dicker Handschuh, vier gekrümmte Finger, Daumen, leuchtende Spulen."""
    up = V(0, 0, 1)
    rr = d.cross(up).normalized()
    up = rr.cross(d).normalized()
    R = Matrix((rr, d, up)).transposed()
    c = wrist + d * 0.13
    box(pre + 'faust', c, (0.24, 0.24, 0.22), P['A'], R, bevel=0.03)
    box(pre + 'knoechel', c + d * 0.13 + up * 0.04, (0.25, 0.06, 0.08), P['T'], R, bevel=0.012)
    for i in range(4):
        x = (-0.09 + i * 0.06)
        box(pre + f'finger{i}a', c + rr * x + d * 0.17 - up * 0.01, (0.05, 0.07, 0.07), P['D'], R, bevel=0.01)
        box(pre + f'finger{i}b', c + rr * x + d * 0.19 - up * 0.08, (0.05, 0.05, 0.07), P['D'], R, bevel=0.01)
    box(pre + 'daumen', c + rr * (0.14 * side) + d * 0.05 - up * 0.05, (0.06, 0.12, 0.06), P['D'], R, bevel=0.01)
    for i in (-1, 0, 1):
        cyl(pre + f'spule{i}', c + rr * (0.07 * i) + up * 0.11 - d * 0.06, c + rr * (0.07 * i) + up * 0.12 + d * 0.06,
            0.022, 0.022, P['Q'], segs=12)


def terminator(P):
    begin('Terminator')
    for sx, fy in ((1, -0.06), (-1, 0.08)):
        hip, ank = V(0.19 * sx, 0.0, 0.98), V(0.27 * sx, fy, 0.2)
        knee = two_bone(hip, ank, 0.43, 0.4, V(0, -1, 0))
        loft(f'oberschenkel{sx}', [(hip + V(0, 0, 0.05), 0.17, 0.16, 2.8), ((hip + knee) / 2, 0.18, 0.17, 2.8),
                                    (knee + V(0, 0, 0.05), 0.15, 0.15, 2.6)], P['A'])
        ell(f'kniegelenk{sx}', knee, (0.1, 0.1, 0.09), P['D'])
        kneepad(f'knie{sx}', knee + V(0, -0.12, 0.03), P, size=1.3)
        d = (ank - knee).normalized()
        loft(f'schiene{sx}', [(knee + d * 0.07, 0.15, 0.15, 3.4), (knee + d * 0.22, 0.17, 0.18, 3.6),
                              (ank + V(0, -0.02, 0.04), 0.19, 0.21, 3.8)], P['A'], ref=V(1, 0, 0))
        loft(f'stiefel{sx}', [(V(ank.x, ank.y + 0.16, 0.11), 0.17, 0.11, 4.0), (V(ank.x, ank.y, 0.11), 0.19, 0.12, 4.0),
                              (V(ank.x, ank.y - 0.2, 0.08), 0.17, 0.08, 3.4), (V(ank.x, ank.y - 0.3, 0.055), 0.12, 0.05, 2.8)],
             P['A'], ref=V(1, 0, 0))
        box(f'sohle{sx}', V(ank.x, ank.y - 0.06, 0.02), (0.36, 0.56, 0.04), P['D'], bevel=0.012)
    loft('becken', [(V(0, 0.0, 0.9), 0.27, 0.2, 3.0), (V(0, 0.0, 1.08), 0.3, 0.22, 3.0)], P['D'], ref=V(1, 0, 0))
    loft('guertel', [(V(0, 0.0, 1.06), 0.34, 0.25, 4.0), (V(0, 0.0, 1.14), 0.34, 0.25, 4.0)], P['L'], sub=1, ref=V(1, 0, 0))
    revolve('schnalle', [(0, 0.016), (0.07, 0.014), (0.085, 0.0), (0.07, -0.014), (0, -0.016)], [P['T']], [0, 0, 0, 0],
            Matrix.Translation(V(0, -0.255, 1.1)) @ Matrix.Rotation(rad(90), 4, 'X'), steps=28)
    for sx in (-1, 1):
        box(f'schurz{sx}', V(0.15 * sx, -0.21, 0.93), (0.25, 0.05, 0.32), P['A'], Matrix.Rotation(rad(-8), 3, 'X') @
            Matrix.Rotation(rad(10 * sx), 3, 'Z'), bevel=0.02)
        box(f'seite{sx}', V(0.34 * sx, 0.0, 0.95), (0.05, 0.3, 0.3), P['A'], Matrix.Rotation(rad(12 * sx), 3, 'Y'), bevel=0.02)
    box('gesaess', V(0, 0.22, 0.97), (0.42, 0.05, 0.26), P['A'], Matrix.Rotation(rad(10), 3, 'X'), bevel=0.02)
    loft('bauch', [(V(0, 0.0, 1.12), 0.36, 0.25, 3.4), (V(0, 0.0, 1.26), 0.38, 0.26, 3.4)], P['C'], ref=V(1, 0, 0))
    loft('brust', [(V(0, 0.01, 1.22), 0.32, 0.24, 3.2), (V(0, 0.0, 1.42), 0.42, 0.3, 3.0), (V(0, 0.01, 1.62), 0.44, 0.31, 3.3),
                   (V(0, 0.04, 1.77), 0.38, 0.27, 3.8)], P['A'], ref=V(1, 0, 0))
    Ma = (Matrix.Translation(V(0, -0.315, 1.53)) @ Matrix.Rotation(rad(-6), 4, 'X') @ Matrix.Diagonal((0.42, 1, 0.36, 1)))
    emblem('adler', AQUILA, 0.035, P['T'], Ma, mirror=True, bevel=0.005)
    loft('joch', [(V(0, 0.1, 1.7), 0.3, 0.17, 3.0), (V(0, 0.12, 1.86), 0.27, 0.15, 3.0), (V(0, 0.12, 1.98), 0.2, 0.11, 2.6)],
         P['A'], ref=V(1, 0, 0))
    helmet('helm_', V(0, -0.16, 1.73), P, 1.0)
    loft('rucksack', [(V(0, 0.4, 1.3), 0.3, 0.12, 4.0), (V(0, 0.42, 1.6), 0.32, 0.13, 4.0), (V(0, 0.4, 1.86), 0.27, 0.12, 4.0)],
         P['A'], ref=V(1, 0, 0))
    for sx in (-1, 1):
        b0, b1 = V(0.18 * sx, 0.46, 1.74), V(0.2 * sx, 0.56, 2.08)
        cyl(f'schlot{sx}', b0, b1, 0.08, 0.085, P['A'], segs=24)
        for t in (0.3, 0.65):
            cyl(f'schlotring{sx}{t}', b0.lerp(b1, t - 0.03), b0.lerp(b1, t + 0.03), 0.092, 0.092, P['D'], segs=24)
        cyl(f'schlotloch{sx}', b1 - (b1 - b0).normalized() * 0.01, b1 + (b1 - b0).normalized() * 0.005, 0.06, 0.06, P['D'], segs=20)
    pauldron('schulter_l', V(0.46, 0.02, 1.6), 1, P, scale=(1.18, 1.3, 1.4), tilt=12, icon=(P['K'], CRUX))
    pauldron('schulter_r', V(-0.46, 0.02, 1.6), -1, P, scale=(1.18, 1.3, 1.4), tilt=12, icon=(P['W'], 'omega'))
    big = (0.13, 0.12, 0.12, 0.155, 0.145)
    hr = V(-0.36, -0.5, 1.33)
    el, d = arm('arm_r_', V(-0.42, 0.02, 1.58), hr, 0.33, 0.33, V(-1, 0.5, -0.4), P, big, 0.09)
    ell('hand_r', hr, (0.1, 0.1, 0.1), P['A'])
    storm_bolter('sturmbolter_', P, gun_frame(hr + V(0, -0.02, 0.02), V(0.05, -1, 0.04), V(0, 0, 1)))
    hl = V(0.42, -0.36, 1.16)
    el, d = arm('arm_l_', V(0.42, 0.02, 1.58), hl, 0.33, 0.33, V(1, 0.4, -0.3), P, big, 0.09)
    power_fist('faust_', P, hl, d, 1)
    return COLL

# ---------- Ork-Boy ----------

def ork(P):
    begin('Ork')
    S = toon('orkhaut', (0.12, 0.38, 0.06))
    Cl = toon('orkhose', (0.07, 0.07, 0.08))
    Me = toon('orkeisen', (0.32, 0.3, 0.28), 'metal')
    Rd = toon('orkrot', (0.6, 0.05, 0.03))
    Y = toon('messing', (0.62, 0.42, 0.1), 'metal')
    Le, Bo, D, E = P['L'], P['K'], P['D'], P['E']
    hz = 0.76
    nodes = [(0, 0.04, hz + 0.05), (0, -0.02, hz + 0.28), (0, -0.1, hz + 0.52), (0, -0.26, hz + 0.62),
             (0.4, -0.08, hz + 0.62), (0.56, -0.3, hz + 0.4), (0.42, -0.64, hz + 0.42),       # links (+x): Wumme vorn
             (-0.4, -0.08, hz + 0.62), (-0.62, -0.12, hz + 0.78), (-0.5, -0.28, hz + 1.02)]   # rechts: Spalta auf Kopfhöhe
    edges = [(0, 1), (1, 2), (2, 3), (2, 4), (4, 5), (5, 6), (2, 7), (7, 8), (8, 9)]
    radii = [(0.26, 0.21), (0.3, 0.25), (0.36, 0.29), (0.15, 0.15), (0.2, 0.19), (0.12, 0.12), (0.13, 0.13),
             (0.2, 0.19), (0.12, 0.12), (0.13, 0.13)]
    skin('koerper', nodes, edges, radii, S)
    for sx in (-1, 1):                                                         # Muskeln: Brust, Nacken
        ell(f'brustmuskel{sx}', V(0.15 * sx, -0.3, hz + 0.56), (0.15, 0.09, 0.12), S, Matrix.Rotation(rad(20), 3, 'X'))
        ell(f'nacken{sx}', V(0.25 * sx, -0.06, hz + 0.72), (0.18, 0.16, 0.12), S)
    for i in (6, 9):
        ell(f'faust{i}', V(*nodes[i]), (0.14, 0.14, 0.13), S)
    hc = V(0, -0.44, hz + 0.66)                                                # Kopf tief zwischen den Schultern
    ell('schaedel', hc + V(0, 0.04, 0.04), (0.17, 0.18, 0.135), S, Matrix.Rotation(rad(-18), 3, 'X'))
    for sx in (-1, 1):
        ell(f'braue{sx}', hc + V(0.065 * sx, -0.11, 0.075), (0.085, 0.05, 0.04), S, Matrix.Rotation(rad(-22 * sx), 3, 'Y'))
        ell(f'auge{sx}', hc + V(0.058 * sx, -0.138, 0.035), (0.024, 0.012, 0.016), E)
        cyl(f'ohr{sx}', hc + V(0.12 * sx, -0.02, 0.05), hc + V(0.38 * sx, 0.12, 0.16), 0.065, 0.006, S, segs=12, bevel=0)
        cyl(f'hauer{sx}', hc + V(0.12 * sx, -0.22, -0.1), hc + V(0.14 * sx, -0.27, 0.07), 0.045, 0.004, Bo, segs=12, bevel=0)
    ell('nase', hc + V(0, -0.155, 0.0), (0.06, 0.045, 0.04), S)
    box('kiefer', hc + V(0, -0.12, -0.12), (0.38, 0.3, 0.17), S, Matrix.Rotation(rad(8), 3, 'X'), bevel=0, sub=2)
    box('maul', hc + V(0, -0.22, -0.06), (0.24, 0.05, 0.035), D, bevel=0.005)
    for i in range(6):
        box(f'zahn{i}', hc + V(-0.1 + i * 0.04, -0.25, -0.078), (0.026, 0.02, 0.04), Bo, bevel=0.004)
    for sx, fy in ((1, -0.2), (-1, 0.15)):                                    # kurze, krumme Beine, Hose, Stiefel
        hip, ank = V(0.19 * sx, 0, hz), V(0.32 * sx, fy, 0.16)
        knee = two_bone(hip, ank, 0.34, 0.32, V(0.4 * sx, -1, 0))
        loft(f'hose{sx}', [(hip + V(0, 0, 0.03), 0.16, 0.15, 2.2), (hip.lerp(knee, 0.5), 0.17, 0.16, 2.2),
                           (knee, 0.14, 0.14, 2.2), (knee.lerp(ank, 0.6), 0.13, 0.13, 2.2), (ank + V(0, 0, 0.08), 0.12, 0.12, 2.2)], Cl)
        loft(f'stiefel{sx}', [(V(ank.x, ank.y + 0.13, 0.1), 0.13, 0.1, 3.4), (V(ank.x, ank.y, 0.12), 0.15, 0.12, 3.4),
                              (V(ank.x, ank.y - 0.18, 0.08), 0.14, 0.08, 3.0), (V(ank.x, ank.y - 0.26, 0.06), 0.1, 0.05, 2.6)],
             Le, ref=V(1, 0, 0))
        box(f'sohle{sx}', V(ank.x, ank.y - 0.05, 0.02), (0.28, 0.48, 0.04), D, bevel=0.01)
    loft('guertel', [(V(0, 0.03, hz - 0.03), 0.3, 0.25, 3.0), (V(0, 0.03, hz + 0.1), 0.31, 0.26, 3.0)], Le, sub=1, ref=V(1, 0, 0))
    box('schnalle', V(0, -0.24, hz + 0.035), (0.12, 0.03, 0.09), Y, bevel=0.01)
    box('lendenschurz', V(0, -0.24, hz - 0.17), (0.24, 0.03, 0.32), Rd, Matrix.Rotation(rad(-8), 3, 'X'), bevel=0.01)
    pts = [V(0.36, -0.2, hz + 0.86), V(0.18, -0.42, hz + 0.6), V(-0.05, -0.45, hz + 0.38), V(-0.28, -0.3, hz + 0.12)]
    loft('patronengurt', [(p, 0.05, 0.016, 3.0) for p in pts], Le, n=10, sub=1, ref=V(0, -1, 0))
    for i in range(7):
        t = i / 6
        p = pts[0].lerp(pts[-1], t) + V(0, -0.06 * math.sin(math.pi * t) - 0.025, 0)
        box(f'patrone{i}', p, (0.022, 0.022, 0.06), Y, Matrix.Rotation(rad(-40), 3, 'Y'), bevel=0.004)
    pauldron('schulterblech', V(0.42, -0.06, hz + 0.62), 1, {'A': Me, 'T': Rd}, scale=(0.95, 1.0, 0.85), tilt=25)
    w9 = V(*nodes[9])                                                          # Spalta hoch über dem Kopf
    loft('griff', [(w9 - V(0, 0, 0.18), 0.03, 0.03, 2), (w9 + V(0, 0.01, 0.28), 0.03, 0.03, 2)], Le, n=10, sub=1)
    blade = [(0.0, 0.0), (0.2, 0.02), (0.24, 0.12), (0.2, 0.15), (0.24, 0.22), (0.26, 0.42), (0.1, 0.5), (0.0, 0.46)]
    Mb = Matrix.Translation(w9 + V(-0.02, 0.0, 0.2)) @ Matrix.Rotation(rad(12), 4, 'Y') @ Matrix.Diagonal((-1, 1, 1, 1))
    emblem('klinge', blade, 0.03, Me, Mb, bevel=0.004)
    box('klingenfarbe', w9 + V(-0.12, -0.02, 0.52), (0.14, 0.034, 0.05), Rd, Matrix.Rotation(rad(12), 3, 'Y'), bevel=0.004)
    w6 = V(*nodes[6])                                                          # Wumme nach vorn
    fr = gun_frame(w6 + V(0, -0.02, 0.05), V(-0.12, -1, 0.06), V(0, 0, 1))
    o, u, up, r = fr
    R = Matrix((r, u, up)).transposed()
    box('wumme', o + u * 0.14 + up * 0.08, (0.11, 0.36, 0.15), Me, R, bevel=0.012)
    cyl('wummenlauf', o + u * 0.3 + up * 0.1, o + u * 0.5 + up * 0.1, 0.05, 0.05, D, segs=16)
    cyl('trommel', o + u * 0.14 - up * 0.04 - r * 0.07, o + u * 0.14 - up * 0.04 + r * 0.07, 0.07, 0.07, Y, segs=20)
    return COLL

# ---------- Bühne ----------

def instance(coll, loc, rz=0.0, s=1.0):
    o = bpy.data.objects.new(coll.name + '_Instanz', None)
    o.instance_type = 'COLLECTION'
    o.instance_collection = coll
    o.location, o.rotation_euler, o.scale = loc, (0, 0, rz), (s, s, s)
    SC.collection.objects.link(o)
    return o


def hide_sources(*colls):
    for c in colls:
        bpy.context.view_layer.layer_collection.children[c.name].exclude = True


def render(name, w, h, samples=64):
    path = os.path.join(outdir, f'unit_{name}.png')
    if quick:
        w, h, samples = w // 2, h // 2, 16
    SC.view_settings.view_transform = 'Standard'
    kit.render(path, w, h, samples=samples)


def stage(sky=True):
    kit.world((0.3, 0.55, 0.95), (0.85, 0.88, 0.92), 0.8, horizon_at=0.35)
    kit.sun((55, 0, -60), 3.4, (1.0, 0.96, 0.88), 2)
    gb = kit.Builder('Boden')
    gb.box(0, 0, -0.5, 400, 400, 1.0, toon('sand', (0.8, 0.68, 0.46)))
    gb.finish()


def ruin(x, y, rz, s=1.0, seed=0):
    rnd = random.Random(seed)
    m = toon('stein', (0.42, 0.42, 0.45))
    b = kit.Builder('Ruine')
    R = Matrix.Rotation(rz, 3, 'Z')

    def Pp(dx, dy=0.0):
        v = R @ V(dx, dy, 0)
        return x + v.x, y + v.y
    for sx, hh in ((-1, 2.7 * s), (1, rnd.uniform(1.3, 2.0) * s)):
        px, py = Pp(sx * 0.95 * s)
        b.box(px, py, hh / 2, 0.45 * s, 0.5 * s, hh, m, rz=rz)
        b.box(px, py, 0.2 * s, 0.62 * s, 0.66 * s, 0.4 * s, m, rz=rz)
    px, py = Pp(-0.5 * s)
    b.box(px, py, 2.95 * s, 1.15 * s, 0.4 * s, 0.28 * s, m, rz=rz, ry=rad(-38))
    px, py = Pp(0)
    b.box(px, py, 0.35 * s, 1.5 * s, 0.36 * s, 0.7 * s, m, rz=rz)
    for _ in range(8):
        px, py = Pp(rnd.uniform(-1.7, 1.7) * s, rnd.uniform(-1.1, 1.1) * s)
        e = rnd.uniform(0.15, 0.4) * s
        b.box(px, py, e / 2, e, e * rnd.uniform(0.7, 1.4), e, m, rz=rnd.uniform(0, 3), rx=rnd.uniform(-0.3, 0.3))
    ob = b.finish(bevel=0.03)
    ob.data.materials.append(outline_mat())
    so = ob.modifiers.new('umriss', 'SOLIDIFY')
    so.thickness, so.offset, so.use_flip_normals, so.use_rim = OL * 1.5, 1.0, True, False
    so.material_offset = len(ob.data.materials) - 1
    OUTLINES.append(so)
    return ob


P = palette()
todo = what.split(',') if what != 'alles' else ['blatt_marine', 'blatt_terminator', 'blatt_ork', 'aufstellung', 'nah', 'tisch']
NEED = {'blatt_marine': ['Marine'], 'blatt_terminator': ['Terminator'], 'blatt_ork': ['Ork'], 'nah': ['Marine']}
BUILD = {'Marine': marine, 'Terminator': terminator, 'Ork': ork}
names = sorted({n for t in todo for n in NEED.get(t, ['Marine', 'Terminator', 'Ork'])})
coll = {}
for n in names:
    coll[n] = BUILD[n](P)
hide_sources(*coll.values())
stage()
props = []


def clear():
    for o in [o for o in SC.collection.objects if o.instance_type == 'COLLECTION'] + props:
        bpy.data.objects.remove(o)
    props.clear()


for t in todo:
    clear()
    for so in OUTLINES:
        so.thickness = OL
    if t.startswith('blatt_'):
        n = {'blatt_marine': 'Marine', 'blatt_terminator': 'Terminator', 'blatt_ork': 'Ork'}[t]
        sp = 1.6 if n == 'Marine' else 1.95
        for i, rz in enumerate((0, 90, 180, -35)):
            instance(coll[n], V((-1.5 + i) * sp, 0, 0), rad(rz))
        kit.camera((0, -20, 1.15), (0, 0, 1.15), ortho=6.6 if n == 'Marine' else 8.0)
        render(t, 1600, 820)
    elif t == 'aufstellung':
        for n, x, y, rz in (('Ork', -1.8, 0.1, 28), ('Marine', 0.0, 0.0, -42), ('Terminator', 1.9, 0.15, -30)):
            instance(coll[n], V(x, y, 0), rad(rz))
        props.append(ruin(0.3, 3.4, 0.0, 1.0, seed=1))
        kit.camera((0.2, -6.9, 1.85), (0.1, 0, 1.12), lens=44)
        render('aufstellung', 1400, 900)
    elif t == 'nah':
        instance(coll['Marine'], V(0, 0, 0), rad(-22))
        props.append(ruin(0.6, 3.0, 0.0, 1.0, seed=2))
        kit.camera((-0.95, -3.1, 1.8), (0.02, 0, 1.38), lens=52)
        render('nah', 900, 1100)
    elif t == 'tisch':
        T = V(0, 0, 0)
        rnd = random.Random(3)
        for sy in (-3.4, 3.4):
            for row in range(2):
                for col in range(5):
                    instance(coll['Marine'], V(-5.6 + row * 0.95, sy + (col - 2) * 1.05, 0), rad(90 + rnd.uniform(-8, 8)))
        for y in (-1.4, 0.0, 1.4):
            instance(coll['Terminator'], V(-3.4, y, 0), rad(90))
        spots = []
        while len(spots) < 30:
            x, y = rnd.uniform(3.2, 8.5), rnd.uniform(-6.8, 6.8)
            if all((x - a) ** 2 + (y - b) ** 2 > 0.9 for a, b in spots):
                spots.append((x, y))
                instance(coll['Ork'], V(x, y, 0), rad(-90 + rnd.uniform(-25, 25)), rnd.uniform(0.94, 1.06))
        props += [ruin(0.4, -3.6, rad(90), 0.9, seed=3), ruin(-0.6, 3.9, rad(80), 1.0, seed=5), ruin(1.2, 0.3, rad(100), 0.7, seed=8)]
        for so in OUTLINES:
            so.thickness = 0.03
        kit.camera((-3, -20, 16), (0, 0, 0.5), lens=35)
        render('tisch', 1400, 790)
print('FERTIG', what)
