'use strict';
// ============================================================
//  OBJETOS DEL MAPA (fondo transparente, sobre el terreno 2.0)
// ============================================================

const Obj = {
  cache: {},
  get(kind, f = 0, v = 0) {
    const k = kind + ':' + f + ':' + v;
    if (this.cache[k]) return this.cache[k];
    const [c, x] = U.makeCanvas(16, 16);
    (this.draw[kind] || (() => {}))(x, f, v);
    this.cache[k] = c; return c;
  },
  // elipse sombreada con luz desde arriba a la izquierda (con tramado)
  blob(x, cx, cy, rx, ry, pal, opt = {}) {
    const ins = (a, b) => { const dx = (a + 0.5 - cx) / rx, dy = (b + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1; };
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let xx = Math.floor(cx - rx - 1); xx <= Math.ceil(cx + rx + 1); xx++) {
      const dx = (xx + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, dd = dx * dx + dy * dy;
      if (dd > 1) { if (opt.outline && (ins(xx + 1, y) || ins(xx - 1, y) || ins(xx, y + 1) || ins(xx, y - 1))) P(x, xx, y, 1, 1, opt.outline); continue; }
      let l = -(dx * 0.6 + dy * 0.8) * 0.5 + 0.5 - dd * 0.2 + BAYER[(y & 3) * 4 + (xx & 3)] * 0.35;
      if (opt.noise) l += (hash2(xx * 3 + opt.noise, y * 5) - 0.5) * 0.3;
      let i = Math.floor(l * (pal.length - 1) + 0.5);
      if (dd > 0.75 && dy > 0.1) i = Math.min(i, 1);
      P(x, xx, y, 1, 1, pal[U.clamp(i, 0, pal.length - 1)]);
    }
  },
  shadow(x, cx, cy, rx, ry, a = 0.28) {
    x.globalAlpha = a;
    for (let y = -ry; y <= ry; y++) { const ww = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / ((ry + 0.5) * (ry + 0.5))))); P(x, cx - ww, cy + y, ww * 2, 1, '#0a140c'); }
    x.globalAlpha = 1;
  },
  draw: {},
};
const toHex = (rgb) => '#' + rgb.map((q) => q.toString(16).padStart(2, '0')).join('');
const ROCKP = ['#3a3440', '#5a5460', '#7a7480', '#9a94a0', '#bcb8c2', '#dcd8e0'];
const CAVEROCKP = ['#241c22', '#3a3038', '#544852', '#6e626a', '#8a7e86'];
const ASHROCKP = ['#241e20', '#3a3234', '#524a4c', '#6a6264', '#847c7e'];
const WOOD = ['#3a2416', '#5a3a22', '#7a5230', '#9a6c40', '#b88a56', '#d4a872'];
const HEDGEP = PALS.hedge.map(toHex);

Object.assign(Obj.draw, {
  trunk(x) {
    Obj.shadow(x, 8, 14, 7, 2, 0.3);
    for (let y = 4; y < 15; y++) for (let i = 5; i < 11; i++) {
      const edge = i === 5 || i === 10;
      let k = i < 7 ? 4 : i < 9 ? 3 : 2;
      if (hash2(i, y * 3) < 0.25) k -= 1;
      if ((y * 2 + i) % 7 === 0) k -= 1;
      P(x, i, y, 1, 1, edge ? WOOD[0] : WOOD[U.clamp(k, 1, 5)]);
    }
    P(x, 4, 13, 2, 2, WOOD[1]); P(x, 10, 13, 2, 2, WOOD[1]); P(x, 3, 14, 2, 1, WOOD[0]); P(x, 11, 14, 2, 1, WOOD[0]);
  },
  rock(x, f, v) {
    Obj.shadow(x, 9, 13, 7, 2, 0.32);
    Obj.blob(x, 8, 9.5, 6.5, 5, ROCKP, { outline: '#2a2430', noise: v + 1 });
    P(x, 5, 6, 2, 1, ROCKP[5]); P(x, 4, 7, 1, 1, ROCKP[5]); P(x, 9, 11, 3, 1, ROCKP[1]); P(x, 8, 8, 1, 2, ROCKP[2]);
    if (v !== 1) { P(x, 3, 12, 3, 1, '#3c7a34'); P(x, 4, 11, 1, 1, '#5aa04a'); P(x, 12, 12, 2, 1, '#3c7a34'); }
  },
  ashrock(x, f, v) {
    Obj.shadow(x, 9, 13, 7, 2, 0.32);
    Obj.blob(x, 8, 9.5, 6.5, 5, ASHROCKP, { outline: '#141012', noise: v + 3 });
    P(x, 5, 6, 2, 1, ASHROCKP[4]); P(x, 10, 10, 2, 1, '#c84a20'); P(x, 11, 10, 1, 1, '#ff8a30');
  },
  caverock(x, f, v) {
    Obj.shadow(x, 9, 14, 7, 2, 0.4);
    Obj.blob(x, 8, 11, 6.5, 4, CAVEROCKP, { outline: '#140e14', noise: v + 5 });
    for (let y = 1; y < 10; y++) { const ww = Math.max(1, Math.round((y + 1) / 2.6)); P(x, 8 - ww, y, ww * 2, 1, CAVEROCKP[y < 4 ? 4 : 3]); P(x, 8 - ww, y, 1, 1, CAVEROCKP[1]); P(x, 8 + ww - 1, y, 1, 1, CAVEROCKP[2]); }
  },
  crackrock(x) {
    Obj.shadow(x, 9, 14, 8, 2, 0.3);
    Obj.blob(x, 8, 9, 7, 6, ROCKP, { outline: '#2a2430', noise: 9 });
    const ink = '#2a2430';
    P(x, 7, 3, 1, 3, ink); P(x, 8, 6, 1, 2, ink); P(x, 6, 8, 2, 1, ink); P(x, 5, 9, 1, 3, ink); P(x, 9, 8, 3, 1, ink); P(x, 11, 9, 1, 2, ink);
    P(x, 8, 3, 1, 3, ROCKP[5]); P(x, 9, 7, 1, 1, ROCKP[5]);
  },
  cavecrack(x) { Obj.draw.crackrock(x); },
  sign(x) {
    Obj.shadow(x, 9, 14, 5, 1, 0.3);
    P(x, 7, 9, 2, 6, WOOD[1]); P(x, 7, 9, 1, 6, WOOD[3]);
    P(x, 2, 2, 12, 8, WOOD[0]); P(x, 3, 3, 10, 6, WOOD[3]); P(x, 3, 3, 10, 1, WOOD[5]); P(x, 3, 8, 10, 1, WOOD[2]);
    P(x, 4, 4, 1, 1, WOOD[1]); P(x, 11, 4, 1, 1, WOOD[1]); P(x, 5, 5, 6, 1, WOOD[1]); P(x, 5, 7, 4, 1, WOOD[1]);
  },
  fence(x) {
    for (const y of [6, 10]) { P(x, 0, y, 16, 2, '#f0e6d2'); P(x, 0, y, 16, 1, '#ffffff'); P(x, 0, y + 2, 16, 1, '#9a8a6c'); }
    for (const px of [2, 11]) { x.globalAlpha = 0.25; P(x, px + 1, 14, 4, 2, '#000'); x.globalAlpha = 1; P(x, px, 3, 3, 12, '#e8dcc4'); P(x, px, 3, 1, 12, '#ffffff'); P(x, px + 2, 4, 1, 11, '#a89878'); P(x, px, 2, 3, 1, '#c8b898'); }
  },
  lamp(x, f) {
    Obj.shadow(x, 8, 15, 4, 1, 0.3);
    P(x, 7, 5, 2, 10, '#2a2a36'); P(x, 7, 5, 1, 10, '#4a4a5a'); P(x, 6, 14, 4, 2, '#20202a');
    P(x, 4, 0, 8, 1, '#20202a'); P(x, 5, 1, 6, 4, '#2a2a36'); P(x, 6, 1, 4, 3, f ? '#ffe890' : '#b8c4d0');
    if (f) { P(x, 6, 1, 2, 1, '#ffffff'); P(x, 7, 2, 2, 1, '#fff4c0'); }
    P(x, 7, 5, 2, 1, '#4a4a5a');
  },
  bench(x) {
    x.globalAlpha = 0.25; P(x, 2, 13, 14, 2, '#000'); x.globalAlpha = 1;
    P(x, 1, 4, 14, 3, WOOD[1]); P(x, 1, 4, 14, 1, WOOD[4]); P(x, 1, 5, 14, 1, WOOD[3]);
    P(x, 1, 8, 14, 3, WOOD[1]); P(x, 1, 8, 14, 1, WOOD[5]); P(x, 1, 9, 14, 1, WOOD[3]);
    P(x, 2, 11, 2, 3, '#3a3a48'); P(x, 12, 11, 2, 3, '#3a3a48'); P(x, 2, 7, 1, 1, '#3a3a48'); P(x, 13, 7, 1, 1, '#3a3a48');
  },
  barrel(x) {
    Obj.shadow(x, 9, 14, 6, 2, 0.3);
    for (let y = 2; y < 15; y++) { const ww = y < 4 || y > 12 ? 4 : 5; for (let i = 8 - ww; i < 8 + ww; i++) { const l = (i - (8 - ww)) / (ww * 2); P(x, i, y, 1, 1, WOOD[l < 0.2 ? 4 : l < 0.55 ? 3 : l < 0.85 ? 2 : 1]); } }
    P(x, 3, 4, 10, 1, '#3a3a48'); P(x, 3, 11, 10, 1, '#3a3a48'); P(x, 4, 2, 8, 1, WOOD[0]); P(x, 5, 2, 6, 1, WOOD[2]);
  },
  mailbox(x) {
    Obj.shadow(x, 8, 15, 4, 1, 0.3);
    P(x, 7, 8, 2, 7, WOOD[1]); P(x, 3, 2, 10, 7, '#8a2020'); P(x, 4, 2, 8, 6, '#c83838'); P(x, 4, 2, 8, 1, '#f06060'); P(x, 4, 3, 1, 4, '#e04848');
    P(x, 11, 0, 1, 4, '#e8e8e8'); P(x, 11, 0, 3, 2, '#f0d040');
  },
  planter(x, f, v) {
    x.globalAlpha = 0.25; P(x, 2, 14, 14, 2, '#000'); x.globalAlpha = 1;
    P(x, 1, 9, 14, 6, '#6a3a20'); P(x, 2, 9, 12, 5, '#9a5a30'); P(x, 2, 9, 12, 1, '#c07a48');
    Obj.blob(x, 8, 7, 7, 3, HEDGEP);
    const cols = ['#f8607a', '#ffd040', '#ffffff', '#b07ef0'];
    for (let i = 0; i < 5; i++) { P(x, 2 + i * 3, 5 + (i % 2), 2, 2, cols[(i + v) % 4]); P(x, 2 + i * 3, 5 + (i % 2), 1, 1, '#ffffff'); }
  },
  flower(x, f, v) {
    const sets = [['#f04868', '#ffb0c0', '#ffe070'], ['#f0f0ff', '#ffffff', '#f0c030'], ['#9a5ae8', '#d0b0ff', '#ffe070'], ['#f8a020', '#ffd080', '#c04010']];
    const fl = (cx, cy, s) => {
      const [pc, hl, cc] = sets[s % sets.length], X = cx + (f ? 1 : 0);
      P(x, cx, cy + 2, 1, 3, '#2c6a2c'); P(x, cx + 1, cy + 3, 2, 1, '#3c8a3a');
      P(x, X - 1, cy - 1, 3, 3, pc); P(x, X, cy - 2, 1, 1, pc); P(x, X - 2, cy, 1, 1, pc); P(x, X + 2, cy, 1, 1, pc); P(x, X, cy + 2, 1, 1, U.shade(pc, -0.2));
      P(x, X - 1, cy - 1, 1, 1, hl); P(x, X, cy, 1, 1, cc);
    };
    fl(4, 4, v); fl(11, 8, v + 1); fl(5, 11, v + 2);
  },
  tall(x, f, v) {
    const dry = v >= 3, r = mulberry(40 + v * 23);
    const pals = dry ? [['#5a4a24', '#8a7436', '#c8ae5a', '#ecd890'], ['#4e4020', '#7a6630', '#b49a4c', '#dcc47a']] : [['#163a20', '#2a6c30', '#4a9a44', '#9ad874'], ['#123220', '#24602c', '#3e8a3e', '#86c866']];
    for (let row = 0; row < 3; row++) {
      const by = 6 + row * 5, pal = pals[row % 2];
      for (let k = 0; k < 7; k++) {
        const bx = Math.floor(r() * 16), hgt = 4 + Math.floor(r() * 3), lean = (r() < 0.5 ? -1 : 1) * (f ? -1 : 1) * (r() < 0.7 ? 1 : 0);
        for (let i = 0; i < hgt; i++) P(x, U.clamp(bx + Math.round((lean * i) / 3), 0, 15), Math.min(15, by - i), 1, 1, i === 0 ? pal[0] : i < hgt - 2 ? pal[1] : i < hgt - 1 ? pal[2] : pal[3]);
      }
    }
  },
  tall_top(x, f) {
    for (let k = 0; k < 6; k++) {
      const bx = (k * 3) % 16, lean = (k % 2 ? 1 : -1) * (f ? -1 : 1);
      for (let i = 0; i < 6; i++) P(x, U.clamp(bx + Math.round((lean * i) / 4), 0, 15), 15 - i, 1, 1, i < 2 ? '#163a20' : i < 5 ? '#2e7432' : '#6abc52');
    }
  },
  cutbush(x) {
    Obj.shadow(x, 9, 14, 7, 2, 0.3);
    Obj.blob(x, 8, 8.5, 7, 6.5, HEDGEP, { outline: HEDGEP[0], noise: 4 });
    for (let i = 0; i < 9; i++) { const px = 3 + ((i * 5) % 10), py = 4 + ((i * 3) % 8); P(x, px, py, 2, 1, HEDGEP[(i % 2) ? 5 : 2]); }
    P(x, 4, 10, 1, 1, '#f05050'); P(x, 11, 6, 1, 1, '#f05050');
  },
  ladder(x) {
    P(x, 2, 2, 12, 13, '#0e0a0e'); P(x, 3, 3, 10, 11, '#000000');
    P(x, 4, 0, 2, 16, WOOD[2]); P(x, 10, 0, 2, 16, WOOD[2]); P(x, 4, 0, 1, 16, WOOD[4]); P(x, 10, 0, 1, 16, WOOD[4]);
    for (let y = 2; y < 16; y += 4) { P(x, 5, y, 6, 2, WOOD[3]); P(x, 5, y, 6, 1, WOOD[5]); }
  },
  bridge(x, f, v) {
    if (v === 0) { for (let i = 0; i < 16; i += 4) { P(x, i, 1, 4, 14, WOOD[2 + ((i >> 2) % 2)]); P(x, i, 1, 1, 14, WOOD[1]); P(x, i + 1, 1, 2, 1, WOOD[5]); } P(x, 0, 0, 16, 2, WOOD[1]); P(x, 0, 14, 16, 2, WOOD[0]); P(x, 0, 0, 16, 1, WOOD[4]); }
    else { for (let j = 0; j < 16; j += 4) { P(x, 1, j, 14, 4, WOOD[2 + ((j >> 2) % 2)]); P(x, 1, j + 3, 14, 1, WOOD[1]); P(x, 1, j, 14, 1, WOOD[5]); } P(x, 0, 0, 2, 16, WOOD[1]); P(x, 14, 0, 2, 16, WOOD[0]); }
  },
  dock(x, f, v) { Obj.draw.bridge(x, f, v); for (const [px, py] of [[1, 1], [13, 1], [1, 13], [13, 13]]) P(x, px, py, 2, 2, WOOD[0]); },
  cavemouth(x) {
    for (let y = 3; y < 16; y++) { const ww = y < 5 ? 3 + (y - 3) * 2 : 6; P(x, 8 - ww, y, ww * 2, 1, y < 6 ? '#1a1210' : '#000000'); }
    P(x, 2, 6, 1, 10, '#3a2a20'); P(x, 13, 6, 1, 10, '#3a2a20'); P(x, 5, 3, 6, 1, '#3a2a20');
  },
  waterfx(x, f, v) {
    const r = mulberry(300 + v * 13);
    for (let i = 0; i < 3; i++) {
      const bx = Math.floor(r() * 12), by = 1 + Math.floor(r() * 14), ph = (f + i) % 4;
      if (ph === 0) P(x, bx, by, 3, 1, 'rgba(220,245,255,0.7)');
      else if (ph === 1) { P(x, bx + 1, by, 3, 1, 'rgba(220,245,255,0.5)'); P(x, bx + 2, by - 1, 1, 1, 'rgba(255,255,255,0.8)'); }
      else if (ph === 2) P(x, bx + 2, by, 2, 1, 'rgba(220,245,255,0.3)');
    }
  },
  lavafx(x, f, v) {
    const r = mulberry(700 + v * 17);
    for (let i = 0; i < 4; i++) {
      const bx = Math.floor(r() * 14), by = 1 + Math.floor(r() * 14), ph = (f + i) % 3;
      P(x, bx, by, 2, 1, ph === 0 ? 'rgba(255,230,120,0.9)' : ph === 1 ? 'rgba(255,160,40,0.7)' : 'rgba(255,90,20,0.4)');
      if (ph === 0) P(x, bx, by - 1, 1, 1, 'rgba(255,255,200,0.8)');
    }
  },
});
TileDraw.tallgrass_top = (x, f) => Obj.draw.tall_top(x, f);

// objeto que corresponde a cada tipo de casilla (sin suelo)
const OBJ_OF = { tree: 'trunk', rock: 'rock', ashrock: 'ashrock', caverock: 'caverock', crackrock: 'crackrock', cavecrack: 'cavecrack', sign: 'sign', ashsign: 'sign', fence: 'fence', bench: 'bench', barrel: 'barrel', mailbox: 'mailbox', planter: 'planter', cutbush: 'cutbush', ladder: 'ladder', bridge: 'bridge', dock: 'dock', cavemouth: 'cavemouth' };
const LIVE_OBJ = new Set(['flower', 'tallgrass', 'lamp', 'ashlamp', 'water', 'cavewater', 'lava']);

// ---------- copas de árbol mejoradas ----------
Canopy.get = function (v) {
  const key = 'n' + v;
  if (this.cache[key]) return this.cache[key];
  const Wc = 26, Hc = 24, R = new Raster(Wc, Hc);
  const tones = [
    ['#d4f2a0', '#a6e07a', '#76c458', '#4ea244', '#337e38', '#1f5a2c', '#143e22'],
    ['#dcf4a8', '#b0e480', '#82cc5c', '#58aa48', '#3a8a3c', '#24622e', '#163f22'],
    ['#c8eaa0', '#94d478', '#64b45a', '#428e48', '#2a6c3a', '#1a4c2e', '#10341f'],
  ][v % 3];
  const rr = mulberry(900 + v * 37);
  const blobs = [[13, 12, 11, 9.5]];
  for (let i = 0; i < 6; i++) { const a = rr() * Math.PI * 2, d = 4 + rr() * 4; blobs.push([13 + Math.cos(a) * d, 11 + Math.sin(a) * d * 0.8, 4 + rr() * 3, 3.5 + rr() * 2.5]); }
  const inside = (x, y) => blobs.some(([cx, cy, rx, ry]) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1; });
  for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) {
    if (!inside(x, y)) continue;
    // luz: global (arriba-izquierda) + racimos de hojas
    const gx = (x - 13) / 12, gy = (y - 11) / 10;
    let l = 0.62 - gx * 0.35 - gy * 0.55;
    let best = 9;
    for (const [cx, cy, rx, ry] of blobs) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, dd = dx * dx + dy * dy; if (dd <= 1 && dd < best) { best = dd; l += (-(dx * 0.5 + dy * 0.7)) * 0.25; } }
    l += (hash2(x * 7 + v, y * 11) - 0.5) * 0.22 + BAYER[(y & 3) * 4 + (x & 3)] * 0.3;
    let i = U.clamp(Math.floor((1 - l) * (tones.length - 2)), 0, tones.length - 2);
    if (!inside(x, y + 1) || !inside(x, y + 2)) i = Math.max(i, 4);
    R.set(x, y, tones[i]);
  }
  // racimos de hojas: pequeños arcos claros y huecos oscuros
  for (let k = 0; k < 18; k++) {
    const x = 3 + Math.floor(rr() * 20), y = 2 + Math.floor(rr() * 16);
    if (!inside(x, y) || !inside(x + 2, y + 1)) continue;
    const top = y < 11 && x < 15;
    R.set(x, y, tones[top ? 0 : 2]); R.set(x + 1, y, tones[top ? 1 : 3]); R.set(x + 1, y + 1, tones[5]); R.set(x + 2, y + 1, tones[5]);
  }
  if (v % 7 === 4) for (let i = 0; i < 4; i++) { const x = 6 + Math.floor(rr() * 14), y = 6 + Math.floor(rr() * 10); if (inside(x, y)) { R.set(x, y, '#e83c3c'); R.set(x, y - 1, '#ff9a8a'); } }
  // contorno
  for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) {
    if (inside(x, y)) continue;
    if (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1)) R.set(x, y, tones[6]);
  }
  const c = R.toCanvas();
  this.cache[key] = c;
  return c;
};
