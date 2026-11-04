"""Coralis (agua/mente): forma final de Marolo por el camino del combate a distancia.
«Su corona de coral amplifica ondas mentales. Prefiere mantener la distancia y leer los movimientos del rival.»
De pie en dos patas, sereno y elegante: las branquias de la familia se volvieron una corona de coral
ramificada, gema violeta en la frente, aletas largas que cuelgan de los brazos como mangas, manos juntas
frente al pecho sosteniendo una esfera de energía mental, cola larga con aleta apoyada en el suelo."""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
import motor
from motor import Lienzo, args

RAMP = {
    'skin':  ['#0c2040', '#14345e', '#1c4c86', '#2a68ac', '#3e88cc', '#62aae4', '#98cef4'],
    'belly': ['#5a88b4', '#86b2d8', '#b0d4ec', '#d8eef8', '#f2fbff'],
    'coral': ['#5a1430', '#92244a', '#cc3c64', '#f0607e', '#ff8e9e', '#ffc2c8', '#ffe8ea'],
    'fin':   ['#2a5a92', '#5a8ec4', '#8cbce4', '#bcdcf4', '#e2f2fc'],
    'psi':   ['#5a1a8a', '#9a40d0', '#d088ff', '#f4d8ff'],
    'gem':   ['#2a0a4a', '#5a1a8a', '#9040d0', '#d090ff', '#f8e0ff'],
}
MID = {'skin': 4, 'belly': 3, 'coral': 3.6, 'fin': 2.6, 'psi': 2.4, 'gem': 2.5}
SPAN = {'belly': 3, 'fin': 3, 'coral': 4.5, 'psi': 2}


def coral(c, bx, by, ang, L, far, seed):
    """rama de coral: tronco que sube y se abre en ramitas con puntas claras"""
    a = math.radians(ang)
    tip = (bx + math.sin(a) * L, by - math.cos(a) * L)
    m = c.caps([(bx, by), ((bx + tip[0]) / 2 + math.cos(a) * 0.8, (by + tip[1]) / 2), tip], [1.8, 1.4, 0.9])
    for k, (t, side, l2) in enumerate([(0.45, -1, 0.45), (0.65, 1, 0.4), (0.8, -1, 0.3)]):
        px, py = bx + math.sin(a) * L * t, by - math.cos(a) * L * t
        aa = a + side * (0.75 + 0.1 * math.sin(seed + k))
        m |= c.caps([(px, py), (px + math.sin(aa) * L * l2, py - math.cos(aa) * L * l2)], [1.1, 0.6])
    c.parte(m, 'coral', R=2, bias=-0.3 if far else 0.04, outline='#4a0e24', far=far)


def build(P):
    motor.tamano(96)
    Z = np.zeros((motor.N, motor.N), bool)
    c = Lienzo(RAMP, P, S=0.98 * 1.2, OX=40, OY=75, CX=48, CY=90, outline='#0a1834', mid=MID, span=SPAN,
               glow=('psi',), glow_rad={'psi': (2, 8)}, lit={})
    f = P['fl']
    # ---- pierna lejana ----
    c.parte(c.caps([(43, 52), (44.5, 62), (43.5, 71)], [4.0, 2.8, 2.4]) | c.ell(41.6, 72.8, 4.2, 1.8), 'skin', R=3, bias=-0.3, far=True)
    # ---- cola larga con aleta, apoyada en el suelo ----
    c.local(rot=P['tail'] * 0.5, piv=(46, 54))
    tail = c.caps([(46, 54), (54, 60), (62, 64), (69, 64.5), (74, 61.5)], [5, 4.2, 3.2, 2.2, 1.0])
    tfin = c.poly([(50, 53.5), (58, 55), (66, 56.5), (73, 55), (77, 57.5), (76, 62.5), (70, 67.5), (62, 69), (55, 66)])
    c.parte(tfin, 'fin', R=3, outline='#1a3a6a')
    c.parte(tail, 'skin', R=4)
    c.local()
    # ---- brazo lejano (con su manga-aleta) ----
    c.parte(c.caps([(41, 31), (40, 39.5), (31.5, 42)], [3.0, 2.4, 2.0]), 'skin', R=2.5, bias=-0.3, far=True)
    # ---- corona de coral, ramas lejanas ----
    c.local(dy=P['head'])
    for i, (bx, by, ang, L) in enumerate([(34.5, 13, 18, 10), (36.5, 17, 58, 10)]):
        coral(c, bx + 2.5, by - 1, ang, L, True, i + 5)
    c.local()
    # ---- torso erguido ----
    torso = c.ell(37, 41, 8.2, 12) | c.ell(39, 50, 7, 6)
    c.parte(torso, lambda X, Y: np.where(X < 36.5 + (Y - 40) * 0.12, 'belly', 'skin').astype(object), R=8)
    # ---- pierna cercana ----
    c.parte(c.caps([(38, 53), (37.5, 63), (36.5, 71)], [4.4, 3.0, 2.6]) | c.ell(34.6, 72.8, 4.6, 1.9), 'skin', R=3)
    # ---- esfera de energía mental entre las manos ----
    orb = c.ell(26, 42, 4.2, 4.2)
    c.parte(orb, 'psi', R=3, outline='#3a0a5a')
    # ---- brazo cercano con manga-aleta larga que cuelga ----
    c.parte(c.poly([(30, 38.5), (32.5, 42), (32, 49), (30, 55.5), (27.5, 52), (27.5, 45)]), 'fin', R=2.5, outline='#1a3a6a')
    c.parte(c.caps([(33, 30.5), (31, 39), (28.5, 44.5)], [3.4, 2.6, 2.2]), 'skin', R=3)
    c.parte(c.ell(27.8, 45, 2.4, 2.2), 'skin', R=2, bias=0.05)          # mano bajo la esfera
    # ---- cabeza serena, de la familia ----
    c.local(dy=P['head'])
    head = c.ell(30, 20, 9, 7.8, -0.08) | c.ell(22.5, 23.5, 5.6, 4.3, -0.1)
    c.parte(head, lambda X, Y: np.where(Y > 24.6 + (X - 20) * 0.05, 'belly', 'skin').astype(object), R=6, bias=0.05)
    # corona de coral: las branquias de Burbujo, ahora ramas de coral
    for i, (bx, by, ang, L) in enumerate([(32, 12.5, -8, 11.5), (35, 15, 32, 12), (36.5, 19.5, 74, 10.5)]):
        coral(c, bx, by, ang, L, False, i)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'])
    K = {'k': '#060c1c', 'v': '#9040d0', 'V': '#e0b0ff', 'W': '#ffffff'}
    if P['blink']:
        c.patron(23.6, 18.8, ['', 'kkkkk'], K)
    else:   # mirada tranquila, párpado a medio cerrar, iris violeta
        ex, ey = c.patron(23.6, 18.8, ['kkkkkk', 'kWVvk.', '.kkk..'], K)
    c.patron(25.6, 14.2, ['.g.', 'gGg', '.g.'], {'g': '#9040d0', 'G': '#f8e0ff'})       # gema en la frente
    for x, y in [(17.5, 25), (19.5, 25.6), (21.5, 26), (23.5, 26)]: c.putd(x, y, '#0a1834')   # boca serena
    c.local()
    # ondas mentales: anillos que salen de la esfera y se agrandan con la animación
    cx, cy = c.tp(26, 42)
    for i in range(2):
        r = 5.5 + ((f * 2.2 + i * 3) % 6) * 1.1
        for k in range(28):
            a = k / 28 * math.tau
            if (k + i) % 3 == 0: continue
            c.put(int(cx + math.cos(a) * r), int(cy + math.sin(a) * r * 0.55), '#d088ff' if i else '#f4d8ff')
    for x in (32.5, 34.5, 36.5, 39.5, 41.5): c.putd(x, 74.4, '#98cef4')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
