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
