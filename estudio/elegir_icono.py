"""elegir_icono.py k1,k2,...: elige la variante más limpia de cada ícono: una sola pieza, centrada, sin tocar el borde, de buen tamaño."""
import json, sys, glob
from PIL import Image
import numpy as np
from scipy import ndimage

def puntaje(f):
    im = np.array(Image.open(f).convert('RGBA')); a = im[..., 3] > 0; H, W = a.shape
    if not a.any(): return None
    lab, n = ndimage.label(a)
    tam = sorted(ndimage.sum(a, lab, range(1, n + 1)), reverse=True)
    sueltos = sum(t for t in tam[1:])                       # píxeles fuera de la pieza principal
    ys, xs = np.nonzero(a)
    borde = (xs.min() == 0) + (ys.min() == 0) + (xs.max() == W - 1) + (ys.max() == H - 1)
    cx, cy = (xs.min() + xs.max()) / 2 - W / 2, (ys.min() + ys.max()) / 2 - H / 2
    cob = a.sum() / (W * H)
    return borde * 25 + sueltos * 0.5 + abs(cx) * 3 + abs(cy) * 3 + abs(cob - 0.42) * 120

if __name__ == '__main__':
    res = {}
    for k in sys.argv[1].split(','):
        c = [(puntaje(f), f) for f in glob.glob(f'variantes/{k}_0_*.png')]
        c = [x for x in c if x[0] is not None]
        res[k] = min(c)[1] if c else None
    print(json.dumps(res, indent=1))
