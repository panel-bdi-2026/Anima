"""Ignito (estándar aprobado): zorrito de fuego. Cola de zorro que se enciende de a poco."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
from motor import Lienzo, args

RAMP = {
    'fur':   ['#4a1410', '#7a2418', '#b23a18', '#dc5c20', '#f5822e', '#ffa848', '#ffcf78'],
    'cream': ['#8a5a44', '#c08a64', '#e6bc8e', '#f8dcb4', '#fff2da'],
    'sock':  ['#1a0c10', '#2e1416', '#46201c', '#643024', '#844232'],
    'flame': ['#9a1c0e', '#d8361a', '#f65e1c', '#ff8e24', '#ffc038', '#ffe680', '#fffbe0'],
    'pink':  ['#a84a4a', '#d8706a', '#f4a090'],
    'furd':  ['#3a1210', '#5a1c14', '#7a2818', '#9a3a20', '#b84e28'],
    'fur2':  ['#7a2418', '#b23a18', '#e8501c', '#ff7424', '#ff9a34', '#ffc048', '#ffdc70'],
}
MID = {'furd': 3, 'fur2': 4, 'fur': 4, 'cream': 3.9, 'sock': 2, 'flame': 4, 'pink': 1}
SPAN = {'cream': 3.0, 'sock': 4, 'furd': 4}


def socks(top):
    def f(X, Y):
        t = top + np.sin(X * 2.3) * 0.8
        return np.where(Y >= t, 'sock', np.where(Y >= t - 2.2, 'furd', 'fur')).astype(object)
    return f


def build(P):
    c = Lienzo(RAMP, P, S=0.82, mid=MID, span=SPAN, lit={'fur': 'fur2', 'fur2': 'fur2', 'furd': 'furd'})
    # patas lejanas
    c.parte(c.caps([(52, 55), (55, 62), (57, 66), (56, 71)], [4.2, 2.8, 1.7, 1.7]) | c.ell(54.4, 72.8, 2.9, 1.5), socks(66), R=3, bias=-0.3, far=True)
    c.parte(c.caps([(34, 54), (35, 62), (35, 71)], [3.0, 2.0, 1.7]) | c.ell(33.4, 72.8, 2.8, 1.5), socks(64), R=3, bias=-0.3, far=True)
    # cola de zorro que se enciende desde la mitad
    c.local(rot=P['tail'], piv=(57, 50))
    SPINE = [(57, 49), (62, 46.5), (66, 41), (68, 34), (68.5, 27), (67, 20)]
    tail = c.caps(SPINE, [2.8, 4.2, 5.2, 5.6, 4.7, 2.9])
    TONG = [(67, 20, 18, -0.05, 0.22, 3.4), (71, 27, 14, 0.32, 0.28, 3.0), (72, 34, 9, 0.62, 0.22, 2.4),
            (70.5, 40, 5, 0.9, 0.10, 1.8), (64, 24, 10, -0.32, 0.10, 2.4)]
    tail, inner, core = c.fuego(tail, TONG, inner_base=c.caps(SPINE[3:], [3.0, 2.4, 1.4]),
                                core=c.caps([(68, 33), (68.4, 27), (67.4, 22)], [1.8, 1.6, 1.0]),
                                wisps=[(60, 13, 1.2), (79, 18, 1.1)])

    def tail_mat(X, Y):
        m = np.full(X.shape, 'fur', object)
        k = Y + (X - 66) * 0.25; edge = 41 + 2.2 * np.sin(X * 1.7 + Y * 0.6)
        m[k < edge + 4] = 'fur2'; m[k < edge] = 'flame'
        return m
    c.parte(tail, tail_mat, R=6, outline='#9a1a0c', fire=(inner, core))
    # oreja lejana
    c.local(dy=P['head'])
    c.parte(c.poly([(25.3, 32.0), (26.04, 26.45), (27.37, 22.01), (28.7, 19.27), (30.18, 20.6), (31.66, 25.34), (33.07, 32.0)]),
            lambda X, Y: np.where(Y < 20, 'sock', 'fur').astype(object), R=3, bias=-0.3, far=True)
    c.local()
    # cuerpo, pechera y anca
    body = c.ell(31, 49, 9, 9) | c.ell(35, 45, 7, 5) | c.ell(43, 51, 10, 7) | c.ell(54, 50, 8, 7.5)
    c.parte(body, lambda X, Y: np.where((Y > 55.5) & (X < 52), 'cream', 'fur').astype(object), R=8)
    c.parte(c.ell(27, 50, 6, 8) | c.poly([(24, 46), (20, 51), (23.5, 51.5), (21.5, 55.5), (25.5, 54.5), (26, 58.5), (29.5, 55), (30, 47)]),
            'cream', R=5, bias=0.05, soft=True)
    c.parte(c.ell(55, 54, 7, 7.5, 0.3), 'fur', R=6, bias=0.03, soft=True)
    # patas cercanas
    c.parte(c.caps([(56, 57), (59, 63), (61, 67), (60, 71)], [4.8, 3.0, 1.9, 1.9]) | c.ell(58.0, 72.8, 3.2, 1.6), socks(66), R=3)
    c.parte(c.caps([(29, 55), (30, 62), (29, 71)], [3.4, 2.2, 1.9]) | c.ell(27.2, 72.8, 3.0, 1.6), socks(64), R=3)
    # cabeza
    c.local(dy=P['head'])
    cheek = c.poly([(9, 43), (14, 48), (21, 49), (31, 48), (35, 45), (30, 44), (32, 41), (24, 40)])
    head = c.ell(22, 36, 12, 10.5, -0.08) | c.poly([(14, 34), (4, 41), (5, 44), (15, 46)]) | cheek
    c.parte(head, lambda X, Y: np.where((Y > 42) | (cheek & (Y > 41)), 'cream', 'fur').astype(object), R=7, bias=0.04)
    # oreja cercana

    def ear_mat(X, Y):
        m = np.full(X.shape, 'fur', object)
        cx = 19.3 + (Y - 14) * 0.1; half = (Y - 16.4) * 0.3
        inner = (Y > 17) & (Y < 30.5) & (np.abs(X - cx) < half)
        m[inner] = 'pink'
        m[inner & (Y > 27.5 - (np.abs(X - cx) * 1.5)) & (np.abs(X - cx) < half * 0.7)] = 'cream'
        m[Y < 16] = 'sock'
        return m
    c.parte(c.poly([(15.19, 31.0), (15.41, 25.82), (16.3, 20.64), (17.71, 16.94), (18.96, 14.87), (20.22, 16.2), (21.92, 20.64), (23.55, 25.45), (24.81, 30.26)]),
            ear_mat, R=4)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'])
    K = {'k': '#1a0c14', 'a': '#9a3e18', 'A': '#d87a2a', 'W': '#ffffff'}
    if P['blink']:
        ex, ey = c.patron(12.6, 34.6, ['', '', 'k...k', '.kkk.'], K)
    else:
        ex, ey = c.patron(12.6, 34.6, ['.kkkk.', 'kWWkkk', 'kWkkak', 'kkaAAk', '.kkkk.'], K)
    for dx in range(-1, 5): c.put(ex + dx, ey - 1, '#5a1a12')
    c.put(ex + 5, ey, '#5a1a12')
    c.patron(3, 40.5, ['.nn', 'nnn'], {'n': '#1a0c14'}); c.putd(4, 40.5, '#6a4a54')
    for x, y in [(7, 45), (8.5, 45.4), (10, 46)]: c.putd(x, y, '#a0604a')
    for x, y in [(19, 42.5), (20.5, 42.5)]: c.putd(x, y, '#f4a090')
    c.local()
    for x in (24, 26.5, 29, 55, 57.5, 60): c.putd(x, 74.5, '#f0cca0')
    for x, y in [(36, 42.5), (38, 42.8), (42, 44.3), (47, 44.3), (51, 43.5)]: c.putd(x, y, '#ffcf78')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
