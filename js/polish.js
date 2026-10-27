'use strict';
// ============================================================
//  PULIDO VISUAL GENERAL
//  - Menú de pausa a pantalla ancha, con iconos y sin solaparse
//    con el letrero del lugar ni con el reloj
// ============================================================
const MENU_ICONS = {
  dex: ['ooooooo..', 'o.....oo.', 'o.ooo.oo.', 'o.....oo.', 'o.ooo.oo.', 'o.....oo.', 'ooooooo..', '.oooooo..'],
  party: ['.o...o...', 'ooo.ooo..', '.o...o...', '...o.....', '..ooo....', '.ooooo...', '.ooooo...', '..o.o....'],
  map: ['oo.oo.oo.', 'o.oo.oo.o', 'o..o..o.o', 'o.oo.oo.o', 'o..o..o.o', 'o.oo.oo.o', 'oo.oo.oo.', '.........'],
  bag: ['..ooo....', '.o...o...', 'ooooooo..', 'o..o..o..', 'o.ooo.o..', 'o.....o..', 'ooooooo..', '.........'],
  gear: ['ooooooo..', 'o.....o..', 'o.ooo.o..', 'o.ooo.o..', '.o...o...', '..o.o....', '...o.....', '.........'],
  card: ['ooooooooo', 'o.......o', 'o.oo.ooo.', 'o.oo....o', 'o....ooo.', 'o.......o', 'ooooooooo', '.........'],
  save: ['ooooooo..', 'o.ooo.oo.', 'o.ooo..o.', 'o......o.', 'o.oooo.o.', 'o.o..o.o.', 'ooooooo..', '.........'],
  opt: ['...o.....', '.o.o.o...', '..ooo....', 'ooo.ooo..', '..ooo....', '.o.o.o...', '...o.....', '.........'],
  close: ['o.....o..', '.o...o...', '..o.o....', '...o.....', '..o.o....', '.o...o...', 'o.....o..', '.........'],
};
const MENU_COL = { dex: '#e05050', party: '#f0a040', map: '#60c0a0', bag: '#c08050', gear: '#ffb040', card: '#70a0f0', save: '#80d080', opt: '#b0a0d0', close: '#a09090' };
StartMenu.prototype.wide = true;
StartMenu.prototype.menuRect = function () { const n = this.items().length; return { x: W - 116, y: 26, w: 112, h: 30 + n * 17 }; };
StartMenu.prototype.update = function () {
  if (this.busy) return;
  const it = this.items(), M = Input.mouse, R = this.menuRect();
  this.t = (this.t || 0) + 1 / 60;
  if (M.inside && (M.moved || M.pressed[0])) {
    let over = -1;
    for (let k = 0; k < it.length; k++) if (M.x >= R.x && M.x < R.x + R.w && M.y >= R.y + 26 + k * 17 && M.y < R.y + 43 + k * 17) over = k;
    if (over >= 0 && over !== this.i) { this.i = over; Sound.sfx('blip'); }
    if (over < 0 && M.pressed[0]) M.pressed[0] = false;
  }
  if (Input.repeat('up')) { this.i = (this.i + it.length - 1) % it.length; Sound.sfx('blip'); }
  if (Input.repeat('down')) { this.i = (this.i + 1) % it.length; Sound.sfx('blip'); }
  if (Input.pressed('a') || (M.pressed[0] && M.x >= R.x)) { Sound.sfx('select'); this.pick(it[this.i][1]); }
  else if (Input.pressed('b') || Input.pressed('start') || M.pressed[2]) { Sound.sfx('cancel'); this.done(); }
};
StartMenu.prototype.draw = function (ctx) {
  const it = this.items(), R = this.menuRect(), t = this.t || 0;
  // panel
  P(ctx, R.x, R.y, R.w, R.h, '#2a2236'); P(ctx, R.x + 1, R.y + 1, R.w - 2, R.h - 2, '#fbf7ee');
  P(ctx, R.x + 1, R.y + 1, R.w - 2, 22, '#3a3058'); P(ctx, R.x + 1, R.y + 23, R.w - 2, 1, '#6c8cd8');
  Font.draw(ctx, `${Events.dayName()} · ${Clock.str()}`, R.x + 6, R.y + 3, '#ffffff');
  Font.draw(ctx, '$' + G.money, R.x + 6, R.y + 12, '#ffe080');
  const med = G.badges ? G.badges.filter(Boolean).length : 0;
  Font.drawRight(ctx, `★${med}`, R.x + R.w - 6, R.y + 12, '#ffd048');
  it.forEach(([n, k], i) => {
    const y = R.y + 27 + i * 17, sel = i === this.i;
    if (sel) { P(ctx, R.x + 3, y - 1, R.w - 6, 16, '#e4ecff'); P(ctx, R.x + 3, y - 1, 2, 16, '#6c8cd8'); }
    const ic = MENU_ICONS[k] || MENU_ICONS.card, col = MENU_COL[k] || '#8080a0';
    const bx = R.x + 9, by = y + 3 + (sel ? Math.round(Math.sin(t * 8)) : 0);
    ctx.fillStyle = '#2a2236'; ic.forEach((r, j) => { for (let q = 0; q < r.length; q++) if (r[q] === 'o') ctx.fillRect(bx + q + 1, by + j + 1, 1, 1); });
    ctx.fillStyle = sel ? col : U.mix(col, '#fbf7ee', 0.35); ic.forEach((r, j) => { for (let q = 0; q < r.length; q++) if (r[q] === 'o') ctx.fillRect(bx + q, by + j, 1, 1); });
    Font.draw(ctx, n, R.x + 24, y + 3, sel ? '#2a2236' : '#5a5070');
  });
  // objetivo actual (abajo a la izquierda)
  const obj = Objectives.current();
  if (obj) {
    const lines = Font.wrap(obj, 280), h = 18 + lines.length * 11;
    UI.box(ctx, 4, H - h - 4, 300, h, 'dark');
    Font.draw(ctx, 'Objetivo', 12, H - h + 1, '#ffd048');
    lines.forEach((ln, i) => Font.draw(ctx, ln, 12, H - h + 13 + i * 11, '#e8e0f8'));
  }
};

// ---------- lista de ánimas: tarjetas con color de tipo, PS y experiencia ----------
PartyScreen.prototype.draw = function (ctx) {
  P(ctx, 0, 0, W, H, '#2c5490');
  const o = (Engine.time * 6) % 20;
  ctx.fillStyle = '#305a98';
  for (let y = -20; y < H + 20; y += 20) for (let x = -20; x < W + 20; x += 20) ctx.fillRect(Math.round(x + o), Math.round(y + o), 10, 10);
  G.party.forEach((c, i) => {
    const sel = i === this.i, y = 5 + i * 30, x = 8 + (sel ? 3 : 0), w = 304;
    const st = calcStats(c), sp = SPECIES[c.sp], tc = TYPES[sp.types[0]].color, dead = c.hp <= 0;
    // sombra y marco
    ctx.globalAlpha = 0.3; P(ctx, x + 2, y + 2, w, 28, '#0a1430'); ctx.globalAlpha = 1;
    P(ctx, x, y, w, 28, sel ? '#ffe060' : '#1c1824');
    P(ctx, x + 1, y + 1, w - 2, 26, dead ? '#e8d0d0' : sel ? '#fff8e0' : '#f4f0f8');
    if (this.swap === i) P(ctx, x + 1, y + 1, w - 2, 26, '#c8e8ff');
    P(ctx, x + 1, y + 1, 4, 26, dead ? '#a08080' : tc); P(ctx, x + 5, y + 1, 1, 26, U.shade(tc, -0.3));
    // retrato sobre disco del tipo
    pixCircle(ctx, x + 20, y + 15, 11, dead ? '#d8c0c0' : U.mix(tc, '#ffffff', sel ? 0.55 : 0.7));
    const bob = sel && !dead ? Math.round(Math.sin(Engine.time * 8)) : 0;
    drawCreatureIcon(ctx, c.sp, x + 8, y + 2 + bob, 24, 0, c.shiny);
    if (c.shiny) Font.draw(ctx, '★', x + 30, y + 1, '#e8a020');
    Font.draw(ctx, cName(c), x + 38, y + 4, '#2a2236');
    Font.draw(ctx, 'Nv' + c.lv, x + 38, y + 15, '#5a5068');
    sp.types.forEach((t, k) => UI.typeBadge(ctx, t, x + 98 + k * 33, y + 15));
    if (c.held) ctx.drawImage(Icons.item(c.held), x + 164, y + 2);
    // PS
    const r = Math.max(0, c.hp) / st.hp;
    Font.draw(ctx, 'PS', x + 184, y + 3, '#e0a030');
    UI.bar(ctx, x + 198, y + 5, 84, 4, r, UI.hpColor(r));
    Font.drawRight(ctx, dead ? 'DEBILITADO' : `${c.hp}/${st.hp}`, x + 282, y + 12, dead ? '#c03030' : '#2a2236');
    // experiencia
    const e0 = expFor(c.lv), e1 = expFor(c.lv + 1), ek = c.lv >= 100 ? 1 : U.clamp((c.exp - e0) / Math.max(1, e1 - e0), 0, 1);
    P(ctx, x + 198, y + 23, 84, 2, '#d8d0e8'); P(ctx, x + 198, y + 23, Math.round(84 * ek), 2, '#58a8f0');
    if (talentPoints(c) > 0) Font.draw(ctx, '★', x + 288, y + 3, Math.floor(Engine.time * 2) % 2 ? '#e8a020' : '#ffd060');
    if (sel) UI.cursor(ctx, x + 292, y + 14);
  });
  UI.box(ctx, 4, 190, 312, 46);
  Font.draw(ctx, this.swap >= 0 ? '¿Con cuál intercambiar?' : fmt(this.msg), 14, 200, '#2a2236');
  Font.draw(ctx, 'Z: elegir   X: volver', 14, 216, '#8a8098');
  if (G.party.some((c) => talentPoints(c) > 0)) Font.drawRight(ctx, '★ = Esencia por gastar', 306, 216, '#c08020');
};

// ---------- Códice: fondo por tipo, siluetas y filas con icono ----------
function dexBackdrop(ctx, x, y, w, h, sp, seen) {
  P(ctx, x - 1, y - 1, w + 2, h + 2, '#1c1824');
  const c = seen ? TYPES[sp.types[0]].color : '#7a8090';
  for (let i = 0; i < h; i += 4) P(ctx, x, y + i, w, 4, U.mix(c, '#ffffff', 0.85 - (i / h) * 0.35));
  for (let i = 0; i < 6; i++) { ctx.globalAlpha = 0.12; P(ctx, x, y + Math.round(h * 0.68) + i * 3, w, 1, U.shade(c, -0.3)); }
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.35; pixCircle(ctx, x + w / 2, y + h * 0.45, Math.round(w * 0.34), '#ffffff'); ctx.globalAlpha = 1;
  drawShadow(ctx, x + w / 2, y + h * 0.82, w * 0.22, 4, 0.25);
}
DexScreen.prototype.draw = function (ctx) {
  P(ctx, 0, 0, W, H, '#c83848');
  ctx.fillStyle = '#c03244';
  const o = Math.floor(Engine.time * 6) % 16;
  for (let x = -H; x < W; x += 16) for (let y = 0; y < H; y++) ctx.fillRect(x + o + y, y, 6, 1);
  P(ctx, 0, 0, W, 18, '#901c2c'); P(ctx, 0, 18, W, 1, '#60101c');
  ctx.drawImage(Icons.sphere('esfera', 10), 6, 4);
  Font.draw(ctx, 'CÓDICE ÁNIMA', 20, 5, '#ffffff', '#60101c');
  Font.drawRight(ctx, `Vistos ${Object.keys(G.seen).length} · Capturados ${Object.keys(G.caught).length}`, 312, 5, '#ffd8d8');
  const sp = SPECIES_LIST[this.i], seen = !!G.seen[sp.id];
  if (this.detail) {
    UI.box(ctx, 6, 22, 308, 212, 'panel');
    dexBackdrop(ctx, 15, 31, 96, 96, sp, true);
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
    const s = SPECIES_LIST[idx], y = Math.round(28 + k * 14.5), sel = idx === this.i, sn = !!G.seen[s.id];
    if (sel) { P(ctx, 163, y - 2, 148, 14, '#ffe4a8'); P(ctx, 163, y - 2, 2, 14, '#c83848'); } else if (k % 2) P(ctx, 163, y - 2, 148, 14, '#efe8d8');
    if (sn) ctx.drawImage(CreatureGfx.get(s.key, 16, false), 166, y - 3);
    if (G.caught[s.id]) ctx.drawImage(Icons.sphere('esfera', 8), 298, y + 1);
    Font.draw(ctx, U.pad(s.id, 3, '0'), 184, y, sn ? '#8a7a70' : '#b0a8a0');
    Font.draw(ctx, sn ? s.name : '- - - - -', 206, y, sn ? '#2a2236' : '#b0a8a0');
  }
  // vista previa
  dexBackdrop(ctx, 9, 25, 144, 144, sp, seen);
  if (seen) {
    CreatureAnim.portrait(ctx, sp.key, 96, false, 33, 42 + Math.round(Math.sin(Engine.time * 2)), 'dex96');
    Font.drawCenter(ctx, sp.name, 81, 176, '#ffffff', '#60101c');
    sp.types.forEach((t, k) => UI.typeBadge(ctx, t, 81 - sp.types.length * 16 + k * 33, 190));
  } else {
    ctx.drawImage(CreatureGfx.flash(sp.key, 96, '#3a3448'), 33, 42);
    Font.drawCenter(ctx, '?', 81, 88, '#ffffff');
    Font.drawCenter(ctx, 'Sin datos', 81, 176, '#ffd8d8');
  }
  Font.drawCenter(ctx, 'Z: detalles  ←→: saltar', 81, 214, '#ffd8d8');
};

// ---------- al entrar en un Centro Ánima, pasa a ser el punto de regreso ----------
// (antes solo contaba al curarse; si el jugador lo olvidaba, tras una derrota volvía a casa)
{
  const _load = World.loadMap;
  World.loadMap = function (id, ...rest) {
    const r = _load.call(this, id, ...rest);
    if (G && typeof id === 'string' && id.startsWith('centro_')) G.lastHeal = { map: id, x: 6, y: 4 };
    return r;
  };
}

// ---------- evolución: fondo del color del tipo, haces de luz, anillos y destellos ----------
EvolutionScene.prototype.wide = true;
EvolutionScene.prototype.draw = function (ctx) {
  const t = this.t, cx = Math.round(W / 2), cy = 96;
  const c1 = TYPES[SPECIES[this.from].types[0]].color, c2 = TYPES[SPECIES[this.to].types[0]].color;
  const k = U.clamp((t - 1) / 4, 0, 1), col = U.mix(c1, c2, k);
  // fondo: degradado oscuro teñido del tipo
  for (let y = 0; y < H; y += 4) P(ctx, 0, y, W, 4, U.mix('#0c0818', U.shade(col, -0.35), 0.15 + 0.35 * (1 - Math.abs(y - cy) / H)));
  // haces de luz giratorios
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.35);
  for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.globalAlpha = 0.06 + 0.06 * k; ctx.fillStyle = i % 2 ? '#ffffff' : col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, -260); ctx.lineTo(14, -260); ctx.fill(); }
  ctx.restore(); ctx.globalAlpha = 1;
  // partículas en espiral que convergen
  for (let i = 0; i < 70; i++) {
    const life = (i * 0.137 + t * (0.25 + (i % 5) * 0.05)) % 1, a = i * 2.39 + life * 5, r = (1 - life) * 170;
    ctx.globalAlpha = life; P(ctx, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.7), i % 4 ? 1 : 2, i % 4 ? 1 : 2, i % 3 ? '#fff4c0' : U.shade(col, 0.4));
  }
  ctx.globalAlpha = 1;
  // anillos que se expanden con cada pulso
  const freq = 1 + t * t * 0.8, pulse = (t * freq * 3 / (Math.PI * 2)) % 1;
  if (t > 1 && t < 5.4) for (let i = 0; i < 2; i++) { const p = (pulse + i * 0.5) % 1; ctx.globalAlpha = (1 - p) * 0.6; pixRing(ctx, cx, cy, 30 + p * 80, '#ffffff', 1); }
  ctx.globalAlpha = 1;
  // halo y criatura
  ctx.globalAlpha = 0.25 + 0.2 * k; pixCircle(ctx, cx, cy, 44 + Math.sin(t * 4) * 3, U.shade(col, 0.3)); ctx.globalAlpha = 1;
  drawShadow(ctx, cx, cy + 46, 30, 5, 0.4);
  const showNew = t > 5 || (t > 1 && Math.sin(t * freq * 3) > 0);
  const sp = showNew ? this.to : this.from;
  const img = t > 1 && t < 5.4 ? CreatureGfx.flash(sp, 96, '#ffffff') : CreatureGfx.get(sp, 96, this.c.shiny);
  ctx.drawImage(img, cx - 48, cy - 46 + Math.round(Math.sin(t * 2) * 2));
  if (t > 5.4 && t < 6) { ctx.globalAlpha = (6 - t) / 0.6; P(ctx, 0, 0, W, H, '#fff'); ctx.globalAlpha = 1; }
  // texto (caja centrada de 320)
  const bx = Math.round((W - 312) / 2);
  UI.box(ctx, bx, 180, 312, 56);
  Font.draw(ctx, t < 5 ? `¿Qué? ¡${cName(this.c)} está evolucionando!` : `¡${SPECIES[this.to].name}!`, bx + 10, 192, '#2a2236');
  if (!this.forced && t < 5) Font.draw(ctx, '(X para detenerlo)', bx + 10, 218, '#8a8098');
};

// ---------- ficha de entrenador: datos ordenados y las 6 medallas con su nombre ----------
TrainerCard.prototype.draw = function (ctx) {
  UI.box(ctx, 14, 18, 292, 204);
  P(ctx, 18, 22, 284, 20, '#4a78d8'); P(ctx, 18, 41, 284, 1, '#2a4a98');
  Font.draw(ctx, 'FICHA DE ENTRENADOR', 26, 28, '#ffffff', '#2a4a98');
  Font.drawRight(ctx, 'ID ' + U.pad(((G.uidNext || 1) * 7919 + 12345) % 100000, 5, '0'), 294, 28, '#d0e0ff');
  // retrato sobre un disco
  P(ctx, 222, 50, 74, 84, '#e8eef8'); P(ctx, 222, 50, 74, 1, '#c8d4e8');
  pixCircle(ctx, 259, 104, 26, '#d0dcf0');
  ctx.drawImage(HiChar.get(LOOKS.player), 0, 0, 32, 48, 235, 58, 48, 72);
  const rows = [['Nombre', G.name, '#2a2236'], ['Dinero', '$' + G.money, '#2a2236'], ['Códice', Object.keys(G.caught).length + ' capturados', '#2a2236'], ['Tiempo', Game.timeStr(G.playTime), '#2a2236'], ['Estilo', typeof Style !== 'undefined' ? Style.title() : '-', '#7a3aa0']];
  rows.forEach(([a, b, c], k) => { const y = 52 + k * 16; if (k % 2) P(ctx, 22, y - 3, 196, 15, '#f2ecdf'); Font.draw(ctx, a, 30, y, '#5a5068'); Font.draw(ctx, b, 94, y, c); });
  Font.draw(ctx, 'MEDALLAS', 30, 140, '#5a5068');
  const n = BADGES.length;
  for (let i = 0; i < n; i++) {
    const x = 30 + i * 44, y = 154, got = G.badges[i];
    P(ctx, x - 2, y - 2, 28, 28, '#1c1824'); P(ctx, x - 1, y - 1, 26, 26, got ? '#fff4d0' : '#e0d8c8');
    if (got) ctx.drawImage(Icons.badge(i), x + 5, y + 5);
    else { ctx.globalAlpha = 0.25; ctx.drawImage(Icons.badge(i), x + 5, y + 5); ctx.globalAlpha = 1; }
    let nm = BADGES[i].name.replace('Medalla ', ''); while (Font.width(nm) > 40) nm = nm.slice(0, -1);
    Font.drawCenter(ctx, nm, x + 12, y + 30, got ? '#5a4030' : '#a098a8');
  }
  Font.drawCenter(ctx, 'Z / X: cerrar', 160, 207, '#8a8098');
};

// ---------- el letrero del lugar no se dibuja debajo de un menú ----------
{
  const _wd = World.draw;
  World.draw = function (ctx) {
    const b = this.banner, hide = b && Scenes.top() !== this && !this.battle;
    if (hide) this.banner = null;
    try { return _wd.call(this, ctx); } finally { if (hide) this.banner = b; }
  };
}

// ---------- transiciones: barrido de rombos en diagonal (en lugar de un fundido plano) ----------
{
  const _fd = Fade.draw.bind(Fade);
  Fade.draw = function (ctx) {
    if (this.a <= 0) return;
    if (this.a >= 1 || this.color !== '#000') return _fd(ctx);
    const S = 16, cols = Math.ceil(WIDE / S) + 1, rows = Math.ceil(H / S) + 1, k = this.a;
    ctx.fillStyle = '#08060e';
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      // cada rombo crece con un retraso según su posición (barrido de izquierda-arriba a derecha-abajo)
      const d = (i / cols) * 0.55 + (j / rows) * 0.45, r = U.clamp((k * 1.6 - d * 0.6) * 1.25, 0, 1) * S * 1.05;
      if (r <= 0) continue;
      const cx = i * S, cy = j * S;
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.fill();
    }
  };
}

// ---------- fondos de menú animados ----------
// degradado vertical, rombos que se desplazan en diagonal, motas de luz que suben y viñeta suave
screenBg = function (ctx, c1 = '#e8e0f0', c2 = '#d8cce8') {
  const t = Engine.time;
  for (let y = 0; y < H; y += 4) P(ctx, 0, y, W, 4, U.mix(U.shade(c1, 0.04), U.shade(c1, -0.06), y / H));
  const o = (t * 7) % 24;
  ctx.fillStyle = c2;
  for (let y = -24; y < H + 24; y += 24) for (let x = -24; x < W + 24; x += 24) {
    const px = Math.round(x + o + ((y / 24) % 2 ? 12 : 0)), py = Math.round(y + o * 0.5);
    ctx.fillRect(px + 4, py, 4, 1); ctx.fillRect(px + 2, py + 1, 8, 2); ctx.fillRect(px, py + 3, 12, 2); ctx.fillRect(px + 2, py + 5, 8, 2); ctx.fillRect(px + 4, py + 7, 4, 1);
  }
  const lt = U.shade(c1, 0.22);
  for (let i = 0; i < 18; i++) {
    const k = (i * 0.618 + t * (0.04 + (i % 4) * 0.012)) % 1, x = Math.round((i * 97 + Math.sin(t * 0.6 + i) * 10) % W), y = Math.round(H - k * (H + 10));
    ctx.globalAlpha = 0.5 * Math.sin(k * Math.PI); P(ctx, x, y, i % 3 ? 1 : 2, i % 3 ? 1 : 2, lt);
  }
  ctx.globalAlpha = 0.18; const dk = U.shade(c1, -0.45);
  for (let i = 0; i < 6; i++) { P(ctx, 0, i * 2, W, 2, dk); P(ctx, 0, H - (i + 1) * 2, W, 2, dk); ctx.globalAlpha *= 0.7; }
  ctx.globalAlpha = 1;
};

// ---------- tienda con su propio estilo: mostrador, vista previa del objeto y etiquetas de precio ----------
ShopScreen.prototype.draw = function (ctx) {
  this.opaque = true;
  screenBg(ctx, '#3a6a8a', '#36627f');
  const buy = this.mode === 'buy', list = this.list(), id = list[this.i];
  // cabecera
  P(ctx, 0, 0, W, 20, '#14202c'); P(ctx, 0, 20, W, 1, '#4a8ab0');
  Font.draw(ctx, buy ? 'TIENDA · COMPRAR' : 'TIENDA · VENDER', 8, 6, '#ffffff', '#0a1420');
  P(ctx, W - 84, 3, 80, 14, '#0a1420'); P(ctx, W - 80, 6, 7, 7, '#2a1c08'); P(ctx, W - 79, 7, 5, 5, '#f0c040'); P(ctx, W - 78, 8, 2, 2, '#fff0a0');
  Font.drawRight(ctx, '$' + G.money, W - 8, 6, '#ffe080');
  // lista de artículos
  UI.box(ctx, 140, 26, 176, 150);
  for (let k = 0; k < 8; k++) {
    const idx = this.scroll + k; if (idx > list.length) break;
    const y = 34 + k * 17, sel = idx === this.i;
    if (sel) { P(ctx, 145, y - 4, 166, 16, '#e4ecff'); P(ctx, 145, y - 4, 2, 16, '#4a8ab0'); }
    if (idx === list.length) { Font.draw(ctx, 'SALIR', 152, y, '#5a5070'); continue; }
    const it = ITEMS[list[idx]], price = buy ? Events.buyPrice(it) : (it.sell || Math.floor(it.price / 2));
    ctx.drawImage(Icons.item(list[idx]), 150, y - 4);
    let nm = it.name; while (Font.width(nm) > 92) nm = nm.slice(0, -1);
    Font.draw(ctx, nm, 168, y, '#2a2236');
    // etiqueta de precio
    const pt = '$' + price, pw = Font.width(pt) + 8, px = 306 - pw;
    P(ctx, px, y - 2, pw, 11, buy && price > G.money ? '#c0a0a0' : '#f0c040'); P(ctx, px - 2, y + 1, 2, 5, buy && price > G.money ? '#c0a0a0' : '#f0c040');
    Font.draw(ctx, pt, px + 4, y, '#3a2810');
  }
  // vista previa
  UI.box(ctx, 4, 26, 132, 150);
  if (id) {
    const it = ITEMS[id], t = Engine.time;
    pixCircle(ctx, 70, 78, 30, '#dce8f4'); pixCircle(ctx, 70, 78, 24, '#eef4fa');
    drawShadow(ctx, 70, 104, 18, 4, 0.25);
    const ic = Icons.item(id); ctx.drawImage(ic, 0, 0, 16, 16, 54, 58 + Math.round(Math.sin(t * 2) * 2), 32, 32);
    Font.drawCenter(ctx, it.name, 70, 114, '#2a2236');
    Font.drawCenter(ctx, `Tienes: ${G.bag[id] || 0}`, 70, 128, '#5a5070');
    const price = buy ? Events.buyPrice(it) : (it.sell || Math.floor(it.price / 2));
    Font.drawCenter(ctx, (buy ? 'Precio: $' : 'Te dan: $') + price, 70, 142, buy && price > G.money ? '#c04040' : '#3a7a40');
    if (buy && price <= G.money) Font.drawCenter(ctx, `Puedes comprar ${Math.min(99, Math.floor(G.money / price))}`, 70, 156, '#8a8098');
  } else Font.drawCenter(ctx, '¡Vuelve pronto!', 70, 90, '#5a5070');
  // descripción
  UI.box(ctx, 4, 180, 312, 56);
  if (id) Font.wrap(ITEMS[id].desc, 292).slice(0, 3).forEach((ln, k) => Font.draw(ctx, ln, 14, 190 + k * 13, '#2a2236'));
};
