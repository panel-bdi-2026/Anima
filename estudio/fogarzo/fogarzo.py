"""Fogarzo (v2): evolución de Ignito. «Su lomo arde como una hoguera.» Zorro joven: más alto y estilizado,
patas largas con calcetines oscuros hasta la rodilla, hocico más largo, mirada más decidida,
crin de fuego a lo largo del lomo y cola encendida más larga."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
import motor
from motor import Lienzo, args

RAMP = {
    'fur':   ['#2e0a0a', '#521410', '#821f14', '#aa3018', '#cc4620', '#e8642c', '#f88c44'],
    'cream': ['#8a5a44', '#c08a64', '#e6bc8e', '#f8dcb4', '#fff2da'],
    'sock':  ['#160a0e', '#281214', '#3e1c1a', '#5a2a22', '#7a3c2e'],
    'flame': ['#9a1c0e', '#d8361a', '#f65e1c', '#ff8e24', '#ffc038', '#ffe680', '#fffbe0'],
    'pink':  ['#9a4244', '#c8645e', '#e8907e'],
    'furd':  ['#32100e', '#501a12', '#6e2616', '#8c361e', '#a84626'],
    'rock':  ['#16121a', '#262026', '#3a3236', '#504548', '#685a5a', '#83736e', '#a08e84'],
    'gold':  ['#5e2410', '#8e3e16', '#bc601e', '#e08628', '#f4aa36', '#ffcc58', '#ffe89a'],
    'fur2':  ['#7a2418', '#b23a18', '#e8501c', '#ff7424', '#ff9a34', '#ffc048', '#ffdc70'],
}
MID = {'rock': 3.6, 'gold': 3.8, 'furd': 3, 'fur2': 4, 'fur': 3.8, 'cream': 3.9, 'sock': 2, 'flame': 4, 'pink': 1}
SPAN = {'cream': 3.0, 'sock': 4, 'furd': 4}


def socks(top):
    def f(X, Y):
        t = top + np.sin(X * 2.3) * 0.8
        return np.where(Y >= t, 'sock', np.where(Y >= t - 2.4, 'furd', 'fur')).astype(object)
    return f


Z = np.zeros((motor.N, motor.N), bool)


def rockplate(c, pts, far=False):
    c.parte(c.poly(pts), 'rock', R=2, bias=-0.15 if far else 0.15, outline='#120a0a', far=far)


def build(P):
    """En guardia: postura baja y ancha, cabeza adelantada, las cuatro patas firmes.
    El lomo arde como una hoguera (crin de fuego de la cruz al anca). Placas de roca en los antebrazos."""
    c = Lienzo(RAMP, P, S=0.9, mid=MID, span=SPAN, lit={'fur': 'fur2', 'fur2': 'fur2', 'furd': 'furd'})
    # ---- patas lejanas: trasera estirada, delantera apoyada y adelantada ----
    c.parte(c.caps([(54, 49), (57, 57), (60.5, 63), (59, 71)], [4.6, 3.0, 1.8, 1.6]) | c.ell(57.5, 72.9, 3.0, 1.5), socks(60), R=3, bias=-0.3, far=True)
    c.parte(c.caps([(35, 50), (33.5, 60), (33.5, 71)], [3.2, 2.1, 1.8]) | c.ell(32, 72.9, 2.9, 1.5), socks(58), R=3, bias=-0.3, far=True)
    rockplate(c, [(32.6, 53.6), (35.2, 52.6), (36.2, 55.2), (35, 57.6), (33, 57.2)], far=True)
    # ---- dos colas de fuego: la de atrás más alta y abierta ----
    def cola(spine, rr, tong, core_pts, edge0, far):
        tail = c.caps(spine, rr)
        tail, inner, core = c.fuego(tail, tong, inner_base=c.caps(spine[3:], [v * 0.55 for v in rr[3:]]),
                                    core=c.caps(core_pts, [1.6, 1.3, 0.8]))

        def tail_mat(X, Y):
            m = np.full(X.shape, 'fur', object)
            k = Y + (X - 68) * 0.25; edge = edge0 + 2.2 * np.sin(X * 1.7 + Y * 0.6)
            m[k < edge + 4] = 'fur2'; m[k < edge] = 'flame'
            return m
        c.parte(tail, tail_mat, R=6, outline='#9a1a0c', fire=(inner, core), far=far, bias=-0.22 if far else 0)
    c.local(rot=P['tail'], piv=(59, 45))
    cola([(59, 45), (64.5, 42), (68.5, 36), (70.5, 29), (70.5, 22), (68.5, 15.5)], [2.9, 4.0, 5.0, 5.4, 4.6, 2.8],
         [(68.5, 15.5, 14, -0.05, 0.2, 3.2), (72.5, 22, 10, 0.32, 0.22, 2.8), (73, 29, 6.5, 0.62, 0.18, 2.1),
          (72, 35, 4.2, 0.9, 0.1, 1.5), (65.5, 20, 9, -0.32, 0.1, 2.2)],
         [(70.5, 28), (70.7, 22), (69.5, 17)], 37, False)
    c.local()
    # ---- oreja lejana ----
    c.local(dx=-1, dy=P['head'] + 4)
    c.parte(c.poly([(23.5, 25), (24.3, 19.5), (25.8, 14.8), (27.3, 12), (28.9, 13.5), (30.5, 18.6), (32, 25)]),
            lambda X, Y: np.where(Y < 13.5, 'sock', 'fur').astype(object), R=3, bias=-0.3, far=True)
    c.local()
    # ---- cuerpo agachado: pecho bajo, anca alta ----
    body = c.ell(31, 46, 9, 8.8) | c.ell(35, 42, 7, 5.5) | c.ell(44, 45, 11, 6.2, -0.06) | c.ell(56, 44, 8.5, 7.5)
    c.parte(body, lambda X, Y: np.where((Y > 50 - (X - 30) * 0.08) & (X < 53), 'cream', 'fur').astype(object), R=8)
    c.parte(c.ell(27, 47, 6.5, 8) | c.poly([(24, 42), (19.5, 48), (23, 48.5), (20.5, 53), (24.5, 52), (25, 56), (28.5, 53), (30, 57), (31.5, 51), (31, 43)]),
            'cream', R=5, bias=0.05, soft=True)
    c.parte(c.ell(56.5, 48, 7.5, 8, 0.3), 'fur', R=6, bias=0.03, soft=True)
    # ---- el lomo arde como una hoguera: crin de fuego de la cruz al anca, alta en el medio ----
    c.local(rot=P['tail'] * 0.4, piv=(46, 40))
    ridge = c.caps([(35, 38.6), (41, 39), (47, 39.2), (53, 38.4), (57, 37.4)], [2.4, 2.8, 2.9, 2.5, 1.8])
    MANE = [(44, 39.2, 16, 0.12, 0.2, 3.4), (38.5, 39, 11, -0.02, 0.16, 2.8), (49.5, 39, 13, 0.26, 0.22, 3.0),
            (54, 38.2, 8, 0.45, 0.16, 2.3), (35, 38.8, 6, -0.25, 0.08, 1.8), (57, 37.4, 5, 0.7, 0.1, 1.6)]
    mane, minner, mcore = c.fuego(ridge, MANE, inner_base=c.caps([(37, 39), (55, 38)], 1.5),
                                  core=c.caps([(42, 38.8), (48, 38.8)], 1.1))
    c.parte(mane, lambda X, Y: np.where(Y > 40.6 + np.sin(X * 1.9) * 0.6, 'fur2', 'flame').astype(object), R=4, outline='#9a1a0c', fire=(minner, mcore))
    c.local()
    # ---- patas cercanas: trasera firme, delantera levantada y doblada ----
    c.parte(c.caps([(57, 51), (60.5, 58), (63.5, 64), (62, 71)], [5.2, 3.2, 2.0, 1.8]) | c.ell(60.5, 72.9, 3.3, 1.6), socks(60), R=3)
    c.parte(c.caps([(29, 51), (26.5, 61), (25.5, 71)], [3.6, 2.4, 2.0]) | c.ell(23.8, 72.9, 3.2, 1.6), socks(58.5), R=3)
    rockplate(c, [(26.4, 54.2), (29.4, 53.4), (30, 56.4), (27.6, 58.4), (25.8, 57.2)])
    # ---- cabeza baja y adelantada (en guardia) ----
    c.local(dx=-1, dy=P['head'] + 4)
    cheek = c.poly([(8, 37), (13, 42), (20, 44), (27, 45.5), (31, 43.5), (36.5, 43), (33, 40.5), (37.5, 38.5), (31.5, 37.8), (33.5, 34.5), (23, 34.5)])
    head = c.ell(21, 30.5, 11.5, 9.5, -0.12) | c.poly([(13, 28), (1.5, 34.5), (2.5, 37.5), (14, 40)]) | cheek
    c.parte(head, lambda X, Y: np.where((Y > 36.2 + (X - 2) * 0.03) | (cheek & (Y > 35.5)), 'cream', 'fur').astype(object), R=7, bias=0.04)
    # placa de roca en la frente: la roca empieza a asomar
    pass

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
    c.local(dx=-1, dy=P['head'] + 4)
    K = {'k': '#1a0c14', 'a': '#9a3e18', 'A': '#e08a2c', 'W': '#ffffff'}
    if P['blink']:
        ex, ey = c.patron(10.6, 28.4, ['', '', 'k...k', '.kkk.'], K)
    else:   # mirada concentrada, hacia adelante
        ex, ey = c.patron(10.6, 28.4, ['.kkkk.', 'kWkkkk', 'kWkkak', '.kaAAk', '..kkk.'], K)
    for dx in range(-1, 6): c.put(ex + dx, ey - 1 + (dx > 3), '#4a1410')
    c.patron(1.2, 34.2, ['.nn', 'nnn'], {'n': '#1a0c14'}); c.putd(2.4, 34.2, '#6a4a54')
    for x, y in [(5, 38.8), (6.5, 39.2), (8, 39.8), (9.5, 40.2)]: c.putd(x, y, '#a0604a')
    for x, y in [(17.5, 36.3), (19, 36.3)]: c.putd(x, y, '#f4a090')
    c.local()
    for x in (58, 60.5, 63): c.putd(x, 74.5, '#f0cca0')
    for x in (21.5, 24, 26.5): c.putd(x, 74.5, '#f0cca0')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
