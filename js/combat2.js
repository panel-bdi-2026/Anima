'use strict';
// ============================================================
//  COMBATE AVANZADO
//  - Dúo: invocar a la segunda ánima unos segundos (Sinergia)
//  - Ataques cargados (mantener) y contraataque tras esquiva perfecta
//  - Terreno interactivo: fuego quema la hierba, lo eléctrico
//    electrifica el agua, los golpes fuertes rompen rocas
//  - Fases de jefe con peligros en la arena
//  - Ánimas alfa
//  - Profundidad y colisión con personas del mapa
// ============================================================

const DUO_TIME = 10;          // segundos que ayuda el Dúo
const SYN_CHARGE_TIME = 22;   // segundos para llenar la Sinergia sin golpear

TILEDEF['&'] = { t: 'burnt' };
TileDraw.burnt = (x, f, v) => {
  P(x, 0, 0, 16, 16, '#5a6a40');
  const r = mulberry(77 + v * 9);
  for (let i = 0; i < 14; i++) P(x, Math.floor(r() * 16), Math.floor(r() * 16), 1, 1, r() < 0.5 ? '#3a3a30' : '#7a7a5a');
  for (let i = 0; i < 3; i++) { const px = Math.floor(r() * 13), py = Math.floor(r() * 13); P(x, px, py, 3, 2, '#4a4a3a'); }
};

// ---------- terreno modificable (vuelve a su estado al salir del mapa) ----------
Object.assign(World, {
  resetTerrain() { this.mods = new Map(); this.fires = new Map(); this.shocks = new Map(); this.rockHP = new Map(); },
  setTile(x, y, ch) {
    if (!this.mods) this.resetTerrain();
    this.mods.set(y * 1000 + x, ch);
    const def = TILEDEF[ch] || TILEDEF['.'];
    const ctx = this.layer.getContext('2d');
    ctx.drawImage(Tiles.get(def.t, 0, Math.floor(hash2(x, y) * 3)), x * 16, y * 16);
    this.animTiles = this.animTiles.filter(([tx, ty]) => tx !== x || ty !== y);
    if (ANIM_TILES[def.t] !== undefined) this.animTiles.push([x, y, def.t]);
  },
  ignite(x, y) {
    const t = this.tileAt(x, y);
    if (!t || !t.grass || !this.fires || this.fires.has(y * 1000 + x) || this.fires.size > 60) return false;
    this.fires.set(y * 1000 + x, { t: U.rand(3.5, 5), spread: 0.7 });
    return true;
  },
  shock(x, y) {
    const t = this.tileAt(x, y);
    if (!t || !t.water || !this.shocks) return;
    this.shocks.set(y * 1000 + x, 2.5);
  },
  updateTerrain(dt) {
    if (!this.fires) this.resetTerrain();
    const rain = Weather.isRain(Weather.at(this.map));
    for (const [k, f] of this.fires) {
      f.t -= dt * (rain ? 2.2 : 1);
      f.spread -= dt;
      const x = k % 1000, y = Math.floor(k / 1000);
      if (f.spread <= 0) {
        f.spread = 0.8;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (Math.random() < (rain ? 0.08 : 0.3)) this.ignite(x + dx, y + dy);
      }
      if (f.t <= 0) { this.fires.delete(k); this.setTile(x, y, '&'); }
    }
    for (const [k, t] of this.shocks) { const nt = t - dt; if (nt <= 0) this.shocks.delete(k); else this.shocks.set(k, nt); }
  },
  drawTerrainFX(ctx, cx, cy) {
    if (!this.fires) return;
    const tm = Engine.time;
    for (const [k, f] of this.fires) {
      const x = (k % 1000) * 16 - cx, y = Math.floor(k / 1000) * 16 - cy;
      if (x < -16 || y < -24 || x > W || y > H) continue;
      for (let i = 0; i < 4; i++) {
        const fx = x + 2 + ((i * 5 + Math.floor(tm * 8)) % 12), h = 5 + Math.round(Math.sin(tm * 12 + i * 2 + k) * 2 + 3);
        P(ctx, fx, y + 14 - h, 3, h, '#ff6a20'); P(ctx, fx + 1, y + 15 - h + 2, 1, h - 3, '#ffd050');
      }
      ctx.globalAlpha = 0.35; P(ctx, x, y + 10, 16, 6, '#2a1a10'); ctx.globalAlpha = 1;
    }
    for (const [k] of this.shocks) {
      const x = (k % 1000) * 16 - cx, y = Math.floor(k / 1000) * 16 - cy;
      if (x < -16 || y < -16 || x > W || y > H) continue;
      for (let i = 0; i < 3; i++) if (Math.random() < 0.6) { const sx = x + U.randi(1, 13), sy = y + U.randi(1, 13); P(ctx, sx, sy, 3, 1, '#fff070'); P(ctx, sx + 1, sy + 1, 1, 2, '#ffffff'); }
    }
  },
  terrainLights(cx, cy) {
    const out = [];
    if (!this.fires) return out;
    for (const [k] of this.fires) out.push({ x: (k % 1000) * 16 + 8 - cx, y: Math.floor(k / 1000) * 16 + 8 - cy, r: 34, i: 0.8, glow: '#ff8030', gr: 18 });
    return out;
  },
});

Object.assign(BattleScene.prototype, {
  // ---------- luchadores ----------
  fighters() { return [this.ally, this.duoA, this.foe, this.duoF].filter((f) => f && !f.gone); },
  enemiesOf(f) {
    const list = f.side === 'ally' ? [this.foe, this.duoF] : [this.ally, this.duoA];
    return list.filter((e) => e && !e.fainted && !e.inBall && !e.gone && e.hp > 0);
  },
  targetOf(f) {
    const es = this.enemiesOf(f);
    if (!es.length) return null;
    if (f === this.ally && es.includes(this.foe)) return this.foe;
    let best = es[0], bd = 1e9;
    for (const e of es) { const d = U.dist(f.x, f.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
    return best;
  },
  // ---------- actualización de todos los luchadores ----------
  updateFighters(dt) {
    const capture = this.capture;
    World.updateTerrain(dt);
    if (!this.foe.inBall) this.foeAI(this.foe, dt);
    if (this.duoF) this.foeAI(this.duoF, dt);
    if (this.duoA) { if (capture) { this.duoA.vx *= 0.8; this.duoA.vy *= 0.8; } else this.foeAI(this.duoA, dt); }
    for (const f of this.fighters()) {
      this.tickFighter(f, dt); this.physics(f, dt);
      // Sinergia: se carga con el tiempo
      if (!f.duo && f.hp > 0 && !f.inBall) f.syn = Math.min(100, f.syn + (100 / (f.side === 'foe' ? SYN_CHARGE_TIME * 1.6 : SYN_CHARGE_TIME)) * dt * f.mods.syn);
      if (f.counterT > 0) f.counterT -= dt;
      this.terrainDamage(f, dt);
      this.bossPhase(f, dt);
      this.foeHeal(f);
    }
    // el Dúo vuelve al terminar su tiempo o cae debilitado
    for (const side of ['A', 'F']) {
      const d = this['duo' + side];
      if (!d) continue;
      d.duoT -= dt;
      if (d.hp <= 0) this.duoFaint(d, side);
      else if (d.duoT <= 0) this.dismissDuo(side, false);
    }
    // si cae el ánima principal y el Dúo está fuera, el Dúo toma el relevo
    if (this.ally.hp <= 0 && !this.ally.fainted && this.duoA && this.duoA.hp > 0) {
      this.ally.fainted = true; this.ally.c.hp = 0;
      this.banner(`¡${cName(this.ally.c)} se debilitó! ${cName(this.duoA.c)} toma el relevo`, 1.6, '#ffb0b0');
      const d = this.duoA; this.duoA = null; d.duo = false; d.aiSkill = undefined;
      this.ally = d; this.participants.add(d.c.uid);
    }
  },
  // ---------- Dúo ----------
  duoMax(side) {
    if (side === 'foe') return this.wild ? 0 : 3;
    return this.wild && !(this.foe && (this.foe.c.alpha || this.foe.sp.legendary)) ? 1 : 3;
  },
  benchA() { return G.party.find((c) => c.hp > 0 && c !== this.ally.c && !(this.duoA && c === this.duoA.c)); },
  benchF() { for (let i = 0; i < this.foeQueue.length; i++) if (i !== this.foeIdx && this.foeQueue[i].hp > 0 && !(this.duoF && this.duoF.qIdx === i)) return i; return -1; },
  canDuo(side) {
    if (this.state !== 'fight') return false;
    if (side === 'ally') return !this.duoA && this.ally.syn >= 100 && (this.duoUsesA || 0) < this.duoMax('ally') && !!this.benchA();
    return !this.duoF && this.foe && !this.foe.inBall && this.foe.syn >= 100 && (this.duoUsesF || 0) < this.duoMax('foe') && this.benchF() >= 0;
  },
  invokeDuo(side) {
    if (!this.canDuo(side)) {
      if (side === 'ally') {
        const why = this.duoA ? 'Tu Dúo ya está luchando.' : (this.duoUsesA || 0) >= this.duoMax('ally') ? 'Ya no puedes invocar más Dúos en este combate.' : !this.benchA() ? 'No tienes otra ánima en condiciones.' : 'La Sinergia aún no está cargada.';
        if (this.noCatchMsg <= 0) { this.banner(why, 1.2, '#ffb0b0'); this.noCatchMsg = 1.2; }
        Sound.sfx('bump');
      }
      return false;
    }
    const lead = side === 'ally' ? this.ally : this.foe;
    let c, qIdx;
    if (side === 'ally') c = this.benchA(); else { qIdx = this.benchF(); c = this.foeQueue[qIdx]; }
    lead.syn = 0;
    const f = this.mkFighter(c, side);
    const a = lead.ang + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
    let x = lead.x + Math.cos(a) * 30, y = lead.y + Math.sin(a) * 30;
    if (this.solidAt(x, y - 3) || !this.inArena(x, y, f.r)) { x = lead.x - Math.cos(lead.ang) * 24; y = lead.y - Math.sin(lead.ang) * 24; }
    if (this.solidAt(x, y - 3)) { x = lead.x; y = lead.y; }
    [x, y] = this.clampPoint(x, y, f.r);
    f.x = x; f.y = y; f.ang = lead.ang; f.duo = true; f.duoT = side === 'foe' ? DUO_TIME * 0.8 : DUO_TIME; f.spawnT = 0.01; f.invuln = 0.8; f.syn = 0; f.qIdx = qIdx;
    f.aiSkill = side === 'ally' ? 0.62 : (this.opts.skill !== undefined ? this.opts.skill : 0.6);
    if (side === 'ally') { this.duoA = f; this.duoUsesA = (this.duoUsesA || 0) + 1; this.participants.add(c.uid); }
    else { this.duoF = f; this.duoUsesF = (this.duoUsesF || 0) + 1; Game.markSeen(c.sp); }
    Sound.sfx('appear'); Sound.sfx('buff');
    this.sparkle(f.x, f.y - 8, side === 'ally' ? '#a0e0ff' : '#ffb0a0', 22);
    this.fx.push({ k: 'ring', x: f.x, y: f.y, r: 26, t: 0, dur: 0.4, color: side === 'ally' ? '#80d0ff' : '#ff9080' });
    this.banner(side === 'ally' ? `¡DÚO! ${cName(c)} entra a ayudar` : `¡${this.opts.title || 'El rival'} invoca a ${SPECIES[c.sp].name}!`, 1.3, side === 'ally' ? '#a0e8ff' : '#ffb0a0');
    return true;
  },
  syncDuoHp(d) {
    if (d.side === 'ally') d.c.hp = Math.max(0, Math.ceil(d.hp));
    else d.c.hp = Math.max(0, Math.round(calcStats(d.c).hp * (d.hp / d.maxHp)));
  },
  dismissDuo(side, silent) {
    const d = this['duo' + side]; if (!d) return;
    this.syncDuoHp(d);
    this.sparkle(d.x, d.y - 8, '#ffffff', 12);
    if (!silent) this.addNum(d.x, d.y - 26, `${side === 'A' ? cName(d.c) : SPECIES[d.c.sp].name} vuelve`, '#d0d0f0');
    this['duo' + side] = null;
  },
  duoFaint(d, side) {
    d.c.hp = 0;
    Sound.sfx('faint');
    this.addNum(d.x, d.y - 26, `¡${side === 'A' ? cName(d.c) : SPECIES[d.c.sp].name} se debilitó!`, '#ff9090');
    this['duo' + side] = null;
    if (side === 'F') {
      // experiencia por derrotar al Dúo rival
      const total = Math.floor(expYield(d.c, true) * 0.8);
      for (const c of G.party.filter((x) => x.hp > 0 && this.participants.has(x.uid))) {
        const evs = gainExp(c, Math.max(1, Math.floor(total / Math.max(1, this.participants.size))));
        if (evs.length) { this.pendingLv.set(c.uid, (this.pendingLv.get(c.uid) || []).concat(evs)); this.leveled.add(c.uid); }
      }
    }
  },
  promoteDuoFoe() {
    const d = this.duoF;
    if (!d || d.hp <= 0) return false;
    this.duoF = null; d.duo = false; d.aiSkill = undefined;
    this.foe = d; this.foeIdx = d.qIdx;
    this.banner(`¡${SPECIES[d.c.sp].name} sigue en pie!`, 1.0);
    return true;
  },
  nextFoeIdx() {
    for (let i = 0; i < this.foeQueue.length; i++) if (i !== this.foeIdx && this.foeQueue[i].hp > 0) return i;
    return -1;
  },
  // ---------- ataques cargados ----------
  handleAttackInput(f, dt) {
    const keys = ['m1', 'm2', 'm3', 'm4'], M = Input.mouse;
    const down = (i) => Input.down(keys[i]) || (i === 0 && M.down[0] && M.y < 202) || (i === 1 && M.down[2] && M.y < 202);
    const pressed = (i) => Input.pressed(keys[i]) || (i === 0 && M.pressed[0] && M.y < 202) || (i === 1 && M.pressed[2] && M.y < 202);
    if (this.chg) {
      if (!f.c.moves[this.chg.i]) { this.chg = null; return false; }
      if (down(this.chg.i) && f.stun <= 0) { this.chg.t += dt; if (this.chg.t > 0.28 && !this.chg.snd) { this.chg.snd = true; Sound.sfx('charge'); } return false; }
      const t = this.chg.t, i = this.chg.i; this.chg = null;
      const cm = t >= 0.28 ? 1 + Math.min(1, (t - 0.28) / 0.7) * 0.6 : 1;
      this.startMove(f, i, cm);
      return true;
    }
    for (let i = 0; i < 4; i++) if (pressed(i) && f.c.moves[i]) {
      if (f.cds[i] > 0 || f.act || f.dash) { Sound.sfx('bump'); return true; }
      this.chg = { i, t: 0 };
      return true;
    }
    return false;
  },
  // ---------- terreno ----------
  tileOf(px, py) { return [Math.floor(px / 16), Math.floor(py / 16)]; },
  terrainFromMove(f, m, cm) {
    const fire = m.type === 'fuego', elec = m.type === 'electrico';
    const strongRock = (m.type === 'roca' && m.pow * cm >= 90);
    if (m.kind === 'beam' && (fire || elec)) {
      const len = this.rayLen(f.x, f.y, f.ang, m.len);
      for (let d = 10; d < len; d += 8) { const [tx, ty] = this.tileOf(f.x + Math.cos(f.ang) * d, f.y + Math.sin(f.ang) * d); if (fire && Math.random() < 0.5) World.ignite(tx, ty); if (elec) this.shockAround(tx, ty, 0); }
    }
    if (m.kind === 'ring' && (fire || elec || strongRock)) {
      const R = Math.ceil(m.radius / 16);
      const [cx, cy] = this.tileOf(f.x, f.y - 3);
      for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
        if (U.dist(x * 16 + 8, y * 16 + 8, f.x, f.y) > m.radius) continue;
        if (fire && Math.random() < 0.55) World.ignite(x, y);
        if (elec) this.shockAround(x, y, 0);
        if (strongRock) this.damageRockTile(x, y, 2);
      }
    }
    if (m.kind === 'melee' && fire) { const [tx, ty] = this.tileOf(f.x + Math.cos(f.ang) * 18, f.y + Math.sin(f.ang) * 18); if (Math.random() < 0.6) World.ignite(tx, ty); }
  },
  terrainFromProj(p) {
    const t = p.m.type;
    if (t !== 'fuego' && t !== 'electrico') return;
    const [tx, ty] = this.tileOf(p.x, p.y);
    if (t === 'fuego' && Math.random() < 0.18 * (p.cm || 1)) World.ignite(tx, ty);
    if (t === 'electrico') { const tl = World.tileAt(tx, ty); if (tl && tl.water) this.shockAround(tx, ty, 1); }
  },
  terrainArea(a) {
    const t = a.m.type;
    const R = Math.ceil(a.r / 16), [cx, cy] = this.tileOf(a.x, a.y);
    for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
      if (U.dist(x * 16 + 8, y * 16 + 8, a.x, a.y) > a.r) continue;
      if (t === 'fuego' && Math.random() < 0.65) World.ignite(x, y);
      if (t === 'electrico') this.shockAround(x, y, 0);
      if (t === 'roca' && a.m.pow * (a.cm || 1) >= 70) this.damageRockTile(x, y, 1);
    }
  },
  shockAround(tx, ty, r) {
    for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) World.shock(x, y);
  },
  damageRock(px, py, m, cm) {
    if (!(m.pow * cm >= 55 || m.type === 'roca')) return;
    const [tx, ty] = this.tileOf(px, py);
    this.damageRockTile(tx, ty, m.type === 'roca' || m.pow * cm >= 90 ? 2 : 1);
  },
  damageRockTile(tx, ty, dmg) {
    const ch = World.charAt(tx, ty);
    if (!ch || !'RoV®¥'.includes(ch)) return;
    const k = ty * 1000 + tx;
    const hp = (World.rockHP.get(k) || 0) + dmg;
    if (hp >= 3) {
      World.rockHP.delete(k);
      World.setTile(tx, ty, World.map.cave ? 'c' : World.map.volcanic ? '%' : '.');
      if (this.field && this.field.region) this.field.region.add(k);
      for (let i = 0; i < 14; i++) { const a = U.rand(Math.PI * 2), s = U.rand(30, 90); this.parts.push({ x: tx * 16 + 8, y: ty * 16 + 8, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: 0.6, max: 0.6, color: i % 2 ? PAL.rock2 : PAL.rock3, size: U.randi(2, 3), grav: 160 }); }
      Sound.sfx('rock'); Shake.start(2, 0.2);
      this.addNum(tx * 16 + 8, ty * 16, '¡Roca destruida!', '#e0d0b0');
    } else { World.rockHP.set(k, hp); for (let i = 0; i < 5; i++) this.parts.push({ x: tx * 16 + 8, y: ty * 16 + 8, vx: U.rand(-40, 40), vy: U.rand(-60, -10), life: 0.4, max: 0.4, color: PAL.rock2, size: 2, grav: 200 }); }
  },
  terrainDamage(f, dt) {
    if (f.inBall || f.hp <= 0 || !World.fires) return;
    const [tx, ty] = this.tileOf(f.x, f.y - 3);
    f.terrT = (f.terrT || 0) + dt;
    if (f.terrT < 1) return;
    let burn = World.fires.has(ty * 1000 + tx), shock = false;
    for (const [k] of World.shocks) { const x = (k % 1000) * 16 + 8, y = Math.floor(k / 1000) * 16 + 8; if (Math.abs(x - f.x) < 18 && Math.abs(y - f.y) < 18) { shock = true; break; } }
    if (!burn && !shock) { f.terrT = 0.8; return; }
    f.terrT = 0;
    if (burn && !f.types.includes('fuego')) { const d = Math.max(1, Math.floor(f.maxHp * 0.05)); f.hp -= d; f.flash = 0.1; this.addNum(f.x, f.y - 18, '-' + d, '#ff9040'); if (Math.random() < 0.3) this.applyStatus(f, 'burn'); }
    if (shock && !f.types.includes('electrico')) { const d = Math.max(1, Math.floor(f.maxHp * 0.06)); f.hp -= d; f.flash = 0.1; this.addNum(f.x, f.y - 18, '-' + d, '#fff070'); if (Math.random() < 0.35) this.applyStatus(f, 'para'); }
  },
  // ---------- fases de jefe ----------
  isBossFighter(f) { return f.side === 'foe' && (this.opts.boss || f.sp.legendary || f.c.alpha); },
  bossPhase(f, dt) {
    if (!this.isBossFighter(f) || f.hp <= 0 || f.inBall || this.state !== 'fight') return;
    const r = f.hp / f.maxHp;
    if (!f.phase && r < 0.5) {
      f.phase = 1; f.hazardT = 2;
      f.stages.atk = Math.min(3, f.stages.atk + 1);
      if (f.sp.legendary || f.c.alpha) f.stages.esp = Math.min(3, f.stages.esp + 1);
      f.mods.speed *= f.sp.legendary || f.c.alpha ? 1.15 : 1.08; f.aiSkill = Math.min(0.95, (f.aiSkill !== undefined ? f.aiSkill : this.opts.skill || 0.6) + 0.15);
      Sound.sfx('crit'); Shake.start(3, 0.4);
      this.banner(`¡${SPECIES[f.c.sp].name} entra en furia!`, 1.4, '#ff8060');
      this.sparkle(f.x, f.y - 10, '#ff6040', 26);
    } else if (f.phase === 1 && r < 0.25 && f.sp.legendary) {
      f.phase = 2; this.banner(`¡${SPECIES[f.c.sp].name} desata todo su poder!`, 1.4, '#ff60a0'); Shake.start(3, 0.5);
    }
    if (f.phase) {
      f.hazardT -= dt;
      if (f.hazardT <= 0) {
        f.hazardT = f.phase === 2 ? 2.8 : 5;
        const type = f.types[0];
        const m = { name: 'Furia', type, kind: 'area', cat: f.st.atk >= f.st.esp ? 'fis' : 'esp', pow: 40, radius: 24 };
        for (const tgt of this.enemiesOf(f)) for (let i = 0; i < (f.phase === 2 ? 3 : 2); i++) {
          const [x, y] = this.clampPoint(tgt.x + U.rand(-30, 30) + tgt.vx * 0.4, tgt.y + U.rand(-24, 24) + tgt.vy * 0.4, 10);
          this.areas.push({ x, y, r: m.radius, delay: 1.0, t: 0, owner: f, m, hazard: true });
        }
      }
    }
  },
  // ---------- colisión con personas del mapa ----------
  personObstacles() {
    if (this._obsFrame === Engine.frame) return this._obs;
    const out = [];
    const p = World.player;
    if (!this.hidePlayer) out.push([p.px + 8, p.py + 12, true]);
    if (this.trainer) out.push([this.trainer.x, this.trainer.y, true]);
    const c = this.field.center;
    for (const n of World.npcs) if (!n.gone && (n !== this.hideNpc)) { const x = n.px + 8, y = n.py + 12; if (U.dist(x, y, c[0], c[1]) < FIELD_R + 40) out.push([x, y, false]); }
    this._obsFrame = Engine.frame; this._obs = out;
    return out;
  },
  separate() {
    const fs = this.fighters().filter((f) => !f.inBall && f.hp > 0);
    for (let i = 0; i < fs.length; i++) for (let j = i + 1; j < fs.length; j++) {
      const a = fs[i], b = fs[j];
      const d = U.dist(a.x, a.y, b.x, b.y), min = (a.r + b.r) * 0.8;
      if (d < min && d > 0.01) { const push = (min - d) / 2, nx = (b.x - a.x) / d, ny = (b.y - a.y) / d; a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push; }
    }
  },
});

// física: además del terreno, las personas del mapa son obstáculos
const _physics2 = BattleScene.prototype.physics;
BattleScene.prototype.physics = function (f, dt, idle) {
  _physics2.call(this, f, dt, idle);
  if (!f || f.inBall || !this.field) return;
  // el jugador/entrenador es sólido; los NPC solo empujan suavemente (no bloquean pasillos)
  for (const [ox, oy, hard] of this.personObstacles()) {
    const d = U.dist(f.x, f.y, ox, oy), min = f.r * 0.8 + 6;
    if (d < min) {
      const nx = d > 0.01 ? (f.x - ox) / d : 1, ny = d > 0.01 ? (f.y - oy) / d : 0;
      if (hard) { f.x = ox + nx * min; f.y = oy + ny * min; if (f.dash) f.dash.left = 0; }
      else { const k = (min - d) * 0.12; f.x += nx * k; f.y += ny * k; }
    }
  }
};
// velocidad reducida mientras se carga un ataque
const _speedOf = BattleScene.prototype.speedOf;
BattleScene.prototype.speedOf = function (f) {
  const s = _speedOf.call(this, f);
  return f === this.ally && this.chg && this.chg.t > 0.15 ? s * 0.55 : s;
};
// ánimas alfa: más grandes y resistentes
const _mkFighter2 = BattleScene.prototype.mkFighter;
BattleScene.prototype.mkFighter = function (c, side) {
  const f = _mkFighter2.call(this, c, side);
  if (c.alpha) {
    f.size = Math.round(f.size * (side === 'foe' ? 1.3 : 1.12));
    f.r = Math.round(f.r * 1.25);
    if (side === 'foe') { const r = f.hp / f.maxHp; f.maxHp = Math.floor(f.maxHp * 1.7); f.hp = Math.max(1, Math.round(f.maxHp * r)); }
  }
  return f;
};
// al caer el rival principal, su criatura queda debilitada en la cola
const _onFoeFaint = BattleScene.prototype.onFoeFaint;
BattleScene.prototype.onFoeFaint = async function () {
  this.foe.c.hp = 0;
  return _onFoeFaint.call(this);
};
// recompensas por derrotar a un alfa y limpieza del Dúo al terminar
const _finish = BattleScene.prototype.finish;
BattleScene.prototype.finish = async function (result) {
  if (this.duoA) this.dismissDuo('A', true);
  if (this.duoF) this.dismissDuo('F', true);
  this.chg = null;
  const r = await _finish.call(this, result);
  if (result === 'win' && this.wild && this.foe.c.alpha) {
    const loot = [['mineral', 3], ['baya_dulce', 2]];
    if (Math.random() < 0.45) loot.push(['caramelo', 1]);
    const names = [];
    for (const [k, q] of loot) if (ITEMS[k]) { Game.give(k, q); names.push(`${ITEMS[k].name} ×${q}`); }
    if (names.length) await this.banner('¡Alfa derrotado! Obtienes: ' + names.join(', '), 2.2, '#ffd048');
  }
  return r;
};

// ---------- dibujo ----------
Object.assign(BattleScene.prototype, {
  // suelo: anillo, zonas, avisos, auras (debajo de las personas)
  drawGroundLayer(ctx, cx, cy) {
    ctx.save(); ctx.translate(-cx, -cy);
    this.drawArena(ctx);
    for (const a of this.areas) {
      if (a.done) continue;
      const k = a.t / a.delay, enemy = a.owner.side === 'foe';
      ctx.globalAlpha = 0.25 + k * 0.25;
      pixCircle(ctx, a.x, a.y, a.r * k, enemy ? (a.hazard ? '#ff2080' : '#ff4040') : TYPES[a.m.type].color);
      ctx.globalAlpha = 0.9;
      pixRing(ctx, a.x, a.y, a.r, enemy ? '#ff6060' : '#ffffff', 1);
      ctx.globalAlpha = 1;
    }
    for (const foe of [this.foe, this.duoF]) {
      if (!foe || !foe.act || foe.act.fired || foe.inBall || this.state !== 'fight') continue;
      const m = foe.act.m;
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(this.t * 30);
      if (m.kind === 'beam') { const L = this.rayLen(foe.x, foe.y, foe.ang, m.len); for (let d = 10; d < L; d += 6) pixCircle(ctx, foe.x + Math.cos(foe.ang) * d, foe.y + Math.sin(foe.ang) * d, m.width / 2, '#ff4040'); }
      else if (m.kind === 'ring') pixRing(ctx, foe.x, foe.y, m.radius, '#ff4040', 2);
      else if (m.kind === 'melee' || m.kind === 'dash') { const L = m.kind === 'dash' ? m.range : m.range + foe.r; for (let d = 8; d < L; d += 5) pixCircle(ctx, foe.x + Math.cos(foe.ang) * d, foe.y + Math.sin(foe.ang) * d, 4, '#ff4040'); }
      else if (m.kind === 'proj') for (let d = 10; d < 60; d += 8) pixCircle(ctx, foe.x + Math.cos(foe.ang) * d, foe.y + Math.sin(foe.ang) * d, 2, '#ff6060');
      ctx.globalAlpha = 1;
    }
    for (const e of this.fx) if (e.k === 'ring') {
      const k = e.t / e.dur;
      ctx.globalAlpha = 1 - k;
      pixRing(ctx, e.x, e.y, e.r * (0.3 + 0.7 * k), e.color, 3);
      pixRing(ctx, e.x, e.y, e.r * (0.3 + 0.7 * k) - 3, '#ffffff', 1);
      ctx.globalAlpha = 1;
    }
    // aura de carga del ataque
    if (this.chg && this.chg.t > 0.15 && this.ally) {
      const f = this.ally, mk = f.c.moves[this.chg.i], col = mk ? TYPES[MOVES[mk].type].color : '#ffffff';
      const k = Math.min(1, (this.chg.t - 0.28) / 0.7);
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(this.t * 25);
      pixRing(ctx, f.x, f.y - 2, 10 + 8 * Math.max(0, k), k >= 1 ? '#ffffff' : col, 2);
      ctx.globalAlpha = 1;
    }
    // aura de furia y del Dúo
    for (const f of this.fighters()) {
      if (f.inBall) continue;
      if (f.phase) { ctx.globalAlpha = 0.45 + 0.2 * Math.sin(this.t * 10); pixRing(ctx, f.x, f.y - 2, f.r + 6, f.phase === 2 ? '#ff40a0' : '#ff5030', 2); ctx.globalAlpha = 1; }
      if (f.duo) { ctx.globalAlpha = 0.6; pixRing(ctx, f.x, f.y, f.r + 3, f.side === 'ally' ? '#80d0ff' : '#ff9080', 1); ctx.globalAlpha = 1; }
      if (f.c.alpha && f.side === 'foe') { ctx.globalAlpha = 0.35 + 0.15 * Math.sin(this.t * 6); pixCircle(ctx, f.x, f.y, f.r + 4, '#ff2040'); ctx.globalAlpha = 1; }
    }
    ctx.restore();
  },
  // luchadores y entrenador: se ordenan por profundidad junto a las personas del mapa
  depthItems() {
    const out = [];
    for (const f of this.fighters()) if (!f.inBall) out.push({ y: f.y, draw: (ctx) => this.drawFighter(ctx, f) });
    if (this.trainer) out.push({ y: this.trainer.y, draw: (ctx) => this.drawTrainer(ctx) });
    return out;
  },
  // aire: proyectiles, efectos, partículas, esfera y puntería
  drawWorldLayer(ctx, cx, cy) {
    ctx.save(); ctx.translate(-cx, -cy);
    if (this.aiming && this.ally && this.aimDir) {
      const a = this.aimDir(), f = this.ally, AL = this.aimLen();
      for (let d = 14; d < AL; d += 9) {
        const z = Math.sin((d / AL) * Math.PI) * 22, blink = Math.floor(this.t * 12 + d / 9) % 2;
        P(ctx, Math.round(f.x + Math.cos(a) * d) - 1, Math.round(f.y - 4 + Math.sin(a) * d - z) - 1, 3, 3, blink ? '#ffffff' : '#ffe060');
      }
      pixRing(ctx, f.x + Math.cos(a) * AL, f.y + Math.sin(a) * AL, 6, '#ffe060', 1);
    }
    if (this.ball && this.ball.phase !== 'arc') {
      const b = this.ball;
      drawShadow(ctx, b.x, b.y + 2, 4, 1.5, 0.3);
      let ox = 0;
      if (b.phase === 'shake') ox = Math.round(Math.sin(b.t * 25) * (b.t < 0.35 ? 2 : 0));
      ctx.drawImage(Icons.sphere(ITEMS[b.kind].sphere, 10), Math.round(b.x - 5 + ox), Math.round(b.y - 5 - b.z));
      if (b.phase === 'shake') for (let i = 0; i < b.shakes; i++) P(ctx, Math.round(b.x - 6 + i * 5), Math.round(b.y - 14), 3, 3, '#ffe060');
    }
    for (const p of this.projs) this.drawProj(ctx, p);
    for (const e of this.fx) {
      const k = e.t / e.dur;
      if (e.k === 'slash') {
        ctx.globalAlpha = 1 - k;
        for (let i = -4; i <= 4; i++) { const a = e.ang + i * 0.28, rr = e.r * (0.7 + 0.3 * k); P(ctx, Math.round(e.x + Math.cos(a) * rr * 0.6) - 1, Math.round(e.y + Math.sin(a) * rr * 0.6) - 1, 3, 3, i % 2 ? '#ffffff' : e.color); }
        ctx.globalAlpha = 1;
      } else if (e.k === 'beam') {
        ctx.globalAlpha = 1 - k * 0.8;
        const ca = Math.cos(e.ang), sa = Math.sin(e.ang);
        for (let d = 10; d < e.len; d += 3) { const w = (e.w / 2) * (1 - k * 0.5) * (0.85 + 0.15 * Math.sin(d * 0.4 + this.t * 40)); pixCircle(ctx, e.x + ca * d, e.y + sa * d, w, e.color); pixCircle(ctx, e.x + ca * d, e.y + sa * d, Math.max(1, w * 0.45), '#ffffff'); }
        ctx.globalAlpha = 1;
      }
    }
    for (const p of this.parts) { ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.5); P(ctx, Math.round(p.x), Math.round(p.y), p.size, p.size, p.color); }
    ctx.globalAlpha = 1;
    if (this.drawCaptureAim) this.drawCaptureAim(ctx);
    ctx.restore();
  },
});
// HUD: Dúo, Sinergia, eficacia de los ataques y fase
const _drawHud2 = BattleScene.prototype.drawHud;
BattleScene.prototype.drawHud = function (ctx) {
  _drawHud2.call(this, ctx);
  const a = this.ally; if (!a) return;
  // mini paneles del Dúo
  const tags = this.foe ? [this.foe.c.alpha && 'ALFA', this.foe.phase && 'FURIA'].filter(Boolean).join(' · ') : '';
  const mini = (d, x, y = 40) => {
    UI.box(ctx, x, y, 104, 16, 'dark');
    ctx.drawImage(CreatureGfx.get(d.c.sp, 16, d.c.shiny), x + 2, y);
    const r = Math.max(0, d.hp) / d.maxHp;
    UI.bar(ctx, x + 22, y + 4, 58, 3, r, UI.hpColor(r));
    UI.bar(ctx, x + 22, y + 10, 58, 2, d.duoT / (d.side === 'foe' ? DUO_TIME * 0.8 : DUO_TIME), '#a0d0ff');
    Font.draw(ctx, Math.ceil(d.duoT) + 's', x + 84, y + 4, '#d0d0f0');
  };
  if (this.duoA) mini(this.duoA, HUD_L);
  if (this.duoF) mini(this.duoF, HUD_R + 46, tags ? 50 : 40);
  if (tags) Font.drawOutlined(ctx, tags, HUD_R + 150 - Font.width(tags), 40, '#ff7060', '#200000');
  if (this.capture) return;
};

// los líderes y jefes usan Hiperpociones cuando su ánima está en apuros
BattleScene.prototype.foeHeal = function (f) {
  if (f.side !== 'foe' || this.wild || f.inBall || f.hp <= 0 || this.state !== 'fight') return;
  if (this.foeHeals === undefined) this.foeHeals = this.opts.heals !== undefined ? this.opts.heals : (this.opts.gym || this.opts.boss) ? 2 : 0;
  if (this.foeHeals <= 0 || f.healed || f.hp > f.maxHp * 0.3 || f.act || f.dash) return;
  f.healed = true; this.foeHeals--;
  const h = Math.floor(f.maxHp * 0.5);
  f.hp = Math.min(f.maxHp, f.hp + h);
  this.addNum(f.x, f.y - 22, '+' + h, '#80ff80');
  this.sparkle(f.x, f.y - 8, '#a0ffa0', 16);
  Sound.sfx('heal');
  this.banner(`¡${this.opts.title || 'El rival'} usa una Hiperpoción!`, 1.2, '#a0ffa0');
};
