"""Abismar (agua/sombra): forma final de Marolo por el camino del combate cercano.
«Habita las fosas oscuras del mar. Ataca de cerca, emergiendo de las sombras del agua.»
Ajolote-serpiente de las profundidades: sin patas, cuerpo largo en S que se enrosca en el suelo y levanta
la cabeza; piel azul noche con vientre más claro, puntos bioluminiscentes a lo largo del costado,
aleta dorsal violeta con espinas, las branquias de la familia convertidas en frondas que brillan en rosa (el color de las branquias de la familia),
ojo luminoso y partículas de luz en la oscuridad."""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
import motor
from motor import Lienzo, args

RAMP = {
    'skin':  ['#060e26', '#0a1838', '#10264e', '#183668', '#224a86', '#2e60a2', '#4278bc'],
    'skin2': ['#14143a', '#1e1e52', '#2c2a6a', '#3c3884', '#4e4a9c', '#625eb4', '#7a76c8'],
    'belly': ['#2a4a7a', '#3e6294', '#5a7eae', '#7a9cc6', '#9ab8da'],
    'fin':   ['#14143a', '#1e2452', '#2c346c', '#3c4888', '#5260a4', '#6c7cbe'],
    'bio':   ['#7a1a5a', '#c43a88', '#ff6ab8', '#ffc4e4'],
    'mist':  ['#0c0818', '#160e28', '#22163a', '#2e1e4c'],
}
MID = {'skin': 4, 'skin2': 4, 'belly': 3, 'fin': 3.4, 'bio': 2.4, 'mist': 2}
SPAN = {'bio': 2, 'mist': 2.5, 'belly': 3}

# eje del cuerpo: cabeza levantada adelante, cuello que baja, vuelta en el suelo y cola que sube con aleta
SPINE = [(22, 37), (27.5, 44), (29.5, 52), (27, 60), (30, 67.5), (40, 70.5), (50, 68.5), (56, 62.5), (61, 57), (65.5, 52.5), (68.5, 47)]
RAD = [5.6, 5.8, 6.0, 6.0, 5.8, 5.6, 5.2, 4.6, 3.8, 2.8, 1.6]


def along(t):
    """punto y dirección del eje en t (0..1)"""
    n = len(SPINE) - 1; k = min(int(t * n), n - 1); u = t * n - k
    (ax, ay), (bx, by) = SPINE[k], SPINE[k + 1]
    r = RAD[k] + (RAD[k + 1] - RAD[k]) * u
    dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy) or 1
    return ax + dx * u, ay + dy * u, dx / L, dy / L, r


def build(P):
    motor.tamano(96)
    Z = np.zeros((motor.N, motor.N), bool)
    c = Lienzo(RAMP, P, S=1.02 * 1.2, OX=40, OY=75, CX=48, CY=90, outline='#060a1c', mid=MID, span=SPAN,
               glow=('bio',), glow_rad={'bio': (2, 9)}, lit={'skin': 'skin2', 'skin2': 'skin2'})
    f = P['fl']
    # ---- frondas lejanas ----
    c.local(dy=P['head'])
    for i, (bx, by, ang, L) in enumerate([(25, 28.5, 35, 12), (26.5, 32, 72, 12.5)]):
        a = math.radians(ang) + math.sin(f * 1.2 + i) * 0.08
        fr = c.lengua(bx + 2, by - 2, L, a, 0.15, 1.6, i + 7, wave=1.4)
        c.parte(fr, 'bio', R=1.5, bias=-0.35, outline='#4a0e34', far=True)
    c.local()
    # ---- aleta de la cola ----
    c.local(rot=P['tail'], piv=(62, 54))
    tailfin = c.poly([(61, 50), (64.5, 42), (68, 35.5), (72.5, 31.5), (75.5, 34), (76, 41), (75, 47.5), (72, 52.5), (66.5, 55)])
    c.parte(tailfin, 'fin', R=3, outline='#0a0e2a')
    c.local()
    # ---- cuerpo en S ----
    body = c.caps(SPINE, RAD)

    def body_mat(X, Y):
        m = np.full(X.shape, 'skin', object)
        # vientre: del lado de abajo / de adentro de la curva
        for k in range(len(SPINE) - 1):
            (ax, ay), (bx, by) = SPINE[k], SPINE[k + 1]
            dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy
            t = np.clip(((X - ax) * dx + (Y - ay) * dy) / L2, 0, 1)
            px, py = ax + t * dx, ay + t * dy
            nx, ny = -dy / math.sqrt(L2), dx / math.sqrt(L2)          # normal (a la derecha del avance)
            side = (X - px) * nx + (Y - py) * ny
            near = np.hypot(X - px, Y - py) < RAD[k] + 0.6
            m[near & (side < -RAD[k] * 0.35) & (k >= 2)] = 'belly'
        # puntos bioluminiscentes a lo largo del costado
        for i in range(2, 16):
            x, y, ux, uy, r = along(i / 17)
            sx, sy = x + uy * r * 0.35, y - ux * r * 0.35
            m[np.hypot(X - sx, Y - sy) < 0.95] = 'bio'
        return m
    c.parte(body, body_mat, R=7)
    # aleta dorsal violeta con espinas, a lo largo del cuello y el lomo
    dors = Z.copy()
    for i in range(1, 15):
        t = i / 16
        x, y, ux, uy, r = along(t)
        ox, oy = x + uy * (r + 0.6), y - ux * (r + 0.6)          # lado de afuera de la curva
        h = 3.2 * math.sin(math.pi * t) + 1.2
        dors |= c.caps([(ox, oy), (ox + uy * h - ux * 1.2, oy - ux * h - uy * 1.2)], [1.4, 0.5])
    c.parte(dors, 'fin', R=2, outline='#0a0e2a')
    # ---- cabeza: la de la familia, más afinada y seria ----
    c.local(dy=P['head'])
    head = c.ell(17.5, 32, 10.5, 8.2, -0.12) | c.ell(9.5, 35, 6.8, 5.2, -0.1)
    jaw = c.poly([(3.5, 37.5), (8, 40.8), (16, 41.5), (23, 39.5), (20, 37.6), (10, 38.2)])
    c.parte(head | jaw, lambda X, Y: np.where(Y > 37.4 + (X - 5) * 0.05, 'belly', 'skin').astype(object), R=6, bias=0.06)
    # frondas cercanas: las branquias se volvieron luces
    for i, (bx, by, ang, L) in enumerate([(23, 27.5, 30, 13.5), (25, 31, 66, 14.5), (25, 35.5, 102, 12)]):
        a = math.radians(ang) + math.sin(f * 1.2 + i * 1.7) * 0.09
        fr = c.lengua(bx, by, L, a, 0.18, 1.8, i, wave=1.6)
        c.parte(fr, 'bio', R=1.5, outline='#5a1040')
    c.local()
    c.render()
    # ---- detalles ----
    c.local(dy=P['head'])
    K = {'k': '#04040e', 'c': '#ff6ab8', 'C': '#fff0f8', 'd': '#c43a88'}
    if P['blink']:
        c.patron(11.2, 30.6, ['', 'kkkkk'], K)
    else:   # ojo luminoso, rasgado: serio, no feroz
        ex, ey = c.patron(11.2, 30.6, ['kkkkkk', 'kCcdk.', '.kkkk.'], K)
        for dx in range(0, 6): c.put(ex + dx, ey - 1 - (dx > 2), '#0e1634')
    for x, y in [(4.5, 38), (6.5, 38.7), (8.5, 39.2), (10.5, 39.5), (12.5, 39.5), (14.5, 39.2)]: c.putd(x, y, '#02020a')
    for x in (7, 10.5): c.putd(x, 39.9, '#e8f0ff')          # colmillitos
    c.local()
    # partículas de luz que flotan (como plancton en la oscuridad)
    for i, (x, y) in enumerate([(36, 36), (44, 30), (52, 40), (40, 50), (58, 30), (66, 40)]):
        c.putd(x + math.sin(f + i) * 1.5, y - (f * 1.6 + i * 2.1) % 5, ['#ff6ab8', '#ffc4e4', '#9ab8da'][i % 3])
    return c


if __name__ == '__main__':
    build(args({})).guardar()
