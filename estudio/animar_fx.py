"""animar_fx.py: anima cada ataque elegido (ataques/elegidos/<k>.png) con su acción (conceptos.py). Salta lo que ya existe."""
import sys, os, time, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ataques'))
import pixellab as pl
from conceptos import C, VISTA


def una(k):
    out = f'ataques/anim/{k}'; os.makedirs(out, exist_ok=True)
    if os.path.exists(f'{out}/fx_0.png'): return k, 'ya estaba'
    v, desc, anim = C[k]
    body = {'first_frame': {'type': 'base64', 'base64': pl.b64(f'ataques/elegidos/{k}.png'), 'format': 'png'},
            'action': f'{anim}, pixel art visual effect animation, vivid and impactful, {VISTA[v]}', 'frame_count': 8, 'no_background': True}
    for intento in range(5):
        try:
            job = pl.call('POST', '/animate-with-text-v3', body)
            st = pl.esperar(job.get('background_job_id') or job.get('id'))
            if st.get('status') == 'completed':
                return k, pl.guardar(st, out, 'fx')
        except Exception as e:
            time.sleep(30 * (intento + 1))
    return k, 'falló'


if __name__ == '__main__':
    ks = sys.argv[1].split(',') if len(sys.argv) > 1 else list(C)
    antes = pl.call('GET', '/balance')['subscription']['generations']
    with cf.ThreadPoolExecutor(4) as ex:
        for r in ex.map(una, ks): print(r, flush=True)
    print('gastado:', antes - pl.call('GET', '/balance')['subscription']['generations'])
