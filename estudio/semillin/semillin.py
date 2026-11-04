"""Semillín (planta): «Toma el sol durante horas. El brote de su cabeza crece un poco cada vez que gana un combate.»
Pequeño geco del bosque en dos patas: cabezota redonda, ojos grandes y brillantes, sonrisa de perfil,
panza clara, bracitos cortos, un brote de dos hojitas en la cabeza que se mece y una cola en forma de hoja."""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
import motor
from motor import Lienzo, args

RAMP = {
    'skin':  ['#0e2a14', '#163e1c', '#215a26', '#2e7a32', '#45a040', '#6ec458', '#a4e080'],
    'belly': ['#7a8a48', '#a8b868', '#ccd890', '#e8f0b8', '#f8fce0'],
    'leaf':  ['#123a14', '#1e5c1c', '#2e8228', '#48a83a', '#74d050', '#b0f07a'],
    'vein':  ['#14401a', '#1f5a20', '#2e7428'],
    'stem':  ['#2a3a14', '#44601e', '#648a2e', '#8ab444'],
}
MID = {'skin': 4, 'belly': 3, 'leaf': 3.4, 'vein': 1.4, 'stem': 2}
SPAN = {'belly': 3, 'leaf': 4.5}


def hoja(c, base, tip, ancho, far=False, shade=0.0):
    """hoja con nervio central: forma de almendra de la base a la punta"""
    (bx, by), (tx, ty) = base, tip
    L = math.hypot(tx - bx, ty - by); ux, uy = (tx - bx) / L, (ty - by) / L; nx, ny = -uy, ux
    pts = []
    for k in range(9):
        t = k / 8; w = math.sin(math.pi * t) ** 0.8 * ancho
        pts.append((bx + ux * L * t + nx * w, by + uy * L * t + ny * w))
    for k in range(8, -1, -1):
        t = k / 8; w = math.sin(math.pi * t) ** 0.8 * ancho * 0.85
        pts.append((bx + ux * L * t - nx * w, by + uy * L * t - ny * w))

    def mat(X, Y):
        m = np.full(X.shape, 'leaf', object)
        t = ((X - bx) * ux + (Y - by) * uy) / L
        d = (X - bx) * nx + (Y - by) * ny
        m[(np.abs(d) < 0.55) & (t > 0.05) & (t < 0.88)] = 'vein'
        return m
    c.parte(c.poly(pts), mat, R=2.5, bias=(-0.3 if far else 0.0) + shade, outline='#123a14', far=far)


def build(P):
    motor.tamano(80)
    c = Lienzo(RAMP, P, S=0.95, OX=40, OY=75, outline='#0e2a14', mid=MID, span=SPAN)
    f = P['fl']; sw = math.sin(f * 1.3) * 0.9
    # ---- pierna lejana ----
    c.parte(c.caps([(41, 62), (42, 70.5)], [3.6, 3.0]) | c.ell(40.6, 72.6, 3.8, 1.8), 'skin', R=2.5, bias=-0.3, far=True)
    # ---- cola en forma de hoja ----
    c.local(rot=P['tail'], piv=(45, 61))
    c.parte(c.caps([(44, 61), (50, 60.5)], [3.4, 2.2]), 'skin', R=2.5)
    hoja(c, (48.5, 60.5), (65, 50.5 + sw * 0.4), 5.4)
    c.local()
    # ---- brazo lejano ----
    c.parte(c.caps([(41, 51.5), (39.5, 56)], [2.0, 1.6]), 'skin', R=2, bias=-0.3, far=True)
    # ---- cuerpo redondo ----
    body = c.ell(38, 57.5, 9, 9.5)
    c.parte(body, lambda X, Y: np.where(X < 39 + (Y - 56) * 0.2, 'belly', 'skin').astype(object), R=8)
    # ---- pierna cercana, con deditos ----
    c.parte(c.caps([(36, 63), (35.5, 70.5)], [4.0, 3.3]) | c.ell(34.4, 72.6, 4.2, 1.9), 'skin', R=2.5)
    # ---- brazo cercano, cortito ----
    c.parte(c.caps([(33.5, 52), (30, 56)], [2.3, 1.8]) | c.ell(29.4, 56.6, 1.8, 1.6), 'skin', R=2)
    # ---- cabeza redonda y grande ----
    c.local(dy=P['head'])
    head = c.ell(30, 40.5, 11.5, 10) | c.ell(21.5, 44, 6.5, 5.5)
    c.parte(head, lambda X, Y: np.where(Y > 47.4 + (X - 20) * 0.08, 'belly', 'skin').astype(object), R=8, bias=0.04)
    # brote de dos hojitas que se mece
    c.local(dy=P['head'], rot=sw * 0.06, piv=(31, 31))
    c.parte(c.caps([(31, 31.5), (31.4, 26), (32, 22.5)], [1.2, 1.0, 0.8]), 'stem', R=1.5)
    hoja(c, (32, 23), (24, 17.5), 3.4, shade=0.04)
    hoja(c, (32, 23), (40.5, 19), 3.1, shade=-0.06)
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'])
    K = {'k': '#0a1a0c', 'W': '#ffffff', 'g': '#2e6a1a', 'G': '#7ac040'}
    if P['blink']:
        c.patron(20.6, 38.6, ['', '', '.kkkk.', 'k....k'], K)
    else:   # ojos grandes y brillantes
        c.patron(20.6, 38.6, ['.kkkk.', 'kWWkkk', 'kWkGgk', 'kkGGgk', '.kkkk.'], K)
    c.linea_d([(15.6, 46), (18.4, 47.2), (21.6, 47.6), (24.2, 47), (25.6, 45.9)], '#0e2a14')    # sonrisa de perfil
    for x, y in [(26, 44.6), (27.4, 44.6)]: c.putd(x, y, '#f4a0a0')                           # rubor
    c.local()
    for x in (31.6, 33.6, 35.6): c.putd(x, 74.4, '#a4e080')
    return c


if __name__ == '__main__':
    build(args({})).guardar()
