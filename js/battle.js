'use strict';
// ============================================================
//  Combate en TIEMPO REAL
//  - Mueves a tu ánima por la arena (WASD/flechas)
//  - Ataques 1-4 / J K L I con tiempo de recarga
//  - Esquiva con ESPACIO (invulnerable un instante)
//  - E: modo captura (controlas al entrenador y lanzas esferas)
//  - F: Arte Ánima cuando la barra de Sinergia está llena
//  - Q: cambiar de ánima · Intro/Esc: pausa
// ============================================================

const ARENA = { x0: 14, y0: 40, x1: 306, y1: 194 };
const stageMul = (s) => (s >= 0 ? (3 + s) / 3 : 3 / (3 - s));
const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const RANGED = { proj: 1, beam: 1, area: 1, ring: 1 };
const CLASS_PAY = { Joven: 15, Chica: 15, Cazabichos: 12, Montañero: 25, Exploradora: 20, 'Recluta Eclipse': 25, Comandante: 60, Líder: 100, Rival: 40, Pescador: 25, Jardinera: 20, Jardinero: 20, Marinero: 25, Nadador: 20, Minero: 20 };

function pixCircle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  r = Math.max(0.5, r);
  for (let yy = -Math.ceil(r); yy <= Math.ceil(r); yy++) {
    const w = Math.round(Math.sqrt(Math.max(0, r * r - yy * yy)));
    if (w > 0 || Math.abs(yy) < r) ctx.fillRect(Math.round(x - w), Math.round(y + yy), Math.max(1, w * 2), 1);
  }
}
function pixRing(ctx, x, y, r, color, th = 2) {
  ctx.fillStyle = color;
  const n = Math.max(12, Math.floor(r * 1.6));
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; ctx.fillRect(Math.round(x + Math.cos(a) * r - th / 2), Math.round(y + Math.sin(a) * r - th / 2), th, th); }
}

// ---------- fondos de arena ----------
const BattleBg = {
  cache: {},
  get(kind) {
    if (this.cache[kind]) return this.cache[kind];
    const [c, x] = U.makeCanvas(W, H);
    const fillTiles = (t, alt) => { for (let ty = 0; ty < 15; ty++) for (let tx = 0; tx < 20; tx++) x.drawImage(Tiles.get(alt && hash2(tx, ty) < 0.15 ? alt : t, 0, Math.floor(hash2(tx, ty) * 3)), tx * 16, ty * 16); };
    const border = (t) => { for (let tx = 0; tx < 20; tx++) { x.drawImage(Tiles.get(t, 0, tx % 3), tx * 16, 16); x.drawImage(Tiles.get(t, 0, (tx + 1) % 3), tx * 16, 196); x.drawImage(Tiles.get(t, 0, (tx + 2) % 3), tx * 16, 212); } for (let ty = 1; ty < 15; ty++) { x.drawImage(Tiles.get(t, 0, ty % 3), -8, ty * 16); x.drawImage(Tiles.get(t, 0, ty % 3), 312, ty * 16); } };
    if (kind === 'grass' || kind === 'forest') { fillTiles('grass', 'flower'); border('tree'); if (kind === 'forest') { x.globalAlpha = 0.18; P(x, 0, 0, W, H, '#103020'); x.globalAlpha = 1; } }
    else if (kind === 'cave') { fillTiles('cave'); border('cavewall'); }
    else if (kind === 'city') { fillTiles('path'); border('rock'); }
    else if (kind === 'beach') { fillTiles('sand'); for (let tx = 0; tx < 20; tx++) for (let ty = 12; ty < 15; ty++) x.drawImage(Tiles.get('water', 0), tx * 16, ty * 16); border('tree'); }
    else if (kind === 'gym1') { fillTiles('gymfloor'); border('hedge'); }
    else if (kind === 'gym2') { fillTiles('cave'); border('caverock'); }
    else if (kind === 'gym3') { fillTiles('gymfloor'); for (let tx = 0; tx < 20; tx++) { x.drawImage(Tiles.get('cavewater', 0), tx * 16, 196); x.drawImage(Tiles.get('cavewater', 0), tx * 16, 212); } }
    else if (kind === 'legend') { fillTiles('grass', 'flower'); x.globalAlpha = 0.35; P(x, 0, 0, W, H, '#402060'); x.globalAlpha = 1; border('tree'); }
    else { fillTiles('tilefloor'); }
    // líneas de la arena
    x.globalAlpha = 0.28;
    P(x, ARENA.x0, ARENA.y0, ARENA.x1 - ARENA.x0, 1, '#ffffff'); P(x, ARENA.x0, ARENA.y1, ARENA.x1 - ARENA.x0, 1, '#ffffff');
    P(x, ARENA.x0, ARENA.y0, 1, ARENA.y1 - ARENA.y0, '#ffffff'); P(x, ARENA.x1, ARENA.y0, 1, ARENA.y1 - ARENA.y0, '#ffffff');
    P(x, 160, ARENA.y0, 1, ARENA.y1 - ARENA.y0, '#ffffff');
    pixRing(x, 160, 117, 24, '#ffffff', 1);
    x.globalAlpha = 1;
    this.cache[kind] = c; return c;
  },
};

// ---------- modificadores de talentos y amuletos ----------
function fighterMods(c) {
  const t = c.talents || {};
  const h = c.held ? ITEMS[c.held] : null;
  const m = {
    melee: 1 + 0.06 * (t.fuerza || 0), ranged: 1 + 0.06 * (t.punteria || 0), crit: 0.05 * (t.ferocidad || 0),
    furia: 0.2 * (t.furia || 0), cd: 1 - 0.06 * (t.celeridad || 0), contra: t.contra || 0,
    taken: 1 - 0.05 * (t.piel || 0), regen: 0.006 * (t.regen || 0), speed: 1, typeBoost: {}, syn: 1, berry: false,
  };
  if (h) {
    if (h.boostType) m.typeBoost[h.boostType] = 1.2;
    if (h.speed) m.speed *= h.speed;
    if (h.critAdd) m.crit += h.critAdd;
    if (h.taken) m.taken *= h.taken;
    if (h.cdMul) m.cd *= h.cdMul;
    if (h.synMul) m.syn *= h.synMul;
    if (h.autoBerry) m.berry = true;
  }
  return m;
}

// ---------- escena de combate ----------
class BattleScene {
  constructor(opts) {
    this.opts = opts; this.opaque = true;
    this.wild = !!opts.wild;
    this.bg = BattleBg.get(opts.bg || 'grass');
    this.foeQueue = this.wild ? [opts.wild] : opts.party.map(([k, lv]) => newCreature(k, lv));
    this.foeIdx = 0;
    this.projs = []; this.fx = []; this.parts = []; this.nums = []; this.areas = []; this.banners = [];
    this.waiters = []; this.state = 'intro'; this.event = null; this.t = 0;
    this.hitStop = 0; this.slowT = 0; this.timeScale = 1;
    this.participants = new Set();
    this.pendingLv = new Map(); // uid -> eventos de nivel
    this.leveled = new Set();
    this.ball = null; this.aiming = false; this.throwCd = 0; this.ballSel = 0;
    this.swapCd = 0; this.fleeTries = 0; this.noCatchMsg = 0;
    this.obstacles = [];
    if (opts.bg === 'cave' || opts.bg === 'gym2') this.obstacles = [{ x: 120, y: 80, r: 10 }, { x: 205, y: 158, r: 10 }];
    if (opts.bg === 'forest') this.obstacles = [{ x: 160, y: 70, r: 9 }, { x: 160, y: 165, r: 9 }];
    this.ally = null; this.foe = null;
    this.expTotal = 0;
  }
  until(cond) { return new Promise((res) => this.waiters.push({ cond, res })); }

  mkFighter(c, side) {
    const sp = SPECIES[c.sp];
    const st = calcStats(c);
    const boss = side === 'foe' && (this.opts.boss || sp.legendary);
    const hpMul = boss ? (sp.legendary ? 2.0 : 1.5) : 1;
    const maxHp = Math.floor(st.hp * hpMul);
    return {
      c, side, sp, st, mods: fighterMods(c), types: sp.types,
      x: side === 'ally' ? 80 : 240, y: 118, vx: 0, vy: 0, ang: side === 'ally' ? 0 : Math.PI,
      r: Math.round((8 + (sp.look.size || 1) * 5) * (sp.legendary ? 1.35 : 1)), size: sp.legendary ? 64 : 48,
      maxHp, hp: side === 'ally' ? c.hp : Math.max(1, Math.round(maxHp * (c.hp / st.hp))),
      cds: [0, 0, 0, 0], dodgeCd: 0, dodgeT: 0, invuln: 0.8, stun: 0, status: {}, stages: { atk: 0, def: 0, esp: 0, vel: 0 },
      act: null, dash: null, flash: 0, syn: 0, contraT: 0, berryUsed: false, regenAcc: 0, fainted: false, inBall: false,
      ai: { think: 0.6, want: null, dodgeCd: 1, strafe: U.chance(0.5) ? 1 : -1, wander: 0 }, spawnT: 0, boss, dmgDealt: 0,
    };
  }

  // ---------- director (flujo del combate) ----------
  async run() {
    const o = this.opts;
    if (this.wild) {
      Sound.music(SPECIES[o.wild.sp].legendary ? 'boss' : 'battle');
      this.foe = this.mkFighter(o.wild, 'foe'); this.foe.spawnT = 0.01;
      Game.markSeen(o.wild.sp);
      if (o.wild.shiny) { this.sparkle(this.foe.x, this.foe.y, '#fff8a0', 30); Sound.sfx('super'); }
      await this.banner(SPECIES[o.wild.sp].legendary ? `¡El legendario ${SPECIES[o.wild.sp].name} te desafía!` : `¡Un ${SPECIES[o.wild.sp].name}${o.wild.shiny ? ' brillante' : ''} salvaje apareció!`, 1.4);
    } else {
      Sound.music(o.music || (o.boss ? 'boss' : 'trainer'));
      this.portrait = { look: o.look || 'boy', t: 0 };
      await this.banner(`¡${o.title} quiere luchar!`, 1.4);
      await this.sendFoe();
      this.portrait = null;
    }
    const lead = G.party.findIndex((c) => c.hp > 0);
    await this.sendAlly(lead);
    if (!Game.flag('tut_battle')) { await this.tutorial(); Game.setFlag('tut_battle'); }
    const wx = Weather.at(MAPS[G.map]);
    if (Weather.isRain(wx)) this.banner(wx === 'tormenta' ? 'Tormenta: Agua y Eléctrico se potencian' : 'Lluvia: el Agua se potencia y el Fuego se debilita', 1.6, '#a0c8ff');
    this.state = 'fight';
    this.banner('¡A luchar!', 0.8, '#ffd048');
    while (true) {
      await this.until(() => this.event);
      const ev = this.event; this.event = null;
      if (ev === 'foeFaint') {
        this.state = 'pause';
        await this.onFoeFaint();
        if (this.promoteDuoFoe()) { this.state = 'fight'; continue; }
        const nx = this.nextFoeIdx();
        if (nx < 0) return this.finish('win');
        this.foeIdx = nx;
        await this.sendFoe();
        this.state = 'fight';
      } else if (ev === 'allyFaint') {
        this.state = 'pause';
        G.party.forEach((c) => { if (c === this.ally.c) c.bond = Math.max(0, c.bond - 3); });
        await this.banner(`¡${cName(this.ally.c)} se debilitó!`, 1.2, '#ff8080');
        if (Game.aliveCount() === 0) return this.finish('lose');
        const k = await runScene(new PartyScreen('select', { msg: '¿Qué ánima sacas?', noCancel: true, filter: (c) => (c.hp <= 0 ? '¡Está debilitada!' : null) }));
        await this.sendAlly(k);
        this.state = 'fight';
      } else if (ev === 'caught') { return this.finish('caught'); }
      else if (ev === 'fled') { return this.finish('run'); }
    }
  }

  async sendFoe() {
    const c = this.foeQueue[this.foeIdx];
    this.foe = this.mkFighter(c, 'foe');
    this.foe.spawnT = 0.01;
    Game.markSeen(c.sp);
    Sound.sfx('appear');
    this.sparkle(this.foe.x, this.foe.y, '#ffffff', 14);
    await this.banner(`${this.opts.title} envía a ${SPECIES[c.sp].name} (Nv ${c.lv})`, 1.1);
  }
  async sendAlly(idx) {
    const c = G.party[idx];
    const old = this.ally;
    const f = this.mkFighter(c, 'ally');
    if (old) { f.x = old.x; f.y = old.y; f.ang = old.ang; f.syn = Math.floor(old.syn / 2); }
    this.ally = f; f.spawnT = 0.01; f.invuln = 1;
    this.participants.add(c.uid);
    Sound.sfx('appear');
    this.sparkle(f.x, f.y, '#a0e0ff', 14);
    await this.banner(`¡Adelante, ${cName(c)}!`, 0.8);
  }
  async tutorial() {
    this.showTut = true;
    await wait(0.3);
    await this.until(() => Input.pressed('a') || Input.pressed('start'));
    Sound.sfx('select');
    this.showTut = false;
  }

  async onFoeFaint() {
    const f = this.foe;
    Sound.sfx('faint');
    this.slow(0.6, 0.35);
    await this.banner(`¡${SPECIES[f.c.sp].name} enemigo se debilitó!`, 1.1);
    // experiencia
    const total = expYield(f.c, !this.wild);
    const parts = G.party.filter((c) => c.hp > 0 && this.participants.has(c.uid));
    const others = G.party.filter((c) => c.hp > 0 && !this.participants.has(c.uid));
    const share = Math.max(1, Math.floor(total / Math.max(1, parts.length)));
    const lines = [];
    for (const c of parts) lines.push([c, share]);
    for (const c of others) lines.push([c, Math.max(1, Math.floor(total * 0.3))]);
    for (const [c, amt] of lines) {
      const evs = gainExp(c, amt);
      this.expTotal += amt;
      if (c === this.ally.c) this.addNum(this.ally.x, this.ally.y - 26, `+${amt} EXP`, '#80e0ff');
      if (evs.length) {
        const prev = this.pendingLv.get(c.uid) || [];
        this.pendingLv.set(c.uid, prev.concat(evs));
        this.leveled.add(c.uid);
        const lvUp = evs.filter((e) => e.lv).pop();
        if (lvUp) {
          Sound.sfx('exp');
          await this.banner(`¡${cName(c)} subió al Nv ${lvUp.lv}!`, 1.0, '#a0ff90');
          if (c === this.ally.c) {
            const st = calcStats(c);
            this.ally.st = st; this.ally.maxHp = st.hp; this.ally.hp = c.hp;
          }
        }
      }
    }
    this.participants = new Set([this.ally.c.uid]);
  }

  async finish(result) {
    this.state = 'end';
    const o = this.opts;
    this.ally && (this.ally.c.hp = Math.max(0, Math.ceil(this.ally.hp)));
    if (result === 'win') {
      Sound.music('victory');
      for (const c of G.party) if (this.participants.has(c.uid) || c.hp > 0) c.bond = Math.min(255, c.bond + 2);
      if (!this.wild) {
        const pay = o.practice ? 0 : (CLASS_PAY[o.cls] || 20) * this.foeQueue[this.foeQueue.length - 1].lv;
        G.money += pay;
        await this.banner(`¡Has derrotado a ${o.title}!`, 1.4, '#ffd048');
        if (pay) await this.banner(`Recibes $${pay} por la victoria.`, 1.2);
      } else await this.banner('¡Victoria!', 1.0, '#ffd048');
    } else if (result === 'lose') {
      await this.banner('No te quedan ánimas en condiciones...', 1.6, '#ff8080');
    } else if (result === 'run') {
      Sound.sfx('dodge');
      await this.banner(this.foeLeft ? '...' : '¡Escapaste sin problemas!', 1.0);
    } else if (result === 'caught') {
      Sound.jingle('catch');
      const c = this.foe.c;
      c.hp = Math.max(1, Math.round(calcStats(c).hp * (this.foe.hp / this.foe.maxHp)));
      await this.banner(`¡Has capturado a ${SPECIES[c.sp].name}!`, 2.2, '#ffd048');
      // también da experiencia
      const total = expYield(c, false);
      for (const p of G.party.filter((x) => x.hp > 0 && this.participants.has(x.uid))) {
        const evs = gainExp(p, total);
        if (evs.length) { this.pendingLv.set(p.uid, (this.pendingLv.get(p.uid) || []).concat(evs)); this.leveled.add(p.uid); }
      }
    }
    return result;
  }

  // ---------- banners ----------
  banner(text, dur = 1.2, color = '#ffffff') {
    this.banners.push({ text, t: 0, dur, color });
    return wait(dur);
  }
  addNum(x, y, text, color) { this.nums.push({ x, y, text, color, t: 0 }); }
  sparkle(x, y, color, n = 10) {
    for (let i = 0; i < n; i++) { const a = U.rand(Math.PI * 2), s = U.rand(30, 90); this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(0.3, 0.7), max: 0.7, color, size: U.randi(1, 2) }); }
  }
  burst(x, y, type, n = 12, spd = 80) {
    const col = TYPES[type].color, light = U.shade(col, 0.25);
    for (let i = 0; i < n; i++) { const a = U.rand(Math.PI * 2), s = U.rand(spd * 0.3, spd); this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(0.25, 0.55), max: 0.55, color: i % 2 ? col : light, size: U.randi(1, 3) }); }
  }
  slow(dur, scale) { this.slowT = dur; this.timeScale = scale; }

  // ---------- actualización ----------
  update(dt0) {
    this.t += dt0;
    Clock.update(dt0); if (G) G.playTime += dt0;
    if (World.map) { Weather.update(dt0, Weather.at(World.map)); Ambient.update(dt0, World); }
    for (let i = this.waiters.length - 1; i >= 0; i--) if (this.waiters[i].cond()) { const w = this.waiters.splice(i, 1)[0]; w.res(); }
    for (const b of this.banners) b.t += dt0;
    this.banners = this.banners.filter((b) => b.t < b.dur);
    this.noCatchMsg = Math.max(0, this.noCatchMsg - dt0);
    if (this.slowT > 0) { this.slowT -= dt0; if (this.slowT <= 0) this.timeScale = 1; }
    let dt = dt0 * this.timeScale;
    if (this.hitStop > 0) { this.hitStop -= dt0; dt = 0; }
    this.updateVisuals(dt0);
    for (const f of [this.ally, this.foe]) if (f && f.spawnT > 0) { f.spawnT += dt0; if (f.spawnT > 0.4) f.spawnT = 0; }
    if (this.state !== 'fight') { if (this.ally) this.physics(this.ally, dt, true); if (this.foe) this.physics(this.foe, dt, true); return; }
    Input.mouseCapture = true; // en combate, los clics son ataques
    if (Input.pressed('start')) { this.pauseMenu(); return; }
    if (Input.pressed('swap')) { this.quickSwap(); return; }
    this.throwCd = Math.max(0, this.throwCd - dt);
    this.swapCd = Math.max(0, this.swapCd - dt);
    this.controlAlly(dt);
    this.updateFighters(dt);
    this.separate();
    this.updateProjs(dt);
    this.updateAreas(dt);
    this.updateBall(dt);
    this.ally.c.hp = Math.max(0, Math.ceil(this.ally.hp));
    if (this.wild && !this.ball && this.t - (this.lastDmgT || this.t0 || (this.t0 = this.t)) > 25 && !SPECIES[this.foe.c.sp].legendary) { this.state = 'pause'; this.foeLeft = true; this.banner(`¡${SPECIES[this.foe.c.sp].name} salvaje se ha marchado!`, 1.4); this.event = 'fled'; return; }
    if (this.foe.hp <= 0 && !this.foe.fainted) { this.foe.fainted = true; this.event = 'foeFaint'; this.state = 'pause'; }
    else if (this.ally.hp <= 0 && !this.ally.fainted) { this.ally.fainted = true; this.ally.c.hp = 0; this.event = 'allyFaint'; this.state = 'pause'; }
  }

  updateVisuals(dt) {
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt; p.vx *= 0.96; p.vy *= 0.96; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const n of this.nums) { n.t += dt; n.y -= 22 * dt; }
    this.nums = this.nums.filter((n) => n.t < 0.9);
    for (const e of this.fx) e.t += dt;
    this.fx = this.fx.filter((e) => e.t < e.dur);
  }

  // ---------- control del jugador ----------
  controlAlly(dt) {
    const f = this.ally;
    if (f.stun > 0 || f.act || f.dash || f.dodgeT > 0) { if (f.dodgeT <= 0 && !f.dash) { f.vx *= 0.8; f.vy *= 0.8; } return; }
    let [ax, ay] = Input.axis();
    if (f.status.confuse > 0) { ax = -ax; ay = -ay; }
    const spd = this.speedOf(f) * (this.aiming ? 0.55 : 1);
    const mouse = Input.usingMouse(), M = Input.mouse;
    if (ax || ay) {
      const l = Math.hypot(ax, ay); f.vx = (ax / l) * spd; f.vy = (ay / l) * spd;
      if (!mouse) { if (!this.aiming) f.ang = Math.atan2(ay, ax); else f.aimAng = Math.atan2(ay, ax); }
    } else { f.vx *= 0.7; f.vy *= 0.7; }
    // con ratón: se apunta siempre hacia el cursor
    if (mouse) { const [wx, wy] = this.mouseWorld(); f.ang = Math.atan2(wy - f.y, wx - f.x); f.aimAng = f.ang; }
    // esquiva
    if (Input.pressed('dodge') && f.dodgeCd <= 0) {
      const a = ax || ay ? Math.atan2(ay, ax) : f.ang;
      f.dodgeT = 0.24; f.dodgeCd = 0.75 * (f.mods.cd < 1 ? 0.92 : 1); f.invuln = Math.max(f.invuln, 0.2); f.dodgeAng = a;
      f.vx = Math.cos(a) * 230; f.vy = Math.sin(a) * 230;
      Sound.sfx('dodge');
      return;
    }
    // ataques
    if (this.handleAttackInput(f, dt)) return;
    if (Input.pressed('ult')) { if (f.syn >= 100) this.ultimate(f); else Sound.sfx('bump'); return; }
    if (Input.pressed('duo')) { this.invokeDuo('ally'); return; }
    // ratón: clic en la barra inferior
    if ((M.pressed[0] || M.pressed[2]) && M.y >= 202) {
      if (M.x < 255) { const i = U.clamp(Math.floor((M.x - 3) / 63), 0, 3); if (f.c.moves[i]) { this.startMove(f, i); return; } }
      else if (M.y >= 223) { if (M.x >= 287) this.invokeDuo('ally'); else if (f.syn >= 100) this.ultimate(f); else Sound.sfx('bump'); return; }
    }
    // esferas: E (o botón central) activa el modo captura, en el que controlas al entrenador
    if (Input.pressed('cycle') || M.wheel) { this.cycleBall(); }
    if (Input.pressed('ball') || M.pressed[1]) { this.enterCapture(); return; }
  }
  speedOf(f) {
    let s = (55 + f.st.vel * 0.55) * stageMul(f.stages.vel) * f.mods.speed;
    if (f.status.para > 0) s *= 0.55;
    if (f.status.slow > 0) s *= 0.6;
    return U.clamp(s, 40, 160) * (f.boss && f.sp.legendary ? 0.9 : 1);
  }

  // ---------- acciones ----------
  startMove(f, i, chargeMul = 1) {
    const mk = f.c.moves[i]; const m = MOVES[mk];
    if (!m || f.cds[i] > 0 || f.stun > 0 || f.act || f.dash) return false;
    const tgt = this.targetOf(f);
    // apuntado asistido
    if (tgt && !tgt.inBall && (RANGED[m.kind] || m.kind === 'melee' || m.kind === 'dash')) {
      const a = angTo(f, tgt), d = Math.abs(U.angDiff(f.ang, a));
      if (d < (f.side === 'ally' ? (Input.usingMouse() ? 0.22 : 0.7) : 1.2) || m.kind === 'ring') f.ang = a;
    }
    if (f.side === 'foe' && tgt && this.inGrass(tgt)) f.ang += U.rand(-0.35, 0.35); // la hierba alta dificulta apuntar
    let windup = m.windup || 0.06;
    if (f.side === 'foe') windup = Math.max(windup, f.ai.tele || 0.3);
    if (f.status.para > 0 && U.chance(0.15)) { f.cds[i] = 0.6; this.addNum(f.x, f.y - 20, '¡Paralizado!', '#ffe060'); return false; }
    f.cds[i] = m.cd * f.mods.cd * (f.status.para > 0 ? 1.25 : 1);
    f.act = { mk, m, t: 0, windup, i, fired: false, rec: 0.12, chargeMul };
    if (chargeMul > 1) this.addNum(f.x, f.y - 30, '¡Cargado!', '#ffe080');
    f.vx *= 0.3; f.vy *= 0.3;
    if (windup > 0.2) Sound.sfx('charge');
    return true;
  }
  tickFighter(f, dt) {
    if (f.inBall) return;
    for (let i = 0; i < 4; i++) f.cds[i] = Math.max(0, f.cds[i] - dt);
    f.dodgeCd = Math.max(0, f.dodgeCd - dt); f.invuln = Math.max(0, f.invuln - dt); f.flash = Math.max(0, f.flash - dt);
    f.stun = Math.max(0, f.stun - dt); f.contraT = Math.max(0, f.contraT - dt);
    if (f.dodgeT > 0) { f.dodgeT -= dt; if (f.dodgeT <= 0) { f.vx *= 0.3; f.vy *= 0.3; } }
    // estados
    for (const k in f.status) {
      f.status[k] -= dt;
      if (k === 'burn' || k === 'poison') {
        f.dotAcc = (f.dotAcc || 0) + dt;
        if (f.dotAcc >= 1) { f.dotAcc -= 1; const d = Math.max(1, Math.floor(f.maxHp * (k === 'burn' ? 0.04 : 0.05))); f.hp -= d; this.addNum(f.x, f.y - 16, '-' + d, k === 'burn' ? '#ff9040' : '#c070f0'); f.flash = 0.1; }
      }
      if (f.status[k] <= 0) delete f.status[k];
    }
    if (f.mods.regen > 0 && f.hp > 0 && f.hp < f.maxHp) { f.hp = Math.min(f.maxHp, f.hp + f.maxHp * f.mods.regen * dt); }
    if (f.mods.berry && !f.berryUsed && f.hp > 0 && f.hp < f.maxHp * 0.3) {
      f.berryUsed = true; const h = Math.floor(f.maxHp * 0.3); f.hp += h; this.addNum(f.x, f.y - 22, '+' + h, '#80ff80'); Sound.sfx('heal');
      this.banner(`¡${cName(f.c)} usó su Baya Auto!`, 1);
    }
    // acción en curso
    const a = f.act;
    if (a) {
      a.t += dt;
      if (!a.fired && a.t >= a.windup) { a.fired = true; this.execMove(f, a); }
      if (a.fired && !f.dash && a.t >= a.windup + a.rec) f.act = null;
      if (f.stun > 0) f.act = null;
    }
    // carga (dash)
    if (f.dash) {
      const d = f.dash;
      const step = d.speed * dt;
      d.left -= step;
      f.vx = Math.cos(d.ang) * d.speed; f.vy = Math.sin(d.ang) * d.speed;
      if (!d.hit) for (const tgt of this.enemiesOf(f)) if (U.dist(f.x, f.y, tgt.x, tgt.y) < f.r + tgt.r + 2) { d.hit = true; this.hit(tgt, f, d.m, d.cm || 1, d.ang); d.left = Math.min(d.left, 8); break; }
      if (Engine.frame % 2 === 0) this.parts.push({ x: f.x, y: f.y, vx: 0, vy: 0, life: 0.25, max: 0.25, color: U.shade(TYPES[d.m.type].color, 0.2), size: 3 });
      if (d.left <= 0) { f.dash = null; f.vx *= 0.2; f.vy *= 0.2; }
    }
  }
  execMove(f, a) {
    const m = a.m, tgt = this.targetOf(f), cm = a.chargeMul || 1;
    this.terrainFromMove(f, m, cm);
    const ca = Math.cos(f.ang), sa = Math.sin(f.ang);
    const sfx = { fuego: 'fire', agua: 'water', planta: 'leaf', electrico: 'zap', roca: 'rock', viento: 'wind', mente: 'mind', sombra: 'shadow', bicho: 'leaf', normal: 'swing' }[m.type];
    switch (m.kind) {
      case 'melee': {
        Sound.sfx('swing');
        f.x += ca * 6; f.y += sa * 6;
        this.fx.push({ k: 'slash', x: f.x + ca * (f.r + 4), y: f.y + sa * (f.r + 4), ang: f.ang, r: m.range, t: 0, dur: 0.18, color: TYPES[m.type].color });
        for (const tgt of this.enemiesOf(f)) {
          const d = U.dist(f.x, f.y, tgt.x, tgt.y);
          const da = Math.abs(U.angDiff(f.ang, angTo(f, tgt)));
          if (d <= m.range * (cm > 1 ? 1.25 : 1) + f.r + tgt.r && (da < 1.25 || d < f.r + tgt.r + 2)) this.hit(tgt, f, m, cm, f.ang);
        }
        break;
      }
      case 'dash':
        Sound.sfx('swing');
        f.dash = { ang: f.ang, speed: 260 * (m.speed || 1), left: m.range * (cm > 1 ? 1.3 : 1), m, hit: false, cm };
        break;
      case 'proj': {
        Sound.sfx(m.type === 'normal' ? 'shoot' : sfx);
        const n = m.n || 1;
        for (let k = 0; k < n; k++) {
          const off = n > 1 ? (k - (n - 1) / 2) * (m.spread || 0.3) : 0;
          const ang = f.ang + off;
          this.projs.push({ x: f.x + Math.cos(ang) * (f.r + 2), y: f.y + Math.sin(ang) * (f.r + 2), vx: Math.cos(ang) * m.speed, vy: Math.sin(ang) * m.speed, r: m.size * (cm > 1 ? 1.4 : 1), owner: f, m, life: 2.2, spin: 0, cm });
        }
        break;
      }
      case 'beam': {
        Sound.sfx(sfx); Shake.start(1, 0.15);
        const len = this.rayLen(f.x, f.y, f.ang, m.len);
        this.fx.push({ k: 'beam', x: f.x, y: f.y, ang: f.ang, len, w: m.width, t: 0, dur: 0.3, color: TYPES[m.type].color });
        for (const tgt of this.enemiesOf(f)) {
          const dx = tgt.x - f.x, dy = tgt.y - f.y;
          const along = dx * ca + dy * sa, perp = Math.abs(-dx * sa + dy * ca);
          if (along > 0 && along < len + tgt.r && perp < m.width / 2 + tgt.r) this.hit(tgt, f, m, cm, f.ang);
        }
        break;
      }
      case 'area': {
        let tx, ty;
        if (tgt && !tgt.inBall && U.dist(f.x, f.y, tgt.x, tgt.y) < 190) { tx = tgt.x + tgt.vx * 0.15; ty = tgt.y + tgt.vy * 0.15; }
        else { tx = f.x + ca * 100; ty = f.y + sa * 100; }
        [tx, ty] = this.clampPoint(tx, ty, 8);
        this.areas.push({ x: tx, y: ty, r: m.radius * (cm > 1 ? 1.25 : 1), delay: m.delay || 0.5, t: 0, owner: f, m, cm });
        break;
      }
      case 'ring':
        Sound.sfx(sfx);
        this.fx.push({ k: 'ring', x: f.x, y: f.y, r: m.radius, t: 0, dur: 0.35, color: TYPES[m.type].color });
        for (const tgt of this.enemiesOf(f)) if (U.dist(f.x, f.y, tgt.x, tgt.y) <= m.radius * (cm > 1 ? 1.2 : 1) + tgt.r) this.hit(tgt, f, m, cm, angTo(f, tgt));
        break;
      case 'buff': {
        Sound.sfx('buff');
        if (m.buff) for (const k in m.buff) { f.stages[k] = U.clamp(f.stages[k] + m.buff[k], -3, 3); this.addNum(f.x, f.y - 22, ({ atk: 'Ataque', def: 'Defensa', esp: 'Especial', vel: 'Velocidad' })[k] + ' ↑', '#80d0ff'); }
        if (m.debuff && tgt && U.dist(f.x, f.y, tgt.x, tgt.y) < m.radius) { tgt.stages[m.debuff] = Math.max(-3, tgt.stages[m.debuff] - 1); this.addNum(tgt.x, tgt.y - 22, 'Ataque ↓', '#ff9090'); }
        if (m.invuln) { f.invuln = m.invuln; f.veil = m.invuln; }
        this.fx.push({ k: 'ring', x: f.x, y: f.y, r: m.debuff ? m.radius : 22, t: 0, dur: 0.4, color: m.debuff ? '#ff9090' : '#90d0ff' });
        break;
      }
      case 'heal': {
        Sound.sfx('heal');
        const h = Math.floor(f.maxHp * m.heal); f.hp = Math.min(f.maxHp, f.hp + h);
        this.addNum(f.x, f.y - 22, '+' + h, '#80ff80');
        this.sparkle(f.x, f.y, '#a0ffa0', 16);
        break;
      }
      case 'blink': {
        Sound.sfx('mind');
        this.sparkle(f.x, f.y, '#ffa0d0', 10);
        this.blinkTo(f, f.x + ca * m.range, f.y + sa * m.range);
        f.invuln = Math.max(f.invuln, 0.3);
        this.sparkle(f.x, f.y, '#ffa0d0', 10);
        break;
      }
      case 'stealth': {
        if (!tgt || tgt.inBall) break;
        Sound.sfx('shadow');
        this.sparkle(f.x, f.y, '#8060c0', 10);
        const ba = tgt.ang + Math.PI;
        this.blinkTo(f, tgt.x + Math.cos(ba) * (tgt.r + f.r + 2), tgt.y + Math.sin(ba) * (tgt.r + f.r + 2));
        f.ang = angTo(f, tgt);
        this.fx.push({ k: 'slash', x: tgt.x, y: tgt.y, ang: f.ang, r: 18, t: 0, dur: 0.2, color: TYPES.sombra.color });
        this.hit(tgt, f, m, cm, f.ang);
        break;
      }
    }
  }
  ultimate(f) {
    if (f.act || f.dash || f.stun > 0) return;
    f.syn = 0;
    const type = f.types[0];
    const st = f.st;
    const m = { name: 'Arte Ánima', type, kind: 'ring', cat: st.atk >= st.esp ? 'fis' : 'esp', pow: 130, radius: 95, crit: 0.2 };
    f.act = { mk: 'arte', m, t: 0, windup: 0.5, i: -1, fired: false, rec: 0.2 };
    f.invuln = Math.max(f.invuln, 0.7);
    Sound.sfx('charge');
    this.slow(0.5, 0.4);
    this.banner(`¡${cName(f.c)} desata su ARTE ÁNIMA!`, 1.2, TYPES[type].color === '#9c9484' ? '#ffffff' : U.shade(TYPES[type].color, 0.25));
    f.act.ult = true;
  }

  // ---------- impacto ----------
  hit(tgt, att, m, mult = 1, ang = 0) {
    if (tgt.fainted || tgt.inBall) return;
    if (tgt.invuln > 0 || tgt.dodgeT > 0) {
      if (tgt.dodgeT > 0 || (tgt.invuln > 0 && !tgt.veil)) {
        if (tgt.side === 'ally' && tgt.dodgeT > 0 && !tgt.perfectT) {
          tgt.c.style.tem++;
          tgt.syn = Math.min(100, tgt.syn + 12 * tgt.mods.syn);
          if (tgt.mods.contra) tgt.contraT = 3;
          this.addNum(tgt.x, tgt.y - 20, '¡ESQUIVA!', '#a0e8ff');
          this.slow(0.35, 0.35);
          tgt.perfectT = true; Timers.wait(0.3).then(() => { tgt.perfectT = false; });
          tgt.counterT = 1.6; this.addNum(tgt.x, tgt.y - 32, '¡Contraataca!', '#ffe080');
        } else if (tgt.side === 'foe') this.addNum(tgt.x, tgt.y - 20, 'Esquivó', '#d0d0d0');
      }
      return;
    }
    const fis = m.cat === 'fis';
    const mods = { atkMul: stageMul(att.stages[fis ? 'atk' : 'esp']), defMul: stageMul(tgt.stages[fis ? 'def' : 'esp']), critAdd: att.mods.crit };
    const r = calcDamage(att.c, tgt.c, m, att.st, tgt.st, att.types, tgt.types, mods);
    let dmg = r.dmg * mult;
    const melee = m.kind === 'melee' || m.kind === 'dash' || m.kind === 'stealth';
    dmg *= melee ? att.mods.melee : RANGED[m.kind] ? att.mods.ranged : 1;
    if (att.mods.typeBoost[m.type]) dmg *= att.mods.typeBoost[m.type];
    if (att.contraT > 0) dmg *= 1 + 0.15 * att.mods.contra;
    if (att.counterT > 0) { dmg *= 1.5; att.counterT = 0; this.addNum(tgt.x, tgt.y - 44, '¡Contraataque!', '#ffb040'); Shake.start(2, 0.15); }
    dmg *= tgt.mods.taken;
    dmg *= BattleFX.weatherMul(m.type);
    if (att.side === 'foe') dmg *= this.wild ? 0.9 : 1; // dificultad: los salvajes pegan algo menos
    if (att.boss && att.sp.legendary) dmg *= 0.85;
    dmg = Math.max(1, Math.round(dmg));
    tgt.hp -= dmg; att.dmgDealt += dmg; this.lastDmgT = this.t;
    tgt.flash = 0.15;
    // empuje
    const kb = (m.knock ? 160 : 70) + (r.crit ? 40 : 0);
    tgt.vx += Math.cos(ang) * kb; tgt.vy += Math.sin(ang) * kb;
    if (tgt.act && !tgt.act.fired && (r.crit || m.pow >= 80) && !tgt.boss) tgt.act = null; // interrumpe
    // efectos
    this.burst(tgt.x, tgt.y, m.type, r.crit ? 18 : 10);
    this.addNum(tgt.x + U.rand(-4, 4), tgt.y - 16, String(dmg), r.eff > 1 ? '#ffe040' : r.eff < 1 ? '#c0c0c0' : '#ffffff');
    if (r.eff > 1) { this.addNum(tgt.x, tgt.y - 28, '¡Súper eficaz!', '#ffd040'); Sound.sfx('super'); }
    else if (r.eff < 1) { this.addNum(tgt.x, tgt.y - 28, 'Poco eficaz', '#b0b0b0'); }
    Sound.sfx(r.crit ? 'crit' : r.eff < 1 ? 'weak' : 'hit');
    if (r.crit) { this.addNum(tgt.x, tgt.y - 38, '¡Crítico!', '#ff8060'); Shake.start(2, 0.18); }
    this.hitStop = r.crit || m.pow >= 90 ? 0.07 : 0.035;
    if (tgt.side === 'ally') { Shake.start(1, 0.12); tgt.syn = Math.max(0, tgt.syn - 15); }
    // sinergia y estilo
    if (att.side === 'ally') {
      if (melee) att.c.style.imp++; else if (RANGED[m.kind]) att.c.style.tem++;
      if (melee && att.mods.furia) for (let i = 0; i < 4; i++) if (i !== (att.act ? att.act.i : -1)) att.cds[i] = Math.max(0, att.cds[i] - att.mods.furia);
    }
    att.syn = Math.min(100, att.syn + (6 + dmg / tgt.maxHp * 60) * att.mods.syn);
    if (m.drain) { const h = Math.max(1, Math.floor(dmg * m.drain)); att.hp = Math.min(att.maxHp, att.hp + h); this.addNum(att.x, att.y - 20, '+' + h, '#80ff80'); }
    // estado
    if (m.status && Math.random() < (m.chance || 0) && tgt.hp > 0) this.applyStatus(tgt, m.status);
    if (tgt.hp <= 0) { tgt.hp = 0; this.slow(0.5, 0.3); Shake.start(2, 0.25); }
  }
  applyStatus(f, s) {
    if (f.boss && f.sp.legendary && (s === 'stun')) s = 'slow';
    const dur = { burn: 4, poison: 5, para: 4, slow: 3, confuse: 3, stun: 1.4 }[s];
    if (s === 'stun') { if (f.stun > 0) return; f.stun = dur; f.act = null; f.dash = null; }
    else f.status[s] = dur;
    const label = { burn: '¡Quemado!', poison: '¡Envenenado!', para: '¡Paralizado!', slow: '¡Ralentizado!', confuse: '¡Confuso!', stun: '¡Aturdido!' }[s];
    this.addNum(f.x, f.y - 30, label, '#ffb0e0');
  }

  // ---------- física ----------
  physics(f, dt, idle) {
    if (!f || f.inBall) return;
    if (idle) { f.vx *= 0.8; f.vy *= 0.8; }
    f.x += f.vx * dt; f.y += f.vy * dt;
    if (!f.act && !f.dash && f.dodgeT <= 0 && f.side === 'foe' && !idle) { /* IA controla velocidad */ }
    if (f.act && !f.dash) { f.vx *= 0.85; f.vy *= 0.85; }
    if (f.stun > 0) { f.vx *= 0.85; f.vy *= 0.85; }
    if (!f.act && !f.dash && f.dodgeT <= 0 && f.side === 'ally' && f.stun <= 0) { /* controlado */ }
    const minx = ARENA.x0 + f.r, maxx = ARENA.x1 - f.r, miny = ARENA.y0 + f.r * 0.6, maxy = ARENA.y1 - 2;
    if (f.x < minx) { f.x = minx; f.vx = Math.abs(f.vx) * 0.3; if (f.dash) f.dash.left = 0; }
    if (f.x > maxx) { f.x = maxx; f.vx = -Math.abs(f.vx) * 0.3; if (f.dash) f.dash.left = 0; }
    if (f.y < miny) { f.y = miny; f.vy = Math.abs(f.vy) * 0.3; if (f.dash) f.dash.left = 0; }
    if (f.y > maxy) { f.y = maxy; f.vy = -Math.abs(f.vy) * 0.3; if (f.dash) f.dash.left = 0; }
    for (const o of this.obstacles) {
      const d = U.dist(f.x, f.y, o.x, o.y), min = f.r + o.r;
      if (d < min && d > 0) { f.x = o.x + ((f.x - o.x) / d) * min; f.y = o.y + ((f.y - o.y) / d) * min; if (f.dash) f.dash.left = 0; }
    }
  }
  separate() {
    const a = this.ally, b = this.foe;
    if (!a || !b || b.inBall) return;
    const d = U.dist(a.x, a.y, b.x, b.y), min = (a.r + b.r) * 0.8;
    if (d < min && d > 0.01) {
      const push = (min - d) / 2, nx = (b.x - a.x) / d, ny = (b.y - a.y) / d;
      a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
    }
  }

  // ---------- proyectiles y zonas ----------
  updateProjs(dt) {
    for (const p of this.projs) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.spin += dt * 12;
      if (Engine.frame % 2 === 0 && (p.m.type === 'fuego' || p.m.type === 'sombra' || p.m.type === 'mente' || p.m.type === 'electrico'))
        this.parts.push({ x: p.x, y: p.y, vx: U.rand(-10, 10), vy: U.rand(-10, 10), life: 0.25, max: 0.25, color: U.shade(TYPES[p.m.type].color, 0.2), size: 2 });
      const tgt = p.owner === this.ally ? this.foe : this.ally;
      if (tgt && !tgt.inBall && !tgt.fainted && U.dist(p.x, p.y, tgt.x, tgt.y) < p.r + tgt.r) {
        const ang = Math.atan2(p.vy, p.vx);
        const wasDodge = tgt.dodgeT > 0 || tgt.invuln > 0;
        this.hit(tgt, p.owner, p.m, 1, ang);
        if (!wasDodge) p.life = 0;
      }
      if (p.x < ARENA.x0 - 4 || p.x > ARENA.x1 + 4 || p.y < ARENA.y0 - 12 || p.y > ARENA.y1 + 4) p.life = 0;
      for (const o of this.obstacles) if (U.dist(p.x, p.y, o.x, o.y) < o.r + p.r) { p.life = 0; this.burst(p.x, p.y, p.m.type, 5, 40); }
    }
    this.projs = this.projs.filter((p) => p.life > 0);
  }
  updateAreas(dt) {
    for (const a of this.areas) {
      a.t += dt;
      if (a.t >= a.delay && !a.done) {
        a.done = true;
        const sfx = { electrico: 'zap', roca: 'rock', agua: 'water', viento: 'wind', mente: 'mind', sombra: 'shadow', planta: 'leaf', bicho: 'leaf' }[a.m.type] || 'hit';
        Sound.sfx(sfx);
        this.burst(a.x, a.y, a.m.type, 22, 110);
        this.fx.push({ k: 'ring', x: a.x, y: a.y, r: a.r, t: 0, dur: 0.25, color: TYPES[a.m.type].color });
        if (a.m.type === 'roca' || a.m.type === 'electrico') Shake.start(2, 0.15);
        this.terrainArea(a);
        for (const tgt of this.enemiesOf(a.owner)) if (U.dist(a.x, a.y, tgt.x, tgt.y) <= a.r + tgt.r * 0.6) this.hit(tgt, a.owner, a.m, a.cm || 1, Math.atan2(tgt.y - a.y, tgt.x - a.x));
      }
    }
    this.areas = this.areas.filter((a) => !a.done || a.t < a.delay + 0.05);
    // ultimate: ejecución de la onda cuando termina la carga
    for (const f of [this.ally, this.foe]) {
      if (f && f.act && f.act.ult && f.act.fired && !f.act.ultDone) {
        f.act.ultDone = true;
        Shake.start(3, 0.35);
        Sound.sfx('crit');
        this.fx.push({ k: 'flash', t: 0, dur: 0.25, color: '#ffffff' });
      }
    }
  }

  // ---------- IA ----------
  foeAI(f, dt) {
    const t = this.targetOf(f), ai = f.ai;
    if (!t) { f.vx *= 0.8; f.vy *= 0.8; return; }
    if (f.fainted || t.fainted) return;
    const sk = f.aiSkill !== undefined ? f.aiSkill : this.opts.skill !== undefined ? this.opts.skill : this.wild ? U.clamp(0.15 + f.c.lv / 60, 0.15, 0.55) + (f.sp.legendary ? 0.25 : 0) : 0.55;
    ai.tele = U.lerp(0.5, 0.22, sk);
    if (f.stun > 0 || f.act || f.dash || f.dodgeT > 0) return;
    const dist = U.dist(f.x, f.y, t.x, t.y), aTo = angTo(f, t);
    // esquivar proyectiles/cargas
    ai.dodgeCd -= dt;
    if (ai.dodgeCd <= 0) {
      let threat = null;
      for (const p of this.projs) if (p.owner.side !== f.side) { const d = U.dist(p.x, p.y, f.x, f.y); if (d < 46) { const pa = Math.atan2(p.vy, p.vx); if (Math.abs(U.angDiff(pa, Math.atan2(f.y - p.y, f.x - p.x))) < 0.5) threat = pa; } }
      if (!threat && (t.dash || (t.act && !t.act.fired && dist < 45))) threat = aTo + Math.PI;
      if (threat !== null) {
        ai.dodgeCd = U.lerp(2.2, 0.9, sk);
        if (Math.random() < sk * 0.6) {
          const da = threat + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
          f.dodgeT = 0.22; f.invuln = 0.18; f.vx = Math.cos(da) * 220; f.vy = Math.sin(da) * 220;
          return;
        }
      }
    }
    // pensar
    ai.think -= dt;
    if (ai.think <= 0 || !ai.want) {
      ai.think = U.lerp(0.9, 0.35, sk) + U.rand(0, 0.3);
      const opts = [];
      f.c.moves.forEach((mk, i) => {
        const m = MOVES[mk]; if (f.cds[i] > 0) return;
        let score = 1;
        if (m.pow) { score = m.pow * typeMult(m.type, t.types) * (f.types.includes(m.type) ? 1.5 : 1) / 40; }
        else if (m.kind === 'heal') score = f.hp < f.maxHp * 0.45 ? 4 : 0.05;
        else if (m.kind === 'buff') {
          if (m.invuln) score = f.hp < f.maxHp * 0.5 ? 1.2 : 0.3;
          else if (m.buff) score = Object.keys(m.buff).some((k) => f.stages[k] >= 2) ? 0 : 0.6;
          else score = m.debuff && t.stages[m.debuff] <= -2 ? 0 : 0.5;
        }
        else if (m.kind === 'blink') score = 0.3;
        score *= U.rand(0.6, 1.4);
        if (score > 0) opts.push({ i, m, score });
      });
      opts.sort((a, b) => b.score - a.score);
      ai.want = opts[0] || null;
      if (this.wild && sk < 0.3 && Math.random() < 0.25) ai.want = null; // salvajes torpes a veces dudan
      if (!f.duo && f.syn >= 100 && (!this.wild || f.sp.legendary || f.c.alpha) && Math.random() < 0.5) {
        if (this.canDuo('foe') && Math.random() < 0.6) { this.invokeDuo('foe'); return; }
        if (sk > 0.5) { f.ang = aTo; this.ultimate(f); return; }
      }
    }
    let desired = 110;
    const w = ai.want;
    if (w) {
      const m = w.m;
      desired = m.kind === 'melee' || m.kind === 'stealth' ? m.range + f.r + t.r - 4 : m.kind === 'dash' ? Math.min(m.range * 0.8, 70) : m.kind === 'ring' ? m.radius * 0.7 : m.kind === 'beam' ? Math.min(m.len * 0.7, 120) : m.kind === 'area' ? 120 : m.kind === 'proj' ? 115 : 90;
      const inRange = m.kind === 'melee' || m.kind === 'stealth' ? dist <= m.range + f.r + t.r : m.kind === 'ring' ? dist <= m.radius + t.r - 4 : m.kind === 'dash' ? dist <= m.range + 10 : m.kind === 'beam' ? dist <= m.len : m.kind === 'area' ? dist < 180 : true;
      const aligned = Math.abs(U.angDiff(f.ang, aTo)) < 0.35;
      f.ang = U.lerp(f.ang, f.ang + U.angDiff(f.ang, aTo), Math.min(1, dt * 8));
      if (inRange && (aligned || !RANGED[m.kind]) && (!RANGED[m.kind] || m.kind === 'area' || m.kind === 'ring' || this.losClear(f, t))) {
        if (Math.random() < dt * U.lerp(3, 9, sk) || m.kind === 'heal' || m.kind === 'buff') { f.ang = aTo; if (this.startMove(f, w.i)) ai.want = null; return; }
      }
    }
    // movimiento
    const spd = this.speedOf(f) * (this.wild ? U.lerp(0.65, 0.9, sk) : 0.92);
    let mx = 0, my = 0;
    if (dist > desired + 12) { mx = Math.cos(aTo); my = Math.sin(aTo); }
    else if (dist < desired - 18) { mx = -Math.cos(aTo); my = -Math.sin(aTo); }
    // rodeo lateral
    const sa = aTo + (Math.PI / 2) * ai.strafe;
    mx += Math.cos(sa) * 0.6; my += Math.sin(sa) * 0.6;
    if (Math.random() < dt * 0.5) ai.strafe *= -1;
    if (this.nearEdge(f)) { const C = this.field.center; mx += (C[0] - f.x) / 60; my += (C[1] - f.y) / 60; }
    this.unstick(f, ai, dt);
    if (f.status.confuse > 0) { mx = Math.cos(this.t * 3 + f.x); my = Math.sin(this.t * 2.3); }
    if (!this.losClear(f, t)) { const v = this.navVec(f, t); if (v) { mx = v[0] * 1.4; my = v[1] * 1.4; } }
    const l = Math.hypot(mx, my) || 1;
    f.vx = U.lerp(f.vx, (mx / l) * spd, Math.min(1, dt * 6)); f.vy = U.lerp(f.vy, (my / l) * spd, Math.min(1, dt * 6));
  }

  // ---------- esferas ----------
  cycleBall() { const l = this.ballList(); if (l.length) { this.ballSel = (this.ballSel + 1) % l.length; Sound.sfx('blip'); } }
  currentBall() { const l = this.ballList(); if (!l.length) return null; return l[this.ballSel % l.length]; }
  aimDir() {
    const f = this.ally, tgt = this.foe;
    if (Input.usingMouse()) { const [wx, wy] = this.mouseWorld(); return Math.atan2(wy - f.y, wx - f.x); }
    let a = f.aimAng !== undefined ? f.aimAng : f.ang;
    const at = angTo(f, tgt);
    if (Math.abs(U.angDiff(a, at)) < 0.3) a = at; // ayuda de puntería sutil con teclado
    return a;
  }
  // distancia del lanzamiento: hasta el cursor con ratón, fija con teclado
  aimLen() {
    if (!Input.usingMouse()) return 175;
    const f = this.ally;
    const [wx, wy] = this.mouseWorld();
    return U.clamp(Math.hypot(wx - f.x, wy - (f.y - 4)) + 6, 40, 220);
  }
  throwBall() {
    const kind = this.currentBall(); if (!kind) return;
    const f = this.ally;
    const a = this.aimDir();
    Game.take(kind);
    Sound.sfx('throw');
    this.throwCd = 1.0;
    const dist = this.aimLen();
    this.ball = { kind, x: f.x, y: f.y - 4, sx: f.x, sy: f.y - 4, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, trav: 0, max: dist, z: 0, phase: 'fly', t: 0, shakes: 0, ang: a, bonus: 1, notes: [] };
    f.ang = a;
  }
  updateBall(dt) {
    const b = this.ball; if (!b) return;
    const foe = this.foe;
    b.t += dt;
    if (b.phase === 'fly') {
      if (ITEMS[b.kind].ball >= 255 && !foe.inBall && !foe.fainted) { // la Esfera Maestra persigue a su objetivo
        const ang = Math.atan2(foe.y - b.y, foe.x - b.x); b.vx = Math.cos(ang) * 260; b.vy = Math.sin(ang) * 260; b.max = 9999;
        if (Engine.frame % 2 === 0) this.parts.push({ x: b.x, y: b.y - b.z, vx: 0, vy: 0, life: 0.3, max: 0.3, color: '#f8d048', size: 2 });
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.trav += Math.hypot(b.vx, b.vy) * dt;
      b.z = b.max > 1000 ? 12 : Math.sin(Math.min(1, b.trav / b.max) * Math.PI) * 22;
      if (!foe.inBall && !foe.fainted && U.dist(b.x, b.y, foe.x, foe.y) < foe.r + 5) {
        if ((foe.dodgeT > 0 || foe.invuln > 0) && ITEMS[b.kind].ball < 255) {
          b.phase = 'bounce'; b.vx *= -0.3; b.vy = -60; b.t = 0;
          this.addNum(foe.x, foe.y - 20, '¡Esquivó la esfera!', '#ffd0d0');
          return;
        }
        // calcular bonificaciones de lanzamiento
        b.bonus = 1;
        if (foe.stun > 0) { b.bonus *= 2; b.notes.push('¡Aturdido!'); }
        else if (foe.status.para > 0 || foe.status.slow > 0 || foe.status.burn > 0 || foe.status.poison > 0 || foe.status.confuse > 0) { b.bonus *= 1.5; b.notes.push('Estado alterado'); }
        if (Math.abs(U.angDiff(foe.ang, b.ang)) < 1.0) { b.bonus *= 1.3; b.notes.push('¡Por la espalda!'); }
        if (foe.act && !foe.act.fired) { b.bonus *= 1.3; b.notes.push('¡Momento perfecto!'); }
        for (const [m, n] of this.sphereBonus(b.kind, foe)) { b.bonus *= m; b.notes.push(n); }
        b.notes.forEach((n, i) => this.addNum(foe.x, foe.y - 30 - i * 10, n, '#fff080'));
        foe.inBall = true; foe.act = null; foe.dash = null; foe.vx = 0; foe.vy = 0;
        b.phase = 'absorb'; b.t = 0; b.x = foe.x; b.y = foe.y; b.z = 10;
        this.sparkle(foe.x, foe.y, '#ffffff', 20);
        Sound.sfx('poof');
        // probabilidad (fórmula clásica adaptada)
        const sp = foe.sp, ballMul = ITEMS[b.kind].ball;
        const hpR = foe.hp / foe.maxHp;
        const a = ((3 - 2 * hpR) / 3) * sp.catch * ballMul * b.bonus;
        b.p = ballMul >= 255 ? 1 : U.clamp(a / 255, 0.01, 1);
        b.shakeP = Math.pow(b.p, 1 / 3);
        return;
      }
      if (b.trav >= b.max || this.blocksShotAt(b.x, b.y) || !this.inArena(b.x, b.y, -10)) {
        b.phase = 'bounce'; b.t = 0; b.vx *= 0.25; b.vy *= 0.25;
      }
    } else if (b.phase === 'bounce') {
      b.x += b.vx * dt; b.y += b.vy * dt; b.z = Math.max(0, b.z - 60 * dt);
      if (b.t > 0.5) { this.sparkle(b.x, b.y, '#c0c0ff', 6); this.ball = null; }
    } else if (b.phase === 'absorb') {
      b.z = Math.max(0, 10 - b.t * 30);
      if (b.t > 0.6) { b.phase = 'shake'; b.t = 0; }
    } else if (b.phase === 'shake') {
      if (b.t > 0.75) {
        b.t = 0;
        if (Math.random() < b.shakeP) {
          b.shakes++;
          Sound.sfx('shake');
          if (b.shakes >= 3) {
            b.phase = 'done';
            this.sparkle(b.x, b.y, '#fff8a0', 24);
            const c = foe.c;
            Game.addCreature(c);
            this.caughtWhere = G.party.includes(c) ? 'party' : 'box';
            this.event = 'caught'; this.state = 'pause';
            this.captured = c;
          }
        } else {
          // se escapa
          Sound.sfx('poof');
          this.sparkle(b.x, b.y, '#ffffff', 16);
          foe.inBall = false; foe.invuln = 0.7; foe.stages.atk = Math.min(foe.sp.legendary ? 1 : 2, foe.stages.atk + 1);
          this.addNum(foe.x, foe.y - 24, ['¡Oh, no! ¡Se ha escapado!', '¡Casi lo tenías!', '¡Rayos! ¡Por poco!'][b.shakes] || '¡Se ha escapado!', '#ffb0b0');
          this.addNum(foe.x, foe.y - 36, '¡Furioso! Ataque ↑', '#ff8080');
          this.ball = null;
        }
      }
    }
  }

  // ---------- menús de pausa ----------
  async pauseMenu() {
    this.state = 'menu';
    const opts = ['Continuar', this.wild ? 'Capturar' : { label: 'Capturar', disabled: true }, 'Mochila', 'Equipo', this.wild ? 'Huir' : { label: 'Huir', disabled: true }, 'Controles'];
    let r = await choose(opts, { x: 120, y: 64, w: 90 });
    if (r === 1) { this.enterCapture(); if (this.state === 'menu') this.state = 'fight'; return; }
    if (r > 1) r--;
    if (r === 1) {
      const id = await runScene(new BagScreen('battle'));
      if (id) await this.useBattleItem(id);
    } else if (r === 2) { await this.doSwitch(); }
    else if (r === 3) {
      this.fleeTries++;
      const p = 0.45 + (this.ally.st.vel - this.foe.st.vel) / 80 + this.fleeTries * 0.15;
      if (Math.random() < p && !(this.foe.sp.legendary && Math.random() < 0.3)) { this.event = 'fled'; this.state = 'pause'; return; }
      await this.banner('¡No has podido escapar!', 1);
    } else if (r === 4) { this.showTut = true; await wait(0.2); await this.until(() => Input.pressed('a') || Input.pressed('b') || Input.pressed('start')); this.showTut = false; }
    if (this.state === 'menu') this.state = 'fight';
  }
  async useBattleItem(id) {
    const it = ITEMS[id];
    if (it.sphere) {
      // seleccionar esa esfera para lanzarla
      const l = this.ballList(); const k = l.indexOf(id);
      if (k >= 0) this.ballSel = k;
      if (this.wild) { this.enterCapture(); this.banner(`${it.name} preparada. ¡Apunta y lanza!`, 1.4); } else await this.banner('¡No puedes capturar ánimas de otros entrenadores!', 1.6);
      return;
    }
    const idx = await runScene(new PartyScreen('select', { msg: `¿Usar ${it.name} en qué ánima?` }));
    if (idx < 0) return;
    const c = G.party[idx];
    if (c === this.ally.c) c.hp = Math.ceil(this.ally.hp);
    const ok = await applyItemToCreature(id, c, true);
    if (ok && c === this.ally.c) { this.ally.hp = c.hp; this.ally.stun = Math.max(this.ally.stun, 0.4); }
  }
  async quickSwap() {
    this.state = 'menu';
    await this.doSwitch();
    if (this.state === 'menu') this.state = 'fight';
  }
  async doSwitch() {
    if (this.swapCd > 0) { await this.banner(`Espera ${this.swapCd.toFixed(1)}s para cambiar.`, 0.8); return; }
    if (G.party.filter((c) => c.hp > 0).length < 2) { await this.banner('¡No tienes otra ánima disponible!', 1); return; }
    const k = await runScene(new PartyScreen('select', { msg: '¿Qué ánima sacas?', filter: (c) => (c.hp <= 0 ? '¡Está debilitada!' : c === this.ally.c ? '¡Ya está luchando!' : null) }));
    if (k < 0) return;
    this.ally.c.hp = Math.ceil(this.ally.hp);
    this.state = 'pause';
    await this.banner(`¡Vuelve, ${cName(this.ally.c)}!`, 0.5);
    await this.sendAlly(k);
    this.swapCd = 3;
    this.state = 'fight';
  }

  // ---------- dibujo ----------
  draw(ctx) {
    // el combate ocurre en el propio mapa: el mundo dibuja el escenario y llama a drawWorldLayer
    World.battle = this;
    World.draw(ctx);
    const [cx, cy] = World.cam;
    ctx.save(); ctx.translate(-cx, -cy);
    // números
    for (const n of this.nums) {
      ctx.globalAlpha = n.t > 0.6 ? (0.9 - n.t) / 0.3 : 1;
      Font.drawOutlined(ctx, n.text, Math.round(n.x - Font.width(n.text) / 2), Math.round(n.y), n.color, '#1a1420');
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    for (const e of this.fx) if (e.k === 'flash') { ctx.globalAlpha = (1 - e.t / e.dur) * 0.7; P(ctx, 0, 0, W, H, e.color); ctx.globalAlpha = 1; }
    // HUD a 320 de ancho, centrado; la barra inferior ocupa toda la pantalla
    if (this.ally && !this.capture) { P(ctx, 0, 199, W, 41, '#14101e'); P(ctx, 0, 199, W, 1, '#5a5078'); }
    else if (this.capture) { P(ctx, 0, 199, W, 41, '#1c1430'); P(ctx, 0, 199, W, 1, '#f0c040'); }
    ctx.save(); ctx.translate(UIX, 0); W = UI_W;
    try {
    this.drawHud(ctx);
    // banners
    const b = this.banners[this.banners.length - 1];
    if (b) this.drawBanner(ctx, b);
    if (this.portrait) {
      const p = this.portrait; p.t += 1 / 60;
      const x = Math.round(330 - Math.min(1, p.t * 4) * 90);
      ctx.globalAlpha = 0.35; P(ctx, x - 6, 64, 96, 104, '#14101e'); ctx.globalAlpha = 1;
      ctx.drawImage(HiChar.get(LOOKS[p.look] || LOOKS.boy), 0, 0, 32, 48, x + 8, 62, 64, 96);
    }
    if (this.showTut) this.drawTutorial(ctx);
    } finally { W = WIDE; ctx.restore(); }
  }
  drawWorldLayer(ctx, cx, cy) {
    ctx.save(); ctx.translate(-cx, -cy);
    this.drawArena(ctx);
    // zonas telegrafiadas
    for (const a of this.areas) {
      if (a.done) continue;
      const k = a.t / a.delay;
      ctx.globalAlpha = 0.25 + k * 0.25;
      pixCircle(ctx, a.x, a.y, a.r * k, a.owner.side === 'foe' ? '#ff4040' : TYPES[a.m.type].color);
      ctx.globalAlpha = 0.9;
      pixRing(ctx, a.x, a.y, a.r, a.owner.side === 'foe' ? '#ff6060' : '#ffffff', 1);
      ctx.globalAlpha = 1;
    }
    // telegrafía de cargas enemigas
    const foe = this.foe;
    if (foe && foe.act && !foe.act.fired && !foe.inBall && this.state === 'fight') {
      const m = foe.act.m;
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(this.t * 30);
      if (m.kind === 'beam') {
        for (let d = 10; d < m.len; d += 6) pixCircle(ctx, foe.x + Math.cos(foe.ang) * d, foe.y + Math.sin(foe.ang) * d, m.width / 2, '#ff4040');
      } else if (m.kind === 'ring') pixRing(ctx, foe.x, foe.y, m.radius, '#ff4040', 2);
      else if (m.kind === 'melee' || m.kind === 'dash') {
        const L = m.kind === 'dash' ? m.range : m.range + foe.r;
        for (let d = 8; d < L; d += 5) pixCircle(ctx, foe.x + Math.cos(foe.ang) * d, foe.y + Math.sin(foe.ang) * d, 4, '#ff4040');
      } else if (m.kind === 'proj') for (let d = 10; d < 60; d += 8) pixCircle(ctx, foe.x + Math.cos(foe.ang) * d, foe.y + Math.sin(foe.ang) * d, 2, '#ff6060');
      ctx.globalAlpha = 1;
    }
    // efectos de suelo
    for (const e of this.fx) if (e.k === 'ring') {
      const k = e.t / e.dur;
      ctx.globalAlpha = 1 - k;
      pixRing(ctx, e.x, e.y, e.r * (0.3 + 0.7 * k), e.color, 3);
      pixRing(ctx, e.x, e.y, e.r * (0.3 + 0.7 * k) - 3, '#ffffff', 1);
      ctx.globalAlpha = 1;
    }
    // criaturas (ordenadas por y)
    const ents = [this.ally, this.foe].filter(Boolean).sort((a, b) => a.y - b.y);
    for (const f of ents) this.drawFighter(ctx, f);
    // apuntado
    if (this.aiming && this.ally) {
      const a = this.aimDir(), f = this.ally;
      const AL = this.aimLen();
      for (let d = 14; d < AL; d += 9) {
        const z = Math.sin((d / AL) * Math.PI) * 22;
        const blink = Math.floor(this.t * 12 + d / 9) % 2;
        P(ctx, Math.round(f.x + Math.cos(a) * d) - 1, Math.round(f.y - 4 + Math.sin(a) * d - z) - 1, 3, 3, blink ? '#ffffff' : '#ffe060');
      }
      const ex = f.x + Math.cos(a) * AL, ey = f.y + Math.sin(a) * AL;
      pixRing(ctx, ex, ey, 6, '#ffe060', 1);
    }
    // esfera lanzada
    if (this.ball) {
      const b = this.ball;
      drawShadow(ctx, b.x, b.y + 4, 4, 1.5, 0.3);
      let ox = 0;
      if (b.phase === 'shake') ox = Math.round(Math.sin(b.t * 25) * (b.t < 0.35 ? 2 : 0));
      ctx.drawImage(Icons.sphere(ITEMS[b.kind].sphere, 10), Math.round(b.x - 5 + ox), Math.round(b.y - 5 - b.z));
      if (b.phase === 'shake') for (let i = 0; i < b.shakes; i++) P(ctx, Math.round(b.x - 6 + i * 5), Math.round(b.y - 14), 3, 3, '#ffe060');
    }
    // proyectiles
    for (const p of this.projs) this.drawProj(ctx, p);
    // efectos aéreos
    for (const e of this.fx) {
      const k = e.t / e.dur;
      if (e.k === 'slash') {
        ctx.globalAlpha = 1 - k;
        for (let i = -4; i <= 4; i++) {
          const a = e.ang + i * 0.28, rr = e.r * (0.7 + 0.3 * k);
          P(ctx, Math.round(e.x + Math.cos(a) * rr * 0.6) - 1, Math.round(e.y + Math.sin(a) * rr * 0.6) - 1, 3, 3, i % 2 ? '#ffffff' : e.color);
        }
        ctx.globalAlpha = 1;
      } else if (e.k === 'beam') {
        ctx.globalAlpha = 1 - k * 0.8;
        const ca = Math.cos(e.ang), sa = Math.sin(e.ang);
        for (let d = 10; d < e.len; d += 3) {
          const w = (e.w / 2) * (1 - k * 0.5) * (0.85 + 0.15 * Math.sin(d * 0.4 + this.t * 40));
          pixCircle(ctx, e.x + ca * d, e.y + sa * d, w, e.color);
          pixCircle(ctx, e.x + ca * d, e.y + sa * d, Math.max(1, w * 0.45), '#ffffff');
        }
        ctx.globalAlpha = 1;
      }
    }
    // partículas
    for (const p of this.parts) { ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5); P(ctx, Math.round(p.x), Math.round(p.y), p.size, p.size, p.color); }
    ctx.globalAlpha = 1;
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  drawFighter(ctx, f) {
    if (f.inBall) return;
    const S = f.size;
    let sc = 1;
    if (f.spawnT > 0) sc = U.easeOut(Math.min(1, f.spawnT / 0.4));
    if (f.fainted && this.t - (f.faintT || (f.faintT = this.t)) > 0.9) return;
    if (sc <= 0) return;
    drawShadow(ctx, f.x, f.y + 2, f.r * 0.9 * sc, 3 * sc, 0.3);
    // aura de carga
    if (f.act && !f.act.fired) {
      const col = f.side === 'foe' ? '#ff4040' : TYPES[f.act.m.type].color;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(this.t * 35);
      pixRing(ctx, f.x, f.y - S * 0.35, S * 0.45 + Math.sin(this.t * 20) * 2, col, 2);
      ctx.globalAlpha = 1;
      if (f.side === 'foe') Font.drawOutlined(ctx, '!', f.x - 1, f.y - S - 4, '#ff5050', '#200000');
    }
    const flip = Math.cos(f.ang) > 0.1 ? true : Math.cos(f.ang) < -0.1 ? false : f.lastFlip;
    f.lastFlip = flip;
    const blink = (f.invuln > 0 && f.dodgeT <= 0 && !f.veil && Math.floor(this.t * 20) % 2 === 0 && this.state === 'fight' && f.spawnT === 0);
    if (f.veil > 0) { f.veil -= 1 / 60; ctx.globalAlpha = 0.4; }
    if (blink) ctx.globalAlpha = 0.45;
    if (f.animSeed === undefined) f.animSeed = Math.random() * 6;
    // ánima animada por partes (respira, camina, ataca, reacciona)
    CreatureAnim.draw(ctx, f, {
      sp: f.c.sp, S, shiny: f.c.shiny, px: f.x, py: f.y + 4, flip, scale: f.fainted ? 1 : sc, t: this.t, dt: 1 / 60,
      speed: Math.hypot(f.vx, f.vy), act: f.act, dash: !!f.dash, dodge: f.dodgeT > 0, stun: f.stun > 0,
      charging: f === this.ally && this.chg && this.chg.t > 0.15, faintT: f.fainted ? this.t - (f.faintT || (f.faintT = this.t)) : undefined,
      flash: f.flash > 0 && Math.floor(f.flash * 40) % 2 === 0, flashColor: f.flashColor,
    });
    ctx.globalAlpha = 1;
    if (f.c.shiny && Math.floor(this.t * 3) % 4 === 0) P(ctx, Math.round(f.x + U.rand(-10, 10)), Math.round(f.y - U.rand(5, S * 0.8)), 2, 2, '#fff8a0');
    // aturdido
    if (f.stun > 0) for (let i = 0; i < 3; i++) { const a = this.t * 6 + i * 2.1; Font.draw(ctx, '★', Math.round(f.x + Math.cos(a) * 9) - 2, Math.round(f.y - S * 0.85 + Math.sin(a) * 3), '#ffe060'); }
    if (f.status.para > 0 && Math.random() < 0.2) P(ctx, Math.round(f.x + U.rand(-8, 8)), Math.round(f.y - U.rand(4, 24)), 2, 2, '#ffe848');
    if (f.status.burn > 0 && Math.random() < 0.25) this.parts.push({ x: f.x + U.rand(-6, 6), y: f.y - U.rand(4, 20), vx: 0, vy: -25, life: 0.4, max: 0.4, color: '#ff8030', size: 2 });
    if (f.status.poison > 0 && Math.random() < 0.15) this.parts.push({ x: f.x + U.rand(-6, 6), y: f.y - U.rand(4, 20), vx: 0, vy: -15, life: 0.5, max: 0.5, color: '#b060e0', size: 2 });
    // marcador de lado
    if (f.side === 'ally' && this.state === 'fight') { P(ctx, Math.round(f.x) - 2, Math.round(f.y + 5), 5, 1, '#60d0ff'); P(ctx, Math.round(f.x) - 1, Math.round(f.y + 6), 3, 1, '#60d0ff'); }
  }
  drawProj(ctx, p) {
    const t = p.m.type, col = TYPES[t].color, light = U.shade(col, 0.3);
    const x = Math.round(p.x), y = Math.round(p.y) - 6, r = p.r;
    drawShadow(ctx, x, y + 9, Math.max(2, r * 0.8), 1.5, 0.2);
    if (t === 'planta' || t === 'roca') {
      const s = Math.max(2, r);
      const c = Math.cos(p.spin), sn = Math.sin(p.spin);
      for (let i = -s; i <= s; i++) { P(ctx, Math.round(x + c * i), Math.round(y + sn * i), 2, 2, t === 'roca' ? PAL.rock3 : '#58c048'); }
      P(ctx, x - 1, y - 1, 2, 2, t === 'roca' ? PAL.rock1 : '#b0f088');
    } else if (t === 'electrico') {
      for (let i = 0; i < 3; i++) P(ctx, x - r + U.randi(0, r * 2), y - r + U.randi(0, r * 2), 2, 2, i ? '#ffe848' : '#ffffff');
      pixCircle(ctx, x, y, r * 0.6, '#fff8c0');
    } else if (t === 'viento') {
      pixRing(ctx, x, y, r, '#e8fbff', 1); pixCircle(ctx, x, y, r * 0.4, '#a8e0f8');
    } else if (t === 'bicho') {
      const a = Math.atan2(p.vy, p.vx);
      for (let i = 0; i < 4; i++) P(ctx, Math.round(x - Math.cos(a) * i * 1.5), Math.round(y - Math.sin(a) * i * 1.5), 2, 2, i ? '#88b828' : '#e8ffb0');
    } else if (t === 'normal') {
      pixCircle(ctx, x, y, r, '#ffffff'); pixCircle(ctx, x, y, r * 0.5, '#f8f0c0');
    } else {
      pixCircle(ctx, x, y, r, col); pixCircle(ctx, x - r * 0.3, y - r * 0.3, Math.max(1, r * 0.45), light);
      if (t === 'agua') P(ctx, x - 1, y - r + 1, 2, 1, '#ffffff');
      if (t === 'mente') pixRing(ctx, x, y, r + 2 + Math.sin(this.t * 20), '#ffb0d8', 1);
    }
  }
  drawHud(ctx) {
    // panel aliado
    const a = this.ally, f = this.foe;
    const panel = (x, fi, right) => {
      hudPanel(ctx, x, 3, 150, 35, TYPES[fi.types ? fi.types[0] : SPECIES[fi.c.sp].types[0]].color);
      const c = fi.c, name = fi.side === 'ally' ? cName(c) : SPECIES[c.sp].name;
      Font.draw(ctx, name, x + 5, 7, '#ffffff');
      Font.drawRight(ctx, 'Nv' + c.lv, x + 145, 7, '#d8d0f0');
      const r = Math.max(0, fi.hp) / fi.maxHp;
      // daño diferido: una barra clara se vacía tras el golpe
      if (fi.hpShow === undefined || fi.hpShow < r) fi.hpShow = r; else fi.hpShow = Math.max(r, fi.hpShow - 0.006);
      UI.bar(ctx, x + 5, 20, 140, 4, fi.hpShow, '#f8f0e0');
      P(ctx, x + 5, 20, Math.round(140 * U.clamp(r, 0, 1)), 4, UI.hpColor(r)); P(ctx, x + 5, 20, Math.round(140 * U.clamp(r, 0, 1)), 1, U.shade(UI.hpColor(r), 0.2));
      if (fi.side === 'ally') {
        Font.draw(ctx, `${Math.max(0, Math.ceil(fi.hp))}/${fi.maxHp}`, x + 5, 26, '#c0b8d8');
        // sinergia
        const full = fi.syn >= 100;
        UI.bar(ctx, x + 70, 28, 75, 3, fi.syn / 100, full ? (Math.floor(this.t * 8) % 2 ? '#ffe060' : '#ff9030') : '#b070f0');
        Font.draw(ctx, full ? 'F!' : '', x + 58, 25, '#ffe060');
      } else {
        if (G.caught[fi.sp.id]) ctx.drawImage(Icons.sphere('esfera', 8), x + 5, 26);
        fi.sp.types.forEach((t, k) => UI.typeBadge(ctx, t, x + 16 + k * 32, 25));
        if (!this.wild) for (let k = 0; k < this.foeQueue.length; k++) P(ctx, x + 145 - k * 7 - 5, 27, 5, 5, k < this.foeQueue.length - this.foeIdx - (fi.fainted ? 1 : 0) ? '#f8d048' : '#555');
      }
      let sx = x + (fi.side === 'ally' ? 112 : 60);
      for (const s in fi.status) { const lab = { burn: 'QUE', poison: 'ENV', para: 'PAR', slow: 'LEN', confuse: 'CNF' }[s]; P(ctx, sx, 26 - (fi.side === 'ally' ? 9 : 0), 18, 7, '#5a4070'); Font.draw(ctx, lab, sx + 1, 25 - (fi.side === 'ally' ? 9 : 0), '#ffffff'); sx += 19; }
    };
    if (a) panel(HUD_L, a);
    if (f) panel(HUD_R, f);
    // barra de ataques: a todo el ancho (ver battle_hud.js)
    if (!a || this.capture) return;
    ctx.save(); ctx.translate(-UIX, 0); W = WIDE;
    try { this.drawMoveBar(ctx); } finally { W = UI_W; ctx.restore(); }
  }
  drawTutorial(ctx) {
    UI.box(ctx, 20, 30, 280, 180);
    Font.drawCenter(ctx, 'COMBATE EN TIEMPO REAL', 160, 38, '#2a2236');
    const lines = [
      ['WASD / Flechas', 'Mover a tu ánima'],
      ['Ratón', 'Apuntar al cursor'],
      ['J / Clic izq', 'Ataque armado (mantén = cargar)'],
      ['1-4 · K L I · Clic der', 'Ataques directos'],
      ['Mayús (mantener)', 'Selector táctico (cámara lenta)'],
      ['ESPACIO', 'Esquivar (invulnerable)'],
      ['E', 'Modo captura (entrenador)'],
      ['F · G', 'Arte Ánima · Dúo'],
      ['Q · V', 'Cambiar ánima · Mov. asistido'],
      ['Intro / Esc', 'Pausa: mochila, huir'],
    ];
    lines.forEach(([k, d], i) => { Font.draw(ctx, k, 28, 52 + i * 12, '#c04830'); Font.draw(ctx, d, 142, 52 + i * 12, '#2a2236'); });
    Font.drawCenter(ctx, 'Los ataques enemigos se marcan en ROJO: ¡esquívalos!', 160, 180, '#5a5068');
    if (Math.floor(this.t * 2) % 2) Font.drawCenter(ctx, 'Pulsa Z para empezar', 160, 194, '#2a8a40');
  }
}

// ---------- transición y API ----------
class BattleTransition {
  constructor(boss) { this.t = 0; this.boss = boss; }
  update(dt) { this.t += dt; if (this.t >= 0.9) this.done(); }
  draw(ctx) {
    const t = this.t;
    if (t < 0.3) { if (Math.floor(t * 20) % 2) { ctx.globalAlpha = 0.7; P(ctx, 0, 0, W, H, '#ffffff'); ctx.globalAlpha = 1; } return; }
    const k = (t - 0.3) / 0.6;
    ctx.fillStyle = this.boss ? '#300818' : '#100c1c';
    for (let i = 0; i < 12; i++) {
      const y = i * 20;
      const w = U.clamp(k * 2 - i * 0.06, 0, 1) * W;
      if (i % 2) ctx.fillRect(0, y, w, 20); else ctx.fillRect(W - w, y, w, 20);
    }
  }
}

const Battle = {
  active: null,
  async start(opts) {
    World.syncPos();
    const prevMusic = MAPS[G.map].music;
    Sound.music(opts.wild ? (SPECIES[opts.wild.sp].legendary ? 'boss' : 'battle') : opts.music || (opts.boss ? 'boss' : 'trainer'));
    await runScene(new BattleTransition(opts.boss));
    const b = new BattleScene(Object.assign({ bg: MAPS[G.map].bg }, opts));
    this.active = b;
    Scenes.push(b);
    Fade.a = 0;
    const res = await b.run();
    await Fade.out(0.35);
    Scenes.pop(b);
    this.active = null;
    // estado tras el combate
    for (const c of G.party) if (c.hp > calcStats(c).hp) c.hp = calcStats(c).hp;
    await Fade.in(0.3);
    if (res !== 'lose') {
      // ataques aprendidos y evoluciones
      for (const c of G.party.slice()) {
        const evs = b.pendingLv.get(c.uid);
        if (evs) await processLevelEvents(c, evs);
      }
      for (const c of G.party.slice()) if (b.leveled.has(c.uid) && c.hp > 0) await tryEvolve(c, {});
      if (res === 'caught') await afterCatch(b.captured, b.caughtWhere);
      Sound.music(prevMusic);
    }
    return res;
  },
  wild(c) {
    if (!c.shiny && !SPECIES[c.sp].legendary && Math.random() < 1 / 160) c.shiny = true;
    return this.start(SPECIES[c.sp].legendary ? { wild: c, bg: 'legend' } : { wild: c });
  },
  trainer(def) { return this.start(def); },
};

async function afterCatch(c, where) {
  const sp = SPECIES[c.sp];
  const isNew = !G.flags['dex_' + sp.id];
  if (isNew) { G.flags['dex_' + sp.id] = 1; await say(`¡Los datos de ${sp.name} se han añadido al Códice!`); }
  const r = await ask(`¿Quieres ponerle un mote a ${sp.name}?`);
  if (r === 0) {
    const nn = await runScene(new NameEntry(`Mote para ${sp.name}:`, sp.name));
    if (nn && nn !== sp.name) c.nick = nn;
  }
  if (where === 'box') await say(`Tu equipo está completo. ${cName(c)} se ha enviado al PC.`);
}
