'use strict';
// ============================================================
//  EQUIPAMIENTO: iconos, pantalla y tarjeta de botín
//  - Cada forma de pieza tiene su icono (24 en total); el metal sale
//    del material y la gema del color de la rareza.
//  - Épicas y superiores brillan; legendarias y divinas con destello.
// ============================================================
// o contorno · M/m/d metal claro/medio/oscuro · w brillo · G/g/h gema · L/l/k tela
const GEAR_ICON_ROWS = {
  brazalete: [
    ['..oooooooo..', '.oMMMmmmmdo.', 'oMmoooooodmo', 'omo......odo', 'omo......odo', 'oMmoooooodmo', '.omgGmmmddo.', '..oooooooo..'],
    ['.oooooooo.', 'oMMMmmmmdo', 'oMwmmmmddo', '.oMmgGmdo.', '.oMmhgmdo.', '.oMmmmmdo.', '..oMmmdo..', '..oMmmdo..', '..oMddddo.', '..oooooo..'],
    ['..oooooooo..', '.oLLLLlllko.', '.oMMmmmmmdo.', '.oLLlgGllko.', '.oLLllllkko.', '.oMMmmmmmdo.', '.oLLLlllkko.', '..oooooooo..'],
    ['.o.o.o.....', 'oMoMoMo....', 'oMoMoMoo...', 'omMmMmMmo..', 'omMmmmmMdo.', '.omMgGmmdo.', '..omhgmdo..', '..oMmmmdo..', '..oMMmmdo..', '..oooooo...'],
  ],
  anillo: [
    ['....oooo....', '...oGggho...', '...ogggho...', '....ohho....', '..oMmoomdo..', '.oMo....odo.', '.om......do.', '.om......do.', '.oMo....odo.', '..oMmmmmdo..', '...oooooo...'],
    ['.....oo.....', '....oGgo....', '...oGgggo...', '..oGwgggho..', '...ohhhho...', '....oMdo....', '..oMmoomdo..', '.oMo....odo.', '.om......do.', '.oMo....odo.', '..oMmmmmdo..', '...oooooo...'],
    ['..oooooooo..', '..oMMMMMMo..', '..oMmggmdo..', '..oMmGgmdo..', '..oddddddo..', '..oMmoomdo..', '.oMo....odo.', '.om......do.', '.oMo....odo.', '..oMmmmmdo..', '...oooooo...'],
    ['.oooo..oooo.', 'oMmmdooMmmdo', 'oMo.oMdo.odo', 'om..ogGo..do', 'om..oMdo..do', 'oMo.oMdo.odo', 'oMmmdooMmmdo', '.oooo..oooo.'],
  ],
  colgante: [
    ['d..........d', '.d........d.', '..m......m..', '...m....m...', '....mooom...', '....oGgo....', '...oGgggo...', '...ogggho...', '....ohho....', '.....oo.....'],
    ['l..........l', '.l........l.', '..l......l..', '...l....l...', '....gMMg....', '....oMMo....', '....oMmo....', '....omdo....', '.....omo....', '.....oo.....'],
    ['..d......d..', '...d....d...', '....d..d....', '....oooo....', '..ooMMmmoo..', '.oMMmggmmdo.', '.oMmgGGgmdo.', '.oMmgGggmdo.', '.oMmmggmmdo.', '..odmmmmdo..', '...oooooo...'],
    ['..d......d..', '...d....d...', '....d..d....', '.....oo.....', '....oMMo....', '...oMMmdo...', '..oMmgGmdo..', '..oddddddo..', '..oMmhgmdo..', '...oMmmdo...', '....oddo....', '.....oo.....'],
  ],
  botas: [
    ['..oooooo....', '..oLLLlko...', '..oMMmmdo...', '..oLLLlko...', '..oLLLlko...', '..oLLLlko...', '..oLLLllkoo.', '.oLLLLlllkko', '.oLLLLllllko', '.oddddddddo.', '..oooooooo..'],
    ['..oooooo....', '..oMMmmdo...', '..oMgGmdo...', '..oMmmmdo...', '..oMMmmdo...', '..oMmmmdo...', '..oMmmmddoo.', '.oMMmmmmmddo', '.oMmmmmmmmdo', '.oooooooooo.'],
    ['....o.......', '...oLo......', '...oLko.....', '..oLlkko....', '..oMgGmo....', '..oLLlkko...', '.oL..l..ko..', '.oLLLLlllkko', '.oddddddddo.', '..oooooooo..'],
    ['o...........', 'oMo.........', '.oMo........', '.oMMo.......', '..oMMooooo..', '..oolLLlko..', '...oLLLlko..', '..oLLLLllkoo', '.oLLLLLllkko', '.oddddddddo.', '..oooooooo..'],
  ],
  emblema: [
    ['oooooooooooo', 'oMMMMMmmmmdo', 'oMmmmggmmmdo', 'oMmmgGGgmmdo', 'oMmmggggmmdo', '.oMmmggmmdo.', '.oMmmmmmmdo.', '..oMmmmmdo..', '...oMmmdo...', '....oddo....', '.....oo.....'],
    ['.....oo.....', '....oMdo....', '....oMdo....', 'oooooMmooooo', 'oMMMMggmmmdo', '.oMmgGGgmdo.', '..oMggggdo..', '..oMmggmdo..', '.oMmdooMmdo.', '.oMdo..oMdo.', '.ooo....ooo.'],
    ['...oooooo...', '..oMMMmmdo..', '.oMMmmmmmdo.', 'oMMmmggmmmdo', 'oMmmgGGgmmdo', 'oMmmggggmmdo', 'oMmmmggmmmdo', '.oMmmmmmmdo.', '..odmmmmdo..', '...oooooo...'],
    ['...oooooo...', '..oMMMmmdo..', '.oMmggggmdo.', 'oMmgGGgghmdo', 'oMmggggghmdo', '.oMmghhhmdo.', '..oMmmmmdo..', '...oooooo...', '.dddddddddd.'],
  ],
  talisman: [
    ['.....oo.....', '....oMdo....', '...oMggdo...', '..oMgGGgdo..', '.oMmgGggmdo.', '..oMggggdo..', '...oMhhdo...', '....oMdo....', '.....oo.....', '.....ll.....', '....lLLk....', '....lLkk....'],
    ['..oooooooo..', '.oMMMmmmmdo.', '.oMmmggmmdo.', '.oMmmgmmmdo.', '.oMmmgggmdo.', '.oMmmgmmmdo.', '.oMmmgmmmdo.', '.oMmmmmmmdo.', '.oddddddddo.', '..oooooooo..'],
    ['...oooooo...', '..oGwGgggo..', '.oGwGgggggo.', '.oGGgggggho.', '.ogggggghho.', '..ogggghho..', '...oohhoo...', '..oMMmmmdo..', '.oMmmmmmmdo.', '.oooooooooo.'],
    ['...oooooo...', '..oMMmmmdo..', '..oMgomgdo..', '..oMmmmmdo..', '..oMoooodo..', '...oMmmdo...', '.ooMMmmmdoo.', '.oMmgGgmmdo.', '..oMmmmmdo..', '..oMmmmmdo..', '..oooooooo..'],
  ],
};
const GearIcons = {
  cache: {},
  // icono de una pieza (12x12, centrado)
  of(it) { return this.get(it.slot, it.rar, (it.f !== undefined ? it.f : it.id) % 4, Gear.mat(it)); },
  get(slotK, rar, form = 0, mat = null) {
    mat = mat || GEAR_MATS[rar][0];
    const key = slotK + rar + form + mat[2];
    if (this.cache[key]) return this.cache[key];
    const rows = GEAR_ICON_ROWS[slotK][form % GEAR_ICON_ROWS[slotK].length];
    const w = Math.max(...rows.map((r) => r.length)), h = rows.length;
    const [c, x] = U.makeCanvas(12, 12), ox = Math.floor((12 - w) / 2), oy = Math.floor((12 - h) / 2);
    const gem = rar === 0 ? '#9a94a8' : RARITY[rar].color, cloth = GEAR_CLOTH[rar];
    const pal = { o: '#1a1422', M: mat[1], m: mat[2], d: mat[3], w: '#ffffff', G: U.shade(gem, 0.35), g: gem, h: U.shade(gem, -0.3), L: U.shade(cloth, 0.25), l: cloth, k: U.shade(cloth, -0.3) };
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (pal[r[i]]) { x.fillStyle = pal[r[i]]; x.fillRect(ox + i, oy + j, 1, 1); } });
    return (this.cache[key] = c);
  },
  // icono de ranura vacía (silueta)
  empty(slotK) {
    const key = 'e' + slotK; if (this.cache[key]) return this.cache[key];
    const rows = GEAR_ICON_ROWS[slotK][0], w = Math.max(...rows.map((r) => r.length)), h = rows.length;
    const [c, x] = U.makeCanvas(12, 12), ox = Math.floor((12 - w) / 2), oy = Math.floor((12 - h) / 2);
    x.fillStyle = '#3a3252';
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') x.fillRect(ox + i, oy + j, 1, 1); });
    return (this.cache[key] = c);
  },
  // casilla con marco de rareza, brillo y destello
  frame(ctx, it, x, y, s = 18, t = 0, sel = false, slotK = null) {
    const col = it ? RARITY[it.rar].color : '#5a5078';
    if (it && it.rar >= 3) { ctx.globalAlpha = 0.18 + 0.1 * Math.sin(t * 3 + x); P(ctx, x - 2, y - 2, s + 4, s + 4, col); ctx.globalAlpha = 1; }
    P(ctx, x, y, s, s, sel ? '#ffe060' : '#0c0a16');
    P(ctx, x + 1, y + 1, s - 2, s - 2, it ? U.mix(col, '#14101e', 0.55) : '#1e1830');
    P(ctx, x + 1, y + 1, s - 2, Math.floor((s - 2) / 2), it ? U.mix(col, '#14101e', 0.42) : '#241e38');
    P(ctx, x + 1, y + s - 2, s - 2, 1, it ? U.mix(col, '#000000', 0.4) : '#141020');
    if (it) { P(ctx, x + 1, y + 1, 2, 1, col); P(ctx, x + 1, y + 1, 1, 2, col); P(ctx, x + s - 3, y + s - 2, 2, 1, col); P(ctx, x + s - 2, y + s - 3, 1, 2, col); }
    const ix = x + Math.floor((s - 12) / 2), iy = y + Math.floor((s - 12) / 2);
    if (it) ctx.drawImage(this.of(it), ix, iy); else if (slotK) ctx.drawImage(this.empty(slotK), ix, iy);
    if (it && it.rar >= 4) this.twinkle(ctx, x, y, s, t, it.rar === 5 ? '#ffd0d0' : '#fff4c0');
  },
  twinkle(ctx, x, y, s, t, col) {
    const k = Math.floor(t * 2.5), ph = (t * 2.5) % 1, seed = (k * 37 + x * 13 + y * 7) % 97;
    const px = x + 2 + (seed % (s - 4)), py = y + 2 + ((seed * 5) % (s - 4)), r = ph < 0.5 ? Math.round(ph * 4) : Math.round((1 - ph) * 4);
    ctx.globalAlpha = 0.9;
    P(ctx, px - r, py, r * 2 + 1, 1, col); P(ctx, px, py - r, 1, r * 2 + 1, col); P(ctx, px, py, 1, 1, '#ffffff');
    ctx.globalAlpha = 1;
  },
  // gemita de rareza (5x5)
  gem(ctx, rar, x, y) {
    const c = RARITY[rar].color;
    P(ctx, x + 1, y, 3, 5, '#14101e'); P(ctx, x, y + 1, 5, 3, '#14101e');
    P(ctx, x + 1, y + 1, 3, 3, c); P(ctx, x + 1, y + 1, 1, 1, U.shade(c, 0.5)); P(ctx, x + 3, y + 3, 1, 1, U.shade(c, -0.3));
  },
  // icono de fragmento (cristal)
  shard(ctx, x, y) {
    P(ctx, x + 2, y, 3, 1, '#1a1422'); P(ctx, x + 1, y + 1, 5, 6, '#1a1422'); P(ctx, x + 2, y + 7, 3, 1, '#1a1422');
    P(ctx, x + 2, y + 1, 3, 6, '#b080f0'); P(ctx, x + 2, y + 1, 1, 5, '#e8d0ff'); P(ctx, x + 4, y + 3, 1, 4, '#7040b0');
  },
};

// mini iconos de estadística (5x5) para las listas de bonus
const STAT_ICON = {
  atk: ['....o', '...o.', 'o.o..', '.o...', 'o.o..'], esp: ['.o.o.', 'ooooo', '.ooo.', 'ooooo', '.o.o.'], def: ['ooooo', 'ooooo', 'ooooo', '.ooo.', '..o..'],
  hp: ['oo.oo', 'ooooo', 'ooooo', '.ooo.', '..o..'], vel: ['o.o..', '.o.o.', '..o.o', '.o.o.', 'o.o..'], crit: ['o...o', '.o.o.', '..o..', '.o.o.', 'o...o'],
  cd: ['ooooo', '.ooo.', '..o..', '.ooo.', 'ooooo'], syn: ['..o..', '.ooo.', 'ooooo', '.ooo.', '..o..'], tipo: ['.o...', '.oo..', 'ooooo', '..oo.', '...o.'],
  exp: ['..o..', '.ooo.', 'o.o.o', '..o..', '..o..'], botin: ['.ooo.', 'o...o', 'ooooo', 'ooooo', '.ooo.'],
};
const STAT_COL = { atk: '#ff8a6a', esp: '#c090ff', def: '#e0b060', hp: '#80e080', vel: '#80d0ff', crit: '#ffe060', cd: '#a0e8ff', syn: '#ff90d0', tipo: '#ffffff', exp: '#a0ffc0', botin: '#ffd048' };
function drawStatIcon(ctx, k, x, y, col) {
  const rows = STAT_ICON[k]; if (!rows) return;
  ctx.fillStyle = col || STAT_COL[k];
  rows.forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === 'o') ctx.fillRect(x + i, y + j, 1, 1); });
}

// panel oscuro con borde biselado y título
function gearPanel(ctx, x, y, w, h, title, accent = '#5a5078') {
  P(ctx, x, y, w, h, '#0c0a16');
  P(ctx, x + 1, y + 1, w - 2, h - 2, '#1a1530');
  P(ctx, x + 1, y + 1, w - 2, 1, '#2c2648');
  P(ctx, x + 1, y + h - 2, w - 2, 1, '#120e20');
  if (title) {
    P(ctx, x + 1, y + 1, w - 2, 11, U.mix(accent, '#1a1530', 0.6));
    P(ctx, x + 1, y + 12, w - 2, 1, accent);
    Font.draw(ctx, title, x + 5, y + 2, '#ffffff', '#0c0a16');
  }
}

// ---------- tarjeta de botín (aparece al conseguir una pieza) ----------
class LootPopup {
  constructor(it, note) { this.it = it; this.note = note; this.t = 0; this.wide = true; this.parts = []; }
  update(dt) {
    this.t += dt;
    const R = this.it.rar;
    if (R >= 2 && Math.random() < dt * (8 + R * 6)) this.parts.push({ x: W / 2 + U.rand(-30, 30), y: 120, vy: -U.rand(20, 60), life: 1 });
    for (const p of this.parts) { p.y += p.vy * dt; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
    const min = 0.5, dur = R >= 3 ? 3.2 : 2.2;
    if ((this.t > min && (Input.pressed('a') || Input.pressed('b') || Input.mouse.pressed[0])) || this.t > dur) { Input.mouse.pressed = {}; this.done(); }
  }
  draw(ctx) {
    const it = this.it, Rr = RARITY[it.rar], t = this.t, cx = Math.round(W / 2);
    const k = Math.min(1, t / 0.25), e = 1 - Math.pow(1 - k, 3);
    ctx.globalAlpha = 0.45 * e; P(ctx, 0, 0, W, H, '#05030c'); ctx.globalAlpha = 1;
    // haz de luz de la rareza
    if (it.rar >= 2) {
      const bw = 10 + it.rar * 6 + Math.sin(t * 6) * 2;
      for (let i = 0; i < 4; i++) { ctx.globalAlpha = (0.08 + i * 0.05) * e; P(ctx, Math.round(cx - bw / 2 + i * bw / 8), 0, Math.round(bw - i * bw / 4), 150, i === 3 ? '#ffffff' : Rr.color); }
      ctx.globalAlpha = 1;
      for (const p of this.parts) { ctx.globalAlpha = Math.min(1, p.life); P(ctx, Math.round(p.x), Math.round(p.y), 1, 2, U.shade(Rr.color, 0.4)); }
      ctx.globalAlpha = 1;
    }
    // rayos giratorios para épicas o mejores
    if (it.rar >= 3) {
      ctx.save(); ctx.translate(cx, 92); ctx.rotate(t * 0.6); ctx.globalAlpha = 0.18 * e; ctx.fillStyle = Rr.color;
      for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-6, -60); ctx.lineTo(6, -60); ctx.fill(); }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    const y = Math.round(78 + (1 - e) * 20);
    const bob = Math.round(Math.sin(t * 3) * 1.5);
    GearIcons.frame(ctx, it, cx - 12, y + bob, 24, t);
    // tarjeta
    const name = Gear.name(it), w = Math.max(150, Font.width(name) + 24), bx = Math.round(cx - w / 2), by = y + 30;
    ctx.globalAlpha = e;
    P(ctx, bx, by, w, 46, '#0c0a16'); P(ctx, bx + 1, by + 1, w - 2, 44, '#1a1530');
    P(ctx, bx + 1, by + 1, w - 2, 2, Rr.color); P(ctx, bx + 1, by + 3, w - 2, 1, U.shade(Rr.color, -0.4));
    Font.drawCenter(ctx, '¡BOTÍN!', cx, y - 13, '#ffffff', '#0c0a16');
    Font.drawCenter(ctx, name, cx, by + 7, Rr.color);
    GearIcons.gem(ctx, it.rar, Math.round(cx - Font.width(`${Rr.name} · Nv ${it.lv}`) / 2 - 9), by + 20);
    Font.drawCenter(ctx, `${Rr.name} · Nv ${it.lv}`, cx, by + 18, '#c8c0e0');
    const u = Gear.uniqueOf(it);
    Font.drawCenter(ctx, this.note || (u ? '★ ' + u.name.replace(/^(de la |del |de )/, '') : Gear.affText(it.base)), cx, by + 31, this.note ? '#ffb0a0' : u ? Rr.color : '#e8e0f8');
    ctx.globalAlpha = 1;
  }
}

// el anuncio de botín usa la tarjeta
Gear.announce = async function (it) {
  const kept = this.add(it), r = RARITY[it.rar];
  Sound.jingle('item');
  if (it.rar >= 3) Sound.sfx('super');
  await runScene(new LootPopup(it, kept ? null : `Mochila llena: +${r.frag} fragmentos`));
  if (!G.flags.gear_tut) G.flags.gear_tut_pending = true;
};

// ---------- pantalla de equipamiento ----------
// casillas alrededor del entrenador: izquierda (brazalete, anillo, colgante) y derecha (botas, emblema, talismán)
const GEAR_SOCKETS = [[20, 32], [20, 70], [20, 108], [104, 32], [104, 70], [104, 108]];
class GearScreen {
  constructor() { this.opaque = true; this.wide = true; this.mode = 'slots'; this.si = 0; this.li = 0; this.scroll = 0; this.t = 0; this.busy = false; this.fx = []; }
  list() {
    const S = Gear.state(), k = GEAR_SLOTS[this.si].k;
    const l = S.bag.filter((it) => it.slot === k).sort((a, b) => b.rar - a.rar || Gear.score(b) - Gear.score(a));
    return S.eq[k] ? [null].concat(l) : l; // null = quitar
  }
  focusItem() {
    const S = Gear.state();
    if (this.mode === 'slots') return S.eq[GEAR_SLOTS[this.si].k] || null;
    return this.list()[this.li] || null;
  }
  pulse(k) { const [x, y] = GEAR_SOCKETS[k]; this.fx.push({ x: x + 12, y: y + 12, t: 0, col: '#ffffff' }); }
  async act() {
    const S = Gear.state(), l = this.list(), it = l[this.li], k = GEAR_SLOTS[this.si].k;
    if (it === undefined) return;
    if (it === null) { Gear.unequip(k); Sound.sfx('select'); this.li = 0; return; }
    this.busy = true;
    const R = RARITY[it.rar];
    const r = await choose(['Equipar', `Reforjar (${R.reforge} frag.)`, `Desmontar (+${R.frag} frag.)`, 'Cancelar'], { x: 180, y: 100, w: 130 });
    if (r === 0) { Gear.equip(it); Sound.sfx('select'); this.pulse(this.si); this.fx.push({ x: 66, y: 76, t: 0, col: R.color, big: true }); this.mode = 'slots'; }
    else if (r === 1) {
      if (!R.affixes) await say('Las piezas comunes no tienen efectos que reforjar.');
      else if (S.frag < R.reforge) await say(`Necesitas ${R.reforge} fragmentos (tienes ${S.frag}).`);
      else { S.frag -= R.reforge; Gear.rerollAffixes(it); Sound.sfx('heal'); this.reforged = { id: it.id, t: 0 }; }
    } else if (r === 2) {
      const ok = it.rar < 3 || (await ask(`¿Desmontar ${Gear.name(it)} (${R.name})?`)) === 0;
      if (ok) { Gear.salvage(it); Sound.sfx('cancel'); this.fragFx = 0; this.li = Math.max(0, Math.min(this.li, this.list().length - 1)); }
    }
    this.busy = false;
  }
  update(dt) {
    this.t += dt;
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < 0.6);
    if (this.reforged) this.reforged.t += dt;
    if (this.fragFx !== undefined) { this.fragFx += dt; if (this.fragFx > 0.8) this.fragFx = undefined; }
    if (this.busy) return;
    const M = Input.mouse;
    if (this.mode === 'slots') {
      const col = this.si >= 3 ? 1 : 0, row = this.si % 3;
      if (Input.repeat('up')) { this.si = col * 3 + (row + 2) % 3; Sound.sfx('blip'); }
      if (Input.repeat('down')) { this.si = col * 3 + (row + 1) % 3; Sound.sfx('blip'); }
      if (Input.repeat('left') && col === 1) { this.si -= 3; Sound.sfx('blip'); }
      let overSock = -1;
      if (M.inside) GEAR_SOCKETS.forEach(([x, y], k) => { if (M.x >= x - 2 && M.x < x + 26 && M.y >= y - 2 && M.y < y + 34) overSock = k; });
      if (overSock >= 0 && (M.moved || M.pressed[0])) this.si = overSock;
      const toList = Input.pressed('a') || (Input.pressed('right') && col === 1) || (M.pressed[0] && (overSock >= 0 || M.x >= 150));
      if (toList) {
        if (this.list().length) { this.mode = 'list'; this.li = 0; this.scroll = 0; Sound.sfx('select'); } else Sound.sfx('bump');
      } else if (Input.repeat('right') && col === 0) { this.si += 3; Sound.sfx('blip'); }
      else if (Input.pressed('b') || M.pressed[2]) { Sound.sfx('cancel'); this.done(); }
      return;
    }
    const l = this.list();
    if (!l.length) { this.mode = 'slots'; return; }
    if (Input.repeat('up')) { this.li = (this.li + l.length - 1) % l.length; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.li = (this.li + 1) % l.length; Sound.sfx('blip'); }
    if (M.wheel) { this.li = U.clamp(this.li + Math.sign(M.wheel), 0, l.length - 1); M.wheel = 0; }
    let over = -1;
    if (M.inside && M.x >= 150 && M.x < 420) for (let k = 0; k < 7; k++) if (M.y >= 34 + k * 15 && M.y < 49 + k * 15 && this.scroll + k < l.length) over = this.scroll + k;
    if (over >= 0 && (M.moved || M.pressed[0])) this.li = over;
    if (this.li < this.scroll) this.scroll = this.li; if (this.li >= this.scroll + 7) this.scroll = this.li - 6;
    if (Input.pressed('a') || (M.pressed[0] && over >= 0)) { this.act(); return; }
    if (Input.pressed('b') || Input.pressed('left') || M.pressed[2] || (M.pressed[0] && M.x < 146)) { this.mode = 'slots'; Sound.sfx('cancel'); }
  }
  // ---------- dibujo ----------
  drawBg(ctx) {
    P(ctx, 0, 0, W, H, '#120e22');
    // rombos tenues que se desplazan
    const o = (this.t * 6) % 24;
    ctx.fillStyle = '#18132c';
    for (let y = -24; y < H + 24; y += 24) for (let x = -24; x < W + 24; x += 24) {
      const px = Math.round(x + o), py = Math.round(y + o / 2);
      ctx.fillRect(px + 5, py, 2, 1); ctx.fillRect(px + 4, py + 1, 4, 1); ctx.fillRect(px + 5, py + 2, 2, 1);
    }
  }
  drawHeader(ctx) {
    const S = Gear.state();
    P(ctx, 0, 0, W, 20, '#0a0814'); P(ctx, 0, 20, W, 1, '#3a3260'); P(ctx, 0, 21, W, 1, '#0a0814');
    ctx.drawImage(GearIcons.get('emblema', 4, 0), 6, 4);
    Font.draw(ctx, 'EQUIPAMIENTO', 22, 6, '#ffffff', '#3a2a60');
    Font.draw(ctx, 'Afecta a todas tus ánimas', 100, 6, '#7a72a0');
    const fx = this.fragFx !== undefined ? Math.round(Math.sin(this.fragFx * 20) * 2) : 0;
    const ft = String(S.frag);
    Font.drawRight(ctx, ft, W - 8, 6 + fx, '#e0c8ff');
    GearIcons.shard(ctx, W - 18 - Font.width(ft), 5 + fx);
    const bt = `${S.bag.length}/${GEAR_BAG_MAX}`;
    Font.drawRight(ctx, bt, W - 32 - Font.width(ft), 6, S.bag.length >= GEAR_BAG_MAX ? '#ff8070' : '#8a80a8');
  }
  drawDoll(ctx) {
    const S = Gear.state();
    gearPanel(ctx, 4, 24, 140, 128, null);
    // pedestal con anillo de luz
    const t = this.t;
    ctx.globalAlpha = 0.25; pixCircle(ctx, 74, 112, 22, '#6a5ab0'); ctx.globalAlpha = 1;
    for (let y = -4; y <= 4; y++) { const w = Math.round(28 * Math.sqrt(1 - (y * y) / 20)); P(ctx, 74 - w, 132 + y, w * 2, 1, y < 0 ? '#2a2448' : '#201a3a'); }
    P(ctx, 46, 132, 56, 1, '#4a4078');
    // aura según la mejor rareza equipada
    let best = -1; for (const sl of GEAR_SLOTS) if (S.eq[sl.k]) best = Math.max(best, S.eq[sl.k].rar);
    if (best >= 2) { ctx.globalAlpha = 0.12 + 0.06 * Math.sin(t * 2); pixCircle(ctx, 74, 98, 30, RARITY[best].color); ctx.globalAlpha = 1; }
    const spr = HiChar.get(LOOKS.player), bob = Math.round(Math.sin(t * 2) * 1);
    drawShadow(ctx, 74, 131, 12, 3, 0.4);
    ctx.drawImage(spr, 0, 0, 32, 48, 58, 82 + bob, 32, 48);
    // casillas
    GEAR_SOCKETS.forEach(([x, y], k) => {
      const sl = GEAR_SLOTS[k], it = S.eq[sl.k], sel = k === this.si;
      // hilo de luz hasta el entrenador
      const lx = k < 3 ? x + 24 : x - 1, tx = k < 3 ? 58 : 90, ly = y + 12;
      const lc = it ? U.mix(RARITY[it.rar].color, '#1a1530', 0.5) : '#2a2448';
      P(ctx, Math.min(lx, tx), ly, Math.abs(tx - lx), 1, lc);
      if (sel) { const k2 = 2 + Math.round(Math.sin(t * 8)); ctx.globalAlpha = 0.5; P(ctx, x - k2, y - k2, 24 + k2 * 2, 24 + k2 * 2, '#ffe060'); ctx.globalAlpha = 1; }
      GearIcons.frame(ctx, it, x, y, 24, t + k, sel, sl.k);
      Font.drawCenter(ctx, sl.name, x + 12, y + 25, sel ? '#ffe080' : '#8a80a8');
    });
    for (const f of this.fx) { ctx.globalAlpha = 1 - f.t / 0.6; pixRing(ctx, f.x, f.y, (f.big ? 10 : 4) + f.t * (f.big ? 60 : 30), f.col, 1); ctx.globalAlpha = 1; }
  }
  drawTotals(ctx) {
    const t = Gear.totals();
    gearPanel(ctx, 4, 156, 140, 80, 'Bonus total', '#c09030');
    const rows = [];
    for (const k of Object.keys(GEAR_STATS)) if (k !== 'tipo' && t[k]) rows.push([k, GEAR_STATS[k].s, t[k], t[k] >= GEAR_STATS[k].cap]);
    for (const ty in t.tipo) rows.push(['tipo', TYPES[ty].short, t.tipo[ty], t.tipo[ty] >= GEAR_STATS.tipo.cap, TYPES[ty].color]);
    if (!rows.length) Font.drawCenter(ctx, 'Sin equipamiento', 74, 186, '#6a6288');
    rows.slice(0, 12).forEach(([k, lab, v, cap, tc], i) => {
      const x = 9 + (i >= 6 ? 68 : 0), y = 171 + (i % 6) * 9;
      drawStatIcon(ctx, k, x, y + 2, tc);
      Font.draw(ctx, lab, x + 8, y, '#c8c0e0');
      Font.drawRight(ctx, (GEAR_STATS[k].neg ? '−' : '+') + v + '%', x + 63, y, cap ? '#ffd048' : '#ffffff');
    });
    const us = Object.keys(t.uniq);
    if (us.length) {
      const all = GEAR_UNIQUE[4].concat(GEAR_UNIQUE[5]);
      const s = '★ ' + us.map((u) => (all.find((x) => x.k === u) || { name: u }).name.replace(/^(de la |del |de )/, '')).join(', ');
      let txt = s; while (Font.width(txt) > 130) txt = txt.slice(0, -2) + '…';
      Font.draw(ctx, txt, 9, 226, '#ffb050');
    }
  }
  drawList(ctx) {
    const S = Gear.state(), sl = GEAR_SLOTS[this.si], eq = S.eq[sl.k], l = this.list();
    const act = this.mode === 'list';
    gearPanel(ctx, 148, 24, 274, 116, `${sl.name}: piezas en la mochila`, act ? '#6a5ab0' : '#3a3260');
    if (!l.length) {
      ctx.drawImage(GearIcons.empty(sl.k), 279, 66);
      Font.drawCenter(ctx, 'Aún no tienes piezas para esta ranura', 285, 84, '#6a6288');
      Font.drawCenter(ctx, 'Los alfas y los jefes sueltan las mejores', 285, 96, '#4a4468');
    }
    for (let k = 0; k < 7; k++) {
      const idx = this.scroll + k, it = l[idx]; if (it === undefined) break;
      const y = 38 + k * 15, sel = act && idx === this.li;
      if (sel) { P(ctx, 151, y - 2, 268, 15, '#2e2654'); P(ctx, 151, y - 2, 2, 15, '#ffe060'); }
      else if (k % 2) P(ctx, 151, y - 2, 268, 15, '#1d1834');
      if (it === null) { Font.draw(ctx, '✗ Quitar la pieza equipada', 160, y + 1, '#ff9a8a'); continue; }
      ctx.drawImage(GearIcons.of(it), 157, y - 1);
      if (it.rar >= 4) GearIcons.twinkle(ctx, 156, y - 2, 14, this.t + k, '#fff4c0');
      let nm = Gear.name(it); while (Font.width(nm) > 196) nm = nm.slice(0, -1);
      Font.draw(ctx, nm, 173, y + 1, RARITY[it.rar].color);
      Font.drawRight(ctx, 'Nv' + it.lv, 404, y + 1, '#7a72a0');
      // comparación con la equipada
      const d = Gear.score(it) - Gear.score(eq);
      if (d > 0) Font.draw(ctx, '▲', 408, y + 1, '#70e070'); else if (d < 0) Font.draw(ctx, '▼', 408, y + 1, '#e07060');
    }
    if (l.length > 7) {
      const h = 104, bh = Math.max(8, Math.round(h * 7 / l.length)), by = 37 + Math.round((h - bh) * this.scroll / (l.length - 7));
      P(ctx, 418, 37, 2, h, '#120e20'); P(ctx, 418, by, 2, bh, '#6a5ab0');
    }
  }
  drawDetail(ctx) {
    const S = Gear.state(), sl = GEAR_SLOTS[this.si], eq = S.eq[sl.k], it = this.focusItem();
    const x = 148, y = 144, w = 274, h = 92;
    if (!it) {
      gearPanel(ctx, x, y, w, h, null);
      Font.drawCenter(ctx, this.mode === 'list' ? 'Quitar la pieza equipada' : `Ranura vacía: ${sl.name}`, x + w / 2, y + 34, '#8a80a8');
      Font.drawCenter(ctx, `Efecto principal: ${sl.base ? GEAR_STATS[sl.base].name : 'Crítico, Recarga o Sinergia'}`, x + w / 2, y + 48, '#5a5278');
      return;
    }
    const R = RARITY[it.rar], u = Gear.uniqueOf(it), t = this.t;
    gearPanel(ctx, x, y, w, h, null);
    P(ctx, x + 1, y + 1, w - 2, 2, R.color);
    if (it.rar >= 3) { ctx.globalAlpha = 0.08; P(ctx, x + 1, y + 3, w - 2, h - 4, R.color); ctx.globalAlpha = 1; }
    GearIcons.frame(ctx, it, x + 6, y + 8, 26, t);
    const tx = x + 38;
    Font.draw(ctx, Gear.name(it), tx, y + 6, R.color, '#0c0a16');
    GearIcons.gem(ctx, it.rar, tx, y + 19);
    Font.draw(ctx, `${R.name} · ${Gear.form(it)[0]} · Nv ${it.lv}`, tx + 8, y + 17, '#9a92b8');
    // efectos (con la diferencia respecto a la pieza equipada)
    const cmp = this.mode === 'list' && eq && eq !== it ? Gear.diff(it, eq) : null;
    const flash = this.reforged && this.reforged.id === it.id && this.reforged.t < 0.6;
    let yy = y + 30;
    [it.base].concat(it.aff).forEach((a, i) => {
      const col = i === 0 ? '#ffffff' : flash ? '#ffffff' : '#b8d8ff';
      const k = a.k === 'tipo' ? 'tipo' : a.k;
      drawStatIcon(ctx, k, tx, yy + 2, a.k === 'tipo' ? TYPES[a.t].color : null);
      const at = Gear.affText(a, !!u); Font.draw(ctx, at, tx + 8, yy, col);
      if (cmp) { const dk = a.k === 'tipo' ? 'tipo:' + a.t : a.k, dv = cmp[dk]; if (dv) Font.draw(ctx, (dv > 0 ? "+" : "−") + Math.abs(dv), tx + 12 + Font.width(at), yy, dv > 0 ? '#70e070' : '#e07060'); }
      yy += 10;
    });
    if (flash) { ctx.globalAlpha = 1 - this.reforged.t / 0.6; P(ctx, tx - 2, y + 29, 120, (it.aff.length + 1) * 10, '#ffffff'); ctx.globalAlpha = 1; }
    // lo que perderías al cambiar
    if (cmp) {
      const lost = Object.keys(cmp).filter((k) => cmp[k] < 0 && ![it.base].concat(it.aff).some((a) => (a.k === 'tipo' ? 'tipo:' + a.t : a.k) === k));
      if (lost.length) {
        const s = 'Pierdes: ' + lost.map((k) => (k.startsWith('tipo:') ? TYPES[k.slice(5)].short : GEAR_STATS[k].s) + ' ' + cmp[k]).join(', ');
        Font.draw(ctx, s, tx, yy, '#e07060'); yy += 10;
      }
    }
    // efecto único y frase de ambiente
    if (u) {
      const lines = Font.wrap(u.desc, 104);
      const ux = x + 166, uy = y + 30;
      P(ctx, ux - 4, uy - 2, 110, lines.length * 10 + 16, U.mix(R.color, '#1a1530', 0.82));
      P(ctx, ux - 4, uy - 2, 1, lines.length * 10 + 16, R.color);
      Font.draw(ctx, '★ ' + u.name.replace(/^(de la |del |de )/, ''), ux, uy, R.color);
      lines.forEach((ln, i) => Font.draw(ctx, ln, ux, uy + 11 + i * 10, '#f0e8d8'));
    }
    const lore = u ? GEAR_LORE[it.uniq] : null;
    if (lore && Font.wrap(u.desc, 104).length <= 3) Font.drawRight(ctx, `"${lore}"`, x + w - 6, y + h - 12, "#6a6288");
    else if (this.mode === 'list') Font.drawRight(ctx, 'Z: opciones', x + w - 6, y + h - 12, '#5a5278');
  }
  draw(ctx) {
    this.drawBg(ctx);
    this.drawHeader(ctx);
    this.drawDoll(ctx);
    this.drawTotals(ctx);
    this.drawList(ctx);
    this.drawDetail(ctx);
  }
}
// menú: EQUIPAMIENTO
StartMenu.prototype.items = (function (orig) {
  return function () { const it = orig.call(this); if (G.party.length && G.gear) { const i = it.findIndex((x) => x[1] === 'bag'); it.splice(i + 1, 0, ['EQUIPAMIENTO', 'gear']); } return it; };
})(StartMenu.prototype.items);
StartMenu.prototype.pick = (function (orig) {
  return async function (k) {
    if (k !== 'gear') return orig.call(this, k);
    this.busy = true; await runScene(new GearScreen()); this.busy = false;
  };
})(StartMenu.prototype.pick);
