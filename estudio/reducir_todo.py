import sys, os, glob
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(__file__))
from reducir import reducir
from PIL import Image
def uno(path):
    if path.endswith('icono.png'): return 0
    st = Image.open(path).convert('RGBA'); S = st.size[1]; n = st.size[0] // S
    out = Image.new('RGBA', (n * (S // 2), S // 2), (0, 0, 0, 0))
    for k in range(n):
        out.alpha_composite(reducir(st.crop((k * S, 0, (k + 1) * S, S)), True), (k * (S // 2), 0))
    out = out.quantize(colors=255, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE) if False else out
    out.save(path, optimize=True)
    return 1
if __name__ == '__main__':
    files = sorted(glob.glob(sys.argv[1] + '/*/*.png'))
    with Pool(8) as p: print(sum(p.map(uno, files)), 'tiras')
