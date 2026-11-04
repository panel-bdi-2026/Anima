"""Motor de dibujo del estudio de ánimas (80x80, mira a la izquierda, pies en la fila 74-75).

Cada especie se arma con piezas (formas con material). El volumen sale de un mapa de altura
(distancia al borde) con luz desde arriba a la izquierda, cuantizado a rampas cortas de color.
Los materiales que brillan (fuego, lava) iluminan el pelo cercano. Al final: sombra proyectada
entre piezas, contorno interior suave y contorno exterior selectivo (oscuro abajo).

Uso desde una especie:
    from motor import Lienzo
    c = Lienzo(paleta, S=0.82, params)
    c.parte(mascara, material, ...)
    img = c.render(); ...detalles...; c.guardar(img, 'salida.png')
"""
import math
import sys
import numpy as np
from PIL import Image, ImageDraw

N = 80
YY, XX = np.mgrid[0:N, 0:N]


def tamano(n):
    """cambia el tamaño del lienzo (80 para etapas 1 y 2, 96 para formas finales; mismo tamaño de cuadradito)"""
    global N, YY, XX
    N = n; YY, XX = np.mgrid[0:N, 0:N]


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def args(defaults):
    """parámetros de animación desde la línea de comandos: tail=0.05 head=1 blink=1 fl=0.8 out=x.png"""
    P = dict(tail=0.0, head=0, blink=False, fl=0.0, wing=0.0, out='nuevo.png')
    P.update(defaults)
    for a in sys.argv[1:]:
        k, v = a.split('=')
        P[k] = (v == '1') if isinstance(P.get(k), bool) else type(P.get(k, ''))(v)
    return P


def blur(a, n=2):
    for _ in range(n):
        b = a.copy()
        b[1:-1, 1:-1] = (a[:-2, 1:-1] + a[2:, 1:-1] + a[1:-1, :-2] + a[1:-1, 2:] + a[1:-1, 1:-1] * 2) / 6
        a = b
    return a


def distancia(m):
    """distancia de cada píxel al borde de la máscara (chaflán 1 / 1.4)"""
    d = np.where(m, 999.0, 0.0)
    pad = np.zeros((N + 2, N + 2))
    for _ in range(2):
        pad[1:-1, 1:-1] = d
        for y in range(1, N + 1):
            row = pad[y]; up = pad[y - 1]
            for x in range(1, N + 1):
                if row[x]:
                    row[x] = min(row[x], up[x] + 1, row[x - 1] + 1, up[x - 1] + 1.4, up[x + 1] + 1.4)
        for y in range(N, 0, -1):
            row = pad[y]; dn = pad[y + 1]
            for x in range(N, 0, -1):
                if row[x]:
                    row[x] = min(row[x], dn[x] + 1, row[x + 1] + 1, dn[x + 1] + 1.4, dn[x - 1] + 1.4)
        d = pad[1:-1, 1:-1].copy()
    return d


class Lienzo:
    def __init__(self, ramps, P, S=0.82, OX=40, OY=75, CX=None, CY=None, outline='#2a0e12', mid=None, span=None, glow=('flame', 'lava'),
                 lit=None, glow_rad=None, flame_detail=False):
        self.R = ramps; self.P = P; self.S = S; self.OX = OX; self.OY = OY
        self.CX = OX if CX is None else CX; self.CY = OY if CY is None else CY   # dónde cae el origen en el lienzo
        self.OUT = hexc(outline)
        self.MID = mid or {}; self.SPAN = span or {}
        self.glow = glow                      # materiales que emiten luz
        self.lit = lit or {}                  # material -> material que toma cuando lo ilumina el fuego
        self.RAD = {'flame': (12, 49), 'lava': (0, 1.1)}
        self.RAD.update(glow_rad or {})
        self.fdetail = flame_detail          # vetas y chispitas dentro del fuego
        self.loc = dict(rot=0.0, piv=(0, 0), dx=0, dy=0, sc=1.0)
        self.parts = []

    # ---------- transformaciones ----------
    def local(self, rot=0.0, piv=(0, 0), dx=0, dy=0, sc=1.0):
        self.loc = dict(rot=rot, piv=piv, dx=dx, dy=dy, sc=sc)

    def tp(self, x, y):
        L = self.loc; r = L['rot']; k = L.get('sc', 1.0)
        if k != 1.0:
            px, py = L['piv']; x, y = px + (x - px) * k, py + (y - py) * k
        if r:
            px, py = L['piv']; c, s = math.cos(r), math.sin(r)
            x, y = px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c
        x += L['dx']; y += L['dy']
        return self.CX + (x - self.OX) * self.S, self.CY + (y - self.OY) * self.S

    def inv(self):
        L = self.loc
        X = self.OX + (XX + 0.5 - self.CX) / self.S - L['dx']
        Y = self.OY + (YY + 0.5 - self.CY) / self.S - L['dy']
        r = L['rot']
        if r:
            px, py = L['piv']; c, s = math.cos(-r), math.sin(-r)
            X, Y = px + (X - px) * c - (Y - py) * s, py + (X - px) * s + (Y - py) * c
        k = L.get('sc', 1.0)
        if k != 1.0:
            px, py = L['piv']; X, Y = px + (X - px) / k, py + (Y - py) / k
        return X, Y

    # ---------- formas ----------
    def poly(self, pts):
        pts = [self.tp(*p) for p in pts]
        im = Image.new('L', (N, N), 0); ImageDraw.Draw(im).polygon(pts, fill=1)
        return np.array(im, bool)

    def ell(self, cx, cy, rx, ry, rot=0.0):
        cx, cy = self.tp(cx, cy); k = self.loc.get('sc', 1.0); rx *= self.S * k; ry *= self.S * k; rot += self.loc['rot']
        x = XX + 0.5 - cx; y = YY + 0.5 - cy
        c, s = math.cos(rot), math.sin(rot)
        u = x * c + y * s; v = -x * s + y * c
        return (u / rx) ** 2 + (v / ry) ** 2 <= 1

    def caps(self, pts, r):
        """trazo grueso por varios puntos con radio variable"""
        m = np.zeros((N, N), bool)
        if not isinstance(r, (list, tuple)): r = [r] * len(pts)
        pts = [self.tp(*p) for p in pts]; r = [max(0.5, v * self.S * self.loc.get('sc', 1.0)) for v in r]
        for (a, ra), (b, rb) in zip(zip(pts, r), zip(pts[1:], r[1:])):
            ax, ay = a; bx, by = b
            dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy or 1
            t = np.clip(((XX + .5 - ax) * dx + (YY + .5 - ay) * dy) / L2, 0, 1)
            px, py = ax + t * dx, ay + t * dy
            rr = ra + (rb - ra) * t
            m |= (XX + .5 - px) ** 2 + (YY + .5 - py) ** 2 <= rr * rr
        return m

    def lengua(self, x0, y0, L, ang, bend, w, i, wave=1.8):
        """lengua de fuego: sube, se ondula (forma de S) y se afina hasta una punta; parpadea con P['fl']"""
        f = self.P['fl']; L *= 1 + 0.13 * math.sin(f + i * 1.9); ph = f * 1.4 + i * 2.3
        pts, rr = [], []
        for k in range(10):
            t = k / 9
            side = math.sin(t * math.pi * 1.4 + ph) * wave * t
            pts.append((x0 + math.sin(ang) * L * t + bend * L * t * t + side, y0 - math.cos(ang) * L * t))
            rr.append(w * (1 - t) ** 0.85 + 0.4)
        return self.caps(pts, rr)

    def fuego(self, base_mask, tongues, inner_base=None, core=None, wisps=()):
        """arma una llama: lenguas + llama interior amarilla + centro claro + llamitas sueltas.
        Devuelve (máscara, interior, centro)."""
        m = base_mask.copy()
        for i, (x0, y0, L, ang, bend, w) in enumerate(tongues):
            m |= self.lengua(x0, y0, L, ang, bend, w, i, wave=1.1 if i == 0 else 1.8)
        f = self.P['fl']
        for i, (x, y, r) in enumerate(wisps):
            y0 = y - (f * 3 + i * 4) % 5
            m |= self.caps([(x, y0 + 2.6), (x + 0.6, y0)], [r, 0.4])
        inner = inner_base.copy() if inner_base is not None else np.zeros((N, N), bool)
        for i, (x0, y0, L, ang, bend, w) in enumerate(tongues):
            inner |= self.lengua(x0 + 0.3, y0 + 1.5, L * 0.68, ang, bend, w * 0.55, i, wave=0.8 if i == 0 else 1.3)
        return m, inner, (core if core is not None else np.zeros((N, N), bool))

    # ---------- piezas ----------
    def parte(self, m, mat, R=6.0, bias=0.0, outline=None, far=False, soft=False, fire=None):
        """mat: nombre de material o función (X, Y) en coordenadas de diseño -> matriz de nombres.
        fire: (interior, centro) si la pieza tiene fuego."""
        X, Y = self.inv()
        mats = np.full((N, N), mat, object) if isinstance(mat, str) else mat(X, Y)
        self.parts.append(dict(m=m, mats=mats, R=R, bias=bias, outline=hexc(outline) if outline else self.OUT,
                               far=far, soft=soft, fire=fire))

    # ---------- render ----------
    def _shade(self, m, R, bias):
        d = distancia(m)
        h = blur(np.sqrt(np.clip(d / R, 0, 1)) * R, 3)
        gy, gx = np.gradient(h)
        lx, ly, lz = -0.55, -0.7, 0.55
        ln = math.sqrt(lx * lx + ly * ly + lz * lz); lx, ly, lz = lx / ln, ly / ln, lz / ln
        nx, ny, nz = -gx, -gy, np.full_like(h, 0.9)
        i = (nx * lx + ny * ly + nz * lz) / np.sqrt(nx * nx + ny * ny + nz * nz)
        i = i - (YY - 40) * 0.006
        return np.clip(i * 0.95 + 0.08 + bias, 0, 1), d

    def render(self):
        idx = np.full((N, N), -1, int); mm = np.full((N, N), None, object); pid = -np.ones((N, N), int)
        for k, p in enumerate(self.parts):
            sh, dd = self._shade(p['m'], p['R'], p['bias'])
            fire = p['fire']
            for y, x in zip(*np.nonzero(p['m'])):
                mt = p['mats'][y, x]; ramp = self.R[mt]
                if mt == 'flame':
                    inner, core = fire if fire else (np.zeros((N, N), bool),) * 2
                    if core[y, x] and dd[y, x] > 2: j = 6
                    elif inner[y, x] and dd[y, x] > 1.2: j = 5 if dd[y, x] > 2.2 else 4
                    elif dd[y, x] < 1.3: j = 0 if y < 22 else 1
                    else: j = 2 if y < 24 else 3
                    if self.fdetail:
                        f = self.P['fl']
                        veta = math.sin(x * 1.25 - y * 0.55 + f * 1.7) + 0.6 * math.sin(y * 0.9 + x * 0.3 - f)
                        if j in (2, 3) and veta > 1.05: j -= 1             # vetas más oscuras que suben con el fuego
                        elif j in (2, 3) and veta < -1.25: j += 1          # lengüitas claras dentro del fuego
                        elif j == 5 and veta > 1.2: j = 6                  # destellos en el centro
                    j = min(j, len(ramp) - 1)
                elif mt == 'lava':
                    j = min(len(ramp) - 1, 1 + int(dd[y, x] > 1.2) + int(sh[y, x] > 0.5))
                else:
                    j = int(np.clip(round(self.MID.get(mt, len(ramp) * 0.6) + (sh[y, x] - 0.55) * self.SPAN.get(mt, 5.5)),
                                    0, len(ramp) - 1))
                mm[y, x] = mt; idx[y, x] = j; pid[y, x] = k
        # sombra proyectada: lo que queda justo debajo / detrás de una pieza delantera baja un tono
        for k, p in enumerate(self.parts):
            m = p['m']; s = np.zeros_like(m)
            s[2:, 1:] |= m[:-2, :-1]; s[1:, :] |= m[:-1, :]
            under = s & (pid < k) & (pid >= 0) & ~m & (mm != 'cream') & ~np.isin(mm, self.glow)
            idx[under] = np.maximum(idx[under] - 1, 0)
        # luz de lo que brilla sobre lo que está cerca: el fuego ilumina fuerte y lejos, la lava poco y cerca
        RAD = self.RAD
        best = np.zeros((N, N), int)
        for g in self.glow:
            gy, gx = np.nonzero(mm == g)
            if not len(gy): continue
            strong, weak = RAD.get(g, (12, 49))
            for y, x in zip(*np.nonzero((idx >= 0) & ~np.isin(mm, self.glow))):
                if mm[y, x] not in self.lit: continue
                d2 = np.min((gy - y) ** 2 + (gx - x) ** 2)
                best[y, x] = max(best[y, x], 2 if d2 < strong else 1 if d2 < weak else 0)
        for y, x in zip(*np.nonzero(best)):
            nm = self.lit[mm[y, x]]
            idx[y, x] = min(idx[y, x] + best[y, x], len(self.R[nm]) - 1); mm[y, x] = nm
        img = np.zeros((N, N, 4), np.uint8)
        for y, x in zip(*np.nonzero(idx >= 0)):
            img[y, x, :3] = hexc(self.R[mm[y, x]][idx[y, x]]); img[y, x, 3] = 255
        # contorno interior: el borde de cada pieza sobre la de atrás (más suave que el exterior)
        for k, p in enumerate(self.parts):
            if p['soft']: continue
            m = p['m']; edge = np.zeros_like(m)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                edge |= np.roll(np.roll(m, dy, 0), dx, 1) & ~m
            for y, x in zip(*np.nonzero(edge & (pid >= 0) & (pid < k))):
                if self.parts[pid[y, x]]['far'] or mm[y, x] in self.glow: continue
                j = max(idx[y, x] - (1 if mm[y, x] == 'cream' else 2), 0)
                img[y, x, :3] = hexc(self.R[mm[y, x]][j])
        # contorno exterior: oscuro abajo; arriba y a los lados toma algo del color vecino
        full = img[:, :, 3] > 0; res = img.copy()
        for y in range(N):
            for x in range(N):
                if full[y, x]: continue
                for dy, dx in ((1, 0), (0, 1), (0, -1), (-1, 0)):
                    y2, x2 = y + dy, x + dx
                    if 0 <= y2 < N and 0 <= x2 < N and full[y2, x2]:
                        base = np.array(self.parts[pid[y2, x2]]['outline'], float)
                        c = base if dy == -1 else base * 0.72 + img[y2, x2, :3] * 0.28
                        res[y, x, :3] = c.astype(np.uint8); res[y, x, 3] = 255
                        break
        self.img = res; self.pid = pid; self.mm = mm
        return res

    # ---------- detalles a mano ----------
    def put(self, x, y, c):
        if 0 <= x < N and 0 <= y < N:
            self.img[y, x, :3] = hexc(c); self.img[y, x, 3] = 255

    def putd(self, x, y, c):
        X, Y = self.tp(x, y); self.put(int(X), int(Y), c)

    def patron(self, x, y, rows, colors):
        """dibuja un patrón de caracteres con su esquina en (x, y) en coordenadas de diseño"""
        X, Y = (int(v) for v in self.tp(x, y))
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch != '.': self.put(X + i, Y + j, colors[ch])
        return X, Y

    def linea_d(self, pts, c):
        """línea continua de un píxel por varios puntos (coordenadas de diseño), sin huecos"""
        P = [self.tp(*p) for p in pts]
        for (ax, ay), (bx, by) in zip(P, P[1:]):
            n = int(max(abs(bx - ax), abs(by - ay))) + 1
            for k in range(n + 1):
                t = k / n
                self.put(int(ax + (bx - ax) * t), int(ay + (by - ay) * t), c)

    def guardar(self, path=None):
        Image.fromarray(self.img, 'RGBA').save(path or self.P['out'])
