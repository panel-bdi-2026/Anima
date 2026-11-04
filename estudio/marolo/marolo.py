"""Marolo (agua): «Nada a gran velocidad. Su carácter cambia según el estilo de combate de su entrenador.»
Tritón joven: largo y estilizado, cabeza más afinada que la de Burbujo, branquias más largas echadas hacia
atrás por la velocidad, franja clara a lo largo del costado, cresta-aleta en el lomo, patas largas con
dedos palmeados y cola larga con aleta, hecha para nadar rápido."""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
import motor
from motor import Lienzo, args

RAMP = {
    'skin':  ['#0a1838', '#12284e', '#1a3e78', '#2658a4', '#3a7ccc', '#5ea2e6', '#94ccf6'],
    'belly': ['#4a78a8', '#7aa6d0', '#a8cce8', '#d4ecf8', '#f0faff'],
    'gill':  ['#6a1a44', '#a82a62', '#e04a88', '#ff7aaa', '#ffb0cc', '#ffe0ec'],
    'fin':   ['#2e5c94', '#5a8ec4', '#8cbce4', '#bcdcf4', '#e2f2fc'],
    'stripe': ['#3a74b4', '#6aa6dc', '#a4d2f4', '#d8f0ff'],
}
MID = {'skin': 3.8, 'belly': 3, 'gill': 3, 'fin': 2.6, 'stripe': 2.2}
SPAN = {'belly': 3, 'fin': 3, 'gill': 4, 'stripe': 2.5}


def gill(c, bx, by, ang, L, far, i):
    """branquia larga echada hacia atrás, con filamentos como pluma"""
    a = math.radians(ang) + math.sin(c.P['fl'] * 1.3 + i) * 0.07
    pts = [(bx + math.sin(a) * L * t, by - math.cos(a) * L * t - 1.2 * t * t) for t in (0, 0.5, 1)]
    m = c.caps(pts, [1.5, 1.1, 0.6])
    for k in range(2, 7):
        t = k / 7
        px, py = bx + math.sin(a) * L * t, by - math.cos(a) * L * t - 1.2 * t * t
        aa = a - 0.8
        m |= c.caps([(px, py), (px + math.sin(aa) * 2.4, py - math.cos(aa) * 2.4)], [0.65, 0.4])
    c.parte(m, 'gill', R=2, bias=-0.3 if far else 0.05, outline='#7a1a4a', far=far)


def leg(c, pts, rr, foot, far):
    m = c.caps(pts, rr) | c.ell(*foot)
    c.parte(m, 'skin', R=2.5, bias=-0.3 if far else 0.0, far=far)


def build(P):
    motor.tamano(80)
    c = Lienzo(RAMP, P, S=0.99, OX=40, OY=75, CX=38.6, outline='#0a1634', mid=MID, span=SPAN)
    # ---- patas lejanas (largas, con codo) ----
    leg(c, [(53, 61), (58, 66.5), (56, 71.5)], [3.4, 2.4, 2.1], (54.6, 72.8, 3.6, 1.5), True)
    leg(c, [(34, 61), (38, 66.5), (35.5, 71.5)], [3.0, 2.2, 1.9], (34.2, 72.8, 3.4, 1.5), True)
    # ---- branquias lejanas ----
    c.local(dy=P['head'] + 4)
    for i, (bx, by, ang, L) in enumerate([(27, 41.5, 62, 11), (28.5, 45.5, 88, 11.5)]):
        gill(c, bx + 2, by - 2, ang, L, True, i)
    c.local()
    # ---- cola larga con aleta, para nadar rápido ----
    c.local(rot=P['tail'], piv=(58, 53), dy=4)
    tailm = c.caps([(56, 53.5), (63, 52.5), (69, 50.5), (74, 47.5), (77, 44)], [5, 4, 3, 2, 0.9])
    finm = c.poly([(50, 46.5), (57, 45.5), (64, 45.5), (70, 43.5), (75, 40), (78.5, 41), (78, 46), (74, 51.5), (67, 56), (60, 58), (57, 55)])
    c.parte(finm, 'fin', R=3, bias=-0.05, outline='#1a3a6a')
    c.parte(tailm, 'skin', R=4)
    c.local()
    # ---- cuerpo largo y estilizado ----
    c.local(dy=4)
    body = c.ell(32, 53, 9.5, 7.5) | c.ell(45, 54.5, 12, 6) | c.ell(56, 53.5, 7, 6)

    def body_mat(X, Y):
        m = np.full(X.shape, 'skin', object)
        m[Y > 57.6 + (X - 40) ** 2 * 0.003] = 'belly'
        m[np.abs(Y - (53.6 + (X - 40) * 0.02)) < 0.9] = 'stripe'          # franja de velocidad
        return m
    c.parte(body, body_mat, R=8)
    # cresta-aleta del lomo (baja, que se une a la de la cola)
    c.parte(c.poly([(30, 46.5), (35, 44.6), (42, 45), (48, 46.2), (52, 47.5), (46, 48.6), (38, 47.8)]), 'fin', R=2, outline='#1a3a6a')
    c.local()
    # ---- patas cercanas, con dedos palmeados ----
    leg(c, [(56, 62), (61, 67), (59, 71.5)], [3.8, 2.7, 2.3], (57.4, 72.8, 4.0, 1.6), False)
    leg(c, [(31, 62), (35, 67), (32.5, 71.5)], [3.4, 2.5, 2.1], (31, 72.8, 3.8, 1.6), False)
    # ---- cabeza: más afinada que la de Burbujo, todavía redondeada ----
    c.local(dy=P['head'] + 4)
    head = c.ell(19.5, 46.5, 11, 9.2, -0.05) | c.ell(10.5, 49.8, 6.8, 5.2)

    def head_mat(X, Y):
        m = np.full(X.shape, 'skin', object)
        m[Y > 51 + (X - 10) * 0.04] = 'belly'
        return m
    c.parte(head, head_mat, R=7, bias=0.04)
    for i, (bx, by, ang, L) in enumerate([(25.5, 40.5, 58, 12.5), (27.5, 44.5, 84, 13), (27.5, 48.5, 108, 11)]):
        gill(c, bx, by, ang, L, False, i)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'] + 4)
    K = {'k': '#0a1020', 'W': '#ffffff', 'b': '#2a5aa0'}
    if P['blink']:
        c.patron(12.5, 45.2, ['', 'kkkk'], K)
    else:   # ojo más despierto que el de Burbujo
        ex, ey = c.patron(12.5, 45.2, ['.kkk.', 'kWkbk', 'kkkkk', '.kkk.'], K)
        for dx in range(0, 5): c.put(ex + dx, ey - 1, '#12284e')
    for x, y in [(4.5, 51.2), (6, 51.8), (7.5, 52.2), (9, 52.4), (10.5, 52.3)]: c.putd(x, y, '#0a1634')   # boca
    c.local()
    for x in (29, 31, 33, 55.5, 57.5, 59.5): c.putd(x, 74.4, '#94ccf6')
    # estela de burbujitas detrás de la cola
    f = P['fl']
    for i, (x, y) in enumerate([(78, 36), (75, 31), (79, 27)]):
        X, Y = (int(v) for v in c.tp(x, y - (f * 2 + i * 2.3) % 5))
        for dx, dy in [(0, -1), (-1, 0), (1, 0), (0, 1)]: c.put(X + dx, Y + dy, '#8cc8f0')
        c.put(X, Y, '#e8f6ff')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
