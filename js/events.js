'use strict';
// ============================================================
//  EVENTOS DEL CALENDARIO
//  - Días de la semana (el día 1 es lunes)
//  - Sábado: mercado con un 20% de descuento en las tiendas
//  - Domingo: el doble de ánimas alfa
//  - Domingo por la noche: festival de farolillos en Villa Musgo
//  - Los vecinos comentan tu estilo de combate
// ============================================================

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const Events = {
  dayIndex() { return ((((G && G.day) || 1) - 1) % 7 + 7) % 7; },
  dayName() { return DAY_NAMES[this.dayIndex()]; },
  isSaturday() { return this.dayIndex() === 5; },
  isSunday() { return this.dayIndex() === 6; },
  buyPrice(it) { return this.isSaturday() ? Math.max(1, Math.round(it.price * 0.8)) : it.price; },
  alphaMul() { return this.isSunday() ? 2 : 1; },
  festival() { if (!G || !this.isSunday()) return false; const h = Clock.hour(); return h >= 19 && h < 24; },
  musicFor(m, name) { return m.id === 'villa_musgo' && this.festival() ? 'festival' : null; },
};

// mercado del sábado
{
  const _shop = Story.scripts.shop;
  Story.scripts.shop = async function (def, npc) {
    if (Events.isSaturday() && !G.flags['market_' + G.day]) { G.flags['market_' + G.day] = 1; await say('¡Hoy es sábado de mercado! Todo cuesta un 20% menos.', { speaker: 'Dependiente' }); }
    return _shop.call(this, def, npc);
  };
}

// ---------- festival de farolillos ----------
const Festival = {
  sparks: [], t: 0,
  lanterns() { const out = []; for (let x = 4; x <= 25; x += 3) out.push([x * 16 + 8, 13 * 16 - 6 + ((x % 2) ? 3 : 0)]); return out; },
  update(dt) {
    this.t += dt;
    if (Math.random() < dt * 0.9) {
      const x = U.rand(60, 400), y = U.rand(30, 120), col = U.choice(['#ff6080', '#ffd040', '#60e0ff', '#a0ff80', '#e080ff']);
      for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2, s = U.rand(30, 60); this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1.2, col }); }
      Sound.sfx('poof');
    }
    for (const p of this.sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 25 * dt; p.vx *= 0.98; p.life -= dt; }
    this.sparks = this.sparks.filter((p) => p.life > 0);
  },
  draw(ctx, cx, cy) {
    // guirnalda de farolillos sobre la plaza
    const L = this.lanterns();
    ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 1; ctx.beginPath();
    L.forEach(([x, y], k) => (k ? ctx.lineTo(x - cx, y - cy - 4) : ctx.moveTo(x - cx, y - cy - 4))); ctx.stroke();
    L.forEach(([x, y], k) => { const c = ['#ff6060', '#ffd050', '#60c0ff', '#ff90d0'][k % 4]; P(ctx, Math.round(x - cx) - 2, Math.round(y - cy) - 4, 5, 6, c); P(ctx, Math.round(x - cx) - 1, Math.round(y - cy) - 3, 2, 2, '#ffffff'); });
    // fuegos artificiales (en coordenadas de pantalla)
    for (const p of this.sparks) { ctx.globalAlpha = Math.min(1, p.life * 1.5); P(ctx, Math.round(p.x - (cx % 400) * 0.2), Math.round(p.y), 2, 2, p.col); }
    ctx.globalAlpha = 1;
  },
};
{
  const _upd = World.update;
  World.update = function (dt) {
    _upd.call(this, dt);
    const on = this.map.id === 'villa_musgo' && Events.festival();
    if (on) Festival.update(dt);
    if (on !== !!this.festOn) {
      this.festOn = on;
      this.refreshFestival();
      if (on && Scenes.top() === this) this.banner = { text: '¡Festival de farolillos!', t: 0 };
      if (!this.busy && Scenes.top() === this) Sound.music(this.map.music);
    }
  };
  World.refreshFestival = function () {
    this.npcs = this.npcs.filter((n) => !n.festival);
    if (!(this.map.id === 'villa_musgo' && Events.festival())) return;
    const spots = [[11, 14, 'girl', 'right'], [16, 14, 'oldman', 'left'], [20, 14, 'kid2', 'down'], [7, 14, 'baker', 'down']];
    for (const [x, y, look, dir] of spots) {
      if (this.npcAt(x, y) || (this.player.x === x && this.player.y === y)) continue;
      const n = this.spawnTemp(look, x, y, dir); n.festival = true;
      n.def.say = U.choice([['¡Qué bonitos los farolillos!'], ['¡Cada domingo por la noche hay festival!'], ['¡Mira los fuegos artificiales!'], ['Dicen que en noches así aparecen ánimas brillantes.']]);
      if (look === 'baker') { n.def.script = 'festival'; n.def.say = null; }
    }
  };
  const _refresh = World.refreshNpcs;
  World.refreshNpcs = function () { _refresh.call(this); this.festOn = false; };
  const _fx = World.drawTerrainFX;
  World.drawTerrainFX = function (ctx, cx, cy) { _fx.call(this, ctx, cx, cy); if (this.festOn) Festival.draw(ctx, cx, cy); };
  const _lights = World.collectLights;
  World.collectLights = function (cx, cy, L) {
    const out = _lights.call(this, cx, cy, L);
    if (this.festOn) {
      for (const [x, y] of Festival.lanterns()) out.push({ x: x - cx, y: y - cy, r: 26, i: 0.9, glow: '#ffb070', gr: 14 });
      for (const p of Festival.sparks) if (Math.random() < 0.15) out.push({ x: p.x - (cx % 400) * 0.2, y: p.y, r: 30, i: 0.5, glow: p.col, gr: 12 });
    }
    return out;
  };
}
Story.scripts.festival = async function () {
  const k = 'fest_' + G.day;
  if (G.flags[k]) { await say('¡Disfruta del festival! Vuelve el próximo domingo.', { speaker: 'Panadero' }); return; }
  G.flags[k] = 1;
  const gift = U.choice([['baya_dulce', 5], ['caramelo', 1], ['superesfera', 3], ['esfera_rapida', 2], ['hiperpocion', 2]]);
  await say(['¡Bienvenido al festival de farolillos!', 'Esta noche regalamos algo a cada visitante.'], { speaker: 'Panadero' });
  Game.give(gift[0], gift[1]); Sound.jingle('item');
  await say(`¡${G.name} recibió ${ITEMS[gift[0]].name} ×${gift[1]}!`);
};
// más ánimas variocolor durante el festival
{
  const _make = Wild.make;
  Wild.make = function (e, allowAlpha) {
    const c = _make.call(this, e, allowAlpha);
    if (Events.festival() && ['ruta1', 'ruta2', 'villa_musgo'].includes(World.map && World.map.id) && !c.shiny && Math.random() < 1 / 40) c.shiny = true;
    return c;
  };
}

// ---------- los vecinos leen tu estilo ----------
const STYLE_TALKERS = new Set(['pc_monk', 'cca_m', 'cb_smith', 'ca_girl', 'vm_old', 'cr_hiker', 'pm_old', 'r1_watcher']);
{
  const _talk = World.talk;
  World.talk = async function (n) {
    await _talk.call(this, n);
    const id = n.def && n.def.id;
    if (!STYLE_TALKERS.has(id) || !G.party.length || n.def.trainer) return;
    const st = Style.of();
    if (st === 'novato') return;
    const lines = {
      impetu: ['Por cierto... tus ánimas tienen pinta de pelear cuerpo a cuerpo. ¡Se les nota en los músculos!', 'Dicen por ahí que eres un "Puño Ardiente". ¡Siempre de frente!'],
      temple: ['Se nota que prefieres luchar a distancia. Tus ánimas tienen la mirada de un halcón.', 'Te llaman "Ojo de Halcón". Esquivar y disparar, ¿eh?'],
      equilibrio: ['Tus ánimas combinan fuerza y distancia. Eso es raro de ver.', 'Un "Equilibrista"... ni muy lejos ni muy cerca. ¡Me gusta!'],
    }[st];
    if (Math.random() < 0.6) await say(U.choice(lines));
  };
}
