'use strict';
// ============================================================
//  ANIMACIÓN DE ÁNIMAS
//  Cada ánima se compone de partes (patas, cuerpo, cabeza, ojos,
//  cola, alas) que se mueven por separado:
//  - reposo: respiración, cabeceo, cola que se mece, parpadeo
//  - caminar: rebote y patas alternas; voladores: aleteo y flotar
//  - ataques: cada tipo de ataque tiene su propio movimiento
//  - reacciones: retroceso al recibir golpes, aturdimiento,
//    esquiva con estela y caída al debilitarse
//  En el espacio local el ánima mira a la IZQUIERDA (adelante = -x).
// ============================================================
const CreatureAnim = {
  cache: {},
  rig(spKey, S, shiny) {
    const key = spKey + ':' + S + (shiny ? ':s' : '');
    if (this.cache[key]) return this.cache[key];
    let sp = SPECIES[spKey];
    if (shiny) {
      const L0 = sp.look, sh = (c) => (c ? U.shade(c, 0.04, 0.42, 0.05) : c);
      sp = Object.assign({}, sp, { look: Object.assign({}, L0, { c1: sh(L0.c1), c3: sh(L0.c3) }) });
    }
    const rig = CreatureGfx.render(sp, S, true);
    // separa las patas en dos grupos (delanteras / traseras) para alternarlas
    if (rig.parts.legs) {
      const src = rig.parts.legs, [a, ax] = U.makeCanvas(S, S), [b, bx] = U.makeCanvas(S, S);
      const half = Math.round(S / 2);
      ax.drawImage(src, 0, 0, half, S, 0, 0, half, S); bx.drawImage(src, half, 0, S - half, S, half, 0, S - half, S);
      rig.parts.legsA = a; rig.parts.legsB = b;
    }
    this.cache[key] = rig;
    return rig;
  },
  // estado de animación guardado en cada entidad
  state(e) { return e.anim || (e.anim = { blinkT: 0, nextBlink: 1 + Math.random() * 3, hurtT: 0, hurtSign: 1, hurtPow: 1, atk: null, trail: [], lastX: e.x, lastY: e.y }); },
  hurt(e, fromX, pow = 1) {
    const A = this.state(e);
    A.hurtT = 0.38; A.hurtPow = Math.min(1.8, pow); A.hurtWorld = Math.sign((e.x || 0) - fromX) || 1;
  },
  attack(e, m) {
    const A = this.state(e);
    A.atk = { kind: m.kind, t: 0, dur: m.kind === 'ring' || m.kind === 'area' ? 0.42 : m.kind === 'buff' || m.kind === 'heal' ? 0.55 : 0.32 };
  },
  // ---------- cálculo de la pose ----------
  pose(e, o) {
    const A = this.state(e), t = o.t, dt = o.dt || 1 / 60;
    const P = { rx: 0, ry: 0, rot: 0, sx: 1, sy: 1, hx: 0, hy: 0, hrot: 0, trot: 0, flap: 1, legA: 0, legB: 0, eyes: 'open', alpha: 1, hover: 0, shake: 0 };
    const flyer = o.rig.flyer;
    // reposo
    const br = Math.sin(t * 2.6 + (e.animSeed || 0));
    P.sy = 1 + br * 0.035; P.sx = 1 - br * 0.02;
    P.hy = Math.sin(t * 2.6 - 0.7 + (e.animSeed || 0)) * 0.7;
    P.trot = Math.sin(t * 2.2 + (e.animSeed || 0)) * 0.16;
    if (flyer) { P.hover = -4 + Math.sin(t * 4) * 2; P.flap = 0.6 + 0.4 * Math.cos(t * 14); }
    else P.flap = 1 + Math.sin(t * 3) * 0.06;
    // parpadeo
    A.nextBlink -= dt;
    if (A.nextBlink <= 0) { A.blinkT = 0.13; A.nextBlink = 2 + Math.random() * 3.5; }
    if (A.blinkT > 0) { A.blinkT -= dt; P.eyes = 'closed'; }
    // caminar / correr
    const sp = o.speed || 0;
    if (sp > 12) {
      const ph = t * (8 + sp / 12);
      if (!flyer) { P.ry = -Math.abs(Math.sin(ph)) * 2.2; P.legA = Math.sin(ph) > 0 ? -1 : 0; P.legB = Math.sin(ph) > 0 ? 0 : -1; P.rot = Math.sin(ph) * 0.05; }
      else { P.flap = 0.45 + 0.55 * Math.cos(t * 22); P.rot = -0.08; }
      P.trot = Math.sin(ph * 0.5) * 0.3;
    }
    // preparación de un ataque (la fase de carga)
    const act = o.act;
    if (act && !act.fired) {
      const p = U.clamp(act.t / Math.max(0.05, act.windup), 0, 1), k = act.m.kind;
      if (act.mk === 'arte') { P.sy *= 1 - 0.18 * p; P.sx *= 1 + 0.14 * p; P.shake = 1.2 * p; P.hrot = 0.2 * p; }
      else if (k === 'melee' || k === 'stealth') { P.rx += 3 * p; P.rot += 0.16 * p; P.hrot += 0.12 * p; P.sx *= 1 + 0.06 * p; P.sy *= 1 - 0.06 * p; }
      else if (k === 'dash') { P.sy *= 1 - 0.16 * p; P.sx *= 1 + 0.12 * p; P.rx += 2.5 * p; P.shake = 0.6 * p; P.rot -= 0.08 * p; }
      else if (k === 'proj' || k === 'beam') { P.ry -= 1.5 * p; P.hrot += 0.22 * p; P.hx += 1 * p; P.sy *= 1 + 0.05 * p; if (k === 'beam') P.shake = 0.5 * p; }
      else if (k === 'ring' || k === 'area') { P.ry -= 8 * Math.sin(p * Math.PI / 2); P.sy *= 1 + 0.08 * p; P.sx *= 1 - 0.05 * p; P.legA = P.legB = -1; }
      else if (k === 'buff' || k === 'heal') { P.ry -= 2 * p; P.rot += Math.sin(t * 28) * 0.1 * p; P.hrot -= 0.15 * p; }
      else if (k === 'blink') { P.alpha = 1 - 0.7 * p; P.sy *= 1 + 0.2 * p; P.sx *= 1 - 0.3 * p; }
      if (flyer) P.flap = 0.4 + 0.6 * Math.cos(t * 26);
    }
    // golpe ya lanzado
    if (A.atk) {
      A.atk.t += dt;
      const q = A.atk.t / A.atk.dur, e1 = 1 - q, k = A.atk.kind;
      if (q >= 1) A.atk = null;
      else if (k === 'melee' || k === 'stealth') { const lunge = Math.sin(Math.min(1, q * 2.4) * Math.PI / 2) * e1; P.rx -= 7 * lunge; P.rot -= 0.22 * lunge; P.hrot -= 0.18 * lunge; P.hx -= 1.5 * lunge; P.sx *= 1 + 0.12 * lunge; P.sy *= 1 - 0.08 * lunge; }
      else if (k === 'proj' || k === 'beam') { P.rx += 3 * e1; P.hrot -= 0.25 * e1; P.hx -= 1.5 * e1; P.sy *= 1 - 0.08 * e1; P.sx *= 1 + 0.06 * e1; }
      else if (k === 'ring' || k === 'area') { P.sy *= 0.72 + 0.28 * q; P.sx *= 1.28 - 0.28 * q; P.shake = 1.5 * e1; P.legA = P.legB = 0; }
      else if (k === 'buff' || k === 'heal') { P.ry -= 5 * Math.abs(Math.sin(q * Math.PI * 2)) * e1; P.sx *= 1 + 0.1 * Math.sin(q * Math.PI * 2) * e1; P.sy *= 1 - 0.1 * Math.sin(q * Math.PI * 2) * e1; P.hrot -= 0.2 * e1; }
      else if (k === 'blink') { P.alpha = 0.3 + 0.7 * q; P.sy *= 1.2 - 0.2 * q; P.sx *= 0.7 + 0.3 * q; }
    }
    // embestida en curso
    if (o.dash) { P.sx *= 1.2; P.sy *= 0.86; P.rot -= 0.18; P.rx -= 1; P.trail = true; P.legA = -1; P.legB = 0; }
    // esquiva
    if (o.dodge) { P.sx *= 1.18; P.sy *= 0.84; P.rot -= 0.12; P.alpha *= 0.75; P.trail = true; }
    // recibir daño: retroceso, encogerse, ojos apretados
    if (A.hurtT > 0) {
      A.hurtT -= dt;
      const q = Math.max(0, A.hurtT / 0.38) * A.hurtPow, away = o.flip ? -A.hurtWorld : A.hurtWorld;
      P.rx += away * 5 * q; P.rot += away * 0.28 * q; P.hrot += away * 0.2 * q;
      P.sx *= 1 + 0.12 * q; P.sy *= 1 - 0.14 * q; P.eyes = 'hurt';
      if (q > 0.55) P.shake = Math.max(P.shake, 1.2);
    }
    // aturdido: tambaleo
    if (o.stun) { P.rot += Math.sin(t * 9) * 0.16; P.hrot += Math.sin(t * 9 + 1) * 0.12; P.eyes = 'closed'; }
    // cargando un ataque del jugador
    if (o.charging) { P.sy *= 0.93; P.sx *= 1.05; P.shake = Math.max(P.shake, 0.7); }
    // debilitado: se desploma de lado y se desvanece
    if (o.faintT !== undefined) {
      const ft = o.faintT;
      P.rot = Math.min(1, ft * 2.6) * 1.5; P.ry = Math.max(0, ft - 0.25) * 10; P.alpha = Math.max(0, 1 - Math.max(0, ft - 0.2) * 1.8);
      P.eyes = 'hurt'; P.flap = 0.2; P.hover = flyer ? P.hover * (1 - Math.min(1, ft * 2)) : 0;
    }
    if (P.shake) { P.rx += (Math.random() - 0.5) * P.shake * 2; P.ry += (Math.random() - 0.5) * P.shake; }
    return P;
  },
  // ---------- composición ----------
  // devuelve un lienzo de 2S x 2S; los pies quedan en (S, 1.5S)
  compose(e, o) {
    const rig = o.rig, S = o.S, B = S * 2, parts = rig.parts, piv = rig.piv;
    const buf = e.animBuf && e.animBuf.width === B ? e.animBuf : (e.animBuf = U.makeCanvas(B, B)[0]);
    const x = buf.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, B, B); x.imageSmoothingEnabled = false;
    const P = o.P, ox = S / 2, oy = S / 2; // esquina del sprite S x S dentro del lienzo
    const fx = ox + piv.feet[0], fy = oy + piv.feet[1];
    // transformación raíz: alrededor de los pies
    x.translate(Math.round(fx + P.rx), Math.round(fy + P.ry + P.hover));
    x.rotate(P.rot); x.scale(P.sx, P.sy);
    x.translate(-piv.feet[0], -piv.feet[1]);
    const at = (img, dx = 0, dy = 0) => { if (img) x.drawImage(img, Math.round(dx), Math.round(dy)); };
    const around = (img, p, ang, sx = 1, sy = 1, dx = 0, dy = 0) => {
      if (!img) return;
      x.save(); x.translate(p[0] + dx, p[1] + dy); x.rotate(ang); x.scale(sx, sy); x.translate(-p[0], -p[1]); x.drawImage(img, 0, 0); x.restore();
    };
    at(parts.halo);
    around(parts.wings, piv.wing, (1 - P.flap) * -0.25, 1, P.flap);
    around(parts.tail, piv.tail, P.trot);
    around(parts.headBack, piv.head, P.hrot, 1, 1, P.hx, P.hy);
    at(parts.legsA, 0, P.legA); at(parts.legsB, 0, P.legB);
    if (!parts.legsA) at(parts.legs);
    at(parts.body);
    around(parts.wingsF, piv.wing, (1 - P.flap) * -0.3, 1, P.flap);
    around(parts.head, piv.head, P.hrot, 1, 1, P.hx, P.hy);
    const eyes = P.eyes === 'closed' ? parts.eyesClosed : P.eyes === 'hurt' ? parts.eyesHurt : parts.eyes;
    around(eyes, piv.head, P.hrot, 1, 1, P.hx, P.hy);
    x.setTransform(1, 0, 0, 1, 0, 0);
    return buf;
  },
  // dibuja un ánima animada con los pies en (px, py)
  draw(ctx, e, o) {
    const S = o.S, rig = this.rig(o.sp, S, o.shiny);
    o.rig = rig;
    const P = this.pose(e, o);
    o.P = P;
    const buf = this.compose(e, o);
    const sc = o.scale || 1, W2 = S * 2 * sc;
    const dx = Math.round(o.px - S * sc), dy = Math.round(o.py - S * 1.5 * sc);
    const A = this.state(e);
    // estela (embestidas y esquivas)
    if (P.trail) { A.trail.push({ x: dx, y: dy, a: 0.4 }); if (A.trail.length > 4) A.trail.shift(); }
    else if (A.trail.length) A.trail.length = 0;
    const blit = (img, x0, y0) => {
      ctx.save();
      if (o.flip) { ctx.translate(x0 + W2, y0); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, S * 2, S * 2, 0, 0, W2, W2); }
      else ctx.drawImage(img, 0, 0, S * 2, S * 2, x0, y0, W2, W2);
      ctx.restore();
    };
    const a0 = ctx.globalAlpha;
    for (const tr of A.trail) { ctx.globalAlpha = a0 * tr.a * P.alpha; blit(buf, tr.x, tr.y); tr.a *= 0.7; }
    ctx.globalAlpha = a0 * P.alpha;
    blit(buf, dx, dy);
    // destello blanco al recibir daño
    if (o.flash) {
      const fb = e.flashBuf && e.flashBuf.width === buf.width ? e.flashBuf : (e.flashBuf = U.makeCanvas(buf.width, buf.height)[0]);
      const fx = fb.getContext('2d'); fx.clearRect(0, 0, fb.width, fb.height); fx.globalCompositeOperation = 'source-over'; fx.drawImage(buf, 0, 0);
      fx.globalCompositeOperation = 'source-in'; fx.fillStyle = o.flashColor || '#ffffff'; fx.fillRect(0, 0, fb.width, fb.height); fx.globalCompositeOperation = 'source-over';
      blit(fb, dx, dy);
    }
    ctx.globalAlpha = a0;
    return P;
  },
};

// ganchos del combate: cada golpe lanzado y cada daño recibido se anima
{
  const _exec = BattleScene.prototype.execMove;
  BattleScene.prototype.execMove = function (f, a) { CreatureAnim.attack(f, a.m); return _exec.call(this, f, a); };
  const _hit = BattleScene.prototype.hit;
  BattleScene.prototype.hit = function (tgt, att, m, mult, ang) {
    const h0 = tgt.hp;
    const r = _hit.call(this, tgt, att, m, mult, ang);
    const d = h0 - tgt.hp;
    if (d > 0) CreatureAnim.hurt(tgt, att ? att.x : tgt.x - Math.cos(ang || 0), 0.7 + Math.min(1.1, (d / tgt.maxHp) * 6));
    return r;
  };
}

// retratos animados para menús y escenas (x, y = esquina superior izquierda, como drawImage)
CreatureAnim.holders = {};
CreatureAnim.portrait = function (ctx, sp, S, shiny, x, y, key, o = {}) {
  const k = key || sp + ':' + S;
  const e = this.holders[k] || (this.holders[k] = { x: 0, y: 0, animSeed: Math.random() * 6 });
  return this.draw(ctx, e, Object.assign({ sp, S, shiny, px: Math.round(x + S / 2), py: Math.round(y + S), flip: !!o.flip, t: Engine.time, dt: 1 / 60, speed: o.speed || 0, flash: o.flash, flashColor: o.flashColor }, o));
};
