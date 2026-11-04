"""linea.py salida_dir esp1 esp2 ... -> hoja antes/después y GIF animado de una línea evolutiva"""
import sys, os, subprocess
from PIL import Image, ImageDraw, ImageFont
out_dir = sys.argv[1]; sps = sys.argv[2:]
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
NAMES = {k: k.capitalize() for k in sps}
NAMES.update({'semillin': 'Semillín', 'crisalix': 'Crisálix', 'escarabron': 'Escarabrón', 'voltin': 'Voltín', 'dinamo': 'Dínamo', 'guijin': 'Guijín', 'umbrin': 'Umbrín', 'escamin': 'Escamín', 'aleton': 'Aletón', 'brisin': 'Brisín', 'murcin': 'Murcín', 'rabin': 'Rabín', 'pipio': 'Pipío', 'setalon': 'Setalón', 'micelion': 'Micelión', 'liebron': 'Liebrón'})
FR = [(-0.07, 0, 0, 0.0, 0.0), (0, 0, 0, 0.8, 0.3), (0.07, 1, 0, 1.6, 0.6), (0, 1, 0, 2.4, 0.3),
      (-0.07, 0, 0, 3.2, 0.0), (0, 0, 1, 4.0, -0.3), (0.07, 1, 0, 4.8, -0.6), (0, 1, 0, 5.6, -0.3)]
frames = {}
for sp in sps:
    frames[sp] = []
    for i, (t, h, b, f, w) in enumerate(FR):
        p = f'{out_dir}/{sp}_f{i}.png'
        subprocess.run([sys.executable, f'{sp}/{sp}.py', f'tail={t}', f'head={h}', f'blink={b}', f'fl={f}', f'wing={w}', f'out={p}'], check=True)
        frames[sp].append(Image.open(p).convert('RGBA'))
card = (223, 233, 210); n = len(sps); cw = 400
W = 40 + n * (cw + 20); H = 1120
im = Image.new('RGB', (W, H), (243, 240, 247)); d = ImageDraw.Draw(im)
d.text((40, 28), 'Línea de ' + NAMES[sps[0]] + ': hoy y propuesta', font=F(38, True), fill=(34, 25, 46))
d.text((40, 80), 'Arriba: como están hoy (40×40). Abajo: propuesta, mismo tamaño de cuadradito (80×80; formas finales 96×96).', font=F(19), fill=(108, 97, 120))
for i, sp in enumerate(sps):
    x = 40 + i * (cw + 20)
    old = Image.open(f'{out_dir}/{sp}_side_old.png').convert('RGBA')
    for row, (img, sc) in enumerate([(old, 8), (frames[sp][1], 4)]):
        y = 130 + row * (cw + 60)
        d.rounded_rectangle((x, y, x + cw, y + cw), 16, fill=card)
        b = img.resize((img.width * sc, img.height * sc), Image.NEAREST)
        im.paste(b, (x + (cw - b.width) // 2, y + cw - b.height - 8), b)      # apoyados en el mismo piso
    d.text((x, 130 + cw + 8), NAMES[sp] + ' · hoy', font=F(22, True), fill=(34, 25, 46))
    d.text((x, 190 + 2 * cw + 8), NAMES[sp] + ' · propuesta' + ('  (96×96)' if frames[sp][1].width > 80 else ''), font=F(22, True), fill=(34, 25, 46))
im.save(f'{out_dir}/linea_comparacion.png')
gif = []
for k in range(len(FR)):
    g = Image.new('RGBA', (n * 400, 400), card + (255,))
    for i, sp in enumerate(sps):
        fr = frames[sp][k]; b = fr.resize((fr.width * 4, fr.height * 4), Image.NEAREST)
        g.alpha_composite(b, (i * 400 + (400 - b.width) // 2, 400 - b.height - 6))
    gif.append(g.convert('P', palette=Image.ADAPTIVE, colors=255))
gif[0].save(f'{out_dir}/linea_animada.gif', save_all=True, append_images=gif[1:], duration=[130] * len(FR), loop=0)
print('ok')
