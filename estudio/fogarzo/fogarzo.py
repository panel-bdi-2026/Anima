"""Fogarzo: evolución de Ignito. «Su lomo arde como una hoguera.» Zorro joven: más alto y estilizado,
patas largas con calcetines oscuros hasta la rodilla, hocico más largo, mirada más decidida,
crin de fuego a lo largo del lomo y cola encendida más larga."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
from motor import Lienzo, args

RAMP = {
    'fur':   ['#3e100c', '#6a1c14', '#a02e16', '#cc4a1c', '#ea6c26', '#ff9040', '#ffbc68'],
    'cream': ['#8a5a44', '#c08a64', '#e6bc8e', '#f8dcb4', '#fff2da'],
    'sock':  ['#160a0e', '#281214', '#3e1c1a', '#5a2a22', '#7a3c2e'],
    'flame': ['#9a1c0e', '#d8361a', '#f65e1c', '#ff8e24', '#ffc038', '#ffe680', '#fffbe0'],
    'pink':  ['#9a4244', '#c8645e', '#e8907e'],
    'furd':  ['#32100e', '#501a12', '#6e2616', '#8c361e', '#a84626'],
    'fur2':  ['#7a2418', '#b23a18', '#e8501c', '#ff7424', '#ff9a34', '#ffc048', '#ffdc70'],
}
MID = {'furd': 3, 'fur2': 4, 'fur': 4, 'cream': 3.9, 'sock': 2, 'flame': 4, 'pink': 1}
SPAN = {'cream': 3.0, 'sock': 4, 'furd': 4}


def socks(top):
    def f(X, Y):
        t = top + np.sin(X * 2.3) * 0.8
        return np.where(Y >= t, 'sock', np.where(Y >= t - 2.4, 'furd', 'fur')).astype(object)
    return f


def build(P):
    c = Lienzo(RAMP, P, S=0.9, mid=MID, span=SPAN, lit={'fur': 'fur2', 'fur2': 'fur2', 'furd': 'furd'})
    # ---- patas lejanas (largas; la trasera con corvejón marcado) ----
    c.parte(c.caps([(54, 50), (57, 58), (60, 63), (58.5, 71)], [4.6, 3.0, 1.8, 1.6]) | c.ell(57, 72.9, 3.0, 1.5), socks(62), R=3, bias=-0.3, far=True)
    c.parte(c.caps([(35, 49), (36, 60), (36, 71)], [3.2, 2.1, 1.7]) | c.ell(34.4, 72.9, 2.9, 1.5), socks(61), R=3, bias=-0.3, far=True)
    # ---- cola: más larga que la de Ignito, se enciende desde la mitad ----
    c.local(rot=P['tail'], piv=(59, 45))
    SPINE = [(59, 45), (64.5, 42), (68, 36), (69.5, 29), (69.5, 22), (67.5, 15.5)]
    tail = c.caps(SPINE, [2.8, 4.0, 5.0, 5.4, 4.6, 2.8])
    TONG = [(67.5, 15.5, 14, -0.05, 0.2, 3.2), (71.5, 22, 11, 0.32, 0.24, 2.8), (72.5, 29, 7.5, 0.62, 0.2, 2.2),
            (71.5, 35, 4.5, 0.9, 0.1, 1.6), (64.5, 20, 9, -0.32, 0.1, 2.2)]
    tail, inner, core = c.fuego(tail, TONG, inner_base=c.caps(SPINE[3:], [2.9, 2.3, 1.3]),
                                core=c.caps([(69.5, 28), (69.7, 22), (68.5, 17)], [1.7, 1.5, 0.9]), wisps=[(62, 8, 1.1)])

    def tail_mat(X, Y):
        m = np.full(X.shape, 'fur', object)
        k = Y + (X - 68) * 0.25; edge = 36.5 + 2.2 * np.sin(X * 1.7 + Y * 0.6)
        m[k < edge + 4] = 'fur2'; m[k < edge] = 'flame'
        return m
    c.parte(tail, tail_mat, R=6, outline='#9a1a0c', fire=(inner, core))
    # ---- oreja lejana ----
    c.local(dy=P['head'])
    c.parte(c.poly([(23.5, 25), (24.3, 19.5), (25.8, 14.8), (27.3, 12), (28.9, 13.5), (30.5, 18.6), (32, 25)]),
            lambda X, Y: np.where(Y < 13.5, 'sock', 'fur').astype(object), R=3, bias=-0.3, far=True)
    c.local()
    # ---- cuerpo: pecho hondo, cintura marcada, anca fuerte ----
    body = c.ell(31, 44, 9, 9.5) | c.ell(35, 40, 7, 5.5) | c.ell(44, 46, 11, 6.5) | c.ell(56, 45, 8.5, 7.5)
    c.parte(body, lambda X, Y: np.where((Y > 50) & (X < 53), 'cream', 'fur').astype(object), R=8)
    # pechera tupida (más grande que la de Ignito) con mechones hacia adelante y abajo
    c.parte(c.ell(27, 45, 6.5, 8.5) | c.poly([(24, 40), (19.5, 46), (23, 46.5), (20.5, 51), (24.5, 50), (24, 55), (28, 52), (29.5, 57), (31.5, 50), (31, 41)]),
            'cream', R=5, bias=0.05, soft=True)
    c.parte(c.ell(56.5, 49, 7.5, 8, 0.3), 'fur', R=6, bias=0.03, soft=True)
    # ---- crin de fuego: el lomo arde como una hoguera ----
    c.local(rot=P['tail'] * 0.4, piv=(44, 40))
    ridge = c.caps([(33, 37), (40, 38.2), (47, 39), (53, 38.6)], [2.4, 2.8, 2.6, 2.0])
    MANE = [(41.5, 38, 15, 0.12, 0.20, 3.2), (36, 37.2, 10, 0.05, 0.16, 2.6), (47, 38.6, 11, 0.28, 0.22, 2.7),
            (52, 38.6, 6.5, 0.5, 0.15, 2.0), (32.5, 37.4, 5, -0.15, 0.1, 1.6)]
    mane, minner, mcore = c.fuego(ridge, MANE, inner_base=c.caps([(36, 37.5), (50, 38.8)], 1.4),
                                  core=c.caps([(40, 37), (45, 37.6)], 1.0))

    def mane_mat(X, Y):
        m = np.full(X.shape, 'flame', object)
        m[Y > 39.6 + np.sin(X * 1.9) * 0.7] = 'fur2'
        return m
    c.parte(mane, mane_mat, R=4, outline='#9a1a0c', fire=(minner, mcore))
    c.local()
    # ---- patas cercanas ----
    c.parte(c.caps([(57, 52), (60.5, 59), (63, 64), (61.5, 71)], [5.2, 3.2, 2.0, 1.8]) | c.ell(60, 72.9, 3.3, 1.6), socks(63), R=3)
    c.parte(c.caps([(29, 50), (30, 60), (29.5, 71)], [3.6, 2.3, 1.9]) | c.ell(27.8, 72.9, 3.1, 1.6), socks(61), R=3)
    # ---- cabeza: más larga y angulosa que la de Ignito ----
    c.local(dy=P['head'])
    cheek = c.poly([(8, 37), (13, 42), (20, 43.5), (30, 42.5), (34.5, 39), (29.5, 38.5), (32, 35.5), (23, 34.5)])
    head = c.ell(21, 30.5, 11.5, 9.5, -0.12) | c.poly([(13, 28), (1.5, 34.5), (2.5, 37.5), (14, 40)]) | cheek
    c.parte(head, lambda X, Y: np.where((Y > 36.2 + (X - 2) * 0.03) | (cheek & (Y > 35.5)), 'cream', 'fur').astype(object), R=7, bias=0.04)

    def ear_mat(X, Y):
        m = np.full(X.shape, 'fur', object)
        cx = 18.4 + (Y - 8) * 0.1; half = (Y - 10.6) * 0.3
        inner = (Y > 11) & (Y < 25) & (np.abs(X - cx) < half)
        m[inner] = 'pink'
        m[inner & (Y > 22 - (np.abs(X - cx) * 1.5)) & (np.abs(X - cx) < half * 0.7)] = 'cream'
        m[Y < 10.3] = 'sock'
        return m
    c.parte(c.poly([(14.2, 25.5), (14.4, 20), (15.4, 14.5), (16.9, 10.6), (18.2, 8.5), (19.6, 9.9), (21.4, 14.5), (23.2, 19.6), (24.5, 24.8)]),
            ear_mat, R=4)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'])
    K = {'k': '#1a0c14', 'a': '#9a3e18', 'A': '#e08a2c', 'W': '#ffffff'}
    if P['blink']:
        ex, ey = c.patron(10.6, 28.4, ['', '', 'k...k', '.kkk.'], K)
    else:   # ojo algo más rasgado que el de Ignito (más decidido)
        ex, ey = c.patron(10.6, 28.4, ['.kkkk.', 'kWkkkk', 'kWkkak', '.kaAAk', '..kkk.'], K)
    for dx in range(-1, 6): c.put(ex + dx, ey - 1 + (dx > 3), '#4a1410')     # ceja inclinada
    c.patron(1.2, 34.2, ['.nn', 'nnn'], {'n': '#1a0c14'}); c.putd(2.4, 34.2, '#6a4a54')
    for x, y in [(5, 38.8), (6.5, 39.2), (8, 39.8), (9.5, 40.2)]: c.putd(x, y, '#a0604a')
    for x, y in [(17.5, 36.3), (19, 36.3)]: c.putd(x, y, '#f4a090')
    c.local()
    for x in (25, 27.5, 30, 57.5, 60, 62.5): c.putd(x, 74.5, '#f0cca0')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
