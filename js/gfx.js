'use strict';
// ============================================================
//  Gráficos procedurales: tiles, personajes, edificios, iconos, UI
//  (todo dibujado por código, sin imágenes externas)
// ============================================================

function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash2 = (x, y) => { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; };

const P = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

// paleta general
const PAL = {
  ink: '#1c1824',
  g1: '#a6e07e', g2: '#84c862', g3: '#64aa4c', g4: '#468a3c', g5: '#2e6a32',
  tg1: '#96d870', tg2: '#5cac48', tg3: '#3c8a3a', tg4: '#286a30',
  path1: '#f2e2b4', path2: '#e4cc94', path3: '#ccb07a', path4: '#a88a5a',
  sand1: '#fbefc4', sand2: '#f0dca4', sand3: '#d8c084',
  w1: '#bfe6ff', w2: '#6cb4f0', w3: '#4890e0', w4: '#3070c0', w5: '#205090',
  tr1: '#7ccc62', tr2: '#4ca64c', tr3: '#30803e', tr4: '#1c5a30', trunk: '#8a5a32', trunk2: '#5e3a20',
  wood1: '#e8b878', wood2: '#d09858', wood3: '#a87440', wood4: '#7a5030',
  rock1: '#d8d4cc', rock2: '#b0aaa0', rock3: '#888078', rock4: '#585048',
  cliff1: '#d4b088', cliff2: '#b48c64', cliff3: '#8c6a48', cliff4: '#5e4630',
  cave1: '#8a7c70', cave2: '#6e6258', cave3: '#544a42', cave4: '#3a322c',
};

// ---------- tiles ----------
const Tiles = {
  cache: {},
  get(key, frame = 0, variant = 0) {
    const k = key + ':' + frame + ':' + variant;
    if (!this.cache[k]) {
      const [c, x] = U.makeCanvas(TILE, TILE);
      const fn = TileDraw[key];
      if (fn) fn(x, frame, variant); else P(x, 0, 0, 16, 16, '#f0f');
      this.cache[k] = c;
    }
    return this.cache[k];
  },
};

function grassBase(x, v = 0) {
  P(x, 0, 0, 16, 16, PAL.g2);
  const r = mulberry(17 + v * 31);
  for (let i = 0; i < 10; i++) { P(x, Math.floor(r() * 16), Math.floor(r() * 16), 1, 1, r() < 0.5 ? PAL.g1 : PAL.g3); }
  // matas
  const tufts = v === 0 ? [[3, 4], [11, 11]] : v === 1 ? [[9, 3], [4, 12]] : [[12, 6], [2, 8], [8, 13]];
  for (const [tx, ty] of tufts) {
    P(x, tx, ty, 1, 2, PAL.g3); P(x, tx + 2, ty, 1, 2, PAL.g3); P(x, tx + 1, ty + 1, 1, 1, PAL.g3);
    P(x, tx, ty - 1, 1, 1, PAL.g1); P(x, tx + 2, ty - 1, 1, 1, PAL.g1);
  }
}

const TileDraw = {
  grass: (x, f, v) => grassBase(x, v),
  tallgrass(x, f) {
    P(x, 0, 0, 16, 16, PAL.tg2);
    const clump = (cx, cy) => {
      const o = f ? 1 : 0;
      // briznas
      P(x, cx, cy + 1, 7, 5, PAL.tg3);
      P(x, cx + 1, cy - 2 + o, 1, 4, PAL.tg3); P(x, cx + 3, cy - 3, 1, 5, PAL.tg3); P(x, cx + 5, cy - 2 - o, 1, 4, PAL.tg3);
      P(x, cx + 1, cy - 2 + o, 1, 1, PAL.tg1); P(x, cx + 3, cy - 3, 1, 1, PAL.tg1); P(x, cx + 5, cy - 2 - o, 1, 1, PAL.tg1);
      P(x, cx + 2, cy, 1, 3, PAL.tg1); P(x, cx + 4, cy, 1, 3, PAL.tg2);
      P(x, cx, cy + 5, 7, 1, PAL.tg4);
    };
    clump(0, 3); clump(8, 3); clump(4, 10); clump(-4, 10); clump(12, 10);
  },
  // capa superior de hierba alta: tapa los pies del personaje
  tallgrass_top(x, f) {
    const o = f ? 1 : 0;
    for (const cx of [-4, 4, 12]) {
      P(x, cx, 12, 7, 4, PAL.tg3);
      P(x, cx + 1, 10 + o, 1, 3, PAL.tg3); P(x, cx + 3, 9, 1, 4, PAL.tg3); P(x, cx + 5, 10 - o, 1, 3, PAL.tg3);
      P(x, cx + 1, 10 + o, 1, 1, PAL.tg1); P(x, cx + 3, 9, 1, 1, PAL.tg1); P(x, cx + 5, 10 - o, 1, 1, PAL.tg1);
      P(x, cx + 2, 12, 1, 3, PAL.tg1);
    }
  },
  path(x, f, v) {
    P(x, 0, 0, 16, 16, PAL.path2);
    const r = mulberry(91 + v * 7);
    for (let i = 0; i < 7; i++) {
      const px = Math.floor(r() * 15), py = Math.floor(r() * 15);
      P(x, px, py, 2, 1, PAL.path3); P(x, px, py - 1, 2, 1, PAL.path1);
    }
  },
  sand(x, f, v) {
    P(x, 0, 0, 16, 16, PAL.sand2);
    const r = mulberry(51 + v * 13);
    for (let i = 0; i < 8; i++) P(x, Math.floor(r() * 16), Math.floor(r() * 16), 1, 1, r() < 0.5 ? PAL.sand1 : PAL.sand3);
  },
  water(x, f) {
    P(x, 0, 0, 16, 16, PAL.w3);
    const o = f * 2;
    for (let i = 0; i < 3; i++) {
      const yy = (i * 6 + 2) % 16, xx = (i * 7 + o) % 16;
      P(x, xx, yy, 4, 1, PAL.w2); P(x, (xx + 4) % 16, yy + 1, 3, 1, PAL.w2);
      P(x, (xx + 9) % 16, (yy + 3) % 16, 2, 1, PAL.w1);
    }
    P(x, (5 + o) % 16, 13, 3, 1, PAL.w4);
  },
  tree(x, f, v) {
    grassBase(x, v);
    // sombra
    P(x, 2, 14, 12, 2, PAL.g4);
    P(x, 6, 11, 4, 4, PAL.trunk); P(x, 8, 11, 2, 4, PAL.trunk2);
    const blob = [[4, 0, 8], [2, 1, 12], [1, 2, 14], [0, 3, 16], [0, 4, 16], [0, 5, 16], [0, 6, 16], [0, 7, 16], [0, 8, 16], [1, 9, 14], [2, 10, 12], [4, 11, 8]];
    for (const [bx, by, bw] of blob) P(x, bx, by, bw, 1, PAL.tr4);
    const inner = [[5, 1, 6], [3, 2, 10], [2, 3, 12], [1, 4, 14], [1, 5, 14], [1, 6, 14], [1, 7, 14], [1, 8, 14], [2, 9, 12], [4, 10, 8]];
    for (const [bx, by, bw] of inner) P(x, bx, by, bw, 1, PAL.tr3);
    const mid = [[5, 2, 6], [3, 3, 9], [2, 4, 10], [2, 5, 10], [2, 6, 9], [3, 7, 7], [4, 8, 4]];
    for (const [bx, by, bw] of mid) P(x, bx, by, bw, 1, PAL.tr2);
    P(x, 4, 3, 3, 1, PAL.tr1); P(x, 3, 4, 2, 2, PAL.tr1); P(x, 9, 2, 2, 1, PAL.tr1); P(x, 8, 5, 1, 1, PAL.tr1);
    P(x, 11, 7, 2, 1, PAL.tr4); P(x, 6, 9, 3, 1, PAL.tr4);
  },
  flower(x, f, v) {
    grassBase(x, v);
    const cols = v % 2 ? ['#f86878', '#fff2a0'] : ['#ffffff', '#ffd040'];
    const fl = (cx, cy) => {
      cx += f;
      P(x, cx, cy - 1, 1, 1, cols[0]); P(x, cx - 1, cy, 1, 1, cols[0]); P(x, cx + 1, cy, 1, 1, cols[0]); P(x, cx, cy + 1, 1, 1, cols[0]);
      P(x, cx, cy, 1, 1, cols[1]); P(x, cx - f, cy + 2, 1, 2, PAL.g4);
    };
    fl(4, 4); fl(11, 10);
  },
  fence(x, f, v) {
    grassBase(x, v);
    P(x, 0, 5, 16, 2, '#f8f0e0'); P(x, 0, 9, 16, 2, '#f8f0e0'); P(x, 0, 7, 16, 1, '#b8a890'); P(x, 0, 11, 16, 1, '#b8a890');
    for (const px of [2, 12]) { P(x, px, 2, 3, 12, '#fffaf0'); P(x, px + 2, 3, 1, 11, '#c8b8a0'); P(x, px, 14, 3, 1, PAL.g4); P(x, px, 1, 3, 1, '#c8b8a0'); }
  },
  sign(x, f, v) {
    grassBase(x, v);
    P(x, 7, 9, 2, 6, PAL.wood4); P(x, 5, 15, 6, 1, PAL.g4);
    P(x, 2, 2, 12, 8, PAL.wood4); P(x, 3, 3, 10, 6, PAL.wood2); P(x, 3, 3, 10, 1, PAL.wood1);
    P(x, 5, 5, 6, 1, PAL.wood3); P(x, 5, 7, 4, 1, PAL.wood3);
  },
  ledge(x, f, v) {
    grassBase(x, v);
    P(x, 0, 9, 16, 3, PAL.g4); P(x, 0, 12, 16, 2, PAL.g5); P(x, 0, 8, 16, 1, PAL.g1);
    for (let i = 0; i < 16; i += 4) P(x, i + 1, 10, 2, 1, PAL.g3);
  },
  rock(x, f, v) {
    grassBase(x, v);
    P(x, 2, 13, 12, 2, PAL.g4);
    P(x, 2, 4, 12, 10, PAL.rock4); P(x, 3, 3, 10, 1, PAL.rock4);
    P(x, 3, 4, 10, 9, PAL.rock3); P(x, 3, 4, 8, 6, PAL.rock2); P(x, 4, 4, 4, 2, PAL.rock1); P(x, 9, 9, 3, 1, PAL.rock4);
  },
  cliff(x, f, v) {
    P(x, 0, 0, 16, 16, PAL.cliff2);
    P(x, 0, 0, 16, 2, PAL.cliff1);
    const r = mulberry(7 + v);
    for (let i = 0; i < 4; i++) { const y = 3 + i * 3 + Math.floor(r() * 2); P(x, 0, y, 16, 1, PAL.cliff3); P(x, Math.floor(r() * 12), y + 1, 4, 1, PAL.cliff1); }
    P(x, 0, 15, 16, 1, PAL.cliff4);
  },
  bridge(x) {
    P(x, 0, 0, 16, 16, PAL.wood2);
    for (let y = 0; y < 16; y += 4) { P(x, 0, y + 3, 16, 1, PAL.wood4); P(x, 0, y, 16, 1, PAL.wood1); }
    P(x, 0, 0, 1, 16, PAL.wood4); P(x, 15, 0, 1, 16, PAL.wood4);
  },
  dock(x) {
    P(x, 0, 0, 16, 16, PAL.wood2);
    for (let i = 0; i < 16; i += 4) { P(x, i + 3, 0, 1, 16, PAL.wood4); P(x, i, 0, 1, 16, PAL.wood1); }
    P(x, 2, 5, 1, 1, PAL.wood4); P(x, 10, 12, 1, 1, PAL.wood4);
  },
  hedge(x, f, v) {
    grassBase(x, v);
    P(x, 0, 2, 16, 12, PAL.tr4); P(x, 1, 3, 14, 10, PAL.tr3); P(x, 1, 3, 14, 5, PAL.tr2);
    for (let i = 1; i < 15; i += 3) P(x, i, 3, 2, 1, PAL.tr1);
    P(x, 0, 14, 16, 2, PAL.g4);
  },
  // ---- cueva ----
  cave(x, f, v) {
    P(x, 0, 0, 16, 16, PAL.cave2);
    const r = mulberry(33 + v * 5);
    for (let i = 0; i < 6; i++) { const px = Math.floor(r() * 15), py = Math.floor(r() * 15); P(x, px, py, 2, 1, PAL.cave3); P(x, px, py - 1, 1, 1, PAL.cave1); }
  },
  cavewall(x, f, v) {
    P(x, 0, 0, 16, 16, PAL.cave3);
    const r = mulberry(61 + v);
    for (let i = 0; i < 5; i++) { const px = Math.floor(r() * 12), py = Math.floor(r() * 13); P(x, px, py, 5, 3, PAL.cave4); P(x, px, py, 4, 1, PAL.cave2); }
    P(x, 0, 15, 16, 1, PAL.cave4);
  },
  caverock(x, f, v) {
    TileDraw.cave(x, f, v);
    P(x, 2, 4, 12, 10, PAL.cave4); P(x, 3, 3, 10, 10, PAL.rock3); P(x, 3, 3, 8, 6, PAL.rock2); P(x, 4, 3, 4, 2, PAL.rock1);
  },
  ladder(x, f, v) {
    TileDraw.cave(x, f, v);
    P(x, 3, 1, 10, 14, PAL.cave4); P(x, 4, 1, 2, 14, PAL.wood3); P(x, 10, 1, 2, 14, PAL.wood3);
    for (let y = 3; y < 15; y += 3) P(x, 4, y, 8, 1, PAL.wood1);
  },
  cavewater(x, f) {
    P(x, 0, 0, 16, 16, '#2c4c80');
    const o = f * 2;
    P(x, (2 + o) % 16, 4, 4, 1, '#4878b8'); P(x, (9 + o) % 16, 10, 4, 1, '#4878b8'); P(x, (12 + o) % 16, 2, 2, 1, '#78a8e0');
  },
  // ---- interiores ----
  floor(x, f, v) {
    P(x, 0, 0, 16, 16, PAL.wood1);
    for (let y = 0; y < 16; y += 4) { P(x, 0, y + 3, 16, 1, PAL.wood2); P(x, ((y * 5) % 16), y, 1, 3, PAL.wood2); }
  },
  tilefloor(x) {
    P(x, 0, 0, 16, 16, '#ece6da'); P(x, 0, 0, 8, 8, '#e0d8c8'); P(x, 8, 8, 8, 8, '#e0d8c8');
    P(x, 0, 15, 16, 1, '#d0c8b8'); P(x, 15, 0, 1, 16, '#d0c8b8');
  },
  wall(x) {
    P(x, 0, 0, 16, 16, '#f2ead8');
    for (let i = 0; i < 16; i += 4) P(x, i + 1, 0, 1, 11, '#e4d8c0');
    P(x, 0, 11, 16, 1, '#c8b898'); P(x, 0, 12, 16, 3, '#a88c68'); P(x, 0, 15, 16, 1, '#7a6048');
  },
  wallwindow(x) {
    TileDraw.wall(x);
    P(x, 3, 2, 10, 7, '#8a7050'); P(x, 4, 3, 8, 5, '#a8dcf8'); P(x, 4, 3, 3, 2, '#e0f4ff'); P(x, 7, 3, 1, 5, '#8a7050');
  },
  mat(x) {
    TileDraw.floor(x);
    P(x, 1, 4, 14, 9, '#a03838'); P(x, 2, 5, 12, 7, '#d05050'); P(x, 3, 6, 10, 1, '#f08070');
  },
  rug(x) { P(x, 0, 0, 16, 16, '#5878c0'); P(x, 1, 1, 14, 14, '#6890d8'); P(x, 3, 3, 10, 10, '#5878c0'); },
  counter(x) {
    P(x, 0, 0, 16, 16, PAL.wood3); P(x, 0, 0, 16, 6, '#f4ece0'); P(x, 0, 5, 16, 1, '#c8baa4');
    P(x, 0, 6, 16, 10, PAL.wood2); P(x, 0, 6, 16, 1, PAL.wood4); P(x, 0, 15, 16, 1, PAL.wood4);
  },
  shelf(x) {
    P(x, 0, 0, 16, 16, PAL.wood4); P(x, 1, 1, 14, 14, PAL.wood3);
    const cols = ['#d04848', '#4878d0', '#48a058', '#e0b040', '#9058c0'];
    for (const sy of [2, 9]) {
      let px = 2; let i = sy;
      while (px < 14) { const w = 1 + ((i * 7) % 2); P(x, px, sy, w, 5, cols[i % 5]); P(x, px, sy, w, 1, '#fff8'); px += w + (i % 3 === 0 ? 1 : 0); i++; }
      P(x, 1, sy + 5, 14, 1, PAL.wood4);
    }
  },
  table(x) {
    TileDraw.floor(x);
    P(x, 1, 3, 14, 9, PAL.wood4); P(x, 1, 2, 14, 8, '#c08850'); P(x, 2, 3, 12, 2, '#d8a468');
    P(x, 2, 12, 2, 3, PAL.wood4); P(x, 12, 12, 2, 3, PAL.wood4);
  },
  pc(x) {
    TileDraw.tilefloor(x);
    P(x, 2, 1, 12, 13, '#585868'); P(x, 3, 2, 10, 7, '#283848'); P(x, 4, 3, 8, 5, '#58b8e8'); P(x, 4, 3, 3, 1, '#b8f0ff');
    P(x, 3, 10, 10, 3, '#9898a8'); P(x, 4, 11, 2, 1, '#e04848'); P(x, 2, 14, 12, 1, '#383848');
  },
  bed(x) {
    TileDraw.floor(x);
    P(x, 1, 0, 14, 16, PAL.wood4); P(x, 2, 1, 12, 14, '#f8f8f8'); P(x, 3, 1, 10, 4, '#ffffff'); P(x, 3, 4, 10, 1, '#d0d0e0');
    P(x, 2, 6, 12, 9, '#5888d8'); P(x, 2, 6, 12, 1, '#88b0f0');
  },
  tv(x) {
    TileDraw.floor(x);
    P(x, 1, 2, 14, 11, '#383040'); P(x, 2, 3, 10, 8, '#506878'); P(x, 3, 4, 4, 2, '#90b8c8'); P(x, 13, 4, 1, 1, '#e05050'); P(x, 13, 6, 1, 1, '#888');
    P(x, 3, 13, 10, 2, PAL.wood3);
  },
  plant(x) {
    TileDraw.floor(x);
    P(x, 4, 10, 8, 5, '#c06838'); P(x, 4, 10, 8, 1, '#e08850');
    P(x, 3, 2, 10, 8, PAL.tr3); P(x, 5, 1, 6, 2, PAL.tr2); P(x, 4, 3, 4, 3, PAL.tr2); P(x, 5, 3, 2, 1, PAL.tr1); P(x, 9, 5, 2, 2, PAL.tr1);
  },
  healer(x, f) {
    TileDraw.tilefloor(x);
    P(x, 1, 2, 14, 12, '#d8d0d8'); P(x, 1, 2, 14, 2, '#f0eaf0'); P(x, 1, 13, 14, 1, '#8a808a');
    for (let i = 0; i < 3; i++) { const lit = f > 0 && i === (f % 3); P(x, 3 + i * 4, 6, 3, 3, lit ? '#ff8098' : '#e05068'); P(x, 3 + i * 4, 6, 1, 1, '#ffd0d8'); }
  },
  stairs(x) {
    P(x, 0, 0, 16, 16, '#8a6a48');
    for (let y = 0; y < 16; y += 4) { P(x, 1, y, 14, 3, PAL.wood1); P(x, 1, y + 3, 14, 1, PAL.wood4); }
  },
  gymfloor(x, f, v) {
    P(x, 0, 0, 16, 16, '#c8c0b0'); P(x, 0, 0, 16, 1, '#e0d8c8'); P(x, 0, 0, 1, 16, '#e0d8c8'); P(x, 15, 0, 1, 16, '#a8a090'); P(x, 0, 15, 16, 1, '#a8a090');
    if (v === 1) P(x, 6, 6, 4, 4, '#b0a898');
  },
  statue(x) {
    TileDraw.gymfloor(x);
    P(x, 3, 11, 10, 4, '#787078'); P(x, 4, 10, 8, 2, '#9890a0');
    P(x, 5, 2, 6, 8, '#a8a0b0'); P(x, 6, 1, 4, 2, '#c8c0d0'); P(x, 6, 3, 1, 1, '#585060'); P(x, 9, 3, 1, 1, '#585060');
  },
  machine(x, f) {
    TileDraw.tilefloor(x);
    P(x, 1, 1, 14, 14, '#6a7488'); P(x, 2, 2, 12, 6, '#283040');
    const blink = f % 2;
    P(x, 3, 3, 3, 1, blink ? '#60f080' : '#30a050'); P(x, 3, 5, 6, 1, '#58c0f0'); P(x, 10, 4, 2, 2, blink ? '#f0d040' : '#a08020');
    P(x, 3, 10, 10, 3, '#9aa4b8'); P(x, 4, 11, 2, 1, '#283040'); P(x, 8, 11, 4, 1, '#283040');
  },
  void(x) { P(x, 0, 0, 16, 16, '#000'); },
  gymwall(x, f, v) {
    P(x, 0, 0, 16, 16, '#6a6478'); P(x, 0, 0, 16, 3, '#8a84a0'); P(x, 0, 13, 16, 3, '#4a4458');
    P(x, 7, 3, 2, 10, '#5a5468');
  },
};

// Mapa de caracteres -> tile y colisión
const TILEDEF = {
  '.': { t: 'grass' }, ',': { t: 'tallgrass', grass: true }, ':': { t: 'path' }, 's': { t: 'sand' },
  'T': { t: 'tree', solid: true }, '~': { t: 'water', solid: true, water: true }, 'f': { t: 'flower', anim: 2 },
  'F': { t: 'fence', solid: true }, 'S': { t: 'sign', solid: true }, '=': { t: 'ledge', ledge: true },
  'R': { t: 'rock', solid: true }, 'W': { t: 'cliff', solid: true }, 'P': { t: 'bridge' }, 'K': { t: 'dock' },
  'B': { t: 'hedge', solid: true }, 'H': { t: 'grass', solid: true, building: true }, 'D': { t: 'path' },
  'c': { t: 'cave' }, 'C': { t: 'cavewall', solid: true }, 'o': { t: 'caverock', solid: true }, 'L': { t: 'ladder' },
  'w': { t: 'cavewater', solid: true, water: true },
  '_': { t: 'floor' }, 't': { t: 'tilefloor' }, 'x': { t: 'wall', solid: true }, 'X': { t: 'wallwindow', solid: true },
  'm': { t: 'mat' }, 'r': { t: 'rug' }, 'n': { t: 'counter', solid: true }, 'b': { t: 'shelf', solid: true },
  'a': { t: 'table', solid: true }, 'p': { t: 'pc', solid: true }, 'e': { t: 'bed', solid: true }, 'v': { t: 'tv', solid: true },
  'q': { t: 'plant', solid: true }, 'h': { t: 'healer', solid: true, anim: 1 }, 'u': { t: 'stairs' }, 'g': { t: 'gymfloor' },
  'j': { t: 'statue', solid: true }, 'k': { t: 'machine', solid: true, anim: 1 }, '0': { t: 'void', solid: true },
  'Z': { t: 'gymwall', solid: true },
};
const ANIM_TILES = { water: 3, flower: 2, tallgrass: 1, cavewater: 3, healer: 1, machine: 1, lamp: 1 };

// ---------- personajes (16x16, 4 direcciones) ----------
const CHAR_T = {
  down: [
    '....oooooooo....', '...ohhhhhhhho...', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..ohssssssssho..',
    '..ossessssesso..', '..osssssssssso..', '...osssssssso...', '...occcccccco...', '..occcccccccco..',
    '..osccccccccso..', '..ooccccccccoo..', '...oppppppppo...', '...opppoopppo...', '..okkko..okkko..', '..ooooo..ooooo..'],
  up: [
    '....oooooooo....', '...ohhhhhhhho...', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '...ohhhhhhhho...', '...occcccccco...', '..occcccccccco..',
    '..osccccccccso..', '..ooccccccccoo..', '...oppppppppo...', '...opppoopppo...', '..okkko..okkko..', '..ooooo..ooooo..'],
  left: [
    '.....ooooooo....', '....ohhhhhhho...', '...ohhhhhhhhho..', '...ohhhhhhhhho..', '...osshhhhhhho..',
    '...osesshhhhho..', '...osssshhhhho..', '....osssssso....', '....occcccco....', '...occcccccco...',
    '...occcscccco...', '...ooccccccoo...', '....oppppppo....', '....oppppppo....', '....okkkkko.....', '....ooooooo.....'],
};
const WALK_LEGS = {
  down: ['...oppppppppo...', '...opppoopppo...', '..okkko..oppo...', '..ooooo..okko...'],
  up: ['...oppppppppo...', '...opppoopppo...', '..okkko..oppo...', '..ooooo..okko...'],
  left: ['....oppppppo....', '...oppo.oppo....', '..okko...okko...', '..ooo.....ooo...'],
};

const CharSprites = {
  cache: {},
  // cfg: {hair, skin, shirt, pants, shoes, hat, long}
  get(cfg) {
    const key = JSON.stringify(cfg);
    if (this.cache[key]) return this.cache[key];
    const [c, x] = U.makeCanvas(16 * 3, 16 * 4); // columnas: quieto, paso1, paso2 | filas: abajo, arriba, izq, der
    const col = {
      o: '#1e1a26', h: cfg.hair, s: cfg.skin || '#f8c8a0', e: '#1e1a26', c: cfg.shirt, p: cfg.pants || '#404058', k: cfg.shoes || '#584038',
    };
    const dark = { h: U.shade(cfg.hair, -0.12), c: U.shade(cfg.shirt, -0.12), p: U.shade(col.p, -0.08), s: U.shade(col.s, -0.08) };
    const hatC = cfg.hat, hatD = cfg.hat ? U.shade(cfg.hat, -0.15) : null;
    const draw = (rows, ox, oy, mirror, dir) => {
      rows = rows.map((r) => r.split(''));
      if (cfg.long) {
        if (dir === 'down' || dir === 'up') for (let y = 6; y <= 9; y++) { rows[y][2] = 'o'; rows[y][3] = 'h'; rows[y][12] = 'h'; rows[y][13] = 'o'; if (y === 9) { rows[y][2] = '.'; rows[y][13] = '.'; rows[y][3] = 'o'; rows[y][12] = 'o'; } }
        if (dir === 'left') for (let y = 6; y <= 9; y++) { rows[y][10] = 'h'; rows[y][11] = 'h'; rows[y][12] = 'o'; }
      }
      for (let y = 0; y < 16; y++) for (let xx = 0; xx < 16; xx++) {
        let ch = rows[y][xx]; if (ch === '.') continue;
        let color = col[ch];
        if (ch === 'h' && hatC && y <= 3) color = y === 3 ? hatD : hatC;
        else if ((ch === 'c' || ch === 'h' || ch === 'p') && xx >= 10) color = dark[ch];
        if (ch === 'h' && !hatC && y === 1 && xx < 8) color = U.shade(cfg.hair, 0.12);
        if (ch === 'c' && y === 8) color = U.shade(cfg.shirt, 0.1);
        const px = mirror ? 15 - xx : xx;
        P(x, ox + px, oy + y, 1, 1, color);
      }
      // visera de la gorra
      if (hatC) {
        if (dir === 'down') P(x, ox + 3, oy + 4, 10, 1, hatD);
        if (dir === 'left') { const bx = mirror ? 15 - 2 - 2 : 2; P(x, ox + bx, oy + 4, 3, 1, hatD); }
      }
    };
    const dirs = ['down', 'up', 'left', 'right'];
    dirs.forEach((d, row) => {
      const base = d === 'right' ? 'left' : d;
      const mirror = d === 'right';
      const stand = CHAR_T[base];
      const walk = stand.slice(0, 12).concat(WALK_LEGS[base]);
      draw(stand, 0, row * 16, mirror, base);
      draw(walk, 16, row * 16, mirror, base);
      if (base === 'left') draw(walk, 32, row * 16, mirror, base);
      else draw(walk, 32, row * 16, !mirror, base);
    });
    this.cache[key] = c;
    return c;
  },
};

// ---------- edificios ----------
const Buildings = {
  cache: {},
  STYLES: {
    house: { roof: '#d86048', wall: '#f4ead8', trim: '#a87850' },
    house2: { roof: '#5878c8', wall: '#f4ead8', trim: '#a87850' },
    house3: { roof: '#6aa850', wall: '#f8f0e0', trim: '#a87850' },
    center: { roof: '#40b8b0', wall: '#fbf6ee', trim: '#d85868', sign: 'center' },
    mart: { roof: '#4a78d8', wall: '#fbf6ee', trim: '#4a78d8', sign: 'mart' },
    lab: { roof: '#8898b0', wall: '#f8f8f8', trim: '#687890', sign: 'lab' },
    gym: { roof: '#9a6ac0', wall: '#ece4f0', trim: '#6a4a90', sign: 'gym' },
    dock: { roof: '#b85838', wall: '#e8dcc8', trim: '#785030' },
  },
  get(style, w, h, doorX) {
    const key = [style, w, h, doorX].join(',');
    if (this.cache[key]) return this.cache[key];
    const S = this.STYLES[style];
    const pw = w * 16, ph = h * 16;
    const [c, x] = U.makeCanvas(pw, ph);
    const roofH = Math.round(ph * (h >= 5 ? 0.5 : 0.56));
    // pared
    P(x, 1, roofH - 2, pw - 2, ph - roofH + 2, U.shade(S.wall, -0.25));
    P(x, 2, roofH, pw - 4, ph - roofH - 1, S.wall);
    P(x, 2, ph - 4, pw - 4, 3, U.shade(S.wall, -0.12));
    // ventanas
    const winY = roofH + 4;
    for (let tx = 0; tx < w; tx++) {
      if (tx === doorX || (style === 'center' || style === 'mart' || style === 'gym') && Math.abs(tx - doorX) === 1 && w <= 5) continue;
      if (ph - roofH < 18) continue;
      const wx = tx * 16 + 4;
      P(x, wx - 1, winY - 1, 10, 9, U.shade(S.trim, -0.1));
      P(x, wx, winY, 8, 7, '#90c8f0'); P(x, wx, winY, 3, 3, '#d8f0ff'); P(x, wx + 4, winY, 1, 7, U.shade(S.trim, -0.1));
      P(x, wx - 1, winY + 8, 10, 1, U.shade(S.wall, -0.3));
    }
    // puerta
    if (doorX >= 0) {
      const dx = doorX * 16 + 3;
      P(x, dx - 1, ph - 15, 12, 15, U.shade(S.trim, -0.25));
      if (style === 'center' || style === 'mart' || style === 'lab' || style === 'gym') {
        P(x, dx, ph - 14, 10, 14, '#384858'); P(x, dx + 1, ph - 13, 4, 12, '#8ac8e8'); P(x, dx + 5, ph - 13, 4, 12, '#78b0d0'); P(x, dx + 1, ph - 13, 2, 3, '#d0f0ff');
      } else {
        P(x, dx, ph - 14, 10, 14, PAL.wood3); P(x, dx + 1, ph - 13, 8, 12, PAL.wood2); P(x, dx + 7, ph - 8, 1, 2, '#f0d060');
      }
    }
    // tejado
    const roofC = S.roof, roofL = U.shade(roofC, 0.12), roofD = U.shade(roofC, -0.14), roofDD = U.shade(roofC, -0.3);
    P(x, 0, 2, pw, roofH, roofDD);
    P(x, 1, 3, pw - 2, roofH - 3, roofC);
    for (let y = 6; y < roofH - 3; y += 5) { P(x, 1, y, pw - 2, 1, roofD); for (let xx = (y % 2) * 6 + 2; xx < pw - 2; xx += 12) P(x, xx, y - 4, 1, 4, roofD); }
    P(x, 1, 3, pw - 2, 2, roofL);
    P(x, 0, roofH - 2, pw, 2, roofDD); P(x, 2, 0, pw - 4, 3, roofDD); P(x, 3, 1, pw - 6, 2, roofL);
    // chimenea en casas
    if (style.startsWith('house')) { P(x, pw - 14, 0, 6, 8, '#8a6050'); P(x, pw - 13, 0, 4, 2, '#a87868'); }
    // letrero sobre la puerta
    if (S.sign && doorX >= 0) {
      const sx = doorX * 16 - 1, sy = roofH - 9;
      P(x, sx, sy, 18, 10, '#2a2430'); P(x, sx + 1, sy + 1, 16, 8, '#fdfaf2');
      Icons.drawSign(x, S.sign, sx + 5, sy + 2);
    }
    this.cache[key] = c;
    return c;
  },
};

// ---------- iconos ----------
const Icons = {
  cache: {},
  drawSign(x, kind, sx, sy) {
    if (kind === 'center') { P(x, sx + 2, sy, 2, 6, '#e04860'); P(x, sx, sy + 2, 6, 2, '#e04860'); }
    else if (kind === 'mart') { P(x, sx, sy + 1, 7, 5, '#4a78d8'); P(x, sx + 2, sy, 3, 2, '#4a78d8'); P(x, sx + 3, sy + 3, 1, 2, '#fff'); }
    else if (kind === 'lab') { P(x, sx + 2, sy, 3, 3, '#58a8e0'); P(x, sx + 1, sy + 3, 5, 3, '#58a8e0'); P(x, sx + 2, sy + 4, 1, 1, '#fff'); }
    else if (kind === 'gym') { P(x, sx + 1, sy, 5, 6, '#9a6ac0'); P(x, sx, sy + 1, 7, 3, '#9a6ac0'); P(x, sx + 2, sy + 2, 3, 2, '#f8d048'); }
  },
  // esfera de captura (diseño propio: orbe con anillo orbital y gema)
  sphere(kind = 'esfera', size = 12) {
    const key = 'sph:' + kind + size;
    if (this.cache[key]) return this.cache[key];
    const cols = { esfera: ['#5aa0f0', '#2c64c0'], super: ['#58d080', '#2a9050'], ultra: ['#b070e0', '#6a38a8'], master: ['#f0c040', '#b08010'], pesada: ['#8a929c', '#3c444e'], rapida: ['#f0d840', '#d06020'], nocturna: ['#3c4888', '#141a40'], red: ['#40c0b8', '#1a7870'] }[kind] || ['#5aa0f0', '#2c64c0'];
    const [c, x] = U.makeCanvas(size, size);
    const r = size / 2 - 0.5, cx = size / 2 - 0.5, cy = size / 2 - 0.5;
    for (let y = 0; y < size; y++) for (let xx = 0; xx < size; xx++) {
      const dx = xx - cx, dy = y - cy, d = Math.hypot(dx, dy);
      if (d > r + 0.3) continue;
      let col = d > r - 0.8 ? '#1c1824' : (dy < -0.5 ? cols[0] : '#f4f0f8');
      if (d <= r - 0.8 && dy < -0.5 && dx + dy < -r * 0.9) col = U.shade(cols[0], 0.2);
      if (d <= r - 0.8 && dy >= -0.5 && dx + dy > r * 0.6) col = '#c8c0d0';
      if (Math.abs(dy + 0.0) < 1 && d <= r - 0.8) col = cols[1];
      x.fillStyle = col; x.fillRect(xx, y, 1, 1);
    }
    // gema
    const g = Math.max(1, Math.round(size / 6));
    P(x, Math.round(cx - g / 2), Math.round(cy - g / 2), g + 1, g + 1, '#1c1824');
    P(x, Math.round(cx - g / 2) + (g > 1 ? 1 : 0), Math.round(cy - g / 2) + (g > 1 ? 1 : 0), Math.max(1, g - 1), Math.max(1, g - 1), '#fff8c0');
    P(x, Math.round(cx - r * 0.45), Math.round(cy - r * 0.6), 2, 1, '#ffffff');
    this.cache[key] = c; return c;
  },
  item(id) {
    const key = 'it:' + id;
    if (this.cache[key]) return this.cache[key];
    const it = ITEMS[id];
    if (it && it.sphere) { const s = this.sphere(it.sphere, 14); const [c, x] = U.makeCanvas(16, 16); x.drawImage(s, 1, 1); this.cache[key] = c; return c; }
    const [c, x] = U.makeCanvas(16, 16);
    const icon = it ? it.icon : 'box';
    const ink = '#1c1824';
    if (icon === 'potion') {
      const col = it.color || '#a060e0';
      P(x, 6, 1, 4, 3, ink); P(x, 7, 2, 2, 1, '#d0d0d8');
      P(x, 4, 4, 8, 11, ink); P(x, 5, 5, 6, 9, '#f4f4fa'); P(x, 5, 8, 6, 6, col); P(x, 5, 8, 6, 1, U.shade(col, 0.2)); P(x, 6, 6, 1, 2, '#fff');
    } else if (icon === 'revive') {
      P(x, 3, 3, 10, 10, ink); P(x, 4, 4, 8, 8, '#f8d848'); P(x, 7, 5, 2, 6, '#fff'); P(x, 5, 7, 6, 2, '#fff');
    } else if (icon === 'candy') {
      P(x, 4, 5, 8, 6, ink); P(x, 5, 6, 6, 4, '#68c8f8'); P(x, 6, 6, 2, 1, '#fff'); P(x, 1, 6, 3, 4, '#f070a0'); P(x, 12, 6, 3, 4, '#f070a0');
    } else if (icon === 'core') {
      const col = it.color || '#a080f0';
      P(x, 7, 1, 2, 14, ink); P(x, 4, 4, 8, 8, ink); P(x, 2, 7, 12, 2, ink);
      P(x, 5, 5, 6, 6, col); P(x, 7, 2, 2, 12, col); P(x, 3, 7, 10, 2, col); P(x, 6, 5, 2, 2, '#fff');
    } else if (icon === 'spray') {
      P(x, 5, 2, 6, 2, ink); P(x, 4, 4, 8, 11, ink); P(x, 5, 5, 6, 9, '#f0e040'); P(x, 5, 7, 6, 3, '#2a2430'); P(x, 10, 1, 4, 2, '#d0d0d0');
    } else if (icon === 'rope') {
      for (let i = 0; i < 4; i++) { P(x, 3 + i, 3 + i * 3, 9, 2, '#c09058'); P(x, 3 + i, 5 + i * 3, 9, 1, '#806038'); }
    } else if (icon === 'charm') {
      const col = it.color || '#c0a0f0';
      P(x, 6, 1, 4, 1, ink); P(x, 5, 2, 1, 3, ink); P(x, 10, 2, 1, 3, ink);
      P(x, 3, 5, 10, 9, ink); P(x, 2, 7, 12, 5, ink); P(x, 4, 6, 8, 7, col); P(x, 3, 8, 10, 3, col); P(x, 5, 6, 3, 2, U.shade(col, 0.3)); P(x, 6, 7, 1, 1, '#ffffff'); P(x, 9, 11, 3, 1, U.shade(col, -0.2));
    } else if (icon === 'key') {
      P(x, 2, 4, 12, 9, ink); P(x, 3, 5, 10, 7, '#e8d0a0'); P(x, 5, 7, 6, 1, '#a08060'); P(x, 5, 9, 4, 1, '#a08060');
    } else if (icon === 'berry') {
      P(x, 4, 5, 8, 9, ink); P(x, 5, 6, 6, 7, '#e04870'); P(x, 6, 7, 2, 2, '#ff98b0'); P(x, 7, 2, 2, 4, '#48a048'); P(x, 9, 3, 3, 2, '#68c058');
    } else { P(x, 3, 3, 10, 10, ink); P(x, 4, 4, 8, 8, '#c8a878'); }
    this.cache[key] = c; return c;
  },
  badge(i, size = 16) {
    const key = 'badge:' + i + ':' + size;
    if (this.cache[key]) return this.cache[key];
    const [c, x] = U.makeCanvas(16, 16);
    const ink = '#1c1824';
    if (i === 0) { // Raíz: hoja
      P(x, 7, 1, 2, 2, ink); P(x, 5, 3, 6, 2, ink); P(x, 3, 5, 10, 6, ink); P(x, 5, 11, 6, 2, ink); P(x, 7, 13, 2, 2, ink);
      P(x, 6, 4, 4, 1, '#58c058'); P(x, 4, 6, 8, 4, '#58c058'); P(x, 6, 11, 4, 1, '#3a9a40'); P(x, 7, 3, 2, 10, '#a8f088'); P(x, 4, 6, 3, 2, '#88e070');
    } else if (i === 1) { // Peña: hexágono
      P(x, 4, 2, 8, 12, ink); P(x, 2, 4, 12, 8, ink); P(x, 5, 3, 6, 10, '#b88858'); P(x, 3, 5, 10, 6, '#b88858'); P(x, 5, 4, 4, 3, '#e0b888'); P(x, 9, 9, 3, 2, '#806040');
    } else { // Oleaje: ola
      P(x, 2, 3, 12, 10, ink); P(x, 3, 4, 10, 8, '#48a0e8'); P(x, 4, 5, 5, 2, '#c8ecff'); P(x, 8, 6, 3, 3, '#c8ecff'); P(x, 3, 9, 10, 2, '#2870c0');
    }
    this.cache[key] = c; return c;
  },
};

// ---------- UI: cajas ----------
const UI = {
  box(ctx, x, y, w, h, style = 'light') {
    if (style === 'light') {
      P(ctx, x + 1, y, w - 2, h, '#2a2236'); P(ctx, x, y + 1, w, h - 2, '#2a2236');
      P(ctx, x + 1, y + 1, w - 2, h - 2, '#fbf7ee');
      P(ctx, x + 2, y + 2, w - 4, h - 4, '#6c8cd8');
      P(ctx, x + 3, y + 3, w - 6, h - 6, '#fbf7ee');
      P(ctx, x + 3, y + h - 4, w - 6, 1, '#e8e0d0');
    } else if (style === 'dark') {
      ctx.globalAlpha = 0.85; P(ctx, x, y, w, h, '#14101e'); ctx.globalAlpha = 1;
      P(ctx, x, y, w, 1, '#5a5078'); P(ctx, x, y + h - 1, w, 1, '#5a5078'); P(ctx, x, y, 1, h, '#5a5078'); P(ctx, x + w - 1, y, 1, h, '#5a5078');
    } else if (style === 'panel') {
      P(ctx, x, y, w, h, '#2a2236'); P(ctx, x + 1, y + 1, w - 2, h - 2, '#f4eedf'); P(ctx, x + 1, y + 1, w - 2, 1, '#ffffff');
    }
  },
  cursor(ctx, x, y, color = '#2a2236') {
    const o = Math.floor(Engine.time * 4) % 2;
    P(ctx, x + o, y, 1, 7, color); P(ctx, x + 1 + o, y + 1, 1, 5, color); P(ctx, x + 2 + o, y + 2, 1, 3, color); P(ctx, x + 3 + o, y + 3, 1, 1, color);
  },
  hpColor(r) { return r > 0.5 ? '#48d058' : r > 0.2 ? '#f0c030' : '#f04838'; },
  bar(ctx, x, y, w, h, ratio, color, bg = '#38304a') {
    P(ctx, x - 1, y - 1, w + 2, h + 2, '#1c1824');
    P(ctx, x, y, w, h, bg);
    const fw = Math.max(0, Math.round(w * U.clamp(ratio, 0, 1)));
    P(ctx, x, y, fw, h, color);
    if (h > 2) P(ctx, x, y, fw, 1, U.shade(color, 0.18));
  },
  typeBadge(ctx, type, x, y) {
    const T = TYPES[type];
    const w = 30;
    P(ctx, x, y, w, 9, '#1c1824'); P(ctx, x + 1, y + 1, w - 2, 7, T.color); P(ctx, x + 1, y + 1, w - 2, 1, U.shade(T.color, 0.2));
    Font.drawCenter(ctx, T.short, x + w / 2, y + 1, '#ffffff');
    return w;
  },
};

// sombra elíptica
function drawShadow(ctx, cx, cy, rx, ry, alpha = 0.25) {
  ctx.globalAlpha = alpha; ctx.fillStyle = '#000';
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.01)));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
  }
  ctx.globalAlpha = 1;
}
