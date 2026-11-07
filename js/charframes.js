'use strict';
// ============================================================
//  PERSONAJES ANIMADOS CUADRO POR CUADRO (hechos con PixelLab)
//  Para los personajes que tienen animaciones hechas con PixelLab, en el mundo 3D
//  y en el combate se reproducen cuadros en vez del sprite armado por piezas.
//  Cada animación es una tira PNG en assets/personajes/<clave>/<acción>_<vista>.png,
//  con cuadros de 64×64 que miran a la izquierda. Vistas: lado, frente, espalda
//  (la derecha es el espejo del lado). El cuadro 0 es el dibujo base.
// ============================================================
const CharFrames = {
  SET: {
    artist: { feet: 62, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    ascua: { feet: 62, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    baker: { feet: 61, acciones: { reposo: 5, caminar: 9 } },
    boy: { feet: 63, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    brisa: { feet: 62, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    bruna: { feet: 62, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    bug: { feet: 63, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    clerk: { feet: 61, acciones: { reposo: 5, caminar: 9 } },
    farmer: { feet: 62, acciones: { reposo: 5, caminar: 9 } },
    fisher: { feet: 61, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    girl: { feet: 62, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    grunt: { feet: 63, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    guard: { feet: 61, acciones: { reposo: 5, caminar: 9 } },
    guide: { feet: 62, acciones: { reposo: 5, caminar: 9 } },
    hiedra: { feet: 61, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    hiker: { feet: 62, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    jogger: { feet: 62, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    kid2: { feet: 61, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    lass: { feet: 61, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    mailman: { feet: 62, acciones: { reposo: 5, caminar: 9 } },
    mom: { feet: 62, acciones: { reposo: 5, caminar: 9 } },
    monk: { feet: 61, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    neron: { feet: 61, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    nurse: { feet: 62, acciones: { reposo: 5, caminar: 9 } },
    nyx: { feet: 61, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    oldman: { feet: 61, acciones: { reposo: 5, caminar: 9 } },
    oldwoman: { feet: 61, acciones: { reposo: 5, caminar: 9 } },
    player: { feet: 62, acciones: { reposo: 5, caminar: 9, correr: 9, lanzar: 9 } },
    prof: { feet: 62, acciones: { reposo: 5, caminar: 9 } },
    rival: { feet: 61, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    sailor: { feet: 61, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    scientist: { feet: 61, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    selene: { feet: 62, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    sister: { feet: 62, acciones: { reposo: 5, caminar: 9 } },
    smith: { feet: 62, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    swimmer: { feet: 61, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    vesper: { feet: 61, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    worker: { feet: 63, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
    youngster: { feet: 60, acciones: { reposo: 5, caminar: 9, lanzar: 9 } },
  },
  // personajes con cuadro de ojos cerrados (assets/personajes/<clave>/parpadeo_<vista>.png, hechos con PixelLab)
  BLINK: {
    frente: new Set(['artist', 'ascua', 'baker', 'boy', 'brisa', 'bruna', 'bug', 'clerk', 'farmer', 'fisher', 'girl', 'grunt', 'guard', 'guide', 'hiedra', 'hiker', 'jogger', 'kid2', 'lass', 'mailman', 'mom', 'monk', 'neron', 'nurse', 'nyx', 'oldwoman', 'player', 'prof', 'rival', 'sailor', 'scientist', 'selene', 'smith', 'swimmer', 'vesper', 'worker', 'youngster']),
    lado: new Set(['ascua', 'bruna', 'hiedra', 'mom', 'neron', 'nyx', 'player', 'prof', 'rival', 'selene', 'vesper']),
  },
  img: {},
  strip(k, accion, vista) {
    const key = k + '/' + accion + '_' + vista;
    if (!this.img[key]) { const im = new Image(); im.src = 'assets/personajes/' + key + '.png'; this.img[key] = im; }
    const im = this.img[key];
    return im.complete && im.naturalWidth ? im : null;
  },
  // clave del personaje a partir de su aspecto (LOOKS[clave])
  keyOf(look) {
    if (!this.byLook) { this.byLook = new Map(); for (const k in LOOKS) this.byLook.set(LOOKS[k], k); }
    const k = this.byLook.get(look);
    return k && this.SET[k] ? k : null;
  },
  // retrato quieto (de frente) encajado en un recuadro: pies abajo, centrado; sin cargar todavía devuelve false
  portrait(ctx, look, x, y, w, h, vista = 'frente') {
    const k = typeof look === 'string' ? look : this.keyOf(look);
    if (!k) return false;
    const im = this.strip(k, 'reposo', vista);
    if (!im) return false;
    const def = this.SET[k], top = 64 - (def.feet + 1) + 2;      // el personaje ocupa unas 60 filas del cuadro
    const alto = def.feet + 1 - top, sc = h / alto;
    const dw = Math.round(64 * sc), dh = Math.round(64 * sc);
    ctx.save(); ctx.imageSmoothingEnabled = sc < 1; if (sc < 1) ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(im, 0, 0, 64, 64, Math.round(x + w / 2 - dw / 2), Math.round(y + h - (def.feet + 1) * sc), dw, dh);
    ctx.restore();
    return true;
  },
  // lienzo con el personaje quieto (para texturas 3D); llama a cb cuando la imagen está lista
  canvasWhenReady(k, vista, cb) {
    const go = () => {
      const im = this.strip(k, 'reposo', vista);
      if (!im) return setTimeout(go, 100);
      // 40×60 (proporción 2:3, como el sprite clásico de 32×48), con los pies abajo
      const [c, x] = U.makeCanvas(40, 60), def = this.SET[k];
      x.drawImage(im, 0, 0, 64, 64, -12, 60 - (def.feet + 1), 64, 64);
      cb(c);
    };
    if (this.SET[k]) go();
  },
  vista(dir) { return dir === 'down' ? 'frente' : dir === 'up' ? 'espalda' : 'lado'; },
  // dibuja el personaje con los pies en (fx, fy) (coordenadas del mundo, 1 unidad = 2 píxeles del cuadro)
  draw(ctx, k, dir, accion, t, fx, fy) {
    const def = this.SET[k], vista = this.vista(dir);
    let n = def.acciones[accion] ? accion : 'reposo';
    // el lanzamiento solo existe de lado; de frente o espalda se queda quieto
    let im = this.strip(k, n, vista);
    if (!im && n !== 'reposo') { n = 'reposo'; im = this.strip(k, n, vista); }
    // si esa vista todavía no cargó, cualquier vista quieta del mismo personaje (nunca el dibujo viejo)
    if (!im) for (const v of ['frente', 'lado', 'espalda']) { im = this.strip(k, 'reposo', v); if (im) { n = 'reposo'; break; } }
    if (!im) return false;
    const total = def.acciones[n];
    let f;
    // quieto en su pose base; cada tanto (7 a 11 s, distinto por persona) hace su gesto completo, lento
    if (n === 'reposo') { const P = 7 + ((k.length * 3) % 5), tt = ((t % P) + P) % P, gd = total / 2.6; f = tt > P - gd ? Math.min(total - 1, Math.floor((tt - (P - gd)) * 2.6)) : 0; }
    else if (n === 'lanzar') f = Math.min(total - 1, Math.floor(t * 14));
    else f = 1 + Math.floor(t * (n === 'correr' ? 16 : 11)) % (total - 1);  // el cuadro 0 es la pose base: el ciclo usa 1..8
    // parpadeo: en la pose base, cada 3 a 5 s cierra los ojos un instante (a veces dos veces seguidas)
    if (n === 'reposo' && f === 0 && this.BLINK[vista] && this.BLINK[vista].has(k)) {
      const B = 3.2 + (k.length % 4) * 0.55, tb = ((t % B) + B) % B, dbl = Math.floor(t / B) % 3 === 0;
      if (tb < 0.12 || (dbl && tb > 0.28 && tb < 0.4)) { const bi = this.strip(k, 'parpadeo', vista); if (bi) im = bi; }
    }
    const x0 = Math.round(fx - 16), y0 = Math.round(fy - (def.feet + 1) / 2);
    ctx.save();
    if (vista === 'lado' && dir === 'right') { ctx.translate(x0 + 32, y0); ctx.scale(-1, 1); ctx.drawImage(im, f * 64, 0, 64, 64, 0, 0, 32, 32); }
    else ctx.drawImage(im, f * 64, 0, 64, 64, x0, y0, 32, 32);
    ctx.restore();
    return true;
  },
};
// se cargan todas las tiras al abrir el juego, así nadie aparece un instante con el dibujo de antes
for (const k in CharFrames.SET) for (const a in CharFrames.SET[k].acciones) for (const v of ['lado', 'frente', 'espalda']) if (a !== 'lanzar' || v === 'lado') CharFrames.strip(k, a, v);
for (const v in CharFrames.BLINK) for (const k of CharFrames.BLINK[v]) CharFrames.strip(k, 'parpadeo', v);
// mundo 3D: el sprite de cada persona se dibuja en un lienzo al doble de resolución, así 1 píxel del cuadro = 1 píxel
{
  const _de = World.drawEntity;
  World.drawEntity = function (ctx, e, cx, cy) {
    const k = e === this.player ? 'player' : e.look;
    if (!World.hiDraw || !CharFrames.SET[k] || e === this.follower || (e.def && e.def.creature) || e.lying || (e === this.player && this.swimming)) return _de.call(this, ctx, e, cx, cy);
    const sx = Math.round(e.px - cx), sy = Math.round(e.py - cy), hop = e.hop || 0;
    const corre = e === this.player && (e.speed || 1) >= 2;
    const accion = e.moving ? (corre ? 'correr' : 'caminar') : 'reposo';
    // cada personaje con su propio desfase, así no respiran todos a la vez
    const seed = e.def ? (e.def.x * 7 + e.def.y * 13) % 10 : 0;
    if (!CharFrames.draw(ctx, k, e.dir, accion, Engine.time + seed * 1.13, sx + 8, sy + 15 - hop)) return _de.call(this, ctx, e, cx, cy);
  };
}
// combate: el jugador se mueve por el campo
{
  const BP = BattleScene.prototype, _dt = BP.drawTrainer;
  BP.drawTrainer = function (ctx) {
    const T = this.trainer;
    if (!World.hiDraw || !T) return _dt.call(this, ctx);
    const v = Math.hypot(T.vx || 0, T.vy || 0);
    if (T.stun > 0 && Math.floor(this.t * 12) % 2) ctx.globalAlpha = 0.5;
    const ok = CharFrames.draw(ctx, 'player', T.dir, v > 8 ? 'correr' : 'reposo', this.t, Math.round(T.x), Math.round(T.y) + 1);
    ctx.globalAlpha = 1;
    if (!ok) return _dt.call(this, ctx);
    if (T.stun > 0) for (let i = 0; i < 3; i++) { const a = this.t * 6 + i * 2.1; Font.draw(ctx, '★', Math.round(T.x + Math.cos(a) * 7) - 2, Math.round(T.y - 28 + Math.sin(a) * 2), '#ffe060'); }
  };
}
