'use strict';
// un bordillo (salto) no se puede cruzar en vertical dentro del combate
const ledgeCross = (x, y, nx, ny) => { if (nx !== x) return false; const a = World.tileAt(x, Math.min(y, ny)); return !!(a && a.ledge); };
// ============================================================
//  COMBATE EN EL MAPA
//  El combate ocurre en el mismo lugar donde empieza: el terreno
//  real (árboles, rocas, casas, agua) bloquea el paso y los
//  disparos, y un anillo delimita el área. Solo se sale huyendo.
// ============================================================

const FIELD_R = 118; // radio del área de combate (px)

Object.assign(BattleScene.prototype, {
  // ---------- terreno ----------
  tile(px, py) { return World.tileAt(Math.floor(px / 16), Math.floor(py / 16)); },
  solidAt(px, py) { const t = this.tile(px, py); return !t || !!t.solid; },
  blocksShotAt(px, py) { const t = this.tile(px, py); return !t || (t.solid && !t.water); },
  inGrass(f) { const t = this.tile(f.x, f.y - 2); return !!(t && t.grass); },
  // longitud libre de un rayo hasta el primer obstáculo
  rayLen(x, y, ang, len) {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    for (let d = 8; d < len; d += 4) if (this.blocksShotAt(x + ca * d, y - 4 + sa * d)) return d;
    return len;
  },
  losClear(a, b) {
    const d = U.dist(a.x, a.y, b.x, b.y), ang = angTo(a, b);
    return this.rayLen(a.x, a.y, ang, d) >= d - 6;
  },
  inArena(x, y, pad = 0) {
    const F = this.field;
    if (F.rect) { const [x0, y0, x1, y1] = F.rect; return x >= x0 + pad && x <= x1 - pad && y >= y0 + pad && y <= y1 - pad; }
    return U.dist(x, y, F.center[0], F.center[1]) <= F.R - pad;
  },
  clampPoint(x, y, pad = 0) {
    const F = this.field;
    if (F.rect) { const [x0, y0, x1, y1] = F.rect; return [U.clamp(x, x0 + pad, x1 - pad), U.clamp(y, y0 + pad, y1 - pad)]; }
    const [cx, cy] = F.center, d = U.dist(x, y, cx, cy), lim = F.R - pad;
    if (d <= lim) return [x, y];
    return [cx + ((x - cx) / d) * lim, cy + ((y - cy) / d) * lim];
  },
  nearEdge(f) { return !this.inArena(f.x, f.y, 26); },
  blinkTo(f, x, y) {
    [x, y] = this.clampPoint(x, y, f.r);
    // si el destino es sólido, se queda a medio camino o donde está
    for (let k = 1; k >= 0; k -= 0.25) {
      const tx = f.x + (x - f.x) * k, ty = f.y + (y - f.y) * k;
      if (!this.solidAt(tx, ty - 2)) { f.x = tx; f.y = ty; return; }
    }
  },
  // empuja al luchador fuera de las casillas sólidas
  collideTiles(f) {
    let hit = false;
    const r = Math.max(4, f.r * 0.75), cy = f.y - 3;
    for (let ty = Math.floor((cy - r) / 16); ty <= Math.floor((cy + r) / 16); ty++)
      for (let tx = Math.floor((f.x - r) / 16); tx <= Math.floor((f.x + r) / 16); tx++) {
        const t = World.tileAt(tx, ty);
        let ry0 = ty * 16, ry1 = ty * 16 + 16;
        if (t && t.ledge && (!this.field.region || this.field.region.has(ty * 1000 + tx))) { ry0 = ty * 16 + 11; ry1 = ty * 16 + 15; }
        else if (t && !t.solid && (!this.field.region || this.field.region.has(ty * 1000 + tx))) continue;
        const nx = U.clamp(f.x, tx * 16, tx * 16 + 16), ny = U.clamp(cy, ry0, ry1);
        const dx = f.x - nx, dy = cy - ny, d = Math.hypot(dx, dy);
        if (d < r) {
          hit = true;
          if (d > 0.01) { f.x += (dx / d) * (r - d); f.y += (dy / d) * (r - d); }
          else { const ccx = tx * 16 + 8, ccy = ty * 16 + 8; const a = Math.atan2(cy - ccy, f.x - ccx); f.x += Math.cos(a) * 2; f.y += Math.sin(a) * 2; }
        }
      }
    return hit;
  },
  physics(f, dt, idle) {
    if (!f || f.inBall) return;
    if (idle) { f.vx *= 0.8; f.vy *= 0.8; }
    const steps = 2;
    let hit = false;
    for (let i = 0; i < steps; i++) {
      f.x += (f.vx * dt) / steps; f.y += (f.vy * dt) / steps;
      if (this.collideTiles(f)) hit = true;
    }
    if (f.act && !f.dash) { f.vx *= 0.85; f.vy *= 0.85; }
    if (f.stun > 0) { f.vx *= 0.85; f.vy *= 0.85; }
    // límite del área de combate (anillo)
    if (!this.inArena(f.x, f.y, f.r)) {
      [f.x, f.y] = this.clampPoint(f.x, f.y, f.r);
      f.vx *= 0.3; f.vy *= 0.3; hit = true;
      if (f.side === 'ally' && this.state === 'fight' && !this.edgeMsg) { this.edgeMsg = true; this.banner('No puedes salir del área. Usa "Huir" en la pausa.', 1.6, '#ffd0a0'); }
    }
    if (hit && f.dash) f.dash.left = 0;
  },
  // si la IA se atasca contra una pared, cambia de rumbo
  unstick(f, ai, dt) {
    ai.stuckT = (ai.stuckT || 0) + dt;
    if (ai.stuckT > 0.5) {
      const moved = U.dist(f.x, f.y, ai.lx || f.x, ai.ly || f.y);
      if (moved < 4) { ai.strafe *= -1; ai.detour = 0.6; }
      ai.lx = f.x; ai.ly = f.y; ai.stuckT = 0;
    }
  },
  updateProjs(dt) {
    for (const p of this.projs) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.spin += dt * 12;
      if (Engine.frame % 2 === 0 && (p.m.type === 'fuego' || p.m.type === 'sombra' || p.m.type === 'mente' || p.m.type === 'electrico'))
        this.parts.push({ x: p.x, y: p.y - 6, vx: U.rand(-10, 10), vy: U.rand(-10, 10), life: 0.25, max: 0.25, color: U.shade(TYPES[p.m.type].color, 0.2), size: 2 });
      for (const tgt of this.enemiesOf(p.owner)) {
        if (p.life <= 0 || U.dist(p.x, p.y, tgt.x, tgt.y) >= p.r + tgt.r) continue;
        const ang = Math.atan2(p.vy, p.vx);
        const wasDodge = tgt.dodgeT > 0 || tgt.invuln > 0;
        this.hit(tgt, p.owner, p.m, p.cm || 1, ang);
        if (!wasDodge) p.life = 0;
      }
      if (p.life > 0) this.terrainFromProj(p);
      if (p.life > 0 && this.blocksShotAt(p.x, p.y - 4)) { this.damageRock(p.x, p.y - 4, p.m, p.cm || 1); p.life = 0; this.burst(p.x, p.y - 4, p.m.type, 6, 40); Sound.sfx('weak'); }
      if (!this.inArena(p.x, p.y, -14)) p.life = 0;
    }
    this.projs = this.projs.filter((p) => p.life > 0);
  },
  camPoint() {
    const F = this.field;
    if (this.ally && this.foe && this.state !== 'intro') {
      const mx = (this.ally.x + this.foe.x) / 2, my = (this.ally.y + this.foe.y) / 2;
      return [U.lerp(F.center[0], mx, 0.6), U.lerp(F.center[1], my, 0.6) - 10];
    }
    return [F.center[0], F.center[1] - 10];
  },
  // luces que emite el combate (coordenadas de pantalla)
  lights(cx, cy) {
    const out = [];
    for (const f of [this.ally, this.foe]) if (f && !f.inBall) {
      out.push({ x: f.x - cx, y: f.y - cy - 10, r: 40, i: 0.55 });
      if (f.types.includes('fuego')) out.push({ x: f.x - cx, y: f.y - cy - 12, r: 56, i: 0.85, glow: '#ff9040', gr: 26 });
      if (f.types.includes('electrico')) out.push({ x: f.x - cx, y: f.y - cy - 12, r: 42, i: 0.6, glow: '#fff070', gr: 18 });
    }
    for (const p of this.projs) { const t = p.m.type; if (t === 'fuego' || t === 'electrico' || t === 'mente' || t === 'sombra') out.push({ x: p.x - cx, y: p.y - cy - 6, r: 26, i: 0.9, glow: TYPES[t].color, gr: 14 }); }
    for (const e of this.fx) if (e.k === 'beam') for (let d = 20; d < e.len; d += 40) out.push({ x: e.x - cx + Math.cos(e.ang) * d, y: e.y - cy + Math.sin(e.ang) * d, r: 30, i: 0.8, glow: e.color, gr: 16 });
    return out;
  },
  mouseWorld() { const [cx, cy] = World.cam || [0, 0]; return [Input.mouse.x + cx, Input.mouse.y + cy]; },
  // anillo luminoso que delimita el área; fuera de él, el mundo se oscurece
  drawArena(ctx) {
    const F = this.field, t = this.t;
    const pulse = 0.65 + 0.2 * Math.sin(t * 3);
    const col = this.opts.boss ? '#ff8a60' : this.wild ? '#8ae0ff' : '#ffd870';
    const [cx0, cy0] = World.cam || [0, 0];
    ctx.save();
    ctx.fillStyle = 'rgba(6,4,18,0.28)';
    ctx.beginPath();
    ctx.rect(cx0 - 20, cy0 - 20, W + 40, H + 40);
    if (F.rect) { const [x0, y0, x1, y1] = F.rect; ctx.rect(x0, y0, x1 - x0, y1 - y0); }
    else ctx.arc(F.center[0], F.center[1], F.R, 0, Math.PI * 2);
    ctx.fill('evenodd');
    ctx.restore();
    if (F.rect) {
      const [x0, y0, x1, y1] = F.rect;
      ctx.globalAlpha = pulse;
      const o = Math.floor(t * 20) % 6;
      for (let x = x0; x < x1; x += 6) { P(ctx, x + o, y0, 4, 1, col); P(ctx, x + o, y1, 4, 1, col); }
      for (let y = y0; y < y1; y += 6) { P(ctx, x0, y + o, 1, 4, col); P(ctx, x1, y + o, 1, 4, col); }
      ctx.globalAlpha = 1;
      return;
    }
    const [cx, cy] = F.center, R = F.R, n = 150;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const on = (i + Math.floor(t * 12)) % 5 !== 0;
      if (!on) continue;
      const x = Math.round(cx + Math.cos(a) * R), y = Math.round(cy + Math.sin(a) * R);
      ctx.globalAlpha = pulse; P(ctx, x, y, 2, 2, col);
      ctx.globalAlpha = pulse * 0.3; P(ctx, x - 1, y - 1, 4, 4, col);
    }
    ctx.globalAlpha = 1;
  },
});

// tamaño y posición inicial de los luchadores en el mapa
const _mkFighter = BattleScene.prototype.mkFighter;
BattleScene.prototype.mkFighter = function (c, side) {
  const f = _mkFighter.call(this, c, side);
  const F = this.field;
  const [x, y] = side === 'ally' ? F.allyStart : F.foeStart;
  f.x = x; f.y = y;
  const [ox, oy] = side === 'ally' ? F.foeStart : F.allyStart;
  f.ang = Math.atan2(oy - y, ox - x);
  f.lastFlip = Math.cos(f.ang) > 0;
  f.size = f.sp.legendary ? 56 : 40;
  f.r = Math.round((5 + (f.sp.look.size || 1) * 3) * (f.sp.legendary ? 1.35 : 1));
  return f;
};
// la hierba alta tapa parcialmente a los luchadores
const _drawFighter = BattleScene.prototype.drawFighter;
BattleScene.prototype.drawFighter = function (ctx, f) {
  _drawFighter.call(this, ctx, f);
  if (!f.inBall && this.inGrass(f)) {
    const tx = Math.floor(f.x / 16), ty = Math.floor((f.y - 2) / 16);
    ctx.drawImage(Tiles.get('tallgrass_top', Math.floor(Engine.time * 3) % 2), tx * 16, ty * 16);
  }
};

// ---------- preparación del área de combate ----------
const Field = {
  center(px, py) { return [px * 16 + 8, py * 16 + 12]; },
  freeTile(x, y) { const t = World.tileAt(x, y); return t && !t.solid && !t.ledge && !World.npcAt(x, y) && !World.itemAt(x, y) && !(World.player.x === x && World.player.y === y); },
  // busca una casilla libre a cierta distancia en una dirección
  tileToward(sx, sy, dx, dy, maxD = 3) {
    for (let d = maxD; d >= 1; d--) { const x = sx + dx * d, y = sy + dy * d; if (this.freeTile(x, y)) return [x, y]; }
    for (const [ax, ay] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const x = sx + ax * 2, y = sy + ay * 2; if (this.freeTile(x, y)) return [x, y]; }
    return [sx + dx, sy + dy];
  },
  // casillas transitables conectadas con el punto de inicio dentro del área
  region(F) {
    const key = (x, y) => y * 1000 + x;
    const inside = (x, y) => F.rect ? (x * 16 + 8 >= F.rect[0] && x * 16 + 8 <= F.rect[2] && y * 16 + 10 >= F.rect[1] && y * 16 + 10 <= F.rect[3]) : U.dist(x * 16 + 8, y * 16 + 10, F.center[0], F.center[1]) <= F.R + 4;
    const sx = Math.floor(F.allyStart[0] / 16), sy = Math.floor((F.allyStart[1] - 3) / 16);
    const set = new Set([key(sx, sy)]), q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (set.has(k)) continue;
        const t = World.tileAt(nx, ny);
        if (!t || t.solid || !inside(nx, ny)) continue;
        if (ledgeCross(x, y, nx, ny)) continue;
        set.add(k); q.push([nx, ny]);
      }
    }
    return set;
  },
  finish(F) {
    F.region = this.region(F);
    const key = (x, y) => y * 1000 + x;
    const ft = key(Math.floor(F.foeStart[0] / 16), Math.floor((F.foeStart[1] - 3) / 16));
    if (!F.region.has(ft)) {
      // el rival aparece en la casilla conectada más adecuada (a unos 4 tiles del aliado)
      let best = null, bs = 1e9;
      for (const k of F.region) {
        const x = (k % 1000) * 16 + 8, y = Math.floor(k / 1000) * 16 + 12;
        const s = Math.abs(U.dist(x, y, F.allyStart[0], F.allyStart[1]) - 64) + U.dist(x, y, F.foeStart[0], F.foeStart[1]) * 0.5;
        if (s < bs) { bs = s; best = [x, y]; }
      }
      if (best) F.foeStart = best;
    }
    return F;
  },
  setup(opts) {
    return this.finish(this.setup0(opts));
  },
  setup0(opts) {
    const p = World.player;
    let foe, ally;
    const m = MAPS[G.map];
    if (opts.gym && m.arena) {
      const a = m.arena;
      const rect = [a.x * 16 + 4, a.y * 16 + 6, (a.x + a.w) * 16 - 4, (a.y + a.h) * 16 - 2];
      return { rect, center: [(rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2], R: FIELD_R, foeStart: [(rect[0] + rect[2]) / 2, rect[1] + 30], allyStart: [(rect[0] + rect[2]) / 2, rect[3] - 18] };
    }
    if (opts.foePos) foe = opts.foePos;
    else if (opts.npc) {
      // el ánima rival sale delante de su entrenador (o junto a él si no hay sitio)
      const n = opts.npc, [dx, dy] = DIRS[n.dir];
      foe = this.freeTile(n.x + dx, n.y + dy) ? this.center(n.x + dx, n.y + dy) : [n.x * 16 + 8 + dx * 6, n.y * 16 + 12 + dy * 6];
    }
    else { const [dx, dy] = DIRS[p.dir]; const t = this.tileToward(p.x, p.y, dx, dy, 3); foe = this.center(t[0], t[1]); }
    // el ánima aliada sale delante del entrenador, hacia el rival
    const pc = this.center(p.x, p.y);
    const ang = Math.atan2(foe[1] - pc[1], foe[0] - pc[0]);
    ally = [pc[0] + Math.cos(ang) * 30, pc[1] + Math.sin(ang) * 30];
    if (U.dist(ally[0], ally[1], foe[0], foe[1]) < 64) {
      const cand = [ally[0] + Math.cos(ang) * 64, ally[1] + Math.sin(ang) * 64];
      const t = World.tileAt(Math.floor(cand[0] / 16), Math.floor(cand[1] / 16));
      if (t && !t.solid) foe = cand;
    }
    const center = [(ally[0] + foe[0]) / 2, (ally[1] + foe[1]) / 2];
    return { center, R: FIELD_R, foeStart: foe, allyStart: ally };
  },
};

// ---------- inicio del combate en el sitio ----------
class FieldIntro {
  constructor(boss) { this.t = 0; this.boss = boss; }
  update(dt) { this.t += dt; if (this.t >= 0.5) this.done(); }
  draw(ctx) {
    const k = this.t / 0.5;
    if (k < 0.4 && Math.floor(this.t * 30) % 2) { ctx.globalAlpha = 0.5; P(ctx, 0, 0, W, H, this.boss ? '#ffb0a0' : '#ffffff'); ctx.globalAlpha = 1; }
    // franjas de cine
    const h = Math.round(Math.min(1, k * 2) * 10);
    P(ctx, 0, 0, W, h, '#0a0612'); P(ctx, 0, H - h, W, h, '#0a0612');
  }
}

Battle.start = async function (opts) {
  World.syncPos();
  const map = MAPS[G.map];
  const prevMusic = map.music;
  const legendary = opts.wild && SPECIES[opts.wild.sp].legendary;
  Sound.music(opts.wild ? (legendary ? 'boss' : 'battle') : opts.music || (opts.boss ? 'boss' : 'trainer'));
  const field = Field.setup(opts);
  // el entrenador mira hacia el combate
  const p = World.player, pc = Field.center(p.x, p.y);
  const dx = field.foeStart[0] - pc[0], dy = field.foeStart[1] - pc[1];
  p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  Sound.sfx('alert');
  await runScene(new FieldIntro(opts.boss || legendary));
  const b = new BattleScene(Object.assign({ bg: map.bg }, opts));
  b.field = field;
  b.hideNpc = opts.hideNpc || null;
  b.opaque = true;
  this.active = b;
  World.battle = b;
  Scenes.push(b);
  Fade.a = 0;
  let res;
  try { res = await b.run(); }
  finally {
    Scenes.pop(b);
    this.active = null;
    World.battle = null;
    if (b.trainer) b.snapTrainer();
  }
  for (const c of G.party) if (c.hp > calcStats(c).hp) c.hp = calcStats(c).hp;
  // el compañero vuelve detrás del jugador
  World.follower.pending = true; World.follower.hidden = true;
  { const [fx, fy] = DIRS[p.dir]; const bx = p.x - fx, by = p.y - fy; if (Field.freeTile(bx, by)) Object.assign(World.follower, { x: bx, y: by, px: bx * 16, py: by * 16, pending: false }); }
  if (res !== 'lose') {
    for (const c of G.party.slice()) { const evs = b.pendingLv.get(c.uid); if (evs) await processLevelEvents(c, evs); }
    for (const c of G.party.slice()) if (b.leveled.has(c.uid) && c.hp > 0) await tryEvolve(c, {});
    if (res === 'caught') await afterCatch(b.captured, b.caughtWhere);
    Sound.music(prevMusic);
  }
  return res;
};
Battle.wild = function (c, extra = {}) {
  if (!c.shiny && !SPECIES[c.sp].legendary && Math.random() < 1 / 160) c.shiny = true;
  return this.start(Object.assign({ wild: c }, extra));
};

// ---------- ánimas salvajes visibles en el mapa ----------
// (sustituye a la fauna decorativa: ahora son encuentros reales)
Object.assign(Critters, {
  spots: [],
  pool() {
    const m = World.map, day = Clock.isDay();
    return m.encounters.list.filter((e) => !e.time || (e.time === 'noche' ? !day : day));
  },
  reset(world) {
    this.list = []; this.spots = []; this.timer = 4;
    const m = world.map;
    if (!m.outdoor || !m.encounters) return;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const t = world.tileAt(x, y); if (t && t.grass) this.spots.push([x, y]); }
    this.max = Math.min(5, Math.max(2, Math.floor(this.spots.length / 20)));
    for (let i = 0; i < this.max; i++) this.spawn(world, true);
  },
  spawn(world, initial) {
    if (!this.spots.length) return;
    const p = world.player;
    for (let k = 0; k < 12; k++) {
      const [x, y] = U.choice(this.spots);
      const d = Math.abs(x - p.x) + Math.abs(y - p.y);
      if (d < (initial ? 5 : 9)) continue;
      const pool = this.pool();
      if (!pool.length) return;
      const e = U.weighted(pool);
      const c = newCreature(e.sp, U.randi(e.min, e.max));
      const sp = SPECIES[e.sp];
      const aggressive = sp.types.includes('sombra') || sp.types.includes('roca') || sp.types.includes('fuego') ? U.chance(0.75) : U.chance(0.4);
      this.list.push({ c, sp: e.sp, x: x * 16 + 8, y: y * 16 + 12, hx: x, hy: y, tx: x * 16 + 8, ty: y * 16 + 12, wait: U.rand(0, 2), hop: 0, dir: 1, state: 'wander', aggressive, alertT: 0, alpha: initial ? 1 : 0 });
      return;
    }
  },
  walkable(world, px, py) { const t = world.tileAt(Math.floor(px / 16), Math.floor(py / 16)); return t && !t.solid && !t.ledge && (t.grass || t.t === 'grass' || t.t === 'flower' || t.t === 'path' || t.t === 'sand'); },
  update(dt, world) {
    if (!world.map.encounters || !world.map.outdoor) return;
    const p = world.player, px = p.px + 8, py = p.py + 12;
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = U.rand(8, 15); if (this.list.length < this.max) this.spawn(world, false); }
    const lead = Game.firstAlive();
    for (const c of this.list) {
      c.alpha = Math.min(1, c.alpha + dt * 1.5);
      const d = Math.hypot(c.x - px, c.y - py);
      const repelled = G.repel > 0 && lead && c.c.lv < lead.lv;
      // contacto directo: empieza el combate
      if (d < 13 && !world.busy && c.alpha >= 1) { this.engage(world, c); return; }
      if (c.state === 'wander') {
        if (c.aggressive && !repelled && d < 60 && G.party.length && lead) { c.state = 'alert'; c.alertT = 0.6; Sound.sfx('alert'); }
        else if (!c.aggressive && d < 40) { c.state = 'flee'; const a = Math.atan2(c.y - py, c.x - px); c.tx = c.x + Math.cos(a) * 40; c.ty = c.y + Math.sin(a) * 40; }
      } else if (c.state === 'alert') {
        c.alertT -= dt; c.dir = px > c.x ? -1 : 1;
        if (c.alertT <= 0) c.state = 'charge';
        continue;
      } else if (c.state === 'charge') {
        if (d > 110) { c.state = 'wander'; continue; }
        const a = Math.atan2(py - c.y, px - c.x), sp = 78 * dt;
        const nx = c.x + Math.cos(a) * sp, ny = c.y + Math.sin(a) * sp;
        const t = world.tileAt(Math.floor(nx / 16), Math.floor(ny / 16));
        if (t && !t.solid) { c.x = nx; c.y = ny; }
        c.dir = Math.cos(a) > 0 ? -1 : 1;
        c.hop = Math.abs(Math.sin(world.time * 16)) * 3;
        continue;
      } else if (c.state === 'flee' && d > 70) c.state = 'wander';
      if (c.wait > 0) { c.wait -= dt; c.hop = 0; continue; }
      const dx = c.tx - c.x, dy = c.ty - c.y, l = Math.hypot(dx, dy);
      const speed = c.state === 'flee' ? 60 : 20;
      if (l < 1) {
        c.wait = U.rand(1, 3.5);
        for (let k = 0; k < 6; k++) {
          const nx = c.hx * 16 + 8 + U.rand(-40, 40), ny = c.hy * 16 + 12 + U.rand(-32, 32);
          if (this.walkable(world, nx, ny)) { c.tx = nx; c.ty = ny; break; }
        }
        continue;
      }
      const nx = c.x + (dx / l) * Math.min(l, speed * dt), ny = c.y + (dy / l) * Math.min(l, speed * dt);
      if (this.walkable(world, nx, ny)) { c.x = nx; c.y = ny; } else { c.tx = c.x; c.ty = c.y; }
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
    for (const c of this.list) {
      const x = Math.round(c.x - cx), y = Math.round(c.y - cy);
      if (x < -24 || y < -30 || x > W + 24 || y > H + 24) continue;
      ctx.globalAlpha = c.alpha;
      drawShadow(ctx, x, y, 6, 2, 0.25);
      const img = CreatureGfx.get(c.sp, 22, c.c.shiny);
      ctx.save();
      if (c.dir < 0) { ctx.translate(x + 11, 0); ctx.scale(-1, 1); ctx.drawImage(img, 0, y - 20 - c.hop); }
      else ctx.drawImage(img, x - 11, y - 20 - c.hop);
      ctx.restore();
      const t = world.tileAt(Math.floor(c.x / 16), Math.floor((c.y - 2) / 16));
      if (t && t.grass) ctx.drawImage(Tiles.get('tallgrass_top', Math.floor(Engine.time * 3) % 2), Math.floor(c.x / 16) * 16 - cx, Math.floor((c.y - 2) / 16) * 16 - cy);
      if (c.state === 'alert' || c.state === 'charge') { UI.box(ctx, x - 5, y - 36, 11, 12, 'panel'); Font.drawCenter(ctx, '!', x + 1, y - 33, '#d03030'); }
      if (c.c.shiny && Math.floor(Engine.time * 3) % 3 === 0) P(ctx, x + U.randi(-8, 8), y - U.randi(6, 20), 2, 2, '#fff8a0');
      ctx.globalAlpha = 1;
    }
  },
});

// ---------- navegación dentro del área (rodear obstáculos) ----------
Object.assign(BattleScene.prototype, {
  navPath(sx, sy, gx, gy) {
    if (sx === gx && sy === gy) return [];
    const key = (x, y) => y * 1000 + x, prev = new Map([[key(sx, sy), null]]), q = [[sx, sy]];
    const free = (x, y) => (this.field.region ? this.field.region.has(y * 1000 + x) : (() => { const t = World.tileAt(x, y); return t && !t.solid; })());
    let n = 0;
    while (q.length && n++ < 900) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (prev.has(k) || !free(nx, ny) || ledgeCross(x, y, nx, ny)) continue;
        prev.set(k, key(x, y));
        if (nx === gx && ny === gy) {
          const out = []; let kk = k;
          while (kk !== key(sx, sy)) { out.unshift([kk % 1000, Math.floor(kk / 1000)]); kk = prev.get(kk); }
          return out;
        }
        q.push([nx, ny]);
      }
    }
    return null;
  },
  // vector de movimiento hacia el objetivo rodeando el terreno
  navVec(f, t) {
    f.nav = f.nav || {};
    const sx = Math.floor(f.x / 16), sy = Math.floor((f.y - 3) / 16), gx = Math.floor(t.x / 16), gy = Math.floor((t.y - 3) / 16);
    if (!f.nav.path || this.t - f.nav.at > 0.45) { f.nav.at = this.t; f.nav.path = this.navPath(sx, sy, gx, gy); }
    const p = f.nav.path;
    if (!p || !p.length) return null;
    while (p.length && p[0][0] === sx && p[0][1] === sy) p.shift();
    if (!p.length) return null;
    const [wx, wy] = p[0];
    const dx = wx * 16 + 8 - f.x, dy = wy * 16 + 12 - f.y, l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  },
});
