'use strict';
// ============================================================
//  EQUIPAMIENTO DEL ENTRENADOR
//  - 6 ranuras: Brazalete, Anillo, Colgante, Botas, Emblema, Talismán
//  - Afecta a todas tus ánimas
//  - 6 rarezas: Común, Poco común, Raro, Épico, Legendario, Divino
//  - Botín: salvajes (poco), alfas y jefes (mucho y mejor)
//  - Lo que sobra se desmonta en Fragmentos, que sirven para reforjar
// ============================================================
const RARITY = [
  { name: 'Común', color: '#c8c8c8', mat: 'de Cobre', mul: 1, affixes: 0, frag: 1, reforge: 4 },
  { name: 'Poco común', color: '#60d060', mat: 'de Plata', mul: 1.25, affixes: 1, frag: 3, reforge: 8 },
  { name: 'Raro', color: '#58a0ff', mat: 'de Zafiro', mul: 1.5, affixes: 2, frag: 8, reforge: 20 },
  { name: 'Épico', color: '#c070ff', mat: 'de Amatista', mul: 1.85, affixes: 3, frag: 20, reforge: 50 },
  { name: 'Legendario', color: '#ffa030', mat: '', mul: 2.3, affixes: 3, frag: 60, reforge: 120 },
  { name: 'Divino', color: '#ff5050', mat: '', mul: 3, affixes: 3, frag: 200, reforge: 300 },
];
const GEAR_SLOTS = [
  { k: 'brazalete', name: 'Brazalete', base: 'atk' },
  { k: 'anillo', name: 'Anillo', base: 'esp' },
  { k: 'colgante', name: 'Colgante', base: 'hp' },
  { k: 'botas', name: 'Botas', base: 'vel' },
  { k: 'emblema', name: 'Emblema', base: 'def' },
  { k: 'talisman', name: 'Talismán', base: null },
];
// efectos: valor base por punto de rareza y tope total
const GEAR_STATS = {
  atk: { name: 'Ataque', s: 'ATQ', v: 3, cap: 35, pct: true }, esp: { name: 'Especial', s: 'ESP', v: 3, cap: 35, pct: true }, def: { name: 'Defensa', s: 'DEF', v: 3, cap: 35, pct: true },
  hp: { name: 'PS', s: 'PS', v: 3, cap: 35, pct: true }, vel: { name: 'Velocidad', s: 'VEL', v: 3, cap: 35, pct: true },
  crit: { name: 'Crítico', s: 'CRÍT', v: 2, cap: 15, pct: true }, cd: { name: 'Recarga', s: 'REC', v: 3, cap: 25, pct: true, neg: true }, syn: { name: 'Sinergia', s: 'SIN', v: 6, cap: 50, pct: true },
  tipo: { name: 'Daño', v: 5, cap: 40, pct: true }, exp: { name: 'Experiencia', s: 'EXP', v: 5, cap: 50, pct: true }, botin: { name: 'Suerte de botín', s: 'BOTÍN', v: 8, cap: 100, pct: true },
};
const GEAR_UNIQUE = {
  4: [
    { k: 'vampiro', name: 'del Vampiro', desc: 'Tu ánima recupera un 8% del daño que inflige.' },
    { k: 'espinas', name: 'de Espinas', desc: 'Devuelve un 15% del daño cuerpo a cuerpo que recibe tu ánima.' },
    { k: 'iniciativa', name: 'de la Iniciativa', desc: 'El primer golpe de cada combate hace un 40% más de daño.' },
    { k: 'eco', name: 'del Eco', desc: '12% de probabilidad de que un ataque no gaste su recarga.' },
    { k: 'espejismo', name: 'del Espejismo', desc: 'La esquiva dura más y se recarga un 25% antes.' },
  ],
  5: [
    { k: 'fenix', name: 'del Fénix', desc: 'Una vez por combate, tu ánima resiste un golpe mortal con un 30% de PS.' },
    { k: 'cronos', name: 'de Cronos', desc: 'Todas las recargas se reducen un 30%.' },
    { k: 'tempestad', name: 'de la Tempestad', desc: 'Cada 4.º ataque desata una onda gratuita alrededor de tu ánima.' },
    { k: 'avaricia', name: 'de la Avaricia', desc: 'Los rivales sueltan botín el doble de a menudo y de mejor calidad.' },
  ],
};
// más efectos únicos (se añaden a los anteriores)
GEAR_UNIQUE[4].push(
  { k: 'segador', name: 'del Segador', desc: 'Hace un 35% más de daño a rivales con menos del 30% de PS.' },
  { k: 'centinela', name: 'del Centinela', desc: 'El primer golpe que recibe tu ánima en cada combate hace un 60% menos.' },
  { k: 'impulso', name: 'del Impulso', desc: 'Tras esquivar, el siguiente ataque hace un 30% más de daño.' },
  { k: 'savia', name: 'de la Savia', desc: 'Tu ánima recupera un 0,6% de sus PS por segundo durante el combate.' },
);
GEAR_UNIQUE[5].push({ k: 'aurora', name: 'de la Aurora', desc: 'Tus ánimas entran al combate con la Sinergia a la mitad.' });
// frase de ambiente de cada efecto único
const GEAR_LORE = {
  vampiro: 'Late como un corazón ajeno.', espinas: 'Nadie lo toca dos veces.', iniciativa: 'Forjado para quien golpea primero.', eco: 'Repite cada gesto un instante después.',
  espejismo: 'Nunca está donde lo miras.', segador: 'Huele el final de cada combate.', centinela: 'Vigila incluso cuando duermes.', impulso: 'Convierte cada esquiva en un salto adelante.',
  savia: 'Brota una gota verde cada amanecer.', fenix: 'Arde sin consumirse jamás.', cronos: 'Sus engranajes giran al revés.', tempestad: 'Huele a ozono y a lluvia lejana.',
  avaricia: 'Pesa más cuanto más tienes.', aurora: 'Guarda la primera luz del mundo.',
};
// formas de cada ranura: nombre y género (m, f, mp, fp) para concordar el adjetivo
const GEAR_FORMS = {
  brazalete: [['Brazalete', 'm'], ['Brazal', 'm'], ['Muñequera', 'f'], ['Guantelete', 'm']],
  anillo: [['Anillo', 'm'], ['Sortija', 'f'], ['Sello', 'm'], ['Aro', 'm']],
  colgante: [['Colgante', 'm'], ['Amuleto', 'm'], ['Medallón', 'm'], ['Relicario', 'm']],
  botas: [['Botas', 'fp'], ['Grebas', 'fp'], ['Sandalias', 'fp'], ['Botines', 'mp']],
  emblema: [['Emblema', 'm'], ['Insignia', 'f'], ['Escudo', 'm'], ['Broche', 'm']],
  talisman: [['Talismán', 'm'], ['Runa', 'f'], ['Orbe', 'm'], ['Tótem', 'm']],
};
// materiales por rareza: nombre y colores del metal (claro, medio, oscuro) y de la tela
const GEAR_MATS = [
  [['de Cobre', '#f0b080', '#c07840', '#7a4420'], ['de Hierro', '#c8c8d0', '#8a8a98', '#50505e'], ['de Cuero', '#d8a070', '#9a6236', '#5a3418'], ['de Hueso', '#fff8e8', '#ddd0b0', '#9a8a68'], ['de Roble', '#d8a868', '#9a6a38', '#5e3e1c']],
  [['de Plata', '#ffffff', '#c8d0e0', '#7880a0'], ['de Bronce', '#f0d088', '#c09040', '#7a5418'], ['de Jade', '#c0ffd8', '#60c090', '#2a7050'], ['de Coral', '#ffd0c0', '#f08070', '#a04040']],
  [['de Zafiro', '#ffffff', '#c8d4ec', '#6a7aa8'], ['de Oro', '#fff4b0', '#f0c040', '#a07010'], ['de Obsidiana', '#8a80a8', '#403850', '#1e1a2a'], ['de Ámbar', '#ffe0a0', '#f0a030', '#a05a10']],
  [['de Amatista', '#fff4ff', '#d8c8f0', '#8a70b0'], ['de Mitril', '#f0ffff', '#a0e0f0', '#4a8ab0'], ['Rúnico', '#d0f0ff', '#7090c0', '#36406a'], ['de Ópalo', '#ffffff', '#f0e0f0', '#b0a0c8']],
  [['', '#fff8c0', '#f0c040', '#a06a10'], ['', '#ffe0d0', '#e07050', '#8a2a20']],
  [['', '#ffffff', '#fff0c0', '#d0a040'], ['', '#ffffff', '#e8e8ff', '#9090d0']],
];
const GEAR_CLOTH = ['#a06a40', '#5aa060', '#4a78c8', '#9050c0', '#c03a30', '#f0f0ff'];
// adjetivo según el efecto principal: [m, f, mp, fp]
const GEAR_ADJ = {
  atk: ['Feroz', 'Feroz', 'Feroces', 'Feroces'], esp: ['Arcano', 'Arcana', 'Arcanos', 'Arcanas'], def: ['Robusto', 'Robusta', 'Robustos', 'Robustas'],
  hp: ['Vital', 'Vital', 'Vitales', 'Vitales'], vel: ['Ágil', 'Ágil', 'Ágiles', 'Ágiles'], crit: ['Certero', 'Certera', 'Certeros', 'Certeras'],
  cd: ['Presto', 'Presta', 'Prestos', 'Prestas'], syn: ['Afín', 'Afín', 'Afines', 'Afines'], exp: ['Sabio', 'Sabia', 'Sabios', 'Sabias'],
  botin: ['Afortunado', 'Afortunada', 'Afortunados', 'Afortunadas'],
  fuego: ['Ígneo', 'Ígnea', 'Ígneos', 'Ígneas'], agua: ['Marino', 'Marina', 'Marinos', 'Marinas'], planta: ['Silvestre', 'Silvestre', 'Silvestres', 'Silvestres'],
  electrico: ['Voltaico', 'Voltaica', 'Voltaicos', 'Voltaicas'], roca: ['Pétreo', 'Pétrea', 'Pétreos', 'Pétreas'], viento: ['Eólico', 'Eólica', 'Eólicos', 'Eólicas'],
  bicho: ['Quitinoso', 'Quitinosa', 'Quitinosos', 'Quitinosas'], sombra: ['Umbrío', 'Umbría', 'Umbríos', 'Umbrías'], mente: ['Psíquico', 'Psíquica', 'Psíquicos', 'Psíquicas'],
  normal: ['Puro', 'Pura', 'Puros', 'Puras'],
};
const GEAR_G = { m: 0, f: 1, mp: 2, fp: 3 };
const GEAR_BAG_MAX = 60;

const Gear = {
  state() {
    if (!G.gear) G.gear = { eq: {}, bag: [], frag: 0, next: 1 };
    return G.gear;
  },
  slot(k) { return GEAR_SLOTS.find((s) => s.k === k); },
  // ---------- generación ----------
  rollRarity(luck = 0, min = 0) {
    const w = [620, 250, 95, 28, 6.5, 0].map((x, i) => x * Math.pow(1 + luck, i * 0.75));
    w[5] = luck >= 1 ? 0.35 * Math.pow(luck, 1.5) : 0;
    for (let i = 0; i < min; i++) w[i] = 0;
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < 6; i++) { r -= w[i]; if (r <= 0) return i; }
    return Math.max(min, 0);
  },
  value(key, rar, lv, f = 1) { return Math.max(1, Math.round(GEAR_STATS[key].v * RARITY[rar].mul * (1 + lv / 50) * f)); },
  rollAffix(rar, lv, avoid) {
    const keys = Object.keys(GEAR_STATS).filter((k) => !avoid.includes(k));
    const key = U.choice(keys), a = { k: key, v: this.value(key, rar, lv, U.rand(0.5, 0.75)) };
    if (key === 'tipo') a.t = U.choice(Object.keys(TYPES));
    return a;
  },
  make(slotK, rar, lv) {
    const S = this.state(), sl = this.slot(slotK);
    const baseK = sl.base || U.choice(['crit', 'cd', 'syn']);
    const it = { id: S.next++, slot: slotK, rar, lv, base: { k: baseK, v: this.value(baseK, rar, lv) }, aff: [] };
    it.f = U.randi(0, GEAR_FORMS[slotK].length - 1); it.m = U.randi(0, GEAR_MATS[rar].length - 1);
    this.rerollAffixes(it);
    if (rar >= 4) it.uniq = U.choice(GEAR_UNIQUE[rar]).k;
    return it;
  },
  rerollAffixes(it) {
    it.aff = [];
    const used = [it.base.k];
    for (let i = 0; i < RARITY[it.rar].affixes; i++) { const a = this.rollAffix(it.rar, it.lv, used); it.aff.push(a); if (a.k !== 'tipo') used.push(a.k); }
  },
  random(lv, luck = 0, min = 0) { return this.make(U.choice(GEAR_SLOTS).k, this.rollRarity(luck, min), lv); },
  uniqueOf(it) { return it.uniq ? GEAR_UNIQUE[it.rar].find((u) => u.k === it.uniq) : null; },
  // forma y material (las piezas antiguas los derivan de su id)
  form(it) { const l = GEAR_FORMS[it.slot]; return l[(it.f !== undefined ? it.f : it.id) % l.length]; },
  mat(it) { const l = GEAR_MATS[it.rar]; return l[(it.m !== undefined ? it.m : it.id * 7) % l.length]; },
  // efecto que da nombre a la pieza: el afijo más alto (o el tipo de daño)
  mainAff(it) {
    let best = null;
    for (const a of it.aff) if (!best || a.v > best.v) best = a;
    return best;
  },
  name(it) {
    const [fn, g] = this.form(it), u = this.uniqueOf(it);
    if (u) return `${fn} ${u.name}`;
    const a = this.mainAff(it), adj = a ? GEAR_ADJ[a.k === 'tipo' ? a.t : a.k] : null;
    let mat = this.mat(it)[0];
    if (mat === 'Rúnico') mat = ['Rúnico', 'Rúnica', 'Rúnicos', 'Rúnicas'][GEAR_G[g]];
    return [fn, adj ? adj[GEAR_G[g]] : '', mat].filter(Boolean).join(' ');
  },
  // valor total de la pieza (para comparar)
  score(it) { return it ? [it.base].concat(it.aff).reduce((s, a) => s + a.v, 0) + (it.uniq ? 25 : 0) : 0; },
  // diferencia de efectos frente a otra pieza: {clave: delta}
  diff(it, other) {
    const sum = (x) => { const o = {}; if (x) for (const a of [x.base].concat(x.aff)) { const k = a.k === 'tipo' ? 'tipo:' + a.t : a.k; o[k] = (o[k] || 0) + a.v; } return o; };
    const A = sum(it), B = sum(other), d = {};
    for (const k of new Set(Object.keys(A).concat(Object.keys(B)))) { const v = (A[k] || 0) - (B[k] || 0); if (v) d[k] = v; }
    return d;
  },
  affText(a, short) {
    const s = GEAR_STATS[a.k];
    const label = a.k === 'tipo' ? (short ? TYPES[a.t].name.slice(0, 3).toUpperCase() : `Daño ${TYPES[a.t].name}`) : short ? s.s : s.name;
    return `${label} ${s.neg ? '−' : '+'}${a.v}%`;
  },
  // ---------- totales ----------
  totals() {
    if (!G || G.practice) return { uniq: {} };
    const S = this.state(), t = { uniq: {}, tipo: {} };
    for (const sl of GEAR_SLOTS) {
      const it = S.eq[sl.k]; if (!it) continue;
      for (const a of [it.base].concat(it.aff)) {
        if (a.k === 'tipo') t.tipo[a.t] = (t.tipo[a.t] || 0) + a.v;
        else t[a.k] = (t[a.k] || 0) + a.v;
      }
      if (it.uniq) t.uniq[it.uniq] = true;
    }
    for (const k in GEAR_STATS) if (k !== 'tipo' && t[k]) t[k] = Math.min(t[k], GEAR_STATS[k].cap);
    for (const k in t.tipo) t.tipo[k] = Math.min(t.tipo[k], GEAR_STATS.tipo.cap);
    return t;
  },
  owned(c) { return !!(G && c && (G.party.indexOf(c) >= 0 || (G.box && G.box.indexOf(c) >= 0))); },
  clampHp() { for (const c of G.party) { const mx = calcStats(c).hp; if (c.hp > mx) c.hp = mx; } },
  // ---------- inventario ----------
  add(it) {
    const S = this.state();
    if (S.bag.length >= GEAR_BAG_MAX) { S.frag += RARITY[it.rar].frag; return false; }
    S.bag.push(it); return true;
  },
  equip(it) {
    const S = this.state(), old = S.eq[it.slot];
    S.bag.splice(S.bag.indexOf(it), 1);
    if (old) S.bag.push(old);
    S.eq[it.slot] = it; this.clampHp();
  },
  unequip(slotK) { const S = this.state(), it = S.eq[slotK]; if (!it) return; delete S.eq[slotK]; S.bag.push(it); this.clampHp(); },
  salvage(it) { const S = this.state(); S.bag.splice(S.bag.indexOf(it), 1); S.frag += RARITY[it.rar].frag; },
  // ---------- botín de combate ----------
  dropFor(B, f) {
    if (B.opts.practice || !G || G.practice) return null;
    const t = this.totals(), dng = typeof Dungeon !== 'undefined' && Dungeon.active();
    let chance = 0.06, luck = 0, min = 0;
    if (B.wild) {
      if (dng) { chance = 0.15; luck = 0.6; }
      if (f.c.alpha) { chance = 0.65; luck = dng ? 1.6 : 1.2; }
      if (B.opts.boss) { chance = 1; luck = 2.5; min = 2; }
      if (f.sp.legendary) { chance = 1; luck = 2.5; min = 3; }
    } else {
      chance = 0.08; luck = 0.3;
      const last = B.foeQueue.every((c) => c === f.c || c.hp <= 0);
      if (B.opts.boss && last) { chance = 1; luck = 1.4; min = 1; }
    }
    if (t.uniq.avaricia) { chance *= 2; luck += 0.8; }
    luck *= 1 + (t.botin || 0) / 100;
    if (Math.random() >= chance) return null;
    return this.random(f.c.lv, luck, min);
  },
  async announce(it, B) {
    const kept = this.add(it), r = RARITY[it.rar];
    Sound.jingle('item');
    const txt = kept ? `¡Botín: ${this.name(it)} (${r.name})!` : `Botín: ${this.name(it)} → mochila llena, +${r.frag} fragmentos`;
    if (B) await B.banner(txt, it.rar >= 3 ? 1.8 : 1.3, r.color); else await say(txt);
    if (!G.flags.gear_tut) G.flags.gear_tut_pending = true;
  },
};

// ---------- efectos sobre las ánimas ----------
{
  const _calc = calcStats;
  calcStats = function (c) {
    const s = _calc(c);
    if (!Gear.owned(c)) return s;
    const t = Gear.totals();
    for (const k of ['atk', 'esp', 'def', 'vel', 'hp']) if (t[k]) s[k] = Math.floor(s[k] * (1 + t[k] / 100));
    return s;
  };
  const _mods = fighterMods;
  fighterMods = function (c) {
    const m = _mods(c);
    if (!Gear.owned(c)) return m;
    const t = Gear.totals();
    m.crit += (t.crit || 0) / 100;
    m.cd *= 1 - (t.cd || 0) / 100;
    if (t.uniq.cronos) m.cd *= 0.7;
    m.syn *= 1 + (t.syn || 0) / 100;
    for (const ty in t.tipo) m.typeBoost[ty] = (m.typeBoost[ty] || 1) * (1 + t.tipo[ty] / 100);
    m.gear = t.uniq;
    return m;
  };
  const _gain = gainExp;
  gainExp = function (c, amount) {
    if (Gear.owned(c)) { const t = Gear.totals(); if (t.exp) amount = Math.round(amount * (1 + t.exp / 100)); }
    return _gain(c, amount);
  };
}

// ---------- efectos únicos y botín en combate ----------
{
  const BP = BattleScene.prototype;
  const _hit = BP.hit;
  BP.hit = function (tgt, att, m, mult = 1, ang = 0) {
    const ga = att && att.side === 'ally' && att.mods.gear, gt = tgt && tgt.side === 'ally' && tgt.mods.gear;
    if (ga && ga.iniciativa && !this.gearFirst && !tgt.fainted) { mult *= 1.4; this.gearFirst = true; }
    if (ga && ga.segador && tgt.hp < tgt.maxHp * 0.3) mult *= 1.35;
    if (ga && ga.impulso && att.gearImp) { mult *= 1.3; att.gearImp = false; this.addNum(att.x, att.y - 40, 'Impulso', '#a0ffd0'); }
    if (gt && gt.centinela && !this.gearCent && m.pow && att && att.side === 'foe') { mult *= 0.4; this.gearCent = true; this.addNum(tgt.x, tgt.y - 40, 'Centinela', '#c0d8ff'); }
    const hp0 = tgt.hp;
    const r = _hit.call(this, tgt, att, m, mult, ang);
    const dmg = hp0 - tgt.hp;
    if (dmg > 0) {
      if (ga && ga.vampiro) att.hp = Math.min(att.maxHp, att.hp + dmg * 0.08);
      if (gt && gt.espinas && att && att.side === 'foe' && ['melee', 'dash', 'stealth'].includes(m.kind)) {
        const back = Math.max(1, Math.round(dmg * 0.15)); att.hp -= back; this.addNum(att.x, att.y - 16, String(back), '#ffb0b0');
      }
      if (gt && gt.fenix && tgt.hp <= 0 && !this.gearFenix) {
        this.gearFenix = true; tgt.hp = Math.ceil(tgt.maxHp * 0.3); tgt.invuln = 1.2;
        this.sparkle(tgt.x, tgt.y, '#ffb040', 24); this.addNum(tgt.x, tgt.y - 40, '¡Fénix!', '#ffb040'); Sound.sfx('heal');
      }
    }
    return r;
  };
  const _start = BP.startMove;
  BP.startMove = function (f, i, cm = 1) {
    const ok = _start.call(this, f, i, cm);
    const g = ok && f.side === 'ally' && f.mods.gear;
    if (g) {
      if (g.eco && Math.random() < 0.12) { f.cds[i] = 0; this.addNum(f.x, f.y - 40, 'Eco', '#a0e8ff'); }
      if (g.tempestad) {
        this.gearTemp = (this.gearTemp || 0) + 1;
        if (this.gearTemp % 4 === 0) Timers.wait(0.3).then(() => {
          if (this.state !== 'fight' || f.fainted || f.inBall) return;
          const T = this.targetOf(f);
          this.burst(f.x, f.y, f.types[0], 24, 140); Sound.sfx('zap'); Shake.start(2, 0.2);
          this.addNum(f.x, f.y - 44, '¡Tempestad!', '#ffe080');
          if (T && !T.inBall && U.dist(f.x, f.y, T.x, T.y) < 70) {
            const fis = f.st.atk >= f.st.esp;
            _hit.call(this, T, f, { name: 'Tempestad', type: f.types[0], pow: 45, cat: fis ? 'fis' : 'esp', kind: 'ring', acc: 100 }, 1, Math.atan2(T.y - f.y, T.x - f.x));
          }
        });
      }
    }
    return ok;
  };
  // espejismo: esquiva más larga y recarga más corta
  const _upd = BP.update;
  BP.update = function (dt0) {
    const f = this.ally, cd0 = f ? f.dodgeCd : 0;
    _upd.call(this, dt0);
    const g = f && f.mods.gear; if (!g) return;
    const dodged = f.dodgeCd > cd0 + 0.3;
    if (g.espejismo && dodged) { f.dodgeCd *= 0.75; f.dodgeT += 0.08; f.invuln = Math.max(f.invuln, 0.28); }
    if (g.impulso && dodged) f.gearImp = true;
    if (g.savia && this.state === 'fight' && f.hp > 0 && f.hp < f.maxHp) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.006 * dt0 * (this.timeScale || 1));
  };
  // aurora: entran con media Sinergia
  const _mk = BP.mkFighter;
  BP.mkFighter = function (c, side) {
    const f = _mk.call(this, c, side);
    if (side === 'ally' && f.mods.gear && f.mods.gear.aurora) f.syn = Math.max(f.syn || 0, 50);
    return f;
  };
  const _faint = BP.onFoeFaint;
  BP.onFoeFaint = async function () {
    const f = this.foe;
    await _faint.call(this);
    const it = Gear.dropFor(this, f);
    if (it) await Gear.announce(it, this);
  };
  // tras el combate: aviso de la primera pieza
  const _fin = BP.finish;
  BP.finish = async function (res) {
    const r = await _fin.call(this, res);
    if (G.flags.gear_tut_pending && !G.flags.gear_tut) {
      G.flags.gear_tut = true; delete G.flags.gear_tut_pending;
      World.runScript(async () => { await say(['¡Has conseguido tu primera pieza de equipamiento!', 'Equípala desde el menú → EQUIPAMIENTO. Sus efectos ayudan a todas tus ánimas.', 'Cuanto más rara (Común, Poco común, Raro, Épico, Legendario, Divino), mejor. Los alfas sueltan las mejores.']); });
    }
    return r;
  };
}
// el alfa colosal de las grietas deja además dos piezas buenas
{
  const _boss = Story.scripts.dng_boss;
  Story.scripts.dng_boss = async function (def, npc) {
    const had = Game.flag('dng_boss_' + G.dng.seed);
    await _boss.call(this, def, npc);
    if (had || !Game.flag('dng_boss_' + G.dng.seed)) return;
    for (let i = 0; i < 2; i++) await Gear.announce(Gear.random(def.lv, 2.5, 2), null);
  };
}

