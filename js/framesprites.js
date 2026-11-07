'use strict';
// ============================================================
//  ÁNIMAS ANIMADAS CUADRO POR CUADRO (hechas con PixelLab)
//  En vez de mover piezas se reproducen cuadros: reposo, caminar, correr,
//  atacar (de cerca), disparar (a distancia), golpe y caer.
//  Cada animación es una tira PNG en assets/animas/<especie>/<acción>_<vista>.png,
//  con cuadros cuadrados de SIZE píxeles que miran a la izquierda (el cuadro 0 es el dibujo base).
//  Vistas: lado, frente, espalda (la derecha es el espejo del lado).
//  Escala: 80 píxeles de cuadro = 40 unidades del sprite clásico (las formas finales, de 96 o más, se ven más grandes).
//  Variocolor: la misma tira con el tono girado, igual que hacía el sprite clásico.
// ============================================================
const FrameSprites = {
  // especie -> [tamaño del cuadro, fila de los pies en el cuadro base]
  DATA: {
    ignito: [80, 70], fogarzo: [80, 69], magmaurio: [96, 80], solarix: [96, 81], burbujo: [80, 65], marolo: [80, 63],
    abismar: [96, 83], coralis: [96, 84], semillin: [80, 67], hojardo: [80, 73], robledor: [96, 91], floraxia: [96, 79],
    rabin: [80, 70], conejal: [80, 71], liebron: [96, 89], nocturo: [96, 88], pipio: [80, 71], alondro: [80, 74],
    tormentor: [96, 85], cefireo: [96, 86], larvita: [80, 64], crisalix: [80, 73], polillux: [96, 84], escarabron: [96, 82],
    voltin: [80, 68], dinamo: [80, 67], tesloria: [96, 87], ferrovolt: [96, 89], guijin: [80, 67], pedrusco: [80, 71],
    basaltor: [96, 88], monolito: [96, 88], umbrin: [80, 66], penumbro: [80, 71], eclipsor: [96, 81], lunargo: [96, 81],
    escamin: [80, 66], aleton: [80, 68], tifonar: [96, 78], arrecifor: [96, 76], psiqui: [80, 63], mentalis: [80, 70],
    kinesio: [96, 89], oniria: [96, 80], hongui: [80, 68], setalon: [80, 71], esporal: [96, 94], micelion: [96, 87],
    brisin: [80, 65], nimbo: [80, 63], granizor: [96, 83], nubaria: [96, 80], murcin: [80, 71], noctalar: [80, 70],
    lunavela: [96, 93], vampirax: [96, 87], silvaneo: [96, 91], auroros: [96, 86], marealis: [104, 94], albora: [96, 88],
    geiseron: [96, 90], tempestron: [112, 101], umbrarbol: [96, 93], lunafalena: [96, 87], forjador: [96, 89], leviaton: [96, 84],
    celestia: [96, 93], galerno: [112, 97], tofu: [80, 67], mistofa: [80, 71], arcanya: [104, 99], buppa: [80, 70],
    buclon: [80, 71], monteriz: [96, 88], parker: [80, 68], gatumbra: [80, 68], umbrapanter: [96, 87], aurelina: [96, 93],
    florizo: [96, 83], trueno_umbrio: [96, 92],
  },
  // cuántos cuadros tiene cada acción (iguales para todas)
  ACC: { reposo: 5, caminar: 9, correr: 9, atacar: 9, disparar: 9, golpe: 5, caer: 9 },
  img: {},
  has(sp) { return !!this.DATA[sp]; },
  base(sp, accion, vista) {
    const k = sp + '/' + accion + '_' + vista;
    if (!this.img[k]) { const im = new Image(); im.src = 'assets/animas/' + k + '.png'; this.img[k] = im; }
    const im = this.img[k];
    return im.complete && im.naturalWidth ? im : null;
  },
  // tira lista para dibujar (variocolor: se tiñe una vez y queda guardada)
  strip(sp, accion, vista, shiny) {
    const im = this.base(sp, accion, vista);
    if (!im || !shiny) return im;
    const k = sp + '/' + accion + '_' + vista + ':s';
    return this.img[k] || (this.img[k] = this.shinyCanvas(im));
  },
  // gira el tono como U.shade(c, 0.04, 0.42, 0.05); el contorno casi negro y los grises (ojos, brillos) no cambian
  shinyCanvas(im) {
    const [c, x] = U.makeCanvas(im.naturalWidth, im.naturalHeight);
    x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data, memo = new Map();
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const key = (p[i] << 16) | (p[i + 1] << 8) | p[i + 2];
      let o = memo.get(key);
      if (!o) {
        let [h, s, l] = U.rgbToHsl(p[i], p[i + 1], p[i + 2]);
        if (l > 0.12 && s > 0.12) { h = (h + 0.42) % 1; l = Math.min(1, l + 0.04); s = Math.min(1, s + 0.05); }
        o = U.hslToRgb(h, s, l); memo.set(key, o);
      }
      p[i] = o[0]; p[i + 1] = o[1]; p[i + 2] = o[2];
    }
    x.putImageData(d, 0, 0);
    return c;
  },
  // qué acción y qué cuadro mostrar según el estado del ánima
  pick(e, o) {
    const A = CreatureAnim.state(e), t = o.t || 0, n = (a) => this.ACC[a], dt = o.dt || 1 / 60;
    if (o.faintT !== undefined) return ['caer', Math.min(n('caer') - 1, Math.floor(o.faintT * 10))];
    if (A.hurtT > 0) return ['golpe', Math.min(n('golpe') - 1, Math.floor((1 - A.hurtT / 0.38) * n('golpe')))];
    if (A.atk) {
      const k = A.atk.kind, a = k === 'melee' || k === 'stealth' || k === 'dash' ? 'atacar' : 'disparar';
      return [a, Math.min(n(a) - 1, Math.floor((A.atk.t / A.atk.dur) * n(a)))];
    }
    if (o.act && !o.act.fired) {                          // preparando un ataque: la primera mitad del movimiento
      const k = o.act.m && o.act.m.kind, a = k === 'melee' || k === 'stealth' || k === 'dash' ? 'atacar' : 'disparar';
      const p = U.clamp(o.act.t / Math.max(0.05, o.act.windup), 0, 1);
      return [a, Math.floor(p * (n(a) / 2))];
    }
    const v = o.speed || 0, enCombate = 'dodge' in o;      // el combate pasa estos datos; el mapa no
    // en el mapa, el acompañante corre si el jugador corre (botón B / Mayúsculas)
    const jugadorCorre = !enCombate && typeof World !== 'undefined' && e === World.follower && World.player && World.player.speed >= 2;
    if (o.dash || (enCombate && v > 8) || (jugadorCorre && v > 12)) return ['correr', 1 + Math.floor(t * 16) % (n('correr') - 1)];
    if (v > 12) return ['caminar', 1 + Math.floor(t * 12) % (n('caminar') - 1)];
    return ['reposo', Math.floor((t + (e.animSeed || 0)) * 5) % n('reposo')];
  },
  // ícono propio de 32 px (simplificado, para que se distinga en tamaños chicos)
  icon(sp) {
    const k = sp + '/icono';
    if (!this.img[k]) { const im = new Image(); im.src = 'assets/animas/' + k + '.png'; this.img[k] = im; }
    const im = this.img[k];
    return im.complete && im.naturalWidth ? im : null;
  },
  iconShiny(sp) { const k = sp + '/icono:s', im = this.icon(sp); return im && (this.img[k] || (this.img[k] = this.shinyCanvas(im))); },
  draw(ctx, e, o) {
    const [size, feet] = this.DATA[o.sp];
    // retrato chico de menú: el ícono, con un saltito suave
    if (o.portrait && (o.S || 40) <= 32) {
      const ic = o.shiny ? this.iconShiny(o.sp) : this.icon(o.sp);
      if (ic) {
        // de 20 a 32 se dibuja a su tamaño real (nítido, sin achicar); más chico, se achica suavizado
        const S0 = Math.round((o.S || 40) * (o.scale || 1)), S = S0 >= 20 ? 32 : S0, bob = Math.floor(((o.t || 0) + (e.animSeed || 0)) * 2) % 2;
        ctx.save(); ctx.imageSmoothingEnabled = S < 32; if (S < 32) ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(ic, Math.round(o.px - S / 2 - (S - S0) / 3), Math.round(o.py - S + (S - S0) / 2) - bob, S, S);
        ctx.restore();
        return { icon: true };
      }
    }
    const vista = o.view === 'front' ? 'frente' : o.view === 'back' ? 'espalda' : 'lado';
    const A = CreatureAnim.state(e), dt = o.dt || 1 / 60;
    A.nextBlink = 99;                                      // el parpadeo ya viene dibujado
    const [accion, k] = this.pick(e, o);
    const im = this.strip(o.sp, accion, vista, o.shiny) || this.strip(o.sp, 'reposo', vista, o.shiny);
    if (!im) { this.base(o.sp, accion, vista); return null; }   // todavía cargando: se dibuja el sprite clásico
    // lo que en el sprite clásico avanzaba la pose
    if (A.atk) { A.atk.t += dt; if (A.atk.t >= A.atk.dur) A.atk = null; }
    if (A.hurtT > 0) A.hurtT -= dt;
    // transparencia, estela y temblor (como en CreatureAnim.pose)
    let alpha = 1, trail = !!o.dash, shake = 0;
    if (o.dodge) { alpha *= 0.75; trail = true; }
    const kk = (A.atk && A.atk.kind) || (o.act && !o.act.fired && o.act.m && o.act.m.kind);
    if (kk === 'blink') alpha *= A.atk ? 0.3 + 0.7 * (A.atk.t / A.atk.dur) : 1 - 0.7 * U.clamp(o.act.t / Math.max(0.05, o.act.windup), 0, 1);
    if (A.hurtT > 0.2) shake = 1;
    if (o.faintT !== undefined) alpha = Math.max(0, 1 - Math.max(0, o.faintT - 0.9) * 2);   // termina de caer y se desvanece
    // fuera de los menús, cada etapa de evolución se ve más grande que la anterior
    let sc = (o.scale || 1) * (o.S || 40) / 80 * (o.portrait ? 1 : this.stageScale(o.sp));
    // en combate, cada píxel del dibujo ocupa exactamente un píxel del lienzo: nada se pierde ni se estira
    // (achicar a la mitad o a 0,65 borraba detalle y lo hacía ver borroso)
    const enCombate = 'dodge' in o && !o.portrait;
    if (enCombate) { const t = ctx.getTransform().a || 1; sc = Math.max(1, Math.round(sc * t)) / t; }
    const Wd = size * sc;
    let x0 = Math.round(o.px - Wd / 2), y0 = Math.round(o.py - (feet + 1) * sc);
    if (shake) { x0 += Math.round((Math.random() - 0.5) * 2); y0 += Math.round((Math.random() - 0.5)); }
    const flip = vista === 'lado' && o.flip;
    // el cuadro actual se copia a un lienzo chico: el contorno y el destello se tiñen solo sobre ese cuadro
    const fb = e.frameBufF && e.frameBufF.width === size ? e.frameBufF : (e.frameBufF = U.makeCanvas(size, size)[0]);
    const fbx = fb.getContext('2d'); fbx.globalCompositeOperation = 'source-over'; fbx.clearRect(0, 0, size, size); fbx.drawImage(im, k * size, 0, size, size, 0, 0, size, size);
    const blit = (img, x, y) => {
      ctx.save();
      if (flip) { ctx.translate(x + Wd, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, size, size, 0, 0, Wd, Wd); }
      else ctx.drawImage(img, 0, 0, size, size, x, y, Wd, Wd);
      ctx.restore();
    };
    const tinted = (color, slot) => {
      const b = e[slot] && e[slot].width === size ? e[slot] : (e[slot] = U.makeCanvas(size, size)[0]);
      const bx = b.getContext('2d'); bx.globalCompositeOperation = 'source-over'; bx.clearRect(0, 0, size, size); bx.drawImage(fb, 0, 0);
      bx.globalCompositeOperation = 'source-in'; bx.fillStyle = color; bx.fillRect(0, 0, size, size); bx.globalCompositeOperation = 'source-over';
      return b;
    };
    const a0 = ctx.globalAlpha;
    if (trail) { A.trail.push({ x: x0, y: y0, a: 0.4 }); if (A.trail.length > 4) A.trail.shift(); }
    else if (A.trail.length) A.trail.length = 0;
    for (const tr of A.trail) { ctx.globalAlpha = a0 * tr.a * alpha; blit(fb, tr.x, tr.y); tr.a *= 0.7; }
    ctx.globalAlpha = a0 * alpha;
    if (o.outline && enCombate) {                          // aliado / rival: una marca de color bajo los pies
      ctx.save(); ctx.globalAlpha = a0 * 0.5;
      const rw = Math.round(size * sc * 0.28), cx = Math.round(o.px), cy = Math.round(o.py);
      ctx.fillStyle = o.outline; ctx.globalAlpha = a0 * 0.35;
      for (let i = -rw; i <= rw; i++) { const h = Math.max(1, Math.round(Math.sqrt(1 - (i / rw) * (i / rw)) * 4)); ctx.fillRect(cx + i, cy - h, 1, h * 2); }
      ctx.restore(); ctx.globalAlpha = a0 * alpha;
    } else if (o.outline) {                                // contorno de color (fuera del combate)
      const ob = tinted(o.outline, 'outBufF'), w = o.outlineW || 1, a1 = ctx.globalAlpha;
      ctx.globalAlpha = a1 * (o.outlineA || 0.9);
      for (const [dx, dy] of [[-w, 0], [w, 0], [0, -w], [0, w]]) blit(ob, x0 + dx, y0 + dy);
      ctx.globalAlpha = a1;
    }
    blit(fb, x0, y0);
    if (o.flash) blit(tinted(o.flashColor || '#ffffff', 'flashBufF'), x0, y0);   // destello al recibir daño
    ctx.globalAlpha = a0;
    return { alpha, accion, k };
  },
  // etapa de evolución (1, 2 o 3) a partir de SPECIES_LIST: segunda etapa algo más grande y la final bastante más
  stageScale(sp) {
    if (!this.stage) {
      const pre = {};
      for (const s of SPECIES_LIST) {
        const ev = s.evo; if (!ev) continue;
        for (const to of ev.to ? [ev.to] : ev.branch ? [ev.branch.a, ev.branch.b] : []) pre[to] = s.key;
      }
      this.stage = {};
      for (const s of SPECIES_LIST) { let n = 1, k = s.key; while (pre[k]) { n++; k = pre[k]; } this.stage[s.key] = n; }
    }
    const n = this.stage[sp] || 1, sz = (this.DATA[sp] || [80])[0], leg = SPECIES[sp] && SPECIES[sp].legendary;
    if (leg) return 1;                                     // las legendarias ya tienen su propio tamaño de combate
    return n >= 3 || (n === 1 && sz >= 96) ? 1.3 : n === 2 ? 1.12 : 1;
  },
  // imagen fija (cuadro base de reposo, de lado) encajada en un cuadro de S×S, para menús e íconos
  still(sp, S, shiny) {
    const key = sp + ':' + S + (shiny ? ':s' : '');
    this.stills = this.stills || {};
    if (this.stills[key]) return this.stills[key];
    if (S <= 32) {
      const ic = shiny ? this.iconShiny(sp) : this.icon(sp);
      if (!ic) return null;
      const [c, x] = U.makeCanvas(S, S); x.imageSmoothingEnabled = S < 32; if (S < 32) x.imageSmoothingQuality = 'high';
      x.drawImage(ic, 0, 0, S, S);
      return (this.stills[key] = c);
    }
    const im = this.strip(sp, 'reposo', 'lado', shiny);
    if (!im) return null;
    const size = this.DATA[sp][0], [f0, fx] = U.makeCanvas(size, size);
    fx.drawImage(im, 0, 0, size, size, 0, 0, size, size);
    const d = fx.getImageData(0, 0, size, size).data;
    let x0 = size, y0 = size, x1 = -1, y1 = -1;
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) if (d[(j * size + i) * 4 + 3]) { x0 = Math.min(x0, i); y0 = Math.min(y0, j); x1 = Math.max(x1, i); y1 = Math.max(y1, j); }
    if (x1 < 0) return null;
    let src = f0, bw = x1 - x0 + 1, bh = y1 - y0 + 1, sx = x0, sy = y0;
    // para achicar mucho (íconos), primero se reduce a escala entera eligiendo el color que más se repite
    // en cada bloque: así se conservan el contorno y los colores, sin manchas grises
    const k = Math.floor(Math.max(bw, bh) / (S * 0.92));
    if (k >= 2) { src = this.shrink(f0, x0, y0, bw, bh, k); bw = src.width; bh = src.height; sx = sy = 0; }
    const m = Math.max(bw, bh), f = m > S * 0.92 ? (S * 0.92) / m : Math.max(1, Math.floor((S * 0.92) / m));
    const dw = Math.max(1, Math.round(bw * f)), dh = Math.max(1, Math.round(bh * f));
    const [c, x] = U.makeCanvas(S, S);
    x.imageSmoothingEnabled = f < 1; if (f < 1) x.imageSmoothingQuality = 'high';
    x.drawImage(src, sx, sy, bw, bh, Math.floor((S - dw) / 2), S < 20 ? S - dh : Math.floor((S - dh) * 0.75), dw, dh);
    return (this.stills[key] = c);
  },
  shrink(img, x0, y0, w, h, k) {
    const W = Math.ceil(w / k), H = Math.ceil(h / k), [c, x] = U.makeCanvas(W, H);
    const [t, tx] = U.makeCanvas(w, h); tx.drawImage(img, x0, y0, w, h, 0, 0, w, h);
    const d = tx.getImageData(0, 0, w, h).data, out = x.createImageData(W, H), o = out.data;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const cnt = new Map(); let opaque = 0, n = 0;
      for (let b = 0; b < k; b++) for (let a = 0; a < k; a++) {
        const px = i * k + a, py = j * k + b; if (px >= w || py >= h) continue; n++;
        const q = (py * w + px) * 4; if (d[q + 3] < 128) continue; opaque++;
        const key = (d[q] << 16) | (d[q + 1] << 8) | d[q + 2]; cnt.set(key, (cnt.get(key) || 0) + 1);
      }
      if (opaque * 2 < n) continue;
      let best = 0, bc = -1, bl = 1e9;
      for (const [key, v] of cnt) { const l = (key >> 16) + ((key >> 8) & 255) + (key & 255); if (v > bc || (v === bc && l < bl)) { best = key; bc = v; bl = l; } }
      const q = (j * W + i) * 4; o[q] = best >> 16; o[q + 1] = (best >> 8) & 255; o[q + 2] = best & 255; o[q + 3] = 255;
    }
    x.putImageData(out, 0, 0);
    return c;
  },
};
{
  const _draw = CreatureAnim.draw;
  CreatureAnim.draw = function (ctx, e, o) {
    if (FrameSprites.has(o.sp)) { const r = FrameSprites.draw(ctx, e, o); if (r) return r; }
    return _draw.call(this, ctx, e, o);
  };
  // los retratos de menú no se agrandan por etapa (tienen que caber en su recuadro)
  const _portrait = CreatureAnim.portrait;
  CreatureAnim.portrait = function (ctx, sp, S, shiny, x, y, key, o = {}) { return _portrait.call(this, ctx, sp, S, shiny, x, y, key, Object.assign({ portrait: true }, o)); };
  const _get = CreatureGfx.get;
  CreatureGfx.get = function (sp, S, shiny) {
    if (FrameSprites.has(sp)) { const c = FrameSprites.still(sp, S, shiny); if (c) return c; }
    return _get.call(this, sp, S, shiny);
  };
  // el destello guardado se arma con la imagen fija: si se pidió antes de cargar, se rehace
  const _flash = CreatureGfx.flash;
  CreatureGfx.flash = function (sp, S, color = '#ffffff') {
    if (!FrameSprites.has(sp)) return _flash.call(this, sp, S, color);
    const src = FrameSprites.still(sp, S);
    if (!src) return _flash.call(this, sp, S, color);
    const key = sp + ':' + S + ':ff' + color;
    if (!this.cache[key]) {
      const [c, x] = U.makeCanvas(S, S);
      x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, S, S);
      this.cache[key] = c;
    }
    return this.cache[key];
  };
}
