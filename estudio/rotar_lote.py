"""rotar_lote.py sp1,sp2,...: 8 direcciones de cada ánima elegida (elegidos/<sp>.png -> elegidos/<sp>_dir0..7.png)"""
import sys, os, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixellab as pl, shutil


def una(sp):
    body = {'first_frame': {'type': 'base64', 'base64': pl.b64(f'elegidos/{sp}.png'), 'format': 'png'}, 'no_background': True}
    for intento in range(3):
        try:
            job = pl.call('POST', '/generate-8-rotations-v3', body)
            st = pl.esperar(job.get('background_job_id') or job.get('id'))
            if st.get('status') == 'completed':
                n = pl.guardar(st, 'elegidos', f'{sp}_rot')
                for i in range(n): shutil.move(f'elegidos/{sp}_rot_{i}.png', f'elegidos/{sp}_dir{i}.png')
                return sp, n
        except Exception as e:
            print('reintento', sp, e, flush=True)
            import time; time.sleep(20 * (intento + 1))
    return sp, 0


if __name__ == '__main__':
    antes = pl.call('GET', '/balance')['subscription']['generations']
    with cf.ThreadPoolExecutor(7) as ex:
        for r in ex.map(una, sys.argv[1].split(',')): print(r, flush=True)
    print('gastado:', antes - pl.call('GET', '/balance')['subscription']['generations'])
