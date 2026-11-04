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
    # ---- pierna lejana: corta y fuerte ----
    c.parte(c.caps([(43, 58), (44.5, 65), (43, 71)], [5.0, 3.6, 3.0]) | c.ell(41, 72.8, 4.4, 1.9), 'skin', R=3, bias=-0.3, far=True)
    # ---- cola larga con aleta, apoyada en el suelo ----
    c.local(rot=P['tail'] * 0.5, piv=(46, 57))
    tail = c.caps([(46, 57), (54, 62.5), (62, 65.5), (69.5, 65), (75, 61.5)], [5.6, 4.4, 3.2, 2.1, 1.0])
    tfin = c.poly([(50, 55), (58, 56.5), (66, 58), (73, 56.5), (77, 58.5), (76.5, 63), (71, 68.5), (62, 70), (55, 67.5)])
    c.parte(tfin, 'fin', R=3, outline='#1a3a6a')
    c.parte(tail, 'skin', R=4)
    c.local()
    # ---- brazo lejano ----
    c.parte(c.caps([(41.5, 39), (40.5, 46), (30, 46.5)], [3.2, 2.6, 2.2]), 'skin', R=2.5, bias=-0.3, far=True)
    # ---- corona de coral, ramas lejanas ----
    c.local(dy=P['head'])
    for i, (bx, by, ang, L) in enumerate([(35, 18, 18, 12), (37, 22.5, 60, 11.5)]):
        coral(c, bx + 2.5, by - 1.2, ang, L, True, i + 5)
    c.local()
    # ---- cuerpo en forma de pera, como un ajolote parado ----
    torso = c.ell(37.5, 47, 9.5, 11) | c.ell(40, 55.5, 9, 7)
    c.parte(torso, lambda X, Y: np.where(X < 37 + (Y - 46) * 0.16, 'belly', 'skin').astype(object), R=9)
    # ---- pierna cercana: corta y fuerte ----
    c.parte(c.caps([(37.5, 59), (38.5, 66), (37, 71)], [5.4, 3.8, 3.2]) | c.ell(34.8, 72.8, 4.8, 2.0), 'skin', R=3)
    # ---- esfera de energía mental entre las manos ----
    c.parte(c.ell(24.5, 44, 4.2, 4.2), 'psi', R=3, outline='#3a0a5a')
    # ---- brazo cercano con manga-aleta que cuelga ----
    c.parte(c.poly([(31.5, 45), (33, 49.5), (31.5, 55.5), (28.5, 59), (26.8, 54), (27.4, 48.5)]), 'fin', R=2.5, outline='#1a3a6a')
    c.parte(c.caps([(33.5, 39), (31.5, 46), (27, 47)], [3.6, 2.8, 2.4]), 'skin', R=3)
    c.parte(c.ell(26.5, 47.2, 2.5, 2.2), 'skin', R=2, bias=0.05)
    # ---- cabeza grande y serena, de la familia ----
    c.local(dy=P['head'])
    head = c.ell(29.5, 27, 11, 10, -0.03) | c.ell(22.5, 30.5, 6.4, 5.4, -0.05)
    c.parte(head, lambda X, Y: np.where(Y > 31.8 + (X - 18) * 0.05, 'belly', 'skin').astype(object), R=7, bias=0.05)
    for i, (bx, by, ang, L) in enumerate([(32.5, 18.5, -8, 14), (35.5, 21, 30, 14.5), (37.5, 26, 72, 12.5)]):
        coral(c, bx, by, ang, L, False, i)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'])
    K = {'k': '#060c1c', 'v': '#9040d0', 'V': '#e0b0ff', 'W': '#ffffff'}
    if P['blink']:
        c.patron(23.2, 25.4, ['', 'kkkkk'], K)
    else:   # mirada tranquila, párpado a medio cerrar, iris violeta
        ex, ey = c.patron(23.2, 25.4, ['kkkkkk', 'kWVvk.', '.kkk..'], K)
    c.patron(26, 20.6, ['.g.', 'gGg', '.g.'], {'g': '#9040d0', 'G': '#f8e0ff'})       # gema en la frente
    for x, y in [(18, 32.3), (19.8, 32.8), (21.6, 33), (23.4, 32.8)]: c.putd(x, y, '#0a1834')   # boca serena
    c.local()
    # ondas mentales: anillos que salen de la esfera y se agrandan con la animación
    cx, cy = c.tp(24.5, 44)
    for i in range(2):
        r = 5.5 + ((f * 2.2 + i * 3) % 6) * 1.1
        for k in range(28):
            a = k / 28 * math.tau
            if (k + i) % 3 == 0: continue
            c.put(int(cx + math.cos(a) * r), int(cy + math.sin(a) * r * 0.55), '#d088ff' if i else '#f4d8ff')
    for x in (31.5, 33.8, 36, 38.2, 40.5): c.putd(x, 74.4, '#98cef4')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
