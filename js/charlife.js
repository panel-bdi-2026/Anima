'use strict';
// ============================================================
//  VIDA EN LOS PERSONAJES (sprites HD del mundo 3D)
//  - Parpadeo: cada pocos segundos cierran los ojos un instante.
//  - Respiración: los hombros y la cabeza bajan un píxel, despacio
//    (se mueve una parte del dibujo entera, sin estirarlo).
//  - El protagonista, si está quieto un rato, mira hacia la cámara.
// ============================================================
{
  // hoja de ojos cerrados: los píxeles del ojo pasan a color de piel, menos la fila de abajo (el párpado)
  const EYE = [36, 26, 44], WHITE = [255, 255, 255];
  HiChar.blinkSheet = function (look) {
    const key = JSON.stringify(look);
    this.blinkC = this.blinkC || {};
    if (this.blinkC[key]) return this.blinkC[key];
    const src = this.get(look), [c, x] = U.makeCanvas(src.width, src.height); x.drawImage(src, 0, 0);
    const im = x.getImageData(0, 0, c.width, c.height), d = im.data, W2 = c.width;
    const is = (i, col) => d[i] === col[0] && d[i + 1] === col[1] && d[i + 2] === col[2] && d[i + 3] > 0;
    const L = normLook(look), sk = L.skin.match(/\w\w/g).map((h) => parseInt(h, 16));
    const kill = [];
    for (let y = 0; y < c.height - 1; y++) for (let xx = 0; xx < W2; xx++) {
      const i = (y * W2 + xx) * 4;
      if (is(i, EYE) && is(i + W2 * 4, EYE)) kill.push(i);          // ojo que sigue abajo: se cubre con piel
      else if (is(i, WHITE) && (is(i + W2 * 4, EYE) || is(i + 4, EYE) || is(i - 4, EYE))) kill.push(i); // brillo del ojo
    }
    for (const i of kill) { d[i] = sk[0]; d[i + 1] = sk[1]; d[i + 2] = sk[2]; }
    x.putImageData(im, 0, 0);
    return (this.blinkC[key] = c);
  };
  const _de = World.drawEntity;
  World.drawEntity = function (ctx, e, cx, cy) {
    if (!World.hiDraw || e === this.follower || (e.def && e.def.creature) || e.lying || (e === this.player && this.swimming) || e.moving || (e.hop || 0)) return _de.call(this, ctx, e, cx, cy);
    const look = e === this.player ? LOOKS.player : LOOKS[e.look] || LOOKS.boy;
    const t = Engine.time, seed = (e.def ? e.def.x * 7 + e.def.y * 13 : 3) % 10;
    // el protagonista quieto un rato mira a la cámara
    if (e === this.player) {
      this.idleT = (this.lastPX === e.px && this.lastPY === e.py && !this.busy && Scenes.top() === this) ? (this.idleT || 0) + 1 / 60 : 0;
      this.lastPX = e.px; this.lastPY = e.py;
    }
    const dir = e === this.player && this.idleT > 5 && e.dir !== 'down' && Math.floor(this.idleT / 4) % 2 ? 'down' : e.dir;
    const blink = ((t + seed * 0.37) % 3.7) < 0.12;
    const breath = Math.floor((t * 0.8 + seed * 0.13) % 2); // 0 / 1: hombros arriba / abajo
    const sheet = blink && dir !== 'up' ? HiChar.blinkSheet(look) : HiChar.get(look);
    const sx = Math.round(e.px - cx), sy = Math.round(e.py - cy), row = DIR_ROW[dir] * HCH;
    // piernas y cuerpo, y encima la parte de arriba (cabeza y hombros), bajada 1 píxel al «exhalar»
    const cut = 30;
    ctx.drawImage(sheet, 0, row + cut, HCW, HCH - cut, sx, sy - 9 + cut / 2, 16, (HCH - cut) / 2);
    ctx.drawImage(sheet, 0, row, HCW, cut, sx, sy - 9 + breath * 0.5, 16, cut / 2);
  };
}
