"""codice.py: arma el nuevo códice (página + imágenes) con todos los diseños hechos con PixelLab.

Salida: <carpeta>/index.html y <carpeta>/img/*.png (una tira animada por ánima, personaje y ataque).
Uso: python3 codice.py <carpeta_salida>
"""
import json, os, sys, glob, base64, io, html
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]
os.makedirs(f'{OUT}/img', exist_ok=True)
os.chdir(AQUI)

DATOS = json.load(open('codice_datos.json'))
TIPOS = dict(DATOS['types'])
FI = json.load(open('/tmp/claude-0/-home-user-Anima/cbeafa3a-7356-5591-b7a7-8c34a6e80109/scratchpad/frames_info.json'))


def cuadros(carpeta, accion, vista):
    fs = glob.glob(f'{carpeta}/{accion}_{vista}_*.png')
    fs = [f for f in fs if f.rsplit('_', 1)[1][:-4].isdigit()]
    return [Image.open(f).convert('RGBA') for f in sorted(fs, key=lambda p: int(p.rsplit('_', 1)[1][:-4]))]


def tira(nombre, filas, size):
    """filas: lista de listas de cuadros -> PNG con una fila por animación, todas del mismo ancho (se repite el último cuadro)"""
    n = max(len(f) for f in filas)
    im = Image.new('RGBA', (n * size, len(filas) * size))
    for r, fila in enumerate(filas):
        for i in range(n):
            c = fila[min(i, len(fila) - 1)]
            if c.size != (size, size): c = c.resize((size, size), Image.NEAREST)
            im.alpha_composite(c, (i * size, r * size))
    im = im.quantize(colors=255, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    im.save(f'{OUT}/img/{nombre}.png', optimize=True)
    return n


def uri(path, escala=1):
    im = Image.open(path).convert('RGBA')
    if escala != 1: im = im.resize((im.width * escala, im.height * escala), Image.NEAREST)
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


# ---------- ánimas ----------
animas = []
ACC_A = ['reposo', 'caminar', 'correr', 'atacar', 'disparar', 'golpe', 'caer']
for sp in DATOS['species']:
    k = sp['key']; size = FI[k]['size']
    filas = []
    for a in ACC_A:
        cs = cuadros(f'animaciones/{k}', a, 'lado')
        if a in ('caminar', 'correr') and len(cs) > 1: cs = cs[1:]
        filas.append(cs)
    filas.append(cuadros(f'animaciones/{k}', 'caminar', 'frente')[1:])
    filas.append(cuadros(f'animaciones/{k}', 'caminar', 'espalda')[1:])
    n = tira('a_' + k, filas, size)
    ic = f'variantes/ic_{k}_0_0.png'
    icono = json.load(open('elementos/iconos.json')).get(k) if os.path.exists('elementos/iconos.json') else None
    animas.append({'n': sp['n'], 'key': k, 'name': sp['name'], 'types': sp['types'], 'desc': sp['desc'], 'size': size, 'frames': n,
                   'filas': [len(f) - (0) for f in filas], 'icon': uri(icono) if icono else None})

# ---------- personajes ----------
NOMBRES = {
    'player': 'Protagonista', 'rival': 'Rival', 'prof': 'Profesora Ceiba', 'hiedra': 'Hiedra, líder de Villa Musgo', 'bruna': 'Bruna, líder de Ciudad Roca',
    'neron': 'Nerón, líder de Puerto Marea', 'ascua': 'Ascua, líder de Ciudad Brasa', 'brisa': 'Brisa, líder de Pico Céfiro', 'selene': 'Selene, líder de Ciudad Aurora',
    'vesper': 'Vesper, jefa del Equipo Eclipse', 'nyx': 'Nyx, del Equipo Eclipse', 'grunt': 'Recluta Eclipse', 'mom': 'Mamá', 'sister': 'Hermana del rival',
    'nurse': 'Enfermera', 'clerk': 'Vendedor', 'guide': 'Guía', 'scientist': 'Científico', 'guard': 'Guardia', 'worker': 'Obrero', 'sailor': 'Marinero',
    'fisher': 'Pescador', 'swimmer': 'Nadador', 'hiker': 'Montañero', 'bug': 'Cazabichos', 'lass': 'Chica', 'girl': 'Niña', 'boy': 'Niño', 'kid2': 'Niño travieso',
    'youngster': 'Joven', 'oldman': 'Abuelo', 'oldwoman': 'Abuela', 'smith': 'Herrero', 'monk': 'Monje', 'jogger': 'Corredora', 'baker': 'Panadera',
    'artist': 'Artista', 'mailman': 'Cartero', 'farmer': 'Granjero',
}
ORDEN_PJ = list(NOMBRES)
personajes = []
for k in ORDEN_PJ:
    c = f'animaciones/pj_{k}'
    if not os.path.isdir(c): continue
    filas = [cuadros(c, 'reposo', 'lado'), cuadros(c, 'caminar', 'lado')[1:], cuadros(c, 'caminar', 'frente')[1:], cuadros(c, 'caminar', 'espalda')[1:]]
    extra = [a for a in ('correr', 'lanzar') if cuadros(c, a, 'lado')]
    for a in extra: filas.append(cuadros(c, a, 'lado')[1:] if a == 'correr' else cuadros(c, a, 'lado'))
    filas = [f for f in filas if f]
    if not filas: continue
    n = tira('p_' + k, filas, 64)
    personajes.append({'key': k, 'name': NOMBRES[k], 'frames': n, 'filas': ['reposo', 'caminar de lado', 'caminar de frente', 'caminar de espalda'] + extra})

# ---------- ataques ----------
sys.path.insert(0, 'ataques')
from conceptos import C
MOVES = {m['key']: m for m in json.load(open('codice_moves.json'))}
FORMA = {'proj': 'Proyectil', 'beam': 'Rayo', 'ring': 'Onda alrededor', 'area': 'Zona sobre el rival', 'melee': 'Cuerpo a cuerpo', 'dash': 'Embestida',
         'buff': 'Mejora', 'heal': 'Curación', 'blink': 'Teletransporte', 'stealth': 'Sigilo'}
ataques = []
for k in C:
    fs = cuadros(f'ataques/anim/{k}', 'fx', '') if False else None
    fr = sorted(glob.glob(f'ataques/anim/{k}/fx_*.png'), key=lambda p: int(p.rsplit('_', 1)[1][:-4]))
    if fr: frames = [Image.open(f).convert('RGBA') for f in fr]
    else: frames = [Image.open(f'ataques/elegidos/{k}.png').convert('RGBA')]
    size = frames[0].size[0]
    n = tira('f_' + k, [frames], size)
    m = MOVES[k]
    ataques.append({'key': k, 'name': m['name'], 'type': m['type'], 'kind': FORMA.get(m['kind'], m['kind']), 'desc': m['desc'], 'size': size, 'frames': n, 'anim': bool(fr)})

# ---------- elementos 2D ----------
NOM_EL = {
    'it_pocion': 'Poción (se tiñe para Súper e Hiper)', 'it_baya': 'Baya Vigor', 'it_revivir': 'Revivir', 'it_repelente': 'Repelente', 'it_cuerda': 'Cuerda Huida',
    'it_caramelo': 'Caramelo Raro', 'it_nucleo': 'Núcleo (se tiñe: Mente, Hierro)', 'it_hierba': 'Hierba Olvido', 'it_amuleto': 'Amuleto (se tiñe por tipo)', 'it_pase': 'Pase Portuario',
    'esf_esfera': 'Esfera', 'esf_super': 'Superesfera', 'esf_ultra': 'Ultraesfera', 'esf_master': 'Esfera Maestra', 'esf_pesada': 'Esfera Pesada',
    'esf_rapida': 'Esfera Rápida', 'esf_nocturna': 'Esfera Nocturna', 'esf_red': 'Esfera Red',
    'med_raiz': 'Medalla Raíz', 'med_pena': 'Medalla Peña', 'med_oleaje': 'Medalla Oleaje', 'med_ascua': 'Medalla Ascua', 'med_cefiro': 'Medalla Céfiro', 'med_aurora': 'Medalla Aurora',
    'eq_brazalete': 'Brazalete', 'eq_anillo': 'Anillo', 'eq_colgante': 'Colgante', 'eq_botas': 'Botas', 'eq_emblema': 'Emblema', 'eq_talisman': 'Talismán',
    'menu_codice': 'Menú: Códice', 'menu_equipo': 'Menú: Equipo', 'menu_mapa': 'Menú: Mapa', 'menu_mochila': 'Menú: Mochila', 'menu_equipamiento': 'Menú: Equipamiento',
    'menu_ficha': 'Menú: Ficha', 'menu_guardar': 'Menú: Guardar', 'menu_opciones': 'Menú: Opciones', 'menu_cerrar': 'Menú: Cerrar',
}
GRUPO = {'it': 'Objetos', 'esf': 'Esferas de captura', 'med': 'Medallas', 'eq': 'Equipamiento (el material cambia el color)', 'menu': 'Íconos del menú'}
elementos = []
for k, n in NOM_EL.items():
    p = f'elementos/{k}.png'
    if os.path.exists(p): elementos.append({'key': k, 'name': n, 'group': GRUPO[k.split('_')[0]], 'img': uri(p, 2)})

json.dump({'animas': animas, 'personajes': personajes, 'ataques': ataques, 'elementos': elementos, 'tipos': TIPOS},
          open(f'{OUT}/datos.json', 'w'), ensure_ascii=False)
print(len(animas), len(personajes), len(ataques), len(elementos))
