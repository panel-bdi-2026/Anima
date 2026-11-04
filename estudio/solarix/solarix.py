"""Solarix (fuego/viento): forma final de Fogarzo por el camino del combate a distancia.
«Aprendió a luchar desde lejos, esquivando con gracia. Sus alas de fuego le permiten planear sobre el
viento cálido.» Esbelto y elegante: patas largas y finas, cuello alto, orejas largas, pelaje dorado,
alas de plumas doradas cuyas puntas son fuego, y cola larga que flamea hacia atrás como al viento."""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
from motor import Lienzo, args

RAMP = {
    'fur':   ['#4a1c10', '#7a3016', '#b24c1e', '#dc7228', '#f49836', '#ffc058', '#ffe08a'],
    'cream': ['#8a5e46', '#c49068', '#ecc896', '#fae4be', '#fff6e2'],
    'sock':  ['#2a1210', '#42201a', '#5e3024', '#7c4230', '#9a5638'],
    'flame': ['#9a1c0e', '#d8361a', '#f65e1c', '#ff8e24', '#ffc038', '#ffe680', '#fffbe0'],
    'gold':  ['#5e2410', '#8e3e16', '#bc601e', '#e08628', '#f4aa36', '#ffcc58', '#ffe89a'],
    'pink':  ['#a84a4a', '#d8706a', '#f4a090'],
    'fur2':  ['#7a2c16', '#b4461a', '#e8681e', '#ff8a28', '#ffaa38', '#ffcc50', '#ffe478'],
    'furd':  ['#3a1610', '#5a2416', '#7a341c', '#9a4624', '#b85a2c'],
}
MID = {'fur': 4, 'cream': 3.9, 'sock': 2, 'gold': 3.8, 'fur2': 4, 'furd': 3, 'pink': 1}
SPAN = {'cream': 3, 'sock': 4, 'gold': 4.5}


def socks(top):
    def f(X, Y):
        t = top + np.sin(X * 2.3) * 0.8
        return np.where(Y >= t, 'sock', np.where(Y >= t - 2.4, 'furd', 'fur')).astype(object)
    return f


EDGE = [(36, 40), (38, 31), (42, 22.5), (48.5, 16), (56, 12.5)]   # borde delantero del ala (hombro -> muñeca -> punta)


def edge_at(u):
    seg = min(int(u * (len(EDGE) - 1)), len(EDGE) - 2); t = u * (len(EDGE) - 1) - seg
    (ax, ay), (bx, by) = EDGE[seg], EDGE[seg + 1]
    return ax + (bx - ax) * t, ay + (by - ay) * t


# plumas: (posición en el borde 0..1, ángulo hacia atrás en grados: 90 = hacia abajo, 0 = hacia atrás, largo)
FEATHERS = [(0.2, 74, 10), (0.4, 56, 13.5), (0.6, 38, 16.5), (0.8, 20, 19), (1.0, 2, 19)]


def wing_parts(c, P, dx=0, dy=0, dark=0.0, far=False):
    """dibuja un ala pluma por pluma (cada una con su contorno) y su borde de cobertoras encima"""
    Z = np.zeros((80, 80), bool)
    for i, (u, ang, L) in enumerate(FEATHERS):
        bx, by = edge_at(u); bx += dx; by += dy
        a = math.radians(ang)
        pts, rr = [], []
        for k in range(7):
            t = k / 6
            pts.append((bx + math.cos(a) * L * t, by + math.sin(a) * L * t - 1.2 * t * t * (1 - u)))
            rr.append(2.7 * (1 - t) ** 0.55 + 0.6)
        fm = c.caps(pts, rr)

        def fmat(X, Y, bx=bx, by=by, L=L):
            m = np.full(X.shape, 'gold', object)
            m[np.hypot(X - bx, Y - by) > L * 0.42 + np.sin(X + Y) * 0.6] = 'flame'
            return m
        fin = c.caps(pts[2:], [max(0.6, v * 0.45) for v in rr[2:]])
        c.parte(fm, fmat, R=2.5, bias=-dark + (0.07 if i % 2 else -0.05), outline='#8a1c0c', far=far, fire=(fin, Z))
    cov = c.caps([(x + dx, y + dy) for x, y in EDGE], [2.6, 2.4, 2.0, 1.5, 0.9])
    c.parte(cov, 'gold', R=3, bias=-0.1 - dark, outline='#6a2410', far=far)


def build(P):
    c = Lienzo(RAMP, P, S=0.87, OX=30, mid=MID, span=SPAN, lit={'fur': 'fur2', 'fur2': 'fur2', 'furd': 'furd'})
    # ---- patas lejanas (largas y finas) ----
    c.parte(c.caps([(53, 50), (56, 58), (58.5, 63), (57, 71)], [3.8, 2.4, 1.5, 1.4]) | c.ell(55.8, 72.9, 2.7, 1.4), socks(64), R=3, bias=-0.3, far=True)
    c.parte(c.caps([(35, 50), (36, 61), (36, 71)], [2.8, 1.8, 1.5]) | c.ell(34.6, 72.9, 2.6, 1.4), socks(63), R=3, bias=-0.3, far=True)
    # ---- ala lejana: asoma detrás, un poco más arriba y más oscura ----
    c.local(rot=-P['wing'] * 0.18, piv=(37, 41))
    wing_parts(c, P, dx=4, dy=-3, dark=0.28, far=True)
    c.local()
    # ---- cola de fénix: base corta de pelo y tres grandes plumas de fuego que flamean hacia atrás ----
    c.local(rot=P['tail'], piv=(58, 45))
    SPINE = [(58, 45), (62.5, 44), (66, 42)]
    tail = c.caps(SPINE, [2.6, 3.6, 4.2]) | c.ell(67, 41, 4.4, 4)
    TONG = [(67, 40, 24, 0.45, 0.10, 3.6), (68.5, 42, 15, 0.9, 0.06, 3.0), (68, 44, 10, 1.3, 0.0, 2.3),
            (65, 39.5, 14, 0.05, 0.12, 2.4)]
    tail, inner, core = c.fuego(tail, TONG, inner_base=c.ell(67, 41.5, 3, 2.6),
                                core=c.caps([(66.5, 41.5), (69, 38)], [1.6, 1.0]), wisps=[(74, 9, 1.0), (62, 22, 1.0)])

    def tail_mat(X, Y):
        m = np.full(X.shape, 'fur', object)
        k = X - (Y - 40) * 0.2; edge = 63 + 1.6 * np.sin(Y * 1.7 + X * 0.5)
        m[k > edge - 3] = 'fur2'; m[k > edge] = 'flame'
        return m
    c.parte(tail, tail_mat, R=5, outline='#9a1a0c', fire=(inner, core))
    # ---- oreja lejana ----
    c.local(dy=P['head'])
    c.parte(c.poly([(24, 27), (24.6, 20.5), (26, 14.5), (27.6, 10.8), (29.2, 12.6), (30.8, 19), (32, 27)]),
            lambda X, Y: np.where(Y < 13.5, 'sock', 'fur').astype(object), R=3, bias=-0.3, far=True)
    c.local()
    # ---- cuerpo esbelto ----
    body = c.ell(31, 45, 8, 8.5) | c.ell(34, 40, 6, 6) | c.ell(43, 46.5, 10, 6) | c.ell(54, 46, 7.5, 7)
    c.parte(body, lambda X, Y: np.where((Y > 50) & (X < 51), 'cream', 'fur').astype(object), R=8)
    c.parte(c.ell(27.5, 45, 5.5, 8) | c.poly([(25, 39), (21, 45), (24.5, 45.5), (22.5, 50), (26, 49), (26.5, 54), (30, 50.5), (30.5, 40)]),
            'cream', R=5, bias=0.05, soft=True)
    c.parte(c.ell(55, 49.5, 6.5, 7.5, 0.3), 'fur', R=6, bias=0.03, soft=True)
    # ---- patas cercanas ----
    c.parte(c.caps([(55.5, 52), (59, 59), (61.5, 64), (60, 71)], [4.4, 2.7, 1.7, 1.6]) | c.ell(58.6, 72.9, 3.0, 1.5), socks(65), R=3)
    c.parte(c.caps([(29.5, 51), (30.5, 61), (30, 71)], [3.0, 2.0, 1.7]) | c.ell(28.6, 72.9, 2.9, 1.5), socks(63), R=3)
    # ---- ala cercana ----
    c.local(rot=-P['wing'] * 0.18, piv=(35, 41))
    wing_parts(c, P)
    c.local()
    # ---- cabeza fina, cuello alto ----
    c.local(dy=P['head'])
    cheek = c.poly([(9, 35), (14, 39.5), (21, 41), (29, 40), (33, 36.5), (28.5, 36), (31, 33), (23, 32.5)])
    head = c.ell(21, 29, 10.5, 8.8, -0.12) | c.poly([(13.5, 26.5), (3, 32.5), (3.8, 35.2), (14.5, 38)]) | cheek
    c.parte(head, lambda X, Y: np.where((Y > 34) | (cheek & (Y > 33.5)), 'cream', 'fur').astype(object), R=7, bias=0.05)

    def ear_mat(X, Y):
        m = np.full(X.shape, 'fur', object)
        cx = 18.6 + (Y - 6) * 0.1; half = (Y - 9) * 0.27
        inner = (Y > 9.5) & (Y < 24) & (np.abs(X - cx) < half)
        m[inner] = 'pink'
        m[inner & (Y > 20.5 - (np.abs(X - cx) * 1.5)) & (np.abs(X - cx) < half * 0.7)] = 'cream'
        m[Y < 8.6] = 'sock'
        return m
    c.parte(c.poly([(14.8, 24.5), (15, 18.5), (16, 12.5), (17.4, 8.6), (18.6, 6.2), (19.9, 7.8), (21.6, 12.5), (23.2, 18), (24.4, 23.8)]),
            ear_mat, R=4)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'])
    K = {'k': '#1a0c14', 'a': '#a05a18', 'A': '#ffb838', 'W': '#ffffff', 'l': '#3a1410'}
    if P['blink']:
        ex, ey = c.patron(11.4, 26.6, ['', '', 'kk..kl', '.kkkk.'], K)
    else:   # ojo elegante, con pestaña hacia atrás
        ex, ey = c.patron(11.4, 26.6, ['.kkkkl', 'kWkkkk', 'kWkkak', '.kaAAk', '..kkk.'], K)
    for dx in range(0, 5): c.put(ex + dx, ey - 1, '#5a2414')
    c.put(ex + 6, ey - 1, '#3a1410')
    c.patron(2.5, 32.3, ['.nn', 'nnn'], {'n': '#1a0c14'}); c.putd(3.7, 32.3, '#6a4a54')
    for x, y in [(6, 36.5), (7.5, 37), (9, 37.4)]: c.putd(x, y, '#a0604a')
    for x, y in [(18.5, 34.3), (20, 34.3)]: c.putd(x, y, '#f4a090')
    c.local()
    for x in (26.5, 28.8, 31, 56.5, 58.8, 61): c.putd(x, 74.5, '#f0cca0')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
