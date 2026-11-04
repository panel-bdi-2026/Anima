"""Coralis (agua/mente): forma final de Marolo por el camino del combate a distancia.
«Su corona de coral amplifica ondas mentales. Prefiere mantener la distancia y leer los movimientos del rival.»
En cuatro patas, alto y elegante, como un ciervo de coral: patas largas con velos de aleta que cuelgan como
los de un pez betta, cuello erguido, la cabeza de la familia en alto, gran corona de coral como astas
(las branquias de Burbujo), gema violeta en la frente y destellos mentales en las puntas de la corona."""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
import motor
from motor import Lienzo, args

RAMP = {
    'skin':  ['#0c2040', '#14345e', '#1c4c86', '#2a68ac', '#3e88cc', '#62aae4', '#98cef4'],
    'belly': ['#5a88b4', '#86b2d8', '#b0d4ec', '#d8eef8', '#f2fbff'],
    'coral': ['#5a1430', '#92244a', '#cc3c64', '#f0607e', '#ff8e9e', '#ffc2c8', '#ffe8ea'],
    'veil':  ['#2a4e8a', '#4a76b4', '#74a2d8', '#a2c8ee', '#d0e6fa'],
    'veilp': ['#6a2a6a', '#9a4a8e', '#c878b0', '#eaa8d0', '#fcd8ec'],
    'veild': ['#1a3466', '#2a4e8a', '#4a76b4', '#74a2d8'],
    'pearl': ['#8a7a9a', '#c8bcd8', '#f4eefc', '#ffffff'],
    'hoof':  ['#0a1024', '#14203c', '#22325a', '#34487a'],
}
MID = {'veild': 1.6, 'pearl': 2.2, 'hoof': 1.8, 'skin': 4, 'belly': 3, 'coral': 3.6, 'veil': 2.6, 'veilp': 2.4}
SPAN = {'pearl': 2, 'belly': 3, 'veil': 3, 'coral': 4.5, 'veilp': 3}


def coral(c, bx, by, ang, L, far, seed):
    """rama de coral como asta: tronco que sube y se abre en ramitas"""
    a = math.radians(ang)
    tip = (bx + math.sin(a) * L, by - math.cos(a) * L)
    m = c.caps([(bx, by), ((bx + tip[0]) / 2 + math.cos(a) * 0.9, (by + tip[1]) / 2), tip], [1.8, 1.4, 0.8])
    for k, (t, side, l2) in enumerate([(0.4, -1, 0.42), (0.6, 1, 0.38), (0.78, -1, 0.3), (0.9, 1, 0.22)]):
        px, py = bx + math.sin(a) * L * t, by - math.cos(a) * L * t
        aa = a + side * (0.7 + 0.1 * math.sin(seed + k))
        m |= c.caps([(px, py), (px + math.sin(aa) * L * l2, py - math.cos(aa) * L * l2)], [1.0, 0.55])
    c.parte(m, 'coral', R=2, bias=-0.3 if far else 0.04, outline='#4a0e24', far=far)


def veil_mat(y_pink, ang=0.35):
    """velo azul que se vuelve rosado en el borde, con radios finos como las aletas de un pez"""
    def f(X, Y):
        m = np.where(Y > y_pink + np.sin(X * 1.3) * 0.8, 'veilp', 'veil').astype(object)
        m[((X * math.cos(ang) - Y * math.sin(ang)) % 2.9) < 0.75] = 'veild'
        return m
    return f


def veil(c, pts, far):
    """velo de aleta que cuelga detrás de una pata"""
    c.parte(c.poly(pts), veil_mat(67.5, 0.12), R=2.5, bias=-0.3 if far else 0.0, outline='#1a3466', far=far)


def leg(c, pts, rr, foot, far):
    """pata fina con pezuña oscura y brazalete de coral en el tobillo"""
    b = -0.3 if far else 0.0
    fx, fy = foot[0], foot[1]
    c.parte(c.caps(pts, rr) | c.ell(*foot), lambda X, Y: np.where(Y > fy - 1.4, 'hoof', 'skin').astype(object), R=2.5, bias=b, far=far)
    ax, ay = pts[-1][0], 66.5
    cuff = c.ell(ax + 0.2, ay, rr[-1] + 1.2, 1.1)
    for k in range(3):                                           # ramitas del brazalete
        cuff |= c.caps([(ax - 1.6 + k * 1.6, ay - 0.6), (ax - 2.2 + k * 1.9, ay - 2.4)], [0.7, 0.4])
    c.parte(cuff, 'coral', R=1.5, bias=b, outline='#4a0e24', far=far)


def build(P):
    motor.tamano(96)
    c = Lienzo(RAMP, P, S=1.0 * 1.2, OX=40, OY=75, CX=48, CY=90, outline='#0a1834', mid=MID, span=SPAN)
    f = P['fl']; w = math.sin(f * 1.2) * 0.8          # los velos se mecen
    # ---- patas lejanas, con sus velos ----
    veil(c, [(35.5, 55), (39, 57.5), (42 + w, 63.5), (43 + w, 70), (40, 71.5), (37, 68), (35.5, 62)], True)
    leg(c, [(34, 53), (35, 62.5), (34.5, 71)], [3.0, 2.0, 1.8], (33.4, 72.8, 2.9, 1.5), True)
    veil(c, [(58, 54), (61.5, 57), (64.5 + w, 63), (65.5 + w, 69.5), (62.5, 71), (59.5, 67.5), (58.5, 61)], True)
    leg(c, [(54, 51), (57, 58.5), (59, 63.5), (57.5, 71)], [4.0, 2.6, 1.7, 1.6], (56.4, 72.8, 3.0, 1.5), True)
    # ---- cola larga con velo de betta ----
    c.local(rot=P['tail'], piv=(60, 46))
    tveil = c.poly([(60, 44.5), (66, 42), (71.5, 39), (75 + w, 41), (77 + w, 47), (76 + w, 55), (73, 61), (69, 57), (66, 52), (62, 49.5)])
    c.parte(tveil, veil_mat(52, -0.5), R=3, outline='#1a3466')
    c.parte(c.caps([(59, 46), (65, 43.5), (70, 40.5), (73.5, 37.5)], [3.8, 3.0, 2.0, 1.0]), 'skin', R=3)
    c.local()
    # ---- corona de coral, astas lejanas ----
    c.local(dy=P['head'])
    for i, (bx, by, ang, L) in enumerate([(28.5, 23.5, 22, 13.5), (30.5, 27, 62, 12)]):
        coral(c, bx + 2.5, by - 1.2, ang, L, True, i + 5)
    c.local()
    # ---- crin-aleta translúcida en la nuca, con radios ----
    c.local(dy=P['head'] * 0.5)
    mane = c.poly([(26, 27), (29.5, 26.5), (33.5 + w * 0.6, 29), (37 + w, 33), (39.5 + w, 37.5), (40.5, 41.5), (36, 42.5), (33, 38), (30, 33.5)])
    c.parte(mane, veil_mat(38.5, 0.9), R=3, outline='#1a3466')
    c.local()
    # ---- cuerpo esbelto y cuello erguido ----
    body = c.ell(33, 47, 8.5, 7.8) | c.ell(45, 48, 13.5, 6.6) | c.ell(56, 47.2, 7.5, 6.8) | c.ell(28.5, 39.5, 5.8, 8, 0.25)
    def body_mat(X, Y):
        m = np.where(((X < 31.5 + (Y - 40) * 0.25) & (Y > 38)) | ((Y > 51.5 + (X - 40) ** 2 * 0.002) & (X < 50)), 'belly', 'skin').astype(object)
        for i in range(7):                                              # fila de perlas en el costado
            px, py = 37.5 + i * 3.2, 47.4 + math.sin(i * 0.9) * 0.5
            m[np.hypot(X - px, Y - py) < 1.05] = 'pearl'
        return m
    c.parte(body, body_mat, R=8)
    # pequeñas ramas de coral a lo largo del lomo
    for i, (bx, by, ang, L) in enumerate([(41, 42.4, 10, 3.6), (46, 42.2, 20, 4.4), (51, 42.4, 28, 3.8), (55.2, 41.8, 40, 3.2)]):
        coral(c, bx, by, ang, L, False, i + 11)
    # ---- patas cercanas, con sus velos ----
    veil(c, [(31.5, 56), (35, 58.5), (38 + w, 64.5), (39 + w, 71), (36, 72.5), (33, 69), (31.5, 63)], False)
    leg(c, [(30, 54), (30.5, 63), (30, 71)], [3.3, 2.2, 1.9], (28.8, 72.8, 3.1, 1.5), False)
    veil(c, [(60, 55), (63.5, 58), (66.5 + w, 64), (67.5 + w, 70.5), (64.5, 72), (61.5, 68.5), (60.5, 62)], False)
    leg(c, [(56, 52), (59.5, 59), (61.5, 64), (60, 71)], [4.4, 2.8, 1.8, 1.7], (58.8, 72.8, 3.2, 1.5), False)
    # ---- cabeza de la familia, en alto ----
    c.local(dy=P['head'])
    head = c.ell(21.5, 30.5, 10.8, 9.3, -0.06) | c.ell(13, 33.2, 6.8, 5.6, -0.05)
    c.parte(head, lambda X, Y: np.where(Y > 36.4 + (X - 12) * 0.05, 'belly', 'skin').astype(object), R=7, bias=0.05)
    for i, (bx, by, ang, L) in enumerate([(25, 22.5, -6, 15), (28, 25, 32, 15), (29.5, 30, 72, 12.5)]):
        coral(c, bx, by, ang, L, False, i)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'])
    K = {'k': '#060c1c', 'v': '#9040d0', 'V': '#e0b0ff', 'W': '#ffffff'}
    if P['blink']:
        c.patron(14.6, 29, ['', 'kkkkk'], K)
    else:   # mirada tranquila, iris violeta
        c.patron(14.6, 29, ['.kkkk.', 'kWVvk.', '.kkk..'], K)
    c.patron(17.4, 24.4, ['.g.', 'gGg', '.g.'], {'g': '#9040d0', 'G': '#f8e0ff'})       # gema en la frente
    c.linea_d([(8, 36), (11, 36.8), (14, 37), (16.4, 36.4)], '#0a1834')                 # boca serena
    c.local()
    # destellos mentales que titilan en las puntas de la corona
    for i, (x, y) in enumerate([(24, 7.5), (30.5, 10.5), (37.5, 18.5), (33, 5.5)]):
        if (int(f * 2.5) + i) % 3 == 0: continue
        X, Y = (int(v) for v in c.tp(x, y + P['head']))
        for dx, dy in [(0, -1), (-1, 0), (1, 0), (0, 1)]: c.put(X + dx, Y + dy, '#d088ff')
        c.put(X, Y, '#fbeaff')
    for x in (27, 29, 31, 57, 59, 61): c.putd(x, 74.4, '#98cef4')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
