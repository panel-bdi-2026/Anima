'use strict';
// ============================================================
//  GRIETAS ÁNIMA (mazmorras procedurales)
//  - Cada vez que entras, la grieta se genera de nuevo (3 pisos)
//  - Temas: bosque, caverna y volcán; ánimas salvajes más fuertes
//    y muchos más alfas; cofres con objetos
//  - Último piso: un ALFA colosal que deja botín de gran calidad
//  - Salir: Cuerda Huida, Piedra Retorno, la habilidad Teletransporte
//    (Mente) o Excavar (Roca), o el portal tras vencer al jefe
// ============================================================

// ---------- casillas y objetos ----------
TILEDEF['Ψ'] = { t: 'rift', solid: true };
TILEDEF['Ω'] = { t: 'dngstairs' };
TILEDEF['Θ'] = { t: 'dngexit' };
Object.assign(Obj.draw, {
  rift(x, f) {
    const cols = ['#2a0a40', '#5a1a8a', '#9a40e0', '#d090ff', '#ffffff'];
    for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) {
      const dx = (i - 7.5) / 6.5, dy = (y - 8.5) / 7.5, d = dx * dx + dy * dy;
      if (d > 1) continue;
      const a = Math.atan2(dy, dx) + f * 0.8 + d * 4;
      const k = U.clamp(Math.floor((1 - d) * 3 + Math.sin(a * 3) * 0.8 + 0.5), 0, 4);
      P(x, i, y, 1, 1, cols[k]);
    }
    P(x, 7, 7, 2, 2, '#ffffff');
  },
  dngstairs(x) {
    P(x, 1, 1, 14, 14, '#14101a'); P(x, 2, 2, 12, 12, '#000000');
    for (let s = 0; s < 4; s++) { P(x, 3 + s, 3 + s * 3, 10 - s * 2, 2, s % 2 ? '#5a4a3a' : '#6a5a48'); P(x, 3 + s, 3 + s * 3, 10 - s * 2, 1, '#8a7a60'); }
    P(x, 1, 1, 14, 1, '#6a5a70'); P(x, 1, 1, 1, 14, '#6a5a70');
  },
  dngexit(x, f) { Obj.draw.rift(x, f); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(80,220,140,0.55)'; x.fillRect(0, 0, 16, 16); x.globalCompositeOperation = 'source-over'; },
});
LIVE_OBJ.add('rift'); LIVE_OBJ.add('dngexit');
OBJ_OF.dngstairs = 'dngstairs';
{
  const _anim = World.drawAnimTiles;
  World.drawAnimTiles = function (ctx, cx, cy, L) {
    _anim.call(this, ctx, cx, cy, L);
    if (!Terrain.usesNew(this.map)) return;
    const fr = Math.floor(Engine.time * 6) % 8;
    for (const [tx, ty, t] of this.animTiles) {
      if (t !== 'rift' && t !== 'dngexit') continue;
      const sx = tx * 16 - cx, sy = ty * 16 - cy;
      if (sx < -16 || sy < -16 || sx > W || sy > H) continue;
      ctx.drawImage(Obj.get(t, fr), sx, sy);
    }
  };
  const _lights = World.collectLights;
  World.collectLights = function (cx, cy, L) {
    const out = _lights.call(this, cx, cy, L);
    for (const [tx, ty, t] of this.animTiles || []) if (t === 'rift' || t === 'dngexit') out.push({ x: tx * 16 + 8 - cx, y: ty * 16 + 8 - cy, r: 46, i: 0.9, glow: t === 'rift' ? '#b060ff' : '#60ffa0', gr: 26 });
    return out;
  };
}

// ---------- objetos de botín ----------
Object.assign(ITEMS, {
  colmillo_alfa: { name: 'Colmillo Alfa', price: 0, desc: 'Amuleto de un alfa colosal. +15% de críticos y +6% de velocidad.', held: true, critAdd: 0.15, speed: 1.06, icon: 'charm', color: '#ff5060' },
  escudo_alfa: { name: 'Escudo Alfa', price: 0, desc: 'Amuleto de un alfa colosal. Reduce un 20% el daño recibido.', held: true, taken: 0.8, icon: 'charm', color: '#d0a040' },
  corona_alfa: { name: 'Corona Alfa', price: 0, desc: 'Amuleto de un alfa colosal. Sinergia un 50% más rápida y recargas un 12% más cortas.', held: true, synMul: 1.5, cdMul: 0.88, icon: 'charm', color: '#ffd848' },
  piedra_retorno: { name: 'Piedra Retorno', price: 0, desc: 'Objeto clave. Te saca de una Grieta Ánima al instante. Se puede usar siempre.', key: true, icon: 'core', color: '#b060ff', target: 'field', dngEscape: true },
});

// ---------- generador ----------
const DNG_THEMES = {
  bosque: { name: 'Grieta Frondosa', outdoor: true, dark: 0.38, wall: 'T', floor: '.', grass: ',', pool: '~', deco: ['R', 'f'], music: 'forest', types: ['planta', 'bicho', 'normal', 'viento'] },
  caverna: { name: 'Grieta Profunda', cave: true, wall: 'C', floor: 'c', grass: null, pool: 'w', deco: ['o'], music: 'cave', types: ['roca', 'sombra', 'electrico', 'mente'] },
  volcan: { name: 'Grieta Ígnea', outdoor: true, volcanic: true, dark: 0.3, wall: 'W', floor: '%', grass: ',', pool: 'A', deco: ['®'], music: 'volcano', types: ['fuego', 'roca', 'sombra', 'electrico'] },
};
const Dungeon = {
  W: 42, H: 32,
  active() { return !!(G && G.dng && World.map && World.map.id === 'dng'); },
  rng(seed) { return mulberry(seed); },
  partyLevel() { const l = G.party.map((c) => c.lv).sort((a, b) => b - a); return Math.round(l.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, l.length)); },
  // cuevas por autómata celular, con la región conectada más grande
  carve(r) {
    const W = this.W, H = this.H, g = [];
    for (let y = 0; y < H; y++) { g.push([]); for (let x = 0; x < W; x++) g[y].push(x < 2 || y < 2 || x >= W - 2 || y >= H - 2 ? 1 : r() < 0.44 ? 1 : 0); }
    for (let it = 0; it < 5; it++) {
      const n = g.map((row) => row.slice());
      for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
        let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) c += g[y + dy][x + dx];
        n[y][x] = c >= 5 ? 1 : 0;
      }
      for (let y = 0; y < H; y++) g[y] = n[y];
    }
    // ensancha: elimina muros sueltos y pasillos de 1 casilla
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) if (g[y][x] && !g[y - 1][x] && !g[y + 1][x]) g[y][x] = 0;
    // región más grande
    const seen = new Int32Array(W * H).fill(-1); let best = -1, bestN = 0, id = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] || seen[y * W + x] >= 0) continue;
      let n = 0; const q = [[x, y]]; seen[y * W + x] = id;
      while (q.length) { const [a, b] = q.pop(); n++; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = a + dx, ny = b + dy; if (!g[ny][nx] && seen[ny * W + nx] < 0) { seen[ny * W + nx] = id; q.push([nx, ny]); } } }
      if (n > bestN) { bestN = n; best = id; } id++;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!g[y][x] && seen[y * W + x] !== best) g[y][x] = 1;
    return { g, size: bestN };
  },
  bfs(g, sx, sy) {
    const W = this.W, H = this.H, d = new Int32Array(W * H).fill(-1), q = [[sx, sy]]; d[sy * W + sx] = 0;
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || g[ny][nx] || d[ny * W + nx] >= 0) continue; d[ny * W + nx] = d[y * W + x] + 1; q.push([nx, ny]); } }
    return d;
  },
  generate(theme, floor, seed) {
    const T = DNG_THEMES[theme], r = this.rng(seed), W = this.W, H = this.H;
    let cave;
    for (let k = 0; k < 20; k++) { cave = this.carve(r); if (cave.size > 380) break; }
    const g = cave.g, cells = [];
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) if (!g[y][x]) cells.push([x, y]);
    // inicio y punto más lejano
    const start = cells[Math.floor(r() * cells.length)];
    let d = this.bfs(g, start[0], start[1]), far = start, fd = 0;
    for (const [x, y] of cells) if (d[y * W + x] > fd) { fd = d[y * W + x]; far = [x, y]; }
    const boss = floor >= 3;
    if (boss) { // sala del jefe: círculo abierto alrededor del punto lejano
      for (let y = -5; y <= 5; y++) for (let x = -6; x <= 6; x++) { const X = far[0] + x, Y = far[1] + y; if (X > 1 && Y > 1 && X < W - 2 && Y < H - 2 && (x * x) / 36 + (y * y) / 25 <= 1) g[Y][X] = 0; }
      d = this.bfs(g, start[0], start[1]);
    }
    const rows = g.map((row) => row.map((v) => (v ? T.wall : T.floor)));
    const set = (x, y, ch) => { rows[y][x] = ch; };
    const free = (x, y) => rows[y][x] === T.floor;
    // hierba alta (zonas de encuentros) y charcos/lava sin cortar el camino
    const nz = this.rng(seed * 7 + 3);
    const blob = (cx, cy, rad, ch, check) => { for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) { const X = cx + x, Y = cy + y; if (X < 2 || Y < 2 || X >= W - 2 || Y >= H - 2) continue; if (x * x + y * y <= rad * rad + nz() * 2 && free(X, Y) && (!check || check(X, Y))) set(X, Y, ch); } };
    const nearKey = (X, Y, rad) => Math.abs(X - start[0]) + Math.abs(Y - start[1]) < rad || Math.abs(X - far[0]) + Math.abs(Y - far[1]) < (boss ? 8 : rad);
    if (T.grass) for (let i = 0; i < 7; i++) { const [cx, cy] = cells[Math.floor(nz() * cells.length)]; blob(cx, cy, 2 + Math.floor(nz() * 2), T.grass, (X, Y) => !nearKey(X, Y, 3)); }
    for (let i = 0; i < 3; i++) {
      const [cx, cy] = cells[Math.floor(nz() * cells.length)];
      const before = rows.map((row) => row.slice());
      blob(cx, cy, 1 + Math.floor(nz() * 2), T.pool, (X, Y) => !nearKey(X, Y, 4));
      const gg = rows.map((row) => row.map((ch) => ((TILEDEF[ch] || {}).solid ? 1 : 0)));
      const dd = this.bfs(gg, start[0], start[1]);
      if (dd[far[1] * W + far[0]] < 0) for (let y = 0; y < H; y++) rows[y] = before[y];
    }
    // decoración (rocas, flores) en casillas que no bloquean
    for (let i = 0; i < 18; i++) {
      const [x, y] = cells[Math.floor(nz() * cells.length)];
      if (!free(x, y) || nearKey(x, y, 3)) continue;
      const ch = T.deco[Math.floor(nz() * T.deco.length)];
      const solid = (TILEDEF[ch] || {}).solid;
      if (solid) { let open = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (free(x + dx, y + dy)) open++; if (open < 4) continue; }
      set(x, y, ch);
    }
    // cofres en callejones sin salida
    const items = [];
    const dead = cells.filter(([x, y]) => free(x, y) && !nearKey(x, y, 3) && [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => rows[y + dy][x + dx] === T.wall).length >= 3);
    const pool = floor >= 3 ? [] : this.chestPool();
    for (let i = 0; i < 3 + Math.floor(nz() * 2) && dead.length && pool.length; i++) {
      const k = Math.floor(nz() * dead.length), [x, y] = dead.splice(k, 1)[0];
      const [item, qty] = pool[Math.floor(nz() * pool.length)];
      items.push({ x, y, item, qty, flag: 'dng_' + seed + '_' + floor + '_' + i });
    }
    const triggers = [], npcs = [];
    if (!boss) { set(far[0], far[1], 'Ω'); triggers.push({ x: far[0], y: far[1], w: 1, h: 1, script: 'dng_next' }); }
    else {
      npcs.push({ id: 'dng_boss', x: far[0], y: far[1], creature: this.bossSpecies(theme, seed), lv: this.partyLevel() + 6, dir: 'down', big: true, script: 'dng_boss', hideIf: 'dng_boss_' + seed });
    }
    const L0 = this.partyLevel() + 1 + floor;
    const species = this.speciesFor(theme, seed + floor);
    return {
      id: 'dng', name: `${T.name} · Piso ${floor}${boss ? ' (fondo)' : ''}`, music: T.music, outdoor: !!T.outdoor, cave: !!T.cave, volcanic: !!T.volcanic, dark: T.dark, dungeon: true, noSwim: true,
      rows: rows.map((row) => row.join('')), w: W, h: H, start, far, items, triggers, npcs, warps: [], signs: [], buildings: [],
      encounters: { rate: 0.16, cave: !!T.cave, list: species.map((sp, i) => ({ sp, min: L0, max: L0 + 3, w: 10 + i * 3 })) },
    };
  },
  speciesFor(theme, seed) {
    const T = DNG_THEMES[theme], r = this.rng(seed * 13 + 5);
    const list = SPECIES_LIST.filter((s) => !s.legendary && !s.chimera && s.stage <= 2 && s.types.some((t) => T.types.includes(t)));
    const out = [];
    while (out.length < 6 && list.length) out.push(list.splice(Math.floor(r() * list.length), 1)[0].key);
    return out;
  },
  bossSpecies(theme, seed) {
    const T = DNG_THEMES[theme], r = this.rng(seed * 31 + 9);
    const list = SPECIES_LIST.filter((s) => !s.legendary && !s.chimera && s.stage === 3 && s.types.some((t) => T.types.includes(t)));
    return list[Math.floor(r() * list.length)].key;
  },
  chestPool() {
    const lv = this.partyLevel();
    const p = [['superpocion', 2], ['hiperpocion', 1], ['revivir', 1], ['superesfera', 3], ['esfera_rapida', 2], ['esfera_nocturna', 2], ['baya_dulce', 3], ['mineral', 4], ['cuerda', 1]];
    if (lv >= 25) p.push(['ultraesfera', 3], ['hiperpocion', 2], ['caramelo', 1]);
    return p;
  },
  // ---------- entrar / bajar / salir ----------
  async enter(theme, ret) {
    if (!G.party.length || !Game.firstAlive()) { await say('Tus ánimas no están en condiciones de entrar.'); return; }
    const T = DNG_THEMES[theme];
    await say([`Una ${T.name} late con energía extraña...`, 'Dicen que cada vez que entras su interior es distinto, y que en el fondo duerme un alfa colosal.', 'No hay Centros Ánima dentro. ¿Seguro que quieres entrar?']);
    if ((await ask('¿Entrar en la grieta?')) !== 0) return;
    G.dng = { theme, floor: 1, seed: (Date.now() % 100000) + Math.floor(Math.random() * 1000), ret };
    await this.goFloor();
  },
  async goFloor() {
    const D = G.dng;
    const m = this.generate(D.theme, D.floor, D.seed + D.floor * 101);
    MAPS.dng = m; delete World.layerCache.dng;
    Sound.sfx('shadow');
    await World.warpTo('dng', m.start[0], m.start[1], 'down');
    World.banner = { text: m.name, t: 0 };
  },
  async exit(msg) {
    const D = G.dng; if (!D) return;
    if (msg) await say(msg);
    G.dng = null;
    for (const k of Object.keys(G.flags)) if (k.startsWith('dng_')) delete G.flags[k];
    await World.warpTo(D.ret.map, D.ret.x, D.ret.y, 'down');
  },
  escapers() { return G.party.filter((c) => c.hp > 0 && (SPECIES[c.sp].types.includes('mente') || SPECIES[c.sp].types.includes('roca'))); },
  async escapeAbility() {
    const c = this.escapers()[0];
    if (!c) { await say('Ninguna de tus ánimas sabe Teletransporte (Mente) ni Excavar (Roca).'); return false; }
    const how = SPECIES[c.sp].types.includes('mente') ? 'Teletransporte' : 'Excavar';
    await this.exit(`¡${cName(c)} usó ${how}! Salís de la grieta.`);
    return true;
  },
  loot() {
    const r = Math.random;
    const out = [['caramelo', 2], [U.choice(['colmillo_alfa', 'escudo_alfa', 'corona_alfa']), 1]];
    const pool = [['ultraesfera', 5], ['hiperpocion', 3], ['revivir', 2], ['piedra_sinergia', 1], ['lente_foco', 1], ['nucleo_mente', 1], ['nucleo_hierro', 1], ['esfera_rapida', 5], ['caramelo', 2]];
    for (let i = 0; i < 2; i++) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    if (r() < 0.08) out.push(['maestra', 1]);
    return out;
  },
};

// ---------- guiones ----------
Object.assign(Story.scripts, {
  async dng_next() {
    if (!Dungeon.active()) return;
    Sound.sfx('door');
    await say(`Bajas al piso ${G.dng.floor + 1}...`);
    await Fade.out(0.4);
    G.dng.floor++;
    await Dungeon.goFloor();
  },
  async dng_boss(def, npc) {
    const sp = SPECIES[def.creature];
    Sound.music('boss'); Shake.start(3, 0.8); Sound.sfx('shadow');
    await say([`¡Un ${sp.name} ALFA colosal custodia el fondo de la grieta!`, 'Su aura roja hace temblar el suelo...']);
    const c = newCreature(def.creature, def.lv); c.alpha = true;
    const res = await Battle.wild(c, { foePos: [npc.x * 16 + 8, npc.y * 16 + 12], hideNpc: npc, boss: true, music: 'boss' });
    if (res !== 'win' && res !== 'caught') { Sound.music(World.map.music); return; }
    Game.setFlag('dng_boss_' + G.dng.seed);
    World.refreshNpcs();
    // botín
    const loot = Dungeon.loot();
    Sound.jingle('item');
    await say('¡El alfa ha dejado un botín extraordinario!');
    for (const [k, q] of loot) Game.give(k, q);
    await say('Recibes: ' + loot.map(([k, q]) => `${ITEMS[k].name} ×${q}`).join(', ') + '.');
    G.stats = G.stats || {}; G.stats.dng_clears = (G.stats.dng_clears || 0) + 1;
    if (!G.bag.piedra_retorno) { Game.give('piedra_retorno', 1); Sound.jingle('item'); await say(`¡También encuentras una Piedra Retorno! Con ella podrás salir de cualquier grieta cuando quieras.`); }
    // portal de salida donde estaba el jefe
    World.setTile(npc.x, npc.y, 'Θ');
    World.map.triggers.push({ x: npc.x, y: npc.y, w: 1, h: 1, script: 'dng_exitportal' });
    Sound.music(World.map.music);
    await say('Se ha abierto un portal de salida.');
  },
  async dng_exitportal() { await Dungeon.exit('Atraviesas el portal y vuelves a la superficie.'); },
});
// el portal es transitable
TILEDEF['Θ'].solid = false;

// ---------- entradas a las grietas ----------
const RIFTS = [
  { map: 'bosque', x: 9, y: 5, theme: 'bosque', need: () => G.badges[0], needText: 'La grieta rechaza a quien no tiene la Medalla Raíz.' },
  { map: 'ruta3', x: 6, y: 13, theme: 'caverna', need: () => G.badges[1], needText: 'La grieta rechaza a quien no tiene la Medalla Peña.' },
  { map: 'ruta5', x: 37, y: 11, theme: 'volcan', need: () => G.flags.chapter1_done, needText: 'Una fuerza invisible te impide entrar. Vuelve más adelante.' },
];
for (const R0 of RIFTS) setCh(MAPS[R0.map], R0.x, R0.y, 'Ψ');
{
  const _interact = World.interact;
  World.interact = function () {
    const p = this.player, [dx, dy] = DIRS[p.dir], x = p.x + dx, y = p.y + dy;
    if (this.charAt(x, y) === 'Ψ') {
      const R0 = RIFTS.find((r) => r.map === this.map.id && r.x === x && r.y === y);
      if (R0) {
        this.runScript(async () => {
          if (!R0.need()) { await say(['Una grieta brillante flota en el aire...', R0.needText]); return; }
          await Dungeon.enter(R0.theme, { map: this.map.id, x: p.x, y: p.y });
        });
        return;
      }
    }
    return _interact.call(this);
  };
  // más alfas dentro de las grietas
  const _alpha = Wild.alphaChance;
  Wild.alphaChance = function () { return Dungeon.active() ? 0.2 : _alpha.call(this); };
  // el alfa colosal se ve más grande
  const _drawEntity = World.drawEntity;
  World.drawEntity = function (ctx, e, cx, cy) {
    if (e.def && e.def.creature && e.def.big) {
      const sx = Math.round(e.px - cx), sy = Math.round(e.py - cy);
      if (e.animSeed === undefined) e.animSeed = 1;
      ctx.globalAlpha = 0.3 + 0.15 * Math.sin(Engine.time * 5); pixCircle(ctx, sx + 8, sy + 12, 20, '#ff2040'); ctx.globalAlpha = 1;
      drawShadow(ctx, sx + 8, sy + 14, 16, 4, 0.35);
      CreatureAnim.draw(ctx, e, { sp: e.def.creature, S: 56, px: sx + 8, py: sy + 14, flip: false, t: Engine.time, dt: 1 / 60 });
      return;
    }
    return _drawEntity.call(this, ctx, e, cx, cy);
  };
}
// ---------- salir: Cuerda Huida, Piedra Retorno y habilidades ----------
{
  const _use = useItemField;
  useItemField = async function (id) {
    const it = ITEMS[id];
    if ((it.escape || it.dngEscape) && Dungeon.active()) {
      if (it.escape) Game.take(id);
      closeMenus();
      await Dungeon.exit(`¡Usaste ${it.name}! Sales de la grieta.`);
      return true;
    }
    if (it.dngEscape) { await say('Solo funciona dentro de una Grieta Ánima.'); return false; }
    return _use(id);
  };
  StartMenu.prototype.items = (function (orig) {
    return function () { const it = orig.call(this); if (Dungeon.active()) it.splice(1, 0, ['ESCAPAR', 'dngescape']); return it; };
  })(StartMenu.prototype.items);
  StartMenu.prototype.pick = (function (orig) {
    return async function (k) {
      if (k !== 'dngescape') return orig.call(this, k);
      this.busy = true;
      const opts = [];
      if (Dungeon.escapers().length) opts.push('Habilidad');
      if (G.bag.piedra_retorno) opts.push('Piedra Retorno');
      if (G.bag.cuerda) opts.push(`Cuerda Huida ×${G.bag.cuerda}`);
      if (!opts.length) { await say(['No tienes forma de escapar.', 'Necesitas una Cuerda Huida (en las tiendas), la Piedra Retorno, o un ánima de tipo Mente (Teletransporte) o Roca (Excavar).']); this.busy = false; return; }
      const r = await choose(opts.concat(['Cancelar']), { x: 150, y: 60, w: 160 });
      const pick = opts[r];
      if (!pick) { this.busy = false; return; }
      this.done();
      World.runScript(async () => {
        if (pick === 'Habilidad') await Dungeon.escapeAbility();
        else if (pick === 'Piedra Retorno') await Dungeon.exit('La Piedra Retorno brilla... ¡Sales de la grieta!');
        else { Game.take('cuerda'); await Dungeon.exit('¡Usaste la Cuerda Huida! Sales de la grieta.'); }
      });
    };
  })(StartMenu.prototype.pick);
  // no se puede viajar en carruaje desde una grieta
  const _travel = RegionMapScreen.prototype.travel;
  RegionMapScreen.prototype.travel = async function () {
    if (Dungeon.active()) { this.busy = true; await say('No puedes llamar al carruaje desde dentro de una grieta.'); this.busy = false; return; }
    return _travel.call(this);
  };
  // al perder dentro, la grieta se cierra
  const _black = World.blackout0;
  World.blackout0 = async function () { if (G.dng) { G.dng = null; for (const k of Object.keys(G.flags)) if (k.startsWith('dng_')) delete G.flags[k]; } return _black.call(this); };
  // partidas guardadas dentro: se vuelve a la entrada al cargar
  const _load = Game.load;
  Game.load = function (i) {
    const ok = _load.call(this, i);
    if (ok && (G.map === 'dng' || !MAPS[G.map])) { const r = G.dng && G.dng.ret; G.dng = null; if (r) { G.map = r.map; G.x = r.x; G.y = r.y; } else { G.map = G.lastHeal.map; G.x = G.lastHeal.x; G.y = G.lastHeal.y; } }
    return ok;
  };
}
// la cuerda también en más tiendas
for (const k of ['musgo', 'cefiro']) if (SHOPS[k] && !SHOPS[k].includes('cuerda')) SHOPS[k].push('cuerda');
// objetivos y códice
Objectives.list.splice(Objectives.list.length - 1, 0, [() => (G.stats && G.stats.dng_clears) ? false : G.badges[0], 'Explora una Grieta Ánima (bosque, Ruta 3 o Ruta 5) y derrota al alfa colosal.']);
// las grietas se dibujan solo como objeto animado (sin casilla de respaldo)
TileDraw.rift = () => {}; TileDraw.dngexit = () => {}; TileDraw.dngstairs = () => {};
