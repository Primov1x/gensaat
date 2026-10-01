# Entwurf 1: Stadtansicht wie ein Browserspiel. Rendert die Makropole mit festen Bauplätzen und schreibt
# eine JSON-Datei mit Bauplätzen (Bild-Pixel), Rauchquellen und Fensterlichtern für die Animation im Browser.
import sys, os, bpy, math, random
sys.path.insert(0, os.path.dirname(__file__))
import kit, buildings as B
from mathutils import Vector

out_png, out_json, W, H = sys.argv[-4], sys.argv[-3], int(sys.argv[-2]), int(sys.argv[-1])
kit.reset()
STIL = os.environ.get('GENSAAT_STIL', '')
COMIC = STIL in ('comic', 'dunkel')
DARK = STIL == 'dunkel'
P = B.palette('dunkel' if DARK else 'comic' if COMIC else 'grim')
rnd = random.Random(7)

ground = (kit.noise_mat('asche', (0.05, 0.045, 0.042), (0.09, 0.08, 0.072), 0.035) if DARK else
          kit.noise_mat('asche', (0.2, 0.18, 0.15), (0.28, 0.25, 0.21), 0.035) if COMIC else
          kit.noise_mat('asche', (0.025, 0.024, 0.027), (0.07, 0.064, 0.062), 0.035))
road = (kit.noise_mat('strasse', (0.03, 0.03, 0.035), (0.055, 0.055, 0.06), 0.3) if DARK else
        kit.noise_mat('strasse', (0.11, 0.11, 0.12), (0.16, 0.16, 0.18), 0.3) if COMIC else
        kit.noise_mat('strasse', (0.02, 0.021, 0.024), (0.05, 0.05, 0.055), 0.3, rough=0.34))  # nass, spiegelt leicht
g = kit.Builder('Boden')
g.box(0, 120, -0.5, 900, 700, 1, ground)
g.finish()

# ---------- Bauplätze ----------
COLS = [-44, -22, 0, 22, 44]
ROWS = [0, 25, 50]
LAYOUT = {  # (Spalte, Reihe): (Gebäude, Stufe); Stufe 0 = frei, -1 = verschlossen
    (0, 0): ('quarters', 2), (1, 0): ('farm', 3), (2, 0): (None, 0), (3, 0): ('store', 2), (4, 0): ('mine', 2),
    (0, 1): ('hab', 3), (1, 1): ('forge', 3), (3, 1): ('refinery', 2), (4, 1): ('arena', 2),
    (0, 2): ('astro', 2), (1, 2): ('scriptorium', 3), (2, 2): ('reclusiam', 2), (3, 2): ('apothecarion', 2), (4, 2): ('cells', 2),
}
EXTRA = [((66, 25), ('pad', 2)), ((-66, 25), (None, -1)), ((66, 0), (None, 0))]

plots, smoke, lights, lit = [], [], [], []
pf = kit.Builder('Plattformen')
for (c, r), (key, lvl) in list(LAYOUT.items()) + [(None, e) for e in []]:
    pass
allplots = [((COLS[c], ROWS[r]), v) for (c, r), v in LAYOUT.items()] + EXTRA
for (x, y), (key, lvl) in allplots:
    pf.box(x, y, 0.35, 14, 14, 0.7, P['stone2'])
    pf.box(x, y - 7.2, 0.25, 6, 1.6, 0.5, P['stone2'])  # Stufen zur Straße
    for sx in (-1, 1):
        for sy in (-1, 1):
            pf.cyl(x + sx * 6.6, y + sy * 6.6, 1.2, 0.35, 1.0, P['trim'], segs=8)
    top = 2.0
    if key:
        ob, ex = B.CATALOG[key][1](lvl, P, seed=int(x * 3 + y))
        ob.location = (x, y, 0.7)
        ob.scale = (1.15, 1.15, 1.15)
        top = ex['top'] * 1.15 + 0.7
        k = 1.15
        for p in ex['smoke']:
            smoke.append((x + p[0] * k, y + p[1] * k, p[2] * k + 0.7))
        for p in ex['lights']:
            lights.append((x + p[0] * k, y + p[1] * k, p[2] * k + 0.7))
        if ex.get('fire'):
            f = ex['fire']
            kit.point((x + f[0] * 1.15, y + f[1] * 1.15, f[2] * 1.15 + 1.2), 3000, (1, 0.45, 0.12), 1.0)
        L = list(ob['lit'])
        for i in range(0, len(L), 3):
            lit.append((x + L[i] * 1.15, y + L[i + 1] * 1.15, L[i + 2] * 1.15 + 0.7))
    elif lvl == 0:
        ob, ex = B.plot_empty(P)
        ob.location = (x, y, 0.7)
        top = 13
    else:  # verschlossen: Trümmer
        rb = kit.Builder('Trümmer')
        for k in range(14):
            rb.box(x + rnd.uniform(-5, 5), y + rnd.uniform(-5, 5), 0.9 + rnd.uniform(0, 1.2), rnd.uniform(1, 3), rnd.uniform(1, 3),
                   rnd.uniform(0.6, 2.6), P['stone2'], rz=rnd.uniform(0, 3))
        rb.box(x - 4, y + 3, 3, 1.2, 6, 6, P['stone'])
        rb.finish(bevel=0.05)
        top = 7
    plots.append({'name': B.CATALOG[key][0] if key else ('Freier Bauplatz' if lvl == 0 else 'Verschüttet'), 'key': key,
                  'level': lvl, 'world': (x, y), 'top': top})
pf.finish(bevel=0.04)

# ---------- Straßen, Platz, Denkmal, Laternen ----------
rd = kit.Builder('Straßen')
for y in (12.5, 37.5):
    rd.box(0, y, 0.05, 160, 7, 0.1, road)
for x in (-33, -11, 11, 33):
    rd.box(x, 25, 0.05, 6, 60, 0.1, road)
rd.box(0, -10, 0.05, 160, 7, 0.1, road)
rd.cyl(0, 25, 0.12, 9, 0.24, road, segs=24)
rd.finish()
mon = kit.Builder('Denkmal')
mon.box(0, 25, 1.5, 5, 5, 3, P['stone2'])
mon.box(0, 25, 3.4, 3.4, 3.4, 0.8, P['trim'])
mon.cyl(0, 25, 6.5, 1.0, 5.5, P['stone'], segs=10, r2=0.7)
mon.sphere(0, 25, 9.8, 0.85, P['stone'], segs=12)
for s in (-1, 1):  # Schwingen
    mon.box(s * 1.6, 25, 8.6, 2.6, 0.3, 1.2, P['stone'], ry=s * 0.6)
mon.box(1.2, 24.4, 8.0, 0.3, 0.3, 4.5, P['trim'], rx=0.2)  # Schwert
for a in range(4):
    ang = a * math.pi / 2 + math.pi / 4
    bx, by = 6.5 * math.cos(ang), 25 + 6.5 * math.sin(ang)
    mon.cyl(bx, by, 1.0, 0.5, 2.0, P['metal'], segs=8)
    mon.sphere(bx, by, 2.3, 0.45, P['fire'], segs=8, rings=4)
    kit.point((bx, by, 3.0), 600, (1, 0.5, 0.15), 0.6)
mon.finish(bevel=0.04)
lamp = kit.Builder('Laternen')
for x in range(-66, 70, 22):
    for y in (9.5, 34.5):
        lamp.box(x, y, 2.5, 0.25, 0.25, 5, P['metal'])
        lamp.sphere(x, y, 5.2, 0.3, P['lit'], segs=8, rings=4)
        lights.append((x, y, 5.2))
lamp.finish()

# ---------- Kleinkram: Banner, Kisten, Fässer, Fahrzeuge ----------
banner = kit.mat('g_banner', (0.03, 0.09, 0.36) if COMIC else (0.45, 0.05, 0.04), 0.7)  # Comic: Ordensblau
pr = kit.Builder('Kleinkram')
for (bx, by, bz, bh) in [(44 - 5.9, 50 - 4.7, 9.5, 5), (44 + 5.9, 50 - 4.7, 9.5, 5), (-5, 50 - 4.3, 11, 6), (5, 50 - 4.3, 11, 6),
                         (-44 + 4, 25 - 5.3, 13, 6)]:
    pr.box(bx, by, bz, 1.6, 0.12, bh, banner)
    pr.box(bx, by - 0.05, bz + bh / 2 - 0.4, 1.7, 0.14, 0.3, P['trim'])
    pr.box(bx, by - 0.08, bz, 0.5, 0.1, 0.5, P['trim'])
for k in range(18):
    cx, cy = rnd.choice([(22, -9), (44, -9), (-22, 16), (22, 16), (-8, 37)])
    pr.box(cx + rnd.uniform(-4, 4), cy + rnd.uniform(-1.5, 1.5), 0.5, 1, 1, 1, P['trim'] if k % 3 else P['metal'], rz=rnd.uniform(0, 1))
for k in range(10):
    pr.cyl(-30 + rnd.uniform(-2, 2), 12.5 + rnd.uniform(-2, 2), 0.6, 0.45, 1.2, P['metal'], segs=10)
for (vx, vy, rz) in [(-12, 12.5, 0.0), (30, 37.5, 3.1), (8, -10, 0.1)]:  # Transporter auf den Straßen
    pr.box(vx, vy, 1.4, 5.5, 2.6, 1.8, P['roof'], rz=rz)
    pr.box(vx + 1.6, vy, 2.5, 2.2, 2.2, 0.8, P['roof'], rz=rz)
    pr.box(vx, vy, 0.5, 5.8, 2.9, 0.8, P['metal'], rz=rz)
    pr.box(vx + 2.8 if rz < 1 else vx - 2.8, vy, 1.6, 0.1, 1.8, 0.35, P['lit'], rz=rz)
pr.finish(bevel=0.03)

# ---------- Mauer mit Türmen ----------
wall = kit.Builder('Mauer')
for x in range(-88, 89, 8):
    if abs(x) < 6:
        continue
    wall.box(x, 66, 6, 8.2, 3.5, 12, P['stone2'])
    wall.box(x - 2, 64.1, 12.6, 1.6, 0.8, 1.2, P['stone2'])
    wall.box(x + 2, 64.1, 12.6, 1.6, 0.8, 1.2, P['stone2'])
for x in (-88, -44, 0, 44, 88):
    wall.cyl(x, 66, 9, 4.2 if x else 5.2, 18, P['stone'], segs=8)
    wall.cyl(x, 66, 22, 4.8 if x else 5.8, 8, P['roof'], segs=8, r2=0.0)
    wall.windows(x - 1, 61.8, 6, 'x', 3, 3, 1, 4, 0.4, 1.0, P['lit'], skip=0.3, seed=x + 100)
wall.box(0, 66, 4, 7, 4.2, 8, P['dark'])  # Tor
for y in range(-16, 66, 8):
    for x in (-88, 88):
        wall.box(x, y, 6, 3.5, 8.2, 12, P['stone2'])
wall.finish(bevel=0.05)

# ---------- Wrack der Schlachtbarke ----------
wr = kit.Builder('Wrack')
wr.box(-125, 120, 14, 26, 90, 22, P['metal'], rz=0.5, rx=0.18)
wr.box(-140, 160, 18, 18, 30, 28, P['stone2'], rz=0.5, rx=0.18)
for k in range(6):
    wr.cyl(-118 + k * 4, 96 + k * 6, 30 + k * 2, 0.6, 14, P['metal'], segs=6, r2=0.1, rx=0.3)
for k in range(40):
    wr.box(-118 + rnd.uniform(-8, 8), 100 + rnd.uniform(0, 60), 10 + rnd.uniform(0, 14), 0.6, 0.12, 0.9, P['lit'], rz=0.5)
wr.finish()

# ---------- Makropole im Hintergrund ----------
def hive_niche(seed=21):
    """Die Basis liegt auf der untersten Terrasse der Makropole: dahinter steigt sie in immer weiter zurückgesetzten
    Stufen bis zur Hauptspitze auf (Strebepfeiler, Fialen, dichte Fensterreihen, Gesimse, Schlote, Rohre)."""
    r_ = random.Random(seed)
    sp = kit.mat('d_spitze', (0.26, 0.22, 0.17), 0.8)
    pipe = kit.mat('d_rohr', (0.24, 0.09, 0.04), 0.4, 0.8)
    b = kit.Builder('Makropole')
    y0, z, fy = 76, 0, 76
    for i in range(10):
        w, h = 520 - i * 42, (34 if i == 0 else 38)
        depth = 90 + 12 * i
        b.box(0, fy + depth / 2, z + h / 2, w, depth, h, P['stone2'])
        b.box(0, fy - 0.5, z + h + 0.8, w + 4, 5, 1.8, P['stone'])
        nb = int(w / 14)
        for k in range(nb + 1):
            bx = -w / 2 + k * w / nb
            b.box(bx, fy - 1.6, z + h / 2, 2.6, 3.2, h, P['stone'])
            b.cyl(bx, fy - 1.6, z + h + 3.2, 1.3, 6.4, sp, segs=4, r2=0.0, rz=math.pi / 4)
        for k in range(int(w / 5)):
            ax = -w / 2 + (k + 0.5) * 5
            for row in range(int((h - 4) / 6)):
                if r_.random() < 0.42:
                    wz = z + 3 + row * 6
                    b.box(ax, fy - 0.25, wz + 1.4, 1.6, 0.5, 2.8, P['lit'] if r_.random() < 0.96 else P['red'])
        for k in range(5 if i < 7 else 2):
            cx = r_.uniform(-w / 2 + 25, w / 2 - 25)
            ch = r_.uniform(22, 40)
            b.cyl(cx, fy + 20, z + h + ch / 2, 3.0, ch, P['metal'], segs=12)
            b.cyl(cx, fy + 20, z + h + ch + 0.6, 3.6, 1.4, P['trim'], segs=12)
            smoke.append((cx, fy + 20, z + h + ch + 1))
        for k in range(4):
            px = r_.uniform(-w / 2 + 10, w / 2 - 10)
            b.cyl(px, fy - 3.4, z + h / 2, 1.3, h, pipe, segs=10)
        z += h
        fy += depth
    b.cyl(0, y0 - 0.8, 24, 11, 1.2, P['stone'], segs=32, rx=math.pi / 2)       # Rosette über unserem Tor
    b.cyl(0, y0 - 1.3, 24, 9.5, 1.2, P['lit'], segs=32, rx=math.pi / 2)
    for k in range(12):
        a = 2 * math.pi * k / 12
        b.box(math.cos(a) * 4.8, y0 - 1.8, 24 + math.sin(a) * 4.8, 9.5, 0.6, 0.7, P['stone'], ry=-a)
    yt = fy - 60
    b.cyl(0, yt, z + 60, 40, 120, sp, segs=8, r2=16)
    b.cyl(0, yt, z + 180, 16, 120, sp, segs=8, r2=0.0)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        b.cyl(math.cos(a) * 55, yt + math.sin(a) * 55, z + 45, 10, 90, sp, segs=6, r2=0.0)
    for k in range(60):
        zz = z + r_.uniform(5, 110)
        rr = 40 - 24 * (zz - z) / 120
        a = r_.uniform(math.pi * 1.1, math.pi * 1.9)
        b.box(math.cos(a) * rr, yt + math.sin(a) * rr, zz, 1.6, 1.6, 2.8, P['lit'], rz=a)
    b.sphere(0, yt, z + 242, 3.5, P['red'], segs=10, rings=6)
    b.finish()


def spire_hive(cx, cy, sc, seed=11, smog=None):
    """Makropole wie auf den Artworks: Kegel aus gestuften Ringen voller gotischer Türme, Hauptspitze, Bogenring am
    Fuß, tausende Fensterlichter, Feuerglut unten, Smoggürtel."""
    r_ = random.Random(seed)
    b = kit.Builder('Makropole')
    H, R0, tiers = 360 * sc, 220 * sc, 10
    hh = H * 0.78 / tiers
    for t in range(tiers):
        z0 = hh * t
        r = R0 * (1 - t / tiers) ** 1.15 + 14 * sc
        b.cyl(cx, cy, z0 + hh / 2, r, hh, P['stone2'], segs=28, r2=r * 0.9)
        for k in range(int(r * hh / (60 * sc * sc)) + 4):
            a = r_.uniform(math.pi * 1.05, math.pi * 1.95)
            b.box(cx + math.cos(a) * r * 0.97, cy + math.sin(a) * r * 0.97, z0 + r_.uniform(0.1, 0.9) * hh, 1.3 * sc, 1.3 * sc,
                  2.2 * sc, P['lit'], rz=a)
        n = max(8, int(2 * math.pi * r / (15 * sc)))
        for k in range(n):
            a = 2 * math.pi * k / n + r_.uniform(-0.04, 0.04)
            if math.sin(a) > 0.45:
                continue
            tw, th = r_.uniform(5, 12) * sc, r_.uniform(0.9, 2.4) * hh
            tx, ty = cx + math.cos(a) * r * 0.96, cy + math.sin(a) * r * 0.96
            b.box(tx, ty, z0 + th / 2, tw, tw, th, P['stone'], rz=a)
            b.cyl(tx, ty, z0 + th + tw * 0.8, tw * 0.75, tw * 1.6, P['roof'], segs=4, r2=0.0, rz=a + math.pi / 4)
            ox, oy, lx, ly = math.cos(a), math.sin(a), -math.sin(a), math.cos(a)
            for w in range(int(th / (5 * sc))):
                if r_.random() < 0.6:
                    u = r_.uniform(-0.3, 0.3) * tw
                    b.box(tx + ox * tw * 0.52 + lx * u, ty + oy * tw * 0.52 + ly * u, z0 + r_.uniform(0.1, 0.9) * th,
                          1.2 * sc, 1.2 * sc, 2.2 * sc, P['lit'] if r_.random() < 0.95 else P['red'], rz=a)
    zt = hh * tiers
    sp = kit.mat('d_spitze', (0.26, 0.22, 0.17), 0.8)
    b.cyl(cx, cy, zt + 50 * sc, 18 * sc, 100 * sc, sp, segs=8, r2=8 * sc)
    b.cyl(cx, cy, zt + 145 * sc, 8 * sc, 90 * sc, sp, segs=8, r2=0.0)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        b.cyl(cx + math.cos(a) * 30 * sc, cy + math.sin(a) * 30 * sc, zt + 35 * sc, 7 * sc, 70 * sc, sp, segs=6, r2=0.0)
    for k in range(40):                                   # Fenster die Hauptspitze hinauf, Leuchtfeuer oben
        zz = zt + r_.uniform(5, 95) * sc
        a = r_.uniform(math.pi * 1.1, math.pi * 1.9)
        rr = (18 - 10 * (zz - zt) / (100 * sc)) * sc
        b.box(cx + math.cos(a) * rr, cy + math.sin(a) * rr, zz, 1.3 * sc, 1.3 * sc, 2.2 * sc, P['lit'], rz=a)
    b.sphere(cx, cy, zt + 192 * sc, 3 * sc, P['red'], segs=10, rings=6)
    for k in range(72):                                   # Bogenring am Fuß
        a = 2 * math.pi * k / 72
        if math.sin(a) > 0.3:
            continue
        rr = R0 * 1.12
        b.box(cx + math.cos(a) * rr, cy + math.sin(a) * rr, 22 * sc, 7 * sc, 7 * sc, 44 * sc, P['stone'], rz=a)
        a2 = a + math.pi / 72
        b.box(cx + math.cos(a2) * rr, cy + math.sin(a2) * rr, 47 * sc, 2 * math.pi * rr / 72 + 2, 8 * sc, 7 * sc, P['stone2'], rz=a2 + math.pi / 2)
    for k in range(5):                                    # Glut am Fuß
        a = math.pi * (1.2 + 0.15 * k)
        fx, fy = cx + math.cos(a) * R0 * 1.02, cy + math.sin(a) * R0 * 1.02
        b.sphere(fx, fy, 6 * sc, 9 * sc, P['fire'], segs=10, rings=6)
        kit.point((fx, fy - 30 * sc, 30 * sc), 160000 * sc * sc, (1, 0.42, 0.12), 20 * sc)
    b.finish()
    if smog:
        sm = kit.Builder('Smoggürtel')
        for (f, th_) in ((0.3, 30), (0.55, 24), (0.75, 18)):
            t = f * tiers
            r = R0 * (1 - t / tiers) ** 1.15 + 14 * sc
            sm.cyl(cx, cy, f * H * 0.78, r * 1.45, th_ * sc, smog, segs=32)
        sm.finish()


if not DARK:
    hv = kit.Builder('Makropole')
    tiers = [(110, 34), (88, 34), (70, 34), (54, 34), (40, 30), (28, 30), (18, 26)]
    z = 0
    for i, (w, h) in enumerate(tiers):
        fy = 230 - w * 0.4  # Vorderkante
        hv.box(0, 230, z + h / 2, w, w * 0.8, h, P['stone2'])
        hv.box(0, 230, z + h, w + 4, w * 0.8 + 4, 1.4, P['stone'])
        nb = max(3, int(w / 11))
        for k in range(nb + 1):  # Strebepfeiler mit Fialen
            bx = -w / 2 + k * w / nb
            hv.box(bx, fy - 1.6, z + h / 2, 2.4, 3.2, h, P['stone'])
            hv.cyl(bx, fy - 1.6, z + h + 2.4, 1.3, 4.8, P['stone'], segs=4, r2=0.0, rz=math.pi / 4)
        for k in range(nb):  # dunkle Spitzbögen zwischen den Pfeilern
            ax = -w / 2 + (k + 0.5) * w / nb
            hv.box(ax, fy - 0.15, z + h * 0.42, w / nb * 0.55, 0.4, h * 0.6, P['dark'])
            hv.cyl(ax, fy - 0.15, z + h * 0.72 + w / nb * 0.12, w / nb * 0.39, w / nb * 0.32, P['dark'], segs=4, r2=0.0, rz=math.pi / 4)
        for k in range(int(w * h / 22)):
            wx = rnd.uniform(-w / 2 + 1, w / 2 - 1)
            wz = z + rnd.uniform(2, h - 2)
            hv.box(wx, fy - 0.1, wz, 0.7, 0.2, 1.0, P['lit'] if rnd.random() < 0.93 else P['red'])
        if i in (1, 3, 5):
            for k in range(3):
                cx = -w / 3 + k * w / 3
                hv.cyl(cx, 230 + w * 0.2, z + h + 10, 2.4, 20, P['metal'], segs=8)
                hv.cyl(cx, 230 + w * 0.2, z + h + 20.6, 2.9, 1.2, P['trim'], segs=8)
                smoke.append((cx, 230 + w * 0.2, z + h + 21))
        z += h
    hv.cyl(0, 230, z + 30, 6, 60, P['stone2'], segs=8, r2=1.5)
    hv.sphere(0, 230, z + 62, 2.2, P['red'], segs=8, rings=4)
    lights.append((0, 230, z + 62))
    for sx in (-1, 1):  # Brücken zu den Nachbartürmen
        hv.box(sx * 120, 250, 70, 140, 5, 4, P['stone2'], rz=sx * 0.25)
    hv.finish(bevel=0.08)
    for (hx, hy, s) in [(-210, 300, 0.7), (230, 320, 0.8), (-90, 420, 0.55), (120, 460, 0.6), (330, 260, 0.45)]:
        sb = kit.Builder('Ferne Makropole')
        zz = 0
        for (w, h) in tiers[:5]:
            sb.box(hx, hy, zz + h * s / 2, w * s, w * s * 0.8, h * s, P['stone2'])
            for k in range(int(w * h * s / 60)):
                sb.box(hx + rnd.uniform(-w * s / 2, w * s / 2), hy - w * s * 0.4 - 0.1, zz + rnd.uniform(1, h * s - 1), 0.8, 0.2, 1.0, P['lit'])
            zz += h * s
        sb.cyl(hx, hy, zz + 20 * s, 4 * s, 40 * s, P['stone2'], segs=8, r2=1.0)
        sb.finish()

# ---------- Steampunk: Rohre, Zahnräder, Kessel, Schlote, Uhr, Luftschiffe ----------
if COMIC:
    import bmesh
    from mathutils import Matrix
    k = 0.5 if DARK else 1.0
    brass = kit.mat('s_brass', (0.72 * k, 0.47 * k, 0.12 * k), 0.35, 0.9)
    copper = kit.mat('s_copper', (0.5 * k, 0.17 * k, 0.06 * k), 0.4, 0.8)
    verd = kit.mat('s_verd', (0.14 * k, 0.4 * k, 0.33 * k), 0.6)
    iron = kit.mat('s_iron', (0.05, 0.05, 0.06), 0.5, 0.6)
    cream = kit.mat('s_cream', (0.85 * k, 0.8 * k, 0.66 * k), 0.6)
    bone = kit.mat('s_bone', (0.55, 0.5, 0.38), 0.6)
    st = kit.Builder('Dampf')

    def ell(b, c, r, m, rot=(0, 0, 0)):
        from mathutils import Euler
        mt = Matrix.Translation(c) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*r, 1))
        b._faces(bmesh.ops.create_uvsphere(b.bm, u_segments=20, v_segments=10, radius=1.0, matrix=mt)['verts'], m)

    def gear(b, x, y, z, r, m, th=0.6):
        """Zahnrad in der x-z-Ebene, Blick nach -y: Scheibe, Zähne, Nabe, fünf Löcher."""
        n = max(10, int(r * 3.2))
        b.cyl(x, y, z, r, th, m, segs=max(20, n * 2), rx=math.pi / 2)
        for i in range(n):
            a = 2 * math.pi * i / n
            b.box(x + math.cos(a) * r * 1.07, y, z + math.sin(a) * r * 1.07, r * 0.18, th, r * 0.16, m, ry=-a)
        b.cyl(x, y - th * 0.3, z, r * 0.26, th * 1.6, brass, segs=14, rx=math.pi / 2)
        for i in range(5):
            a = 2 * math.pi * i / 5 + 0.3
            b.cyl(x + math.cos(a) * r * 0.6, y - th * 0.52, z + math.sin(a) * r * 0.6, r * 0.16, 0.06, iron, segs=12, rx=math.pi / 2)

    def valve(b, x, y, z, r):
        b.cyl(x, y, z, r, 0.18, brass, segs=16, rx=math.pi / 2)
        b.cyl(x, y - 0.05, z, r * 0.8, 0.22, iron, segs=16, rx=math.pi / 2)
        for a in (0, math.pi / 3, 2 * math.pi / 3):
            b.box(x, y - 0.1, z, r * 1.8, 0.12, 0.14, brass, ry=a)

    # Rohrleitungen beidseits der Querstraßen, auf Stützen, mit Flanschen und Ventilen
    for py in (9.0, 16.0, 34.0, 41.0):
        st.cyl(0, py, 2.6, 0.55, 150, copper, segs=12, ry=math.pi / 2)
        for x in range(-72, 73, 6):
            st.cyl(x, py, 2.6, 0.72, 0.35, brass, segs=12, ry=math.pi / 2)
        for x in range(-72, 73, 12):
            st.box(x, py, 1.15, 0.45, 0.5, 2.3, iron)
    for x in (-50, -6, 30, 60):
        valve(st, x, 8.2, 2.6, 0.85)
    for (x, y) in ((-37.5, 16), (14.5, 41), (37.5, 9), (-14.5, 34)):  # Steigrohre in die Gebäude
        st.cyl(x, y, 6.5, 0.45, 8, copper, segs=10)
        st.cyl(x, y, 10.6, 0.6, 0.4, brass, segs=10)
    # Schlote hinter der letzten Reihe und an den Seiten (Dampf im Browser)
    for (cx, cy, hgt) in ((-60, 60, 34), (-28, 60.5, 40), (28, 60.5, 38), (60, 60, 30), (-78, 40, 26), (78, 12, 28)):
        st.cyl(cx, cy, hgt / 2, 1.7, hgt, iron, segs=14, r2=1.25)
        for k in range(3):
            st.cyl(cx, cy, hgt * (0.3 + 0.25 * k), 1.7 - 0.45 * (0.3 + 0.25 * k) + 0.2, 0.7, brass, segs=14)
        st.cyl(cx, cy, hgt + 0.5, 1.6, 1.4, brass, segs=14, r2=1.9)
        smoke.append((cx, cy, hgt + 1.6))
    # Kessel mit Kuppel und Bändern
    for (bx, by, n) in ((-74, 54, 3), (74, 50, 3), (-74, 2, 2), (52, 60, 2)):
        for k in range(n):
            x = bx + (k - (n - 1) / 2) * 5.2
            st.cyl(x, by, 4.5, 2.2, 9, copper, segs=16)
            ell(st, Vector((x, by, 9)), (2.2, 2.2, 1.6), brass)
            for zz in (2.0, 5.0, 8.0):
                st.cyl(x, by, zz, 2.32, 0.35, brass, segs=16)
            st.cyl(x, by, 11.4, 0.35, 2.4, iron, segs=8)
    # Zahnräder an der Mauer und groß an der Makropole
    for x in (-66, -22, 22, 66):
        gear(st, x, 63.4, 7.5, 3.2, brass)
    if not DARK:
        gear(st, -30, 192, 52, 10, brass, 1.4)
        gear(st, -12.5, 191.6, 44, 6, copper, 1.2)
        gear(st, 26, 192, 50, 8, brass, 1.4)
        gear(st, 0, 205.5, 120, 9, brass, 1.4)
        for x in (-40, -15, 15, 40):  # Rohre die Fassade hoch
            st.cyl(x, 184, 51, 1.6, 102, copper, segs=12)
            for zz in range(8, 100, 12):
                st.cyl(x, 184, zz, 1.9, 0.8, brass, segs=12)
    # Uhr am Mittelturm
    st.cyl(0, 60.3, 12.5, 3.4, 0.35, brass, segs=32, rx=math.pi / 2)
    st.cyl(0, 60.0, 12.5, 3.0, 0.35, cream, segs=32, rx=math.pi / 2)
    st.box(0.55, 59.75, 13.5, 0.3, 0.12, 2.3, iron, ry=-0.5)
    st.box(-0.6, 59.75, 12.1, 0.3, 0.12, 1.6, iron, ry=-2.0)
    for i in range(12):
        a = 2 * math.pi * i / 12
        st.box(math.cos(a) * 2.55, 59.78, 12.5 + math.sin(a) * 2.55, 0.25, 0.1, 0.45, iron, ry=-a)
    st.finish(bevel=0.04)

    def airship(x, y, z, s, rz=0.0):
        """Luftschiff: Hülle mit Messingringen, Leitwerk, Gondel mit Fenstern, Propeller."""
        a = kit.Builder('Luftschiff')
        ell(a, Vector((0, 0, 0)), (14 * s, 4.6 * s, 4.6 * s), cream)
        for k in (-8, -3, 2, 7):
            a.cyl(k * s, 0, 0, 4.4 * s * (1 - (k / 14) ** 2) ** 0.5 + 0.1 * s, 0.5 * s, brass, segs=24, ry=math.pi / 2)
        a.box(-13 * s, 0, 2.6 * s, 3.2 * s, 0.25 * s, 3.0 * s, copper)
        a.box(-13 * s, 0, 0, 3.2 * s, 6.5 * s, 0.25 * s, copper)
        a.box(0, 0, -5.9 * s, 7 * s, 2.2 * s, 1.7 * s, iron)
        for k in range(5):
            a.box((-2.4 + k * 1.2) * s, -1.12 * s, -5.8 * s, 0.6 * s, 0.05 * s, 0.6 * s, P['lit'])
        for dx in (-2.5, 2.5):
            a.cyl(dx * s, 0, -4.6 * s, 0.12 * s, 1.6 * s, iron, segs=6)
        a.cyl(-4 * s, 0, -5.9 * s, 0.5 * s, 1.0 * s, brass, segs=10, ry=math.pi / 2)
        a.box(-4.6 * s, 0, -5.9 * s, 0.12 * s, 0.25 * s, 3.4 * s, iron)
        a.box(-4.6 * s, 0, -5.9 * s, 0.12 * s, 3.4 * s, 0.25 * s, iron)
        ob = a.finish(loc=(x, y, z), rot=rz, bevel=0.03)
        return ob
    airship(-38, 150, 64, 1.25, 0.25)
    airship(95, 300, 112, 1.6, -0.3)
    sk = kit.Builder('Totenkopf')  # Totenkopf über dem Tor, Schädel an den Türmen
    for (x, z, s_) in ((0, 21, 2.4), (-44, 16, 1.2), (44, 16, 1.2), (-88, 18, 1.4), (88, 18, 1.4)):
        y = 66 - (5.4 if x == 0 else 4.5)
        ell(sk, Vector((x, y, z + 0.3 * s_)), (1.0 * s_, 0.8 * s_, 0.95 * s_), bone)
        sk.box(x, y - 0.1 * s_, z - 0.7 * s_, 1.1 * s_, 0.8 * s_, 0.55 * s_, bone)
        for sx in (-1, 1):
            ell(sk, Vector((x + 0.38 * sx * s_, y - 0.72 * s_, z + 0.2 * s_)), (0.26 * s_, 0.12 * s_, 0.28 * s_), iron)
        if x == 0:
            for sx in (-1, 1):
                sk.box(x + sx * 4.2, y + 0.2, z + 0.4, 5.5, 0.4, 1.4, bone, ry=sx * -0.35)
                sk.box(x + sx * 3.6, y + 0.2, z - 0.9, 4.2, 0.4, 1.0, bone, ry=sx * -0.2)
    sk.finish(bevel=0.05)

# ---------- Licht, Himmel, Kamera ----------
kit.world((0.02, 0.018, 0.04), (0.5, 0.16, 0.06), 0.8, horizon_at=0.55)
kit.fog_box((0, 260, 70), (1400, 700, 180), 0.0008, (0.5, 0.25, 0.17), 0.6)
kit.sun((68, 0, 150), 4.5, (1, 0.55, 0.3), 2)      # warmes Gegenlicht von hinten links (Abendsonne über der Makropole)
kit.sun((50, 0, -20), 0.9, (0.45, 0.55, 0.85), 8)  # kühles Fülllicht von vorn
kit.point((-22, 22, 6), 1500, (1, 0.5, 0.2), 2)
kit.point((-44, 48, 26), 900, (0.4, 0.7, 1), 1)
cam = kit.camera((0, -66, 40), (0, 30, 9), lens=32)
if COMIC:  # Probe: derselbe Ort im Comic-Stil der Figuren
    for o in [o for o in bpy.context.scene.objects if o.type == 'LIGHT' and o.data.type == 'SUN']:
        bpy.data.objects.remove(o)
    fog = bpy.data.materials.get('Dunst')
    v = next(n for n in fog.node_tree.nodes if n.type == 'PRINCIPLED_VOLUME') if fog else None
    if DARK:  # grimdark nach Artworks: Makropolen-Spitze im Smog, fahler Himmel, Glut am Fuß
        smog = bpy.data.materials.new('Smog')
        smog.use_nodes = True
        snt = smog.node_tree
        for n in list(snt.nodes):
            if n.type != 'OUTPUT_MATERIAL':
                snt.nodes.remove(n)
        sv = snt.nodes.new('ShaderNodeVolumePrincipled')
        sv.inputs['Density'].default_value = 0.004
        sv.inputs['Color'].default_value = (0.45, 0.35, 0.16, 1)
        snt.links.new(sv.outputs['Volume'], next(n for n in snt.nodes if n.type == 'OUTPUT_MATERIAL').inputs['Volume'])
        hive_niche()  # unsere Basis auf einem Sims der Makropole
        bpy.data.objects.remove(bpy.data.objects['Dunst'])
        kit.fog_box((0, 1000, 50), (5200, 1900, 300), 0.0005, (0.45, 0.3, 0.1), 0.4)  # Smog am Boden, Spitze ragt heraus
        od = kit.Builder('Ödland')
        od.box(0, 2300, -0.7, 9000, 4400, 1.0, ground)
        od.finish()
        bpy.context.scene.eevee.volumetric_end = 2600
        try:
            bpy.context.scene.eevee.shadow_pool_size = '1024'
        except Exception:
            pass
        bpy.context.scene.camera.data.clip_end = 6000
        look = Vector((0, 30, 28)) - bpy.context.scene.camera.location
        bpy.context.scene.camera.rotation_euler = look.to_track_quat('-Z', 'Y').to_euler()
        kit.world((0.2, 0.19, 0.08), (0.6, 0.3, 0.07), 1.0, horizon_at=0.6)  # fahl-gelber Smoghimmel, Spitze als Silhouette
        kit.sun((70, 0, 150), 2.8, (1.0, 0.45, 0.2), 2)
        kit.sun((50, 0, -20), 0.7, (0.45, 0.5, 0.8), 6)
        kit.toonify(0.12, skip=('Dunst', 'Smog'), bands=((0.0, 0.18), (0.3, 0.5), (0.55, 0.85), (0.8, 1.1)))
    else:
        kit.world((0.22, 0.32, 0.6), (0.95, 0.62, 0.38), 1.0, horizon_at=0.55)
        kit.sun((55, 0, -35), 3.6, (1.0, 0.92, 0.8), 2)
        if v:
            v.inputs['Density'].default_value *= 0.4
        kit.toonify(0.12)
    kit.render(out_png, W, H, samples=64, exposure=0.0)
else:
    kit.render(out_png, W, H, samples=96, exposure=0.15)

# ---------- Koordinaten fürs Overlay ----------
for p in plots:
    x, y = p['world']
    corners = [(x - 7, y - 7, 0.7), (x + 7, y - 7, 0.7), (x + 7, y + 7, 0.7), (x - 7, y + 7, 0.7)]
    p['poly'] = kit.project(corners)
    p['label'] = kit.project([(x, y, p['top'] + 2)])[0]
    del p['world']
sm = kit.project(smoke)
li = kit.project(lights)
rnd.shuffle(lit)
lw = kit.project(lit[:260])
kit.save_json(out_json, {'w': W, 'h': H, 'plots': plots, 'smoke': sm, 'lights': li, 'windows': lw})
print('FERTIG', len(plots), 'Bauplätze', len(sm), 'Rauch', len(li), 'Lichter', len(lw), 'Fenster')
