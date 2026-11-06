"""animar_pj.py pj_a,pj_b,...: animaciones de los personajes humanos (reposo, caminar, y extras por personaje).
Usa elegidos/<pj>.png (lado), <pj>_dir1.png (frente) y <pj>_dir5.png (espalda). Salta lo que ya existe."""
import sys, os, time, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixellab as pl
import animar_todas as at

ACC = {
    'reposo': ('standing idle, calm breathing, small natural movement', 4),
    'caminar': ('walking, natural human walk cycle, arms swinging', 8),
    'correr': ('running fast, natural human run cycle, arms pumping', 8),
    'lanzar': ('throwing a small capsule forward with one arm to send out a creature, then returning to stance', 8),
}
# qué acciones lleva cada personaje (vistas: todas, o solo 'lado' para las poses de combate)
EXTRA = {'pj_player': ['correr', 'lanzar'], 'pj_rival': ['lanzar'], 'pj_hiedra': ['lanzar']}


def una(pj, a, d):
    at.COMUN[a] = ACC[a]
    at.CUERPO[pj] = 'bipedo'
    return at.una(pj, a, d)


if __name__ == '__main__':
    pjs = sys.argv[1].split(',')
    antes = pl.call('GET', '/balance')['subscription']['generations']
    tareas = []
    for pj in pjs:
        for a in ['reposo', 'caminar'] + EXTRA.get(pj, []):
            vistas = ['lado'] if a == 'lanzar' else list(at.VISTA)
            tareas += [(pj, a, d) for d in vistas]
    with cf.ThreadPoolExecutor(4) as ex:
        for r in ex.map(lambda t: una(*t), tareas): print(r, flush=True)
    print('gastado:', antes - pl.call('GET', '/balance')['subscription']['generations'])
