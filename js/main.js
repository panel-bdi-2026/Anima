'use strict';
// ============================================================
//  Arranque del juego
// ============================================================
window.addEventListener('load', () => {
  Engine.init();
  Options.load();
  Scenes.push(new TitleScreen());
  Engine.start();
  // ayuda de depuración accesible desde la consola
  window.ANIMA = { G: () => G, World, Battle, Scenes, MAPS, SPECIES, Game };
});
