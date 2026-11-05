"""animar_todas.py sp1,sp2,...: genera las 7 animaciones × 3 vistas de varias ánimas (en paralelo, con pausas si PixelLab pide esperar).
Usa el tipo de cuerpo y el ataque a distancia de cada una (CUERPO, ELEMENTO). Salta lo que ya existe."""
import sys, os, time, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixellab as pl

CUERPO = {'ignito': 'cuadrupedo', 'fogarzo': 'cuadrupedo', 'magmaurio': 'bipedo', 'solarix': 'cuadrupedo',
          'burbujo': 'cuadrupedo', 'marolo': 'cuadrupedo', 'abismar': 'serpiente', 'coralis': 'cuadrupedo',
          'semillin': 'bipedo', 'hojardo': 'cuadrupedo', 'robledor': 'bipedo', 'floraxia': 'cuadrupedo',
          'rabin': 'cuadrupedo', 'conejal': 'cuadrupedo', 'liebron': 'cuadrupedo', 'nocturo': 'cuadrupedo',
          'pipio': 'ave', 'alondro': 'ave', 'tormentor': 'ave', 'cefireo': 'ave',
          'larvita': 'oruga', 'crisalix': 'capullo', 'polillux': 'volador', 'escarabron': 'insecto',
          'voltin': 'cuadrupedo', 'dinamo': 'bipedo', 'guijin': 'cuadrupedo', 'pedrusco': 'cuadrupedo', 'monolito': 'flotante',
          'tesloria': 'levita', 'ferrovolt': 'cuadrupedo', 'basaltor': 'cuadrupedo',
          'umbrin': 'fantasma', 'penumbro': 'fantasma', 'eclipsor': 'fantasma', 'lunargo': 'volador',
          'escamin': 'pez', 'aleton': 'pez', 'arrecifor': 'pez', 'psiqui': 'cuadrupedo', 'kinesio': 'bipedo', 'oniria': 'volador', 'mentalis': 'cuadrupedo', 'tifonar': 'pez',
          'hongui': 'bipedo', 'setalon': 'bipedo', 'esporal': 'bipedo', 'brisin': 'nube', 'nimbo': 'nube', 'murcin': 'bipedo', 'noctalar': 'ave',
          'micelion': 'bipedo', 'granizor': 'flotante', 'nubaria': 'nube', 'lunavela': 'bipedo',
          'vampirax': 'bipedo', 'silvaneo': 'cuadrupedo', 'auroros': 'cuadrupedo', 'albora': 'bipedo', 'geiseron': 'cuadrupedo', 'umbrarbol': 'bipedo',
          'lunafalena': 'volador', 'forjador': 'bipedo', 'leviaton': 'serpiente', 'celestia': 'volador'}
ELEMENTO = {'fogarzo': 'a burst of fire', 'magmaurio': 'a ball of magma', 'solarix': 'a fiery feather blast',
            'burbujo': 'a stream of bubbles', 'marolo': 'a jet of water', 'abismar': 'a dark water orb', 'coralis': 'a psychic wave from its coral crown',
            'semillin': 'a volley of seeds', 'hojardo': 'sharp spinning leaves', 'robledor': 'a rock thrown from the ground', 'floraxia': 'a swirl of petals and glowing pollen',
            'rabin': 'a shockwave by stomping the ground', 'conejal': 'a shockwave by stomping the ground', 'liebron': 'a gust of wind', 'nocturo': 'a ball of shadow',
            'pipio': 'a sound wave by singing loudly', 'alondro': 'a gust of wind from its wings', 'tormentor': 'a bolt of lightning', 'cefireo': 'a blade of wind',
            'larvita': 'a string of sticky silk', 'crisalix': 'a string of sticky silk', 'polillux': 'a cloud of glowing scales', 'escarabron': 'a rock thrown with its horn',
            'voltin': 'a small spark of electricity', 'dinamo': 'a bolt of electricity', 'guijin': 'a small rock', 'pedrusco': 'a boulder thrown from the ground', 'monolito': 'a psychic wave of crystal light',
            'tesloria': 'a psychic lightning ring', 'ferrovolt': 'a heavy bolt of electricity', 'basaltor': 'a burst of lava rocks',
            'umbrin': 'a small ball of shadow', 'penumbro': 'a ball of shadow', 'eclipsor': 'a ball of black fire', 'lunargo': 'a beam of pale moonlight',
            'escamin': 'a jet of water', 'aleton': 'a strong jet of water', 'arrecifor': 'a burst of water and coral shards', 'psiqui': 'a small psychic wave from its gem',
            'kinesio': 'a rock hurled with telekinesis', 'oniria': 'a wave of dreamy purple mist', 'mentalis': 'a pebble hurled with telekinesis', 'tifonar': 'a whirling blast of wind and sea spray',
            'hongui': 'a puff of sleepy spores', 'setalon': 'a cloud of spores', 'esporal': 'a swarm of tiny glowing insects', 'brisin': 'a light gust of wind and drizzle', 'nimbo': 'a gust of wind and rain',
            'murcin': 'a sound wave by screeching', 'noctalar': 'a silent sound wave',
            'micelion': 'a wave of glowing green spores', 'granizor': 'a volley of hailstones', 'nubaria': 'a soft beam of sunrise light', 'lunavela': 'a beam of moonlight',
            'vampirax': 'a dart of venom from its stinger', 'silvaneo': 'a wave of growing roots and leaves', 'auroros': 'a blast of sunrise fire', 'albora': 'a beam of soft dawn light',
            'geiseron': 'a jet of boiling steam', 'umbrarbol': 'dark roots bursting from the ground', 'lunafalena': 'a cloud of glowing moon dust', 'forjador': 'a shockwave of sparks by slamming its fists',
            'leviaton': 'a dark water orb', 'celestia': 'a swirl of petals and wind'}
MOV = {
    'cuadrupedo': {'caminar': 'walking, natural four-legged walk cycle', 'correr': 'running fast, four-legged gallop cycle',
                   'atacar': 'lunging forward with a quick bite or claw attack, then returning to stance'},
    'bipedo': {'caminar': 'walking on two legs, natural walk cycle', 'correr': 'running fast on two legs',
               'atacar': 'stepping forward with a strong punch or claw strike, then returning to stance'},
    'serpiente': {'caminar': 'slithering forward with a wave motion along the body', 'correr': 'slithering forward fast',
                  'atacar': 'striking forward with a quick bite, then coiling back'},
    'ave': {'caminar': 'hopping forward on the ground', 'correr': 'flying low and fast, flapping its wings',
            'atacar': 'lunging forward with a peck and a wing strike, then returning to stance'},
    'oruga': {'caminar': 'crawling forward like a caterpillar, body segments rippling', 'correr': 'crawling forward fast like a caterpillar, inching quickly',
              'atacar': 'rearing up and headbutting forward, then returning to stance'},
    'capullo': {'caminar': 'hopping forward in small bounces, the cocoon wobbling', 'correr': 'bouncing forward fast, the cocoon wobbling',
                'atacar': 'swinging its whole cocoon body forward in a tackle, then returning upright'},
    'volador': {'caminar': 'flying forward slowly, gently flapping its wings', 'correr': 'flying forward fast, flapping its wings quickly',
                'atacar': 'diving forward with a wing strike, then returning to hovering'},
    'insecto': {'caminar': 'walking forward on six legs, natural insect walk cycle', 'correr': 'running fast on six legs',
                'atacar': 'charging forward with its horn, then returning to stance'},
    'levita': {'caminar': 'floating forward slowly while meditating, gently bobbing in the air', 'correr': 'gliding forward fast through the air',
               'atacar': 'darting forward with a crackling electric tail strike, then returning to its meditating pose'},
    'fantasma': {'caminar': 'floating forward slowly, its wispy tail swaying', 'correr': 'floating forward fast, its wispy tail streaming behind',
                 'atacar': 'lunging forward with a quick claw swipe, then floating back'},
    'pez': {'caminar': 'swimming forward slowly in the air, gently waving its tail and fins', 'correr': 'swimming forward fast, beating its tail strongly',
            'atacar': 'lunging forward with a quick bite, then returning to stance'},
    'nube': {'caminar': 'floating forward slowly, its fluffy cloud body gently puffing', 'correr': 'drifting forward fast like a cloud in strong wind',
             'atacar': 'puffing up and ramming forward with its cloud body, then floating back'},
    'flotante': {'caminar': 'floating forward slowly, gently bobbing in the air', 'correr': 'gliding forward fast through the air',
                 'atacar': 'lunging forward with a strong stone arm strike, then returning to stance'},
}
COMUN = {'reposo': ('standing idle, calm breathing, small natural movement', 4), 'golpe': ('flinching backwards after being hit, recoiling, then recovering', 4),
         'caer': ('fainting, collapsing slowly to the ground, eyes closed', 8)}
VISTA = {'lado': 'side view facing left', 'frente': 'front view facing the camera', 'espalda': 'back view, facing away from the camera'}


def accion_texto(sp, a):
    if a in COMUN: return COMUN[a]
    if a == 'disparar': return (f'launching {ELEMENTO[sp]} forward, then returning to stance', 8)
    return (MOV[CUERPO[sp]][a], 8)


def una(sp, a, d):
    out = f'animaciones/{sp}'; os.makedirs(out, exist_ok=True)
    if os.path.exists(f'{out}/{a}_{d}_0.png'): return sp, a, d, 'ya estaba'
    ref = {'lado': f'elegidos/{sp}.png', 'frente': f'elegidos/{sp}_dir1.png', 'espalda': f'elegidos/{sp}_dir5.png'}[d]
    txt, n = accion_texto(sp, a)
    body = {'first_frame': {'type': 'base64', 'base64': pl.b64(ref), 'format': 'png'}, 'action': f'{txt}, {VISTA[d]}',
            'frame_count': n, 'no_background': True}
    for intento in range(5):
        try:
            job = pl.call('POST', '/animate-with-text-v3', body)
            st = pl.esperar(job.get('background_job_id') or job.get('id'))
            if st.get('status') == 'completed':
                return sp, a, d, pl.guardar(st, out, f'{a}_{d}')
        except Exception as e:
            time.sleep(30 * (intento + 1))
    return sp, a, d, 'falló'


if __name__ == '__main__':
    sps = sys.argv[1].split(',')
    antes = pl.call('GET', '/balance')['subscription']['generations']
    tareas = [(sp, a, d) for sp in sps for a in ['reposo', 'caminar', 'correr', 'atacar', 'disparar', 'golpe', 'caer'] for d in VISTA]
    with cf.ThreadPoolExecutor(5) as ex:
        for r in ex.map(lambda t: una(*t), tareas): print(r, flush=True)
    print('gastado:', antes - pl.call('GET', '/balance')['subscription']['generations'])
