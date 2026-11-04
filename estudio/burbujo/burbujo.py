"""Burbujo (agua): «Respira por las branquias rosadas de su cabeza. Le encanta soplar burbujas para jugar.»
Ajolote bebé: rechoncho, cabeza grande y ancha con sonrisa, ojitos chicos y brillantes, tres branquias
rosadas como plumitas a cada lado, aleta translúcida del lomo a la cola, patitas cortas con deditos
y burbujas que suben."""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
import motor
from motor import Lienzo, args

RAMP = {
    'skin':  ['#0e1e40', '#16305a', '#1f4a86', '#2e6cb4', '#4a92d8', '#72b6ec', '#a8d8f8'],
    'belly': ['#4a78a8', '#7aa6d0', '#a8cce8', '#d4ecf8', '#f0faff'],
    'gill':  ['#6a1a44', '#a82a62', '#e04a88', '#ff7aaa', '#ffb0cc', '#ffe0ec'],
    'fin':   ['#2e5c94', '#5a8ec4', '#8cbce4', '#bcdcf4', '#e2f2fc'],
    'spot':  ['#122a5a', '#1c3e7a', '#285294'],
}
MID = {'skin': 4, 'belly': 3, 'gill': 3, 'fin': 2.6, 'spot': 1.2}
SPAN = {'belly': 3, 'fin': 3, 'gill': 4}


def gill(c, bx, by, ang, L, far, i):
    """branquia: un tallo que sale de la cabeza con filamentos como plumitas"""
    a = math.radians(ang); wob = math.sin(c.P['fl'] * 1.3 + i) * 0.08
    a += wob
    pts = [(bx + math.sin(a) * L * t + 0.8 * t * t, by - math.cos(a) * L * t) for t in (0, 0.5, 1)]
    m = c.caps(pts, [1.5, 1.1, 0.7])
    for k in range(2, 6):                      # filamentos hacia afuera (lado de arriba del tallo), como una pluma
        t = k / 6
        px, py = bx + math.sin(a) * L * t, by - math.cos(a) * L * t
        aa = a - 0.75
        m |= c.caps([(px, py), (px + math.sin(aa) * 2.6, py - math.cos(aa) * 2.6)], [0.7, 0.45])
    c.parte(m, 'gill', R=2, bias=-0.3 if far else 0.05, outline='#7a1a4a', far=far)


def build(P):
    motor.tamano(80)
    c = Lienzo(RAMP, P, S=0.86, OX=40, OY=75, outline='#0c1a3a', mid=MID, span=SPAN)
    # ---- patitas lejanas ----
    for x in (35, 55):
        c.parte(c.caps([(x, 62), (x + 0.5, 70.5)], [3.0, 2.5]) | c.ell(x - 0.6, 72.6, 3.2, 1.6), 'skin', R=2.5, bias=-0.3, far=True)
    # ---- branquias lejanas (asoman detrás de la cabeza) ----
    c.local(dy=P['head'])
    for i, (bx, by, ang, L) in enumerate([(30, 40, 25, 9.5), (34, 44, 65, 10)]):
        gill(c, bx + 2.5, by - 2, ang, L, True, i)
    c.local()
    # ---- cola con aleta ----
    c.local(rot=P['tail'], piv=(54, 57))
    tailm = c.caps([(52, 57), (59, 56.5), (65, 55), (70, 53.5)], [6.5, 5.0, 3.4, 1.4])
    finm = c.poly([(42, 48.5), (48, 46.5), (56, 46), (63, 47), (69, 48.5), (74, 51.5), (75, 54), (71, 57.5), (64, 60.5), (57, 62), (54, 58)])
    c.parte(finm, 'fin', R=3, bias=-0.05, outline='#1a3a6a')
    c.parte(tailm, 'skin', R=5)
    c.local()
    # ---- cuerpo rechoncho ----
    body = c.ell(41, 58, 15.5, 10) | c.ell(30, 56, 9, 9.5)

    def body_mat(X, Y):
        m = np.full(X.shape, 'skin', object)
        m[Y > 62 + (X - 40) ** 2 * 0.004] = 'belly'
        for (sx, sy, r) in [(38, 50.5, 1.4), (45, 51.5, 1.2), (51, 53, 1.3), (42, 54.5, 1.0)]:   # pequitas
            m[np.hypot(X - sx, Y - sy) < r] = 'spot'
        return m
    c.parte(body, body_mat, R=9)
    # ---- patitas cercanas, con deditos ----
    for x in (31, 51):
        leg = c.caps([(x, 63), (x - 0.5, 71)], [3.4, 2.8]) | c.ell(x - 1.4, 72.6, 3.6, 1.7)
        c.parte(leg, 'skin', R=2.5)
    # ---- cabeza grande y ancha ----
    c.local(dy=P['head'])
    head = c.ell(22.5, 50, 12.5, 11.5) | c.ell(14, 54, 8, 6.5)

    def head_mat(X, Y):
        m = np.full(X.shape, 'skin', object)
        m[Y > 55.5 + (X - 15) * 0.05] = 'belly'
        return m
    c.parte(head, head_mat, R=9, bias=0.04)
    # branquias cercanas: tres a cada lado, como plumitas rosadas
    for i, (bx, by, ang, L) in enumerate([(28.5, 40.5, 5, 11), (32.5, 44, 48, 11.5), (34, 50, 92, 10)]):
        gill(c, bx, by, ang, L, False, i)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'])
    K = {'k': '#0a1020', 'W': '#ffffff', 'b': '#2a4a8a'}
    if P['blink']:
        ex, ey = c.patron(14.5, 48.6, ['', 'kkk'], K)
    else:   # ojitos chicos y brillantes, como los de un ajolote
        ex, ey = c.patron(14.5, 48.6, ['.kk.', 'kWkk', 'kkkk', '.kk.'], K)
    # sonrisa ancha
    for x, y in [(6, 55.2), (7.5, 56), (9, 56.6), (10.5, 57), (12, 57.2), (13.5, 57.1), (15, 56.7)]: c.putd(x, y, '#0c1a3a')
    for x, y in [(17, 55), (18.3, 55)]: c.putd(x, y, '#ff9ab8')       # rubor
    c.local()
    for x in (28.5, 30.5, 32.5, 48.5, 50.5, 52.5): c.putd(x, 74.4, '#a8d8f8')   # deditos
    # burbujas que suben desde la boca (cambian con la animación)
    f = P['fl']
    for i, (x, y, r) in enumerate([(3, 46, 2), (6, 38, 1), (2, 30, 1.5)]):
        yy = y - (f * 2.2 + i * 3) % 7
        X, Y = (int(v) for v in c.tp(x + math.sin(f + i) * 0.8, yy))
        if r >= 2:
            for dx, dy in [(-1, -2), (0, -2), (1, -2), (-2, -1), (2, -1), (-2, 0), (2, 0), (-2, 1), (2, 1), (-1, 2), (0, 2), (1, 2)]:
                c.put(X + dx, Y + dy, '#8cc8f0')
            c.put(X - 1, Y - 1, '#ffffff')
        else:
            for dx, dy in [(0, -1), (-1, 0), (1, 0), (0, 1)]: c.put(X + dx, Y + dy, '#8cc8f0')
            c.put(X, Y, '#e8f6ff')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
