"""Robledor (planta/roca): forma final de Hojardo por el camino del combate cercano.
«Un coloso de corteza y piedra. Se planta firme en el suelo y golpea con la fuerza de un roble centenario.»
Guerrero del bosque en dos patas (proporciones normales, como Magmaurio): piel verde de geco con armadura de
corteza (peto, brazales y grebas con vetas) y piedra con musgo (hombrera y rodilleras), manos con garras de
madera, la cabeza de geco de la familia bien visible con su cresta de hojas, hojas grandes en el lomo (las de
Hojardo), un retoño de roble que le brota del hombro y la cola de geco que termina en una hoja grande."""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
import motor
from motor import Lienzo, args
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'semillin'))
from semillin import hoja, RAMP as RAMP0

RAMP = dict(RAMP0)
RAMP.update({
    'skin':  ['#0a2218', '#103424', '#184c32', '#226640', '#328452', '#4ca468', '#7cc88a'],
    'bark':  ['#1a0e08', '#2a180e', '#3e2616', '#563620', '#70482c', '#8c5e3c', '#a87a52'],
    'barkd': ['#140a06', '#22140c', '#321e12', '#462c1a'],
    'stone': ['#16181a', '#26292b', '#3a3e40', '#52585a', '#6c7474', '#8a9290', '#a8aeaa'],
    'moss':  ['#1a3610', '#2a5216', '#3e721e', '#5a9428', '#7eb63a', '#a8d65a'],
})
MID = {'skin': 3.9, 'belly': 3, 'leaf': 3.4, 'vein': 1.4, 'stem': 2, 'bark': 3.6, 'barkd': 1.8, 'stone': 3.6, 'moss': 3}
SPAN = {'belly': 3, 'leaf': 4.5, 'bark': 5, 'stone': 5, 'moss': 4}


def bark(ang=0.0, step=3.2, moss_top=None):
    """corteza con vetas verticales continuas; musgo arriba si se pide"""
    def f(X, Y):
        m = np.full(X.shape, 'bark', object)
        u = X * math.cos(ang) + Y * math.sin(ang) + np.sin(Y * 0.45) * 0.8
        m[(u % step) < 0.7] = 'barkd'
        if moss_top is not None:
            m[Y < moss_top + np.sin(X * 1.1) * 1.2] = 'moss'
        return m
    return f


def stone(moss_top=None):
    def f(X, Y):
        m = np.full(X.shape, 'stone', object)
        if moss_top is not None:
            m[Y < moss_top + np.sin(X * 1.4) * 0.9] = 'moss'
        return m
    return f


def claw_hand(c, x, y, far=False):
    """mano de geco con tres garras de madera"""
    b = -0.3 if far else 0.0
    c.parte(c.ell(x, y, 2.8, 3.0), 'skin', R=2.5, bias=b, far=far)
    for i, (dy, L) in enumerate(((-2.6, 5.4), (0.2, 6.4), (2.8, 5.0))):
        pts = [(x - 1.4, y + dy), (x - 1.4 - L * 0.5, y + dy - 1.1), (x - 1.4 - L * 0.85, y + dy - 0.2), (x - 1.4 - L, y + dy + 1.3)]
        c.parte(c.caps(pts, [1.1, 0.9, 0.6, 0.35]), 'bark', R=1.2, bias=b + 0.45, outline='#140a06', far=far)


def build(P):
    motor.tamano(96)
    c = Lienzo(RAMP, P, S=0.98 * 1.2, OX=34, OY=75, CX=34 * 1.2, CY=90, outline='#0c1a10', mid=MID, span=SPAN)
    f = P['fl']; sw = math.sin(f * 1.3) * 0.8

    def greave(top):
        def g(X, Y):
            m = np.where(Y > top + np.sin(X * 2) * 0.8, 'bark', 'skin').astype(object)
            m[(m == 'bark') & (((X + np.sin(Y * 0.5)) % 2.8) < 0.6)] = 'barkd'
            return m
        return g
    # ---- pierna lejana (digitígrada) ----
    legF = c.caps([(46, 48), (43.5, 56), (49, 65), (47.5, 72)], [5.4, 3.8, 2.8, 2.6]) | c.ell(44.8, 73, 4.6, 1.9)
    c.parte(legF, greave(58), R=3.5, bias=-0.3, far=True)
    # ---- brazo lejano ----
    c.parte(c.caps([(42, 30), (41.5, 38.5)], [4.2, 3.4]), 'skin', R=3, bias=-0.3, far=True)
    c.parte(c.caps([(41.5, 39), (34, 35.5)], [3.8, 3.0]) | c.ell(41, 39.5, 3.6, 3.0), bark(0.9, 2.8), R=3, bias=-0.3, far=True)
    claw_hand(c, 31.6, 35.2, far=True)
    # ---- cola de geco con placas de corteza y una hoja grande al final ----
    c.local(rot=P['tail'], piv=(49, 50))
    c.parte(c.caps([(49, 50), (56, 52), (63, 51), (69, 47.5)], [4.6, 4.2, 3.2, 2.0]), 'skin', R=4)
    for (x, y, r) in [(52.5, 47.8, 2.8), (58.5, 48.6, 2.6), (64, 47.4, 2.2)]:
        c.parte(c.poly([(x - r, y + 1.6), (x - r * 0.4, y - r * 0.8), (x + r * 0.7, y - r * 0.5), (x + r, y + 1.4)]), bark(0.3, 2.4), R=2, outline='#140a06')
    hoja(c, (67.5, 48.5), (77, 40 + sw * 0.5), 4.6)
    c.local()
    # ---- hojas grandes del lomo (las de Hojardo) ----
    for i, (bx, by, dx, dy, w) in enumerate([(43.5, 26, 9, -9, 3.6), (46, 32, 10, -6, 3.6), (47.5, 38.5, 9, -3, 3.2)]):
        hoja(c, (bx, by), (bx + dx + sw * 0.4, by + dy), w, shade=0.05 if i % 2 else -0.04)
    # ---- torso erguido: piel verde con peto de corteza ----
    torso = c.ell(37, 37, 10.5, 11.5, 0.12) | c.ell(41, 47, 9, 7.5) | c.ell(34, 29, 8, 6)

    def torso_mat(X, Y):
        m = np.full(X.shape, 'skin', object)
        chest = (X < 39 + (Y - 40) * 0.3) & (Y > 30) & (Y < 47)
        m[chest] = 'bark'
        m[chest & (((X * 0.3 + Y) % 3.2) < 0.6)] = 'barkd'               # vetas horizontales del peto
        m[(X < 37 + (Y - 40) * 0.35) & (Y >= 47)] = 'belly'
        return m
    c.parte(torso, torso_mat, R=9)
    # ---- pierna cercana, con rodillera de piedra ----
    legN = c.caps([(40, 48), (34.5, 56.5), (40.5, 65.5), (38.5, 72)], [6.2, 4.2, 3.0, 2.8]) | c.ell(35.2, 73, 5, 2.0)
    c.parte(legN, greave(58.5), R=4)
    c.parte(c.ell(39.5, 51.5, 5.6, 6.2, -0.5), 'skin', R=6, bias=0.03, soft=True)
    c.parte(c.poly([(31, 54.5), (34.5, 52.5), (38.5, 54.5), (37.5, 58.5), (32, 58.8)]), stone(moss_top=54.6), R=3, outline='#0e0e10')
    # ---- brazo cercano: brazo verde, brazal de corteza, garras de madera ----
    c.parte(c.caps([(32, 29.5), (31, 38.5)], [4.6, 3.6]), 'skin', R=4)
    c.parte(c.caps([(31, 40), (23.5, 43.5)], [4.0, 3.0]) | c.ell(31.2, 40.2, 4.0, 3.3), bark(0.9, 2.8), R=3.5)
    claw_hand(c, 21, 44.2)
    # ---- hombrera de piedra con musgo y un retoño de roble que brota ----
    c.parte(c.poly([(28.5, 33), (30.5, 28), (35, 25.5), (40.5, 26.5), (43, 30.5), (41, 34.5), (33, 35.5)]), stone(moss_top=28.4), R=4, outline='#0e0e10')
    c.parte(c.caps([(38.5, 26.5), (40, 20), (42.5, 15)], [1.3, 1.0, 0.7]) | c.caps([(40, 20), (36.5, 16.5)], [0.8, 0.5]), bark(0.2, 2.2), R=1.5)
    for (base, tip, w) in [((42.5, 15), (47, 10), 2.4), ((42.5, 15), (40.5, 9), 2.0), ((36.5, 16.5), (32.5, 13), 1.8)]:
        hoja(c, base, (tip[0] + sw * 0.3, tip[1]), w)
    # ---- cabeza de geco de la familia, bien visible ----
    c.local(dx=8.5, dy=P['head'] - 27, sc=0.95, piv=(19.5, 47.5))
    head = c.ell(19.5, 47.5, 9.6, 8.2, -0.04) | c.ell(11, 50.6, 6, 4.8, -0.05)
    c.parte(head, lambda X, Y: np.where(Y > 53.2 + (X - 10) * 0.05, 'belly', 'skin').astype(object), R=6, bias=0.04)
    hoja(c, (21.5, 41.8), (33, 33), 3.0, shade=0.04)
    hoja(c, (23.5, 42.6), (34.5, 38.5), 2.6, shade=-0.05)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dx=8.5, dy=P['head'] - 27, sc=0.95, piv=(19.5, 47.5))
    K = {'k': '#081a0a', 'W': '#fff8d0', 'g': '#6a4a10', 'G': '#d8b040'}
    if P['blink']:
        c.patron(12.4, 46.6, ['', 'kkkkkk'], K)
    else:   # mirada firme, iris ámbar como savia
        ex, ey = c.patron(12.4, 46.6, ['.kkkkk', 'kWgGGk', '.kkkk.'], K)
        for dx in range(-1, 7): c.put(ex + dx, ey - 1 - (dx > 2), '#0a2218')
    c.linea_d([(6, 52.4), (9, 53.2), (12, 53.4), (14.4, 52.8)], '#0a2218')
    c.local()
    for x in (32, 34.5, 37, 42, 44.5): c.putd(x, 74.4, '#c8a878')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
