'use strict';
// ============================================================
//  FAUNA Y CAPTURA AVANZADA
//  - Sigilo (C): caminas agachado; te detectan mucho menos
//  - Lanzar en el mapa (E): esferas y cebos sin entrar en combate.
//    Si la criatura no te ha visto, puedes capturarla por sorpresa.
//  - Nuevas esferas con física propia: Pesada, Rápida, Nocturna, Red
//  - Comportamientos: manadas, emboscadores nocturnos, especies de lluvia
//  - Ánimas alfa: más grandes, más fuertes y con botín
// ============================================================

Object.assign(ITEMS, {
  esfera_pesada: { name: 'Esfera Pesada', price: 500, desc: 'Muy eficaz con ánimas grandes o de tipo Roca. Vuela corto y cae a plomo.', sphere: 'pesada', ball: 1, battle: true },
  esfera_rapida: { name: 'Esfera Rápida', price: 700, desc: 'Vuela muy deprisa. Mucho mejor al principio del combate o por sorpresa.', sphere: 'rapida', ball: 1, battle: true },
  esfera_nocturna: { name: 'Esfera Nocturna', price: 600, desc: 'Funciona de maravilla de noche y en cuevas.', sphere: 'nocturna', ball: 1, battle: true },
  esfera_red: { name: 'Esfera Red', price: 600, desc: 'Atrapa mejor a las ánimas de tipo Agua y Bicho.', sphere: 'red', ball: 1, battle: true },
  baya_dulce: { name: 'Baya Dulce', price: 60, desc: 'Cebo. Lánzala en el mapa (E) para atraer ánimas salvajes. También sirve para fabricar.', icon: 'berry', color: '#f070a0', bait: true, target: 'field' },
  mineral: { name: 'Mineral', price: 0, sell: 40, desc: 'Fragmento de roca útil para fabricar objetos en el Taller.', icon: 'core', color: '#b0a890' },
  hongo_seco: { name: 'Hongo Seco', price: 0, sell: 40, desc: 'Seta seca y aromática. Ingrediente del Taller.', icon: 'berry', color: '#c09060' },
});
// física de vuelo de cada esfera (en el mapa y en modo captura)
const SPHERE_PHYS = {
  esfera_pesada: { dur: 1.3, h: 0.55, range: 150 },
  esfera_rapida: { dur: 0.55, h: 0.7, range: 250 },
};
const SPHERE_ORDER = ['esfera', 'superesfera', 'ultraesfera', 'esfera_rapida', 'esfera_pesada', 'esfera_nocturna', 'esfera_red', 'maestra'];
SHOPS.roca.splice(2, 0, 'esfera_pesada', 'esfera_nocturna');
SHOPS.marea.splice(3, 0, 'esfera_rapida', 'esfera_red', 'esfera_nocturna');
SHOPS.musgo.push('baya_dulce');

// bonificación propia de cada esfera: [multiplicador, nota]
function sphereBonus(kind, sp, ctx = {}) {
  const night = !Clock.isDay() || (World.map && World.map.cave);
  if (kind === 'esfera_pesada') { const big = sp.types.includes('roca') || (sp.look && sp.look.size >= 0.8); return big ? [2.5, '¡Pesada eficaz!'] : null; }
  if (kind === 'esfera_rapida') return ctx.early ? [3, '¡Rápida eficaz!'] : null;
  if (kind === 'esfera_nocturna') return night ? [2.5, '¡Nocturna eficaz!'] : null;
  if (kind === 'esfera_red') return sp.types.includes('agua') || sp.types.includes('bicho') ? [2.5, '¡Red eficaz!'] : null;
  return null;
}

// ---------- esferas en el combate (modo captura) ----------
Object.assign(BattleScene.prototype, {
  ballList() { return SPHERE_ORDER.filter((k) => G.bag[k] > 0); },
  sphereBonus(kind, foe) {
    const r = sphereBonus(kind, foe.sp, { early: this.t - (this.t0 || 0) < 10 || this.t < 10 });
    const out = r ? [r] : [];
    if (foe.c.alpha) out.push([0.6, 'Alfa: se resiste']);
    return out;
  },
});
const _trainerThrow = BattleScene.prototype.trainerThrow;
BattleScene.prototype.trainerThrow = function () {
  _trainerThrow.call(this);
  const b = this.ball, ph = b && SPHERE_PHYS[b.kind];
  if (!ph) return;
  let d = U.dist(b.sx, b.sy + 10, b.gx, b.gy);
  if (d > ph.range) { const k = ph.range / d; b.gx = b.sx + (b.gx - b.sx) * k; b.gy = b.sy + 10 + (b.gy - b.sy - 10) * k; d = ph.range; }
  b.dur = (0.32 + d / 330) * ph.dur; b.h = (18 + d * 0.14) * ph.h;
};

// ---------- utilidades de encuentros ----------
const Wild = {
  isHerd(sp) { return !sp.legendary && (sp.types.includes('normal') || sp.types.includes('bicho')) && sp.stage === 1; },
  isAmbusher(sp) { return sp.types.includes('sombra') || sp.types.includes('mente'); },
  // lista de encuentros posibles ahora mismo (hora y clima)
  pool(m) {
    const day = Clock.isDay(), wx = Weather.at(m), rain = Weather.isRain(wx);
    const out = [];
    for (const e of m.encounters.list) {
      if (e.time && (e.time === 'noche' ? day : !day)) continue;
      if (e.weather && !(e.weather === 'lluvia' ? rain : wx === e.weather)) continue;
      const t = SPECIES[e.sp].types;
      let w = e.w;
      if (rain) { if (t.includes('agua') || t.includes('electrico')) w *= 3; if (t.includes('fuego')) w *= 0.3; }
      out.push(Object.assign({}, e, { w }));
    }
    return out;
  },
  alphaChance() { return 0.06 * (typeof Events !== 'undefined' && Events.alphaMul ? Events.alphaMul() : 1); },
  // crea la criatura (con posibilidad de alfa)
  make(e, allowAlpha = true) {
    const sp = SPECIES[e.sp];
    if (allowAlpha && !sp.legendary && Math.random() < this.alphaChance()) {
      const c = newCreature(e.sp, Math.min(100, e.max + 6));
      c.alpha = true;
      return c;
    }
    return newCreature(e.sp, U.randi(e.min, e.max));
  },
  roll(m) {
    const pool = this.pool(m);
    if (!pool.length) return null;
    return this.make(U.weighted(pool));
  },
};

// alfa capturado: estadísticas un 10% mejores
{
  const _calc = calcStats;
  calcStats = function (c) {
    const s = _calc(c);
    if (!c.alpha) return s;
    const o = {};
    for (const k in s) o[k] = typeof s[k] === 'number' ? Math.floor(s[k] * 1.1) : s[k];
    return o;
  };
}

// ---------- sigilo y emboscadas en la hierba ----------
{
  const _update = World.update;
  World.update = function (dt) {
    this.sneaking = !!(G && Input.down('sneak') && !Input.down('run') && !this.busy && Scenes.top() === this);
    _update.call(this, dt);
    if (!this.busy && !this.player.moving && Scenes.top() === this && Input.pressed('ball') && G.party.length) FieldThrow.open();
  };
  const _startMove = World.startMove;
  World.startMove = function (e, dir, speed = 1) {
    if (e === this.player && this.sneaking && speed <= 1) speed = 0.55;
    return _startMove.call(this, e, dir, speed);
  };
  World.inGrass = function () { const t = this.tileAt(this.player.x, this.player.y); return !!(t && t.grass); };
}

// ---------- fauna visible: comportamientos ----------
Object.assign(Critters, {
  baits: [],
  reset(world) {
    this.list = []; this.spots = []; this.baits = []; this.timer = 4;
    const m = world.map;
    if (!m.outdoor || !m.encounters) return;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const t = world.tileAt(x, y); if (t && t.grass) this.spots.push([x, y]); }
    this.max = Math.min(6, Math.max(2, Math.floor(this.spots.length / 18)));
    for (let i = 0; i < this.max && this.list.length < this.max; i++) this.spawn(world, true);
  },
  spawn(world, initial) {
    if (!this.spots.length) return;
    const p = world.player;
    for (let k = 0; k < 12; k++) {
      const [x, y] = U.choice(this.spots);
      const d = Math.abs(x - p.x) + Math.abs(y - p.y);
      if (d < (initial ? 5 : 9)) continue;
      const pool = Wild.pool(world.map);
      if (!pool.length) return;
      const e = U.weighted(pool);
      const sp = SPECIES[e.sp];
      const night = !Clock.isDay();
      const n = Wild.isHerd(sp) ? Math.min(this.max + 2 - this.list.length, U.randi(2, 3)) : 1;
      const herd = n > 1 ? {} : null;
      for (let i = 0; i < Math.max(1, n); i++) {
        const c = Wild.make(e, i === 0);
        const ox = i ? U.rand(-18, 18) : 0, oy = i ? U.rand(-12, 12) : 0;
        if (i && !this.walkable(world, x * 16 + 8 + ox, y * 16 + 12 + oy)) continue;
        const aggressive = c.alpha || (sp.types.includes('sombra') || sp.types.includes('roca') || sp.types.includes('fuego') ? U.chance(0.75) : U.chance(0.4));
        this.list.push({ c, sp: e.sp, x: x * 16 + 8 + ox, y: y * 16 + 12 + oy, hx: x, hy: y, tx: x * 16 + 8 + ox, ty: y * 16 + 12 + oy, wait: U.rand(0, 2), hop: 0, dir: 1, state: 'wander', aggressive, alertT: 0, alpha: initial ? 1 : 0, herd, ambush: night && Wild.isAmbusher(sp) && !c.alpha });
      }
      return;
    }
  },
  // radio de detección según sigilo, hierba y cebos
  sense(c, world) {
    let r = c.aggressive ? 60 : 40;
    if (c.c.alpha) r = 80;
    if (world.sneaking) r *= world.inGrass() ? 0.3 : 0.5;
    if (c.state === 'eat') r *= 0.5;
    return r;
  },
  alertHerd(c, world, px, py) {
    if (!c.herd) return;
    for (const o of this.list) if (o !== c && o.herd === c.herd && (o.state === 'wander' || o.state === 'eat')) {
      if (o.aggressive) { o.state = 'alert'; o.alertT = 0.8; }
      else { o.state = 'flee'; const a = Math.atan2(o.y - py, o.x - px); o.tx = o.x + Math.cos(a) * 44; o.ty = o.y + Math.sin(a) * 44; }
    }
  },
  update(dt, world) {
    if (!world.map.encounters || !world.map.outdoor) return;
    const p = world.player, px = p.px + 8, py = p.py + 12;
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = U.rand(8, 15); if (this.list.length < this.max) this.spawn(world, false); }
    for (const b of this.baits) b.t -= dt;
    this.baits = this.baits.filter((b) => b.t > 0);
    const lead = Game.firstAlive();
    const aiming = Scenes.top() instanceof FieldThrow;
    for (const c of this.list) {
      c.alpha = Math.min(1, c.alpha + dt * 1.5);
      if (c.held) continue;
      const d = Math.hypot(c.x - px, c.y - py);
      const repelled = G.repel > 0 && lead && c.c.lv < lead.lv && !c.c.alpha;
      // contacto directo: empieza el combate
      if (d < 13 && !world.busy && c.alpha >= 1 && !aiming) { this.engage(world, c); return; }
      // emboscador nocturno: espera inmóvil hasta que te acercas
      if (c.ambush && c.state === 'wander') {
        if (!repelled && d < (world.sneaking ? 18 : 34) && lead) { c.ambush = false; c.state = 'charge'; Sound.sfx('alert'); }
        c.hop = 0; continue;
      }
      if (c.state === 'wander' || c.state === 'eat') {
        const r = this.sense(c, world);
        if (c.aggressive && !repelled && d < r && G.party.length && lead) { c.state = 'alert'; c.alertT = c.c.alpha ? 0.4 : 0.6; Sound.sfx('alert'); this.alertHerd(c, world, px, py); }
        else if (!c.aggressive && d < r) { c.state = 'flee'; const a = Math.atan2(c.y - py, c.x - px); c.tx = c.x + Math.cos(a) * 40; c.ty = c.y + Math.sin(a) * 40; this.alertHerd(c, world, px, py); }
      }
      if (c.state === 'alert') {
        c.alertT -= dt; c.dir = px > c.x ? -1 : 1;
        if (c.alertT <= 0) c.state = 'charge';
        continue;
      } else if (c.state === 'charge') {
        if (d > 110) { c.state = 'wander'; continue; }
        const a = Math.atan2(py - c.y, px - c.x), sp = (c.c.alpha ? 88 : 78) * dt;
        const nx = c.x + Math.cos(a) * sp, ny = c.y + Math.sin(a) * sp;
        const t = world.tileAt(Math.floor(nx / 16), Math.floor(ny / 16));
        if (t && !t.solid) { c.x = nx; c.y = ny; }
        c.dir = Math.cos(a) > 0 ? -1 : 1;
        c.hop = Math.abs(Math.sin(world.time * 16)) * 3;
        continue;
      } else if (c.state === 'flee' && d > 70) c.state = 'wander';
      // cebos: se acercan a comer
      if (c.state === 'wander') {
        const b = this.baits.find((b) => U.dist(b.x, b.y, c.x, c.y) < 90);
        if (b) { c.tx = b.x + (c.x < b.x ? -6 : 6); c.ty = b.y; c.bait = b; if (U.dist(c.x, c.y, c.tx, c.ty) < 3) { c.state = 'eat'; c.eatT = 5; } }
      }
      if (c.state === 'eat') {
        c.eatT -= dt; c.hop = Math.abs(Math.sin(world.time * 10)) * 1;
        if (c.eatT <= 0 || !this.baits.includes(c.bait)) { c.state = 'wander'; c.bait = null; c.wait = 1; if (c.eatT <= 0 && c.bait) c.bait.t = 0; }
        continue;
      }
      if (c.wait > 0 && !c.bait) { c.wait -= dt; c.hop = 0; continue; }
      const dx = c.tx - c.x, dy = c.ty - c.y, l = Math.hypot(dx, dy);
      const speed = c.state === 'flee' ? 60 : c.bait ? 30 : 20;
      if (l < 1) {
        if (c.bait) continue;
        c.wait = U.rand(1, 3.5);
        for (let k = 0; k < 6; k++) {
          const nx = c.hx * 16 + 8 + U.rand(-40, 40), ny = c.hy * 16 + 12 + U.rand(-32, 32);
          if (this.walkable(world, nx, ny)) { c.tx = nx; c.ty = ny; break; }
        }
        continue;
      }
      const nx = c.x + (dx / l) * Math.min(l, speed * dt), ny = c.y + (dy / l) * Math.min(l, speed * dt);
      if (this.walkable(world, nx, ny)) { c.x = nx; c.y = ny; } else { c.tx = c.x; c.ty = c.y; if (c.bait) { c.bait = null; c.wait = 2; } }
      if (Math.abs(dx) > 0.5) c.dir = dx > 0 ? -1 : 1;
      c.hop = Math.abs(Math.sin(world.time * 14 + c.x)) * 2;
    }
  },
  engage(world, c) {
    this.list = this.list.filter((o) => o !== c);
    if (!G.party.length || !Game.firstAlive()) return;
    world.runScript(async () => { await Battle.wild(c.c, { foePos: [c.x, c.y] }); });
  },
  draw(ctx, cx, cy, world) {
    for (const b of this.baits) {
      const x = Math.round(b.x - cx), y = Math.round(b.y - cy);
      drawShadow(ctx, x, y + 1, 3, 1, 0.25);
      P(ctx, x - 2, y - 3, 5, 4, '#e05088'); P(ctx, x - 1, y - 3, 2, 1, '#ffb0d0'); P(ctx, x, y - 5, 1, 2, '#58a040');
    }
    for (const c of this.list) {
      const x = Math.round(c.x - cx), y = Math.round(c.y - cy);
      if (x < -30 || y < -36 || x > W + 30 || y > H + 30) continue;
      // emboscador: solo se ven sus ojos en la oscuridad
      if (c.ambush && c.state === 'wander') {
        if (Math.floor(Engine.time * 1.3 + c.x) % 4 !== 0) { P(ctx, x - 4, y - 9, 2, 1, '#ffe060'); P(ctx, x + 2, y - 9, 2, 1, '#ffe060'); }
        continue;
      }
      ctx.globalAlpha = c.alpha;
      const S = c.c.alpha ? 30 : 22;
      if (c.c.alpha) { ctx.globalAlpha = c.alpha * (0.3 + 0.15 * Math.sin(Engine.time * 5)); pixCircle(ctx, x, y - 2, 13, '#ff2040'); ctx.globalAlpha = c.alpha; }
      drawShadow(ctx, x, y, S / 3.6, 2, 0.25);
      if (c.animSeed === undefined) { c.animSeed = Math.random() * 6; c.px0 = c.x; c.py0 = c.y; }
      const spd = Math.hypot(c.x - c.px0, c.y - c.py0) * 60; c.px0 = c.x; c.py0 = c.y;
      CreatureAnim.draw(ctx, c, { sp: c.sp, S, shiny: c.c.shiny, px: x, py: y + 2, flip: c.dir < 0, t: Engine.time, dt: 1 / 60, speed: spd,
        act: c.state === 'alert' ? { m: { kind: 'melee' }, t: 0.6 - c.alertT, windup: 0.6, fired: false } : null });
      const t = world.tileAt(Math.floor(c.x / 16), Math.floor((c.y - 2) / 16));
      if (t && t.grass) ctx.drawImage(Tiles.get('tallgrass_top', Math.floor(Engine.time * 3) % 2), Math.floor(c.x / 16) * 16 - cx, Math.floor((c.y - 2) / 16) * 16 - cy);
      if (c.state === 'alert' || c.state === 'charge') { UI.box(ctx, x - 5, y - S - 14, 11, 12, 'panel'); Font.drawCenter(ctx, '!', x + 1, y - S - 11, '#d03030'); }
      else if (c.state === 'eat' && Math.floor(Engine.time * 2) % 2) Font.drawOutlined(ctx, '♥', x + 4, y - S - 4, '#ff80b0', '#301020');
      if (c.c.alpha) Font.drawOutlined(ctx, 'α', x - 2, y - S - 6, '#ff6070', '#200000');
      if (c.c.shiny && Math.floor(Engine.time * 3) % 3 === 0) P(ctx, x + U.randi(-8, 8), y - U.randi(6, 20), 2, 2, '#fff8a0');
      ctx.globalAlpha = 1;
    }
  },
});

// ---------- lanzar en el mapa ----------
class FieldThrow {
  static open() {
    const kinds = FieldThrow.kinds();
    if (!kinds.length) { World.runScript(async () => { await say('No tienes esferas ni cebos para lanzar.'); }); return; }
    World.busy++;
    runScene(new FieldThrow(kinds)).then(() => { World.busy = Math.max(0, World.busy - 1); });
  }
  static kinds() { return SPHERE_ORDER.filter((k) => G.bag[k] > 0).concat(G.bag.baya_dulce > 0 ? ['baya_dulce'] : []); }
  constructor(kinds) {
    const p = World.player, [dx, dy] = DIRS[p.dir];
    this.kinds = kinds; this.ki = 0;
    this.ox = p.px + 8; this.oy = p.py + 4;
    this.gx = this.ox + dx * 70; this.gy = this.oy + 8 + dy * 70;
    this.ball = null; this.t = 0; this.msg = null; this.cd = 0;
    if (!G.flags.tut_fieldthrow) { G.flags.tut_fieldthrow = 1; this.msg = { text: 'Apunta y lanza. Si no te han visto, ¡captura por sorpresa!', t: 3 }; }
  }
  get kind() { return this.kinds[this.ki]; }
  update(dt) {
    this.t += dt; this.cd = Math.max(0, this.cd - dt);
    Clock.update(dt); Weather.update(dt, Weather.at(World.map)); Ambient.update(dt, World); World.updateTerrain(dt);
    Critters.update(dt, World);
    // los habitantes siguen con su rutina mientras apuntas
    for (const n of World.npcs) World.updateMover(n, dt);
    World.updateNpcAI(dt);
    G.playTime += dt;
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
    if (this.ball) { this.updateBall(dt); return; }
    Input.mouseCapture = true;
    const M = Input.mouse;
    if (Input.pressed('b') || Input.pressed('ball') || M.pressed[2]) { Sound.sfx('cancel'); Input.mouseCapture = false; this.done(); return; }
    if (Input.pressed('cycle') || M.wheel) { this.kinds = FieldThrow.kinds(); this.ki = (this.ki + (M.wheel < 0 ? -1 : 1) + this.kinds.length) % this.kinds.length; Sound.sfx('blip'); }
    if (Input.usingMouse()) {
      const p3 = typeof World3D !== 'undefined' && World3D.usable(World) && World3D.camT ? World3D.screenToWorld(M.x, M.y) : null;
      if (p3) { this.gx = p3[0]; this.gy = p3[1]; } else { this.gx = M.x + World.cam[0]; this.gy = M.y + World.cam[1]; }
    }
    else {
      const [ax, ay] = Input.axis();
      this.gx += ax * 110 * dt; this.gy += ay * 110 * dt;
    }
    // alcance máximo
    const ph = SPHERE_PHYS[this.kind] || {}, R = ph.range || 200;
    const d = U.dist(this.ox, this.oy, this.gx, this.gy);
    if (d > R) { this.gx = this.ox + (this.gx - this.ox) / d * R; this.gy = this.oy + (this.gy - this.oy) / d * R; }
    if ((Input.pressed('a') && !Input.usingMouse()) || (M.pressed[0] && Input.usingMouse())) this.throw();
  }
  throw() {
    const kind = this.kind;
    if (!kind || !(G.bag[kind] > 0)) { this.kinds = FieldThrow.kinds(); if (!this.kinds.length) this.done(); return; }
    Game.take(kind);
    Sound.sfx('throw');
    const d = U.dist(this.ox, this.oy, this.gx, this.gy), ph = SPHERE_PHYS[kind] || { dur: 1, h: 1 };
    this.ball = { kind, sx: this.ox, sy: this.oy - 6, gx: this.gx, gy: this.gy, x: this.ox, y: this.oy, z: 0, t: 0, dur: (0.32 + d / 330) * ph.dur, h: (18 + d * 0.14) * ph.h };
    const p = World.player, a = Math.atan2(this.gy - this.oy, this.gx - this.ox);
    p.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 'right' : 'left') : Math.sin(a) > 0 ? 'down' : 'up';
  }
  updateBall(dt) {
    const b = this.ball;
    b.t += dt;
    if (b.phase === 'shake' || b.phase === 'miss') return;
    const k = Math.min(1, b.t / b.dur);
    b.x = U.lerp(b.sx, b.gx, k); b.y = U.lerp(b.sy, b.gy, k); b.z = Math.sin(k * Math.PI) * b.h;
    if (k > 0.75 && b.z < 10) { const t = World.tileAt(Math.floor(b.x / 16), Math.floor((b.y - 2) / 16)); if (!t || (t.solid && !t.water)) return this.miss('¡Chocó contra un obstáculo!'); }
    if (k < 1) return;
    if (ITEMS[b.kind].bait) {
      const t = World.tileAt(Math.floor(b.x / 16), Math.floor(b.y / 16));
      if (t && t.water) return this.miss('El cebo se hundió en el agua...');
      Critters.baits.push({ x: b.x, y: b.y, t: 20 });
      Sound.sfx('blip');
      this.ball = null; this.cd = 0.3;
      this.kinds = FieldThrow.kinds(); this.ki = Math.min(this.ki, Math.max(0, this.kinds.length - 1));
      if (!this.kinds.length) this.done();
      return;
    }
    // ¿cae sobre alguna criatura?
    let hit = null, hd = 1e9;
    for (const c of Critters.list) { if (c.ambush) continue; const r = (c.c.alpha ? 14 : 10), dd = U.dist(b.x, b.y, c.x, c.y - 4); if (dd < r && dd < hd) { hd = dd; hit = c; } }
    if (!hit) return this.miss('¡Fallaste!');
    this.resolve(hit);
  }
  miss(msg) {
    const b = this.ball; b.phase = 'miss';
    Sound.sfx('bump');
    this.msg = { text: msg, t: 1.4 };
    Timers.wait(0.5).then(() => { this.ball = null; this.kinds = FieldThrow.kinds(); this.ki = Math.min(this.ki, Math.max(0, this.kinds.length - 1)); if (!this.kinds.length) this.done(); });
  }
  async resolve(c) {
    const b = this.ball; b.phase = 'shake';
    const sp = SPECIES[c.sp];
    const unnoticed = c.state === 'wander' || c.state === 'eat';
    if (!unnoticed) {
      // si ya te ha visto, la esfera rebota y empieza el combate
      Sound.sfx('bump');
      this.msg = { text: '¡Está alerta! La esfera rebota.', t: 1.4 };
      await Timers.wait(0.6);
      this.ball = null; Input.mouseCapture = false; this.done();
      if (c.aggressive && Critters.list.includes(c)) Critters.engage(World, c);
      else { c.state = 'flee'; c.tx = c.x + U.rand(-40, 40); c.ty = c.y + U.rand(-40, 40); }
      return;
    }
    c.held = true;
    Sound.sfx('poof');
    // probabilidad de captura por sorpresa (PS al máximo)
    let bonus = 1.6;
    const notes = ['¡Por sorpresa!'];
    if (c.state === 'eat') { bonus *= 1.3; notes.push('Distraído comiendo'); }
    if (World.sneaking) { bonus *= 1.2; notes.push('Sigilo'); }
    const sb = sphereBonus(b.kind, sp, { early: true });
    if (sb) { bonus *= sb[0]; notes.push(sb[1]); }
    if (c.c.alpha) { bonus *= 0.6; notes.push('Alfa: se resiste'); }
    this.notes = notes; this.noteT = 0;
    const ballMul = ITEMS[b.kind].ball;
    const p = ballMul >= 255 ? 1 : U.clamp((sp.catch * ballMul * bonus) / 3 / 255, 0.01, 1);
    const shakeP = Math.pow(p, 1 / 3);
    b.x = c.x; b.y = c.y - 2; b.z = 0; b.shakes = 0;
    let ok = true;
    for (let i = 0; i < 3; i++) {
      await Timers.wait(0.7);
      if (Math.random() < shakeP) { b.shakes++; Sound.sfx('shake'); }
      else { ok = false; break; }
    }
    if (ok) {
      Critters.list = Critters.list.filter((o) => o !== c);
      Game.addCreature(c.c);
      G.stats = G.stats || {}; G.stats.stealth_catch = (G.stats.stealth_catch || 0) + 1;
      const where = G.party.includes(c.c) ? 'party' : 'box';
      this.ball = null; Input.mouseCapture = false; this.done();
      await World.runScript(async () => {
        await Sound.jingle('catch');
        await say(`¡Has capturado a ${sp.name}${c.c.alpha ? ' alfa' : ''} sin luchar!`);
        await afterCatch(c.c, where);
      });
      return;
    }
    // falla: se libera y reacciona
    Sound.sfx('poof');
    c.held = false;
    this.msg = { text: ['¡Se ha escapado!', '¡Casi!', '¡Por poco!'][b.shakes] || '¡Se ha escapado!', t: 1.4 };
    await Timers.wait(0.4);
    this.ball = null; Input.mouseCapture = false; this.done();
    if (c.aggressive || c.c.alpha) { if (Critters.list.includes(c)) Critters.engage(World, c); }
    else { c.state = 'flee'; const a = Math.atan2(c.y - World.player.py, c.x - World.player.px); c.tx = c.x + Math.cos(a) * 50; c.ty = c.y + Math.sin(a) * 50; Critters.alertHerd(c, World, World.player.px + 8, World.player.py + 12); }
  }
  draw(ctx) {
    // en 3D, la puntería y la esfera se dibujan con la perspectiva del suelo
    const g3 = typeof World3D !== 'undefined' && World3D.usable(World) && World3D.camT;
    if (g3) { const A = World3D.affine(); ctx.save(); ctx.setTransform(A[0], A[1], A[2], A[3], A[4], A[5]); World3D.skew = true; }
    try { this.drawAim(ctx, g3 ? 0 : World.cam[0], g3 ? 0 : World.cam[1]); } finally { if (g3) { ctx.restore(); World3D.skew = false; } }
    this.drawBar(ctx);
  }
  drawAim(ctx, cx, cy) {
    const b = this.ball;
    if (!b) {
      // trayectoria
      const d = U.dist(this.ox, this.oy, this.gx, this.gy), ph = SPHERE_PHYS[this.kind] || { h: 1 };
      const h = (18 + d * 0.14) * ph.h, n = Math.max(6, Math.floor(d / 10));
      for (let i = 1; i < n; i++) {
        const k = i / n, x = Math.round(U.lerp(this.ox, this.gx, k) - cx), y = Math.round(U.lerp(this.oy - 6, this.gy, k) - Math.sin(k * Math.PI) * h - cy);
        P(ctx, x - 2, y - 2, 4, 4, '#1c1622'); P(ctx, x - 1, y - 1, 2, 2, Math.floor(this.t * 10 + i) % 2 ? '#ffffff' : '#ffe060');
      }
      let over = null;
      for (const c of Critters.list) if (!c.ambush && U.dist(this.gx, this.gy, c.x, c.y - 4) < (c.c.alpha ? 14 : 10)) over = c;
      const col = over ? (over.state === 'wander' || over.state === 'eat' ? '#70ff80' : '#ff7070') : '#ffe060';
      const gx = this.gx - cx, gy = this.gy - cy;
      ctx.globalAlpha = 0.22; pixCircle(ctx, gx, gy, 9, col); ctx.globalAlpha = 1;
      pixRing(ctx, gx, gy, 9, '#1c1622', 3); pixRing(ctx, gx, gy, 9, col, 2);
      P(ctx, Math.round(gx) - 4, Math.round(gy), 9, 1, col); P(ctx, Math.round(gx), Math.round(gy) - 4, 1, 9, col);
      if (over) {
        const sp = SPECIES[over.sp];
        const lab = `${sp.name}${over.c.alpha ? ' α' : ''} Nv${over.c.lv}${G.caught[sp.id] ? ' ✓' : ''}`;
        Font.drawOutlined(ctx, lab, Math.round(gx - Font.width(lab) / 2), Math.round(gy) - 22, '#ffffff', '#1a1420');
      }
    } else if (b.phase !== 'miss' || Math.floor(this.t * 20) % 2) {
      drawShadow(ctx, b.x - cx, b.y - cy + 2, 3, 1.2, 0.3);
      const img = ITEMS[b.kind].sphere ? Icons.sphere(ITEMS[b.kind].sphere, 10) : Icons.item(b.kind);
      let ox = 0;
      if (b.phase === 'shake') ox = Math.round(Math.sin(b.t * 25) * (b.t % 0.7 < 0.3 ? 2 : 0));
      ctx.drawImage(img, Math.round(b.x - cx - 5 + ox), Math.round(b.y - cy - 5 - b.z));
      if (b.phase === 'shake') for (let i = 0; i < b.shakes; i++) P(ctx, Math.round(b.x - cx - 6 + i * 5), Math.round(b.y - cy - 14), 3, 3, '#ffe060');
    }
    if (this.notes && b && b.phase === 'shake') this.notes.forEach((n, i) => Font.drawOutlined(ctx, n, Math.round(b.x - cx - Font.width(n) / 2), Math.round(b.y - cy - 26 - i * 10), '#fff080', '#1a1420'));
  }
  drawBar(ctx) {
    // barra inferior
    P(ctx, 0, 214, W, 26, '#1c1430'); P(ctx, 0, 214, W, 1, '#f0c040');
    const k = this.kind;
    if (k) {
      ctx.drawImage(ITEMS[k].sphere ? Icons.sphere(ITEMS[k].sphere, 12) : Icons.item(k), 5, 220);
      Font.draw(ctx, `${ITEMS[k].name} ×${G.bag[k] || 0}`, 21, 219, '#ffffff');
      if (this.kinds.length > 1) Font.draw(ctx, 'R / rueda: cambiar', 21, 229, '#a098c0');
    }
    Font.drawRight(ctx, Input.usingMouse() ? 'Clic: lanzar · Clic der.: salir' : 'Flechas: apuntar · Z: lanzar · X: salir', W - 6, 219, '#e8e0f8');
    Font.drawRight(ctx, World.sneaking ? 'Sigilo' : 'C: sigilo', W - 6, 229, '#a098c0');
    if (this.msg) { const w = Font.width(this.msg.text) + 16; UI.box(ctx, (W - w) >> 1, 6, w, 18, 'dark'); Font.drawCenter(ctx, this.msg.text, W >> 1, 11, '#ffe8a0'); }
  }
}

// ---------- encuentros en la hierba: clima, alfas y sigilo ----------
World.rollGrassEncounter = function () {
  const m = this.map, enc = m.encounters;
  if (Math.random() >= enc.rate * 0.5 * (this.sneaking ? 0.4 : 1)) return null;
  return Wild.roll(m);
};

// indicador de sigilo en el mapa
{
  const _hud = HUD.drawWorld;
  HUD.drawWorld = function (ctx, world) {
    _hud.call(this, ctx, world);
    if (world.sneaking && !world.busy) {
      UI.box(ctx, 4, 222, 60, 15, 'dark');
      Font.draw(ctx, world.inGrass() ? 'Oculto' : 'Sigilo', 11, 226, world.inGrass() ? '#80ff90' : '#c0d0ff');
    }
  };
}

// especies que solo aparecen con lluvia o de noche
MAPS.ruta1.encounters.list.push({ sp: 'umbrin', min: 3, max: 5, w: 8, time: 'noche' }, { sp: 'voltin', min: 3, max: 5, w: 10, weather: 'lluvia' });
MAPS.ruta2.encounters.list.push({ sp: 'escamin', min: 6, max: 8, w: 14, weather: 'lluvia' });
MAPS.ruta3.encounters.list.push({ sp: 'nimbo', min: 13, max: 15, w: 10, weather: 'lluvia' });
MAPS.bosque.encounters.list.push({ sp: 'escamin', min: 8, max: 10, w: 10, weather: 'lluvia' });
