"""Floraxia (planta/mente): forma final de Hojardo por el camino del combate a distancia.
«Sus pétalos emiten un aroma que calma la mente. Lucha a distancia con poderes psíquicos.»
En cuatro patas, como un león-geco elegante: una gran melena de pétalos alrededor de la cabeza (el brote
de Semillín floreció), patas con brazaletes de hojitas, cola larga que termina en una flor, mirada
tranquila y polen que brilla y flota (el aroma que calma)."""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
import motor
from motor import Lienzo, args
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'semillin'))
from semillin import hoja, RAMP as RAMP0

RAMP = dict(RAMP0)
RAMP.update({
    'skin':   ['#0e2a14', '#163e1c', '#215a26', '#2e7a32', '#45a040', '#6ec458', '#a4e080'],
    'petal':  ['#5a1640', '#8e2a62', '#c84a8e', '#ee78b4', '#ffaad4', '#ffe0f0'],
    'petal2': ['#7a2a5a', '#b4508a', '#e07ab4', '#ffa8d4', '#ffd6ec', '#fff2f8'],
    'pollen': ['#8a5a1a', '#d8a83a', '#ffe070', '#fff8c8'],
})
MID = {'skin': 4, 'belly': 3, 'leaf': 3.4, 'vein': 1.4, 'stem': 2, 'petal': 3.4, 'petal2': 3.4, 'pollen': 2.4}
SPAN = {'belly': 3, 'leaf': 4.5, 'petal': 4.5, 'petal2': 4}


def petalo(c, cx, cy, ang, L, w, mat='petal', far=False, shade=0.0, outline='#5a1640'):
    a = math.radians(ang); ux, uy = math.cos(a), math.sin(a); nx, ny = -uy, ux
    pts = []
    for k in range(9):
        t = k / 8; ww = math.sin(math.pi * min(1, t * 1.15)) ** 0.7 * w
        pts.append((cx + ux * L * t + nx * ww, cy + uy * L * t + ny * ww))
    for k in range(8, -1, -1):
        t = k / 8; ww = math.sin(math.pi * min(1, t * 1.15)) ** 0.7 * w
        pts.append((cx + ux * L * t - nx * ww, cy + uy * L * t - ny * ww))
    c.parte(c.poly(pts), mat, R=2.5, bias=(-0.3 if far else 0) + shade, outline=outline, far=far)


def petalo_r(c, cx, cy, ang, dist, rl, rw, mat, shade=0.0):
    """pétalo redondeado: un óvalo puesto en dirección radial, con su nervio claro al medio"""
    a = math.radians(ang); px, py = cx + math.cos(a) * dist, cy + math.sin(a) * dist
    m = c.ell(px, py, rl, rw, a)

    def pm(X, Y):
        mm = np.full(X.shape, mat, object)
        d = -(X - px) * math.sin(a) + (Y - py) * math.cos(a)
        mm[np.abs(d) < 0.45] = 'petal2' if mat == 'petal' else 'petal'
        return mm
    c.parte(m, pm, R=3, bias=shade, outline='#5a1640')


def paw(c, pts, rr, foot, far):
    m = c.caps(pts, rr) | c.ell(*foot)
    c.parte(m, 'skin', R=2.5, bias=-0.3 if far else 0.0, far=far)
    (ex, ey) = pts[1]
    if not far:                                                 # hojita en el codo, hacia atrás
        hoja(c, (ex, ey - 1), (ex + 5, ey - 3.5), 1.4)


def build(P):
    motor.tamano(96)
    c = Lienzo(RAMP, P, S=1.0 * 1.2, OX=40, OY=75, CX=47, CY=90, outline='#0e2a14', mid=MID, span=SPAN,
               glow=('pollen',), glow_rad={'pollen': (0, 3)}, lit={})
    f = P['fl']; sw = math.sin(f * 1.2)
    # ---- patas lejanas ----
    paw(c, [(52, 56), (55.5, 63), (54, 70.8)], [3.6, 2.4, 2.1], (53, 72.7, 3.2, 1.6), True)
    paw(c, [(34, 57), (34.5, 64.5), (34, 70.8)], [3.2, 2.3, 2.0], (33, 72.7, 3.1, 1.6), True)
    # ---- cola larga que termina en flor ----
    c.local(rot=P['tail'], piv=(59, 50))
    c.parte(c.caps([(58, 50), (65, 47.5), (70, 42.5), (71.5, 37)], [3.4, 2.6, 2.0, 1.6]), 'skin', R=3)
    for k in range(6):
        petalo_r(c, 71.5, 35, -90 + (k - 2.5) * 42 + sw * 3, 3.6, 3.2, 1.9, 'petal', shade=0.05 if k % 2 else -0.03)
    c.parte(c.ell(71.5, 35, 1.6, 1.5), 'pollen', R=1.5, outline='#6a4a10')
    c.local()
    # ---- cuerpo ----
    body = c.ell(32, 50.5, 9, 8) | c.ell(44, 51.5, 12, 6.4) | c.ell(55, 50.5, 7.5, 7)
    def body_mat(X, Y):
        m = np.where(Y > 55.2 + (X - 40) ** 2 * 0.002, 'belly', 'skin').astype(object)
        vy = 50.5 + np.sin(X * 0.42) * 1.6                       # enredadera dibujada en el costado
        m[(np.abs(Y - vy) < 0.5) & (X > 33) & (X < 58)] = 'stem'
        for lx in (37, 44.5, 52):                                # hojitas de la enredadera
            ly = 50.5 + math.sin(lx * 0.42) * 1.6
            m[np.hypot((X - lx - 1.2) * 0.8, Y - ly + 1.1) < 1.0] = 'leaf'
        return m
    c.parte(body, body_mat, R=8)
    # florecitas a lo largo del lomo
    for i, (x, y) in enumerate([(41, 44.8), (48, 45), (54.5, 44.2)]):
        for k in range(5):
            petalo_r(c, x, y, -90 + k * 72 + i * 20, 1.6, 1.5, 1.0, 'petal', shade=0.04)
        c.parte(c.ell(x, y, 0.8, 0.8), 'pollen', R=1)
    # ---- patas cercanas ----
    paw(c, [(55, 57), (58.5, 63.5), (57, 70.8)], [4.0, 2.7, 2.3], (56, 72.7, 3.5, 1.7), False)
    paw(c, [(29.5, 57.5), (29.5, 65), (29, 70.8)], [3.6, 2.5, 2.2], (28, 72.7, 3.4, 1.7), False)
    # ---- melena de pétalos alrededor de la cabeza (dos capas) ----
    c.local(dy=P['head'], rot=sw * 0.015, piv=(25, 38))
    for k in range(8):                                      # pétalos grandes de afuera
        petalo_r(c, 26, 38.5, -160 + k * 40 + sw * 2, 9.5, 6.2, 3.6, 'petal', shade=0.06 if k % 2 else -0.04)
    for k in range(6):                                      # pétalos claros de adentro
        petalo_r(c, 26, 38.5, -140 + k * 50, 5.5, 4.6, 2.8, 'petal2', shade=0.03)
    c.local()
    # ---- cabeza de la familia, en alto ----
    c.local(dy=P['head'])
    head = c.ell(20, 40, 9.2, 7.8, -0.05) | c.ell(12, 43, 5.8, 4.6, -0.05)
    c.parte(head, lambda X, Y: np.where(Y > 45.6 + (X - 10) * 0.05, 'belly', 'skin').astype(object), R=6, bias=0.05)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'])
    K = {'k': '#081a0a', 'W': '#ffffff', 'p': '#b4508a', 'P': '#ffaad4'}
    if P['blink']:
        c.patron(12.6, 38.2, ['', 'kk..kk', '.kkkk.'], K)
    else:   # mirada tranquila, iris rosado, pestañas
        ex, ey = c.patron(12.6, 38.2, ['kkkkkk', 'kWPpk.', '.kkk..'], K)
        c.put(ex + 6, ey - 1, '#081a0a'); c.put(ex + 5, ey - 1, '#081a0a')
    c.linea_d([(7, 45), (9.6, 45.7), (12.4, 45.9), (14.6, 45.4)], '#0e2a14')
    for x, y in [(15.2, 43.8), (16.6, 43.8)]: c.putd(x, y, '#f4a0c0')
    c.local()
    for x in (26, 28, 30, 54, 56, 58): c.putd(x, 74.4, '#a4e080')
    # polen que brilla y flota: el aroma que calma la mente
    for i, (x, y) in enumerate([(10, 22), (30, 18), (44, 24), (6, 34), (40, 38), (20, 14), (64, 26), (48, 14)]):
        yy = y - (f * 1.8 + i * 1.3) % 5
        X, Y = (int(v) for v in c.tp(x + math.sin(f * 1.3 + i) * 1.4, yy))
        if (i + int(f * 3)) % 4 == 0:
            for dx, dy in [(0, -1), (-1, 0), (1, 0), (0, 1)]: c.put(X + dx, Y + dy, '#ffe070')
        c.put(X, Y, '#fff8c8')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
