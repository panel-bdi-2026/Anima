'use strict';
// ============================================================
//  INTERIORES 2.0
//  Suelos de tablones con veta, baldosas con brillo, paredes con
//  papel pintado y zócalo de madera, muebles con volumen y
//  sombras de contacto bajo paredes y muebles.
// ============================================================
{
  const sh = (c, k) => U.shade(c, k);
  const plank = ['#a8743c', '#b8824a', '#c69256', '#d4a266'];
  Object.assign(TileDraw, {
    floor(x, f, v) {
      for (let row = 0; row < 4; row++) {
        const y0 = row * 4, joint = (row * 7 + v * 5) % 16;
        for (let y = y0; y < y0 + 4; y++) for (let i = 0; i < 16; i++) {
          const seg = i < joint ? 0 : 1, base = plank[(row + seg * 2 + v) % 4];
          let c = base;
          if (y === y0 + 3) c = '#7a5228';
          else if (y === y0) c = sh(base, 0.08);
          else if (hash2(i + row * 31, y * 7 + v) < 0.12) c = sh(base, -0.07);
          else if ((i + y * 3 + row) % 11 === 0) c = sh(base, -0.04);
          if (i === joint && y !== y0 + 3) c = '#7a5228';
          P(x, i, y, 1, 1, c);
        }
      }
    },
    tilefloor(x, f, v) {
      for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) {
        const q = (i < 8) === (y < 8);
        let c = q ? '#eee8dc' : '#ddd4c2';
        if (i % 8 === 7 || y % 8 === 7) c = '#c2b8a6';
        else if (i % 8 === 0 || y % 8 === 0) c = q ? '#f8f4ec' : '#e8e0d0';
        else if ((i % 8) + (y % 8) === 5 && q) c = '#fbf8f2';
        P(x, i, y, 1, 1, c);
      }
    },
    wall(x) {
      for (let y = 0; y < 11; y++) for (let i = 0; i < 16; i++) {
        let c = (i % 8 < 4) ? '#f2e8d4' : '#ece0c8';
        if ((i % 8 === 2 || i % 8 === 6) && y % 4 === 1) c = '#e0cca8';
        P(x, i, y, 1, 1, c);
      }
      P(x, 0, 0, 16, 1, '#c8b494');
      P(x, 0, 10, 16, 1, '#b89c74'); P(x, 0, 11, 16, 1, '#e8d8b8');
      for (let y = 12; y < 15; y++) for (let i = 0; i < 16; i++) P(x, i, y, 1, 1, i % 8 === 0 ? '#6a4a2c' : y === 12 ? '#b08050' : '#946838');
      P(x, 0, 15, 16, 1, '#5a3a20');
    },
    wallwindow(x) {
      TileDraw.wall(x);
      P(x, 2, 1, 12, 9, '#6a5038'); P(x, 3, 2, 10, 7, '#8a6a48');
      for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) P(x, 4 + i, 3 + j, 1, 1, (i + j) % 6 < 2 && i < 5 ? '#ecf8ff' : j < 3 ? '#a8dcf8' : '#84c4ee');
      P(x, 7, 3, 1, 6, '#8a6a48'); P(x, 4, 5, 8, 1, '#8a6a48');
      P(x, 2, 1, 2, 9, '#d86a6a'); P(x, 12, 1, 2, 9, '#d86a6a'); P(x, 2, 1, 2, 1, '#f09090'); P(x, 12, 1, 2, 1, '#f09090');
      P(x, 2, 10, 12, 1, '#f4ece0');
    },
    mat(x, f, v) {
      TileDraw.floor(x, f, v);
      x.globalAlpha = 0.25; P(x, 2, 5, 14, 9, '#000'); x.globalAlpha = 1;
      P(x, 1, 4, 14, 9, '#7a2828'); P(x, 2, 5, 12, 7, '#c84848');
      for (let i = 3; i < 13; i += 2) P(x, i, 6, 1, 5, '#a83838');
      P(x, 2, 5, 12, 1, '#e87070'); for (let i = 1; i < 15; i += 2) { P(x, i, 3, 1, 1, '#e0d0b0'); P(x, i, 13, 1, 1, '#e0d0b0'); }
    },
    rug(x) {
      P(x, 0, 0, 16, 16, '#3a5a9a');
      for (let y = 1; y < 15; y++) for (let i = 1; i < 15; i++) {
        const d = Math.max(Math.abs(i - 7.5), Math.abs(y - 7.5));
        P(x, i, y, 1, 1, d > 6 ? '#e8c860' : d > 5 ? '#4a6ab0' : (Math.abs(i - 7.5) + Math.abs(y - 7.5)) < 4 ? '#c84848' : (i + y) % 4 === 0 ? '#6a8ad0' : '#5a7ac4');
      }
    },
    counter(x) {
      P(x, 0, 0, 16, 7, '#f6eee2'); P(x, 0, 0, 16, 1, '#ffffff'); P(x, 0, 6, 16, 1, '#c8baa4');
      for (let y = 7; y < 16; y++) for (let i = 0; i < 16; i++) P(x, i, y, 1, 1, i % 8 === 0 ? '#6a4428' : y === 7 ? '#5a3a20' : (i + y) % 7 === 0 ? '#9a6a3c' : '#b07a44');
      P(x, 0, 15, 16, 1, '#4a2e18');
    },
    shelf(x) {
      P(x, 0, 0, 16, 16, '#5a3a22'); P(x, 1, 1, 14, 14, '#7a5030');
      const cols = ['#c84040', '#4070c8', '#40985a', '#e0b040', '#8a50c0', '#e07a30'];
      for (const sy of [2, 9]) {
        let px = 2, i = sy * 3;
        while (px < 14) {
          const w = 1 + ((i * 7) % 2), hgt = 4 + (i % 2), c = cols[i % cols.length];
          P(x, px, sy + 5 - hgt, w, hgt, c); P(x, px, sy + 5 - hgt, w, 1, sh(c, 0.3)); P(x, px + w - 1, sy + 5 - hgt + 1, 1, hgt - 1, sh(c, -0.25));
          px += w + (i % 4 === 0 ? 1 : 0); i++;
        }
        P(x, 1, sy + 5, 14, 1, '#4a2e18'); P(x, 1, sy + 6, 14, 1, '#9a6a3c');
      }
    },
    table(x, f, v) {
      TileDraw.floor(x, f, v);
      x.globalAlpha = 0.25; P(x, 3, 12, 13, 3, '#000'); x.globalAlpha = 1;
      P(x, 1, 2, 14, 10, '#6a4428');
      for (let y = 2; y < 10; y++) for (let i = 2; i < 14; i++) P(x, i, y, 1, 1, y === 2 ? '#e0b070' : (i + y * 2) % 9 === 0 ? '#b07a44' : '#c88a52');
      P(x, 2, 10, 12, 1, '#8a5a30'); P(x, 2, 11, 2, 4, '#5a3a20'); P(x, 12, 11, 2, 4, '#5a3a20');
    },
    pc(x) {
      TileDraw.tilefloor(x);
      x.globalAlpha = 0.25; P(x, 3, 13, 13, 3, '#000'); x.globalAlpha = 1;
      P(x, 2, 1, 12, 13, '#4a4a5a'); P(x, 2, 1, 12, 1, '#6a6a7a');
      P(x, 3, 2, 10, 7, '#1a2838');
      for (let j = 0; j < 5; j++) P(x, 4, 3 + j, 8, 1, j % 2 ? '#3a90d0' : '#58b8e8');
      P(x, 4, 3, 3, 1, '#c8f4ff'); P(x, 3, 10, 10, 3, '#8a8a9a'); P(x, 4, 11, 2, 1, '#e04848'); P(x, 7, 11, 5, 1, '#5a5a6a');
    },
    bed(x, f, v) {
      TileDraw.floor(x, f, v);
      x.globalAlpha = 0.25; P(x, 3, 2, 13, 14, '#000'); x.globalAlpha = 1;
      P(x, 1, 0, 14, 16, '#5a3a22'); P(x, 1, 0, 14, 2, '#8a5a32');
      P(x, 2, 2, 12, 13, '#f4f4f8'); P(x, 3, 2, 10, 4, '#ffffff'); P(x, 3, 5, 10, 1, '#d0d0e0');
      for (let y = 7; y < 15; y++) for (let i = 2; i < 14; i++) P(x, i, y, 1, 1, y === 7 ? '#a0c4f8' : (i + y) % 4 === 0 ? '#4a7ad0' : '#5a8ae0');
      P(x, 2, 7, 12, 1, '#ffffff');
    },
    tv(x, f, v) {
      TileDraw.floor(x, f, v);
      x.globalAlpha = 0.25; P(x, 3, 13, 13, 3, '#000'); x.globalAlpha = 1;
      P(x, 2, 12, 12, 3, '#6a4428'); P(x, 2, 12, 12, 1, '#9a6a3c');
      P(x, 1, 2, 14, 10, '#2a2430'); P(x, 2, 3, 10, 8, '#3a5060');
      for (let j = 0; j < 6; j++) P(x, 3, 4 + j, 8, 1, j < 2 ? '#7aa8c0' : '#4a6a80');
      P(x, 3, 4, 3, 1, '#c8e8f4'); P(x, 13, 4, 1, 1, '#e05050'); P(x, 13, 6, 1, 1, '#a0a0b0'); P(x, 13, 8, 1, 1, '#a0a0b0');
    },
    plant(x, f, v) {
      TileDraw.floor(x, f, v);
      x.globalAlpha = 0.25; P(x, 5, 14, 9, 2, '#000'); x.globalAlpha = 1;
      P(x, 4, 10, 8, 5, '#a04a28'); P(x, 4, 10, 8, 1, '#e08850'); P(x, 5, 11, 2, 3, '#c06838'); P(x, 10, 11, 1, 3, '#7a3a1a');
      const lv = ['#1f5a2c', '#2f7a38', '#4a9a44', '#78c060'];
      for (const [cx, cy, r] of [[8, 6, 4], [5, 5, 2.5], [11, 5, 2.5], [8, 3, 2.5]]) for (let y = -3; y <= 3; y++) for (let i = -4; i <= 4; i++) {
        if (i * i + y * y > r * r) continue;
        P(x, Math.round(cx + i), Math.round(cy + y), 1, 1, lv[U.clamp(Math.round(1.6 - (i + y) / r + BAYER[((cy + y) & 3) * 4 + ((cx + i) & 3)]), 0, 3)]);
      }
    },
    stairs(x) {
      for (let s = 0; s < 4; s++) { const y = s * 4; P(x, 0, y, 16, 3, s % 2 ? '#c69256' : '#d4a266'); P(x, 0, y, 16, 1, '#e8bc80'); P(x, 0, y + 3, 16, 1, '#6a4428'); }
      P(x, 0, 0, 1, 16, '#5a3a20'); P(x, 15, 0, 1, 16, '#5a3a20');
    },
    gymfloor(x, f, v) {
      for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) {
        let c = (v + ((i >> 3) + (y >> 3))) % 2 ? '#cfc6b4' : '#c4baa6';
        if (i % 8 === 0 || y % 8 === 0) c = '#ddd4c2'; else if (i % 8 === 7 || y % 8 === 7) c = '#a89e8c';
        else if (hash2(i + v * 16, y) < 0.06) c = sh(c, -0.05);
        P(x, i, y, 1, 1, c);
      }
    },
    gymwall(x, f, v) {
      for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) {
        const row = y >> 2, off = row % 2 ? 4 : 0;
        let c = '#5a4a6a';
        if (y % 4 === 3 || (i + off) % 8 === 0) c = '#3a2e48'; else if (y % 4 === 0) c = '#6e5c80'; else if (hash2(i + v * 9, y) < 0.1) c = '#52435f';
        P(x, i, y, 1, 1, c);
      }
    },
  });
  // sombras de contacto en los interiores (bajo paredes y muebles)
  const TALL = new Set(['wall', 'wallwindow', 'gymwall', 'shelf', 'counter', 'pc', 'tv', 'statue', 'machine', 'healer']);
  const _build = World.buildLayer;
  World.buildLayer = function () {
    _build.call(this);
    const m = this.map;
    if (Terrain.usesNew(m)) return;
    const x = this.layer.getContext('2d');
    for (let ty = 1; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const t = (TILEDEF[m.rows[ty][tx]] || {}).t, ta = (TILEDEF[m.rows[ty - 1][tx]] || {}).t;
      if (TALL.has(t) || t === 'void' || !TALL.has(ta)) continue;
      for (let k = 0; k < 4; k++) { x.globalAlpha = 0.22 - k * 0.05; P(x, tx * 16, ty * 16 + k, 16, 1, '#2a1a10'); }
      x.globalAlpha = 1;
    }
  };
}
// rocas de los gimnasios con el nuevo dibujo
TileDraw.caverock = (x, f, v) => { TileDraw.cave(x, f, v); x.drawImage(Obj.get('caverock', 0, v), 0, 0); };
