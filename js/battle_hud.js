'use strict';
// ============================================================
//  HUD DE COMBATE (pantalla ancha)
//  - Paneles de PS en las esquinas
//  - Barra de ataques a todo el ancho: nombres completos, tecla,
//    potencia, eficacia y recarga
//  - Selector táctico en anillo y carteles con acento de color
// ============================================================
const HUD_L = 6 - UIX, HUD_R = WIDE - UIX - 156;
const MOVE_KEYS = ['1', 'K/2', 'L/3', 'I/4'];

function hudPanel(ctx, x, y, w, h, accent) {
  ctx.globalAlpha = 0.9; P(ctx, x, y, w, h, '#100c1c'); ctx.globalAlpha = 1;
  P(ctx, x, y, w, 1, '#06040c'); P(ctx, x, y + h - 1, w, 1, '#06040c'); P(ctx, x, y, 1, h, '#06040c'); P(ctx, x + w - 1, y, 1, h, '#06040c');
  P(ctx, x + 1, y + 1, w - 2, 1, accent); P(ctx, x + 1, y + 2, w - 2, 1, U.shade(accent, -0.45));
  P(ctx, x + 1, y + h - 2, w - 2, 1, '#2a2440');
}

// tarjeta de un ataque (barra inferior y selector táctico)
BattleScene.prototype.drawMoveCard = function (ctx, f, i, x, y, w, h, o = {}) {
  const mk = f.c.moves[i];
  P(ctx, x, y, w, h, '#06040c');
  if (!mk) { P(ctx, x + 1, y + 1, w - 2, h - 2, '#16122a'); Font.drawCenter(ctx, '-', x + w / 2, y + h / 2 - 4, '#3a3458'); return; }
  const m = MOVES[mk], col = TYPES[m.type].color, cd = f.cds[i], ready = cd <= 0;
  P(ctx, x + 1, y + 1, w - 2, h - 2, U.shade(col, ready ? -0.32 : -0.6));
  P(ctx, x + 1, y + 1, w - 2, Math.floor((h - 2) / 2), U.shade(col, ready ? -0.18 : -0.52));
  P(ctx, x + 1, y + 1, w - 2, 1, U.shade(col, ready ? 0.25 : -0.3));
  // recarga: velo que baja
  if (!ready) { const k = Math.min(1, cd / (m.cd * f.mods.cd)); ctx.globalAlpha = 0.55; P(ctx, x + 1, y + 1, w - 2, Math.round((h - 2) * k), '#000000'); ctx.globalAlpha = 1; }
  let nm = m.name; if (Font.width(nm) > w - 6) nm = nm.replace(/ (de|del|de la) /, ' '); while (Font.width(nm) > w - 6) nm = nm.slice(0, -1);
  Font.draw(ctx, nm, x + 3, y + 3, ready ? '#ffffff' : '#a8a0b8', ready ? U.shade(col, -0.7) : null);
  // tecla
  const key = o.key !== undefined ? o.key : MOVE_KEYS[i];
  if (key) { const kw = Font.width(key) + 4; P(ctx, x + 3, y + h - 11, kw, 9, '#0a0814'); P(ctx, x + 3, y + h - 11, kw, 1, '#3a3458'); Font.draw(ctx, key, x + 5, y + h - 11, '#e0d8f0'); }
  if (!ready) Font.drawRight(ctx, cd.toFixed(1) + 's', x + w - 3, y + h - 11, '#ffd0a0');
  else {
    // potencia y eficacia
    const tgt = this.targetOf(f);
    const e = tgt && m.pow ? typeMult(m.type, tgt.types) : 1;
    const right = x + w - 3;
    if (e > 1) Font.drawRight(ctx, '▲', right, y + h - 11, Math.floor(this.t * 4) % 2 ? '#80ff80' : '#50d050');
    else if (e < 1) Font.drawRight(ctx, '▼', right, y + h - 11, '#9a90a8');
    if (m.pow) Font.drawRight(ctx, String(m.pow), right - (e !== 1 ? 8 : 0), y + h - 11, U.mix(col, '#ffffff', 0.55));
  }
  if (o.armed) {
    const g = Math.floor(this.t * 6) % 2 ? '#ffe060' : '#ffc030';
    P(ctx, x - 1, y - 1, w + 2, 1, g); P(ctx, x - 1, y + h, w + 2, 1, g); P(ctx, x - 1, y - 1, 1, h + 2, g); P(ctx, x + w, y - 1, 1, h + 2, g);
    P(ctx, x + w - 10, y - 5, 11, 11, '#06040c'); P(ctx, x + w - 9, y - 4, 9, 9, g); const jk = Input.mode === 'pad' ? 'A' : Input.mode === 'touch' ? '★' : 'J'; Font.drawCenter(ctx, jk, x + w - 5, y - 5, '#2a1a00');
  }
};

BattleScene.prototype.drawMoveBar = function (ctx) {
  const a = this.ally, armed = this.armed || 0;
  // fondo
  P(ctx, 0, 199, W, 41, '#0e0a18'); P(ctx, 0, 199, W, 1, '#3a3260'); P(ctx, 0, 200, W, 1, '#06040c');
  for (let i = 0; i < 4; i++) this.drawMoveCard(ctx, a, i, 4 + i * 82, 203, 79, 24, { armed: i === armed });
  // bloque derecho: esquiva, esferas, arte y dúo
  const bx = 334, K = Input.mode === 'pad' ? { ball: 'LT', swap: 'Select', ult: 'Y', duo: 'L3' } : Input.mode === 'touch' ? { ball: '', swap: '', ult: '', duo: '' } : { ball: 'E · R', swap: 'Q', ult: 'F', duo: 'G' };
  P(ctx, bx, 203, 88, 34, '#06040c'); P(ctx, bx + 1, 204, 86, 32, '#16122a');
  const dReady = a.dodgeCd <= 0;
  Font.draw(ctx, 'ESQ', bx + 4, 205, dReady ? '#a0e8ff' : '#5a5478');
  UI.bar(ctx, bx + 24, 208, 58, 2, 1 - a.dodgeCd / 0.75, dReady ? '#a0e8ff' : '#4a6a8a');
  const ball = this.currentBall ? this.currentBall() : null;
  if (this.wild) {
    if (ball) { ctx.drawImage(Icons.sphere(ITEMS[ball].sphere, 8), bx + 4, 214); Font.draw(ctx, `×${G.bag[ball]}`, bx + 14, 213, this.throwCd > 0 ? '#706888' : '#ffffff'); Font.drawRight(ctx, K.ball, bx + 84, 213, '#6a6288'); }
    else Font.draw(ctx, 'Sin esferas', bx + 4, 213, '#706888');
  } else Font.draw(ctx, K.swap ? K.swap + ': cambiar ánima' : 'Cambiar ánima', bx + 4, 213, '#6a6288');
  // sinergia
  const full = a.syn >= 100, blink = Math.floor(this.t * 6) % 2;
  UI.bar(ctx, bx + 4, 233, 80, 2, a.syn / 100, full ? (blink ? '#ffe060' : '#ff9030') : '#b070f0');
  Font.draw(ctx, (K.ult ? K.ult + ' ' : '') + (full ? '¡ARTE!' : 'arte'), bx + 4, 223, full ? (blink ? '#ffe060' : '#ff9030') : '#706888');
  if (this.duoMax) {
    const left = this.duoMax('ally') - (this.duoUsesA || 0);
    const can = full && !this.duoA && left > 0 && !!this.benchA();
    Font.drawRight(ctx, (K.duo ? K.duo + ' ' : '') + `dúo×${left}`, bx + 84, 223, can ? (blink ? '#a0e8ff' : '#60b0ff') : '#5a5478');
  }
  // ayuda
  Font.draw(ctx, Input.usingMouse() ? 'Clic: ataque armado · Rueda: cambiar · Mayús: táctico' : 'J: ataque armado · Mayús: selector táctico · Espacio: esquivar', 6, 230, '#6a6288');
};

// carteles: píldora oscura con acentos del color del mensaje
BattleScene.prototype.drawBanner = function (ctx, b) {
  const a = U.clamp(b.t < 0.15 ? b.t / 0.15 : b.t > b.dur - 0.2 ? (b.dur - b.t) / 0.2 : 1, 0, 1);
  const w = Math.min(310, Font.width(b.text) + 30), x = Math.round(160 - w / 2), y = 44 - Math.round((1 - a) * 6);
  ctx.globalAlpha = a * 0.92; P(ctx, x, y, w, 18, '#0c0818'); ctx.globalAlpha = a;
  P(ctx, x + 2, y - 1, w - 4, 1, '#0c0818'); P(ctx, x + 2, y + 18, w - 4, 1, '#0c0818');
  P(ctx, x + 6, y + 1, w - 12, 1, U.shade(b.color, -0.2));
  P(ctx, x + 6, y + 16, w - 12, 1, U.shade(b.color, -0.55));
  for (const dx of [x + 5, x + w - 8]) { P(ctx, dx + 1, y + 7, 1, 4, b.color); P(ctx, dx, y + 8, 3, 2, b.color); }
  Font.drawCenter(ctx, b.text, 160, y + 5, b.color, '#000000');
  ctx.globalAlpha = 1;
};

// clics en la barra inferior (nuevas posiciones)
BattleScene.prototype.moveBarHit = function (mx, my) {
  if (my < 203 || my >= 227) return -1;
  for (let i = 0; i < 4; i++) if (mx >= 4 + i * 82 && mx < 83 + i * 82) return i;
  return -1;
};

// selector táctico en anillo
BattleScene.prototype.drawTactic = function (ctx, f) {
  const [sx0, sy0] = this.toScreen(f.x, f.y, 12), x0 = Math.round(sx0), y0 = Math.round(sy0), t = this.t;
  // viñeta morada (cámara lenta)
  ctx.globalAlpha = 0.32; P(ctx, 0, 0, W, 199, '#0a0614'); ctx.globalAlpha = 0.25;
  for (let i = 0; i < 6; i++) { P(ctx, 0, i * 3, W, 3, '#4a2a80'); P(ctx, 0, 196 - i * 3, W, 3, '#4a2a80'); }
  ctx.globalAlpha = 1;
  // anillo giratorio
  for (let k = 0; k < 24; k++) { const an = (k / 24) * Math.PI * 2 + t * 0.8; P(ctx, Math.round(x0 + Math.cos(an) * 26), Math.round(y0 + Math.sin(an) * 18), 1, 1, k % 3 ? '#a090e0' : '#ffffff'); }
  const pick = this.tac.pick;
  TAC_DIRS.forEach(([dx, dy], i) => {
    if (!f.c.moves[i]) return;
    const w = 80, h = 24, sel = pick === i;
    const bx = U.clamp(Math.round(x0 + dx * 58 - w / 2), 3, W - w - 3), by = U.clamp(Math.round(y0 + dy * 36 - h / 2), 42, 182 - h);
    // radio hacia la tarjeta
    const lc = sel ? '#ffe060' : '#5a4a90';
    if (dx) P(ctx, Math.min(x0 + dx * 27, bx + (dx > 0 ? 0 : w)), y0, Math.abs(bx + (dx > 0 ? 0 : w) - (x0 + dx * 27)), 1, lc);
    else P(ctx, x0, Math.min(y0 + dy * 19, by + (dy > 0 ? 0 : h)), 1, Math.abs(by + (dy > 0 ? 0 : h) - (y0 + dy * 19)), lc);
    if (sel) { ctx.globalAlpha = 0.35; P(ctx, bx - 3, by - 3, w + 6, h + 6, TYPES[MOVES[f.c.moves[i]].type].color); ctx.globalAlpha = 1; }
    this.drawMoveCard(ctx, f, i, bx, by, w, h, { key: String(i + 1), armed: sel });
  });
  const msg = Input.mode === 'pad' ? 'Elige con el stick y suelta X' : Input.mode === 'touch' ? 'Elige con el joystick y suelta Táctico' : 'Elige con la dirección y suelta Mayús';
  const mw = Font.width(msg) + 16;
  ctx.globalAlpha = 0.9; P(ctx, 4, 184, mw, 13, '#0c0818'); P(ctx, 4, 184, 2, 13, '#ffe080'); ctx.globalAlpha = 1;
  Font.draw(ctx, msg, 11, 186, '#ffe080');
};
