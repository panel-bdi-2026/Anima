# Reduce dibujos de pixel art a la mitad sin perder la forma.
import sys
from PIL import Image
def lum(c): return 0.299*c[0]+0.587*c[1]+0.114*c[2]
def reducir(im, contorno=True):
    im = im.convert('RGBA'); W, H = im.size; px = im.load()
    out = Image.new('RGBA', (W//2, H//2), (0,0,0,0)); o = out.load()
    for j in range(H//2):
        for i in range(W//2):
            cs = [px[i*2+a, j*2+b] for b in (0,1) for a in (0,1)]
            op = [c for c in cs if c[3] >= 128]
            if len(op) < 2: continue
            cnt = {}
            for c in op: cnt[c[:3]] = cnt.get(c[:3], 0) + 1
            # el color más repetido; si empatan, el más oscuro (cuida los contornos y los ojos)
            best = sorted(cnt.items(), key=lambda kv: (-kv[1], lum(kv[0])))[0][0]
            # si en el bloque hay un píxel mucho más oscuro que el elegido (contorno, pupila), gana ese
            dark = min(op, key=lambda c: lum(c))
            if lum(best) - lum(dark) > 90 and len(op) < 4: best = dark[:3]
            o[i, j] = best + (255,)
    if contorno:
        w, h = out.size; src = out.copy(); s = src.load()
        for j in range(h):
            for i in range(w):
                c = s[i, j]
                if c[3] == 0: continue
                borde = any(not (0 <= i+dx < w and 0 <= j+dy < h) or s[i+dx, j+dy][3] == 0 for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)))
                if borde and lum(c) > 70:
                    o[i, j] = (int(c[0]*0.35), int(c[1]*0.3), int(c[2]*0.4), 255)
    return out
if __name__ == '__main__':
    reducir(Image.open(sys.argv[1]), len(sys.argv) < 4).save(sys.argv[2])
