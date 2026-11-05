"""animar_lote.py especie: genera todas las animaciones de una ánima en 3 direcciones (en paralelo).
Entradas: elegidos/<sp>.png (perfil izq.), elegidos/<sp>_dir1.png (frente), elegidos/<sp>_dir5.png (espalda).
Salida: animaciones/<sp>/<accion>_<dir>_<n>.png"""
import sys, os, json, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixellab as pl

ACCIONES = {
    'reposo':  ('standing idle, calm breathing, tail swaying gently, small natural movement', 4),
    'caminar': ('walking, natural four-legged walk cycle, tail swaying', 8),
    'atacar':  ('lunging forward with a quick bite attack, then returning to stance', 8),
    'disparar': ('rearing back and spitting a fireball forward from the mouth, then returning to stance', 8),
    'golpe':   ('flinching backwards after being hit, recoiling, then recovering', 4),
    'caer':    ('fainting, collapsing slowly and lying down on the ground, eyes closed', 8),
}


def una(sp, accion, dire, ref, out):
    desc, n = ACCIONES[accion]
    vista = {'lado': 'side view facing left', 'frente': 'front view facing the camera', 'espalda': 'back view, facing away from the camera'}[dire]
    body = {'first_frame': {'type': 'base64', 'base64': pl.b64(ref), 'format': 'png'}, 'action': f'{desc}, {vista}',
            'frame_count': n, 'no_background': True}
    for intento in range(3):
        try:
            job = pl.call('POST', '/animate-with-text-v3', body)
            st = pl.esperar(job.get('background_job_id') or job.get('id'))
            if st.get('status') == 'completed':
                return accion, dire, pl.guardar(st, out, f'{accion}_{dire}')
        except Exception as e:
            err = str(e)
    return accion, dire, 0


def main():
    sp = sys.argv[1]
    out = f'animaciones/{sp}'; os.makedirs(out, exist_ok=True)
    refs = {'lado': f'elegidos/{sp}.png', 'frente': f'elegidos/{sp}_dir1.png', 'espalda': f'elegidos/{sp}_dir5.png'}
    antes = pl.call('GET', '/balance')['subscription']['generations']
    tareas = [(a, d) for a in ACCIONES for d in refs]
    with cf.ThreadPoolExecutor(6) as ex:
        for r in ex.map(lambda t: una(sp, t[0], t[1], refs[t[1]], out), tareas):
            print(r, flush=True)
    print('gastado:', antes - pl.call('GET', '/balance')['subscription']['generations'])


if __name__ == '__main__':
    main()
