"""hoja_variantes.py sp1,sp2,...: arma una hoja por ánima con su referencia y las variantes numeradas (variantes/<sp>_hoja.png)"""
import sys, os, glob, json
from PIL import Image, ImageDraw, ImageFont
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
FICHAS = json.load(open('fichas.json'))
NOM = {'semillin': 'Semillín', 'coralis2': 'Coralis (ajuste: cara de ajolote)', 'robledor2': 'Robledor (ajuste: más verde)', 'floraxia2': 'Floraxia (ajuste: 2 con la cola del 7)', 'rabin': 'Rabín', 'liebron': 'Liebrón', 'pipio': 'Pipío', 'alondro2': 'Alondro (nuevo, como evolución de Pipío)', 'tormentorA': 'Tormentor, idea A: pájaro del trueno', 'tormentorB': 'Tormentor, idea B: halcón eléctrico en picada', 'crisalix': 'Crisálix', 'escarabron': 'Escarabrón', 'voltin': 'Voltín', 'dinamo': 'Dínamo', 'guijin': 'Guijín', 'umbrin': 'Umbrín', 'mistofaB': 'Mistofa 3 con detalles de Arcanya', 'parkerB': 'Parker 1 con detalles de Gatumbra', 'monterizB': 'Monteriz, a partir de Buclón 1', 'buclon': 'Buclón', 'umbrapanter': 'Umbrapánter', 'trueno_umbrio': 'Truenumbra', 'tempestronZ': 'Tempestrón completo (lienzo más grande)', 'galernoZ': 'Galerno completo (lienzo más grande)', 'marealisA': 'Marealis, idea A: dragón de las mareas con corona de perlas', 'marealisB': 'Marealis, idea B: ballena-dragón del cielo', 'tempestronA': 'Tempestrón, idea A: águila del trueno', 'tempestronB': 'Tempestrón, idea B: fénix de tormenta', 'galernoA': 'Galerno, idea A: liebre guardiana con alas de viento', 'galernoB': 'Galerno, idea B: corredor del cielo', 'geiseron': 'Géiseron', 'tempestron': 'Tempestrón', 'umbrarbol': 'Umbrárbol', 'leviaton': 'Leviatón', 'vampiraxC': 'Vampirax, idea C: colores vivos con aguijón', 'vampiraxD': 'Vampirax, idea D: colores vivos con caparazón', 'micelionA': 'Micelión, idea A: Setalón de noche', 'micelionB': 'Micelión, idea B: espíritu del bosque', 'granizorA': 'Granizor, idea A: nube con armadura de hielo', 'granizorB': 'Granizor, idea B: nube con puños de hielo', 'nubariaA': 'Nubaria, idea A: nube del amanecer', 'nubariaB': 'Nubaria, idea B: nube con alas', 'lunavelaA': 'Lunavela, idea A: guardiana de luz de luna', 'lunavelaB': 'Lunavela, idea B: alas con fases de la luna', 'vampiraxA': 'Vampirax, idea A: con aguijón de insecto', 'vampiraxB': 'Vampirax, idea B: con caparazón de escarabajo', 'setalon': 'Setalón', 'micelion': 'Micelión', 'brisin': 'Brisín', 'murcin': 'Murcín', 'tifonarC': 'Tifonar, idea C: manta raya de tormenta', 'tifonarD': 'Tifonar, idea D: pez vela de tormenta', 'mentalisC': 'Mentalis, idea C: gatito robusto en 2 patas', 'mentalisD': 'Mentalis, idea D: lince en 4 patas', 'tifonarA': 'Tifonar, idea A: serpiente marina de la familia', 'tifonarB': 'Tifonar, idea B: pez gigante que vuela', 'mentalisA': 'Mentalis, idea A: sabio que medita flotando', 'mentalisB': 'Mentalis, idea B: zorro-búho en 4 patas', 'escamin': 'Escamín', 'aleton': 'Aletón', 'tesloriaA': 'Tesloria, idea A: medita flotando', 'tesloriaB': 'Tesloria, idea B: cola de rayo en vez de piernas', 'ferrovoltA': 'Ferrovolt, idea A: bestia blindada en 4 patas', 'ferrovoltB': 'Ferrovolt, idea B: gigante con armadura en 2 patas', 'basaltorA': 'Basaltor, idea A: gólem de basalto con volcanes en los hombros', 'basaltorB': 'Basaltor, idea B: titán con cordillera de fuego en el lomo'}
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
