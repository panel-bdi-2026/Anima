"""hoja_variantes.py sp1,sp2,...: arma una hoja por ánima con su referencia y las variantes numeradas (variantes/<sp>_hoja.png)"""
import sys, os, glob, json
from PIL import Image, ImageDraw, ImageFont
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
FICHAS = json.load(open('fichas.json'))
NOM = {'semillin': 'Semillín', 'coralis2': 'Coralis (ajuste: cara de ajolote)', 'robledor2': 'Robledor (ajuste: más verde)', 'floraxia2': 'Floraxia (ajuste: 2 con la cola del 7)', 'rabin': 'Rabín', 'liebron': 'Liebrón', 'pipio': 'Pipío', 'alondro2': 'Alondro (nuevo, como evolución de Pipío)', 'tormentorA': 'Tormentor, idea A: pájaro del trueno', 'tormentorB': 'Tormentor, idea B: halcón eléctrico en picada', 'crisalix': 'Crisálix', 'escarabron': 'Escarabrón', 'voltin': 'Voltín', 'dinamo': 'Dínamo', 'guijin': 'Guijín'}
for sp in sys.argv[1].split(','):
    vs = sorted(glob.glob(f'variantes/{sp}_*_*.png'), key=lambda p: (int(p.split('_')[-2]), int(p.split('_')[-1][:-4])))
    cols = 4 if len(vs) <= 8 else 5
    rows = (len(vs) + cols - 1) // cols
    W = 40 + 340 + cols * 300; H = 90 + rows * 300
    im = Image.new('RGB', (W, H), (243, 240, 247)); d = ImageDraw.Draw(im)
    d.text((40, 20), f'{NOM.get(sp, sp.capitalize())}: {len(vs)} variantes', font=F(30, True), fill=(34, 25, 46))
    d.rounded_rectangle((40, 80, 320, 360), 14, fill=(223, 233, 210))
    r = Image.open(FICHAS[sp]['ref']).convert('RGBA').resize((260, 260), Image.NEAREST); im.paste(r, (50, 90), r)
    d.text((40, 368), 'Referencia', font=F(20, True), fill=(34, 25, 46))
    for i, p in enumerate(vs):
        x = 360 + (i % cols) * 300; y = 80 + (i // cols) * 300
        d.rounded_rectangle((x, y, x + 285, y + 285), 14, fill=(223, 233, 210))
        b = Image.open(p).convert('RGBA'); b = b.resize((270, 270), Image.NEAREST); im.paste(b, (x + 7, y + 7), b)
        d.text((x + 12, y + 8), str(i + 1), font=F(22, True), fill=(34, 25, 46))
    im.save(f'variantes/{sp}_hoja.png')
    print(sp, len(vs))
