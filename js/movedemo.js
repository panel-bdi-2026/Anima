'use strict';
// ============================================================
//  Demostración de un ataque con el combate real
//  Arma un combate de mentira (sin mapa, sin sonido, sin tocar la
//  partida) con tu ánima y un blanco de práctica, y repite el ataque
//  en bucle: los mismos proyectiles, rayos, cortes, partículas y
//  números de daño que se ven al pelear.
//  Se usa en la Constelación (recuadro y vista en grande).
// ============================================================
class MoveDemo {
  constructor(c, mk) {
    this.mk = mk; this.m = MOVES[mk]; this.t = 0; this.loop = 2.4; this.ok = true;
    // copias: el ánima real no gana estilo ni cambia nada
    const clone = (x) => JSON.parse(JSON.stringify(x));
    this.me = Object.assign(clone(c), { moves: [mk], held: null, hp: 9999 });
    this.target = { uid: -1, sp: c.sp === 'rabin' ? 'pipio' : 'rabin', nick: null, lv: c.lv, exp: 0, ivs: { hp: 15, atk: 0, def: 8, esp: 8, vel: 0 }, moves: [], style: { imp: 0, tem: 0 }, bond: 70, hp: 9999, talents: {} };
    try { this.reset(); } catch (e) { console.error(e); this.ok = false; }
  }
  // distancia al blanco según la forma del ataque, para que siempre se vea el golpe
  gap() {
    const m = this.m, k = m.kind;
    if (k === 'melee' || k === 'stealth') return (m.range || 20) + 6;
    if (k === 'dash') return Math.min((m.range || 60) * 0.7, 70);
    if (k === 'ring') return Math.max(16, (m.radius || 40) * 0.6);
    if (k === 'beam') return Math.min((m.len || 120) * 0.55, 80);
    if (k === 'buff' && m.debuff) return Math.min(60, (m.radius || 80) * 0.6);
    return 76;
  }
  reset() {
    const D = Object.create(BattleScene.prototype);
    const cx = 160, cy = 120, g = this.gap();
    Object.assign(D, {
      opts: {}, projs: [], fx: [], parts: [], nums: [], areas: [], banners: [], waiters: [], t: 0, state: 'fight', demo: true,
      hitStop: 0, slowT: 0, timeScale: 1, obstacles: [], participants: new Set(), pendingLv: new Map(), leveled: new Set(),
      field: { center: [cx, cy], R: 999, allyStart: [cx - g / 2, cy], foeStart: [cx + g / 2, cy] },
    });
    // sin mapa: nada choca y no hay hierba
    D.tile = () => ({}); D.solidAt = () => false; D.blocksShotAt = () => false; D.inGrass = () => false; D.drawArena = () => {};
    D.ally = D.mkFighter(this.me, 'ally'); D.foe = D.mkFighter(this.target, 'foe');
    for (const f of [D.ally, D.foe]) { f.invuln = 0; f.spawnT = 0; }
    D.foe.maxHp = D.foe.hp = 9999;
    this.D = D; this.fired = false; this.t = 0;
  }
  // un paso del combate, en silencio (sin sonidos ni sacudir la pantalla)
  step(dt) {
    if (!this.ok) return;
    const sfx = Sound.sfx, shake = Shake.start;
    Sound.sfx = () => {}; Shake.start = () => {};
    try {
      const D = this.D;
      this.t += dt; D.t += dt;
      if (!this.fired && this.t > 0.35) { this.fired = true; D.ally.cds[0] = 0; D.startMove(D.ally, 0); }
      for (const f of [D.ally, D.foe]) { D.tickFighter(f, dt); D.physics(f, dt, !f.dash && !f.act); }
      // el blanco vuelve despacio a su sitio
      const [hx, hy] = D.field.foeStart; D.foe.x += (hx - D.foe.x) * Math.min(1, dt * 3); D.foe.y += (hy - D.foe.y) * Math.min(1, dt * 3);
      D.updateProjs(dt); D.updateAreas(dt); D.updateVisuals(dt);
      if (this.t > this.loop) this.reset();
    } catch (e) { console.error(e); this.ok = false; } finally { Sound.sfx = sfx; Shake.start = shake; }
  }
  // dibuja la zona del combate (centrada en los dos) dentro de un recuadro, a escala «s»
  draw(ctx, x, y, w, h, s = 1) {
    if (!this.ok) return false;
    const vw = Math.ceil(w / s), vh = Math.ceil(h / s);
    if (!this.buf || this.buf.width !== vw || this.buf.height !== vh) [this.buf, this.bx] = U.makeCanvas(vw, vh);
    const b = this.bx, D = this.D, cx = Math.round(D.field.center[0] - vw / 2), cy = Math.round(D.field.center[1] - 4 - vh / 2);
    // suelo de pasto
    for (let ty = Math.floor(cy / 16); ty * 16 < cy + vh; ty++) for (let tx = Math.floor(cx / 16); tx * 16 < cx + vw; tx++) b.drawImage(Tiles.get('grass', 0, Math.floor(hash2(tx, ty) * 3)), tx * 16 - cx, ty * 16 - cy);
    try {
      // suelo (anillos, zonas), ánimas ordenadas por profundidad y luego lo que va por el aire
      if (D.drawGroundLayer) D.drawGroundLayer(b, cx, cy);
      b.save(); b.translate(-cx, -cy);
      const items = D.depthItems ? D.depthItems() : [D.ally, D.foe].map((f) => ({ y: f.y, draw: (x) => D.drawFighter(x, f) }));
      for (const it of items.sort((p, q) => p.y - q.y)) it.draw(b);
      b.restore();
      D.drawWorldLayer(b, cx, cy);
      b.save(); b.translate(-cx, -cy);
      for (const n of D.nums) { b.globalAlpha = n.t > 0.6 ? (0.9 - n.t) / 0.3 : 1; Font.drawOutlined(b, n.text, Math.round(n.x - Font.width(n.text) / 2), Math.round(n.y), n.color, '#1a1420'); }
      b.globalAlpha = 1; b.restore();
    } catch (e) { console.error(e); this.ok = false; return false; }
    ctx.drawImage(this.buf, 0, 0, vw, vh, x, y, vw * s, vh * s);
    return true;
  }
}

// vista en grande: toda la pantalla, con el nombre y la explicación del ataque
class MoveDemoScreen {
  constructor(c, mk) { this.demo = new MoveDemo(c, mk); this.m = MOVES[mk]; this.wide = true; this.opaque = true; }
  update(dt) {
    this.demo.step(dt);
    const M = Input.mouse;
    if (Input.pressed('a') || Input.pressed('b') || Input.pressed('start') || M.pressed[0] || M.pressed[2]) { if (M.pressed[0]) M.pressed[0] = false; Sound.sfx('cancel'); this.done(); }
  }
  draw(ctx) {
    P(ctx, 0, 0, W, H, '#0a0818');
    if (!this.demo.draw(ctx, 0, 24, W, 168, 3)) Font.drawCenter(ctx, 'No se pudo mostrar la demostración.', W / 2, 100, '#c8c0d8');
    const m = this.m, col = TYPES[m.type].color;
    P(ctx, 0, 0, W, 22, '#14101e'); P(ctx, 0, 22, W, 1, col);
    Font.draw(ctx, m.name, 10, 7, '#ffffff');
    UI.typeBadge(ctx, m.type, 14 + Font.width(m.name), 6);
    Font.drawRight(ctx, `${KIND_LABEL[m.kind]} · Pot ${m.pow || '-'} · Rec ${m.cd}s`, W - 10, 7, '#c8c0d8');
    P(ctx, 0, 192, W, 48, '#14101e'); P(ctx, 0, 192, W, 1, col);
    Font.wrap(m.desc || '', W - 20).slice(0, 2).forEach((ln, k) => Font.draw(ctx, ln, 10, 199 + k * 12, '#e8e0f0'));
    Font.draw(ctx, 'Toca o pulsa X para volver', 10, 226, '#8a8098');
  }
}
