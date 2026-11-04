"""Robledor (planta/roca): forma final de Hojardo por el camino del combate cercano.
«Un coloso de corteza y piedra. Se planta firme en el suelo y golpea con la fuerza de un roble centenario.»
Un coloso con silueta de gorila de corteza: enorme masa de hombros, espalda encorvada, brazos gigantes que
llegan al suelo y se apoyan en puños de piedra (plantado firme), piernas cortas como troncos con raíces,
rocas con musgo y hongos en los hombros, enredaderas que cuelgan, la cabeza de geco de la familia baja entre
los hombros y, en la espalda, el brote de Semillín convertido en un bosquecito."""
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
    c = Lienzo(RAMP, P, S=1.0 * 1.2, OX=40, OY=75, CX=47, CY=90, outline='#0e0806', mid=MID, span=SPAN)
    f = P['fl']; sw = math.sin(f * 1.3) * 0.8
    leafy = lambda X, Y: np.where(((X * 0.9 + Y * 1.3) % 3.6) < 0.6, 'vein', 'leaf').astype(object)
    # ---- bosquecito en la espalda ----
    c.local(rot=sw * 0.015, piv=(47, 26))
    c.parte(c.caps([(46, 27), (47.5, 19), (49, 13)], [3.4, 2.6, 2.0]) | c.caps([(47.5, 17), (54, 12.5)], [1.6, 0.9]) | c.caps([(47, 20), (41, 15)], [1.4, 0.8]),
            bark(0.2, 2.6), R=2.5)
    for i, (x, y, rx, ry) in enumerate([(49, 10, 8, 5.5), (40, 13, 6, 4.5), (57.5, 12.5, 6.5, 4.8), (45, 6.5, 5.5, 3.6), (54, 7, 5, 3.4), (63, 16.5, 4.5, 3.6)]):
        c.parte(c.ell(x + sw * 0.3, y, rx, ry), leafy, R=4, bias=0.05 if i % 2 else -0.04, outline='#123a14')
    c.local()
    # ---- pierna lejana: tronco corto con raíces ----
    legF = c.caps([(49, 57), (51, 64), (51, 69.5)], [6, 5.4, 5.4])
    for dx, dy in [(-4.5, 2.5), (-1.5, 3.2), (2.5, 3), (5.5, 2)]:
        legF |= c.caps([(51, 69.5), (51 + dx, 72 + dy * 0.4)], [2.2, 1.0])
    c.parte(legF, bark(0.1), R=4, bias=-0.3, far=True)
    # ---- brazo lejano: llega al suelo ----
    c.parte(c.caps([(45, 33), (48, 45), (46, 56)], [6, 5.2, 4.8]), bark(0.4, 3.0), R=4, bias=-0.15, far=True)
    c.parte(c.caps([(46.5, 56), (45.5, 63.5)], [4.6, 4.8]) | c.ell(45, 67, 5.0, 4.2), stone(), R=3.5, bias=-0.3, far=True, outline='#0e0e10')
    # ---- torso: gran masa de hombros, encorvado ----
    torso = c.ell(38, 37, 16, 13) | c.ell(43, 51, 11.5, 8.5) | c.ell(30, 40, 9, 10)
    c.parte(torso, bark(0.05, 3.4, moss_top=27.5), R=11, bias=-0.12)
    # ---- pierna cercana ----
    legN = c.caps([(37, 58), (35, 64.5), (35, 69.5)], [6.6, 5.8, 5.8])
    for dx, dy in [(-5.5, 2.5), (-2.5, 3.4), (1.5, 3.2), (5, 2.2)]:
        legN |= c.caps([(35, 69.5), (35 + dx, 72 + dy * 0.4)], [2.4, 1.1])
    c.parte(legN, bark(0.1), R=4, bias=0.06)
    # ---- rocas con musgo en los hombros, con hongos ----
    for (x, y, rx, ry) in [(46, 27.5, 6, 3.8), (52.5, 31, 4.6, 3.2)]:
        c.parte(c.ell(x, y, rx, ry), stone(moss_top=y - ry * 0.25), R=3.5, outline='#0e0e10')
    for (x, y) in [(49.5, 24.5), (51.5, 25.3), (54, 28.6)]:
        c.parte(c.caps([(x, y + 1.6), (x, y)], [0.5, 0.5]) | c.ell(x, y - 0.4, 1.4, 0.9), lambda X, Y: np.where(Y < y - 0.2, 'petal' if 'petal' in RAMP else 'moss', 'belly').astype(object), R=1, outline='#3a1a10')
    # ---- brazo cercano: enorme, apoyado en el puño de piedra ----
    def arm_mat(X, Y):
        m = np.full(X.shape, 'bark', object)                 # brazo de corteza clara, con musgo arriba y vetas
        m[((X * 0.9 + Y * 0.45 + np.sin(Y * 0.5)) % 3.0) < 0.65] = 'barkd'
        m[(Y < 38 + np.sin(X * 1.4) * 1.2)] = 'moss'
        return m
    c.parte(c.caps([(31, 33), (26, 45), (23.5, 56)], [7, 6, 5.4]), arm_mat, R=5, bias=0.2)
    c.parte(c.caps([(23.5, 55), (22.5, 63)], [5.0, 5.2]) | c.ell(21.5, 67, 5.4, 4.4), stone(), R=4, outline='#0e0e10')
    # enredaderas que cuelgan del brazo
    for (x0, y0, L) in [(26.5, 47, 9), (21, 50, 6)]:
        c.parte(c.caps([(x0, y0), (x0 - 0.8 + sw * 0.3, y0 + L * 0.5), (x0 + 0.4 + sw * 0.5, y0 + L)], [0.8, 0.7, 0.6]), 'stem', R=1)
        hoja(c, (x0 + 0.4 + sw * 0.5, y0 + L), (x0 + 3.5, y0 + L + 2.5), 1.4)
    # ---- cabeza baja, entre los hombros ----
    c.local(dx=4, dy=P['head'] + 6, sc=0.86, piv=(25, 24))
    head = c.ell(25.5, 21.5, 9.6, 8.2, -0.05) | c.ell(16.5, 24.5, 6.4, 5, -0.05)
    c.parte(head, lambda X, Y: np.where(Y > 27.4 + (X - 14) * 0.05, 'belly', 'skin').astype(object), R=6, bias=0.04)
    hoja(c, (27.5, 15), (37, 9), 2.8, shade=0.04)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dx=4, dy=P['head'] + 6, sc=0.86, piv=(25, 24))
    K = {'k': '#081a0a', 'W': '#fff8d0', 'g': '#6a4a10', 'G': '#d8b040'}
    if P['blink']:
        c.patron(18.4, 20, ['', 'kkkkkk'], K)
    else:   # ojo serio, iris ámbar como savia
        c.patron(18.4, 20, ['kkkkkkk', 'kWgGGk.', '.kkkk..'], K)
    for dx in range(-1, 8): c.putd(18.4 + dx * 0.85, 19.2 - (dx > 2) * 0.8, '#0a2218')
    c.linea_d([(11, 26.4), (14, 27.2), (17, 27.5), (20, 27.2)], '#0a2218')
    c.local()
    for i, (x, y) in enumerate([(66, 22), (36, 18), (70, 32)]):           # hojitas que caen del bosquecito
        X, Y = (int(v) for v in c.tp(x + math.sin(f + i) * 1.5, y + (f * 2 + i * 3) % 8))
        c.put(X, Y, '#74d050'); c.put(X + 1, Y, '#48a83a')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
