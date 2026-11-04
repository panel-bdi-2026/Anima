"""ver.py especie [k=v...] -> agranda el sprite sobre fondo para revisarlo (scratchpad/ver_<especie>.png)"""
import sys, os, importlib, subprocess
from PIL import Image
sp = sys.argv[1]; rest = sys.argv[2:]
out = os.environ.get('VER_DIR', '/tmp') + f'/ver_{sp}.png'
subprocess.run([sys.executable, f'{sp}/{sp}.py', *rest, 'out=' + out], check=True)
im = Image.open(out); bg = Image.new('RGBA', (80, 80), (223, 233, 210, 255)); bg.alpha_composite(im)
bg.resize((640, 640), Image.NEAREST).save(out.replace('.png', '_big.png')); print(out.replace('.png', '_big.png'))
