"""Hojardo (planta): «Las hojas de su espalda captan la luz. Se adapta a su entorno y a su forma de luchar.»
Geco joven en cuatro patas, ágil y bajo: patas abiertas con almohadillas de geco, una hilera de hojas
grandes en el lomo como paneles que captan la luz, el brote de Semillín convertido en una cresta de hojas
echada hacia atrás, y cola larga que termina en una hoja grande."""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
import motor
from motor import Lienzo, args
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'semillin'))
from semillin import hoja, RAMP as RAMP0

RAMP = dict(RAMP0)
RAMP['skin'] = ['#0a2218', '#103424', '#184c32', '#226640', '#328452', '#4ca468', '#7cc88a']   # verde más azulado que las hojas
RAMP['leaf'] = ['#1e4a10', '#2e6c14', '#48921e', '#68b42a', '#94d640', '#c8f27a']
MID = {'skin': 3.9, 'belly': 3, 'leaf': 3.4, 'vein': 1.4, 'stem': 2}
SPAN = {'belly': 3, 'leaf': 4.5}


def leg(c, pts, rr, foot, far):
    m = c.caps(pts, rr)
    fx, fy = foot
    for k, dx in enumerate((-2.6, -0.6, 1.4)):                    # deditos con almohadilla de geco
        m |= c.caps([(fx, fy - 0.6), (fx + dx, fy + 0.6)], [0.9, 0.7]) | c.ell(fx + dx, fy + 0.9, 1.05, 0.9)
    c.parte(m, 'skin', R=2.2, bias=-0.3 if far else 0.0, far=far)


def build(P):
    motor.tamano(80)
    c = Lienzo(RAMP, P, S=1.0, OX=40, OY=75, CX=39, outline='#0c2612', mid=MID, span=SPAN)
    f = P['fl']; sw = math.sin(f * 1.3) * 0.8
    # ---- patas lejanas, abiertas como las de un geco ----
    leg(c, [(51, 62), (56.5, 66), (55, 70.8)], [3.0, 2.3, 2.0], (55, 72), True)
    leg(c, [(33, 62), (29, 66), (30, 70.8)], [2.8, 2.1, 1.9], (30, 72), True)
    c.local(dy=3)
    # ---- hojas lejanas del lomo (asoman atrás) ----
    for i, (bx, by, dx, dy, w) in enumerate([(35, 50, 5, -13, 3.6), (41, 50.5, 7, -13.5, 3.8), (47, 50.5, 8, -12, 3.6)]):
        hoja(c, (bx + 1.5, by - 0.5), (bx + 1.5 + dx + sw * 0.3, by + dy), w, far=True)
    # ---- cola larga con hoja ----
    c.local(rot=P['tail'], piv=(56, 55), dy=3)
    c.parte(c.caps([(55, 55.5), (62, 55), (68, 53)], [4.4, 3.0, 1.8]), 'skin', R=3)
    hoja(c, (66.5, 53.5), (77, 45.5 + sw * 0.5), 4.4)
    c.local(dy=3)
    # ---- cuerpo bajo y largo ----
    body = c.ell(30, 55, 8, 6.5) | c.ell(42, 56, 11.5, 5.6) | c.ell(53, 55, 6.5, 6)
    c.parte(body, lambda X, Y: np.where(Y > 58.8 + (X - 40) ** 2 * 0.002, 'belly', 'skin').astype(object), R=7)
    # ---- hojas del lomo: paneles que captan la luz ----
    for i, (bx, by, dx, dy, w) in enumerate([(32, 49.5, 4, -14, 4.0), (38, 49.8, 6, -15, 4.3), (44, 50.2, 8, -14, 4.2), (50, 50, 9, -11, 3.8)]):
        hoja(c, (bx, by), (bx + dx + sw * 0.4, by + dy), w, shade=0.08 if i % 2 else -0.06)
    c.local()
    # ---- patas cercanas ----
    leg(c, [(54, 62.5), (60, 66.5), (58.5, 70.8)], [3.4, 2.5, 2.2], (58.5, 72), False)
    leg(c, [(29, 62.5), (24.5, 66.5), (25.5, 70.8)], [3.2, 2.3, 2.1], (25.5, 72), False)
    # ---- cabeza: la de Semillín, más afinada ----
    c.local(dy=P['head'] + 3)
    head = c.ell(19.5, 47.5, 9.6, 8.2, -0.04) | c.ell(11, 50.6, 6, 4.8, -0.05)
    c.parte(head, lambda X, Y: np.where(Y > 53.2 + (X - 10) * 0.05, 'belly', 'skin').astype(object), R=6, bias=0.04)
    # cresta de hojas: el brote de Semillín, ahora echado hacia atrás
    c.local(dy=P['head'] + 3, rot=sw * 0.04, piv=(22, 42))
    hoja(c, (21.5, 41.8), (33, 33), 3.0, shade=0.04)
    hoja(c, (23.5, 42.6), (34.5, 38.5), 2.6, shade=-0.05)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'] + 3)
    K = {'k': '#081a0a', 'W': '#ffffff', 'g': '#2e6a1a', 'G': '#9ad050'}
    if P['blink']:
        c.patron(12.6, 46.4, ['', 'kkkkk'], K)
    else:   # ojo más despierto y decidido que el de Semillín
        ex, ey = c.patron(12.6, 46.4, ['.kkkk.', 'kWkkGk', 'kkGGgk', '.kkkk.'], K)
        for dx in range(0, 6): c.put(ex + dx, ey - 1, '#0c2612')
    c.linea_d([(6, 52.4), (9, 53.2), (12, 53.4), (14.4, 52.8)], '#0c2612')
    c.local()
    return c


if __name__ == '__main__':
    build(args({})).guardar()
