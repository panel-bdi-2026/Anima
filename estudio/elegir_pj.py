"""elegir_pj.py: elige automáticamente la variante de cada personaje: una sola figura, parada y lo más angosta posible."""
import json, sys, glob
from PIL import Image
import numpy as np
from scipy import ndimage

def puntaje(f):
    a = np.array(Image.open(f).convert('RGBA'))[..., 3] > 0
    lab, n = ndimage.label(a)
    tam = sorted(ndimage.sum(a, lab, range(1, n + 1)), reverse=True) if n else []
    grandes = [t for t in tam if t > 120]
    if len(grandes) != 1: return None
    ys, xs = np.nonzero(a)
    w, h = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
    if h < 40 or ys.max() > 63: return None
    return w

if __name__ == '__main__':
    res = {}
    for k in sys.argv[1].split(','):
        cand = [(puntaje(f), f) for f in sorted(glob.glob(f'variantes/{k}_0_*.png'), key=lambda p: int(p.rsplit('_', 1)[1][:-4]))]
        cand = [(p, f) for p, f in cand if p is not None]
        res[k] = min(cand)[1] if cand else None
    print(json.dumps(res, indent=1))
