"""Magmaurio (fuego/roca): forma final de Fogarzo por el camino del combate cuerpo a cuerpo.
«Su piel se endurece como roca volcánica y embiste sin miedo.» Grande y pesado, en postura de embestida:
hombros enormes, cabeza baja con cuerno de roca, placas de basalto con grietas de lava en el lomo,
antebrazos acorazados de roca, garras grandes, colmillos y cola de roca que termina en fuego."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
from motor import Lienzo, args

RAMP = {
    'fur':   ['#2e0c0a', '#521810', '#7c2614', '#a43a1a', '#c85424', '#e47234', '#f6964c'],
    'cream': ['#6a463a', '#9a6e56', '#c49a76', '#e2be96', '#f4dcb8'],
    'rock':  ['#141012', '#221a1c', '#342829', '#483a3a', '#5e4e4c', '#786462', '#94807a'],
    'lava':  ['#a8240e', '#f05418', '#ff9a26', '#ffd860'],
    'flame': ['#9a1c0e', '#d8361a', '#f65e1c', '#ff8e24', '#ffc038', '#ffe680', '#fffbe0'],
    'fur2':  ['#6a2014', '#a03418', '#d24c1c', '#f06c24', '#ff9034', '#ffb848', '#ffd670'],
    'rock2': ['#3a1e1a', '#54302a', '#6e443a', '#8a5a4a', '#a8725a', '#c48c6c', '#dca684'],
    'bone':  ['#8a7a6a', '#c8baa4', '#f4ecdc'],
}
MID = {'fur': 3.6, 'cream': 3.4, 'rock': 3.4, 'fur2': 4, 'rock2': 3.4, 'bone': 1.6}
SPAN = {'rock': 5, 'cream': 3}


def gauntlet(top):
    """antebrazo: pelo arriba, roca abajo, con una grieta de lava en el borde"""
    def f(X, Y):
        t = top + np.sin(X * 1.9) * 1.0
        m = np.where(Y >= t, 'rock', 'fur').astype(object)
        m[(Y >= t) & (Y < t + 0.6) & (np.sin(X * 3.1) > -0.2)] = 'lava'
        return m
    return f


def build(P):
    c = Lienzo(RAMP, P, S=0.98, OX=40, OY=75, outline='#1a0a0a', mid=MID, span=SPAN,
               lit={'fur': 'fur2', 'fur2': 'fur2', 'rock': 'rock', 'rock2': 'rock2'})
    # ---- patas lejanas ----
    c.parte(c.caps([(54, 51), (57, 59), (59.5, 64), (58, 71)], [5.0, 3.4, 2.6, 2.6]) | c.ell(56.5, 72.6, 4.0, 2.0), gauntlet(62), R=3, bias=-0.3, far=True)
    c.parte(c.caps([(36, 51), (37, 61), (36.5, 71)], [4.4, 3.2, 3.0]) | c.ell(35, 72.6, 4.2, 2.0), gauntlet(60), R=3, bias=-0.3, far=True)
    # ---- cola: gruesa, de roca por segmentos, con fuego en la punta ----
    c.local(rot=P['tail'], piv=(61, 44))
    SPINE = [(60, 44), (66, 41.5), (70.5, 36.5), (72.5, 30.5)]
    tail = c.caps(SPINE, [3.6, 4.0, 3.8, 3.2])
    TONG = [(72.5, 28, 13, 0.0, 0.2, 3.4), (75.5, 30, 8.5, 0.5, 0.2, 2.4), (69.5, 30, 7.5, -0.45, 0.08, 2.2)]
    tail, inner, core = c.fuego(tail, TONG, inner_base=c.ell(72.5, 28.5, 2.4, 2.2),
                                core=c.caps([(72.5, 29), (72.6, 24)], [1.5, 1.0]), wisps=[(78, 16, 1.0)])

    def tail_mat(X, Y):
        m = np.full(X.shape, 'rock', object)
        seg = ((X * 0.55 - Y * 0.42) % 3.2) < 0.55                  # juntas entre segmentos de roca: lava
        m[seg] = 'lava'
        m[Y < 29.5] = 'flame'
        return m
    c.parte(tail, tail_mat, R=4, outline='#1a0a0a', fire=(inner, core))
    c.local()
    # ---- oreja lejana (chica, echada hacia atrás) ----
    c.local(dy=P['head'])
    c.parte(c.poly([(26, 33), (29, 27), (33, 25.5), (33.5, 29), (31, 34)]), 'fur', R=3, bias=-0.3, far=True)
    c.local()
    # ---- cuerpo: hombros enormes, lomo que baja hacia el anca ----
    body = c.ell(31, 45, 12, 11.5) | c.ell(44, 47.5, 12, 8.5) | c.ell(56, 47, 9, 8.5)

    def body_mat(X, Y):
        m = np.full(X.shape, 'fur', object)
        m[(Y > 52.5 + (X - 30) * 0.03) & (X < 52)] = 'cream'
        # grietas de lava en el costado (la piel se está volviendo roca)
        # grietas ramificadas (líneas quebradas), no manchas
        CR = [[(36, 44.5), (38.5, 46.5), (41, 45.8), (43.5, 48)], [(38.5, 46.5), (39.2, 49)],
              [(48, 43.5), (50, 45.5), (53, 45), (54.5, 47.2)], [(50, 45.5), (50.6, 47.8)]]
        for line in CR:
            for (ax, ay), (bx, by) in zip(line, line[1:]):
                dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy
                t = np.clip(((X - ax) * dx + (Y - ay) * dy) / L2, 0, 1)
                m[np.hypot(X - ax - t * dx, Y - ay - t * dy) < 0.5] = 'lava'
        return m
    c.parte(body, body_mat, R=9)
    # pechera (más corta y áspera que la de sus preevoluciones)
    c.parte(c.ell(24, 48, 6, 7.5) | c.poly([(21, 44), (17.5, 49), (21, 49.5), (19, 53.5), (23, 52.5), (23.5, 56.5), (27, 53)]),
            'cream', R=5, bias=0.03, soft=True)
    c.parte(c.ell(57, 51, 8.5, 9, 0.3), 'fur', R=7, bias=0.03, soft=True)
    # ---- placas de basalto en el lomo, con grieta de lava ----
    for i, (x, y, w, h) in enumerate([(31, 33.5, 6.5, 4.8), (39.5, 35.5, 6, 4.2), (47.5, 37, 5.5, 3.8), (55, 37.5, 4.5, 3.2)]):
        plate = c.poly([(x - w, y + h * 0.9), (x - w * 0.6, y - h * 0.3), (x - w * 0.1, y - h), (x + w * 0.5, y - h * 0.6),
                        (x + w, y + h * 0.2), (x + w * 0.7, y + h)])

        def pmat(X, Y, x=x, y=y, h=h):
            m = np.full(X.shape, 'rock', object)
            m[(np.abs(X - x - (Y - y) * 0.35) < 0.45) & (Y > y - h * 0.8) & (Y < y + h * 0.7)] = 'lava'
            return m
        c.parte(plate, pmat, R=3.5, outline='#120a0a')
    # ---- patas cercanas: gruesas, antebrazo de roca y garras ----
    c.parte(c.caps([(57, 54), (61, 61), (63.5, 65), (62, 71)], [5.8, 3.8, 3.0, 3.0]) | c.ell(60.5, 72.6, 4.4, 2.1), gauntlet(63), R=3.5)
    c.parte(c.caps([(28, 52), (29, 62), (28.5, 71)], [5.2, 3.8, 3.4]) | c.ell(27, 72.6, 4.6, 2.1), gauntlet(60.5), R=3.5)
    # ---- cabeza: baja y adelantada (embiste), hocico ancho, mandíbula fuerte ----
    c.local(dy=P['head'])
    jaw = c.poly([(7, 44), (10, 48.5), (17, 50), (25, 48.5), (28, 45), (17, 45.5)])
    head = c.ell(20, 39, 11, 10, -0.05) | c.poly([(13, 34), (5.5, 37.5), (5, 44), (14, 46.5)]) | jaw

    def head_mat(X, Y):
        m = np.full(X.shape, 'fur', object)
        m[(Y > 44.6) & (X < 27)] = 'cream'
        # máscara de roca sobre el hocico y la frente
        m[(Y < 39.5 - (X - 5) * 0.2) & (X < 16) & (Y > 34.5)] = 'rock'
        return m
    c.parte(head, head_mat, R=7, bias=0.02)
    # cuerno de roca: nace en la frente, sube y se curva hacia atrás
    horn = c.caps([(15.5, 33), (17.5, 27.5), (21, 23), (25, 21), (28, 21.3)], [3.4, 2.9, 2.2, 1.4, 0.6])

    def horn_mat(X, Y):
        m = np.full(X.shape, 'rock', object)
        m[(np.abs((X - 14) * 0.55 + (Y - 33) * 0.75) % 4.2) < 0.45] = 'lava'
        return m
    c.parte(horn, horn_mat, R=3, outline='#120a0a')
    # oreja cercana, chica y echada hacia atrás (detrás del cuerno)
    c.parte(c.poly([(20, 31), (23.5, 25.5), (28, 24), (28.5, 27.5), (25, 32.5)]),
            lambda X, Y: np.where(X > 26.5, 'rock', np.where((X > 23.5) & (X < 26.5) & (Y > 26.5) & (Y < 30.5), 'cream', 'fur')).astype(object), R=3)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'])
    K = {'k': '#140a0c', 'y': '#ffb020', 'Y': '#fff0a0', 'o': '#e85a18'}
    if P['blink']:
        ex, ey = c.patron(11.5, 36, ['', 'kkkkk'], K)
    else:   # ojo feroz, encendido como brasa
        ex, ey = c.patron(11.5, 36, ['kkkkk.', 'kYyok.', '.kkkk.'], K)
    for i in range(7): c.put(ex - 1 + i, ey - 1 - (i > 3) + (i < 2), '#140a0c')   # ceja fruncida, baja hacia el hocico
    c.patron(4.2, 37.6, ['nn', 'nnn'], {'n': '#140a0c'})
    # boca y colmillos
    for x in range(7, 24, 2): c.putd(x, 45.4, '#3a1410')
    for x, y in [(9, 46.4), (13.5, 46.5), (18, 46.5)]: c.putd(x, y, '#f4ecdc')
    c.putd(9, 47.4, '#c8baa4')
    c.local()
    # garras grandes
    for x in (23.5, 26, 28.5, 31, 57, 59.5, 62, 64.5): c.putd(x, 74.4, '#e8dcc8')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
