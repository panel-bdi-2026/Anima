# Guarda PNG RGBA como paleta exacta (sin cambiar colores) cuando tiene 255 colores o menos.
import sys, glob
from multiprocessing import Pool
from PIL import Image
def uno(path):
    im = Image.open(path)
    if im.mode == 'P': return 0
    im = im.convert('RGBA'); cols = {}
    data = list(im.getdata())
    for c in data:
        k = c[:3] if c[3] else None
        if k is not None and k not in cols: cols[k] = len(cols) + 1
    if len(cols) > 255: return 0
    pal = [0, 0, 0] + [v for k in cols for v in k]
    out = Image.new('P', im.size); out.putpalette(pal + [0] * (768 - len(pal)))
    out.putdata([cols[c[:3]] if c[3] else 0 for c in data])
    out.info['transparency'] = 0
    out.save(path, optimize=True, transparency=0)
    return 1
if __name__ == '__main__':
    with Pool(8) as p: print(sum(p.map(uno, sorted(glob.glob(sys.argv[1])))), 'convertidas')
