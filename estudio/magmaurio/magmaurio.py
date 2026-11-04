"""Magmaurio (fuego/roca): forma final de Fogarzo por el camino del combate cuerpo a cuerpo.
«Su piel se endurece como roca volcánica y embiste sin miedo.»
Se pone en dos patas: un guerrero erguido. El fuego de Fogarzo sigue (crin en la nuca y los hombros,
cola que se enciende como la de Ignito) y la roca aparece como armadura: hombrera, guanteletes,
grebas, placa de pecho, cresta-cuerno. Casi sin lava: solo juntas finas que brillan entre placas."""
import math, os, sys
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


def cracks(scale=1.0, ph=0.0, base='rock'):
    """roca volcánica con grietas de magma irregulares (una red, no rayas parejas)"""
    def f(X, Y):
        m = np.full(X.shape, base, object)
        u = X * scale + ph; v = Y * scale
        n = np.sin(u * 0.95 + np.sin(v * 0.7) * 1.6) + 0.8 * np.sin(v * 1.15 + u * 0.35 + 1.3)
        m[np.abs(n) < 0.3] = 'lava'
        return m
    return f


def build(P):
    c = Lienzo(RAMP, P, S=0.96, OX=34, OY=75, outline='#1a0a0a', mid=MID, span=SPAN,
               lit={'fur': 'fur2', 'fur2': 'fur2', 'furd': 'furd'})
    # ---------- pierna lejana (digitígrada: muslo, corvejón hacia atrás, pie hacia adelante) ----------
    legF = c.caps([(46, 48), (43.5, 56), (49, 65), (47.5, 72)], [5.0, 3.4, 2.4, 2.3]) | c.ell(44.8, 73, 4.4, 1.9)

    def greave(top):
        def f(X, Y):
            m = np.where(Y > top + np.sin(X * 2) * 0.8, 'rock', 'fur').astype(object)
            cr = cracks(0.62, 2.0)(X, Y)
            m[(m == 'rock') & (cr == 'lava')] = 'lava'
            return m
        return f
    c.parte(legF, greave(60.5), R=3.5, bias=-0.3, far=True)
    # ---------- brazo lejano ----------
    c.parte(c.caps([(42, 30), (41.5, 38.5)], [4.0, 3.2]), 'fur', R=3, bias=-0.3, far=True)
    c.parte(c.caps([(41.5, 39), (35, 34)], [3.6, 2.8]) | c.ell(41, 39.5, 3.4, 2.8), cracks(0.6, 4.0), R=3, bias=-0.3, far=True, outline='#120a0a')
    c.parte(c.ell(31.8, 32.6, 3.4, 3.1), cracks(0.75, 1.0), R=2.5, bias=-0.3, far=True, outline='#120a0a')
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
        c.parte(c.poly([(x - r, y + 1.6), (x - r * 0.4, y - r * 0.9), (x + r * 0.7, y - r * 0.6), (x + r, y + 1.4)]), cracks(0.8, x), R=2.5, outline='#120a0a')
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
    # ---------- brazo cercano: brazo de pelo, codera, antebrazo de roca y puño cerrado ----------
    c.parte(c.caps([(32, 29.5), (31, 38.5)], [4.3, 3.4]), 'fur', R=4)
    gaunt = c.caps([(31, 40), (24.5, 37)], [3.7, 2.9]) | c.ell(31.2, 40.2, 3.8, 3.1)          # antebrazo con codera ancha
    c.parte(gaunt, cracks(0.6, 0.5), R=3.5, outline='#120a0a')
    fist = c.ell(21.2, 35.6, 3.9, 3.6)
    c.parte(fist, cracks(0.75, 3.0), R=3, bias=0.04, outline='#120a0a')
    # ---------- hombrera-volcán: un cono de roca con cráter de lava que echa fuego ----------
    cone = c.poly([(30.5, 35), (32.5, 30.5), (35.2, 27.2), (40.2, 27.2), (42.6, 30.5), (44, 35), (37.5, 36.6)])
    c.parte(cone, cracks(0.6, 6.0), R=4, outline='#120a0a')
    crater = c.ell(37.7, 27.4, 2.6, 1.0)
    c.parte(crater, 'lava', R=1.5, outline='#3a0a06')
    VT = [(36.7, 27, 6, -0.25, 0.1, 1.5), (38.3, 26.8, 8, 0.15, 0.12, 1.8), (39.7, 27.2, 5, 0.6, 0.1, 1.3)]
    vent, vin, _ = c.fuego(c.ell(37.7, 26.8, 2, 0.8), VT)
    c.parte(vent, 'flame', R=2, outline='#8a180c', fire=(vin, Z))
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
    K = {'k': '#140a0c', 'a': '#a8461a', 'A': '#f0a030', 'W': '#fff4d8', 'b': '#3a1410'}
    if P['blink']:
        ex, ey = c.patron(10.2, 29.4, ['', 'kkkkkk'], K)
    else:   # ojo serio: rasgado, párpado bajo, un solo brillo pequeño
        ex, ey = c.patron(10.2, 29.4, ['kkkkkkk', 'kWaAAk.', '.kkkk..'], K)
    # ceja de pelo gruesa y recta, apenas baja hacia el hocico: mirada firme
    for dx in range(-1, 8): c.put(ex + dx, ey - 1 - (dx > 1), '#3a1410')
    for dx in range(1, 7): c.put(ex + dx, ey - 2 - (dx > 3), '#5a1c12')
    c.patron(1.2, 34.2, ['.nn', 'nnn'], {'n': '#140a0c'}); c.putd(2.4, 34.2, '#6a4a54')
    for x, y in [(4.5, 38.9), (6.2, 39.4), (8, 39.9), (9.8, 40.3), (11.5, 40.5), (13, 40.5)]: c.putd(x, y, '#5a2a22')   # boca firme
    c.putd(7.6, 40.9, '#f4ecdc')                 # un colmillito asoma
    c.local()
    for x in (32, 34.5, 37, 42, 44.5): c.putd(x, 74.4, '#e8dcc8')     # garras de los pies
    for x, y in [(17.6, 33.4), (17.3, 35.6), (17.6, 37.8)]: c.putd(x, y, '#ffb030')   # nudillos que brillan
    for x, y in [(19.6, 33.2), (19.4, 35.4), (19.6, 37.6)]: c.putd(x, y, '#120a0a')   # separación entre dedos
    f = P['fl']
    for i, (x, y) in enumerate([(36, 18), (41, 16), (38.5, 13)]):                   # chispas del volcán
        c.putd(x + math.sin(f + i * 2) * 1.2, y - (f * 2 + i * 1.6) % 4, ['#ffe680', '#ffc038', '#ff8e24'][i])
    return c


if __name__ == '__main__':
    build(args({})).guardar()
