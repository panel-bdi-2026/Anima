"""Robledor (planta/roca): forma final de Hojardo por el camino del combate cercano.
«Un coloso de corteza y piedra. Se planta firme en el suelo y golpea con la fuerza de un roble centenario.»
Guardián del bosque, erguido (no un peleador agachado como Magmaurio): parado derecho con los pies plantados,
piernas rectas como troncos con raíces, torso alto con peto de corteza, hombreras de piedra con musgo y
florcitas, brazos que cuelgan y terminan en grandes puños de madera nudosa (como mazas), la cabeza de geco de
la familia coronada por ramas como astas con hojas y bellotas, y la cola gruesa apoyada en el suelo."""
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
    c = Lienzo(RAMP, P, S=1.0 * 1.2, OX=40, OY=75, CX=47, CY=90, outline='#0c1a10', mid=MID, span=SPAN)
    f = P['fl']; sw = math.sin(f * 1.3) * 0.8

    def leg_mat(top):
        def g(X, Y):
            m = np.where(Y > top + np.sin(X * 2) * 0.8, 'bark', 'skin').astype(object)
            m[(m == 'bark') & (((X + np.sin(Y * 0.5)) % 2.8) < 0.6)] = 'barkd'
            return m
        return g

    def tronco_pierna(x0, y0, x1, r0, r1, far):
        m = c.caps([(x0, y0), ((x0 + x1) / 2, 61), (x1, 69.5)], [r0, (r0 + r1) / 2, r1])
        for dx, dy in [(-r1 - 1, 2.5), (-r1 * 0.4, 3.4), (r1 * 0.4, 3.2), (r1 + 1, 2.2)]:     # raíces que se agarran al suelo
            m |= c.caps([(x1, 69.5), (x1 + dx, 72 + dy * 0.4)], [2.2, 1.0])
        c.parte(m, leg_mat(58), R=4, bias=-0.3 if far else 0.04, far=far)

    def puno(x, y, far):
        """puño de madera nudosa, como una maza, con nudillos de piedra"""
        b = -0.3 if far else 0.0
        c.parte(c.ell(x, y, 5.2, 5.6) | c.ell(x - 1.5, y + 2.5, 4, 3.6), bark(0.6, 2.6), R=4, bias=b + 0.1, far=far)
        for k in range(3):
            c.parte(c.ell(x - 3.6, y - 2 + k * 2.4, 1.3, 1.0), stone(), R=1, bias=b, outline='#0e0e10', far=far)
    # ---- cola gruesa apoyada en el suelo ----
    c.local(rot=P['tail'] * 0.4, piv=(47, 56))
    c.parte(c.caps([(46, 56), (54, 62), (62, 66), (70, 67.5)], [5.5, 4.6, 3.4, 2.0]), 'skin', R=4)
    for (x, y, r) in [(52.5, 57.5, 2.8), (59, 61.5, 2.5), (65, 64.3, 2.0)]:
        c.parte(c.poly([(x - r, y + 1.6), (x - r * 0.4, y - r * 0.8), (x + r * 0.7, y - r * 0.5), (x + r, y + 1.4)]), bark(0.3, 2.4), R=2, outline='#140a06')
    hoja(c, (68.5, 67.5), (78, 64 + sw * 0.4), 3.6)
    c.local()
    # ---- pierna y brazo lejanos ----
    tronco_pierna(45.5, 51, 47, 5.2, 5.0, True)
    c.parte(c.caps([(44.5, 31), (47.5, 40), (48, 48)], [4.4, 3.9, 3.7]), lambda X, Y: np.where(Y > 40, 'bark', 'skin').astype(object), R=3.5, bias=-0.3, far=True)
    puno(48.5, 53, True)
    # ---- torso alto, erguido ----
    torso = c.ell(39, 39, 9.5, 12.5) | c.ell(40, 49, 9.5, 6.5)

    def torso_mat(X, Y):
        m = np.full(X.shape, 'skin', object)
        chest = (X < 40 + (Y - 38) * 0.1) & (Y > 29) & (Y < 48)
        m[chest] = 'bark'
        m[chest & (((X * 0.25 + Y) % 3.2) < 0.6)] = 'barkd'
        m[(Y >= 48) & (X < 40)] = 'belly'
        return m
    c.parte(torso, torso_mat, R=9)
    # ---- pierna cercana ----
    tronco_pierna(36, 52, 34.5, 5.8, 5.6, False)
    # ---- hombreras de piedra con musgo y florcitas ----
    for (x, y, rx, ry, far) in [(44, 29, 5, 3.4, True), (33.5, 30, 6, 4, False)]:
        c.parte(c.ell(x, y, rx, ry), stone(moss_top=y - ry * 0.2), R=3.5, bias=-0.3 if far else 0.0, outline='#0e0e10', far=far)
    # ---- brazo cercano que cuelga, con puño-maza ----
    c.parte(c.caps([(33, 32.5), (30, 41), (29.5, 48)], [4.8, 4.2, 4.0]), lambda X, Y: np.where(Y > 40.5 + np.sin(X * 1.6) * 0.8, 'bark', 'skin').astype(object), R=4)
    puno(29, 53, False)
    # ---- cuello: la cabeza ya no arranca donde termina el brazo ----
    c.parte(c.caps([(37.5, 31), (33.5, 24)], [4.8, 4.0]), 'skin', R=4)
    # ---- cabeza de geco, erguida, con ramas como astas ----
    c.local(dx=8, dy=P['head'] - 25.5, sc=0.76, piv=(19.5, 47.5))
    for (pts, rr) in [([(23, 41.5), (26, 35), (25.5, 30), (22.5, 27)], [1.5, 1.2, 0.9, 0.6]), ([(26, 35), (30.5, 32)], [1.0, 0.6]),
                      ([(25.5, 42), (31, 38), (35, 33.5), (39.5, 31.5)], [1.4, 1.1, 0.8, 0.5]), ([(33, 35.5), (36.5, 37)], [0.8, 0.5])]:
        c.parte(c.caps(pts, rr), bark(0.4, 2.2), R=1.5, bias=0.1, outline='#140a06')
    head = c.ell(19.5, 47.5, 9.6, 8.2, -0.04) | c.ell(11, 50.6, 6, 4.8, -0.05)
    c.parte(head, lambda X, Y: np.where(Y > 53.2 + (X - 10) * 0.05, 'belly', 'skin').astype(object), R=6, bias=0.04)
    for (base, tip, w) in [((22.5, 27), (18, 23), 2.2), ((30.5, 32), (34.5, 28), 1.9), ((39.5, 31.5), (44.5, 28.5), 2.2), ((25.5, 30), (29.5, 26.5), 1.8)]:
        hoja(c, base, (tip[0] + sw * 0.3, tip[1]), w)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dx=8, dy=P['head'] - 25.5, sc=0.76, piv=(19.5, 47.5))
    K = {'k': '#081a0a', 'W': '#fff8d0', 'g': '#6a4a10', 'G': '#d8b040'}
    if P['blink']:
        c.patron(12.4, 46.6, ['', 'kkkkkk'], K)
    else:   # mirada serena y firme, iris ámbar como savia
        ex, ey = c.patron(12.4, 46.6, ['.kkkkk', 'kWgGGk', '.kkkk.'], K)
        for dx in range(0, 6): c.put(ex + dx, ey - 1, '#0a2218')
    c.linea_d([(6, 52.4), (9, 53.2), (12, 53.4), (14.4, 52.8)], '#0a2218')
    for (x, y) in [(22, 28.2), (35.5, 32.8)]:                     # bellotas en las ramas
        c.patron(x, y, ['.c.', 'aaa', 'aaa', '.a.'], {'c': '#5a3a1a', 'a': '#b0782c'})
    c.local()
    for (x, y) in [(41.5, 26.2), (45, 26.3)]:                     # florcitas en el musgo de la hombrera
        c.patron(x, y, ['.p.', 'pyp', '.p.'], {'p': '#f4f0ff', 'y': '#ffd040'})
    return c


if __name__ == '__main__':
    build(args({})).guardar()
