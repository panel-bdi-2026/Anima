# Ánima: Región Alba

RPG de captura de criaturas al estilo clásico de 8 bits, con **combates en tiempo real**.
Todo el contenido (criaturas, mapas, historia, gráficos y música) es original y se genera por código.

## Cómo jugar

- **Opción 1:** abre `index.html` con doble clic (Chrome, Edge o Firefox).
- **Opción 2 (recomendada):** ejecuta `node server.js` en esta carpeta y abre <http://localhost:8080>.

La partida se guarda en el navegador: hay **3 ranuras** (menú → GUARDAR) y **autoguardado** al entrar en ciudades y Centros (se puede desactivar en Opciones). Servido con `node server.js` el juego se puede **instalar como aplicación** (PWA) desde el navegador.

## Controles

| Exploración | |
|---|---|
| Flechas / WASD | Moverse |
| Shift (mantener) | Correr |
| Z / Espacio | Hablar, interactuar, confirmar |
| X / Esc | Cancelar |
| Intro / Esc | Menú |
| C (mantener) | **Sigilo**: caminas agachado y te detectan mucho menos (en la hierba alta, casi nada) |
| E | **Lanzar en el mapa**: esferas o cebos, sin entrar en combate |
| M | Mapa de la región (y viaje rápido) |

| Combate (tiempo real) | |
|---|---|
| Flechas / WASD | Mover a tu ánima por la arena |
| **Ratón** | Apuntar: los ataques y las esferas van hacia el cursor |
| **J / clic izquierdo** | **Ataque armado** (al empezar, el 1). Mantén pulsado para cargarlo (hasta ×1.6) |
| **Mayús (mantener)** | **Selector táctico**: el tiempo va al 25%, eliges un ataque con la dirección o el ratón y al soltar queda armado y se lanza |
| Rueda del ratón | Cambiar el ataque armado |
| 1 2 3 4 · K L I · clic derecho | Ataques directos (cada uno con su recarga) |
| V | **Movimiento asistido** (opcional, también en Opciones): tu ánima se coloca sola; tú atacas y esquivas |
| Espacio | Esquivar (invulnerable un instante) |
| **E** (o botón central, o "Capturar" en la pausa) | **Modo captura**: pasas a controlar al entrenador |
| R | Cambiar el tipo de esfera |
| F | **Arte Ánima**, cuando la barra de Sinergia está llena |
| G / 6 | **Dúo**: invoca a tu segunda ánima unos segundos (gasta la Sinergia) |
| Q | Cambiar de ánima |
| Intro / Esc | Pausa: mochila, equipo, huir, controles |

En los menús también se puede usar el ratón: pasar por encima selecciona, clic izquierdo confirma y clic derecho vuelve. También funciona con mando (gamepad).

## Mecánicas

- **Combate en el propio mapa:** no hay pantalla aparte. El combate empieza donde estás y un anillo luminoso delimita el área; solo puedes salir con **Huir** (que puede fallar). El terreno cuenta: árboles, rocas, casas y paredes bloquean el paso y los disparos, así que puedes cubrirte; el agua bloquea el paso pero no los disparos; la hierba alta te oculta un poco y le cuesta más apuntarte al rival. Las ánimas salvajes deambulan **visibles** por la hierba (algunas te persiguen al verte y otras huyen) y otras te **emboscan** desde la hierba alta. Los entrenadores luchan donde están, y los líderes en la **arena de su gimnasio**.
- **Combate en tiempo real:** hay ataques cuerpo a cuerpo, cargas, proyectiles, rayos, zonas y ondas. Los ataques enemigos se marcan en **rojo** antes de golpear, así que ¡esquívalos! Una **esquiva perfecta** ralentiza el tiempo, llena tu Sinergia y hace que tu siguiente golpe sea un **contraataque** (×1.5). Las flechas ↑/↓ en la barra de ataques indican si son eficaces contra el rival.
- **Ataques cargados:** mantén la tecla de un ataque para cargarlo; te mueves más despacio mientras cargas.
- **Dúo:** la Sinergia se carga sola con el tiempo y al golpear. Con ella llena puedes lanzar el Arte (F) o invocar a tu **segunda ánima** (G) para que luche a tu lado unos 10 segundos. Se puede usar **1 vez** en combates normales y **hasta 3** contra alfas, entrenadores y líderes, que también lo usan contra ti. Si tu ánima cae mientras el Dúo está fuera, el Dúo toma el relevo.
- **Terreno vivo:** el fuego **quema la hierba alta** (y se propaga, salvo con lluvia), lo eléctrico **electrifica el agua** y los golpes fuertes **rompen rocas**. Pisar fuego o agua electrificada hace daño.
- **Jefes con fases:** los líderes, los legendarios y los alfas entran en **furia** a mitad de vida: se vuelven más rápidos y llenan la arena de peligros.
- **Ánimas alfa:** más grandes, con aura roja, siempre agresivas y difíciles de capturar; dan botín al derrotarlas y, si las capturas, tienen un 10% más de estadísticas.
- **Modo captura:** al pulsar **E** controlas al **entrenador**, que se mueve por el área (WASD) mientras tu ánima lo protege sin atacar. La esfera vuela en arco y **solo captura si cae sobre la criatura**: hay que apuntar bien y anticipar su movimiento, y si fallas se pierde.
  - Con ratón: clic izquierdo y cae justo en el cursor (el círculo de caída se pone verde cuando apuntas a la criatura).
  - Con teclado: mantén ESPACIO, gira la puntería con ←→ y ajusta la distancia con ↑↓; suelta para lanzar.
  - Cuidado: los ataques del rival pueden aturdir al entrenador. Los árboles y las paredes detienen la esfera.
  - Bonificaciones: lanzamiento preciso al centro, criatura aturdida o con un estado alterado, por la espalda o mientras prepara un ataque. Si se escapa, sale furiosa.
  - E o clic derecho para volver a controlar a tu ánima.
- **Captura por sorpresa:** pulsa **E** en el mapa para apuntar y lanzar sin entrar en combate. Si la criatura **no te ha visto** (o está comiendo un cebo) puedes capturarla directamente; si falla, te ataca o huye. Combínalo con el **sigilo** y los **cebos** (Baya Dulce).
- **Esferas especiales:** Pesada (vuela corto; ánimas grandes o de Roca), Rápida (vuela deprisa; al empezar el combate o por sorpresa), Nocturna (de noche y en cuevas) y Red (Agua y Bicho).
- **Comportamientos:** hay ánimas que viven en **manadas** (si una huye, huyen todas), **emboscadores nocturnos** que solo enseñan los ojos, y especies que solo salen **con lluvia** o **de noche**. El Códice tiene una página de **hábitat** con dónde, cuándo y cómo vive cada especie.
- **Evolución ramificada:** las 60 ánimas tienen 3 etapas. La primera evolución es fija; la segunda tiene **dos caminos posibles** según:
  - **Estilo de combate:** *Ímpetu* (cuerpo a cuerpo y cargas) o *Temple* (distancia y esquivas).
  - **Hora del día:** de día o de noche (según el reloj del juego).
  - **Objeto:** Núcleo Mente o Núcleo Hierro.
  - **Estadísticas:** si el Ataque supera a la Defensa.
  - **Vínculo:** alto o bajo (se gana luchando juntos y paseando).
  - **Lugar:** dentro de una cueva o fuera.

  El Códice y la ficha de cada ánima muestran sus criterios.
- **Árbol de talentos:** cada 2 niveles se gana un punto, que se invierte en 3 ramas (Ímpetu, Temple y Vigor), con 3 niveles cada una. La Hierba Olvido reinicia los talentos.
- **Amuletos:** objetos equipables (potencian tipos, velocidad, críticos, defensa, recargas, Sinergia o curación automática).
- **Arte Ánima:** un ataque definitivo que se carga golpeando y esquivando.
- **Ánimas brillantes:** variantes de color muy raras.
- **Compañero:** tu primera ánima te sigue por el mundo. ¡Habla con ella!
- **Ciclo día/noche:** un día dura 24 minutos reales (se puede cambiar a 15 o 48 minutos, o al reloj real, en Opciones). Hay amanecer y atardecer, y de noche se encienden faroles y ventanas y salen luciérnagas. Algunas ánimas solo aparecen de noche.
- **Clima:** días despejados, nublados, lluvia, tormenta y niebla en el bosque. La lluvia potencia el Agua y debilita el Fuego en combate.
- **Un mundo vivo:** los habitantes tienen rutinas según la hora (riegan, barren, reparten el correo, pescan, pintan, salen a correr, juegan) y vuelven a casa de noche. Por la hierba asoman ánimas salvajes que huyen al acercarte.
- **Objetivos:** el juego siempre te indica tu siguiente objetivo, en el menú y cuando cambia.
- **Recompensas del Códice:** la Profesora te premia según las ánimas que captures.
- **Habilidades de campo:** con la medalla adecuada y un ánima del tipo correcto puedes **Cortar** arbustos (Planta/Bicho), **Romper** rocas agrietadas (Roca/Normal/Fuego), **Nadar** (Agua) e **Iluminar** cuevas oscuras (Fuego/Eléctrico). Detrás hay **zonas secretas**.
- **Recolección y Taller:** recoge bayas, minerales y hongos (vuelven a crecer cada día) y fabrica esferas y medicinas con la artesana de cada Centro.
- **Encargos y amistad:** el tablón de cada Centro tiene encargos de los vecinos; al completarlos ganas premios y su amistad (algunos te harán regalos especiales).
- **Campo de entrenamiento:** la Instructora Vega, en Villa Musgo, enseña la esquiva perfecta, los ataques cargados, el Dúo y el terreno.
- **Mapa y viaje rápido:** con la primera medalla puedes viajar al instante a cualquier ciudad ya visitada.
- **Calendario:** la semana tiene 7 días. El **sábado** hay mercado (20% de descuento), el **domingo** aparecen el doble de alfas y por la noche hay **festival de farolillos** en Villa Musgo.
- **Tu estilo cuenta:** la región se fija en cómo luchas (*Puño Ardiente*, *Ojo de Halcón* o *Equilibrista*); aparece en tu ficha, los vecinos lo comentan y tu rival prepara su equipo para contrarrestarlo.
- **Dificultad:** los líderes y jefes tienen más vida, curan con Hiperpociones (1 en los dos primeros gimnasios, 2 después), entran en furia a mitad de combate y usan una IA más lista. Llegar al nivel del líder con tipos favorables no garantiza la victoria: hay que esquivar, cambiar de ánima y usar bien la Sinergia.
- **Gráficos:** el terreno de exteriores y cuevas se pinta píxel a píxel (sin cuadrícula), con bordes naturales entre hierba, camino, arena y agua, profundidad y espuma en el agua, acantilados con relieve y sombras de contacto.
- **Ánimas animadas:** cada ánima está hecha de partes (patas, cuerpo, cabeza, ojos, cola, alas) que se mueven por separado: respiran, parpadean, mueven la cola, caminan, aletean y flotan. Cada tipo de ataque tiene su propio movimiento (embestida, carga, disparo con retroceso, salto y golpe al suelo, potenciación...), y reaccionan a los golpes, al aturdimiento, a las esquivas y al debilitarse.
- **Grietas Ánima (mazmorras):** en el Bosque Susurro, la Ruta 3 y la Ruta 5 hay grietas que generan una mazmorra distinta cada vez (bosque, caverna o volcán). Tienen 3 pisos con ánimas más fuertes, muchos alfas y cofres, y en el fondo espera un **alfa colosal** que deja botín de gran calidad (Caramelos Raros y amuletos alfa exclusivos). No hay Centros dentro. Para salir: Cuerda Huida (en tiendas), la Piedra Retorno (premio de la primera grieta), un ánima de tipo Mente (Teletransporte) o Roca (Excavar), o el portal que aparece al vencer al jefe. Opción ESCAPAR en el menú.
- **Modo práctica:** desde la pantalla de título puedes practicar combates con las especies que hayas capturado en cualquiera de tus partidas (o con los iniciales si aún no tienes ninguna), eligiendo rival, nivel y dificultad. No afecta a tus partidas.
- **Música viva:** cada zona tiene variantes de noche, lluvia y eclipse, y los pasos suenan distinto según el suelo.

## Progresión

- **Constelación:** cada línea evolutiva tiene su propio tablero de nodos (18 + 8 de las Quimeras, todos distintos). Al subir de nivel ganas Esencia y activas nodos vecinos: estadísticas (+3%), talentos, ataques nuevos que no aprende por nivel, un **nodo clave** propio de la línea y nodos sellados que se abren con **Llaves Esencia** (las sueltan alfas y jefes). Cada evolución abre un anillo exterior. Menú de Ánimas → Constelación. La Hierba Olvido la reinicia.
- **Equipamiento del entrenador** (menú → EQUIPAMIENTO): 6 ranuras (Brazalete, Anillo, Colgante, Botas, Emblema, Talismán) que mejoran a todas tus ánimas. Seis rarezas: Común, Poco común, Raro, Épico, Legendario (con un efecto único) y Divino (rarísimo, solo de alfas y jefes). Cada ranura tiene 4 formas (p. ej. Brazalete, Brazal, Muñequera, Guantelete) con icono propio, y el nombre combina forma, efecto principal y material (p. ej. «Sortija Arcana de Zafiro»). Hay 9 efectos legendarios y 5 divinos. Lo que sobra se desmonta en Fragmentos para reforjar.
- **Fusiones** (Altar de Quimeras, Ciudad Roca): 8 parejas compatibles de líneas en 2.ª etapa o más, con nivel mínimo, vínculo alto, un catalizador y a veces una hora del día. Las dos ánimas se funden en una especie nueva. Los catalizadores salen de alfas y jefes de las grietas, y al conseguir uno se revela su receta.

## Contenido

**Capítulo 1:** 9 zonas exteriores, una cueva y más de 20 interiores; 3 gimnasios, el Equipo Eclipse y 3 combates contra tu rival.

**Capítulo 2 · El Gran Eclipse** (tras terminar el capítulo 1, por la Ruta 4 al sur de Puerto Marea): la volcánica Ciudad Brasa (Fuego), el Pico Céfiro (Viento), el lago de la Ruta 6, la oscurísima Gruta Umbral y Ciudad Aurora (Mente), con la Torre Eclipse como clímax. Tras la 5.ª medalla hay **eclipses reales** cada día a mediodía: el cielo se oscurece y las ánimas salvajes salen **eclipsadas** (más fuertes y con más experiencia) hasta que derrotes a Nyx.

60 ánimas + 8 Quimeras de fusión, incluidos **4 legendarios** en el postjuego: los tres guardianes de la región y un cuarto que se revela al reunir a los tres.

**Gráficos:** las 60 ánimas están dibujadas a mano píxel a píxel (`js/hand_*.js`), de perfil y por piezas (cabeza, patas, alas, cola…), y se animan pieza a pieza al caminar, atacar y recibir daño. La pantalla es panorámica (426×240). Las pantallas de Equipamiento, Constelación y el Altar de Quimeras, la barra de ataques y el menú de pausa usan todo el ancho.
**Gráficos 3D (exteriores):** los pueblos, rutas y el bosque se dibujan en 3D con three.js (`js/world3d.js`, librería en `js/vendor/`), al estilo HD-2D: edificios con volumen y tejado a dos aguas, árboles, personajes y ánimas de pie con sombras del sol, agua con brillos, sombras de nubes, faroles y ventanas que se encienden de noche y desenfoque de profundidad. Si un edificio o un árbol tapa a tu personaje, se vuelve transparente. La lógica sigue en 2D. Los combates en exteriores también son 3D: las ánimas luchan de pie, los avisos de ataque y el área se pintan sobre el suelo, los proyectiles siguen la perspectiva y el ratón apunta con un rayo contra el suelo. Los interiores son maquetas abiertas por delante, con paredes altas, ventanas que dejan pasar la luz y muebles con volumen; las cuevas y grietas tienen paredes de roca, oscuridad y la luz de tu antorcha, con un hueco en la roca que te deja ver siempre a tu personaje; los acantilados de los exteriores tienen altura. Vallas, rocas, carteles, bancos, barriles, buzones, jardineras, setos y muebles (estanterías, mesas, camas, televisores, ordenadores, mostradores) tienen volumen (`js/world3d_props.js`), hay flores de pie que se mecen y el agua tiene oleaje. El modo de lanzar esferas en el mapa también es 3D. Las plantas en maceta (`js/world3d_plants.js`) tienen 12 especies y 6 macetas, y hay plantas extra en mesas, mostradores, paredes, esquinas y junto a las puertas. Se puede volver al modo clásico en Opciones → Gráficos.

## Puzzles

- **Cámara del Eco** (Cueva Eco): empuja tres rocas con runas sobre sus placas de presión para hundir la compuerta. Dentro hay Llaves Esencia y Ultraesferas.
- **Santuario de Cristal** (Gruta Umbral): enciende los cinco cristales a la vez; tocar uno cambia también a sus vecinos. Dentro hay Llaves Esencia y un catalizador de fusión.
- **Sellos de las Grietas**: algunos pisos de las Grietas Ánima tienen un tesoro tras una compuerta que se abre con tres cristales.
- Cada puzzle tiene una piedra rúnica con la pista que permite reiniciarlo; si las rocas te encierran, el puzzle se reinicia solo. Los puzzles son opcionales: nunca cierran el camino principal.

**Presentación:** la pantalla de título es una isla flotante en 3D al atardecer, con las ánimas iniciales corriendo alrededor de una casita y un faro; el mapa de la región es una maqueta en relieve con montañas, volcán, mar y pueblos en miniatura.

## Móvil, tablet y mandos

- **Táctil** (`js/mobile.js`): joystick flotante a la izquierda y botones a la derecha que cambian según el momento (mundo, combate, captura, lanzar esferas, menús). En combate, tocar el campo ataca hacia ese punto (mantener = cargar) y tocar una tarjeta usa ese ataque. En los menús se toca para elegir y se arrastra para desplazar. Los controles aparecen solos al tocar la pantalla (Opciones → Controles táctiles: Auto / Siempre / No).
- **Pantalla**: el juego ocupa todo el espacio y respeta la muesca. En móviles los botones van en los márgenes laterales; en tablets en vertical el juego queda arriba y los controles debajo. En un móvil en vertical se pide girarlo. Al tocar por primera vez se pasa a pantalla completa y horizontal (si el sistema lo permite).
- **Calidad 3D** (Opciones → Calidad 3D): Auto, Alta, Media o Baja. En Auto se elige según el aparato y baja sola si los fotogramas van lentos.
- **Al cambiar de app** el juego se pausa, se guarda (si estás en el mapa y el autoguardado está activo) y el combate abre su menú de pausa.
- **Mandos** (Xbox, PlayStation, Backbone, Switch Pro y la mayoría de mandos bluetooth): stick izquierdo mover, stick derecho apuntar, A/RT ataque armado (mantener: cargar), B esquivar, X selector táctico, Y Arte, LB/RB elegir ataque, LT captura, L3 Dúo, Select cambiar ánima, Start pausa. En el mapa: A hablar, B volver (mantener: correr), Y lanzar esfera, LB sigilo, Select mapa, Start menú. Las ayudas en pantalla muestran los botones del mando o del tacto según lo que uses.
- **Vibración** al recibir golpes y al capturar, en el móvil y en el mando (Opciones → Vibración).

## Gráficos (segunda pasada)

- **Personajes en alta definición** (`js/chargfx_hd.js`): 32×48 por fotograma, con ojos con brillo, cejas, mechones, costuras, botones y bolsillos; se usan en el mundo 3D, en el combate y en los retratos.
- **Efectos de combate en 3D** (`js/battlefx3d.js`): partículas por tipo (brasas y humo, gotas, hojas, chispas y relámpagos, esquirlas, remolinos, humo de sombra…), estelas y luz en los proyectiles, ondas en el suelo y destellos en cada golpe.
- **Cielo y clima** (`js/world3d_sky.js`): lluvia en 3D con salpicaduras, nieve en Pico Céfiro, bruma matinal y niebla del Bosque; cúpula de cielo con sol, luna, estrellas y nubes según la hora.
- **Agua** con reflejo del cielo, destellos del sol, espuma en la orilla y ondas al moverse cerca.
- **Pulido** (`js/world3d_polish.js`): luz de borde y volumen en ánimas y personajes; variación de color del suelo a gran escala.
- **Hierba alta** en matas en abanico de frente a la cámara, con volumen desde cualquier ángulo.
- **Pantalla de inicio**: atardecer sobre el valle con el protagonista en un acantilado.
- **Interiores** (`js/world3d_interior.js`): cuadros en la pared (paisajes y retratos de ánimas), chimenea encendida en las casas con luz que parpadea y haces de luz por las ventanas de día.
- **Identidad de cada ciudad** (`js/world3d_towns.js`): barcas y gaviotas en Puerto Marea, lava brillante y brasas en Ciudad Brasa, molinos en Pico Céfiro, setas gigantes en Villa Musgo, vagonetas con farol en Ciudad Roca y cristales violetas en Ciudad Aurora.
- **Iluminación**: el sol recorre el cielo según la hora y las sombras se alargan al amanecer y al atardecer.
- **Transiciones**: barrido de rombos en diagonal al cambiar de lugar.
- **Menús**: fondos animados con degradado, rombos y motas de luz; tienda rediseñada con vista previa del objeto y etiquetas de precio.
