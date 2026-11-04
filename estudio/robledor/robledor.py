"""Robledor (planta/roca): forma final de Hojardo por el camino del combate cercano.
«Un coloso de corteza y piedra. Se planta firme en el suelo y golpea con la fuerza de un roble centenario.»
En dos patas, enorme: piernas como troncos con raíces que se agarran al suelo, torso acorazado de corteza
(con vetas) y placas de piedra con musgo, brazos fuertes con puños de piedra, la cabeza de geco de la familia
(verde, con la cresta de hojas) y, en la espalda, el brote de Semillín convertido en un árbol."""
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


def build(P):
    motor.tamano(96)
    c = Lienzo(RAMP, P, S=0.98 * 1.2, OX=40, OY=75, CX=46, CY=90, outline='#0e0806', mid=MID, span=SPAN)
    f = P['fl']; sw = math.sin(f * 1.3) * 0.8
    # ---- árbol en la espalda (el brote de Semillín creció) ----
    c.local(rot=sw * 0.02, piv=(50, 34))
    c.parte(c.caps([(49, 34), (51, 24), (53, 15)], [3.0, 2.4, 1.8]) | c.caps([(51.5, 22), (57, 17)], [1.4, 0.8]), bark(0.2, 2.6), R=2.5)
    for i, (x, y, rx, ry) in enumerate([(53, 10, 7, 5.5), (46.5, 13, 5.5, 4.5), (59.5, 14, 5.5, 4.5), (52, 5.5, 5, 4)]):
        c.parte(c.ell(x + sw * 0.3, y, rx, ry), lambda X, Y: np.where(((X * 0.9 + Y * 1.3) % 3.6) < 0.6, 'vein', 'leaf').astype(object),
                R=4, bias=0.05 if i % 2 else -0.04, outline='#123a14')
    c.local()
    # ---- pierna lejana: tronco con raíces ----
    legF = c.caps([(47, 53), (50, 62), (50.5, 69.5)], [5.6, 4.8, 4.8])
    for dx, dy in [(-4.5, 2.5), (-1.5, 3.2), (2.5, 3), (5, 2)]:
        legF |= c.caps([(50.5, 69.5), (50.5 + dx, 72 + dy * 0.4)], [2.2, 1.0])
    c.parte(legF, bark(0.1), R=4, bias=-0.3, far=True)
    # ---- brazo lejano ----
    c.parte(c.caps([(45, 30), (47, 40), (43, 48)], [4.5, 4, 3.6]), 'skin', R=3.5, bias=-0.3, far=True)
    c.parte(c.ell(42, 50, 4.4, 4.2), stone(), R=3, bias=-0.3, far=True, outline='#0e0e10')
    # ---- torso enorme de corteza ----
    torso = c.ell(41, 39, 15, 13) | c.ell(42, 50, 13, 7)
    c.parte(torso, bark(0.05, 3.4, moss_top=28), R=10)
    # placa de piedra en el pecho, con musgo arriba
    c.parte(c.poly([(28, 36), (33, 32.5), (38.5, 33.5), (40, 40), (37, 46.5), (31, 47), (27.5, 42)]), stone(moss_top=34.5), R=4, outline='#0e0e10')
    # ---- pierna cercana ----
    legN = c.caps([(36, 54), (33, 62.5), (32.5, 69.5)], [6.2, 5.2, 5.2])
    for dx, dy in [(-5.5, 2.5), (-2.5, 3.4), (1.5, 3.2), (4.5, 2.2)]:
        legN |= c.caps([(32.5, 69.5), (32.5 + dx, 72 + dy * 0.4)], [2.4, 1.1])
    c.parte(legN, bark(0.1), R=4, bias=0.06)
    c.parte(c.poly([(28.5, 59.5), (32.5, 57.5), (37, 59), (36, 63), (29.5, 63.5)]), stone(moss_top=59.6), R=3, outline='#0e0e10')   # rodillera
    # ---- brazo cercano con puño de piedra ----
    c.parte(c.caps([(33, 31), (28.5, 40), (25.5, 46.5)], [5.2, 4.6, 4.2]), 'skin', R=4)
    c.parte(c.poly([(26.5, 28.5), (30, 25.5), (37, 26), (39, 30.5), (36, 34), (29, 34)]), stone(moss_top=27.6), R=4, outline='#0e0e10')   # hombrera
    c.parte(c.ell(24.5, 50.5, 5.0, 4.6), stone(), R=3.5, outline='#0e0e10')
    # ---- cabeza de geco de la familia, más grande y seria ----
    c.local(dy=P['head'])
    head = c.ell(25.5, 21.5, 10.6, 9, -0.05) | c.ell(16, 24.8, 6.8, 5.4, -0.05)
    c.parte(head, lambda X, Y: np.where(Y > 27.4 + (X - 14) * 0.05, 'belly', 'skin').astype(object), R=6, bias=0.04)
    hoja(c, (27.5, 15), (39, 6.5), 3.2, shade=0.04)
    hoja(c, (29.5, 16), (40.5, 12), 2.8, shade=-0.05)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'])
    K = {'k': '#081a0a', 'W': '#fff8d0', 'g': '#6a4a10', 'G': '#d8b040'}
    if P['blink']:
        c.patron(18.4, 20, ['', 'kkkkkk'], K)
    else:   # ojo serio, iris ámbar como savia
        c.patron(18.4, 20, ['kkkkkkk', 'kWgGGk.', '.kkkk..'], K)
    for dx in range(-1, 8): c.putd(18.4 + dx * 0.85, 19.2 - (dx > 2) * 0.8, '#0a2218')     # ceja firme
    c.linea_d([(11, 26.4), (14, 27.2), (17, 27.5), (20, 27.2)], '#0a2218')
    c.local()
    # hojitas que caen del árbol
    for i, (x, y) in enumerate([(62, 22), (44, 24), (66, 32)]):
        X, Y = (int(v) for v in c.tp(x + math.sin(f + i) * 1.5, y + (f * 2 + i * 3) % 8))
        c.put(X, Y, '#74d050'); c.put(X + 1, Y, '#48a83a')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
