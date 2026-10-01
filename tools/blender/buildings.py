"""Gebäude der Makropole als Blender-Meshes. Jede Funktion baut das Gebäude um (0, 0, 0) auf einer Grundfläche
von etwa 12 × 12 m; level (1–4) macht es größer und reicher. Rückgabe: (Objekt, Extras) mit Punkten für Rauch und
Lichter (Weltkoordinaten relativ zum Gebäude), die der Browser später animiert.

style: 'grim' (Makropole, Abenddunst) oder 'bright' (Handy-Strategie, Tageslicht, kräftige Farben).
"""
import math, random
from kit import Builder, mat, noise_mat


def palette(style):
    if style == 'dunkel':  # Comic-Steampunk, grimdark: dunkler Stein, stumpfes Kupfer und Messing, glühende Fenster
        return {
            'stone': noise_mat('d_stone', (0.085, 0.08, 0.085), (0.15, 0.14, 0.14), 0.8), 'stone2': noise_mat('d_stone2', (0.045, 0.043, 0.048), (0.08, 0.075, 0.08), 0.8),
            'trim': mat('d_trim', (0.42, 0.28, 0.08), 0.3, 0.9), 'roof': mat('d_roof', (0.24, 0.08, 0.035), 0.45, 0.6),
            'roof2': mat('d_roof2', (0.06, 0.17, 0.14), 0.5), 'metal': mat('d_metal', (0.06, 0.06, 0.07), 0.4, 0.85),
            'lit': mat('d_lit', (1, 0.7, 0.3), 0.4, 0, (1, 0.62, 0.22), 4.0),
            'green': mat('d_green', (0.3, 0.9, 0.35), 0.3, 0, (0.3, 1, 0.35), 3.0),
            'blue': mat('d_blue', (0.4, 0.75, 1), 0.3, 0, (0.4, 0.8, 1), 6.0),
            'red': mat('d_red', (1, 0.2, 0.15), 0.3, 0, (1, 0.2, 0.1), 6.0),
            'fire': mat('d_fire', (1, 0.5, 0.1), 0.3, 0, (1, 0.42, 0.08), 10.0),
            'white': mat('d_white', (0.42, 0.4, 0.37), 0.6), 'sand': mat('d_sand', (0.25, 0.2, 0.14), 0.95),
            'glass': mat('d_glass', (0.3, 0.7, 0.35), 0.2, 0, (0.2, 0.7, 0.3), 1.5),
            'dark': mat('d_dark', (0.025, 0.025, 0.03), 0.9),
        }
    if style == 'comic':  # Comic-Steampunk: warmer Stein, Kupfer- und Grünspan-Dächer, Messing, dunkles Eisen
        return {
            'stone': noise_mat('c_stone', (0.3, 0.28, 0.26), (0.42, 0.39, 0.36), 0.8), 'stone2': noise_mat('c_stone2', (0.16, 0.15, 0.15), (0.24, 0.22, 0.21), 0.8),
            'trim': mat('c_trim', (0.72, 0.47, 0.12), 0.3, 0.9), 'roof': mat('c_roof', (0.5, 0.17, 0.06), 0.45, 0.6),
            'roof2': mat('c_roof2', (0.14, 0.4, 0.33), 0.5), 'metal': mat('c_metal', (0.2, 0.2, 0.22), 0.4, 0.85),
            'lit': mat('c_lit', (1, 0.8, 0.45), 0.4, 0, (1, 0.75, 0.35), 4.0),
            'green': mat('c_green', (0.3, 0.9, 0.35), 0.3, 0, (0.3, 1, 0.35), 3.0),
            'blue': mat('c_blue', (0.4, 0.75, 1), 0.3, 0, (0.4, 0.8, 1), 6.0),
            'red': mat('c_red', (1, 0.2, 0.15), 0.3, 0, (1, 0.25, 0.15), 6.0),
            'fire': mat('c_fire', (1, 0.5, 0.1), 0.3, 0, (1, 0.45, 0.1), 10.0),
            'white': mat('c_white', (0.8, 0.78, 0.72), 0.6), 'sand': mat('c_sand', (0.6, 0.5, 0.34), 0.95),
            'glass': mat('c_glass', (0.4, 0.75, 0.45), 0.2, 0, (0.25, 0.7, 0.3), 1.2),
            'dark': mat('c_dark', (0.06, 0.06, 0.07), 0.9),
        }
    if style == 'bright':
        return {
            'stone': noise_mat('b_stone', (0.24, 0.22, 0.2), (0.36, 0.33, 0.3), 0.8), 'stone2': noise_mat('b_stone2', (0.13, 0.125, 0.12), (0.2, 0.19, 0.18), 0.8),
            'trim': mat('b_trim', (0.9, 0.62, 0.15), 0.3, 0.9), 'roof': mat('b_roof', (0.03, 0.12, 0.5), 0.45, 0.1),
            'roof2': mat('b_roof2', (0.55, 0.06, 0.04), 0.5), 'metal': mat('b_metal', (0.2, 0.21, 0.24), 0.4, 0.85),
            'lit': mat('b_lit', (1, 0.8, 0.45), 0.4, 0, (1, 0.75, 0.35), 4.0),
            'green': mat('b_green', (0.3, 0.9, 0.35), 0.3, 0, (0.3, 1, 0.35), 3.0),
            'blue': mat('b_blue', (0.4, 0.75, 1), 0.3, 0, (0.4, 0.8, 1), 6.0),
            'red': mat('b_red', (1, 0.2, 0.15), 0.3, 0, (1, 0.25, 0.15), 6.0),
            'fire': mat('b_fire', (1, 0.5, 0.1), 0.3, 0, (1, 0.45, 0.1), 10.0),
            'white': mat('b_white', (0.86, 0.86, 0.84), 0.6), 'sand': mat('b_sand', (0.72, 0.6, 0.4), 0.95),
            'glass': mat('b_glass', (0.4, 0.75, 0.45), 0.2, 0, (0.25, 0.7, 0.3), 1.2),
            'dark': mat('b_dark', (0.14, 0.13, 0.12), 0.9),
        }
    return {
        'stone': noise_mat('g_stone', (0.07, 0.075, 0.085), (0.15, 0.155, 0.17), 0.6), 'stone2': noise_mat('g_stone2', (0.035, 0.038, 0.045), (0.08, 0.083, 0.095), 0.6),
        'trim': mat('g_trim', (0.62, 0.45, 0.18), 0.3, 0.9), 'roof': mat('g_roof', (0.04, 0.05, 0.07), 0.55, 0.3),
        'roof2': mat('g_roof2', (0.25, 0.08, 0.06), 0.6), 'metal': mat('g_metal', (0.16, 0.16, 0.17), 0.5, 0.8),
        'lit': mat('g_lit', (1, 0.7, 0.35), 0.4, 0, (1, 0.62, 0.25), 16.0),
        'green': mat('g_green', (0.25, 0.8, 0.3), 0.3, 0, (0.25, 0.9, 0.3), 5.0),
        'blue': mat('g_blue', (0.4, 0.75, 1), 0.3, 0, (0.35, 0.7, 1), 14.0),
        'red': mat('g_red', (1, 0.2, 0.15), 0.3, 0, (1, 0.2, 0.1), 14.0),
        'fire': mat('g_fire', (1, 0.5, 0.1), 0.3, 0, (1, 0.4, 0.08), 22.0),
        'white': mat('g_white', (0.62, 0.62, 0.6), 0.6), 'sand': mat('g_sand', (0.35, 0.27, 0.18), 0.95),
        'glass': mat('g_glass', (0.3, 0.7, 0.35), 0.2, 0, (0.2, 0.75, 0.3), 3.0),
        'dark': mat('g_dark', (0.06, 0.055, 0.05), 0.9),
    }


def _gothic_hall(b, P, x, y, w, d, h, seed, roof=True, spire=0.0):
    """Gotische Halle: Wände, Strebepfeiler, hohe Fenster, Satteldach, optional Turmspitze."""
    b.box(x, y, h / 2, w, d, h, P['stone'])
    for i in range(int(w / 2.2) + 1):  # Strebepfeiler an den Längsseiten
        px = x - w / 2 + i * w / max(1, int(w / 2.2))
        for s in (-1, 1):
            b.box(px, y + s * (d / 2 + 0.35), h * 0.42, 0.55, 0.7, h * 0.84, P['stone2'])
            b.cyl(px, y + s * (d / 2 + 0.35), h * 0.84 + 0.6, 0.32, 1.2, P['stone2'], segs=4, r2=0.0, rz=math.pi / 4)
    n = max(2, int(w / 2.2))
    for i in range(n):  # hohe Spitzbogen-Fenster
        fx = x - w / 2 + (i + 0.5) * w / n
        for s in (-1, 1):
            b.box(fx, y + s * (d / 2 + 0.04), h * 0.55, 0.55, 0.08, h * 0.5, P['lit'])
            b.cyl(fx, y + s * (d / 2 + 0.04), h * 0.83, 0.28, 0.5, P['lit'], segs=4, r2=0.0, rx=0, rz=math.pi / 4)
    if roof:
        _ridge(b, P, x, y, w, d, h)
    if spire > 0:
        b.box(x - w / 2 + 1.2, y, h + spire * 0.35, 2.0, 2.0, spire * 0.7, P['stone'])
        b.cyl(x - w / 2 + 1.2, y, h + spire * 0.7 + spire * 0.4, 1.3, spire * 0.8, P['roof'], segs=8, r2=0.0)


def _ridge(b, P, x, y, w, d, h):
    """Satteldach aus zwei schrägen Platten."""
    half = d / 2 + 0.3
    rise = d * 0.45
    ang = math.atan2(rise, half)
    ln = math.hypot(half, rise)
    for s in (-1, 1):
        b.box(x, y + s * half / 2, h + rise / 2, w + 0.4, ln, 0.25, P['roof'], rx=-s * ang)
    b.box(x, y, h + rise + 0.05, w + 0.4, 0.3, 0.3, P['trim'])


def hab_block(level, P, seed=1):
    b = Builder('Hab-Block')
    floors = 3 + level * 3
    h = floors * 1.6
    w, d = 9.0, 9.0
    b.box(0, 0, h / 2, w, d, h, P['stone'])
    b.box(0, 0, 0.6, w + 0.8, d + 0.8, 1.2, P['stone2'])
    for f in range(1, floors):  # Gesimse
        if f % 3 == 0:
            b.box(0, 0, f * 1.6, w + 0.3, d + 0.3, 0.25, P['stone2'])
    b.windows(-w / 2 + 0.9, -d / 2 - 0.02, 1.4, 'x', 7, floors - 1, 1.2, 1.6, 0.45, 0.75, P['lit'], skip=0.35, seed=seed)
    b.windows(w / 2 + 0.02, -d / 2 + 0.9, 1.4, 'y', 7, floors - 1, 1.2, 1.6, 0.45, 0.75, P['lit'], skip=0.35, seed=seed + 7)
    b.crenels(0, 0, h, w, d, P['stone2'], 0.45, 0.45)
    b.box(2, 2, h + 1.5, 0.3, 0.3, 3.0, P['metal'])  # Antenne
    b.box(2, 2, h + 3.0, 0.3, 0.3, 0.3, P['red'])
    return b.finish(bevel=0.05), {'lights': [(2, 2, h + 3.0)], 'smoke': [], 'top': h + 3}


def quarters(level, P, seed=2):
    b = Builder('Knechtsquartier')
    rows = 1 + (level >= 2) + (level >= 4)
    for r in range(rows):
        y = -3.5 + r * 3.5
        hh = 3.2 + level * 0.6
        b.box(0, y, hh / 2, 10, 2.8, hh, P['stone'])
        b.windows(-4.2, y - 1.42, 1.3, 'x', 8, 1 + level // 2, 1.2, 1.4, 0.4, 0.55, P['lit'], skip=0.3, seed=seed + r)
        _ridge(b, P, 0, y, 10, 2.6, hh)
    return b.finish(bevel=0.05), {'lights': [], 'smoke': [(3.5, 3.5, 6)], 'top': 7}


def hydro_farm(level, P, seed=3):
    b = Builder('Hydrokulturfarm')
    n = 1 + level
    for i in range(n):
        y = -4.5 + i * (9.0 / max(1, n - 1)) if n > 1 else 0
        b.box(0, y, 1.1, 10, 1.6, 2.2, P['glass'])
        b.box(0, y, 2.3, 10.2, 1.8, 0.2, P['metal'])
        for k in range(5):
            b.box(-4 + k * 2, y, 1.1, 0.15, 1.7, 2.3, P['metal'])
    for k in range(level):
        b.cyl(5.6, -3 + k * 2, 2.0, 0.8, 4.0, P['metal'], segs=12)
    return b.finish(bevel=0.05), {'lights': [], 'smoke': [], 'top': 4}


def forge(level, P, seed=4):
    b = Builder('Schmiede')
    h = 5 + level * 1.5
    _gothic_hall(b, P, 0, 0, 10, 7, h, seed, roof=True)
    stacks = []
    for k in range(min(3, level)):
        cx, cy = -3 + k * 3, 3.2
        b.cyl(cx, cy, h + 3 + level, 0.6, 6 + level * 2, P['metal'], segs=10)
        b.cyl(cx, cy, h + 6 + level * 2, 0.75, 0.6, P['trim'], segs=10)
        stacks.append((cx, cy, h + 6.5 + level * 2))
    b.box(0, -3.55, 1.6, 2.4, 0.15, 3.2, P['fire'])  # glühendes Tor
    return b.finish(bevel=0.05), {'lights': [(0, -4.5, 1.5)], 'smoke': stacks, 'top': h + 7 + level * 2, 'fire': (0, -4.5, 1.5)}


def refinery(level, P, seed=5):
    b = Builder('Raffinerie')
    tanks = 1 + level
    for k in range(tanks):
        x = -4 + (k % 3) * 4
        y = -2.5 + (k // 3) * 5
        b.cyl(x, y, 2.5, 1.6, 5, P['metal'], segs=14)
        b.sphere(x, y, 5.0, 1.6, P['metal'], segs=14, rings=6, sz=0.4)
        b.box(x, y, 5.6, 0.3, 0.3, 0.6, P['trim'])
    b.box(0, 0, 3.6, 10, 0.4, 0.4, P['trim'])  # Rohre
    b.cyl(4.5, 3.8, 6 + level * 2, 0.35, 12 + level * 4, P['metal'], segs=8)
    flare = (4.5, 3.8, 12 + level * 4 + 0.5)
    b.sphere(*flare, 0.5, P['fire'], segs=8, rings=4)
    return b.finish(bevel=0.05), {'lights': [flare], 'smoke': [flare], 'top': flare[2], 'fire': flare}


def scriptorium(level, P, seed=6):
    b = Builder('Skriptorium')
    _gothic_hall(b, P, 0, 0, 10, 6.5, 5 + level * 1.2, seed, roof=True, spire=4 + level * 2)
    return b.finish(bevel=0.05), {'lights': [], 'smoke': [], 'top': 14 + level * 3}


def apothecarion(level, P, seed=7):
    b = Builder('Apothecarion')
    b.box(0, 0, 2.5, 8, 8, 5, P['white'])
    b.sphere(0, 0, 5, 3.6 + level * 0.4, P['white'], segs=20, rings=10, sz=0.8)
    b.cyl(0, 0, 5 + (3.6 + level * 0.4) * 0.8 + 0.8, 0.3, 1.6, P['trim'], segs=8)
    b.box(0, -4.03, 2.4, 1.6, 0.1, 0.4, P['red'])   # Zeichen: roter Balken (keine echten Symbole)
    b.box(0, -4.03, 2.4, 0.4, 0.1, 1.6, P['red'])
    b.windows(-3, -4.02, 1.5, 'x', 4, 1, 2, 1, 0.6, 0.9, P['lit'], skip=0.0, seed=seed)
    if level >= 2:
        b.box(5.5, 0, 1.8 + level * 0.3, 3, 6, 3.6 + level * 0.6, P['white'])
        b.windows(4.3, -3.02, 1.4, 'x', 3, 1 + level // 2, 1.1, 1.3, 0.4, 0.6, P['lit'], skip=0.2, seed=seed + 3)
    return b.finish(bevel=0.05), {'lights': [], 'smoke': [], 'top': 10}


def cells(level, P, seed=8):
    b = Builder('Zellentrakt')
    h = 4 + level * 2.2
    b.box(0, 0, h / 2, 10, 8, h, P['stone2'])
    for r in range(int(h / 2)):  # schmale Schießscharten-Fenster
        for c in range(7):
            if (r + c) % 2:
                b.box(-4.2 + c * 1.4, -4.03, 1.2 + r * 2, 0.22, 0.08, 0.9, P['lit'])
    b.crenels(0, 0, h, 10, 8, P['stone'], 0.6, 0.5)
    for sx in (-1, 1):
        for sy in (-1, 1):
            b.cyl(sx * 5, sy * 4, h / 2 + 1, 1.0, h + 2, P['stone'], segs=8)
            b.cyl(sx * 5, sy * 4, h + 2.6, 1.2, 1.4, P['roof'], segs=8, r2=0.0)
    return b.finish(bevel=0.05), {'lights': [], 'smoke': [], 'top': h + 3}


def arena(level, P, seed=9):
    b = Builder('Prüfungsarena')
    r = 4.5 + level * 0.4
    segs = 16
    for i in range(segs):
        a = i / segs * math.tau
        b.box(math.cos(a) * r, math.sin(a) * r, 1.2 + level * 0.2, 1.9, 0.9, 2.4 + level * 0.4, P['stone'], rz=a + math.pi / 2)
    b.cyl(0, 0, 0.1, r - 0.4, 0.2, P['sand'], segs=24)
    for i in range(0, segs, 4):
        a = i / segs * math.tau
        b.cyl(math.cos(a) * (r + 0.6), math.sin(a) * (r + 0.6), 3 + level * 0.4, 0.15, 1.2, P['fire'], segs=6)
    return b.finish(bevel=0.05), {'lights': [], 'smoke': [], 'top': 5}


def reclusiam(level, P, seed=10):
    b = Builder('Reclusiam')
    h = 7 + level * 1.5
    _gothic_hall(b, P, 0, 0, 11, 7, h, seed, roof=True)
    for sy in (-1, 1):  # zwei Fronttürme
        b.box(-5.8, sy * 2.6, (h + 4) / 2, 2.4, 2.4, h + 4, P['stone'])
        b.cyl(-5.8, sy * 2.6, h + 4 + 3 + level, 1.6, 6 + level * 2, P['roof'], segs=8, r2=0.0)
    b.cyl(-7.05, 0, h * 0.62, 1.4, 0.12, P['lit'], segs=16, rx=0, ry=math.pi / 2)  # Rosette
    return b.finish(bevel=0.05), {'lights': [], 'smoke': [], 'top': h + 12}


def bastion(level, P, seed=11):
    b = Builder('Bastion')
    h = 5 + level * 2
    b.cyl(0, 0, h / 2, 4.2, h, P['stone2'], segs=10)
    for i in range(10):
        a = i / 10 * math.tau
        b.box(math.cos(a) * 4.2, math.sin(a) * 4.2, h + 0.4, 1.0, 1.0, 0.8, P['stone'], rz=a)
    b.box(0, 0, h + 1.2, 2.2, 2.2, 1.6, P['metal'])
    b.cyl(1.8, 0, h + 1.4, 0.25, 3.2, P['metal'], segs=8, ry=math.pi / 2)
    return b.finish(bevel=0.05), {'lights': [], 'smoke': [], 'top': h + 2}


def landing_pad(level, P, seed=12):
    b = Builder('Landeplattform')
    b.cyl(0, 0, 2.5, 5.5, 0.6, P['stone2'], segs=8)
    for i in range(8):
        a = i / 8 * math.tau
        b.box(math.cos(a) * 3.5, math.sin(a) * 3.5, 1.1, 0.6, 0.6, 2.2, P['stone'])
    lights = []
    for i in range(8):
        a = (i + 0.5) / 8 * math.tau
        p = (math.cos(a) * 5.2, math.sin(a) * 5.2, 2.85)
        b.box(*p, 0.25, 0.25, 0.15, P['red'])
        lights.append(p)
    if level >= 2:  # kleines Landungsschiff
        b.box(0, 0, 3.6, 4.0, 1.6, 1.0, P['metal'])
        b.box(-0.4, 0, 3.6, 1.0, 6.0, 0.25, P['metal'])
        b.box(1.9, 0, 3.7, 0.8, 0.9, 0.6, P['blue'])
    return b.finish(bevel=0.05), {'lights': lights, 'smoke': [], 'top': 5}


def astropath_tower(level, P, seed=13):
    b = Builder('Astropathenturm')
    h = 12 + level * 4
    b.box(0, 0, h / 2, 3.2, 3.2, h, P['stone'])
    b.windows(0, -1.62, 2, 'x', 1, int(h / 3), 1, 3, 0.4, 1.2, P['lit'], skip=0.2, seed=seed)
    b.cyl(0, 0, h + 1.5, 2.0, 3, P['stone2'], segs=8, r2=1.2)
    b.sphere(0, 0, h + 4, 1.0, P['blue'], segs=12, rings=8)
    return b.finish(bevel=0.05), {'lights': [(0, 0, h + 4)], 'smoke': [], 'top': h + 5}


def mine(level, P, seed=14):
    b = Builder('Mine')
    h = 7 + level * 1.5
    for sx in (-1, 1):
        for sy in (-1, 1):
            b.box(sx * 1.6, sy * 1.6, h / 2, 0.35, 0.35, h, P['metal'], rx=sy * 0.12, ry=-sx * 0.12)
    for k in range(3):
        b.box(0, 0, 2 + k * 2.2, 3.6, 3.6, 0.2, P['metal'])
    b.cyl(0, -1.9, h, 1.3, 0.25, P['trim'], segs=16, rx=math.pi / 2)
    b.box(4, 2, 1.0, 4, 3, 2, P['stone2'])
    for k in range(5):
        b.box(-4 + random.Random(seed + k).uniform(-1, 1), -3 + k * 0.7, 0.4, 1.2, 0.9, 0.8, P['dark'])
    return b.finish(bevel=0.05), {'lights': [(0, -1.9, h)], 'smoke': [], 'top': h + 1}


def store(level, P, seed=15):
    b = Builder('Speicher')
    h = 4 + level
    b.box(0, 0, h / 2, 10, 8, h, P['stone'])
    _ridge(b, P, 0, 0, 10, 8, h)
    b.box(0, -4.05, 1.6, 3.4, 0.1, 3.2, P['metal'])
    for k in range(level):
        b.box(-4 + k * 1.6, -5.2, 0.6, 1.2, 1.2, 1.2, P['trim'])
    return b.finish(bevel=0.05), {'lights': [], 'smoke': [], 'top': h + 4}


def plot_empty(P, seed=16):
    """Freier Bauplatz: Fundament, Gerüst, Kran."""
    b = Builder('Bauplatz')
    b.box(0, 0, 0.2, 11, 11, 0.4, P['stone2'])
    for sx in (-1, 1):
        for sy in (-1, 1):
            b.box(sx * 4, sy * 4, 2.0, 0.25, 0.25, 4.0, P['trim'])
    b.box(0, -4, 4.0, 8.25, 0.25, 0.25, P['trim'])
    b.box(0, 4, 4.0, 8.25, 0.25, 0.25, P['trim'])
    b.box(-4.5, 0, 6.0, 0.4, 0.4, 12.0, P['metal'])
    b.box(-1.5, 0, 11.8, 6.5, 0.35, 0.35, P['metal'])
    b.box(1.5, 0, 9.0, 0.06, 0.06, 5.6, P['metal'])
    return b.finish(bevel=0.05), {'lights': [(-4.5, 0, 12.2)], 'smoke': [], 'top': 12}


CATALOG = {
    'hab': ('Hab-Block', hab_block), 'quarters': ('Knechtsquartier', quarters), 'farm': ('Hydrokulturfarm', hydro_farm),
    'forge': ('Schmiede', forge), 'refinery': ('Raffinerie', refinery), 'scriptorium': ('Skriptorium', scriptorium),
    'apothecarion': ('Apothecarion', apothecarion), 'cells': ('Zellentrakt', cells), 'arena': ('Prüfungsarena', arena),
    'reclusiam': ('Reclusiam', reclusiam), 'bastion': ('Bastion', bastion), 'pad': ('Landeplattform', landing_pad),
    'astro': ('Astropathenturm', astropath_tower), 'mine': ('Mine', mine), 'store': ('Speicher', store),
}
