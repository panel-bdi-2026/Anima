"""elegir_icono_anima.py: para cada ánima elige el ícono de 32 px que más se parece a su dibujo (forma y colores), de una sola pieza."""
import json, glob
from PIL import Image
import numpy as np
from scipy import ndimage

def norm(im, n=24):
    im = im.convert('RGBA'); bb = im.getbbox(); im = im.crop(bb)
    w, h = im.size; s = n / max(w, h)
    im = im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.BILINEAR)
    c = Image.new('RGBA', (n, n)); c.alpha_composite(im, ((n - im.width) // 2, n - im.height))
    return np.array(c).astype(float) / 255

def dist(a, b):
    ma, mb = a[..., 3] > .4, b[..., 3] > .4
    forma = (ma ^ mb).mean()
    both = ma & mb
    col = np.abs(a[..., :3] - b[..., :3])[both].mean() if both.any() else 1
    return forma * 2 + col

info = json.load(open('/tmp/claude-0/-home-user-Anima/cbeafa3a-7356-5591-b7a7-8c34a6e80109/scratchpad/frames_info.json'))
res = {}
def elegir(sp, estricto):
    ref = norm(Image.open(f'elegidos/{sp}.png'))
    mejor = None
    for f in glob.glob(f'variantes/ic_{sp}_0_*.png'):
        im = Image.open(f).convert('RGBA'); a = np.array(im)[..., 3] > 0
        if not a.any(): continue
        lab, n = ndimage.label(a)
        if estricto and n > 1:
            t = sorted(ndimage.sum(a, lab, range(1, n + 1)), reverse=True)
            if sum(t[1:]) > 12: continue
        d = dist(norm(im), ref)
        if mejor is None or d < mejor[0]: mejor = (d, f)
    return mejor[1] if mejor else None

for sp in info:
    res[sp] = elegir(sp, True) or elegir(sp, False)
    continue
    ref = norm(Image.open(f'elegidos/{sp}.png'))
    mejor = None
    for f in glob.glob(f'variantes/ic_{sp}_0_*.png'):
        im = Image.open(f).convert('RGBA'); a = np.array(im)[..., 3] > 0
        if not a.any(): continue
        lab, n = ndimage.label(a)
        if n > 1:
            t = sorted(ndimage.sum(a, lab, range(1, n + 1)), reverse=True)
            if sum(t[1:]) > 12: continue
        d = dist(norm(im), ref)
        if mejor is None or d < mejor[0]: mejor = (d, f)
    res[sp] = mejor[1] if mejor else None
json.dump(res, open('elementos/iconos.json', 'w'), indent=1)
print([k for k, v in res.items() if not v])
