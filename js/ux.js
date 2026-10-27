'use strict';
// ============================================================
//  COMODIDADES
//  - 3 ranuras de guardado + autoguardado
//  - Mapa de la región (M) con viaje rápido a pueblos visitados
//  - Campo de entrenamiento con lecciones guiadas
//  - Códice: hábitat, horario y clima de cada especie
// ============================================================

// ---------- ranuras de guardado ----------
const SLOT_KEYS = [SAVE_KEY, SAVE_KEY + '_2', SAVE_KEY + '_3'];
const LAST_SLOT_KEY = 'anima_region_alba_last_slot';
Object.assign(Game, {
  slot: (() => { try { return U.clamp(parseInt(localStorage.getItem(LAST_SLOT_KEY) || '0', 10) || 0, 0, 2); } catch (e) { return 0; } })(),
  slotData(i) { try { return JSON.parse(localStorage.getItem(SLOT_KEYS[i])); } catch (e) { return null; } },
  hasSave() { return [0, 1, 2].some((i) => !!this.slotData(i)); },
  save(auto) {
    try {
      G.savedAt = Date.now();
      localStorage.setItem(SLOT_KEYS[this.slot], JSON.stringify(G));
      localStorage.setItem(LAST_SLOT_KEY, String(this.slot));
      return true;
    } catch (e) { if (!auto) console.error(e); return false; }
  },
  load(i = this.slot) {
    try {
      const d = this.slotData(i);
      if (!d) return false;
      G = Object.assign(newGameState(), d);
      for (const c of G.party.concat(G.box)) fixCreature(c);
      G.visited = G.visited || {};
      G.visited.pueblo_alba = 1; if (G.badges[0]) G.visited.villa_musgo = 1; if (G.badges[1]) G.visited.ciudad_roca = 1; if (G.badges[2]) G.visited.puerto_marea = 1;
      this.slot = i;
      try { localStorage.setItem(LAST_SLOT_KEY, String(i)); } catch (e) { /* ignorar */ }
      return true;
    } catch (e) { console.error(e); return false; }
  },
  summaryOf(d) {
    if (!d) return null;
    try { return { name: d.name, badges: d.badges.filter(Boolean).length, dex: Object.keys(d.caught).length, time: d.playTime, map: MAPS[d.map] ? MAPS[d.map].name : '', at: d.savedAt || 0 }; } catch (e) { return null; }
  },
  saveSummary(i = this.slot) { return this.summaryOf(this.slotData(i)); },
  autosave() {
    if (!Options.autosave || !G || !G.party.length || Battle.active) return;
    const now = performance.now();
    if (this.lastAuto && now - this.lastAuto < 45000) return;
    this.lastAuto = now;
    World.syncPos();
    if (this.save(true)) { World.autoT = 1.6; }
  },
});
const fmtTime = (s) => { s = Math.floor(s || 0); return `${Math.floor(s / 3600)}:${U.pad(Math.floor(s / 60) % 60, 2, '0')}`; };
class SlotScreen {
  constructor(mode) { this.mode = mode; this.i = Game.slot; this.opaque = false; }
  update() {
    if (Input.repeat('up')) { this.i = (this.i + 2) % 3; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % 3; Sound.sfx('blip'); }
    if (Input.mouse.moved || Input.mouse.pressed[0]) { const k = Math.floor((Input.mouse.y - 46) / 50); if (k >= 0 && k < 3 && Input.mouse.x > 30 && Input.mouse.x < 290) this.i = k; }
    if (Input.pressed('a')) {
      if (this.mode === 'load' && !Game.slotData(this.i)) { Sound.sfx('bump'); return; }
      Sound.sfx('select'); this.done(this.i);
    }
    if (Input.pressed('b')) { Sound.sfx('cancel'); this.done(-1); }
  }
  draw(ctx) {
    ctx.globalAlpha = 0.6; P(ctx, 0, 0, W, H, '#0a0614'); ctx.globalAlpha = 1;
    UI.box(ctx, 90, 18, 140, 18, 'title');
    Font.drawCenter(ctx, this.mode === 'load' ? 'CARGAR PARTIDA' : this.mode === 'new' ? 'NUEVA PARTIDA' : 'GUARDAR PARTIDA', 160, 24, '#ffffff', '#1a1430');
    for (let k = 0; k < 3; k++) {
      const y = 44 + k * 50, s = Game.saveSummary(k);
      UI.box(ctx, 30, y, 260, 44, k === this.i ? 'light' : 'panel');
      Font.draw(ctx, `Ranura ${k + 1}`, 42, y + 7, '#8a8098');
      if (k === this.i) UI.cursor(ctx, 34, y + 8);
      if (!s) { Font.drawCenter(ctx, '— Vacía —', 160, y + 20, '#9a90a8'); continue; }
      Font.draw(ctx, s.name, 110, y + 7, '#2a2236');
      Font.drawRight(ctx, s.map, 280, y + 7, '#2a2236');
      Font.draw(ctx, `Medallas ${s.badges}  Códice ${s.dex}  Tiempo ${fmtTime(s.time)}`, 42, y + 22, '#5a5070');
      if (k === Game.slot && Game.hasSave()) Font.drawRight(ctx, 'última', 280, y + 22, '#3a8a40');
    }
    Font.drawCenter(ctx, 'Z: elegir · X: volver', 160, 204, '#d8d0e8');
  }
}
TitleScreen.prototype.enter = function () { Sound.music('title'); this.hasSave = Game.hasSave(); this.sum = Game.saveSummary(); };
TitleScreen.prototype.pick = async function () {
  const o = this.options()[this.i];
  this.busy = true;
  if (o === 'OPCIONES') { await runScene(new OptionsScreen()); this.busy = false; return; }
  const k = await runScene(new SlotScreen(o === 'CONTINUAR' ? 'load' : 'new'));
  if (k < 0) { this.busy = false; return; }
  if (o === 'NUEVA PARTIDA') {
    if (Game.slotData(k)) {
      const r = await ask(`La ranura ${k + 1} ya tiene una partida. Si guardas, se sobrescribirá. ¿Continuar?`, ['Sí', 'No']);
      if (r !== 0) { this.busy = false; return; }
    }
    Game.slot = k;
  } else if (!Game.load(k)) {
    await say('No se ha podido cargar la partida guardada. Puede que esté dañada.');
    this.hasSave = Game.hasSave(); this.sum = Game.saveSummary(); this.i = 0; this.busy = false; return;
  }
  await Fade.out(0.5);
  Scenes.pop(this);
  if (o === 'CONTINUAR') World.start();
  else Story.newGame();
};
// guardar desde el menú: elegir ranura
StartMenu.prototype.pick = (function (orig) {
  return async function (k) {
    if (k !== 'save') return orig.call(this, k);
    this.busy = true;
    const slot = await runScene(new SlotScreen('save'));
    if (slot >= 0) {
      const ok = !Game.slotData(slot) || slot === Game.slot || (await ask(`¿Sobrescribir la ranura ${slot + 1}?`)) === 0;
      if (ok) { Game.slot = slot; World.syncPos(); if (Game.save()) { Sound.sfx('save'); await say(`${G.name} guardó la partida en la ranura ${slot + 1}.`); } else await say('No se pudo guardar (almacenamiento no disponible).'); }
    }
    this.busy = false;
  };
})(StartMenu.prototype.pick);
// menú: añade el mapa
StartMenu.prototype.items = (function (orig) {
  return function () { const it = orig.call(this); if (G.flags.got_dex) it.splice(2, 0, ['MAPA', 'map']); return it; };
})(StartMenu.prototype.items);
StartMenu.prototype.pick = (function (orig) {
  return async function (k) {
    if (k !== 'map') return orig.call(this, k);
    this.busy = true;
    const r = await RegionMap.open();
    this.busy = false;
    if (r) this.done();
  };
})(StartMenu.prototype.pick);

// ---------- autoguardado al cambiar de zona ----------
{
  const _load = World.loadMap;
  World.loadMap = function (id, ...a) {
    const prev = this.map && this.map.id;
    const r = _load.call(this, id, ...a);
    if (G) { G.visited = G.visited || {}; const rid = RegionMap.regionOf(id); if (rid) G.visited[rid] = 1; }
    if (prev && prev !== id && MAPS[id] && (MAPS[id].outdoor || /^centro_/.test(id))) Timers.wait(0.6).then(() => { if (!World.busy && Scenes.top() === World) Game.autosave(); });
    return r;
  };
  const _hud = HUD.drawWorld;
  HUD.drawWorld = function (ctx, world) {
    _hud.call(this, ctx, world);
    if (world.autoT > 0) {
      world.autoT -= 1 / 60;
      ctx.globalAlpha = Math.min(1, world.autoT * 2);
      UI.box(ctx, 238, 222, 78, 15, 'dark');
      ctx.drawImage(Icons.sphere('esfera', 8), 243, 225 + (Math.floor(Engine.time * 6) % 2));
      Font.draw(ctx, 'Guardando', 255, 226, '#d0e8ff');
      ctx.globalAlpha = 1;
    }
  };
  // tecla M: mapa de la región
  const _upd = World.update;
  World.update = function (dt) {
    _upd.call(this, dt);
    if (G && !this.busy && !this.player.moving && Scenes.top() === this && Input.pressed('map') && G.flags.got_dex) {
      this.busy++; RegionMap.open().then(() => { this.busy--; });
    }
  };
}

// ---------- mapa de la región ----------
const REGION = {
  nodes: {
    pueblo_alba: { x: 44, y: 172, kind: 'town', desc: 'Un pueblo tranquilo donde empieza todo.' },
    ruta1: { x: 44, y: 136, kind: 'route' },
    villa_musgo: { x: 44, y: 100, kind: 'town', desc: 'Villa rodeada de bosque. Gimnasio de Hiedra (Planta).' },
    ruta2: { x: 92, y: 100, kind: 'route' },
    bosque: { x: 140, y: 100, kind: 'forest', desc: 'Bosque espeso lleno de ánimas Bicho.' },
    ciudad_roca: { x: 140, y: 56, kind: 'town', desc: 'Ciudad minera al pie de la montaña. Gimnasio de Bruna (Roca).' },
    ruta3: { x: 186, y: 56, kind: 'route' },
    cueva: { x: 228, y: 56, kind: 'cave', desc: 'Cueva laberíntica con ecos extraños.' },
    puerto_marea: { x: 228, y: 100, kind: 'town', desc: 'Puerto pesquero junto al mar. Gimnasio de Nerón (Agua).' },
  },
  links: [['pueblo_alba', 'ruta1'], ['ruta1', 'villa_musgo'], ['villa_musgo', 'ruta2'], ['ruta2', 'bosque'], ['bosque', 'ciudad_roca'], ['ciudad_roca', 'ruta3'], ['ruta3', 'cueva'], ['cueva', 'puerto_marea']],
};
const RegionMap = {
  regionOf(id) {
    for (let i = 0; i < 4 && id; i++) {
      if (REGION.nodes[id]) return id;
      const m = MAPS[id]; if (!m || !m.warps.length) return null;
      id = m.warps[0].to;
    }
    return null;
  },
  canTravel() { return !!G.badges[0]; },
  open() { return runScene(new RegionMapScreen()); },
  spot(id) {
    const m = MAPS[id];
    const w = m.warps.find((w) => /^centro_/.test(w.to));
    if (w) return [w.x, w.y + 1];
    return [m.start ? m.start[0] : Math.floor(m.w / 2), m.start ? m.start[1] : Math.floor(m.h / 2)];
  },
};
class RegionMapScreen {
  constructor() {
    this.opaque = true; this.t = 0;
    this.here = RegionMap.regionOf(World.map.id);
    this.towns = Object.keys(REGION.nodes).filter((k) => REGION.nodes[k].kind === 'town' && (!REGION.nodes[k].ch || G.flags.chapter1_done));
    this.i = Math.max(0, this.towns.indexOf(this.here));
  }
  update(dt) {
    this.t += dt;
    const n = this.towns.length;
    if (Input.repeat('up') || Input.repeat('left')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
    if (Input.repeat('down') || Input.repeat('right')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
    if (Input.mouse.moved || Input.mouse.pressed[0]) {
      for (let k = 0; k < n; k++) { const nd = REGION.nodes[this.towns[k]]; if (Math.abs(Input.mouse.x - nd.x) < 10 && Math.abs(Input.mouse.y - nd.y) < 10) this.i = k; }
    }
    if (Input.pressed('a')) this.travel();
    if (Input.pressed('b') || Input.pressed('map')) { Sound.sfx('cancel'); this.done(false); }
  }
  async travel() {
    const id = this.towns[this.i];
    if (this.busy) return;
    this.busy = true;
    const can = (G.visited || {})[id] && id !== this.here && RegionMap.canTravel() && !World.map.cave && World.map.outdoor !== undefined;
    if (!(G.visited || {})[id]) { await say('Aún no has visitado este lugar.'); this.busy = false; return; }
    if (id === this.here) { this.busy = false; return; }
    if (!RegionMap.canTravel()) { await say('El servicio de Carruaje Ánima se desbloquea al conseguir tu primera medalla.'); this.busy = false; return; }
    if (World.map.cave || !World.map.outdoor) { await say('Solo puedes llamar al carruaje al aire libre.'); this.busy = false; return; }
    if (!can) { this.busy = false; return; }
    if ((await ask(`¿Viajar a ${MAPS[id].name}?`)) !== 0) { this.busy = false; return; }
    this.done(true);
    const [x, y] = RegionMap.spot(id);
    Sound.sfx('select');
    await World.warpTo(id, x, y, 'down');
  }
  draw(ctx) {
    // mar y tierra
    P(ctx, 0, 0, W, H, '#3a6aa8');
    for (let i = 0; i < 40; i++) { const x = (i * 53 + Math.floor(this.t * 6)) % W, y = (i * 37) % H; P(ctx, x, y, 4, 1, '#5a8ac8'); }
    ctx.fillStyle = '#d8c890';
    const blob = [[14, 190], [14, 30], [262, 30], [262, 84], [300, 84], [300, 190]];
    ctx.beginPath(); blob.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8ab860';
    ctx.beginPath(); blob.forEach(([x, y], k) => (k ? ctx.lineTo(x + (x < 150 ? 5 : -5), y + (y < 120 ? 5 : -5)) : ctx.moveTo(x + 5, y - 5))); ctx.closePath(); ctx.fill();
    // relieve: montañas y bosques decorativos
    for (const [mx, my] of [[100, 46], [116, 40], [172, 82], [196, 84], [212, 40]]) { ctx.fillStyle = '#7a6a58'; ctx.beginPath(); ctx.moveTo(mx, my - 9); ctx.lineTo(mx + 9, my + 5); ctx.lineTo(mx - 9, my + 5); ctx.fill(); P(ctx, mx - 2, my - 8, 4, 3, '#f0f0f0'); }
    for (const [tx, ty] of [[70, 70], [78, 76], [110, 124], [118, 130], [160, 126], [24, 60], [30, 120]]) { P(ctx, tx - 3, ty - 3, 7, 7, '#2a5a2a'); P(ctx, tx - 2, ty - 2, 5, 5, '#4a8a3a'); }
    if (REGION.extra) REGION.extra(ctx, this.t);
    const V = G.visited || {};
    // caminos
    for (const [a, b] of REGION.links) {
      const A = REGION.nodes[a], B = REGION.nodes[b];
      if (!A || !B || (A.ch && !G.flags.chapter1_done) || (B.ch && !G.flags.chapter1_done)) continue;
      const seen = V[a] || V[b];
      ctx.strokeStyle = seen ? '#f8f0d0' : '#a8a080'; ctx.lineWidth = 3; ctx.setLineDash(seen ? [] : [3, 3]);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.setLineDash([]);
    }
    // lugares
    for (const [id, nd] of Object.entries(REGION.nodes)) {
      if (nd.ch && !G.flags.chapter1_done) continue;
      const seen = V[id];
      if (nd.kind === 'town') { P(ctx, nd.x - 6, nd.y - 6, 12, 12, '#2a2236'); P(ctx, nd.x - 5, nd.y - 5, 10, 10, seen ? '#e85848' : '#8a8098'); P(ctx, nd.x - 3, nd.y - 3, 4, 2, '#ffffff'); }
      else if (nd.kind === 'cave' || nd.kind === 'tower') { ctx.fillStyle = '#2a2236'; ctx.beginPath(); ctx.moveTo(nd.x, nd.y - 7); ctx.lineTo(nd.x + 7, nd.y + 5); ctx.lineTo(nd.x - 7, nd.y + 5); ctx.fill(); P(ctx, nd.x - 2, nd.y, 4, 5, seen ? '#806050' : '#8a8098'); }
      else if (nd.kind === 'forest') { for (const [ox, oy] of [[-5, 0], [3, -3], [2, 4]]) { P(ctx, nd.x + ox - 3, nd.y + oy - 3, 7, 7, '#1e4a24'); P(ctx, nd.x + ox - 2, nd.y + oy - 2, 5, 5, seen ? '#3c8a3a' : '#7a8a7a'); } }
      else { P(ctx, nd.x - 3, nd.y - 3, 6, 6, '#2a2236'); P(ctx, nd.x - 2, nd.y - 2, 4, 4, seen ? '#f8d048' : '#a8a080'); }
    }
    // posición actual
    const h = REGION.nodes[this.here];
    if (h && Math.floor(this.t * 3) % 2) { ctx.drawImage(CharSprites.get(LOOKS.player), 0, 0, 16, 24, h.x - 8, h.y - 26, 16, 24); }
    // selección
    const sel = this.towns[this.i], nd = REGION.nodes[sel];
    pixRing(ctx, nd.x, nd.y, 10 + Math.sin(this.t * 6), '#ffffff', 2);
    UI.box(ctx, 4, 4, 312, 20, 'title');
    Font.draw(ctx, 'MAPA DE LA REGIÓN', 12, 10, '#ffffff');
    Font.drawRight(ctx, MAPS[this.here] ? 'Estás en: ' + MAPS[this.here].name : '', 308, 10, '#d8d0e8');
    UI.box(ctx, 4, 196, 312, 40);
    Font.draw(ctx, V[sel] ? MAPS[sel].name : '???', 12, 202, '#2a2236');
    Font.draw(ctx, V[sel] ? nd.desc || '' : 'Aún no has estado aquí.', 12, 214, '#5a5070');
    Font.drawRight(ctx, V[sel] && sel !== this.here ? (RegionMap.canTravel() ? 'Z: viajar' : 'Viaje: 1.ª medalla') : '', 308, 202, '#3060c0');
    Font.drawRight(ctx, 'X / M: cerrar', 308, 226, '#8a8098');
  }
}
Input.map.map = Input.map.map || ['KeyM'];

// ---------- Códice: hábitat ----------
const Habitat = {
  of(sp) {
    const out = [];
    for (const m of Object.values(MAPS)) {
      if (!m.encounters) continue;
      for (const e of m.encounters.list) if (e.sp === sp.key) {
        const tags = [e.time === 'noche' ? 'noche' : e.time === 'dia' ? 'día' : null, e.weather ? 'lluvia' : null].filter(Boolean);
        out.push(`${m.name}: Nv ${e.min}-${e.max}${tags.length ? ' (' + tags.join(', ') + ')' : ''}`);
      }
    }
    return out;
  },
  traits(sp) {
    const t = [];
    if (sp.legendary) t.push('Legendaria: aparece una sola vez.');
    if (typeof Wild !== 'undefined') {
      if (Wild.isHerd(sp)) t.push('Vive en manadas: si una huye, huyen todas.');
      if (Wild.isAmbusher(sp)) t.push('De noche acecha inmóvil: solo se ven sus ojos.');
    }
    if (sp.types.includes('agua') || sp.types.includes('electrico')) t.push('Más común cuando llueve.');
    if (sp.types.includes('fuego')) t.push('Escasea con lluvia.');
    if (sp.types.includes('sombra') || sp.types.includes('roca') || sp.types.includes('fuego')) t.push('Suele ser agresiva: te embiste si te ve.');
    else if (!sp.legendary) t.push('Asustadiza: huye si te acercas sin sigilo.');
    return t;
  },
};
{
  const _upd = DexScreen.prototype.update, _draw = DexScreen.prototype.draw;
  DexScreen.prototype.update = function (dt) {
    if (this.detail && (Input.pressed('left') || Input.pressed('right'))) { this.page = this.page ? 0 : 1; Sound.sfx('blip'); return; }
    if (!this.detail) this.page = 0;
    return _upd.call(this, dt);
  };
  DexScreen.prototype.draw = function (ctx) {
    if (!(this.detail && this.page)) { _draw.call(this, ctx); if (this.detail) Font.drawRight(ctx, '←→: hábitat', 308, 222, '#8a8098'); return; }
    const sp = SPECIES_LIST[this.i];
    P(ctx, 0, 0, W, H, '#c83848'); P(ctx, 0, 0, W, 18, '#901c2c');
    Font.draw(ctx, 'CÓDICE ÁNIMA · HÁBITAT', 8, 4, '#ffffff');
    UI.box(ctx, 6, 22, 308, 212, 'panel');
    ctx.drawImage(CreatureGfx.get(sp.key, 48), 14, 30);
    Font.draw(ctx, `Nº${U.pad(sp.id, 3, '0')} ${sp.name}`, 70, 34, '#2a2236');
    sp.types.forEach((t, k) => UI.typeBadge(ctx, t, 70 + k * 33, 48));
    Font.draw(ctx, 'Dónde vive', 14, 84, '#2a2236');
    const hab = Habitat.of(sp);
    const known = G.caught[sp.id] || G.seen[sp.id];
    (hab.length ? hab : [sp.legendary ? 'Lugar legendario, ligado a la historia.' : 'Solo por evolución o en lugares especiales.']).slice(0, 6).forEach((l, k) => Font.draw(ctx, known ? l : '???', 20, 98 + k * 11, '#5a5068'));
    Font.draw(ctx, 'Comportamiento', 14, 168, '#2a2236');
    Habitat.traits(sp).slice(0, 4).forEach((l, k) => Font.draw(ctx, G.caught[sp.id] ? l : '(captúrala para saber más)', 20, 182 + k * 11, '#5a5068'));
    Font.drawRight(ctx, '←→: datos', 308, 222, '#8a8098');
  };
}

// ---------- campo de entrenamiento ----------
CLASS_PAY['Práctica'] = 0;
const LESSONS = [
  { key: 'esquiva', name: 'Esquiva perfecta', goal: 2, intro: ['Pulsa ESPACIO justo cuando el rival vaya a golpearte (la zona roja).', 'Si lo haces en el último instante es una ESQUIVA PERFECTA: tu siguiente golpe hará ×1.5.', 'Consigue 2 esquivas perfectas.'], hud: 'Esquivas perfectas', reward: ['superesfera', 2] },
  { key: 'carga', name: 'Ataque cargado', goal: 3, intro: ['Mantén pulsada la tecla de un ataque (1-4, J-I o el clic) para cargarlo.', 'Cuanto más lo cargues, más fuerte será (hasta ×1.6). Mientras cargas te mueves más despacio.', 'Lanza 3 ataques cargados.'], hud: 'Ataques cargados', reward: ['superpocion', 2] },
  { key: 'duo', name: 'Dúo', goal: 1, intro: ['Cuando la barra de Sinergia está llena, pulsa G (o el botón dúo) para invocar a tu segunda ánima.', 'Te ayudará unos 10 segundos. En combates normales puedes usarlo 1 vez; contra alfas, entrenadores y líderes, hasta 3.', 'Te llenamos la Sinergia: ¡invoca a tu Dúo!'], hud: 'Dúos invocados', reward: ['piedra_sinergia', 1] },
  { key: 'terreno', name: 'Terreno vivo', goal: 1, intro: ['El escenario reacciona: el fuego quema la hierba alta, lo eléctrico electrifica el agua y los golpes fuertes rompen rocas.', 'Los rivales que pisan fuego o agua electrificada reciben daño.', 'Derrota al muñeco usando el terreno (o como quieras).'], hud: 'Victorias', reward: ['esfera_rapida', 2] },
];
const Training = {
  async talk() {
    const sp = { speaker: 'Instructora Vega' };
    if (!G.flags.train_intro) { G.flags.train_intro = 1; await say('¡Hola! Soy Vega y dirijo el campo de entrenamiento. Aquí puedes practicar técnicas de combate sin riesgo.', sp); }
    const opts = LESSONS.map((l) => (G.flags['lesson_' + l.key] ? '✓ ' : '') + l.name).concat(['Salir']);
    const r = await choose(opts, { x: 150, y: 40, w: 160 });
    if (r < 0 || r >= LESSONS.length) { await say('¡Vuelve cuando quieras!', sp); return; }
    const L = LESSONS[r];
    if (L.key === 'duo' && G.party.filter((c) => c.hp > 0).length < 2) { await say('Para esta lección necesitas al menos dos ánimas en condiciones.', sp); return; }
    for (const t of L.intro) await say(t, sp);
    const lead = Game.firstAlive();
    const snap = G.party.map((c) => c.hp);
    const lv = Math.max(2, lead.lv - 3);
    const dummy = L.key === 'terreno' ? 'larvita' : 'rabin';
    const res = await Battle.trainer({ title: 'Muñeco de práctica', cls: 'Práctica', name: '', party: [[dummy, lv]], skill: L.key === 'esquiva' ? 0.75 : 0.35, lesson: L, practice: true });
    G.party.forEach((c, k) => { c.hp = Math.max(c.hp, snap[k] || 0); if (c.hp <= 0) c.hp = 1; });
    Game.healAll();
    if (res === 'win' && Battle.lastLessonOk) {
      if (!G.flags['lesson_' + L.key]) {
        G.flags['lesson_' + L.key] = 1;
        await say(`¡Perfecto! Has dominado "${L.name}". Toma, un pequeño premio.`, sp);
        Game.give(L.reward[0], L.reward[1]); Sound.jingle('item');
        await say(`¡${G.name} recibió ${ITEMS[L.reward[0]].name} ×${L.reward[1]}!`);
      } else await say('¡Sigues en forma! Bien hecho.', sp);
    } else await say('No pasa nada, ¡practicar es fallar muchas veces! Inténtalo de nuevo cuando quieras.', sp);
  },
};
Story.scripts.training = () => Training.talk();
MAPS.villa_musgo.npcs.push({ id: 'vm_trainer', x: 16, y: 15, look: 'jogger', dir: 'down', script: 'training' });
{
  // progreso de la lección dentro del combate
  const _update = BattleScene.prototype.update;
  BattleScene.prototype.update = function (dt) {
    _update.call(this, dt);
    const L = this.opts.lesson;
    if (!L || this.state !== 'fight' || !this.ally) return;
    this.lesson = this.lesson || { n: 0, prevCounter: 0 };
    const S = this.lesson;
    if (L.key === 'esquiva') { if (this.ally.counterT > 1.2 && S.prevCounter <= 1.2) S.n++; S.prevCounter = this.ally.counterT; }
    if (L.key === 'duo') { S.n = this.duoUsesA || 0; if (!S.filled) { S.filled = true; this.ally.syn = 100; } }
    if (L.key === 'carga') S.n = this.chargedCount || 0;
    if (L.key !== 'terreno' && S.n >= L.goal && !S.ok) {
      S.ok = true; Battle.lastLessonOk = true;
      this.banner('¡Lección completada!', 1.4, '#80ff90');
      this.foe.hp = 0;
    }
    if (L.key === 'terreno' && this.foe.hp <= 0) Battle.lastLessonOk = true;
    // el muñeco de práctica no puede derrotarte
    if (this.ally.hp < this.ally.maxHp * 0.25) this.ally.hp = this.ally.maxHp * 0.25;
  };
  const _startMove = BattleScene.prototype.startMove;
  BattleScene.prototype.startMove = function (f, i, cm = 1) {
    const r = _startMove.call(this, f, i, cm);
    if (r !== false && f === this.ally && cm >= 1.25) this.chargedCount = (this.chargedCount || 0) + 1;
    return r;
  };
  const _drawHud = BattleScene.prototype.drawHud;
  BattleScene.prototype.drawHud = function (ctx) {
    _drawHud.call(this, ctx);
    const L = this.opts.lesson;
    if (!L) return;
    const n = this.lesson ? this.lesson.n : 0;
    UI.box(ctx, 90, 42, 140, 16, 'dark');
    Font.drawCenter(ctx, L.key === 'terreno' ? L.name : `${L.hud}: ${Math.min(n, L.goal)}/${L.goal}`, 160, 46, '#a0ffa0');
  };
  const _bstart = Battle.start;
  Battle.start = function (o) { if (o && o.lesson) Battle.lastLessonOk = false; return _bstart.call(this, o); };
}
