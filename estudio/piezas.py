"""piezas.py: separa un sprite de PixelLab en piezas (cabeza, cola, patas, cuerpo) y simula la animación del juego.

Las zonas se definen a mano con polígonos sobre el dibujo (coordenadas en píxeles del sprite).
Cada píxel va a la primera zona que lo contiene; lo que no cae en ninguna es el cuerpo.
Luego arma cuadros de reposo (respira con la cabeza, mece la cola) y de caminata (patas alternas, rebote)
y los guarda en un GIF para revisar que nada se despegue.
"""
import math, sys, json
from PIL import Image, ImageDraw


def mascaras(im, zonas):
    W, H = im.size
    asign = {}
    for nombre, poly in zonas.items():
        m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon([tuple(p) for p in poly], fill=255)
        asign[nombre] = m
    piezas = {}
    usado = Image.new('L', (W, H), 0)
    for nombre in zonas:
        m = Image.composite(asign[nombre], Image.new('L', (W, H), 0), Image.eval(usado, lambda v: 255 - v))
        p = Image.new('RGBA', (W, H), (0, 0, 0, 0)); p.paste(im, (0, 0), Image.composite(im.split()[3], Image.new('L', (W, H), 0), m))
        piezas[nombre] = p
        usado = Image.eval(Image.merge('L', [usado]), lambda v: v)
        usado.paste(255, (0, 0), m)
    cuerpo = Image.new('RGBA', (W, H), (0, 0, 0, 0)); cuerpo.paste(im, (0, 0), Image.composite(im.split()[3], Image.new('L', (W, H), 0), Image.eval(usado, lambda v: 255 - v)))
    piezas['cuerpo'] = cuerpo
    return piezas


def rellenar(im, piezas, zonas, relleno):
    """las piezas que van detrás del cuerpo (patas, cola) copian unas filas más hacia adentro,
    así al moverse no queda un hueco entre la pieza y el cuerpo"""
    W, H = im.size
    for nombre, n in relleno.items():
        poly = zonas[nombre]
        top = min(p[1] for p in poly); x0 = min(p[0] for p in poly); x1 = max(p[0] for p in poly)
        p = piezas[nombre]
        for y in range(max(0, top - n), top):
            for x in range(x0, x1 + 1):
                if 0 <= x < W and im.getpixel((x, y))[3] > 0 and p.getpixel((x, y))[3] == 0:
                    p.putpixel((x, y), im.getpixel((x, y)))


def rotar(p, ang, piv):
    return p.rotate(ang, resample=Image.NEAREST, center=piv)


def cuadro(piezas, orden, t, modo, piv_cola):
    W, H = piezas['cuerpo'].size
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    paso = math.sin(t * math.tau)
    for nombre in orden:
        p = piezas[nombre]; dx = dy = 0
        if nombre == 'cola':
            p = rotar(p, [-5, 0, 5, 0][int(t * 4) % 4] + (paso * 4 if modo == 'caminar' else 0), piv_cola)
        if nombre == 'cabeza':
            dy = int((t * 2) % 2) if modo == 'reposo' else (1 if paso > 0 else 0)
        if modo == 'caminar':
            if nombre in ('cuerpo', 'cola', 'cabeza'): dy += 0 if abs(paso) < 0.5 else -1
            if nombre == 'patas_del': dx, dy = (-1, -1) if paso > 0 else (1, 0)
            if nombre == 'patas_tras': dx, dy = (1, 0) if paso > 0 else (-1, -1)
        c.alpha_composite(p, (dx, dy))
    return c


def main():
    src, zonas_json, out = sys.argv[1], sys.argv[2], sys.argv[3]
    cfg = json.load(open(zonas_json))
    im = Image.open(src).convert('RGBA')
    piezas = mascaras(im, cfg['zonas'])
    rellenar(im, piezas, cfg['zonas'], cfg.get('relleno', {}))
    orden = cfg['orden']
    frames = []
    for modo in ('reposo', 'caminar'):
        for k in range(8):
            f = cuadro(piezas, orden, k / 8, modo, tuple(cfg['pivote_cola']))
            bg = Image.new('RGBA', f.size, (223, 233, 210, 255)); bg.alpha_composite(f)
            frames.append(bg.resize((f.width * 5, f.height * 5), Image.NEAREST).convert('P', palette=Image.ADAPTIVE, colors=255))
    frames[0].save(out + '_animado.gif', save_all=True, append_images=frames[1:], duration=[200] * 8 + [110] * 8, loop=0)
    # hoja con las piezas separadas
    W, H = im.size
    hoja = Image.new('RGBA', ((W + 4) * len(piezas) * 4, H * 4), (243, 240, 247, 255))
    for i, (n, p) in enumerate(piezas.items()):
        bg = Image.new('RGBA', p.size, (223, 233, 210, 255)); bg.alpha_composite(p)
        hoja.alpha_composite(bg.resize((W * 4, H * 4), Image.NEAREST), (i * (W + 4) * 4, 0))
    hoja.save(out + '_piezas.png')
    print('piezas:', list(piezas))


if __name__ == '__main__':
    main()
