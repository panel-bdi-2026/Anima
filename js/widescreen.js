'use strict';
// escenas que se dibujan a todo el ancho (mundo y combate); el resto son menús centrados
for (const C of [BattleScene, FieldIntro, BattleTransition, FieldThrow]) C.prototype.wide = true;
for (const C of [TitleScreen]) C.prototype.wide = true;
