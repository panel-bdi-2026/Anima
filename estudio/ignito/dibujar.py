"""Ignito rediseñado en 80x80 (prueba). Mira a la izquierda, pies en la fila 74.
Cada pieza es una forma con su material; el volumen se calcula con un mapa de altura
(distancia al borde) y luz desde arriba a la izquierda; luego se cuantiza a rampas cortas."""
import math
import numpy as np
from PIL import Image, ImageDraw

N = 80
import sys
P = dict(S=0.82, OX=40, OY=75, tail=0.0, head=0, blink=False, fl=0.0, out='nuevo.png')
for a in sys.argv[1:]:
    k, v = a.split('='); P[k] = type(P[k])(v) if not isinstance(P[k], bool) else v == '1'
LOC = {'rot': 0.0, 'piv': (0, 0), 'dx': 0, 'dy': 0}
def tp(x, y):
    r = LOC['rot']
    if r:
        px, py = LOC['piv']; c, s_ = math.cos(r), math.sin(r)
        x, y = px + (x - px) * c - (y - py) * s_, py + (x - px) * s_ + (y - py) * c
    x += LOC['dx']; y += LOC['dy']
    return P['OX'] + (x - P['OX']) * P['S'], P['OY'] + (y - P['OY']) * P['S']
def local(rot=0.0, piv=(0, 0), dx=0, dy=0): LOC.update(rot=rot, piv=piv, dx=dx, dy=dy)

def hexc(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

RAMP = {
    'fur':   ['#4a1410', '#7a2418', '#b23a18', '#dc5c20', '#f5822e', '#ffa848', '#ffcf78'],
    'cream': ['#8a5a44', '#c08a64', '#e6bc8e', '#f8dcb4', '#fff2da'],
    'sock':  ['#1a0c10', '#2e1416', '#46201c', '#643024', '#844232'],
    'flame': ['#9a1c0e', '#d8361a', '#f65e1c', '#ff8e24', '#ffc038', '#ffe680', '#fffbe0'],
    'pink':  ['#a84a4a', '#d8706a', '#f4a090'],
    'ink':   ['#1a0c14', '#2a1420'],
    'furd':  ['#3a1210', '#5a1c14', '#7a2818', '#9a3a20', '#b84e28'],
    'fur2':  ['#7a2418', '#b23a18', '#e8501c', '#ff7424', '#ff9a34', '#ffc048', '#ffdc70'],
}
OUT = hexc('#2a0e12')
SPAN = {'cream': 3.0, 'sock': 4, 'furd': 4}
MID = {'furd': 3, 'fur2': 4, 'fur': 4, 'cream': 3.9, 'sock': 2, 'flame': 4, 'pink': 1, 'ink': 0}

def mask_poly(pts):
    pts = [tp(*p) for p in pts]
    im = Image.new('L', (N, N), 0); ImageDraw.Draw(im).polygon(pts, fill=1); return np.array(im, bool)

def mask_ell(cx, cy, rx, ry, rot=0.0):
    cx, cy = tp(cx, cy); rx *= P['S']; ry *= P['S']; rot += LOC['rot']
    yy, xx = np.mgrid[0:N, 0:N]
    x = xx + 0.5 - cx; y = yy + 0.5 - cy
    c, s = math.cos(rot), math.sin(rot)
    u = x * c + y * s; v = -x * s + y * c
    return (u / rx) ** 2 + (v / ry) ** 2 <= 1

def mask_caps(pts, r):
    """trazo grueso (cápsula) por varios puntos con radio variable"""
    m = np.zeros((N, N), bool); yy, xx = np.mgrid[0:N, 0:N]
    if not isinstance(r, list): r = [r] * len(pts)
    pts = [tp(*p) for p in pts]; r = [max(0.5, v * P['S']) for v in r]
    for (a, ra), (b, rb) in zip(zip(pts, r), zip(pts[1:], r[1:])):
        ax, ay = a; bx, by = b
        dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy or 1
        t = np.clip(((xx + .5 - ax) * dx + (yy + .5 - ay) * dy) / L2, 0, 1)
        px, py = ax + t * dx, ay + t * dy
        rr = ra + (rb - ra) * t
        m |= (xx + .5 - px) ** 2 + (yy + .5 - py) ** 2 <= rr * rr
    return m

def height(m):
    """distancia al borde (chaflán) -> altura redondeada"""
    INF = 999; d = np.where(m, INF, 0).astype(float)
    for _ in range(2):
        for y in range(N):
            for x in range(N):
                if d[y, x]:
                    for dy, dx, w in ((-1, 0, 1), (0, -1, 1), (-1, -1, 1.4), (-1, 1, 1.4)):
                        yy, xx = y + dy, x + dx
                        v = d[yy, xx] if 0 <= yy < N and 0 <= xx < N else 0
                        d[y, x] = min(d[y, x], v + w)
        for y in range(N - 1, -1, -1):
            for x in range(N - 1, -1, -1):
                if d[y, x]:
                    for dy, dx, w in ((1, 0, 1), (0, 1, 1), (1, 1, 1.4), (1, -1, 1.4)):
                        yy, xx = y + dy, x + dx
                        v = d[yy, xx] if 0 <= yy < N and 0 <= xx < N else 0
                        d[y, x] = min(d[y, x], v + w)
    return d

yy, xx = np.mgrid[0:N, 0:N]
def blur(a, n=2):
    for _ in range(n):
        b = a.copy(); b[1:-1, 1:-1] = (a[:-2, 1:-1] + a[2:, 1:-1] + a[1:-1, :-2] + a[1:-1, 2:] + a[1:-1, 1:-1] * 2) / 6; a = b
    return a
def shade_part(m, R=6.0, light=(-0.55, -0.7, 0.55), bias=0.0):
    d = height(m); h = blur(np.sqrt(np.clip(d / R, 0, 1)) * R, 3)
    gy, gx = np.gradient(h)
    nx, ny, nz = -gx, -gy, np.ones_like(h) * 0.9
    ln = math.sqrt(sum(v * v for v in light)); lx, ly, lz = (v / ln for v in light)
    nn = np.sqrt(nx * nx + ny * ny + nz * nz)
    i = (nx * lx + ny * ly + nz * lz) / nn
    i = i - (yy - 40) * 0.006  # lo de abajo, un poco más en sombra
    return np.clip(i * 0.95 + 0.08 + bias, 0, 1), np.clip(h / R, 0, 1)

canvas = np.zeros((N, N, 3), np.uint8); alpha = np.zeros((N, N), bool)
owner = -np.ones((N, N), int)
parts = []

def inv_grid():
    # coordenadas de diseño de cada píxel (inverso de tp), para que los materiales no dependan de la escala
    X = P['OX'] + (xx + 0.5 - P['OX']) / P['S']; Y = P['OY'] + (yy + 0.5 - P['OY']) / P['S']
    X = X - LOC['dx']; Y = Y - LOC['dy']
    r = LOC['rot']
    if r:
        px, py = LOC['piv']; c, s_ = math.cos(-r), math.sin(-r)
        X, Y = px + (X - px) * c - (Y - py) * s_, py + (X - px) * s_ + (Y - py) * c
    return X, Y
def part(m, mat_fn, R=6.0, bias=0.0, outline=OUT, far=False, ramp_off=0, soft=False):
    parts.append(dict(inv=inv_grid(), m=m, mat=mat_fn, R=R, bias=bias, outline=outline, far=far, off=ramp_off, soft=soft))

def solid(name):
    return lambda xx, yy: np.full((N, N), name, object)

yy, xx = np.mgrid[0:N, 0:N]

# ---------------- piezas, de atrás hacia adelante ----------------
# pata trasera lejana (corvejón hacia atrás, como un zorro de verdad)
legBF = mask_caps([(52, 55), (55, 62), (57, 66), (56, 71)], [4.2, 2.8, 1.7, 1.7]) | mask_ell(54.4, 72.8, 2.9, 1.5)
def socks(top):
    def f(xx, yy):
        t = top + np.sin(xx * 2.3) * 0.8
        return np.where(yy >= t, 'sock', np.where(yy >= t - 2.2, 'furd', 'fur')).astype(object)
    return f
part(legBF, socks(66), R=3, bias=-0.3, far=True)
# pata delantera lejana
legFF = mask_caps([(34, 54), (35, 62), (35, 71)], [3.0, 2.0, 1.7]) | mask_ell(33.4, 72.8, 2.8, 1.5)
part(legFF, socks(64), R=3, bias=-0.3, far=True)

# cola: de zorro, delgada en la base, curva hacia arriba; desde la mitad el pelo se va encendiendo
local(rot=P['tail'], piv=(57, 50))
SPINE = [(57, 49), (62, 46.5), (66, 41), (68, 34), (68.5, 27), (67, 20)]
SR = [2.8, 4.2, 5.2, 5.6, 4.7, 2.9]
tail = mask_caps(SPINE, SR)
def tongue(x0, y0, L, ang, bend, w, i, wave=1.8):
    """lengua de fuego: sube, se ondula (forma de S) y se afina hasta una punta"""
    f = P['fl']; L *= 1 + 0.13 * math.sin(f + i * 1.9); ph = f * 1.4 + i * 2.3
    pts, rr = [], []
    for k in range(10):
        t = k / 9
        side = math.sin(t * math.pi * 1.4 + ph) * wave * t
        pts.append((x0 + math.sin(ang) * L * t + bend * L * t * t + side, y0 - math.cos(ang) * L * t))
        rr.append(w * (1 - t) ** 0.85 + 0.4)
    return mask_caps(pts, rr)
# lenguas que nacen a lo largo del borde de la cola (más chicas abajo, más grandes arriba), inclinadas hacia atrás
#            x0    y0    L    ang   bend   w
TONGUES = [(67, 20, 18, -0.05, 0.22, 3.4),   # la de la punta, continúa la cola
           (71, 27, 14, 0.32, 0.28, 3.0), (72, 34, 9, 0.62, 0.22, 2.4), (70.5, 40, 5, 0.9, 0.10, 1.8),
           (64, 24, 10, -0.32, 0.10, 2.4)]
for i, (x0, y0, L, ang, bend, w) in enumerate(TONGUES):
    tail |= tongue(x0, y0, L, ang, bend, w, i, wave=1.1 if i == 0 else 1.8)
f = P['fl']
for i, (x, y, r) in enumerate([(60, 13, 1.2), (79, 18, 1.1)]):
    yy0 = y - (f * 3 + i * 4) % 5
    tail |= mask_caps([(x, yy0 + 2.6), (x + 0.6, yy0)], [r, 0.4])
# llama interior amarilla: sube por el centro de la cola encendida y entra en cada lengua
FL_IN = mask_caps(SPINE[3:], [3.0, 2.4, 1.4])
for i, (x0, y0, L, ang, bend, w) in enumerate(TONGUES):
    FL_IN |= tongue(x0 + 0.3, y0 + 1.5, L * 0.68, ang, bend, w * 0.55, i, wave=0.8 if i == 0 else 1.3)
FL_CORE = mask_caps([(68, 33), (68.4, 27), (67.4, 22)], [1.8, 1.6, 1.0])
def tail_mat(xx, yy):
    m = np.full((N, N), 'fur', object)
    k = yy + (xx - 66) * 0.25
    edge = 41 + 2.2 * np.sin(xx * 1.7 + yy * 0.6)          # borde irregular: el pelo se enciende en mechones
    m[k < edge + 4] = 'fur2'
    m[k < edge] = 'flame'
    return m
part(tail, tail_mat, R=6, outline=hexc('#9a1a0c'))

local()
# oreja lejana
local(dy=P['head'])
earF = mask_poly([(25.3, 32.0), (26.04, 26.45), (27.37, 22.01), (28.7, 19.27), (30.18, 20.6), (31.66, 25.34), (33.07, 32.0)])
part(earF, lambda xx, yy: np.where(yy < 20, 'sock', 'fur').astype(object), R=3, bias=-0.3, far=True)

local()
# cuerpo: pecho alto, cintura fina, anca redonda
body = mask_ell(31, 49, 9, 9) | mask_ell(35, 45, 7, 5) | mask_ell(43, 51, 10, 7) | mask_ell(54, 50, 8, 7.5)
def body_mat(xx, yy):
    m = np.full((N, N), 'fur', object)
    m[(yy > 55.5) & (xx < 52)] = 'cream'
    return m
part(body, body_mat, R=8)
# pechera clara con mechones hacia adelante
chest = mask_ell(27, 50, 6, 8) | mask_poly([(24, 46), (20, 51), (23.5, 51.5), (21.5, 55.5), (25.5, 54.5), (26, 58.5), (29.5, 55), (30, 47)])
part(chest, solid('cream'), R=5, bias=0.05, soft=True)
# anca trasera
haunch = mask_ell(55, 54, 7, 7.5, 0.3)
part(haunch, solid('fur'), R=6, bias=0.03, soft=True)
# pata trasera cercana
legBN = mask_caps([(56, 57), (59, 63), (61, 67), (60, 71)], [4.8, 3.0, 1.9, 1.9]) | mask_ell(58.0, 72.8, 3.2, 1.6)
part(legBN, socks(66), R=3)
# pata delantera cercana
legFN = mask_caps([(29, 55), (30, 62), (29, 71)], [3.4, 2.2, 1.9]) | mask_ell(27.2, 72.8, 3.0, 1.6)
part(legFN, socks(64), R=3)

local(dy=P['head'])
# cabeza grande y redonda (es un inicial: tierno), hocico afinado, mejilla con mechón hacia atrás
head = mask_ell(22, 36, 12, 10.5, -0.08) | mask_poly([(14, 34), (4, 41), (5, 44), (15, 46)])
cheek = mask_poly([(9, 43), (14, 48), (21, 49), (31, 48), (35, 45), (30, 44), (32, 41), (24, 40)])
head |= cheek
def head_mat(xx, yy):
    m = np.full((N, N), 'fur', object)
    m[(yy > 42) | (cheek & (yy > 41))] = 'cream'
    return m
part(head, head_mat, R=7, bias=0.04)

# oreja cercana: ancha y redondeada (no un cuerno), interior rosado con mechón de pelo claro, puntita oscura
earN = mask_poly([(15.19, 31.0), (15.41, 25.82), (16.3, 20.64), (17.71, 16.94), (18.96, 14.87), (20.22, 16.2), (21.92, 20.64), (23.55, 25.45), (24.81, 30.26)])
def earN_mat(xx, yy):
    m = np.full((N, N), 'fur', object)
    # interior: triángulo redondeado, más angosto que la oreja
    cx = 19.3 + (yy - 14) * 0.1; half = (yy - 16.4) * 0.3
    inner = (yy > 17) & (yy < 30.5) & (np.abs(xx - cx) < half)
    m[inner] = 'pink'
    tuft = inner & (yy > 27.5 - (np.abs(xx - cx) * 1.5)) & (np.abs(xx - cx) < half * 0.7)
    m[tuft] = 'cream'
    m[yy < 16] = 'sock'
    return m
part(earN, earN_mat, R=4)

# ---------------- render ----------------
idx = np.full((N, N), -1, int); matmap = np.full((N, N), None, object); partid = -np.ones((N, N), int)
for k, p in enumerate(parts):
    sh, hn = shade_part(p['m'], p['R'], bias=p['bias'])
    dd = height(p['m'])
    mats = p['mat'](*p['inv'])
    for y, x in zip(*np.nonzero(p['m'])):
        mt = mats[y, x]; ramp = RAMP[mt]
        v = sh[y, x]
        mid = MID[mt]
        if mt == 'flame':
            if FL_CORE[y, x] and dd[y, x] > 2: j = 6
            elif FL_IN[y, x] and dd[y, x] > 1.2: j = 5 if dd[y, x] > 2.2 else 4
            elif dd[y, x] < 1.3: j = 0 if y < 22 else 1
            else: j = 2 if y < 24 else 3
        else: j = int(np.clip(round(mid + (v - 0.55) * SPAN.get(mt, 5.5)), 0, len(ramp) - 1))
        matmap[y, x] = mt; idx[y, x] = j; partid[y, x] = k
    # contorno selectivo alrededor de la pieza, solo si cae sobre algo de atrás o el vacío
    if k < len(parts):
        pass

# sombra proyectada: lo que está justo debajo/detrás de una pieza delantera baja un tono
for k, p in enumerate(parts):
    m = p['m']
    sh_m = np.zeros_like(m)
    sh_m[2:, 1:] |= m[:-2, :-1]; sh_m[1:, :] |= m[:-1, :]
    under = sh_m & (partid < k) & (partid >= 0) & ~m & (matmap != 'cream')
    idx[under] = np.maximum(idx[under] - 1, 0)

flame = (matmap == 'flame')
near = np.zeros((N, N), float)
fy, fx = np.nonzero(flame)
for y in range(N):
    for x in range(N):
        if matmap[y, x] in ('fur', 'fur2', 'furd'):
            dmin = np.min((fy - y) ** 2 + (fx - x) ** 2) if len(fy) else 999
            if dmin < 49:
                idx[y, x] = min(idx[y, x] + (2 if dmin < 12 else 1), len(RAMP[matmap[y, x]]) - 1)
                if matmap[y, x] == 'fur': matmap[y, x] = 'fur2'
img = np.zeros((N, N, 4), np.uint8)
for y in range(N):
    for x in range(N):
        if idx[y, x] >= 0:
            img[y, x, :3] = hexc(RAMP[matmap[y, x]][idx[y, x]]); img[y, x, 3] = 255

# contornos internos: borde de cada pieza sobre la de atrás (más suave que el exterior)
for k, p in enumerate(parts):
    m = p['m']
    edge = np.zeros_like(m)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        sm = np.roll(np.roll(m, dy, 0), dx, 1); edge |= sm & ~m
    if p['soft']: continue
    e = edge & (partid >= 0) & (partid < k)
    for y, x in zip(*np.nonzero(e)):
        if parts[partid[y, x]]['far']: continue
        j = max(idx[y, x] - (1 if matmap[y, x] == 'cream' else 2), 0); img[y, x, :3] = hexc(RAMP[matmap[y, x]][j])

# contorno exterior: oscuro abajo, tomando algo del color vecino arriba y a los lados
full = img[:, :, 3] > 0
res = img.copy()
for y in range(N):
    for x in range(N):
        if full[y, x]: continue
        nb = None
        for dy, dx in ((1, 0), (0, 1), (0, -1), (-1, 0)):
            yy2, xx2 = y + dy, x + dx
            if 0 <= yy2 < N and 0 <= xx2 < N and full[yy2, xx2]: nb = (yy2, xx2, dy); break
        if nb:
            k = partid[nb[0], nb[1]]; base = np.array(parts[k]['outline'])
            nc = img[nb[0], nb[1], :3].astype(float)
            c = base if nb[2] == -1 else base * 0.72 + nc * 0.28
            res[y, x, :3] = c.astype(np.uint8); res[y, x, 3] = 255
img = res

def put(x, y, c):
    if 0 <= x < N and 0 <= y < N: img[y, x, :3] = hexc(c); img[y, x, 3] = 255
def putd(x, y, c):  # en coordenadas de diseño
    X, Y = tp(x, y); put(int(X), int(Y), c)
local(dy=P['head'])
ex, ey = (int(v) for v in tp(12.6, 34.6))
if P['blink']:
    for i, (dx, dy) in enumerate([(0, 2), (1, 3), (2, 3), (3, 3), (4, 2)]): put(ex + dx, ey + dy, '#1a0c14')
else:
    for y, row in enumerate(['.kkkk.', 'kWWkkk', 'kWkkak', 'kkaAAk', '.kkkk.']):
        for x, ch in enumerate(row):
            if ch != '.': put(ex + x, ey + y, {'k': '#1a0c14', 'a': '#9a3e18', 'A': '#d87a2a', 'W': '#ffffff'}[ch])
for dx in range(-1, 5): put(ex + dx, ey - 1, '#5a1a12')        # ceja / párpado
put(ex + 5, ey, '#5a1a12')
nx, ny = (int(v) for v in tp(4, 40.5))
for dx, dy in [(0, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]: put(nx + dx, ny + dy, '#1a0c14')
put(nx, ny, '#6a4a54')
for x, y in [(7, 45), (8.5, 45.4), (10, 46)]: putd(x, y, '#a0604a')
for x, y in [(19, 42.5), (20.5, 42.5)]: putd(x, y, '#f4a090')
local()
for x in (24, 26.5, 29): putd(x, 74.5, '#f0cca0')
for x in (55, 57.5, 60): putd(x, 74.5, '#f0cca0')
# mechones de luz en el lomo y la cruz
for x, y in [(36, 42.5), (38, 42.8), (42, 44.3), (47, 44.3), (51, 43.5)]: putd(x, y, '#ffcf78')
local(rot=P['tail'], piv=(57, 50))
fb = P['fl']

local()

Image.fromarray(img, 'RGBA').save(P['out'])
print('ok')
