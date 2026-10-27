'use strict';
// ============================================================
//  Estado de la partida, ánimas (instancias), experiencia, evolución
// ============================================================

const SAVE_KEY = 'anima_region_alba_save_v1';
const OPT_KEY = 'anima_region_alba_opts';
const BOND_HIGH = 110;

let G = null; // estado global de la partida

function newGameState() {
  return {
    name: 'Alex', rival: 'Dante', money: 3000, badges: [false, false, false],
    party: [], box: [], bag: { pocion: 3 }, flags: {}, seen: {}, caught: {},
    map: 'casa_jugador', x: 2, y: 2, dir: 'down', repel: 0, steps: 0,
    lastHeal: { map: 'casa_jugador', x: 6, y: 4 }, playTime: 0, starter: null, uidNext: 1,
    time: 9 * 60, day: 1, weather: 'despejado',
  };
}

const Options = {
  textSpeed: 1, music: 0.55, sfx: 0.7, dayLen: 24, autosave: true,
  load() {
    try { Object.assign(this, JSON.parse(localStorage.getItem(OPT_KEY) || '{}')); } catch (e) { /* sin almacenamiento */ }
    Sound.setVolumes(this.music, this.sfx);
  },
  save() {
    try { localStorage.setItem(OPT_KEY, JSON.stringify({ textSpeed: this.textSpeed, music: this.music, sfx: this.sfx, dayLen: this.dayLen, autosave: this.autosave })); } catch (e) { /* ignorar */ }
    Sound.setVolumes(this.music, this.sfx);
  },
};

const Game = {
  isDay() { return Clock.isDay(); },
  flag(f) { return !!G.flags[f]; },
  setFlag(f, v = true) { G.flags[f] = v; },
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } },
  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); return true; } catch (e) { console.error(e); return false; }
  },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!d) return false;
      G = Object.assign(newGameState(), d);
      for (const c of G.party.concat(G.box)) fixCreature(c);
      return true;
    } catch (e) { console.error(e); return false; }
  },
  saveSummary() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!d) return null;
      return { name: d.name, badges: d.badges.filter(Boolean).length, dex: Object.keys(d.caught).length, time: d.playTime, map: MAPS[d.map] ? MAPS[d.map].name : '' };
    } catch (e) { return null; }
  },
  markSeen(key) { G.seen[SPECIES[key].id] = true; },
  markCaught(key) { G.seen[SPECIES[key].id] = true; G.caught[SPECIES[key].id] = true; },
  give(item, qty = 1) { G.bag[item] = (G.bag[item] || 0) + qty; },
  take(item, qty = 1) { if (!G.bag[item]) return false; G.bag[item] -= qty; if (G.bag[item] <= 0) delete G.bag[item]; return true; },
  has(item) { return (G.bag[item] || 0) > 0; },
  addCreature(c) {
    this.markCaught(c.sp);
    if (G.party.length < 6) { G.party.push(c); return 'party'; }
    G.box.push(c); return 'box';
  },
  healAll() { for (const c of G.party) { c.hp = calcStats(c).hp; } },
  firstAlive() { return G.party.find((c) => c.hp > 0); },
  aliveCount() { return G.party.filter((c) => c.hp > 0).length; },
  badgeCount() { return G.badges.filter(Boolean).length; },
  timeStr(t) { const m = Math.floor(t / 60); return `${Math.floor(m / 60)}:${U.pad(m % 60, 2, '0')}`; },
};

// ---------- instancias de ánima ----------
function expFor(lv) { return lv <= 1 ? 0 : Math.floor(Math.pow(lv, 3) * 0.85); }

function movesAt(sp, lv) {
  const list = [];
  for (const e of sp.learn) if (e.lv <= lv && !list.includes(e.m)) list.push(e.m);
  return list.slice(-4);
}

function newCreature(key, lv, opt = {}) {
  const sp = SPECIES[key];
  const iv = () => U.randi(0, 15);
  const c = {
    uid: G ? G.uidNext++ : Math.floor(Math.random() * 1e9),
    sp: sp.key, nick: null, lv, exp: expFor(lv),
    ivs: { hp: iv(), atk: iv(), def: iv(), esp: iv(), vel: iv() },
    moves: opt.moves || movesAt(sp, lv), style: { imp: 0, tem: 0 }, bond: opt.bond || 70, hp: 1, ot: opt.ot || null,
  };
  c.hp = calcStats(c).hp;
  return c;
}
function fixCreature(c) {
  if (!c.style) c.style = { imp: 0, tem: 0 };
  if (c.bond === undefined) c.bond = 70;
  if (!c.ivs) c.ivs = { hp: 8, atk: 8, def: 8, esp: 8, vel: 8 };
  c.moves = c.moves.filter((m) => MOVES[m]);
}
function calcStats(c) {
  const b = SPECIES[c.sp].stats, iv = c.ivs, L2 = c.lv;
  const st = (k) => Math.floor(((b[k] * 2 + iv[k]) * L2) / 100) + 5;
  const vit = 1 + 0.06 * ((c.talents && c.talents.vitalidad) || 0);
  return { hp: Math.floor((Math.floor(((b.hp * 2 + iv.hp) * L2) / 100) + L2 + 10) * vit), atk: st('atk'), def: st('def'), esp: st('esp'), vel: st('vel') };
}
function cName(c) { return c.nick || SPECIES[c.sp].name; }

// devuelve lista de eventos: {lv} subidas y {learn: move} movimientos nuevos
function gainExp(c, amount) {
  const events = [];
  if (c.lv >= 100) return events;
  c.exp += amount;
  while (c.lv < 100 && c.exp >= expFor(c.lv + 1)) {
    const before = calcStats(c);
    c.lv++;
    const after = calcStats(c);
    c.hp = Math.min(after.hp, c.hp + (after.hp - before.hp));
    c.bond = Math.min(255, c.bond + 2);
    events.push({ lv: c.lv, before, after });
    for (const e of SPECIES[c.sp].learn) if (e.lv === c.lv && !c.moves.includes(e.m)) events.push({ learn: e.m });
  }
  return events;
}

function styleOf(c) {
  const { imp, tem } = c.style;
  if (imp === 0 && tem === 0) return { label: 'Equilibrado', ratio: 0.5 };
  const r = imp / (imp + tem);
  return { label: r >= 0.5 ? 'Ímpetu' : 'Temple', ratio: r };
}

// ¿debería evolucionar? ctx: {item, map}
function evoTarget(c, ctx = {}) {
  const sp = SPECIES[c.sp], e = sp.evo;
  if (!e) return null;
  if (e.to) return !ctx.item && c.lv >= e.lv ? e.to : null;
  const br = e.branch;
  if (br.crit === 'item') {
    if (ctx.item === br.ia) return br.a;
    if (ctx.item === br.ib) return br.b;
    return null;
  }
  if (ctx.item || c.lv < e.lv) return null;
  switch (br.crit) {
    case 'style': return c.style.imp >= c.style.tem ? br.a : br.b;
    case 'time': return Game.isDay() ? br.a : br.b;
    case 'stat': { const s = calcStats(c); return s.atk > s.def ? br.a : br.b; }
    case 'bond': return c.bond >= BOND_HIGH ? br.a : br.b;
    case 'place': return ctx.map && MAPS[ctx.map] && MAPS[ctx.map].cave ? br.a : br.b;
  }
  return null;
}
function evolve(c, to) {
  const before = calcStats(c);
  const wasNamed = c.nick;
  c.sp = to;
  const after = calcStats(c);
  c.hp = Math.max(1, c.hp + (after.hp - before.hp));
  if (!wasNamed) c.nick = null;
  Game.markCaught(to);
}

// daño en tiempo real (fórmula clásica adaptada)
function calcDamage(att, def, move, attStats, defStats, attTypes, defTypes, mods = {}) {
  const fis = move.cat === 'fis';
  const A = (fis ? attStats.atk : attStats.esp) * (mods.atkMul || 1);
  const D = Math.max(1, (fis ? defStats.def : defStats.esp) * (mods.defMul || 1));
  const stab = attTypes.includes(move.type) ? 1.5 : 1;
  const eff = typeMult(move.type, defTypes);
  const crit = Math.random() < (move.crit || 0.0625) + (mods.critAdd || 0) ? 1.5 : 1;
  const base = ((2 * att.lv) / 5 + 2) * move.pow * (A / D) / 50 + 2;
  const dmg = Math.max(1, Math.floor(base * stab * eff * crit * U.rand(0.88, 1.0) * 0.5));
  return { dmg, eff, crit: crit > 1 };
}

function expYield(defender, trainer) {
  const sp = SPECIES[defender.sp];
  return Math.floor((sp.exp * defender.lv) / 7 * (trainer ? 1.5 : 0.85));
}
