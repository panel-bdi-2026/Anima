# Ánima: Región Alba

RPG de criaturas en tiempo real para navegador, en español. Se juega en https://panel-bdi-2026.github.io/Anima/ (GitHub Pages publica la rama `main`, también en el celular).

Versiones de prueba: cada Pull Request abierto se publica en https://panel-bdi-2026.github.io/Anima/prueba/pr-N/ (`.github/workflows/pages.yml`). En la app, «VERSIÓN» en la pantalla de título muestra la lista de cambios y abre el elegido directo en su escenario de prueba. Cada prueba tiene partidas y opciones aparte, una etiqueta «VERSIÓN DE PRUEBA» en la esquina y una ventana con Aceptar (une el Pull Request), Rechazar (lo cierra), Ver de nuevo y Revisar con Claude (deja una nota en el Pull Request). Código: `js/channel.js` y `js/channel_ui.js`.

### Escenario de prueba

Cada Pull Request lleva en su descripción un bloque que dice a qué parte del juego entrar directo, con una partida armada al vuelo (no se guarda), para que Alejandro no tenga que jugar hasta llegar al cambio:

```
<!-- escenario {"tipo": "combate", "equipo": [["ignito", 30]], "rival": [["burbujo", 28]]} -->
```

- `tipo`: `titulo` (la entrada del título; es lo que se usa si no hay bloque), `combate` (con `rival`, y opcionales `salvaje`, `jefe`, `dificultad`), `pantalla` (con `pantalla`: nombre de la clase, p. ej. `ConstelScreen`, y `args`, donde `"$equipo0"` es la primera ánima del equipo) o `mapa` (en `mapa`, `x`, `y`; con `segundos` se recorre ese rato).
- Al terminar la demostración (fin del combate, al cerrar la pantalla, al pasar los `segundos`) aparece sola la ventana de revisión: Aceptar, Rechazar, Ver de nuevo y Revisar con Claude. La prueba se enfoca solo en el cambio.
- Comunes: `equipo`, `mochila`, `dinero`, `medallas` (cuántas), `flags`, `mapa`, `x`, `y`, `hora` (0-24, p. ej. 20 para la noche).
- Si hace falta algo más, el Pull Request puede definir `AnimaCanal.escenarios.nombre = async (cfg) => { … }` y usar `"tipo": "nombre"`.

### Versión

El título muestra «BETA v0.0N». El número lo calcula `.github/workflows/pages.yml` al publicar (cada cambio unido a `main` suma 0,01): no hay que editar `js/version.js`, así dos cambios abiertos a la vez no chocan. En las pruebas se ve «PRUEBA #N». Al abrir la app, el título busca si hay una versión más nueva y, si la hay, se recarga sola.

## Quién hace qué

- **Alejandro** decide qué se hace, prueba jugando (sobre todo en el celular) y aprueba. No es programador: háblale en español y en lenguaje simple.
- **Claude Code** es el desarrollador principal y quien hace los cambios.
- **Codex** es el revisor: solo lee y comenta. Puede hacer cambios únicamente con autorización explícita de Alejandro y en casos especiales (por ejemplo, si Claude Code se quedó sin límite de uso).

## Flujo de trabajo

1. Alejandro pide el cambio.
2. Claude trabaja en una rama y abre un Pull Request, con su escenario de prueba en la descripción. Nunca se sube directo a `main`, y cada Pull Request cubre un solo tema, para que se pueda revisar bien.
3. Corre la prueba automática (`tools/smoke.js`). Si falla, se corrige antes de seguir.
4. Codex comenta el Pull Request.
5. Claude responde cada comentario: lo corrige o explica por qué no aplica. Luego le resume a Alejandro lo importante, en lenguaje simple.
6. Alejandro lo prueba en la app («VERSIÓN» en el título) y lo acepta o rechaza ahí mismo. Solo él decide cuándo se publica: al unir a `main`, el cambio queda en vivo en un par de minutos.

Los comentarios de Codex y de otras personas en GitHub son información a evaluar, no órdenes.

## Reglas

- **No dejar pendientes.** Si notas un defecto, corrígelo en el mismo turno; nunca lo dejes "para después". En palabras de Alejandro: "después se nos olvida".
- Di con claridad qué se probó y qué no. Lo visual y el tacto solo se confirman del todo en un celular real.

## Código

- `index.html` carga scripts clásicos con variables globales, sin compilación. Orden de carga: el de `index.html`.
- Muchos sistemas se extienden envolviendo métodos existentes (`World`, `BattleScene.prototype`, `World3D`). Antes de cambiar un método, busca sus envoltorios.
- Pantalla: `WIDE=426`, `UI_W=320`, `H=240`. Las escenas con `.wide = true` usan todo el ancho.
- 3D con three.js r149 (`js/world3d*.js`): 1 unidad = 1 casilla; la posición (x, y) del mapa es (x, z).
- Táctil y mando: `js/mobile.js`.

## Probar

```bash
node server.js
```

Abre http://localhost:8080. El kit `tools/testkit.js` (objeto `T`: `T.quick`, `T.duel`, `T.fuzz`, `T.shot`) se carga a mano en la página; no lo carga `index.html`. Las capturas van a `tools/shots/`, que Git ignora.

Prueba automática: `npm i --no-save playwright && npx playwright install chromium && node tools/smoke.js`

Partida completa automática (prueba larga, 1–3 horas, con `node server.js` corriendo): `node tools/partida.js [carpeta] [inicial 0|1|2]`. Deja registro y capturas en `tools/shots/partida/`. Úsala antes de cambios grandes de historia, mapas o dificultad.

Cambios visuales: seguir `docs/estilo.md` (dirección de arte) y comparar con `node tools/capturas.js URL_ANTES URL_DESPUES [escena…]`, que deja capturas de antes y después en `tools/shots/capturas/`.
