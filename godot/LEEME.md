# Prueba en Godot (solo comparación)

El Pueblo Alba rehecho en **Godot 4.3**, con el mismo arte del juego (exportado del juego a `arte/`, en PNG con extensión `.dat` para que Godot no lo recomprima).
No es parte del juego: sirve para comparar con la versión en JavaScript.

- `main.gd`: arma toda la escena por código (suelo, agua, árboles, casas con su fachada, personajes, luz con sombras, cielo, partículas, desenfoque estilo HD-2D y palanca táctil).
- `exportar.sh`: exporta a `web/` (renderizador «Compatibility», el único que Godot permite en navegador) y agrega el botón «Volver al juego».
- En la app: «VERSIÓN» → «Prueba en Godot (comparación)».
