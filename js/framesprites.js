'use strict';
// ============================================================
//  ÁNIMAS ANIMADAS CUADRO POR CUADRO (prueba con Ignito)
//  Para las especies que tienen animaciones hechas con PixelLab,
//  en vez de mover piezas se reproducen cuadros: reposo, caminar, correr,
//  atacar (de cerca), disparar (a distancia), golpe y caer.
//  Cada animación es una tira PNG en assets/animas/<especie>/<acción>_<vista>.png,
//  con cuadros de 80×80 (el doble de detalle que el sprite de 40) que miran a la izquierda.
//  Vistas: lado, frente, espalda (la derecha es el espejo del lado).
// ============================================================
const FrameSprites = {
  // especie -> cuántos cuadros tiene cada acción
  SPECIES: {
    ignito: { size: 80, feet: 71, acciones: { reposo: 5, caminar: 9, correr: 9, atacar: 9, disparar: 9, golpe: 5, caer: 9 } },
  },
  img: {},
  has(sp) { return !!this.SPECIES[sp]; },
  strip(sp, accion, vista) {
    const k = sp + '/' + accion + '_' + vista;
    if (!this.img[k]) { const im = new Image(); im.src = 'assets/animas/' + k + '.png'; this.img[k] = im; }
    const im = this.img[k];
    return im.complete && im.naturalWidth ? im : null;
  },
  // qué acción y qué cuadro mostrar según el estado del ánima
  pick(e, o, def) {
    const A = CreatureAnim.state(e), t = o.t || 0, n = (a) => def.acciones[a];
    A.nextBlink = 99;                                      // el parpadeo ya viene dibujado
    if (o.faintT !== undefined) { const k = Math.min(n('caer') - 1, Math.floor(o.faintT * 10)); return ['caer', k]; }
    if (A.hurtT > 0) { const k = Math.min(n('golpe') - 1, Math.floor((1 - A.hurtT / 0.38) * n('golpe'))); return ['golpe', k]; }
    if (A.atk) {
      const a = A.atk.kind === 'melee' || A.atk.kind === 'stealth' || A.atk.kind === 'dash' ? 'atacar' : 'disparar';
      const k = Math.min(n(a) - 1, Math.floor((A.atk.t / A.atk.dur) * n(a)));
      return [a, k];
    }
    if (o.act && !o.act.fired) {                          // preparando un ataque: la primera mitad del movimiento
      const a = o.act.m && (o.act.m.kind === 'melee' || o.act.m.kind === 'stealth') ? 'atacar' : 'disparar';
      const p = U.clamp(o.act.t / Math.max(0.05, o.act.windup), 0, 1);
      return [a, Math.floor(p * (n(a) / 2))];
    }
    const v = o.speed || 0, enCombate = 'dodge' in o;      // el combate pasa estos datos; el mapa no
    // en combate, si se mueve, corre; en el mapa (siguiendo al jugador), camina
    if (n('correr') && (o.dash || (enCombate && v > 8))) return ['correr', 1 + Math.floor(t * 16) % (n('correr') - 1)];
    if (v > 12) return ['caminar', 1 + Math.floor(t * 12) % (n('caminar') - 1)];
    return ['reposo', Math.floor(t * 5) % n('reposo')];
  },
  draw(ctx, e, o) {
    const def = this.SPECIES[o.sp];
    const vista = o.view === 'front' ? 'frente' : o.view === 'back' ? 'espalda' : 'lado';
    const [accion, k] = this.pick(e, o, def);
    const im = this.strip(o.sp, accion, vista) || this.strip(o.sp, 'reposo', vista);
    if (!im) return null;
    // el ataque avanza el estado que normalmente avanza la pose
    const A = CreatureAnim.state(e), dt = o.dt || 1 / 60;
    if (A.atk) { A.atk.t += dt; if (A.atk.t >= A.atk.dur) A.atk = null; }
    if (A.hurtT > 0) A.hurtT -= dt;
    // 80 px de cuadro = 40 unidades del sprite clásico; los pies (fila def.feet) caen en (px, py)
    const sc = (o.scale || 1) * (o.S || 40) / 40 / 2, Wd = def.size * sc;
    const x0 = Math.round(o.px - def.size / 2 * sc), y0 = Math.round(o.py - (def.feet + 1) * sc);
    const flip = vista === 'lado' && o.flip;
    const blit = (img) => {
      ctx.save();
      if (flip) { ctx.translate(x0 + Wd, y0); ctx.scale(-1, 1); ctx.drawImage(img, k * def.size, 0, def.size, def.size, 0, 0, Wd, Wd); }
      else ctx.drawImage(img, k * def.size, 0, def.size, def.size, x0, y0, Wd, Wd);
      ctx.restore();
    };
    blit(im);
    if (o.flash) {                                          // destello al recibir daño
      const [fb, fx] = this.flashBuf || (this.flashBuf = U.makeCanvas(im.width, im.height));
      if (fb.width !== im.width) { fb.width = im.width; fb.height = im.height; }
      fx.globalCompositeOperation = 'source-over'; fx.clearRect(0, 0, fb.width, fb.height); fx.drawImage(im, 0, 0);
      fx.globalCompositeOperation = 'source-in'; fx.fillStyle = o.flashColor || '#ffffff'; fx.fillRect(0, 0, fb.width, fb.height);
      fx.globalCompositeOperation = 'source-over';
      blit(fb);
    }
    return { accion, k };
  },
};
{
  const _draw = CreatureAnim.draw;
  CreatureAnim.draw = function (ctx, e, o) {
    if (FrameSprites.has(o.sp)) { const r = FrameSprites.draw(ctx, e, o); if (r) return {}; }
    return _draw.call(this, ctx, e, o);
  };
}
