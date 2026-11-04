"""Fogarzo (v2): evolución de Ignito. «Su lomo arde como una hoguera.» Zorro joven: más alto y estilizado,
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
    'rock':  ['#16121a', '#262026', '#3a3236', '#504548', '#685a5a', '#83736e', '#a08e84'],
    'gold':  ['#5e2410', '#8e3e16', '#bc601e', '#e08628', '#f4aa36', '#ffcc58', '#ffe89a'],
    'fur2':  ['#7a2418', '#b23a18', '#e8501c', '#ff7424', '#ff9a34', '#ffc048', '#ffdc70'],
}
MID = {'rock': 3.6, 'gold': 3.8, 'furd': 3, 'fur2': 4, 'fur': 4, 'cream': 3.9, 'sock': 2, 'flame': 4, 'pink': 1}
SPAN = {'cream': 3.0, 'sock': 4, 'furd': 4}


def socks(top):
    def f(X, Y):
        t = top + np.sin(X * 2.3) * 0.8
        return np.where(Y >= t, 'sock', np.where(Y >= t - 2.4, 'furd', 'fur')).astype(object)
    return f


Z = np.zeros((80, 80), bool)


def rockplate(c, pts, far=False):
    c.parte(c.poly(pts), 'rock', R=2, bias=-0.15 if far else 0.15, outline='#120a0a', far=far)


def build(P):
    """En guardia: agachado de adelante, cabeza baja, una pata levantada, a punto de saltar.
    Dos colas de fuego. Semillas de sus dos formas finales: placas de roca en antebrazos y frente
    (Magmaurio) y plumas de fuego que le brotan en los hombros (Solarix)."""
    c = Lienzo(RAMP, P, S=0.9, mid=MID, span=SPAN, lit={'fur': 'fur2', 'fur2': 'fur2', 'furd': 'furd'})
    # ---- patas lejanas: trasera estirada, delantera apoyada y adelantada ----
    c.parte(c.caps([(54, 49), (57, 57), (60.5, 63), (59, 71)], [4.6, 3.0, 1.8, 1.6]) | c.ell(57.5, 72.9, 3.0, 1.5), socks(63), R=3, bias=-0.3, far=True)
    c.parte(c.caps([(35, 52), (32.5, 61), (32.5, 71)], [3.2, 2.1, 1.8]) | c.ell(31, 72.9, 2.9, 1.5), socks(63), R=3, bias=-0.3, far=True)
    rockplate(c, [(31.6, 57.6), (34.2, 56.6), (35.2, 59.2), (34, 61.6), (32, 61.2)], far=True)
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
    c.local(rot=-P['tail'] * 0.8, piv=(58, 43))
    cola([(58, 43), (60.5, 37), (61.5, 30.5), (60.5, 24), (58, 18), (54.5, 13.5)], [2.6, 3.5, 4.2, 4.3, 3.6, 2.2],
         [(54.5, 13.5, 10, -0.45, 0.1, 2.5), (59.5, 18, 8, -0.05, 0.12, 2.2), (62.5, 24.5, 6, 0.35, 0.12, 1.8), (56, 22, 6, -0.75, 0.04, 1.7)],
         [(61, 30), (60.2, 24), (57.8, 19)], 33, True)
    c.local(rot=P['tail'], piv=(59, 45))
    cola([(59, 45), (65, 42.5), (69.5, 37), (72, 30.5), (72.5, 24), (71, 18)], [2.8, 3.8, 4.6, 4.8, 4.0, 2.5],
         [(71, 18, 12, -0.02, 0.2, 2.8), (74, 24, 7.5, 0.36, 0.2, 2.3), (75, 31, 5.5, 0.75, 0.15, 1.8), (68.5, 23, 7, -0.35, 0.08, 1.9)],
         [(72, 30), (72.2, 24.5), (71.2, 19.5)], 38, False)
    c.local()
    # ---- oreja lejana ----
    c.local(dx=-1, dy=P['head'] + 7)
    c.parte(c.poly([(23.5, 25), (24.3, 19.5), (25.8, 14.8), (27.3, 12), (28.9, 13.5), (30.5, 18.6), (32, 25)]),
            lambda X, Y: np.where(Y < 13.5, 'sock', 'fur').astype(object), R=3, bias=-0.3, far=True)
    c.local()
    # ---- cuerpo agachado: pecho bajo, anca alta ----
    body = c.ell(31, 48, 9, 8.5) | c.ell(35, 44.5, 7, 5.5) | c.ell(44, 46, 11, 6.2, -0.1) | c.ell(56, 44, 8.5, 7.5)
    c.parte(body, lambda X, Y: np.where((Y > 51 - (X - 30) * 0.12) & (X < 53), 'cream', 'fur').astype(object), R=8)
    c.parte(c.ell(27, 49, 6.5, 8) | c.poly([(24, 44), (19.5, 50), (23, 50.5), (20.5, 55), (24.5, 54), (25, 58), (28.5, 55), (30, 59), (31.5, 53), (31, 45)]),
            'cream', R=5, bias=0.05, soft=True)
    c.parte(c.ell(56.5, 48, 7.5, 8, 0.3), 'fur', R=6, bias=0.03, soft=True)
    # ---- el lomo arde: crin de fuego del medio del lomo hacia el anca ----
    c.local(rot=P['tail'] * 0.4, piv=(47, 40))
    ridge = c.caps([(44, 40.5), (48.5, 40), (53, 38.5), (56, 37.5)], [2.2, 2.6, 2.4, 1.8])
    MANE = [(48.5, 40, 12, 0.18, 0.2, 2.9), (44.5, 40.5, 8, 0.05, 0.15, 2.3), (51.5, 38.6, 9, 0.32, 0.2, 2.4), (55.5, 37.6, 5.5, 0.55, 0.12, 1.8)]
    mane, minner, mcore = c.fuego(ridge, MANE, inner_base=c.caps([(45, 40.2), (54, 38.2)], 1.3), core=c.caps([(47, 39.6), (50.5, 39.4)], 0.9))
    c.parte(mane, lambda X, Y: np.where(Y > 41.4 + np.sin(X * 1.9) * 0.6, 'fur2', 'flame').astype(object), R=4, outline='#9a1a0c', fire=(minner, mcore))
    c.local()
    # ---- plumas de fuego que le brotan en el hombro (todavía cerradas) ----
    c.local(rot=-P['wing'] * 0.12, piv=(35.5, 44))
    for i, (bx, by, ang, L) in enumerate([(35, 42, 76, 13), (35, 44.2, 91, 14.5), (35.4, 46.4, 106, 11)]):   # ala plegada en el costado
        a = np.radians(ang)
        pts = [(bx + np.sin(a) * L * t, by - np.cos(a) * L * t - 1.5 * t * t) for t in (0, 0.35, 0.7, 1.0)]
        fm = c.caps(pts, [2.3, 1.9, 1.2, 0.5])

        def fmat(X, Y, bx=bx, by=by, L=L):
            m = np.full(X.shape, 'gold', object)
            m[np.hypot(X - bx, Y - by) > L * 0.45] = 'flame'
            return m
        c.parte(fm, fmat, R=2, outline='#5a1a0c', bias=-0.08 if i % 2 else -0.16, fire=(c.caps(pts[1:], [0.9, 0.7, 0.4]), Z))
    c.local()
    # ---- patas cercanas: trasera firme, delantera levantada y doblada ----
    c.parte(c.caps([(57, 51), (60.5, 58), (63.5, 64), (62, 71)], [5.2, 3.2, 2.0, 1.8]) | c.ell(60.5, 72.9, 3.3, 1.6), socks(64), R=3)
    c.parte(c.caps([(29, 53), (25.5, 59.5), (22.5, 63)], [3.6, 2.4, 2.0]) | c.ell(20.6, 64, 2.9, 1.7, -0.5), socks(62.5), R=3)
    rockplate(c, [(25.4, 56.2), (28.4, 55.6), (29.2, 58.4), (26.6, 60.6), (24.8, 59.4)])
    # ---- cabeza baja y adelantada (en guardia) ----
    c.local(dx=-1, dy=P['head'] + 7)
    cheek = c.poly([(8, 37), (13, 42), (20, 43.5), (30, 42.5), (34.5, 39), (29.5, 38.5), (32, 35.5), (23, 34.5)])
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
    rockplate(c, [(8.6, 26.4), (11.5, 24.4), (15.5, 24.2), (16.4, 26), (12.5, 26.8)])     # la roca asoma en la frente
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dx=-1, dy=P['head'] + 7)
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
    for x in (18.5, 20.4): c.putd(x, 65.4, '#f0cca0')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
