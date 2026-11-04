# Dirección de arte

Referencia: el estilo «HD-2D» (Octopath Traveler). Personajes y objetos en pixel art dentro de escenarios 3D con luz suave, profundidad y aire. Todo se dibuja por código.

## Principios

1. **Nada de figuras básicas a la vista.** Un cono, un cilindro o una esfera de un solo color se ven de juguete. Toda superficie lleva textura (pixelada), variación de color o relieve.
2. **La luz se pinta.** En los fondos lejanos (montañas, volcán) la luz va en los colores de los vértices: más clara arriba a la izquierda, sombra violácea, borde cálido donde da el sol. Así se controla el resultado sin depender de dónde esté el sol.
3. **Profundidad por capas.** Primer plano nítido y saturado; plano medio con detalle; fondo cada vez más claro y teñido por la bruma (`scene.fog`). Al menos tres capas en los paisajes abiertos.
4. **Brillos suaves, nunca planos.** Halos, haces de luz, rayos de sol y humo usan degradados (`TitleArt.softTex`, `smokeTex`, sombreadores con desvanecido). Ningún brillo termina en un borde duro.
5. **Pixel art nítido y estable.** Texturas pequeñas con paleta corta; se ven con el muestreo «píxel nítido sin titileo» de `World3D.pixelize`.
6. **Movimiento sutil.** Viento en el pasto, humo que sube, agua que corre, polvo en la luz. Lento y continuo.

## Detalles técnicos

- **Colores de vértice:** el render final convierte a sRGB, así que los colores que se escriben en vértices van con `color.convertSRGBToLinear()`. Si no, se ven pálidos.
- **Fondos con luz pintada:** `MeshBasicMaterial` con `vertexColors` (sin luces de la escena) más una textura de roca en escala de grises que da el grano.
- **Relieve:** ruido suave (`TitleArt.fbm`) y de crestas (`TitleArt.ridged`); picos definidos con su altura y su ancho, y el eje torcido con ruido para que no sean simétricos. Los bordes se hunden bajo el suelo: sin huecos.
- **Nieve:** según la altura relativa de cada cordillera y la pendiente, con su propia luz (siempre clara).
- **Rendimiento:** cada efecto se mide en un celular simulado; si pesa, se simplifica o queda solo para la calidad «alta».

## Paletas

| Escena | Cielo | Fondo | Medio | Primer plano | Acentos |
|---|---|---|---|---|---|
| Título (atardecer) | `#ff8f47` → `#eb5766` → `#5c296b` | roca `#6a4a78`, sombra `#3a2848`, nieve `#fff0f6` | roca `#5a3e62`, colinas `#3e5a40` | pasto `#4aa43c`, tierra `#6a4a40` | sol `#ffd8a0`, lava `#ff5a1a`, faro `#fff0b8` |

(Se completa con cada escena que se rehace.)

## Antes y después

Cada cambio visual se compara con la versión publicada:

```bash
node tools/capturas.js http://localhost:8081/ http://localhost:8080/ titulo pueblo
```

(La primera dirección es la versión de antes, la segunda la nueva.) Las imágenes quedan en `tools/shots/capturas/`.
