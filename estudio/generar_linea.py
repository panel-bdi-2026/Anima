"""generar_linea.py: genera variantes del dibujo base de varias ánimas a la vez con PixelLab.
Cada ánima usa como referencia su diseño aprobado (concepto) y el Ignito elegido como estilo de dibujo
(sin copiar sus colores). 80×80 → 9 variantes por pedido; 96×96 → 4 por pedido (se hacen 2 pedidos)."""
import sys, os, json, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixellab as pl
from PIL import Image

ESTILO = 'pixellab_pruebas/ignito_pie_0.png'
COLA = ', strict side view profile facing left, full body, high quality detailed pixel art'
FICHAS = json.load(open('fichas.json'))


def img(p, uso=None):
    w, h = Image.open(p).size
    r = {'image': {'type': 'base64', 'base64': pl.b64(p), 'format': 'png'}, 'size': {'width': w, 'height': h}}
    if uso: r['usage_description'] = uso
    return r


def pedido(sp, tanda):
    f = FICHAS[sp]
    body = {'description': f['desc'] + f.get('cola', COLA), 'image_size': {'width': f['size'], 'height': f['size']}, 'no_background': f.get('no_bg', True),
            'reference_images': [img(r, u) for r, u in f.get('refs', [[f['ref'], 'concept reference for this creature: keep its idea, body plan, colors and key features, but redraw it with better anatomy and detail']])],
            'style_image': img(f.get('estilo', ESTILO)), 'style_options': {'color_palette': False, 'outline': True, 'detail': True, 'shading': True}}
    for intento in range(3):
        try:
            job = pl.call('POST', '/generate-image-v2', body)
            st = pl.esperar(job.get('background_job_id') or job.get('id'))
            if st.get('status') == 'completed':
                return sp, tanda, pl.guardar(st, 'variantes', f'{sp}_{tanda}')
        except Exception as e:
            print('reintento', sp, tanda, e, flush=True)
            import time; time.sleep(20 * (intento + 1))
    return sp, tanda, 0


def main():
    os.makedirs('variantes', exist_ok=True)
    sps = sys.argv[1].split(',')
    antes = pl.call('GET', '/balance')['subscription']['generations']
    tareas = []
    for sp in sps:
        tareas += [(sp, t) for t in range(FICHAS[sp].get('tandas', 1 if FICHAS[sp]['size'] <= 84 else 2))]
    with cf.ThreadPoolExecutor(8) as ex:
        for r in ex.map(lambda t: pedido(*t), tareas):
            print(r, flush=True)
    print('gastado:', antes - pl.call('GET', '/balance')['subscription']['generations'])


if __name__ == '__main__':
    main()
