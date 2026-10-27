'use strict';
// ============================================================
//  Tiles mejorados (sustituyen a los básicos de gfx.js)
//  - Árboles con copa en capa superior (profundidad)
//  - Pasto, agua, flores y caminos con más detalle
//  - Decoración: faroles, bancas, barriles, buzones, macetas
// ============================================================

Object.assign(PAL, {
  g0: '#b8ec8c', g1: '#9cdc78', g2: '#80c860', g3: '#68b04e', g4: '#4e9442', g5: '#357434',
});

function grassBase2(x, v = 0, seed = 0) {
  P(x, 0, 0, 16, 16, PAL.g2);
  const r = mulberry(101 + v * 37 + seed);
  // manchas suaves de tono
  for (let i = 0; i < 3; i++) { const px = Math.floor(r() * 12), py = Math.floor(r() * 12); P(x, px, py, 4 + Math.floor(r() * 3), 3, r() < 0.5 ? PAL.g1 : PAL.g3); }
  // briznas
  for (let i = 0; i < 9; i++) {
    const px = Math.floor(r() * 15), py = 1 + Math.floor(r() * 14);
    P(x, px, py, 1, 1, PAL.g4); P(x, px, py - 1, 1, 1, PAL.g3);
    if (r() < 0.4) P(x, px + 1, py - 1, 1, 1, PAL.g1);
  }
  for (let i = 0; i < 4; i++) P(x, Math.floor(r() * 16), Math.floor(r() * 16), 1, 1, PAL.g0);
  if (v === 2) { const fx = 3 + Math.floor(r() * 9), fy = 3 + Math.floor(r() * 9); P(x, fx, fy, 1, 1, r() < 0.5 ? '#ffffff' : '#fff090'); P(x, fx + 5 > 15 ? fx - 4 : fx + 4, fy + 2 > 15 ? fy - 3 : fy + 2, 1, 1, '#f8f8ff'); }
}

Object.assign(TileDraw, {
  grass: (x, f, v) => grassBase2(x, v),
  tallgrass(x, f) {
    P(x, 0, 0, 16, 16, '#5aa848');
    const blade = (bx, by, h, lean, c) => { for (let i = 0; i < h; i++) P(x, bx + Math.round((lean * i) / h), by - i, 1, 1, c); };
    const o = f ? 1 : 0;
    for (let row = 0; row < 3; row++) {
      const by = 6 + row * 5;
      for (let k = 0; k < 6; k++) {
        const bx = ((k * 3 + row * 2) % 16);
        blade(bx, by + 1, 6, (k % 2 ? 1 : -1) + (row === 1 ? o : -o), '#2f7a34');
        blade(bx + 1, by, 5, (k % 2 ? -1 : 1) + o, '#46963e');
        P(x, bx + 1 + (k % 2 ? -1 : 1) + o, by - 4, 1, 1, '#9ee070');
      }
    }
    P(x, 0, 15, 16, 1, '#2a6a30');
  },
  tallgrass_top(x, f) {
    const o = f ? 1 : 0;
    for (let k = 0; k < 6; k++) {
      const bx = (k * 3 + 1) % 16;
      for (let i = 0; i < 5; i++) P(x, bx + Math.round(((k % 2 ? 1 : -1) * i) / 5) + (i > 2 ? o : 0), 15 - i, 1, 1, i < 2 ? '#2f7a34' : '#46963e');
      P(x, bx + o, 10, 1, 1, '#9ee070');
    }
  },
  path(x, f, v) {
    P(x, 0, 0, 16, 16, '#e0c890');
    const r = mulberry(211 + v * 17);
    for (let i = 0; i < 5; i++) { const px = Math.floor(r() * 13), py = Math.floor(r() * 13); P(x, px, py, 3, 2, '#d4ba80'); }
    for (let i = 0; i < 6; i++) { const px = Math.floor(r() * 15), py = Math.floor(r() * 15); P(x, px, py + 1, 2, 1, '#b89a68'); P(x, px, py, 2, 1, '#f0dcb0'); }
    if (v === 1) { P(x, 6, 7, 3, 2, '#a89078'); P(x, 6, 7, 2, 1, '#d0c0a8'); }
  },
  water(x, f) {
    // degradado de profundidad y olas que se desplazan
    P(x, 0, 0, 16, 16, '#3e86d8');
    P(x, 0, 8, 16, 8, '#3a7ccc');
    const o = f * 3;
    const wave = (y, x0, len, c) => { for (let i = 0; i < len; i++) P(x, (x0 + i + o) % 16, y + (i > len / 2 ? 0 : 0), 1, 1, c); };
    wave(3, 2, 5, '#78b8f0'); wave(4, 7, 3, '#5aa0e8');
    wave(10, 9, 5, '#78b8f0'); wave(11, 14, 3, '#5aa0e8');
    P(x, (12 + o * 2) % 16, 6, 1, 1, '#d8f0ff'); P(x, (4 + o * 2) % 16, 13, 1, 1, '#d8f0ff');
  },
  flower(x, f, v) {
    grassBase2(x, 0, v * 7);
    const sets = [['#f8607a', '#fff2a0'], ['#ffffff', '#ffd040'], ['#b07ef0', '#fff2a0']];
    const [pc, cc] = sets[v % 3];
    const fl = (cx, cy) => {
      cx += f;
      P(x, cx - f, cy + 2, 1, 3, PAL.g5); P(x, cx - f + 1, cy + 3, 1, 1, PAL.g4);
      P(x, cx, cy - 1, 1, 1, pc); P(x, cx - 1, cy, 1, 1, pc); P(x, cx + 1, cy, 1, 1, pc); P(x, cx, cy + 1, 1, 1, U.shade(pc, -0.15));
      P(x, cx, cy, 1, 1, cc);
    };
    fl(4, 4); fl(11, 9); fl(5, 12);
  },
  // tronco y suelo; la copa se dibuja en la capa superior
  tree(x, f, v) {
    grassBase2(x, v);
    x.globalAlpha = 0.35; P(x, 1, 11, 14, 4, '#1c3a20'); P(x, 3, 10, 10, 6, '#1c3a20'); x.globalAlpha = 1;
    P(x, 6, 6, 4, 9, '#7a4e2c'); P(x, 6, 6, 1, 9, '#9a6a3c'); P(x, 9, 6, 1, 9, '#5a3820');
    P(x, 5, 14, 2, 1, '#5a3820'); P(x, 9, 14, 2, 1, '#5a3820');
  },
  rock(x, f, v) {
    grassBase2(x, v);
    x.globalAlpha = 0.3; P(x, 3, 12, 12, 3, '#000'); x.globalAlpha = 1;
    P(x, 2, 5, 12, 9, PAL.rock4); P(x, 3, 4, 10, 1, PAL.rock4);
    P(x, 3, 5, 10, 8, PAL.rock3); P(x, 3, 5, 8, 5, PAL.rock2); P(x, 4, 5, 4, 2, PAL.rock1); P(x, 9, 10, 3, 1, PAL.rock4); P(x, 6, 8, 1, 3, PAL.rock4);
  },
  sign(x, f, v) {
    grassBase2(x, v);
    x.globalAlpha = 0.3; P(x, 4, 14, 9, 2, '#000'); x.globalAlpha = 1;
    P(x, 7, 9, 2, 6, PAL.wood4); P(x, 2, 2, 12, 8, '#4a3020'); P(x, 3, 3, 10, 6, PAL.wood2); P(x, 3, 3, 10, 1, PAL.wood1);
    P(x, 5, 5, 6, 1, '#6a4a2a'); P(x, 5, 7, 4, 1, '#6a4a2a');
  },
  fence(x, f, v) {
    grassBase2(x, v);
    P(x, 0, 6, 16, 2, '#fbf4e4'); P(x, 0, 10, 16, 2, '#fbf4e4'); P(x, 0, 8, 16, 1, '#b8a890'); P(x, 0, 12, 16, 1, '#b8a890');
    for (const px of [2, 12]) { P(x, px, 3, 3, 11, '#fffaf0'); P(x, px + 2, 4, 1, 10, '#c8b8a0'); P(x, px, 14, 3, 1, PAL.g5); P(x, px, 2, 3, 1, '#d8c8b0'); }
  },
  lamp(x, f, v) {
    grassBase2(x, v);
    x.globalAlpha = 0.3; P(x, 5, 14, 7, 2, '#000'); x.globalAlpha = 1;
    P(x, 7, 4, 2, 11, '#3a3a48'); P(x, 7, 4, 1, 11, '#5a5a6a'); P(x, 6, 14, 4, 1, '#2a2a38');
    P(x, 5, 0, 6, 1, '#2a2a38'); P(x, 5, 1, 6, 4, '#3a3a48'); P(x, 6, 1, 4, 3, f ? '#ffe890' : '#c8d0d8'); P(x, 6, 1, 1, 1, '#ffffff');
  },
  bench(x, f, v) {
    grassBase2(x, v);
    x.globalAlpha = 0.3; P(x, 1, 12, 15, 3, '#000'); x.globalAlpha = 1;
    P(x, 1, 5, 14, 2, PAL.wood3); P(x, 1, 5, 14, 1, PAL.wood1); P(x, 1, 8, 14, 3, PAL.wood2); P(x, 1, 8, 14, 1, PAL.wood1);
    P(x, 2, 11, 2, 3, '#4a4a58'); P(x, 12, 11, 2, 3, '#4a4a58');
  },
  barrel(x, f, v) {
    grassBase2(x, v);
    x.globalAlpha = 0.3; P(x, 3, 13, 11, 3, '#000'); x.globalAlpha = 1;
    P(x, 3, 2, 10, 12, '#6a4428'); P(x, 4, 2, 8, 12, '#9a6a3c'); P(x, 5, 2, 3, 12, '#b8844c');
    P(x, 3, 4, 10, 1, '#4a4a58'); P(x, 3, 11, 10, 1, '#4a4a58'); P(x, 4, 1, 8, 2, '#7a5030');
  },
  mailbox(x, f, v) {
    grassBase2(x, v);
    P(x, 7, 8, 2, 7, PAL.wood4); P(x, 3, 2, 10, 7, '#c03838'); P(x, 3, 2, 10, 2, '#e05050'); P(x, 11, 0, 1, 4, '#e8e8e8'); P(x, 11, 0, 3, 2, '#f0d040');
  },
  planter(x, f, v) {
    grassBase2(x, v);
    P(x, 1, 9, 14, 6, '#8a5030'); P(x, 1, 9, 14, 1, '#b06a40');
    const cols = ['#f8607a', '#ffd040', '#ffffff', '#b07ef0'];
    for (let i = 0; i < 5; i++) { P(x, 2 + i * 3, 6 + (i % 2), 2, 2, cols[(i + v) % 4]); P(x, 2 + i * 3, 8, 2, 1, PAL.g4); }
  },
  cliff(x, f, v) {
    P(x, 0, 0, 16, 16, '#b48c64');
    P(x, 0, 0, 16, 3, '#8ac060'); P(x, 0, 3, 16, 1, '#5a8a40');
    const r = mulberry(7 + v);
    for (let i = 0; i < 3; i++) { const y = 5 + i * 4 + Math.floor(r() * 2); P(x, 0, y, 16, 1, '#8c6a48'); P(x, Math.floor(r() * 10), y + 1, 6, 1, '#d4b088'); }
    P(x, 0, 15, 16, 1, '#5e4630');
  },
});
TILEDEF['l'] = { t: 'lamp', solid: true, light: true };
TILEDEF['y'] = { t: 'bench', solid: true };
TILEDEF['O'] = { t: 'barrel', solid: true };
TILEDEF['Q'] = { t: 'mailbox', solid: true };
TILEDEF['E'] = { t: 'planter', solid: true };
TILEDEF['T'].canopy = true;

// copas de árbol (24x22) en varias formas y tonos
const Canopy = {
  cache: {},
  get(v) {
    if (this.cache[v]) return this.cache[v];
    const R = new Raster(24, 22);
    const tones = [
      ['#a8e080', '#76c45c', '#4ea24a', '#2f7a3a', '#1c5430'],
      ['#b8e488', '#84cc60', '#58aa48', '#36843a', '#1e5a30'],
      ['#98d47a', '#66b45a', '#428e48', '#286a38', '#164a2c'],
    ][v % 3];
    const blobs = [[12, 10, 10, 9], [7, 12, 6, 6], [17, 12, 6, 6], [12, 6, 7, 5]];
    const rr = mulberry(500 + v * 11);
    for (const [cx, cy, rx, ry] of blobs) {
      for (let y = 0; y < 22; y++) for (let x = 0; x < 24; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
        if (d > 1) continue;
        const lit = -(dx * 0.55 + dy * 0.85);
        let c = tones[2];
        if (lit > 0.55 && d < 0.55) c = tones[0]; else if (lit > 0.15) c = tones[1]; else if (lit < -0.45 && d > 0.3) c = tones[3];
        R.set(x, y, c);
      }
    }
    // textura de hojas
    for (let i = 0; i < 26; i++) { const x = Math.floor(rr() * 22) + 1, y = Math.floor(rr() * 18) + 1; if (R.get(x, y)) { R.set(x, y, rr() < 0.5 ? tones[0] : tones[3]); } }
    if (v === 4) for (let i = 0; i < 4; i++) { const x = 5 + Math.floor(rr() * 14), y = 5 + Math.floor(rr() * 10); if (R.get(x, y)) { R.set(x, y, '#f05050'); R.set(x, y - 1, '#ff9090'); } }
    // contorno
    const filled = R.c.map((c) => !!c);
    for (let y = 0; y < 22; y++) for (let x = 0; x < 24; x++) {
      if (filled[y * 24 + x]) continue;
      const n = (a, b) => a >= 0 && b >= 0 && a < 24 && b < 22 && filled[b * 24 + a];
      if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) R.set(x, y, tones[4]);
    }
    this.cache[v] = R.toCanvas();
    return this.cache[v];
  },
};

// ventanas de los edificios (para iluminarlas de noche)
const _bget = Buildings.get.bind(Buildings);
Buildings.get = function (style, w, h, doorX) {
  const c = _bget(style, w, h, doorX);
  if (!c.windows) {
    const ph = h * 16, roofH = Math.round(ph * (h >= 5 ? 0.5 : 0.56)), winY = roofH + 4, list = [];
    for (let tx = 0; tx < w; tx++) {
      if (tx === doorX || ((style === 'center' || style === 'mart' || style === 'gym') && Math.abs(tx - doorX) === 1 && w <= 5)) continue;
      if (ph - roofH < 18) continue;
      list.push({ x: tx * 16 + 4, y: winY, w: 8, h: 7 });
    }
    if (doorX >= 0 && ['center', 'mart', 'lab', 'gym'].includes(style)) list.push({ x: doorX * 16 + 4, y: ph - 13, w: 8, h: 12, door: true });
    c.windows = list;
    // jardinera bajo las ventanas de las casas
    if (style.startsWith('house')) {
      const x = c.getContext('2d');
      for (const wd of list) { P(x, wd.x - 1, wd.y + 9, 10, 2, '#8a5030'); P(x, wd.x, wd.y + 8, 2, 1, '#f8607a'); P(x, wd.x + 3, wd.y + 8, 2, 1, '#ffd040'); P(x, wd.x + 6, wd.y + 8, 2, 1, '#f8607a'); }
    }
  }
  return c;
};
