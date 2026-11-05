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


def esperar(jid):
    for _ in range(80):
        time.sleep(6)
        st = call('GET', f'/background-jobs/{jid}')
        if st.get('status') in ('completed', 'failed'):
            return st
    return st


def guardar(st, out, name):
    res = st.get('last_response') or {}
    images = res.get('images') or []
    for i, im in enumerate(images):
        data = im.get('base64', '')
        if ',' in data: data = data.split(',', 1)[1]
        open(f'{out}/{name}_{i}.png', 'wb').write(base64.b64decode(data))
    return len(images)


def con_referencia(name, desc, out, ref, size, style=None):
    """genera a partir de un dibujo de referencia (sujeto) y opcionalmente una imagen de estilo"""
    from PIL import Image
    def img(p, uso=None):
        w, h = Image.open(p).size
        r = {'image': {'type': 'base64', 'base64': b64(p), 'format': 'png'}, 'size': {'width': w, 'height': h}}
        if uso: r['usage_description'] = uso
        return r
    print('saldo antes:', call('GET', '/balance')['subscription'])
    body = {'description': desc, 'image_size': {'width': size, 'height': size}, 'no_background': True,
            'reference_images': [img(ref, 'keep this exact character design: same face, eyes, ears, colors, proportions and flaming tail; only change the pose')]}
    if style:
        body['style_image'] = img(style)
        body['style_options'] = {'color_palette': False, 'outline': True, 'detail': True, 'shading': True}
    job = call('POST', '/generate-image-v2', body)
    st = esperar(job.get('background_job_id') or job.get('id'))
    if st.get('status') != 'completed':
        print('no terminó:', json.dumps(st)[:800]); return
    print('imágenes guardadas:', guardar(st, out, name))
    print('saldo después:', call('GET', '/balance')['subscription'])


def rotaciones(name, ref, out, desc=None):
    """8 direcciones a partir de un cuadro de referencia (cualquier dirección)"""
    print('saldo antes:', call('GET', '/balance')['subscription']['generations'])
    body = {'first_frame': {'type': 'base64', 'base64': b64(ref), 'format': 'png'}, 'no_background': True}
    if desc: body['description'] = desc
    job = call('POST', '/generate-8-rotations-v3', body)
    st = esperar(job.get('background_job_id') or job.get('id'))
    if st.get('status') != 'completed':
        print('no terminó:', json.dumps(st)[:800]); return
    lr = st.get('last_response') or {}
    print('claves de la respuesta:', list(lr.keys())[:10])
    print('imágenes guardadas:', guardar(st, out, name))
    print('saldo después:', call('GET', '/balance')['subscription']['generations'])


def animar(name, ref, out, accion, frames=8):
    """animación cuadro por cuadro a partir de un dibujo y una acción escrita"""
    print('saldo antes:', call('GET', '/balance')['subscription']['generations'])
    body = {'first_frame': {'type': 'base64', 'base64': b64(ref), 'format': 'png'}, 'action': accion,
            'frame_count': frames, 'no_background': True}
    job = call('POST', '/animate-with-text-v3', body)
    st = esperar(job.get('background_job_id') or job.get('id'))
    if st.get('status') != 'completed':
        print('no terminó:', json.dumps(st)[:800]); return
    print('cuadros guardados:', guardar(st, out, name))
    print('saldo después:', call('GET', '/balance')['subscription']['generations'])


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
    if sys.argv[1] == '--anim':         # pixellab.py --anim nombre ref.png salida "acción" [cuadros]
        a = sys.argv[2:]
        animar(a[0], a[1], a[2], a[3], int(a[4]) if len(a) > 4 else 8)
    elif sys.argv[1] == '--rot':          # pixellab.py --rot nombre ref.png salida ["descripción"]
        a = sys.argv[2:]
        rotaciones(a[0], a[1], a[2], a[3] if len(a) > 3 else None)
    elif sys.argv[1] == '--ref':          # pixellab.py --ref nombre "desc" salida ref.png tamaño [estilo.png]
        a = sys.argv[2:]
        con_referencia(a[0], a[1], a[2], a[3], int(a[4]), a[5] if len(a) > 5 else None)
    else:
        main()
