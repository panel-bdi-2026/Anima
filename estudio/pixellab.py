"""pixellab.py: prueba de PixelLab para generar ánimas con el estilo aprobado.

Uso: python3 pixellab.py nombre "descripción" carpeta_salida estilo1.png [estilo2.png ...]
La clave la pone el entorno (secreto Bearer para api.pixellab.ai); este programa no la conoce.
Guarda cada resultado como <carpeta>/<nombre>_<n>.png e imprime el saldo antes y después.
"""
import base64, json, sys, time, urllib.request

API = 'https://api.pixellab.ai/v2'


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def b64(path):
    return 'data:image/png;base64,' + base64.b64encode(open(path, 'rb').read()).decode()


def main():
    from PIL import Image
    name, desc, out = sys.argv[1], sys.argv[2], sys.argv[3]
    styles = sys.argv[4:]
    print('saldo antes:', call('GET', '/balance')['subscription'])
    imgs = []
    for p in styles:
        w, h = Image.open(p).size
        imgs.append({'image': {'type': 'base64', 'base64': b64(p), 'format': 'png'}, 'width': w, 'height': h})
    body = {'style_images': imgs, 'description': desc, 'no_background': True,
            'style_description': 'detailed pixel art creature, side view facing left, soft volume shading lit from the top-left, dark outline'}
    job = call('POST', '/generate-with-style-v2', body)
    jid = job.get('background_job_id') or job.get('id')
    print('trabajo:', jid)
    for _ in range(60):
        time.sleep(6)
        st = call('GET', f'/background-jobs/{jid}')
        if st.get('status') in ('completed', 'failed'):
            break
    if st.get('status') != 'completed':
        print('no terminó:', json.dumps(st)[:800]); return
    res = st.get('last_response') or {}
    images = res.get('images') or []
    for i, im in enumerate(images):
        data = im.get('base64', '')
        if ',' in data: data = data.split(',', 1)[1]
        open(f'{out}/{name}_{i}.png', 'wb').write(base64.b64decode(data))
    print('imágenes guardadas:', len(images))
    print('saldo después:', call('GET', '/balance')['subscription'])


if __name__ == '__main__':
    main()
