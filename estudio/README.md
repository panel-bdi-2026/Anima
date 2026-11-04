# Estudio de ánimas

Rediseño de las ánimas en 80 × 80 (cuadraditos de la mitad del tamaño actual), trabajado fuera del juego.
Nada de esta carpeta lo carga el juego: se integra todo junto cuando esté revisado y aprobado.

- `ignito/`: estándar aprobado. `dibujar.py` genera el sprite (`nuevo.png`) y la animación de reposo.
  Uso: `python3 dibujar.py tail=0 head=0 blink=0 fl=0.8 out=nuevo.png`
- `motor.py`: el motor común (sombreado, contornos, fuego, lava, brillo, animación). Cada especie es un archivo en su carpeta.
- `fogarzo/`, `magmaurio/`, `solarix/`: resto de la línea de Ignito (propuesta, sin aprobar).
- `linea.py`: arma la hoja antes/después y la animación de una línea: `python3 linea.py carpeta_salida ignito fogarzo ...`
  (necesita en la carpeta de salida `<especie>_side_old.png`, el dibujo actual sacado del códice).
