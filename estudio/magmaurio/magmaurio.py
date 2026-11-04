"""Magmaurio (fuego/roca): forma final de Fogarzo por el camino del combate cuerpo a cuerpo.
«Su piel se endurece como roca volcánica y embiste sin miedo.»
Se pone en dos patas: un guerrero erguido. El fuego de Fogarzo sigue (crin en la nuca y los hombros,
cola que se enciende como la de Ignito) y la roca aparece como armadura: hombrera, guanteletes,
grebas, placa de pecho, cresta-cuerno. Casi sin lava: solo juntas finas que brillan entre placas."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
from motor import Lienzo, args

RAMP = {
    'fur':   ['#300c0a', '#561a12', '#802816', '#a83c1c', '#cc5626', '#e87634', '#f89a4c'],
    'cream': ['#6a463a', '#9a6e56', '#c49a76', '#e2be96', '#f4dcb8'],
    'rock':  ['#16121a', '#262026', '#3a3236', '#504548', '#685a5a', '#83736e', '#a08e84'],
    'lava':  ['#a8240e', '#f05418', '#ff9a26', '#ffd860'],
    'flame': ['#9a1c0e', '#d8361a', '#f65e1c', '#ff8e24', '#ffc038', '#ffe680', '#fffbe0'],
    'fur2':  ['#6a2014', '#a03418', '#d24c1c', '#f06c24', '#ff9034', '#ffb848', '#ffd670'],
    'furd':  ['#2a0c0a', '#42160e', '#5c2012', '#782c18', '#943a20'],
}
MID = {'fur': 3.6, 'cream': 3.4, 'rock': 3.6, 'fur2': 4, 'furd': 3}
SPAN = {'rock': 5, 'cream': 3}
Z = np.zeros((80, 80), bool)


def seams(step, ang=0.6, w=0.42):
    """roca con juntas finas de lava (pocas)"""
    def f(X, Y):
        m = np.full(X.shape, 'rock', object)
        m[(np.abs((X * np.cos(ang) + Y * np.sin(ang)) % step) < w)] = 'lava'
        return m
    return f


def build(P):
    c = Lienzo(RAMP, P, S=0.96, OX=34, OY=75, outline='#1a0a0a', mid=MID, span=SPAN,
               lit={'fur': 'fur2', 'fur2': 'fur2', 'furd': 'furd'})
    # ---------- pierna lejana (digitígrada: muslo, corvejón hacia atrás, pie hacia adelante) ----------
    legF = c.caps([(46, 48), (43.5, 56), (49, 65), (47.5, 72)], [5.0, 3.4, 2.4, 2.3]) | c.ell(44.8, 73, 4.4, 1.9)

    def greave(top):
        def f(X, Y):
            return np.where(Y > top + np.sin(X * 2) * 0.8, 'rock', 'fur').astype(object)
        return f
    c.parte(legF, greave(60.5), R=3.5, bias=-0.3, far=True)
    # ---------- brazo lejano ----------
    c.parte(c.caps([(42, 30), (41, 39), (34, 38)], [4.0, 3.2, 3.0]), 'fur', R=3, bias=-0.3, far=True)
    c.parte(c.caps([(40.5, 39), (34.5, 38)], [3.4, 3.4]) | c.ell(31.5, 37, 3.9, 3.6), seams(9), R=3, bias=-0.3, far=True)
    # ---------- cola: como la de Ignito, el pelo se va encendiendo; placas de roca solo en la base ----------
    c.local(rot=P['tail'], piv=(49, 50))
    SPINE = [(49, 50), (56, 51), (62, 48.5), (66.5, 43), (68.5, 36), (68, 28)]
    tail = c.caps(SPINE, [3.6, 4.6, 5.4, 5.8, 5.0, 3.2])
    TONG = [(68, 28, 16, -0.04, 0.22, 3.6), (71, 35, 10, 0.26, 0.18, 2.8), (72, 42, 5.5, 0.6, 0.15, 2.0),
            (64.5, 33, 9, -0.35, 0.1, 2.4)]
    tail, inner, core = c.fuego(tail, TONG, inner_base=c.caps(SPINE[3:], [3.2, 2.6, 1.6]),
                                core=c.caps([(68.4, 40), (68.6, 34), (68, 29)], [1.9, 1.7, 1.0]),
                                wisps=[(61, 18, 1.2), (74, 20, 1.1)])

    def tail_mat(X, Y):
        m = np.full(X.shape, 'fur', object)
        k = Y + (X - 66) * 0.3; edge = 46 + 2.2 * np.sin(X * 1.7 + Y * 0.6)
        m[k < edge + 4] = 'fur2'; m[k < edge] = 'flame'
        return m
    c.parte(tail, tail_mat, R=6, outline='#8a180c', fire=(inner, core))
    for (x, y, r) in [(52, 48.5, 3.0), (57.5, 47.8, 2.8)]:          # placas de roca sobre la base de la cola
        c.parte(c.poly([(x - r, y + 1.6), (x - r * 0.4, y - r * 0.9), (x + r * 0.7, y - r * 0.6), (x + r, y + 1.4)]), 'rock', R=2.5, outline='#120a0a')
    c.local()
    # ---------- torso erguido ----------
    torso = c.ell(37, 37, 10, 11.5, 0.12) | c.ell(41, 47, 8.5, 7.5) | c.ell(34, 29, 7.5, 6)

    def torso_mat(X, Y):
        m = np.full(X.shape, 'fur', object)
        m[(X < 37 + (Y - 40) * 0.35) & (Y > 33)] = 'cream'          # pecho y vientre claros
        return m
    c.parte(torso, torso_mat, R=9)
    # ---------- pierna cercana ----------
    legN = c.caps([(40, 48), (34.5, 56.5), (40.5, 65.5), (38.5, 72)], [5.8, 3.8, 2.7, 2.5]) | c.ell(35.2, 73, 4.8, 2.0)
    c.parte(legN, greave(61), R=4)
    c.parte(c.ell(39.5, 51, 6.2, 6.8, -0.5), 'fur', R=6, bias=0.03, soft=True)   # muslo
    # ---------- crin de fuego en la nuca y los hombros ----------
    c.local(rot=P['tail'] * 0.3, piv=(38, 24))
    ridge = c.caps([(31, 14), (36, 18.5), (41, 24), (44, 29)], [2.6, 3.0, 2.8, 2.2])
    MANE = [(36, 18, 13, 0.32, 0.25, 3.0), (40.5, 23, 11, 0.55, 0.28, 2.8), (32, 14.5, 10, 0.1, 0.2, 2.4),
            (44, 28.5, 7, 0.85, 0.15, 2.2)]
    mane, minner, mcore = c.fuego(ridge, MANE, inner_base=c.caps([(33, 15.5), (42, 25.5)], 1.4), core=c.caps([(35, 17), (39, 21)], 1.0))
    c.parte(mane, 'flame', R=4, outline='#8a180c', fire=(minner, mcore))
    c.local()
    # ---------- brazo cercano: hombrera de roca, antebrazo acorazado y puño grande ----------
    c.parte(c.caps([(32, 30), (29, 39.5), (23.5, 37)], [4.4, 3.4, 3.2]), 'fur', R=4)
    c.parte(c.caps([(29, 39.5), (24, 37.5)], [3.6, 3.6]) | c.ell(21.2, 35.8, 4.4, 4.2), seams(8, 0.9), R=3.5, outline='#120a0a')
    c.parte(c.poly([(27, 28.5), (30, 24.5), (36, 24.5), (38.5, 28), (37, 32.5), (30.5, 33.5)]), seams(10, 1.1), R=4, outline='#120a0a')
    # ---------- cabeza: la misma cabeza de zorro de Fogarzo, más madura (se mantiene el parentesco) ----------
    HX, HY, HS = 6, -11, 0.8               # dónde va la cabeza de Fogarzo sobre este cuerpo, y a qué tamaño
    c.local(dx=HX, dy=P['head'] + HY, sc=HS, piv=(22, 32))
    c.parte(c.poly([(23.5, 25), (24.3, 19.5), (25.8, 14.8), (27.3, 12), (28.9, 13.5), (30.5, 18.6), (32, 25)]),
            lambda X, Y: np.where(Y < 13.5, 'furd', 'fur').astype(object), R=3, bias=-0.3, far=True)   # oreja lejana
    cheek = c.poly([(8, 37), (13, 42), (20, 43.5), (30, 42.5), (35, 39.5), (30, 38.5), (33, 35.5), (23, 34.5)])
    head = c.ell(21, 30.5, 11.8, 9.8, -0.12) | c.poly([(13, 28), (1.5, 34.5), (2.5, 38), (14, 40.5)]) | cheek
    c.parte(head, lambda X, Y: np.where((Y > 36.2 + (X - 2) * 0.03) | (cheek & (Y > 35.5)), 'cream', 'fur').astype(object), R=7, bias=0.03)
    def ear_mat(X, Y):
        m = np.full(X.shape, 'fur', object)
        cx = 18.4 + (Y - 8) * 0.1; half = (Y - 10.6) * 0.3
        inner = (Y > 11) & (Y < 25) & (np.abs(X - cx) < half)
        m[inner] = 'cream'
        m[Y < 10.3] = 'furd'
        return m
    c.parte(c.poly([(14.2, 25.5), (14.4, 20), (15.4, 14.5), (16.9, 10.6), (18.2, 8.5), (19.6, 9.9), (21.4, 14.5), (23.2, 19.6), (24.5, 24.8)]),
            ear_mat, R=4)
    c.local()
    c.render()
    # ---------- detalles ----------
    c.local(dx=HX, dy=P['head'] + HY, sc=HS, piv=(22, 32))
    K = {'k': '#140a0c', 'a': '#a8461a', 'A': '#f0a030', 'W': '#ffffff'}
    if P['blink']:
        ex, ey = c.patron(10.6, 28.6, ['', '', 'k...k', '.kkk.'], K)
    else:   # ojo de zorro, decidido pero no feroz
        ex, ey = c.patron(10.6, 28.6, ['.kkkk.', 'kWkkkk', 'kWkkak', '.kaAAk', '..kkk.'], K)
    c.patron(1.2, 34.2, ['.nn', 'nnn'], {'n': '#140a0c'}); c.putd(2.4, 34.2, '#6a4a54')
    for x, y in [(5, 38.8), (6.5, 39.2), (8, 39.8), (9.5, 40.2), (11, 40.5)]: c.putd(x, y, '#8a4a3a')
    c.putd(7.5, 40.6, '#f4ecdc')                 # un colmillito asoma
    c.local()
    for x in (32, 34.5, 37, 42, 44.5): c.putd(x, 74.4, '#e8dcc8')     # garras de los pies
    for x, y in [(17.6, 33.6), (17.2, 36), (17.6, 38.4)]: c.putd(x, y, '#ff9a26')   # nudillos que brillan
    return c


if __name__ == '__main__':
    build(args({})).guardar()
