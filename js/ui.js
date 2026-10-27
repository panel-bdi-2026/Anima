'use strict';
// ============================================================
//  Interfaz: cuadros de texto, menús, equipo, mochila, códice,
//  PC, tienda, opciones, nombre, título
// ============================================================

function runScene(scene) {
  return new Promise((res) => {
    scene.done = (v) => { Scenes.pop(scene); res(v); };
    Scenes.push(scene);
  });
}
const fmt = (s) => String(s).replace(/\{name\}/g, G ? G.name : '').replace(/\{rival\}/g, G ? G.rival : '');

// ---------- cuadro de texto ----------
class TextBox {
  constructor(text, opt = {}) {
    const arr = Array.isArray(text) ? text : [text];
    this.pages = [];
    for (const t of arr) {
      const lines = Font.wrap(fmt(t), 292);
      for (let i = 0; i < lines.length; i += 3) this.pages.push(lines.slice(i, i + 3));
    }
    this.page = 0; this.chars = 0; this.opt = opt; this.closing = false;
    this.speaker = opt.speaker ? fmt(opt.speaker) : null;
    this.completeRes = null;
  }
  get total() { return this.pages[this.page].join('').length; }
  update() {
    if (this.waitingHold) return;
    const sp = [0.6, 1.3, 3][Options.textSpeed] || 1.3;
    if (this.chars < this.total) {
      const before = Math.floor(this.chars);
      this.chars += Input.down('a') || Input.down('b') ? sp * 3 : sp;
      if (Math.floor(this.chars) !== before && Engine.frame % 4 === 0) Sound.sfx('text');
      if (Input.pressed('a') || Input.pressed('b')) this.chars = this.total;
      return;
    }
    const last = this.page === this.pages.length - 1;
    if (last && this.opt.holdLast) { this.waitingHold = true; if (this.completeRes) this.completeRes(); return; }
    if (Input.pressed('a') || Input.pressed('b')) {
      Sound.sfx('blip');
      if (last) this.done && this.done();
      else { this.page++; this.chars = 0; }
    }
  }
  draw(ctx) {
    UI.box(ctx, 4, 180, 312, 56);
    if (this.speaker) {
      const w = Font.width(this.speaker) + 12;
      UI.box(ctx, 8, 168, w, 16, 'panel');
      Font.draw(ctx, this.speaker, 14, 172, '#3a3050');
    }
    let n = Math.floor(this.chars);
    this.pages[this.page].forEach((ln, i) => {
      const s = ln.slice(0, Math.max(0, n)); n -= ln.length;
      Font.draw(ctx, s, 14, 190 + i * 13, '#2a2236');
    });
    if (this.chars >= this.total && !(this.opt.holdLast && this.page === this.pages.length - 1)) {
      if (Math.floor(Engine.time * 3) % 2) { P(ctx, 300, 225, 5, 1, '#2a2236'); P(ctx, 301, 226, 3, 1, '#2a2236'); P(ctx, 302, 227, 1, 1, '#2a2236'); }
    }
  }
}
function say(text, opt) { return runScene(new TextBox(text, opt)); }

// ---------- menú de opciones ----------
class Choice {
  constructor(options, opt = {}) {
    this.options = options; this.i = opt.start || 0; this.opt = opt;
    this.w = opt.w || Math.max(...options.map((o) => Font.width(typeof o === 'string' ? o : o.label))) + 26;
    this.h = options.length * 14 + 10;
    this.x = opt.x !== undefined ? opt.x : W - this.w - 6;
    this.y = opt.y !== undefined ? opt.y : 176 - this.h;
  }
  update() {
    if (Input.repeat('up')) { this.i = (this.i + this.options.length - 1) % this.options.length; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % this.options.length; Sound.sfx('blip'); }
    if (Input.pressed('a')) {
      const o = this.options[this.i];
      if (o && o.disabled) { Sound.sfx('bump'); return; }
      Sound.sfx('select'); this.done(this.i);
    } else if (Input.pressed('b') && this.opt.cancel !== false) { Sound.sfx('cancel'); this.done(-1); }
  }
  draw(ctx) {
    UI.box(ctx, this.x, this.y, this.w, this.h);
    this.options.forEach((o, i) => {
      const label = typeof o === 'string' ? o : o.label;
      Font.draw(ctx, fmt(label), this.x + 16, this.y + 7 + i * 14, o.disabled ? '#a098a8' : '#2a2236');
      if (i === this.i) UI.cursor(ctx, this.x + 7, this.y + 8 + i * 14);
    });
  }
}
function choose(options, opt) { return runScene(new Choice(options, opt)); }

async function ask(text, options = ['Sí', 'No'], opt = {}) {
  const tb = new TextBox(text, { holdLast: true, speaker: opt.speaker });
  const p = new Promise((r) => { tb.completeRes = r; });
  Scenes.push(tb);
  await p;
  const r = await choose(options, opt);
  Scenes.pop(tb);
  return r;
}

// selector de cantidad
class QtyPicker {
  constructor(max, price) { this.n = 1; this.max = Math.max(1, max); this.price = price; }
  update() {
    if (Input.repeat('up')) { this.n = this.n >= this.max ? 1 : this.n + 1; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.n = this.n <= 1 ? this.max : this.n - 1; Sound.sfx('blip'); }
    if (Input.repeat('right')) { this.n = Math.min(this.max, this.n + 10); Sound.sfx('blip'); }
    if (Input.repeat('left')) { this.n = Math.max(1, this.n - 10); Sound.sfx('blip'); }
    if (Input.pressed('a')) { Sound.sfx('select'); this.done(this.n); }
    if (Input.pressed('b')) { Sound.sfx('cancel'); this.done(0); }
  }
  draw(ctx) {
    UI.box(ctx, 196, 140, 118, 36);
    Font.draw(ctx, '×' + U.pad(this.n, 2, '0'), 206, 147, '#2a2236');
    if (this.price !== undefined) Font.drawRight(ctx, '$' + this.n * this.price, 304, 147, '#2a2236');
    Font.draw(ctx, '↑↓ ±1  ←→ ±10', 206, 160, '#8a8098');
  }
}

// ---------- utilidades de dibujo ----------
function drawCreatureIcon(ctx, sp, x, y, S = 24, bob = 0, shiny = false) {
  CreatureAnim.portrait(ctx, sp, S, shiny, x, y, 'icon:' + sp + S + Math.round(x) + Math.round(y));
}
function drawHpBar(ctx, c, x, y, w = 60) {
  const mx = calcStats(c).hp;
  Font.draw(ctx, 'PS', x - 14, y - 2, '#e0a030');
  UI.bar(ctx, x, y, w, 4, c.hp / mx, UI.hpColor(c.hp / mx));
}
function screenBg(ctx, c1 = '#e8e0f0', c2 = '#d8cce8') {
  P(ctx, 0, 0, W, H, c1);
  const o = (Engine.time * 8) % 16;
  ctx.fillStyle = c2;
  for (let y = -16; y < H; y += 16) for (let x = -16; x < W; x += 16) if (((x + y) / 16) % 2 === 0) ctx.fillRect(x + o, y + o, 8, 8);
}

// ---------- pantalla de equipo ----------
class PartyScreen {
  constructor(mode = 'view', opt = {}) {
    this.mode = mode; this.opt = opt; this.i = 0; this.swap = -1; this.opaque = true;
    this.msg = opt.msg || (mode === 'view' ? 'Elige un ánima.' : '¿Qué ánima?');
  }
  async select() {
    const c = G.party[this.i];
    if (this.mode !== 'view') {
      if (this.opt.filter) { const why = this.opt.filter(c); if (why) { Sound.sfx('bump'); this.busy = true; await say(why); this.busy = false; return; } }
      this.done(this.i); return;
    }
    if (this.swap >= 0) {
      if (this.swap !== this.i) { const t = G.party[this.swap]; G.party[this.swap] = G.party[this.i]; G.party[this.i] = t; Sound.sfx('select'); }
      this.swap = -1; return;
    }
    this.busy = true;
    const pts = talentPoints(c);
    const r = await choose(['Datos', pts ? `Constelación (${pts})` : 'Constelación', 'Amuleto', 'Mover', 'Mote', 'Salir'], { x: 226, y: 100 });
    if (r === 0) await runScene(new SummaryScreen(G.party, this.i));
    else if (r === 1) await runScene(new TalentScreen(c));
    else if (r === 2) await equipFlow(c);
    else if (r === 3) this.swap = this.i;
    else if (r === 4) {
      const nn = await runScene(new NameEntry('Mote para ' + SPECIES[c.sp].name + ':', c.nick || SPECIES[c.sp].name));
      if (nn) c.nick = nn === SPECIES[c.sp].name ? null : nn;
    }
    this.busy = false;
  }
  update() {
    if (this.busy) return;
    const n = G.party.length;
    if (Input.repeat('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
    if (Input.pressed('a')) { Sound.sfx('select'); this.select(); }
    else if (Input.pressed('b')) {
      if (this.swap >= 0) { this.swap = -1; Sound.sfx('cancel'); return; }
      if (this.opt.noCancel) { Sound.sfx('bump'); return; }
      Sound.sfx('cancel'); this.done(-1);
    }
  }
  draw(ctx) {
    screenBg(ctx, '#3a6aa8', '#36629c');
    G.party.forEach((c, i) => {
      const y = 6 + i * 30, sel = i === this.i;
      const st = calcStats(c);
      P(ctx, 8, y, 304, 28, '#1c1824');
      P(ctx, 9, y + 1, 302, 26, sel ? '#fff4c8' : c.hp <= 0 ? '#e8c8c8' : '#f4f0f8');
      if (this.swap === i) P(ctx, 9, y + 1, 302, 26, '#c8e8ff');
      const bob = sel ? Math.round(Math.sin(Engine.time * 8)) : 0;
      drawCreatureIcon(ctx, c.sp, 12, y + 1, 24, c.hp > 0 ? bob : 0, c.shiny);
      if (c.shiny) Font.draw(ctx, '★', 34, y + 2, '#e8a020');
      Font.draw(ctx, cName(c), 42, y + 4, '#2a2236');
      Font.draw(ctx, 'Nv' + c.lv, 42, y + 16, '#5a5068');
      SPECIES[c.sp].types.forEach((t, k) => UI.typeBadge(ctx, t, 104 + k * 33, y + 15));
      drawHpBar(ctx, c, 190, y + 7, 80);
      Font.drawRight(ctx, `${c.hp}/${st.hp}`, 270, y + 15, '#2a2236');
      if (c.hp <= 0) Font.draw(ctx, 'DEB', 278, y + 15, '#c03030');
      if (c.held) ctx.drawImage(Icons.item(c.held), 168, y + 2);
      if (talentPoints(c) > 0 && Math.floor(Engine.time * 2) % 2) Font.draw(ctx, '★', 280, y + 3, '#e8a020');
      if (sel) UI.cursor(ctx, 300, y + 10);
    });
    UI.box(ctx, 4, 190, 312, 46);
    Font.draw(ctx, this.swap >= 0 ? '¿Con cuál intercambiar?' : fmt(this.msg), 14, 200, '#2a2236');
    Font.draw(ctx, 'Z: elegir   X: volver', 14, 216, '#8a8098');
  }
}

// ---------- ficha de ánima ----------
class SummaryScreen {
  constructor(list, i) { this.list = list; this.i = i; this.page = 0; this.opaque = true; }
  update() {
    if (Input.repeat('left')) { this.page = (this.page + 2) % 3; Sound.sfx('blip'); }
    if (Input.repeat('right')) { this.page = (this.page + 1) % 3; Sound.sfx('blip'); }
    if (Input.repeat('up') && this.list.length > 1) { this.i = (this.i + this.list.length - 1) % this.list.length; Sound.sfx('blip'); }
    if (Input.repeat('down') && this.list.length > 1) { this.i = (this.i + 1) % this.list.length; Sound.sfx('blip'); }
    if (Input.pressed('b') || Input.pressed('a')) { Sound.sfx('cancel'); this.done(); }
  }
  draw(ctx) {
    const c = this.list[this.i], sp = SPECIES[c.sp], st = calcStats(c);
    screenBg(ctx, '#f0e8d8', '#e8dcc8');
    // cabecera
    P(ctx, 0, 0, W, 20, '#2a2236');
    ['Datos', 'Ataques', 'Evolución'].forEach((t, k) => {
      const x = 8 + k * 70;
      P(ctx, x, 3, 64, 14, k === this.page ? '#f8d048' : '#4a4060');
      Font.drawCenter(ctx, t, x + 32, 6, k === this.page ? '#2a2236' : '#c8c0d8');
    });
    Font.drawRight(ctx, '←→ página  ↑↓ ánima', 314, 6, '#8a8098');
    // retrato
    P(ctx, 8, 26, 100, 100, '#1c1824'); P(ctx, 9, 27, 98, 98, '#fdfaf2');
    const tcol = TYPES[sp.types[0]].color;
    ctx.globalAlpha = 0.25; P(ctx, 9, 90, 98, 35, tcol); ctx.globalAlpha = 1;
    drawShadow(ctx, 58, 112, 22, 4, 0.2);
    CreatureAnim.portrait(ctx, c.sp, 80, c.shiny, 18, 34, 'sum');
    if (c.shiny) Font.draw(ctx, '★ Brillante', 14, 30, '#e8a020');
    Font.draw(ctx, `Nº${U.pad(sp.id, 3, '0')}`, 12, 130, '#5a5068');
    Font.draw(ctx, cName(c), 12, 142, '#2a2236');
    Font.draw(ctx, sp.name + '  Nv ' + c.lv, 12, 154, '#5a5068');
    sp.types.forEach((t, k) => UI.typeBadge(ctx, t, 12 + k * 33, 168));
    const x0 = 118;
    if (this.page === 0) {
      UI.box(ctx, x0, 26, 196, 206, 'panel');
      drawHpBar(ctx, c, x0 + 26, 36, 110);
      Font.drawRight(ctx, `${c.hp}/${st.hp}`, x0 + 186, 33, '#2a2236');
      const rows = [['Ataque', st.atk], ['Defensa', st.def], ['Especial', st.esp], ['Velocidad', st.vel]];
      rows.forEach(([n, v], k) => { Font.draw(ctx, n, x0 + 10, 50 + k * 13, '#5a5068'); Font.drawRight(ctx, String(v), x0 + 100, 50 + k * 13, '#2a2236'); });
      const need = expFor(c.lv + 1) - c.exp;
      Font.draw(ctx, 'Exp. para subir: ' + Math.max(0, need), x0 + 10, 106, '#5a5068');
      const prog = (c.exp - expFor(c.lv)) / Math.max(1, expFor(c.lv + 1) - expFor(c.lv));
      UI.bar(ctx, x0 + 10, 120, 176, 3, prog, '#58a8f0');
      // estilo de combate
      const s = styleOf(c);
      Font.draw(ctx, 'Estilo: ' + s.label, x0 + 10, 132, '#2a2236');
      P(ctx, x0 + 10, 146, 176, 6, '#1c1824');
      P(ctx, x0 + 11, 147, 174, 4, '#5a9ae0');
      P(ctx, x0 + 11, 147, Math.round(174 * s.ratio), 4, '#e86040');
      Font.draw(ctx, 'Ímpetu ' + c.style.imp, x0 + 10, 156, '#c04830');
      Font.drawRight(ctx, c.style.tem + ' Temple', x0 + 186, 156, '#3a70b8');
      // vínculo
      Font.draw(ctx, 'Vínculo', x0 + 10, 174, '#2a2236');
      const hearts = Math.min(5, Math.floor(c.bond / 40));
      for (let k = 0; k < 5; k++) Font.draw(ctx, '♥', x0 + 60 + k * 9, 174, k < hearts ? '#e84870' : '#c8c0d0');
      Font.draw(ctx, c.bond >= BOND_HIGH ? 'Te tiene mucho cariño.' : 'Os estáis conociendo.', x0 + 10, 190, '#5a5068');
      Font.draw(ctx, 'Ímpetu: cuerpo a cuerpo y cargas.', x0 + 10, 206, '#8a8098');
      Font.draw(ctx, 'Temple: distancia y esquivas.', x0 + 10, 217, '#8a8098');
    } else if (this.page === 1) {
      c.moves.forEach((mk, k) => {
        const m = MOVES[mk], y = 26 + k * 51;
        UI.box(ctx, x0, y, 196, 48, 'panel');
        P(ctx, x0 + 1, y + 1, 4, 46, TYPES[m.type].color);
        Font.draw(ctx, `${k + 1}. ${m.name}`, x0 + 10, y + 5, '#2a2236');
        UI.typeBadge(ctx, m.type, x0 + 158, y + 4);
        Font.draw(ctx, `${KIND_LABEL[m.kind]} · ${m.cat === 'fis' ? 'Físico' : 'Especial'}`, x0 + 10, y + 18, '#5a5068');
        Font.draw(ctx, `Pot ${m.pow || '-'}  Rec ${m.cd}s`, x0 + 120, y + 18, '#5a5068');
        Font.draw(ctx, m.desc, x0 + 10, y + 32, '#8a8098');
      });
    } else {
      UI.box(ctx, x0, 26, 196, 206, 'panel');
      Font.draw(ctx, 'Etapa ' + sp.stage, x0 + 10, 34, '#2a2236');
      const lines = Font.wrap(evoText(sp), 176);
      lines.forEach((ln, k) => Font.draw(ctx, ln, x0 + 10, 50 + k * 12, '#5a5068'));
      if (sp.evo && sp.evo.branch) {
        const br = sp.evo.branch;
        [br.a, br.b].forEach((k2, j) => {
          const xx = x0 + 22 + j * 92, yy = 150;
          P(ctx, xx - 2, yy - 2, 52, 52, '#1c1824'); P(ctx, xx - 1, yy - 1, 50, 50, '#fdfaf2');
          if (G.seen[SPECIES[k2].id]) ctx.drawImage(CreatureGfx.get(k2, 48), xx, yy);
          else ctx.drawImage(CreatureGfx.flash(k2, 48, '#3a3050'), xx, yy);
          Font.drawCenter(ctx, G.seen[SPECIES[k2].id] ? SPECIES[k2].name : '???', xx + 24, yy + 52, '#2a2236');
        });
      }
    }
  }
}

// ---------- mochila ----------
class BagScreen {
  constructor(mode = 'field') { this.mode = mode; this.i = 0; this.scroll = 0; this.opaque = true; }
  items() {
    return Object.keys(G.bag).filter((k) => G.bag[k] > 0 && ITEMS[k] && (this.mode !== 'battle' || ITEMS[k].battle))
      .sort((a, b) => Object.keys(ITEMS).indexOf(a) - Object.keys(ITEMS).indexOf(b));
  }
  async select(id) {
    if (this.mode === 'battle') { this.done(id); return; }
    this.busy = true;
    const it = ITEMS[id];
    const opts = it.key ? ['Salir'] : ['Usar', 'Tirar', 'Salir'];
    const r = await choose(opts, { x: 236, y: 130 });
    if (!it.key && r === 0) await useItemField(id);
    else if (!it.key && r === 1) {
      const n = await runScene(new QtyPicker(G.bag[id]));
      if (n > 0) { Game.take(id, n); await say(`Tiraste ${n} ${it.name}.`); }
    }
    this.busy = false;
  }
  update() {
    if (this.busy) return;
    const list = this.items();
    const n = list.length + 1;
    if (Input.repeat('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
    this.i = Math.min(this.i, n - 1);
    if (this.i < this.scroll) this.scroll = this.i;
    if (this.i >= this.scroll + 9) this.scroll = this.i - 8;
    if (Input.pressed('a')) {
      Sound.sfx('select');
      if (this.i === list.length) this.done(null); else this.select(list[this.i]);
    } else if (Input.pressed('b')) { Sound.sfx('cancel'); this.done(null); }
  }
  draw(ctx) {
    screenBg(ctx, '#d89848', '#d09040');
    P(ctx, 8, 6, 96, 96, '#1c1824'); P(ctx, 9, 7, 94, 94, '#f8ecd0');
    // mochila dibujada
    P(ctx, 30, 30, 52, 60, '#6a4020'); P(ctx, 32, 32, 48, 56, '#c87838'); P(ctx, 32, 32, 48, 18, '#e09048'); P(ctx, 50, 22, 12, 12, '#6a4020'); P(ctx, 52, 24, 8, 8, '#f8ecd0');
    P(ctx, 52, 52, 8, 6, '#f8d048');
    Font.drawCenter(ctx, this.mode === 'battle' ? 'COMBATE' : 'MOCHILA', 56, 92, '#6a4020');
    Font.draw(ctx, '$' + G.money, 12, 110, '#2a2236');
    const list = this.items();
    UI.box(ctx, 110, 6, 204, 138);
    for (let k = 0; k < 9; k++) {
      const idx = this.scroll + k; if (idx > list.length) break;
      const y = 14 + k * 14;
      if (idx === list.length) Font.draw(ctx, 'CERRAR', 136, y, '#2a2236');
      else {
        const id = list[idx];
        ctx.drawImage(Icons.item(id), 118, y - 4);
        Font.draw(ctx, ITEMS[id].name, 136, y, '#2a2236');
        if (!ITEMS[id].key) Font.drawRight(ctx, '×' + G.bag[id], 304, y, '#2a2236');
      }
      if (idx === this.i) UI.cursor(ctx, 112, y + 1);
    }
    UI.box(ctx, 4, 150, 312, 86);
    const id = list[this.i];
    if (id) {
      ctx.drawImage(Icons.item(id), 14, 160);
      Font.wrap(ITEMS[id].desc, 270).forEach((ln, k) => Font.draw(ctx, ln, 36, 162 + k * 13, '#2a2236'));
    } else Font.draw(ctx, 'Cerrar la mochila.', 14, 162, '#2a2236');
  }
}

// cierra todos los menús abiertos sobre el mundo resolviendo sus promesas
function closeMenus() {
  let guard = 0;
  while (Scenes.top() && Scenes.top() !== World && guard++ < 20) {
    const s = Scenes.top();
    if (s.done) s.done(s instanceof PartyScreen || s instanceof BoxScreen ? -1 : null); else Scenes.pop(s);
  }
}

// usar objeto fuera de combate
async function useItemField(id) {
  const it = ITEMS[id];
  if (it.target === 'field') {
    if (it.bait) { await say('Cierra el menú y pulsa E (o clic) en el mapa para lanzar el cebo cerca de las ánimas.'); return false; }
    if (it.repel) { G.repel = it.repel; Game.take(id); await say(`Usaste ${it.name}. Las ánimas salvajes débiles no se acercarán.`); return true; }
    if (it.escape) {
      const m = MAPS[G.map];
      if (!m.cave) { await say('Ahora no puedes usarla.'); return false; }
      Game.take(id); await say(`¡Usaste ${it.name}!`);
      closeMenus();
      const w = m.warps[0]; // la entrada de la cueva
      await World.warpTo(w.to, w.tx, w.ty, 'down');
      return true;
    }
  }
  if (it.sphere) { await say('Pulsa E en el mapa para lanzarla, o úsala en combate (modo captura).'); return false; }
  if (it.target !== 'party') { await say('Ahora no puedes usarlo.'); return false; }
  const idx = await runScene(new PartyScreen('select', { msg: `¿Usar ${it.name} en qué ánima?` }));
  if (idx < 0) return false;
  return applyItemToCreature(id, G.party[idx], false);
}

async function applyItemToCreature(id, c, inBattle) {
  const it = ITEMS[id], st = calcStats(c);
  if (it.heal) {
    if (c.hp <= 0 || c.hp >= st.hp) { await say('No tendrá ningún efecto.'); return false; }
    const h = Math.min(it.heal, st.hp - c.hp); c.hp += h; Game.take(id); Sound.sfx('heal');
    await say(`${cName(c)} recuperó ${h} PS.`); return true;
  }
  if (it.revive) {
    if (c.hp > 0) { await say('No tendrá ningún efecto.'); return false; }
    c.hp = Math.max(1, Math.floor(st.hp * it.revive)); Game.take(id); Sound.sfx('heal');
    await say(`¡${cName(c)} se ha recuperado!`); return true;
  }
  if (inBattle) { await say('Ahora no puedes usarlo.'); return false; }
  if (it.rare) {
    if (c.lv >= 100) { await say('No tendrá ningún efecto.'); return false; }
    Game.take(id);
    const evs = gainExp(c, expFor(c.lv + 1) - c.exp);
    Sound.jingle('levelup');
    await say(`¡${cName(c)} subió al nivel ${c.lv}!`);
    await processLevelEvents(c, evs);
    await tryEvolve(c, {});
    return true;
  }
  if (it.resetTalents) {
    if (!c.board || c.board.n.length <= 1) { await say('No tendrá ningún efecto.'); return false; }
    Board.reset(c); const mx = calcStats(c).hp; if (c.hp > mx) c.hp = mx; Game.take(id); Sound.sfx('heal');
    await say(`¡La Constelación de ${cName(c)} se ha reiniciado! Tiene ${talentPoints(c)} puntos de Esencia para repartir.`); return true;
  }
  if (it.held) { await say('Es un amuleto. Equípalo desde el menú de ánimas (opción Amuleto).'); return false; }
  if (it.evoItem) {
    const to = evoTarget(c, { item: id });
    if (!to) { await say('No tendrá ningún efecto.'); return false; }
    Game.take(id);
    await runEvolution(c, to, true);
    return true;
  }
  await say('No tendrá ningún efecto.');
  return false;
}

async function processLevelEvents(c, evs) {
  for (const e of evs) if (e.learn) await learnMoveFlow(c, e.learn);
}
async function learnMoveFlow(c, mk) {
  const m = MOVES[mk];
  if (c.moves.includes(mk)) return;
  if (c.moves.length < 4) { c.moves.push(mk); Sound.sfx('super'); await say(`¡${cName(c)} aprendió ${m.name}!`); return; }
  while (true) {
    const r = await ask([`${cName(c)} quiere aprender ${m.name}.`, `Pero ya conoce cuatro ataques. ¿Olvidar uno para aprender ${m.name}?`]);
    if (r !== 0) {
      const r2 = await ask(`¿Dejar de aprender ${m.name}?`);
      if (r2 === 0) { await say(`${cName(c)} no aprendió ${m.name}.`); return; }
      continue;
    }
    const opts = c.moves.map((x) => MOVES[x].name).concat([m.name + ' (nuevo)']);
    const k = await choose(opts, { x: 150, y: 70 });
    if (k < 0 || k === 4) continue;
    const old = MOVES[c.moves[k]].name;
    c.moves[k] = mk;
    await say([`1, 2 y... ¡puf! ${cName(c)} olvidó ${old}.`, `¡Y aprendió ${m.name}!`]);
    return;
  }
}

// ---------- amuletos ----------
async function equipFlow(c) {
  const list = Object.keys(G.bag).filter((k) => ITEMS[k] && ITEMS[k].held && G.bag[k] > 0);
  const opts = list.map((k) => ITEMS[k].name + ' ×' + G.bag[k]);
  if (c.held) opts.unshift('Quitar ' + ITEMS[c.held].name);
  if (!opts.length) { await say('No tienes amuletos. Se encuentran por la región o se compran en las tiendas.'); return; }
  opts.push('Cancelar');
  const r = await choose(opts, { x: 150, y: 40 });
  if (r < 0 || r === opts.length - 1) return;
  if (c.held && r === 0) { Game.give(c.held); await say(`Le quitaste ${ITEMS[c.held].name} a ${cName(c)}.`); c.held = null; return; }
  const k = list[c.held ? r - 1 : r];
  if (c.held) Game.give(c.held);
  Game.take(k); c.held = k; Sound.sfx('buff');
  await say(`${cName(c)} lleva ahora ${ITEMS[k].name}.`);
}

// ---------- árbol de talentos ----------
class TalentScreen {
  constructor(c) { this.c = c; this.bx = 0; this.by = 0; this.opaque = true; if (!c.talents) c.talents = {}; }
  update() {
    if (Input.repeat('left')) { this.bx = (this.bx + 2) % 3; Sound.sfx('blip'); }
    if (Input.repeat('right')) { this.bx = (this.bx + 1) % 3; Sound.sfx('blip'); }
    if (Input.repeat('up')) { this.by = (this.by + 2) % 3; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.by = (this.by + 1) % 3; Sound.sfx('blip'); }
    if (Input.pressed('a')) {
      const br = Object.keys(TALENTS)[this.bx], t = TALENTS[br].list[this.by], c = this.c;
      const cur = c.talents[t.key] || 0;
      if (talentPoints(c) <= 0 || cur >= TALENT_MAX || !talentUnlocked(c, br, this.by)) { Sound.sfx('bump'); return; }
      const before = calcStats(c).hp;
      c.talents[t.key] = cur + 1;
      const after = calcStats(c).hp;
      if (c.hp > 0) c.hp += after - before;
      Sound.sfx('buff');
    }
    if (Input.pressed('b')) { Sound.sfx('cancel'); this.done(); }
  }
  draw(ctx) {
    const c = this.c;
    screenBg(ctx, '#2a2440', '#262038');
    P(ctx, 0, 0, W, 20, '#14101e');
    Font.draw(ctx, `TALENTOS DE ${cName(c).toUpperCase()}  Nv${c.lv}`, 8, 6, '#ffffff');
    Font.drawRight(ctx, `Puntos: ${talentPoints(c)}`, 312, 6, talentPoints(c) ? '#ffe060' : '#a098b8');
    Object.keys(TALENTS).forEach((br, bx) => {
      const B = TALENTS[br], x = 8 + bx * 104;
      P(ctx, x, 26, 98, 16, B.color); Font.drawCenter(ctx, B.name, x + 49, 30, '#ffffff');
      B.list.forEach((t, by) => {
        const y = 48 + by * 44, unlocked = talentUnlocked(c, br, by), rank = c.talents[t.key] || 0;
        if (by > 0) P(ctx, x + 48, y - 6, 2, 6, unlocked ? B.color : '#4a4460');
        P(ctx, x, y, 98, 38, '#14101e');
        P(ctx, x + 1, y + 1, 96, 36, unlocked ? '#3a3456' : '#24203a');
        if (bx === this.bx && by === this.by) { P(ctx, x, y, 98, 1, '#ffe060'); P(ctx, x, y + 37, 98, 1, '#ffe060'); P(ctx, x, y, 1, 38, '#ffe060'); P(ctx, x + 97, y, 1, 38, '#ffe060'); }
        Font.draw(ctx, t.name, x + 5, y + 5, unlocked ? '#ffffff' : '#706888');
        for (let k = 0; k < TALENT_MAX; k++) { P(ctx, x + 6 + k * 12, y + 22, 9, 9, '#14101e'); P(ctx, x + 7 + k * 12, y + 23, 7, 7, k < rank ? B.color : '#4a4460'); }
        if (!unlocked) Font.draw(ctx, 'Bloqueado', x + 46, y + 23, '#706888');
      });
    });
    const br = Object.keys(TALENTS)[this.bx], t = TALENTS[br].list[this.by];
    UI.box(ctx, 4, 184, 312, 52);
    Font.wrap(t.desc, 292).forEach((ln, k) => Font.draw(ctx, ln, 14, 192 + k * 12, '#2a2236'));
    Font.draw(ctx, talentUnlocked(c, br, this.by) ? 'Z: invertir punto · X: salir' : 'Requiere 2 rangos en el talento anterior.', 14, 220, '#8a8098');
  }
}

// ---------- evolución ----------
class EvolutionScene {
  constructor(c, to, forced) { this.c = c; this.from = c.sp; this.to = to; this.t = 0; this.opaque = true; this.forced = forced; this.cancel = false; this.phase = 0; }
  update(dt) {
    this.t += dt;
    if (!this.forced && this.t < 5.5 && Input.pressed('b')) { this.cancel = true; this.done(false); }
    if (this.t >= 6) this.done(true);
  }
  draw(ctx) {
    P(ctx, 0, 0, W, H, '#100c1c');
    for (let i = 0; i < 40; i++) {
      const a = i * 0.7 + this.t * (0.5 + (i % 5) * 0.2), r = ((i * 37 + this.t * 60) % 160);
      P(ctx, 160 + Math.cos(a) * r, 110 + Math.sin(a) * r, 2, 2, i % 3 ? '#f8e8a0' : '#a0d8ff');
    }
    const t = this.t;
    const freq = 1 + t * t * 0.8;
    const showNew = t > 5 || (t > 1 && Math.sin(t * freq * 3) > 0);
    const sp = showNew ? this.to : this.from;
    const img = t > 1 && t < 5.4 ? CreatureGfx.flash(sp, 96, '#ffffff') : CreatureGfx.get(sp, 96);
    ctx.drawImage(img, 112, 50);
    if (t > 5.4 && t < 6) { ctx.globalAlpha = (6 - t) / 0.6; P(ctx, 0, 0, W, H, '#fff'); ctx.globalAlpha = 1; }
    UI.box(ctx, 4, 180, 312, 56);
    Font.draw(ctx, t < 5 ? `¿Qué? ¡${cName(this.c)} está evolucionando!` : '', 14, 192, '#2a2236');
    if (!this.forced && t < 5) Font.draw(ctx, '(X para detenerlo)', 14, 218, '#8a8098');
  }
}
async function runEvolution(c, to, forced = false) {
  const oldName = cName(c);
  const prevMusic = Sound.currentName;
  Sound.music('ending');
  const ok = await runScene(new EvolutionScene(c, to, forced));
  if (!ok) { await say(`¿Eh? ${oldName} dejó de evolucionar.`); if (prevMusic) Sound.music(prevMusic); return false; }
  evolve(c, to);
  Sound.jingle('evolve');
  await say(`¡Enhorabuena! ¡${oldName} evolucionó en ${SPECIES[to].name}!`);
  // aprende ataques del nivel actual de la nueva especie
  for (const e of SPECIES[to].learn) if (e.lv === c.lv && !c.moves.includes(e.m)) await learnMoveFlow(c, e.m);
  if (prevMusic) Sound.music(prevMusic);
  return true;
}
async function tryEvolve(c, ctx) {
  const to = evoTarget(c, Object.assign({ map: G.map }, ctx));
  if (!to) return false;
  return runEvolution(c, to, false);
}

// ---------- códice ----------
class DexScreen {
  constructor() { this.i = 0; this.scroll = 0; this.opaque = true; this.detail = false; }
  update() {
    const n = SPECIES_LIST.length;
    if (this.detail) {
      if (Input.repeat('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
      if (Input.repeat('down')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
      if (Input.pressed('b') || Input.pressed('a')) { this.detail = false; Sound.sfx('cancel'); }
      return;
    }
    if (Input.repeat('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
    if (Input.repeat('left')) { this.i = Math.max(0, this.i - 10); Sound.sfx('blip'); }
    if (Input.repeat('right')) { this.i = Math.min(n - 1, this.i + 10); Sound.sfx('blip'); }
    if (this.i < this.scroll) this.scroll = this.i;
    if (this.i >= this.scroll + 14) this.scroll = this.i - 13;
    if (Input.pressed('a')) { if (G.seen[this.i + 1]) { this.detail = true; Sound.sfx('select'); } else Sound.sfx('bump'); }
    if (Input.pressed('b')) { Sound.sfx('cancel'); this.done(); }
  }
  draw(ctx) {
    P(ctx, 0, 0, W, H, '#c83848'); P(ctx, 0, 0, W, 18, '#901c2c');
    Font.draw(ctx, 'CÓDICE ÁNIMA', 8, 4, '#ffffff');
    Font.drawRight(ctx, `Vistos ${Object.keys(G.seen).length}  Capturados ${Object.keys(G.caught).length}`, 312, 4, '#ffd8d8');
    const sp = SPECIES_LIST[this.i];
    if (this.detail) {
      UI.box(ctx, 6, 22, 308, 212, 'panel');
      P(ctx, 14, 30, 98, 98, '#1c1824'); P(ctx, 15, 31, 96, 96, '#e8f0f8');
      CreatureAnim.portrait(ctx, sp.key, 80, false, 23, 38, 'dex80');
      Font.draw(ctx, `Nº${U.pad(sp.id, 3, '0')} ${sp.name}`, 122, 32, '#2a2236');
      sp.types.forEach((t, k) => UI.typeBadge(ctx, t, 122 + k * 33, 46));
      Font.draw(ctx, G.caught[sp.id] ? 'Capturado' : 'Visto', 200, 47, G.caught[sp.id] ? '#2a8a40' : '#8a8098');
      Font.wrap(sp.desc, 180).forEach((ln, k) => Font.draw(ctx, ln, 122, 62 + k * 12, '#5a5068'));
      if (G.caught[sp.id]) {
        const s = sp.stats;
        [['PS', s.hp], ['Ata', s.atk], ['Def', s.def], ['Esp', s.esp], ['Vel', s.vel]].forEach(([n, v], k) => {
          Font.draw(ctx, n, 14, 136 + k * 11, '#5a5068');
          UI.bar(ctx, 38, 138 + k * 11, 70, 4, v / 130, TYPES[sp.types[0]].color);
        });
      }
      Font.draw(ctx, 'Evolución', 122, 136, '#2a2236');
      Font.wrap(evoText(sp), 180).forEach((ln, k) => Font.draw(ctx, ln, 122, 150 + k * 12, '#5a5068'));
      return;
    }
    UI.box(ctx, 160, 22, 154, 212, 'panel');
    for (let k = 0; k < 14; k++) {
      const idx = this.scroll + k; if (idx >= SPECIES_LIST.length) break;
      const s = SPECIES_LIST[idx], y = 28 + k * 14.5;
      if (G.caught[s.id]) ctx.drawImage(Icons.sphere('esfera', 8), 168, y + 1);
      Font.draw(ctx, U.pad(s.id, 3, '0') + ' ' + (G.seen[s.id] ? s.name : '----------'), 180, y, '#2a2236');
      if (idx === this.i) UI.cursor(ctx, 300, y + 1);
    }
    P(ctx, 8, 24, 146, 146, '#1c1824'); P(ctx, 9, 25, 144, 144, '#e8f0f8');
    if (G.seen[sp.id]) {
      CreatureAnim.portrait(ctx, sp.key, 96, false, 33, 42, 'dex96');
      Font.drawCenter(ctx, sp.name, 81, 176, '#ffffff');
      sp.types.forEach((t, k) => UI.typeBadge(ctx, t, 50 + k * 33, 192));
    } else {
      Font.drawCenter(ctx, '?', 81, 92, '#a0a8b8');
      Font.drawCenter(ctx, 'Sin datos', 81, 176, '#ffd8d8');
    }
    Font.drawCenter(ctx, 'Z: detalles  ←→: saltar', 81, 214, '#ffd8d8');
  }
}

// ---------- PC ----------
async function openPC() {
  Sound.sfx('select');
  await say('Encendiste el PC. Se conectó al Sistema de Almacenamiento de Ánimas.');
  while (true) {
    const r = await choose(['Retirar ánima', 'Depositar ánima', 'Salir'], { x: 160, y: 60 });
    if (r === 0) {
      if (!G.box.length) { await say('No hay ánimas almacenadas.'); continue; }
      if (G.party.length >= 6) { await say('Tu equipo está completo.'); continue; }
      const k = await runScene(new BoxScreen('Retirar'));
      if (k >= 0) { const c = G.box.splice(k, 1)[0]; G.party.push(c); await say(`Retiraste a ${cName(c)}.`); }
    } else if (r === 1) {
      if (G.party.length <= 1) { await say('¡No puedes quedarte sin ánimas!'); continue; }
      const k = await runScene(new PartyScreen('select', { msg: '¿Qué ánima depositar?' }));
      if (k >= 0) {
        if (G.party.filter((c, j) => j !== k && c.hp > 0).length === 0) { await say('Necesitas al menos un ánima en condiciones.'); continue; }
        const c = G.party.splice(k, 1)[0]; c.hp = calcStats(c).hp; G.box.push(c); await say(`Depositaste a ${cName(c)}.`);
      }
    } else return;
  }
}
class BoxScreen {
  constructor(title) { this.title = title; this.i = 0; this.scroll = 0; this.opaque = true; }
  update() {
    const n = G.box.length;
    if (Input.repeat('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
    if (this.i < this.scroll) this.scroll = this.i;
    if (this.i >= this.scroll + 12) this.scroll = this.i - 11;
    if (Input.pressed('a')) { Sound.sfx('select'); this.done(this.i); }
    if (Input.pressed('b')) { Sound.sfx('cancel'); this.done(-1); }
    if (Input.pressed('start')) { runScene(new SummaryScreen(G.box, this.i)); }
  }
  draw(ctx) {
    screenBg(ctx, '#58a070', '#509868');
    UI.box(ctx, 150, 6, 164, 228);
    Font.draw(ctx, `CAJA (${G.box.length})`, 160, 12, '#2a2236');
    for (let k = 0; k < 12; k++) {
      const idx = this.scroll + k; if (idx >= G.box.length) break;
      const c = G.box[idx], y = 28 + k * 16;
      Font.draw(ctx, cName(c), 172, y, '#2a2236'); Font.drawRight(ctx, 'Nv' + c.lv, 304, y, '#5a5068');
      if (idx === this.i) UI.cursor(ctx, 160, y + 1);
    }
    const c = G.box[this.i];
    if (c) {
      P(ctx, 10, 10, 130, 130, '#1c1824'); P(ctx, 11, 11, 128, 128, '#f0f8f0');
      CreatureAnim.portrait(ctx, c.sp, 96, c.shiny, 27, 25, 'big96');
      Font.drawCenter(ctx, SPECIES[c.sp].name, 75, 146, '#ffffff');
      SPECIES[c.sp].types.forEach((t, k) => UI.typeBadge(ctx, t, 44 + k * 33, 160));
    }
    Font.draw(ctx, 'Z: ' + this.title, 12, 200, '#ffffff');
    Font.draw(ctx, 'Intro: datos  X: salir', 12, 214, '#e0f0e0');
  }
}

// ---------- tienda ----------
async function openShop(shopId) {
  await say('¡Bienvenido! ¿En qué puedo ayudarte?');
  while (true) {
    const r = await choose(['Comprar', 'Vender', 'Salir'], { x: 220, y: 100 });
    if (r === 0) await runScene(new ShopScreen(SHOPS[shopId], 'buy'));
    else if (r === 1) await runScene(new ShopScreen(null, 'sell'));
    else { await say('¡Vuelve pronto!'); return; }
  }
}
class ShopScreen {
  constructor(list, mode) { this.list0 = list; this.mode = mode; this.i = 0; this.scroll = 0; }
  list() { return this.mode === 'buy' ? this.list0 : Object.keys(G.bag).filter((k) => ITEMS[k] && !ITEMS[k].key && (ITEMS[k].price > 0 || ITEMS[k].sell) && G.bag[k] > 0); }
  async pick(id) {
    this.busy = true;
    const it = ITEMS[id];
    if (this.mode === 'buy') {
      const price = Events.buyPrice(it);
      const max = Math.min(99, Math.floor(G.money / price));
      if (max < 1) { await say('No tienes suficiente dinero.'); this.busy = false; return; }
      const n = await runScene(new QtyPicker(max, price));
      if (n > 0) {
        const r = await ask(`${it.name} ×${n} cuesta $${n * price}. ¿De acuerdo?`);
        if (r === 0) {
          G.money -= n * price; Game.give(id, n); Sound.sfx('buy');
          let extra = '';
          if (it.sphere === 'esfera' && n >= 10) { Game.give('superesfera', 1); extra = ' ¡Y te regalo una Superesfera por tu compra!'; }
          await say('¡Aquí tienes! Gracias.' + extra);
        }
      }
    } else {
      const price = it.sell || Math.floor(it.price / 2);
      const n = await runScene(new QtyPicker(G.bag[id], price));
      if (n > 0) {
        const r = await ask(`Te puedo dar $${n * price} por ${n} ${it.name}. ¿Vale?`);
        if (r === 0) { Game.take(id, n); G.money += n * price; Sound.sfx('buy'); await say('¡Trato hecho!'); }
      }
    }
    this.busy = false;
  }
  update() {
    if (this.busy) return;
    const list = this.list(); const n = list.length + 1;
    if (Input.repeat('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
    this.i = Math.min(this.i, n - 1);
    if (this.i < this.scroll) this.scroll = this.i;
    if (this.i >= this.scroll + 8) this.scroll = this.i - 7;
    if (Input.pressed('a')) { Sound.sfx('select'); if (this.i === list.length) this.done(); else this.pick(list[this.i]); }
    if (Input.pressed('b')) { Sound.sfx('cancel'); this.done(); }
  }
  draw(ctx) {
    UI.box(ctx, 120, 4, 196, 130);
    UI.box(ctx, 4, 4, 112, 22);
    Font.draw(ctx, '$' + G.money, 12, 10, '#2a2236');
    const list = this.list();
    for (let k = 0; k < 8; k++) {
      const idx = this.scroll + k; if (idx > list.length) break;
      const y = 12 + k * 14;
      if (idx === list.length) Font.draw(ctx, 'SALIR', 144, y, '#2a2236');
      else {
        const it = ITEMS[list[idx]];
        ctx.drawImage(Icons.item(list[idx]), 128, y - 4);
        Font.draw(ctx, it.name, 146, y, '#2a2236');
        Font.drawRight(ctx, this.mode === 'buy' ? '$' + Events.buyPrice(it) : '×' + G.bag[list[idx]], 306, y, '#2a2236');
      }
      if (idx === this.i) UI.cursor(ctx, 122, y + 1);
    }
    UI.box(ctx, 4, 180, 312, 56);
    const id = list[this.i];
    if (id) Font.wrap(ITEMS[id].desc + (this.mode === 'buy' && G.bag[id] ? `  (Tienes ${G.bag[id]})` : ''), 292).forEach((ln, k) => Font.draw(ctx, ln, 14, 190 + k * 13, '#2a2236'));
  }
}

// ---------- opciones ----------
class OptionsScreen {
  constructor() { this.i = 0; this.opaque = false; this.t = 0; }
  rows() { return 9; }
  update(dt) {
    this.t += dt;
    const n = this.rows();
    if (Input.repeat('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
    const d = Input.repeat('left') ? -1 : Input.repeat('right') ? 1 : 0;
    if (d) {
      if (this.i === 0) Options.textSpeed = U.clamp(Options.textSpeed + d, 0, 2);
      if (this.i === 1) Options.music = U.clamp(Math.round((Options.music + d * 0.1) * 10) / 10, 0, 1);
      if (this.i === 2) Options.sfx = U.clamp(Math.round((Options.sfx + d * 0.1) * 10) / 10, 0, 1);
      if (this.i === 3) { const L = [15, 24, 48, 0]; Options.dayLen = L[(L.indexOf(Options.dayLen) + d + L.length) % L.length]; }
      if (this.i === 4) this.toggleFull();
      if (this.i === 5) Options.autosave = !Options.autosave;
      if (this.i === 6) Options.assist = !Options.assist;
      if (this.i === 7) { Options.gfx3d = Options.gfx3d === false; if (Options.gfx3d && typeof World3D !== 'undefined' && !World3D.init()) Options.gfx3d = false; }
      Options.save(); Sound.sfx('blip');
    }
    if (Input.pressed('a') && this.i === 4) { this.toggleFull(); Sound.sfx('select'); return; }
    if ((Input.pressed('a') && this.i === 8) || Input.pressed('b')) { Sound.sfx('cancel'); Options.save(); this.done(); }
  }
  toggleFull() {
    try {
      const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
      if (p && p.catch) p.catch(() => {}); // el navegador puede denegarlo
    } catch (e) { /* no disponible */ }
  }
  draw(ctx) {
    ctx.globalAlpha = 0.5; P(ctx, 0, 0, W, H, '#0a0614'); ctx.globalAlpha = 1;
    UI.box(ctx, 30, 26, 260, 208);
    UI.box(ctx, 110, 18, 100, 18, 'title');
    Font.drawCenter(ctx, 'OPCIONES', 160, 24, '#ffffff', '#1a1430');
    const dl = Options.dayLen === 0 ? 'Reloj real' : Options.dayLen + ' min';
    const rows = [
      ['Velocidad del texto', ['Lenta', 'Normal', 'Rápida'][Options.textSpeed]],
      ['Música', null, Options.music], ['Efectos', null, Options.sfx],
      ['Duración del día', dl], ['Pantalla completa', document.fullscreenElement ? 'Sí' : 'No'], ['Autoguardado', Options.autosave ? 'Sí' : 'No'], ['Mov. asistido', Options.assist ? 'Sí' : 'No'], ['Gráficos', Options.gfx3d === false ? 'Clásico' : '3D'], ['Volver', ''],
    ];
    rows.forEach(([n, v, bar], k) => {
      const y = 46 + k * 17 + (k === 8 ? 4 : 0);
      if (k === this.i) { ctx.globalAlpha = 0.18; P(ctx, 36, y - 4, 248, 16, '#6c8cd8'); ctx.globalAlpha = 1; }
      Font.draw(ctx, n, 52, y, '#2a2236');
      if (bar !== undefined) { UI.bar(ctx, 160, y + 3, 90, 4, bar, '#58a8f0'); Font.draw(ctx, String(Math.round(bar * 10)), 258, y, '#2a2236'); }
      else if (v) { Font.drawCenter(ctx, v, 214, y, '#2a2236'); if (k === this.i) { Font.draw(ctx, '<', 160, y, '#c04830'); Font.draw(ctx, '>', 264, y, '#c04830'); } }
      if (k === this.i) UI.cursor(ctx, 40, y + 1);
    });
    Font.drawCenter(ctx, '←→ o clic para ajustar', 160, 212, '#8a8098');
  }
}

// ---------- ficha de entrenador ----------
class TrainerCard {
  constructor() { this.opaque = false; }
  update() { if (Input.pressed('a') || Input.pressed('b')) { Sound.sfx('cancel'); this.done(); } }
  draw(ctx) {
    UI.box(ctx, 20, 30, 280, 170);
    P(ctx, 24, 34, 272, 20, '#4a78d8');
    Font.draw(ctx, 'FICHA DE ENTRENADOR', 32, 39, '#ffffff');
    const spr = CharSprites.get(LOOKS.player);
    ctx.drawImage(spr, 0, 0, 16, 24, 230, 58, 48, 72);
    const rows = [['Nombre', G.name], ['Dinero', '$' + G.money], ['Códice', Object.keys(G.caught).length + ' capturados'], ['Tiempo', Game.timeStr(G.playTime)]];
    rows.forEach(([a, b], k) => { Font.draw(ctx, a, 36, 66 + k * 16, '#5a5068'); Font.draw(ctx, b, 100, 66 + k * 16, '#2a2236'); });
    Font.draw(ctx, 'MEDALLAS', 36, 140, '#5a5068');
    for (let i = 0; i < 8; i++) {
      const x = 36 + i * 30, y = 156;
      P(ctx, x - 2, y - 2, 24, 24, '#1c1824'); P(ctx, x - 1, y - 1, 22, 22, '#e8e0d0');
      if (i < 3 && G.badges[i]) ctx.drawImage(Icons.badge(i), x + 3, y + 3);
    }
  }
}

// ---------- menú de pausa del mundo ----------
class StartMenu {
  constructor() { this.i = 0; }
  items() {
    const it = [];
    if (Game.flag('got_dex')) it.push(['CÓDICE', 'dex']);
    if (G.party.length) it.push(['ÁNIMAS', 'party']);
    it.push(['MOCHILA', 'bag'], [G.name.toUpperCase(), 'card'], ['GUARDAR', 'save'], ['OPCIONES', 'opt'], ['CERRAR', 'close']);
    return it;
  }
  async pick(k) {
    this.busy = true;
    if (k === 'dex') await runScene(new DexScreen());
    else if (k === 'party') await runScene(new PartyScreen('view'));
    else if (k === 'bag') await runScene(new BagScreen('field'));
    else if (k === 'card') await runScene(new TrainerCard());
    else if (k === 'opt') await runScene(new OptionsScreen());
    else if (k === 'save') {
      const r = await ask('¿Quieres guardar la partida?');
      if (r === 0) { World.syncPos(); if (Game.save()) { Sound.sfx('save'); await say(`${G.name} guardó la partida.`); } else await say('No se pudo guardar (almacenamiento no disponible).'); }
    } else if (k === 'close') { this.done(); return; }
    this.busy = false;
    if (Scenes.has(this) && !Scenes.has(World)) this.done();
  }
  update() {
    if (this.busy) return;
    const it = this.items();
    if (Input.repeat('up')) { this.i = (this.i + it.length - 1) % it.length; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % it.length; Sound.sfx('blip'); }
    if (Input.pressed('a')) { Sound.sfx('select'); this.pick(it[this.i][1]); }
    else if (Input.pressed('b') || Input.pressed('start')) { Sound.sfx('cancel'); this.done(); }
  }
  draw(ctx) {
    const it = this.items();
    const h = it.length * 15 + 10;
    UI.box(ctx, 222, 4, 94, h);
    it.forEach(([n], k) => { Font.draw(ctx, n, 238, 11 + k * 15, '#2a2236'); if (k === this.i) UI.cursor(ctx, 228, 12 + k * 15); });
    // reloj y lugar
    const info = `${MAPS[G.map].name} · ${Events.dayName()} · ${Clock.str()}`;
    UI.box(ctx, 4, 4, Font.width(info) + 16, 20, 'dark');
    Font.draw(ctx, info, 12, 10, '#ffffff');
    const obj = Objectives.current();
    if (obj) {
      const lines = Font.wrap(obj, 280);
      const h = 18 + lines.length * 11;
      UI.box(ctx, 4, H - h - 4, 312, h, 'dark');
      Font.draw(ctx, 'Objetivo', 12, H - h + 1, '#ffd048');
      lines.forEach((ln, i) => Font.draw(ctx, ln, 12, H - h + 13 + i * 11, '#e8e0f8'));
    }
  }
}

// ---------- introducción de nombre ----------
class NameEntry {
  constructor(prompt, def = '') {
    this.prompt = prompt; this.name = def; this.opaque = true;
    this.rows = ['ABCDEFGHIJ', 'KLMNÑOPQRS', 'TUVWXYZ   ', 'abcdefghij', 'klmnñopqrs', 'tuvwxyz   ', 'áéíóú-.!?  '];
    this.cx = 0; this.cy = 0;
  }
  update() {
    // Dos modos: escribir con el teclado, o moverse por la rejilla con las flechas (Z elige, X borra)
    const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'GP_up', 'GP_down', 'GP_left', 'GP_right'];
    if (arrows.some((k) => Input.pressedKeys[k])) this.grid = true;
    const gridKeys = ['z', 'Z', 'x', 'X', ' '];
    const typed = Input.typed.filter((ch) => !(this.grid && gridKeys.includes(ch)));
    if (typed.some((ch) => ch.length === 1 && ch !== '\b' && ch !== '\n')) this.grid = false;
    for (const ch of typed) {
      if (ch === '\b') { this.name = this.name.slice(0, -1); Sound.sfx('cancel'); }
      else if (ch === '\n') { /* gestionado abajo */ }
      else if (ch.length === 1 && this.name.length < 10 && /[\wáéíóúñÁÉÍÓÚÑ\-.!? ]/.test(ch)) { this.name += ch; Sound.sfx('blip'); }
    }
    if (Input.repeat('left') && this.grid) { this.cx = (this.cx + 10) % 11; Sound.sfx('blip'); }
    if (Input.repeat('right') && this.grid) { this.cx = (this.cx + 1) % 11; Sound.sfx('blip'); }
    if (Input.repeat('up') && this.grid) { this.cy = (this.cy + 7) % 8; Sound.sfx('blip'); }
    if (Input.repeat('down') && this.grid) { this.cy = (this.cy + 1) % 8; Sound.sfx('blip'); }
    if (Input.pressedKeys['Enter'] || Input.pressedKeys['GP_start']) { this.finish(); return; }
    if (!this.grid && !Input.pressedKeys['GP_a'] && !Input.pressedKeys['GP_b']) return;
    if (Input.pressedKeys['KeyZ'] || Input.pressedKeys['Space'] || Input.pressedKeys['GP_a']) {
      if (this.cy === 7) { this.finish(); return; }
      if (this.cx === 10) { this.name = this.name.slice(0, -1); Sound.sfx('cancel'); return; }
      const ch = this.rows[this.cy][this.cx];
      if (ch && ch !== ' ' && this.name.length < 10) { this.name += ch; Sound.sfx('blip'); }
    }
    if (Input.pressedKeys['KeyX'] || Input.pressedKeys['GP_b']) { this.name = this.name.slice(0, -1); Sound.sfx('cancel'); }
  }
  finish() {
    const n = this.name.trim();
    if (!n) { Sound.sfx('bump'); return; }
    Sound.sfx('select'); this.done(n);
  }
  draw(ctx) {
    screenBg(ctx, '#e8e0f0', '#e0d6ec');
    UI.box(ctx, 10, 8, 300, 40);
    Font.draw(ctx, this.prompt, 20, 16, '#2a2236');
    Font.draw(ctx, this.name + (Math.floor(Engine.time * 2) % 2 ? '_' : ''), 20, 30, '#2a2236');
    UI.box(ctx, 10, 54, 300, 178);
    this.rows.forEach((r, y) => {
      for (let x = 0; x < 10; x++) {
        const ch = r[x]; const px = 30 + x * 24, py = 64 + y * 18;
        if (ch !== ' ') Font.draw(ctx, ch, px, py, '#2a2236');
        if (this.cx === x && this.cy === y) UI.cursor(ctx, px - 9, py + 1);
      }
      if (y === 0) { Font.draw(ctx, 'BORRAR', 262, 64, '#c04040'); }
    });
    if (this.cx === 10 && this.cy < 7) UI.cursor(ctx, 253, 65 + 0);
    Font.draw(ctx, 'TERMINAR', 30, 64 + 7 * 18 + 4, '#2a8a40');
    if (this.cy === 7) UI.cursor(ctx, 21, 64 + 7 * 18 + 5);
    Font.draw(ctx, 'Escribe con el teclado, o usa flechas + Z/X. Intro: aceptar.', 20, 218, '#8a8098');
  }
}

// ---------- pantalla de título ----------
class TitleScreen {
  constructor() { this.opaque = true; this.t = 0; this.i = 0; this.menu = false; }
  enter() { Sound.music('title'); this.hasSave = Game.hasSave(); this.sum = Game.saveSummary(); }
  options() { return (this.hasSave ? ['CONTINUAR'] : []).concat(['NUEVA PARTIDA', 'OPCIONES']); }
  async pick() {
    const o = this.options()[this.i];
    this.busy = true;
    if (o === 'OPCIONES') { await runScene(new OptionsScreen()); this.busy = false; return; }
    if (o === 'NUEVA PARTIDA' && this.hasSave) {
      const r = await ask('Ya existe una partida guardada. Si empiezas otra y guardas, se sobrescribirá. ¿Continuar?', ['Sí', 'No']);
      if (r !== 0) { this.busy = false; return; }
    }
    if (o === 'CONTINUAR' && !Game.load()) {
      await say('No se ha podido cargar la partida guardada. Puede que esté dañada.');
      this.hasSave = false; this.sum = null; this.i = 0; this.busy = false; return;
    }
    await Fade.out(0.5);
    Scenes.pop(this);
    if (o === 'CONTINUAR') World.start();
    else Story.newGame();
  }
  update(dt) {
    this.t += dt;
    if (this.busy) return;
    if (!this.menu) { if (Input.pressed('a') || Input.pressed('start')) { this.menu = true; Sound.sfx('select'); } return; }
    const n = this.options().length;
    if (Input.repeat('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
    if (Input.pressed('a')) { Sound.sfx('select'); this.pick(); }
    if (Input.pressed('b')) { this.menu = false; }
  }
  draw(ctx) {
    // cielo de amanecer
    const sky = ['#2a1e50', '#5a3a78', '#a85a80', '#e88a70', '#f8c080'];
    for (let i = 0; i < 5; i++) P(ctx, 0, i * 28, W, i === 4 ? 80 : 28, sky[i]);
    P(ctx, W / 2 - 30, 112, 60, 30, '#fff0b0'); P(ctx, W / 2 - 20, 104, 40, 8, '#fff0b0'); P(ctx, W / 2 - 10, 100, 20, 4, '#fff0b0');
    // montañas en paralaje
    const t = this.t;
    const hills = (col, base, amp, sp, freq) => { ctx.fillStyle = col; for (let x = 0; x < W; x++) { const y = base + Math.sin((x + t * sp) * freq) * amp + Math.sin((x + t * sp) * freq * 2.3) * amp * 0.4; ctx.fillRect(x, y, 1, H - y); } };
    hills('#7a5a90', 130, 14, 8, 0.02); hills('#4a6a70', 150, 10, 16, 0.03); hills('#3a8a50', 172, 6, 30, 0.05);
    P(ctx, 0, 190, W, 50, '#2e6a3a');
    for (let x = 0; x < W + 16; x += 16) ctx.drawImage(Tiles.get('tallgrass', Math.floor(t * 3 + x / 16) % 2), (x - (t * 40) % 16), 190);
    // criaturas desfilando
    const parade = ['ignito', 'burbujo', 'semillin', 'voltin', 'rabin', 'umbrin'];
    parade.forEach((k, i) => {
      const x = ((i * 60 + t * 36) % (W + 80)) - 50;
      const bob = Math.abs(Math.sin(t * 6 + i)) * 4;
      drawShadow(ctx, x + 20, 206, 10, 2, 0.3);
      CreatureAnim.portrait(ctx, k, 40, false, x, 168, 'parade' + k, { flip: true, speed: 70 });
    });
    // logotipo
    if (!this.logo) {
      const lw = Font.width('ÁNIMA') + 3;
      const [c, x] = U.makeCanvas(lw, 14);
      Font.draw(x, 'ÁNIMA', 1, 3, '#7a2a10'); Font.draw(x, 'ÁNIMA', 0, 2, '#ffd048');
      this.logo = c; this.logoW = lw;
    }
    const ly = 18 + Math.sin(t * 2) * 2, LS = 4;
    ctx.globalAlpha = 0.35; ctx.drawImage(this.logo, 0, 0, this.logoW, 14, (W / 2) - (this.logoW * LS) / 2 + 3, ly + 3, this.logoW * LS, 14 * LS); ctx.globalAlpha = 1;
    ctx.drawImage(this.logo, 0, 0, this.logoW, 14, (W / 2) - (this.logoW * LS) / 2, ly, this.logoW * LS, 14 * LS);
    Font.drawOutlined(ctx, 'REGIÓN ALBA', (W / 2) - Font.width('REGIÓN ALBA') / 2, ly + 56, '#ffffff', '#3a2050');
    if (!this.menu) {
      if (Math.floor(t * 2) % 2) Font.drawOutlined(ctx, 'PULSA Z O INTRO', (W / 2) - Font.width('PULSA Z O INTRO') / 2, 120, '#fff8e0', '#3a2050');
    } else {
      const o = this.options();
      UI.box(ctx, W / 2 - 60, 98, 120, o.length * 15 + 10);
      o.forEach((s, k) => { Font.draw(ctx, s, W / 2 - 42, 105 + k * 15, '#2a2236'); if (k === this.i) UI.cursor(ctx, W / 2 - 52, 106 + k * 15); });
      if (this.sum && o[this.i] === 'CONTINUAR') {
        UI.box(ctx, W / 2 + 70, 98, 86, 58, 'dark');
        Font.draw(ctx, this.sum.name, W / 2 + 76, 104, '#ffffff'); Font.draw(ctx, 'Medallas: ' + this.sum.badges, W / 2 + 76, 116, '#d0c8e0');
        Font.draw(ctx, 'Códice: ' + this.sum.dex, W / 2 + 76, 128, '#d0c8e0'); Font.draw(ctx, Game.timeStr(this.sum.time), W / 2 + 76, 140, '#d0c8e0');
      }
    }
    Font.draw(ctx, 'Un juego original · v1.0', 4, 230, '#c8f0c8');
  }
}
