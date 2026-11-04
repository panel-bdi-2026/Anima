'use strict';
// ============================================================
//  Arranque del juego
// ============================================================
window.addEventListener('load', () => {
  Engine.init();
  Options.load();
  Scenes.push(new TitleScreen());
  // la música del título intenta empezar sola: en la app instalada el navegador suele permitirlo;
  // si no, queda en pausa hasta el primer toque (y el título lo avisa)
  Sound.unlock();
  Engine.start();
  // ayuda de depuración accesible desde la consola
  window.ANIMA = { G: () => G, World, Battle, Scenes, MAPS, SPECIES, Game };
});
