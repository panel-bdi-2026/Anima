# Estándar de rediseño de ánimas

Aprobado por Alejandro con la línea de Ignito (Ignito, Fogarzo, Magmaurio, Solarix). Toda ánima nueva debe cumplirlo.

## Tamaño y técnica
- Cuadradito de la mitad del actual. Etapas 1 y 2: lienzo de **80 × 80**. Formas finales (y legendarias): **96 × 96**, con el mismo tamaño de cuadradito, así se ven más grandes.
- Mira a la izquierda; los pies apoyan en la fila 74-75 (80) o 90-91 (96). Nada toca el borde en ningún cuadro de la animación (se revisa siempre).
- Armada por piezas (cabeza, orejas, cuerpo, patas, cola, alas, brazos…) para que la animación del juego siga funcionando. Se dibuja con `motor.py`.
- Luz desde arriba a la izquierda, sombra abajo, contorno exterior oscuro abajo y más suave arriba, contorno interior suave entre piezas.
- Lo que brilla (fuego, lava, electricidad…) ilumina lo cercano, **sin desteñir todo**: si hay mucho brillo, bajar su alcance (`glow_rad`).

## Anatomía
- Cada especie con anatomía propia, nada de «patas de palito»: patas de zorro con calcetines y garritas, garras de verdad en las manos, pezuñas, aletas, etc., según el animal.
- Orejas que parezcan orejas (no cuernos): anchas abajo, lados curvos, punta redondeada; la oreja lejana casi escondida detrás de la cercana.
- Las ánimas de cuatro patas van **con las cuatro en el piso** (en el juego caminan: nada de patas levantadas).
- Brazos y manos bien definidos cuando los hay (brazo, codo, antebrazo, mano/garras).

## Evolución
- Cada etapa crece y **cambia de silueta** sin perder el parecido de familia (la cara sobre todo: la forma final de un zorro sigue siendo un zorro).
- Se puede cambiar bastante la forma y la postura entre etapas (por ejemplo, la forma final en dos patas).
- La primera etapa es tierna; la segunda, joven y decidida; la final, imponente y seria, **no demoníaca ni agresiva de más**.
- El tipo se nota en el diseño: un segundo tipo se suma al primero (fuego → fuego y roca: armadura de roca con grietas de magma, no un cuerpo de lava).
- Los detalles cuentan la historia de la línea (la crin de fuego de Fogarzo sigue en Magmaurio, etc.).

## Fuego (y en general, efectos)
- El fuego no aparece de golpe: el pelo se va encendiendo de a poco.
- Lenguas de fuego onduladas, de distinto largo, con llama amarilla por dentro, centro claro abajo y puntas rojo oscuro; chispas y llamitas sueltas.
- En las formas finales, más detalle: vetas dentro del fuego (`flame_detail`).

## Cómo se presenta
- Por línea evolutiva: hoja «hoy / propuesta» (`linea.py`) y animación de las cuatro juntas.
- Antes de mostrar: revisar a ojo cada etapa agrandada y los 8 cuadros de la animación.

## Aprendido con la línea de Burbujo
- Caras de perfil: la boca es una línea suave y continua (con `linea_d`), no una franja clara que parezca mandíbula. La cabeza es una sola forma redonda.
- Sin saltos bruscos de color entre etapas: la forma final mantiene la paleta de la familia (más oscura o más clara, pero reconocible) y sus colores de acento (por ejemplo, el rosa de las branquias).
- Las formas finales llevan **detalle temático** para no verse planas: elementos del tipo repetidos en el cuerpo (ramitas de coral en el lomo, brazaletes, perlas, radios en las aletas, crin-aleta…).
- Texturas: líneas continuas y formas redondas; evitar patrones de puntitos sueltos (se ven como ruido).
- Si una postura se ve rara dos veces, cambiar de concepto (Coralis pasó de dos patas a cuatro, como un ciervo de coral). Evitar objetos sueltos como esferas en las manos.

## Nuevo proceso con PixelLab (desde la prueba de Robledor)
- PixelLab genera el dibujo base (mejor anatomía y silueta); Claude limpia, ajusta paleta/tamaño, separa en piezas y revisa.
- Ignito elegido por Alejandro: variante 5 de la prueba (`pixellab_pruebas/ignito_4.png`), en versión de pie de perfil.
- Por ahora 4 direcciones (perfil izquierda, frente, espalda; la derecha es el espejo). Más adelante, 8.
- Costos observados: 96×96 → 4 variantes por 10 generaciones; 80×80 → 9 variantes por 15; rotar a 4/8 direcciones con
  `create-character-v3` cuesta `ceil(ancho*alto*8/65536)` (≈1 generación a 80×80).
- Programa: `estudio/pixellab.py` (la clave la pone el entorno como secreto Bearer de api.pixellab.ai).

## Cómo decide Alejandro (desde los personajes)
- **Ánimas:** Alejandro elige entre las variantes (ya están las 80).
- **Personajes, objetos del mundo, íconos y similares:** se piden **4 variantes** y **Claude elige** la que mejor cumpla el estándar,
  sin preguntar. Criterios: pose neutra (parado, brazos abajo, sin objetos en la mano, porque la imagen es la base de todas
  las animaciones), fiel a colores y ropa actuales, nada que toque el borde, nada parecido a objetos de otros juegos
  (por ejemplo, esferas rojas y blancas).
- **Ataques:** Alejandro sí participa y elige.
- Personajes: lienzo de 64 × 64, unos 4 cabezas de alto. Animaciones: reposo y caminar en 3 vistas (lado, frente, espalda);
  el jugador además correr; jugador, rival y líderes además «lanzar» (de lado). Programa: `estudio/animar_pj.py`.
