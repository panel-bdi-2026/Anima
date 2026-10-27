'use strict';
// ============================================================
//  MUNDO VIVO
//  - Habilidades de campo: Cortar, Romper, Nadar, Iluminar
//  - Zonas secretas detrás de arbustos, rocas y agua
//  - Recolección (bayas, minerales, hongos) que vuelve a crecer
//  - Taller de fabricación y tablón de encargos con amistad
// ============================================================

// ---------- casillas nuevas ----------
TILEDEF.U = { t: 'cutbush', solid: true };
TILEDEF.V = { t: 'crackrock', solid: true };
TILEDEF.Y = { t: 'board', solid: true };
TileDraw.cutbush = (x, f, v) => {
  grassBase2(x, v);
  x.globalAlpha = 0.3; P(x, 2, 13, 12, 3, '#000'); x.globalAlpha = 1;
  P(x, 2, 4, 12, 10, '#2a6a30'); P(x, 1, 6, 14, 6, '#2a6a30'); P(x, 3, 3, 10, 1, '#2a6a30');
  P(x, 3, 4, 10, 8, '#3c8a3a'); P(x, 2, 7, 12, 3, '#3c8a3a');
  P(x, 4, 4, 3, 2, '#5aac4a'); P(x, 9, 6, 3, 2, '#5aac4a'); P(x, 6, 9, 2, 2, '#5aac4a');
  P(x, 5, 7, 1, 1, '#1e4a24'); P(x, 10, 9, 1, 1, '#1e4a24'); P(x, 7, 5, 1, 1, '#1e4a24');
  P(x, 7, 12, 2, 3, '#6a4a2a');
};
TileDraw.crackrock = (x, f, v) => {
  const cave = false;
  grassBase2(x, v);
  x.globalAlpha = 0.3; P(x, 2, 13, 13, 3, '#000'); x.globalAlpha = 1;
  P(x, 1, 3, 14, 11, PAL.rock4); P(x, 2, 2, 12, 1, PAL.rock4);
  P(x, 2, 3, 12, 10, PAL.rock3); P(x, 2, 3, 9, 5, PAL.rock2); P(x, 3, 3, 4, 2, PAL.rock1);
  // grietas
  P(x, 7, 3, 1, 3, PAL.rock4); P(x, 8, 6, 1, 2, PAL.rock4); P(x, 6, 8, 2, 1, PAL.rock4); P(x, 5, 9, 1, 3, PAL.rock4);
  P(x, 10, 7, 3, 1, PAL.rock4); P(x, 12, 8, 1, 2, PAL.rock4);
};
TileDraw.board = (x, f, v) => {
  const fl = Tiles.get('tilefloor', 0, v); x.drawImage(fl, 0, 0);
  P(x, 1, 1, 14, 11, '#6a4428'); P(x, 2, 2, 12, 9, '#c89a5a'); P(x, 2, 2, 12, 1, '#dab070');
  P(x, 3, 3, 4, 3, '#f8f4e8'); P(x, 8, 3, 5, 4, '#fff0b0'); P(x, 4, 7, 4, 3, '#d0e8ff'); P(x, 9, 8, 3, 2, '#f8f4e8');
  P(x, 4, 3, 1, 1, '#d03030'); P(x, 10, 3, 1, 1, '#3060d0'); P(x, 5, 7, 1, 1, '#30a050');
  P(x, 3, 12, 1, 4, '#6a4428'); P(x, 12, 12, 1, 4, '#6a4428');
};

const setCh = (m, x, y, ch) => { const r = m.rows[y]; m.rows[y] = r.slice(0, x) + ch + r.slice(x + 1); };
const paint = (id, x, y, lines) => { const m = MAPS[id]; lines.forEach((l, j) => { for (let i = 0; i < l.length; i++) if (l[i] !== ' ') setCh(m, x + i, y + j, l[i]); }); };

// ---------- zonas secretas del capítulo 1 ----------
// Ruta 2: jardín cercado tras un arbusto (Cortar)
paint('ruta2', 1, 13, ['BBBB', '...U', 'BBBB']);
MAPS.ruta2.items.push({ x: 1, y: 14, item: 'amuleto_planta', qty: 1, flag: 'it_r2_sec' }, { x: 2, y: 14, item: 'baya_dulce', qty: 3, flag: 'it_r2_sec2' });
// Ruta 2: islote en el estanque (Nadar)
paint('ruta2', 33, 3, ['s']);
MAPS.ruta2.items.push({ x: 33, y: 3, item: 'esfera_red', qty: 3, flag: 'it_r2_isle' });
// Ciudad Roca: hueco en el acantilado tras una roca agrietada (Romper)
paint('ciudad_roca', 3, 1, ['.', 'V']);
MAPS.ciudad_roca.items.push({ x: 3, y: 1, item: 'esfera_pesada', qty: 3, flag: 'it_cr_sec' });
// Cueva Eco: galería escondida (Romper)
paint('cueva', 5, 14, [' V ', 'ccc']);
MAPS.cueva.items.push({ x: 5, y: 15, item: 'esfera_nocturna', qty: 3, flag: 'it_cv_sec' }, { x: 7, y: 15, item: 'mineral', qty: 4, flag: 'it_cv_sec2' });
// Puerto Marea: islote en el mar (Nadar)
paint('puerto_marea', 31, 4, ['sss', 'sss']);
MAPS.puerto_marea.items.push({ x: 32, y: 4, item: 'amuleto_agua', qty: 1, flag: 'it_pm_isle' }, { x: 31, y: 5, item: 'caramelo', qty: 1, flag: 'it_pm_isle2' });
// Bosque: atajo con arbustos (Cortar)
paint('bosque', 11, 17, ['U']);
// Centros: tablón de encargos y artesana del Taller
for (const id of ['centro_musgo', 'centro_roca', 'centro_marea']) {
  setCh(MAPS[id], 9, 1, 'Y');
  MAPS[id].npcs.push({ id: id + '_taller', x: 1, y: 2, look: 'worker', dir: 'right', script: 'taller' });
}

// ---------- habilidades de campo ----------
const FIELD_SKILLS = {
  cortar: { name: 'Cortar', badge: 0, types: ['planta', 'bicho'] },
  romper: { name: 'Romper', badge: 1, types: ['roca', 'normal', 'fuego'] },
  nadar: { name: 'Nadar', badge: 2, types: ['agua'] },
  iluminar: { name: 'Iluminar', badge: 3, types: ['fuego', 'electrico'] },
};
const Field2 = {
  who(skill) {
    const s = FIELD_SKILLS[skill];
    return G.party.find((c) => c.hp > 0 && SPECIES[c.sp].types.some((t) => s.types.includes(t))) || null;
  },
  can(skill) { return !!G.badges[FIELD_SKILLS[skill].badge] && !!this.who(skill); },
  needText(skill) {
    const s = FIELD_SKILLS[skill], b = BADGES[s.badge];
    return `Necesitas la ${b ? b.name : 'medalla correspondiente'} y un ánima de tipo ${s.types.map((t) => TYPES[t].name).join(' o ')}.`;
  },
  async use(skill, x, y) {
    const c = this.who(skill);
    await say(`¡${cName(c)} usó ${FIELD_SKILLS[skill].name}!`);
    if (skill === 'cortar') { Sound.sfx('leaf'); World.setTile(x, y, '.'); for (let i = 0; i < 8; i++) World.fieldParts.push({ x: x * 16 + 8, y: y * 16 + 8, vx: U.rand(-50, 50), vy: U.rand(-70, -10), t: 0.6, c: i % 2 ? '#3c8a3a' : '#5aac4a' }); }
    if (skill === 'romper') { Sound.sfx('rock'); Shake.start(2, 0.2); World.setTile(x, y, World.map.cave ? 'c' : World.map.volcanic ? '%' : '.'); for (let i = 0; i < 10; i++) World.fieldParts.push({ x: x * 16 + 8, y: y * 16 + 8, vx: U.rand(-60, 60), vy: U.rand(-80, -10), t: 0.6, c: i % 2 ? PAL.rock2 : PAL.rock3 }); }
    for (const c2 of G.party) if (c2 === c) c2.bond = Math.min(255, c2.bond + 1);
  },
};
World.fieldParts = [];

Object.assign(World, {
  swimmer() { return G.party.find((c) => c.hp > 0 && SPECIES[c.sp].types.includes('agua')); },
  stopSwim() {
    this.swimming = false;
    const p = this.player, f = this.follower, [dx, dy] = DIRS[p.dir];
    const bx = p.x - dx, by = p.y - dy, t = this.tileAt(bx, by);
    f.hidden = false;
    if (t && !t.solid && !this.npcAt(bx, by)) Object.assign(f, { x: bx, y: by, px: bx * 16, py: by * 16, fx: bx, fy: by, tx: bx, ty: by, moving: false });
    else Object.assign(f, { x: p.x, y: p.y, px: p.px, py: p.py, fx: p.x, fy: p.y, tx: p.x, ty: p.y, moving: false });
  },
});
{
  const _blocked = World.blocked;
  World.blocked = function (x, y, who) {
    if (who === this.player && this.swimming) {
      const t = this.tileAt(x, y);
      if (t && t.water) return !!(this.itemAt(x, y) || this.npcAt(x, y, who));
    }
    if (Gather.at(x, y)) return true;
    return _blocked.call(this, x, y, who);
  };
  const _arrived = World.arrived;
  World.arrived = function () {
    const p = this.player;
    if (this.swimming) {
      const t = this.tileAt(p.x, p.y);
      if (t && t.water) { G.steps++; this.syncPos(); return; }
      this.stopSwim();
    }
    return _arrived.call(this);
  };
  const _followTo = World.followTo;
  World.followTo = function (x, y, speed) { if (this.swimming) { this.follower.hidden = true; return; } return _followTo.call(this, x, y, speed); };
  const _loadMap = World.loadMap;
  World.loadMap = function (...a) { this.swimming = false; this.fieldParts = []; return _loadMap.apply(this, a); };
  const _interact = World.interact;
  World.interact = function () {
    const p = this.player, [dx, dy] = DIRS[p.dir], x = p.x + dx, y = p.y + dy;
    const n = this.npcAt(x, y);
    if (!n && !this.itemAt(x, y)) {
      const ch = this.charAt(x, y);
      const node = Gather.at(x, y);
      if (node) { this.runScript(() => Gather.harvest(node)); return; }
      if (ch === 'Y') { this.runScript(() => Quests.board()); return; }
      if (ch === 'U' || ch === 'V' || ch === '¥') {
        const skill = ch === 'U' ? 'cortar' : 'romper';
        this.runScript(async () => {
          await say(ch === 'U' ? 'Un arbusto espeso bloquea el paso.' : 'Una roca agrietada. Parece frágil.');
          if (!Field2.can(skill)) { await say(Field2.needText(skill)); return; }
          if ((await ask(`¿Quieres usar ${FIELD_SKILLS[skill].name}?`)) === 0) await Field2.use(skill, x, y);
        });
        return;
      }
      const t = this.tileAt(x, y);
      if (t && t.water && !this.swimming && !this.npcAt(x, y) && !this.map.noSwim) {
        this.runScript(async () => {
          await say('El agua es azul y profunda.');
          if (!Field2.can('nadar')) { if (G.badges[2]) await say(Field2.needText('nadar')); return; }
          if ((await ask('¿Quieres nadar?')) !== 0) return;
          const c = Field2.who('nadar');
          await say(`¡${G.name} se sube a ${cName(c)}!`);
          this.swimming = true; this.follower.hidden = true;
          Sound.sfx('water');
          this.startMove(p, p.dir, 1); p.onArrive = () => this.arrived();
        });
        return;
      }
    }
    return _interact.call(this);
  };
  // dibujo: nadando sobre el ánima
  const _drawEntity = World.drawEntity;
  World.drawEntity = function (ctx, e, cx, cy) {
    if (e === this.player && this.swimming) {
      const c = this.swimmer() || G.party[0];
      const sx = Math.round(e.px - cx), sy = Math.round(e.py - cy), bob = Math.round(Math.sin(Engine.time * 4));
      ctx.globalAlpha = 0.5; pixRing(ctx, sx + 8, sy + 12, 9 + (Math.floor(Engine.time * 3) % 3), '#d8f0ff', 1); ctx.globalAlpha = 1;
      const img = CreatureGfx.get(c.sp, 22, c.shiny);
      ctx.drawImage(img, sx - 3, sy - 4 + bob);
      const spr = CharSprites.get(LOOKS.player);
      ctx.drawImage(spr, 0, DIR_ROW[e.dir] * 24, 16, 16, sx, sy - 14 + bob, 16, 16);
      return;
    }
    return _drawEntity.call(this, ctx, e, cx, cy);
  };
  // partículas de habilidades y nodos de recolección (debajo de las personas)
  const _fx = World.drawTerrainFX;
  World.drawTerrainFX = function (ctx, cx, cy) {
    _fx.call(this, ctx, cx, cy);
    Gather.draw(ctx, cx, cy);
    for (const q of this.fieldParts) { q.t -= 1 / 60; q.x += q.vx / 60; q.y += q.vy / 60; q.vy += 3; P(ctx, Math.round(q.x - cx), Math.round(q.y - cy), 2, 2, q.c); }
    this.fieldParts = this.fieldParts.filter((q) => q.t > 0);
  };
}

// ---------- recolección ----------
const NODE_KINDS = {
  baya: { name: 'arbusto de bayas', give: () => (Math.random() < 0.35 ? [['baya_dulce', 1], ['baya', 1]] : [['baya', U.randi(1, 2)]]) },
  mineral: { name: 'veta de mineral', give: () => [['mineral', U.randi(1, 2)]] },
  hongo: { name: 'corro de hongos', give: () => [['hongo_seco', U.randi(1, 2)]] },
};
const NODES = {
  ruta1: [[17, 6, 'baya'], [2, 14, 'hongo']],
  ruta2: [[38, 6, 'baya'], [26, 13, 'mineral'], [11, 10, 'hongo']],
  bosque: [[5, 9, 'hongo'], [30, 21, 'hongo'], [14, 12, 'baya']],
  ciudad_roca: [[29, 3, 'mineral']],
  cueva: [[19, 10, 'mineral'], [33, 23, 'mineral'], [3, 24, 'hongo']],
  ruta3: [[29, 4, 'mineral'], [2, 9, 'baya']],
  villa_musgo: [[26, 15, 'baya']],
  puerto_marea: [[2, 5, 'baya']],
};
const Gather = {
  now() { return (G.day || 0) * 1440 + (G.time || 0); },
  key(n) { return World.map.id + ':' + n[0] + ':' + n[1]; },
  at(x, y) { const l = World.map && NODES[World.map.id]; return l ? l.find((n) => n[0] === x && n[1] === y) || null : null; },
  ready(n) { G.nodes = G.nodes || {}; return !(G.nodes[this.key(n)] > this.now()); },
  async harvest(n) {
    const K = NODE_KINDS[n[2]];
    if (!this.ready(n)) { await say(`Un ${K.name}. Ya lo has recogido; volverá a crecer mañana.`); return; }
    const got = K.give();
    G.nodes[this.key(n)] = this.now() + 1440;
    Sound.sfx(n[2] === 'mineral' ? 'rock' : 'leaf');
    for (const [k, q] of got) Game.give(k, q);
    await say(`Recoges del ${K.name}: ${got.map(([k, q]) => `${ITEMS[k].name} ×${q}`).join(', ')}.`);
  },
  draw(ctx, cx, cy) {
    const l = World.map && NODES[World.map.id]; if (!l) return;
    for (const n of l) {
      const x = n[0] * 16 - cx, y = n[1] * 16 - cy;
      if (x < -16 || y < -16 || x > W || y > H) continue;
      const ok = this.ready(n);
      drawShadow(ctx, x + 8, y + 14, 6, 2, 0.25);
      if (n[2] === 'baya') {
        P(ctx, x + 2, y + 4, 12, 10, '#2a6a30'); P(ctx, x + 3, y + 3, 10, 9, '#3c8a3a'); P(ctx, x + 4, y + 4, 4, 3, '#5aac4a');
        if (ok) for (const [bx, by] of [[4, 7], [9, 5], [7, 10], [11, 9]]) { P(ctx, x + bx, y + by, 2, 2, (bx + by) % 3 ? '#e03050' : '#f070a0'); P(ctx, x + bx, y + by, 1, 1, '#ffd0e0'); }
      } else if (n[2] === 'mineral') {
        P(ctx, x + 2, y + 6, 12, 8, PAL.rock4); P(ctx, x + 3, y + 6, 10, 7, PAL.rock3); P(ctx, x + 3, y + 6, 6, 3, PAL.rock2);
        if (ok) { P(ctx, x + 5, y + 3, 2, 5, '#80e0f0'); P(ctx, x + 8, y + 2, 2, 6, '#a0f0ff'); P(ctx, x + 10, y + 4, 2, 4, '#60c0e0'); if (Math.floor(Engine.time * 2 + n[0]) % 4 === 0) P(ctx, x + 9, y + 2, 1, 1, '#ffffff'); }
      } else {
        if (ok) for (const [mx, my, s] of [[3, 8, 5], [8, 6, 6], [11, 10, 4]]) { P(ctx, x + mx + Math.floor(s / 2) - 1, y + my + 2, 2, 5, '#e8dcc0'); P(ctx, x + mx, y + my, s, 3, '#b07040'); P(ctx, x + mx + 1, y + my, 2, 1, '#e0b080'); }
        else { P(ctx, x + 5, y + 10, 2, 3, '#7a6a4a'); P(ctx, x + 9, y + 11, 2, 2, '#7a6a4a'); }
      }
    }
  },
};

// ---------- taller ----------
const RECIPES = [
  { out: 'esfera', qty: 2, need: { mineral: 2 } },
  { out: 'esfera_pesada', qty: 1, need: { mineral: 4 } },
  { out: 'esfera_rapida', qty: 1, need: { mineral: 3, baya_dulce: 1 } },
  { out: 'esfera_nocturna', qty: 1, need: { mineral: 2, hongo_seco: 2 } },
  { out: 'esfera_red', qty: 1, need: { mineral: 1, hongo_seco: 2 } },
  { out: 'pocion', qty: 1, need: { baya: 2 } },
  { out: 'superpocion', qty: 1, need: { baya: 2, baya_dulce: 1, hongo_seco: 1 } },
  { out: 'repelente', qty: 1, need: { hongo_seco: 2 } },
  { out: 'baya_dulce', qty: 1, need: { baya: 3 } },
];
class CraftScreen {
  constructor() { this.i = 0; this.top = 0; this.msg = null; }
  canMake(r) { return Object.entries(r.need).every(([k, q]) => (G.bag[k] || 0) >= q); }
  update(dt) {
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
    const n = RECIPES.length;
    if (Input.repeat('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
    if (this.i < this.top) this.top = this.i; if (this.i >= this.top + 6) this.top = this.i - 5;
    if (Input.mouse.moved || Input.mouse.pressed[0]) { const M = Input.mouse; if (M.x >= 8 && M.x < 200) { const k = Math.floor((M.y - 30) / 26); if (k >= 0 && k < 6 && this.top + k < n) this.i = this.top + k; } }
    if (Input.pressed('a')) {
      const r = RECIPES[this.i];
      if (!this.canMake(r)) { Sound.sfx('bump'); this.msg = { text: 'Te faltan materiales.', t: 1.2 }; return; }
      for (const [k, q] of Object.entries(r.need)) Game.take(k, q);
      Game.give(r.out, r.qty);
      Sound.sfx('buy');
      this.msg = { text: `¡Fabricaste ${ITEMS[r.out].name} ×${r.qty}!`, t: 1.4 };
      G.stats = G.stats || {}; G.stats.crafted = (G.stats.crafted || 0) + 1;
    }
    if (Input.pressed('b')) { Sound.sfx('cancel'); this.done(); }
  }
  draw(ctx) {
    UI.box(ctx, 4, 4, 312, 232);
    Font.draw(ctx, 'TALLER', 14, 12, '#3a3050');
    Font.drawRight(ctx, 'Z: fabricar · X: salir', 306, 12, '#8a8098');
    for (let k = 0; k < 6; k++) {
      const idx = this.top + k; if (idx >= RECIPES.length) break;
      const r = RECIPES[idx], y = 28 + k * 26, sel = idx === this.i, ok = this.canMake(r);
      if (sel) P(ctx, 10, y, 300, 24, '#e8e0f4');
      ctx.drawImage(Icons.item(r.out), 14, y + 4);
      Font.draw(ctx, `${ITEMS[r.out].name} ×${r.qty}`, 34, y + 3, ok ? '#2a2236' : '#9a90a8');
      let nx = 34;
      for (const [k2, q] of Object.entries(r.need)) {
        const have = G.bag[k2] || 0, txt = `${ITEMS[k2].name} ${have}/${q}`;
        Font.draw(ctx, txt, nx, y + 13, have >= q ? '#3a8a40' : '#c04848');
        nx += Font.width(txt) + 10;
      }
      if (sel) UI.cursor && UI.cursor(ctx, 4, y + 8);
    }
    const r = RECIPES[this.i];
    UI.box(ctx, 8, 190, 304, 40, 'panel');
    Font.draw(ctx, ITEMS[r.out].desc.slice(0, 60), 14, 197, '#3a3050');
    if (ITEMS[r.out].desc.length > 60) Font.draw(ctx, ITEMS[r.out].desc.slice(60, 120), 14, 208, '#3a3050');
    if (this.msg) { const w = Font.width(this.msg.text) + 16; UI.box(ctx, (W - w) >> 1, 104, w, 20, 'dark'); Font.drawCenter(ctx, this.msg.text, W >> 1, 110, '#ffe8a0'); }
  }
}
Story.scripts.taller = async function () {
  if (!G.flags.taller_intro) {
    G.flags.taller_intro = 1;
    await say('¡Bienvenido al Taller! Con bayas, minerales y hongos que recojas por las rutas puedo fabricarte esferas y medicinas.', { speaker: 'Artesana' });
    await say('Busca arbustos de bayas, vetas brillantes y corros de hongos. ¡Vuelven a crecer cada día!', { speaker: 'Artesana' });
  }
  await runScene(new CraftScreen());
};

// ---------- encargos y amistad ----------
const caughtN = () => Object.keys(G.caught).length;
const caughtType = (t) => Object.values(SPECIES).filter((s) => G.caught[s.id] && s.types.includes(t)).length;
const stat = (k) => (G.stats && G.stats[k]) || 0;
const QUESTS = [
  { id: 'q_hierba', town: 'musgo', giver: 'vm_old', badges: 0, title: 'Mala hierba', text: 'Derrota 5 ánimas salvajes en la Ruta 2.', prog: () => [stat('win_ruta2'), 5], reward: { money: 400, items: { baya_dulce: 3 } } },
  { id: 'q_dex', town: 'musgo', giver: 'vm_kid', badges: 0, title: 'Coleccionista', text: 'Registra 6 especies capturadas en el Códice.', prog: () => [caughtN(), 6], reward: { items: { superesfera: 3 } } },
  { id: 'q_bayas', town: 'musgo', giver: 'vm_baker', badges: 0, title: 'Bayas para el pan', text: 'Lleva 4 Bayas Vigor al panadero de la villa.', deliver: { baya: 4 }, reward: { money: 600, items: { baya_dulce: 2 } } },
  { id: 'q_mineral', town: 'roca', giver: 'cr_miner1', badges: 1, title: 'Mineral para la mina', text: 'Lleva 5 Minerales al minero de Ciudad Roca.', deliver: { mineral: 5 }, reward: { money: 800, items: { esfera_pesada: 3 } } },
  { id: 'q_noche', town: 'roca', giver: 'cr_sci', badges: 1, title: 'Criaturas nocturnas', text: 'Captura un Umbrín (sale de noche y en cuevas).', prog: () => [G.caught[SPECIES.umbrin.id] ? 1 : 0, 1], reward: { items: { esfera_nocturna: 3 } } },
  { id: 'q_alfa', town: 'roca', giver: 'cr_hiker', badges: 1, title: 'Cazador de alfas', text: 'Derrota o captura un ánima alfa (aura roja).', prog: () => [stat('alpha_win'), 1], reward: { money: 1000, items: { caramelo: 1 } } },
  { id: 'q_agua', town: 'marea', giver: 'pm_old', badges: 2, title: 'Amigos del mar', text: 'Captura 2 especies de tipo Agua.', prog: () => [caughtType('agua'), 2], reward: { items: { esfera_red: 3, hiperpocion: 1 } } },
  { id: 'q_sigilo', town: 'marea', giver: 'pm_girl', badges: 2, title: 'Pasos de gato', text: 'Captura 3 ánimas por sorpresa en el mapa, sin luchar.', prog: () => [stat('stealth_catch'), 3], reward: { money: 800, items: { cinta_veloz: 1 } } },
  { id: 'q_hongos', town: 'marea', giver: 'pm_vendor', badges: 2, title: 'Sopa de hongos', text: 'Lleva 3 Hongos Secos al vendedor del puerto.', deliver: { hongo_seco: 3 }, reward: { items: { hiperpocion: 2 } } },
];
const FRIEND_GIFTS = { vm_old: 'lente_foco', cr_miner1: 'escama_dura', pm_vendor: 'baya_auto' };
const Quests = {
  townOf(mapId) { return { centro_musgo: 'musgo', centro_roca: 'roca', centro_marea: 'marea' }[mapId]; },
  state(q) { G.quests = G.quests || {}; return G.quests[q.id] || 'new'; },
  done(q) { if (q.deliver) return Object.entries(q.deliver).every(([k, n]) => (G.bag[k] || 0) >= n); const [a, b] = q.prog(); return a >= b; },
  progText(q) {
    if (q.deliver) return Object.entries(q.deliver).map(([k, n]) => `${ITEMS[k].name} ${Math.min(n, G.bag[k] || 0)}/${n}`).join(', ');
    const [a, b] = q.prog(); return `${Math.min(a, b)}/${b}`;
  },
  giverName(q) { const L = { vm_old: 'Anciano de la villa', vm_kid: 'Niño de la villa', vm_baker: 'Panadero', cr_miner1: 'Minero', cr_sci: 'Científica', cr_hiker: 'Montañero', pm_old: 'Anciano del puerto', pm_girl: 'Chica del puerto', pm_vendor: 'Vendedor' }; return L[q.giver] || 'Vecino'; },
  active() { return QUESTS.filter((q) => this.state(q) === 'active'); },
  async board() {
    const town = this.townOf(World.map.id);
    const list = QUESTS.filter((q) => q.town === town && G.badges.filter(Boolean).length >= q.badges);
    if (!list.length) { await say('El tablón de encargos está vacío. Vuelve más adelante.'); return; }
    await runScene(new BoardScreen(list));
  },
  // al hablar con quien hizo el encargo
  async talkHook(n) {
    const id = n.def.id;
    const q = this.active().find((x) => x.giver === id);
    if (!q) return false;
    if (!this.done(q)) { await say(`¿Qué tal va mi encargo, "${q.title}"? ${q.text} (${this.progText(q)})`); return true; }
    if (q.deliver) for (const [k, c] of Object.entries(q.deliver)) Game.take(k, c);
    G.quests[q.id] = 'done';
    G.friend = G.friend || {}; G.friend[id] = (G.friend[id] || 0) + 1;
    Sound.jingle('item');
    await say(`¡Muchísimas gracias por completar "${q.title}"! Toma, te lo has ganado.`);
    const parts = [];
    if (q.reward.money) { G.money += q.reward.money; parts.push('$' + q.reward.money); }
    for (const [k, c] of Object.entries(q.reward.items || {})) { Game.give(k, c); parts.push(`${ITEMS[k].name} ×${c}`); }
    await say(`Recibes: ${parts.join(', ')}.`);
    const gift = FRIEND_GIFTS[id];
    if (gift && G.friend[id] >= 1 && !G.flags['fgift_' + id]) {
      G.flags['fgift_' + id] = 1;
      await say('Eres de fiar. Quiero que tengas esto, era muy especial para mí.');
      Game.give(gift, 1); Sound.jingle('item');
      await say(`¡${G.name} recibió ${ITEMS[gift].name}!`);
    }
    return true;
  },
};
class BoardScreen {
  constructor(list) { this.list = list; this.i = 0; this.msg = null; }
  update(dt) {
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
    const n = this.list.length;
    if (Input.repeat('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
    if (Input.mouse.moved || Input.mouse.pressed[0]) { const M = Input.mouse; const k = Math.floor((M.y - 28) / 30); if (M.x > 8 && M.x < 312 && k >= 0 && k < n) this.i = k; }
    if (Input.pressed('a')) {
      const q = this.list[this.i], st = Quests.state(q);
      if (st === 'new') {
        if (Quests.active().length >= 3) { Sound.sfx('bump'); this.msg = { text: 'Solo puedes llevar 3 encargos a la vez.', t: 1.5 }; return; }
        G.quests[q.id] = 'active'; Sound.sfx('select'); this.msg = { text: `Aceptado: habla con ${Quests.giverName(q)} al terminar.`, t: 1.8 };
      } else Sound.sfx('bump');
    }
    if (Input.pressed('b')) { Sound.sfx('cancel'); this.done(); }
  }
  draw(ctx) {
    UI.box(ctx, 4, 4, 312, 232);
    Font.draw(ctx, 'TABLÓN DE ENCARGOS', 14, 12, '#3a3050');
    Font.drawRight(ctx, `Activos ${Quests.active().length}/3`, 306, 12, '#8a8098');
    this.list.forEach((q, k) => {
      const y = 26 + k * 30, sel = k === this.i, st = Quests.state(q);
      if (sel) P(ctx, 10, y, 300, 28, '#e8e0f4');
      const tag = st === 'done' ? '✓ Hecho' : st === 'active' ? (Quests.done(q) ? '¡Listo!' : 'Activo ' + Quests.progText(q)) : 'Nuevo';
      const col = st === 'done' ? '#3a8a40' : st === 'active' ? (Quests.done(q) ? '#d07010' : '#3060c0') : '#a04080';
      Font.draw(ctx, q.title, 16, y + 3, '#2a2236');
      Font.drawRight(ctx, tag, 304, y + 3, col);
      let tx = q.text; while (Font.width(tx) > 286) tx = tx.slice(0, -2) + '…';
      Font.draw(ctx, tx, 16, y + 14, '#5a5070');
      const f = (G.friend && G.friend[q.giver]) || 0;
      if (f) Font.draw(ctx, '♥'.repeat(Math.min(3, f)), 20 + Font.width(q.title), y + 3, '#e05080');
    });
    const q = this.list[this.i];
    UI.box(ctx, 8, 196, 304, 34, 'panel');
    Font.draw(ctx, `Pide: ${Quests.giverName(q)}`, 14, 202, '#3a3050');
    const rw = [q.reward.money ? '$' + q.reward.money : null, ...Object.entries(q.reward.items || {}).map(([k, c]) => `${ITEMS[k].name} ×${c}`)].filter(Boolean).join(', ');
    Font.draw(ctx, `Premio: ${rw}`, 14, 214, '#3a3050');
    if (this.msg) { const w = Font.width(this.msg.text) + 16; UI.box(ctx, (W - w) >> 1, 104, w, 20, 'dark'); Font.drawCenter(ctx, this.msg.text, W >> 1, 110, '#ffe8a0'); }
  }
}
{
  const _talk = World.talk;
  World.talk = async function (n) {
    if (n.def && !n.def.trainer && (await Quests.talkHook(n))) return;
    return _talk.call(this, n);
  };
  // estadísticas para los encargos
  const _start = Battle.start;
  Battle.start = async function (o) {
    const res = await _start.call(this, o);
    if (o && o.wild && G) {
      G.stats = G.stats || {};
      if (res === 'win' || res === 'caught') { const k = 'win_' + G.map; G.stats[k] = (G.stats[k] || 0) + 1; if (o.wild.alpha) G.stats.alpha_win = (G.stats.alpha_win || 0) + 1; }
    }
    return res;
  };
}

// iluminar: más luz en las cuevas si llevas un ánima de Fuego o Eléctrico (con la 4.ª medalla)
{
  const _lights = World.collectLights;
  World.collectLights = function (cx, cy, L) {
    const out = _lights.call(this, cx, cy, L);
    if (this.map.cave && G && Field2.can('iluminar')) {
      const p = this.player;
      out.push({ x: p.px - cx + 8, y: p.py - cy + 4, r: 170, i: 1, glow: '#ffb060', gr: 30 });
    }
    return out;
  };
}
