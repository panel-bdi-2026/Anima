'use strict';
// ============================================================
//  EDIFICIOS 2.0
//  Tejas con hileras y degradado, paredes con textura (tablones,
//  revoque o piedra), zócalo, ventanas con marco y reflejo,
//  puertas con paneles, chimeneas de ladrillo y fachadas propias
//  para Centro, Tienda, Gimnasio, Laboratorio y Torre.
//  Mantiene la misma geometría (ventanas que se iluminan de noche).
// ============================================================
{
  const sh = (c, k) => U.shade(c, k);
  const BSTY = {
    house: { wall: 'siding' }, house2: { wall: 'siding' }, house3: { wall: 'siding' },
    center: { wall: 'plaster', band: '#d85868' }, mart: { wall: 'plaster', band: '#4a78d8', awning: ['#4a78d8', '#f4f4f8'] },
    gym: { wall: 'stone', band: '#7a4ab0' }, lab: { wall: 'panel', band: '#687890' }, dock: { wall: 'siding' },
    tower: { wall: 'stone', band: '#a070e0' }, forge: { wall: 'stone' }, chalet: { wall: 'timber' },
  };
  const tex = (x, pw, y0, y1, style, S) => {
    const wall = S.wall, kind = (BSTY[style] || {}).wall || 'siding';
    for (let y = y0; y < y1; y++) for (let i = 2; i < pw - 2; i++) {
      let c = wall;
      const h = hash2(i * 3 + style.length, y * 7);
      if (kind === 'siding') { if ((y - y0) % 3 === 2) c = sh(wall, -0.08); else if (h < 0.08) c = sh(wall, -0.04); }
      else if (kind === 'plaster') { if (h < 0.1) c = sh(wall, -0.04); else if (h > 0.95) c = sh(wall, 0.04); }
      else if (kind === 'stone') { const row = Math.floor((y - y0) / 4), off = row % 2 ? 4 : 0; if ((y - y0) % 4 === 3 || (i + off) % 8 === 0) c = sh(wall, -0.14); else if (h < 0.15) c = sh(wall, -0.05); }
      else if (kind === 'panel') { if ((i % 12) === 0 || (y - y0) % 8 === 7) c = sh(wall, -0.12); else if ((i % 12) === 1) c = sh(wall, 0.08); }
      else if (kind === 'timber') { if (i % 10 < 2 || (y - y0) % 9 === 0) c = '#5a3a22'; else if (h < 0.08) c = sh(wall, -0.06); }
      P(x, i, y, 1, 1, c);
    }
  };
  const roofTex = (x, pw, roofH, S, style) => {
    const base = S.roof, rows = Math.max(2, Math.floor((roofH - 4) / 4));
    P(x, 0, 2, pw, roofH, sh(base, -0.42));
    for (let y = 3; y < roofH - 2; y++) {
      const r = Math.floor((y - 3) / 4), ly = (y - 3) % 4, t = (y - 3) / Math.max(1, roofH - 6);
      const tone = sh(base, 0.14 - t * 0.28);
      for (let i = 1; i < pw - 1; i++) {
        const off = r % 2 ? 3 : 0, sx = (i + off) % 6;
        let c = tone;
        if (ly === 0) c = sh(tone, 0.12);
        if (ly === 3) c = sx === 0 || sx === 5 ? sh(tone, -0.3) : sh(tone, -0.18);
        if (sx === 0 && ly > 0) c = sh(tone, -0.12);
        if (hash2(i * 5, y * 3) < 0.04) c = sh(c, -0.08);
        P(x, i, y, 1, 1, c);
      }
    }
    // cumbrera y aleros
    P(x, 2, 0, pw - 4, 3, sh(base, -0.42)); P(x, 3, 1, pw - 6, 1, sh(base, 0.3)); P(x, 3, 2, pw - 6, 1, sh(base, 0.1));
    P(x, 0, roofH - 2, pw, 2, sh(base, -0.45)); P(x, 1, roofH - 2, pw - 2, 1, sh(base, -0.25));
    P(x, 0, 3, 1, roofH - 4, sh(base, -0.45)); P(x, pw - 1, 3, 1, roofH - 4, sh(base, -0.45));
  };
  const windowAt = (x, wx, wy, S, style) => {
    const frame = sh(S.trim, -0.15);
    P(x, wx - 1, wy - 1, 10, 9, frame); P(x, wx - 1, wy - 1, 10, 1, sh(S.trim, 0.1));
    for (let j = 0; j < 7; j++) for (let i = 0; i < 8; i++) {
      const g = j / 7, refl = (i + j) % 7 < 2 && i < 5;
      P(x, wx + i, wy + j, 1, 1, refl ? '#e4f6ff' : g < 0.4 ? '#9cd2f2' : g < 0.75 ? '#78b4e0' : '#5a92c8');
    }
    P(x, wx + 3, wy, 1, 7, frame); P(x, wx, wy + 3, 8, 1, frame);
    if (style.startsWith('house') || style === 'chalet') { P(x, wx, wy, 2, 2, '#f8e0e8'); P(x, wx + 6, wy, 2, 2, '#f8e0e8'); }
    if (style === 'chalet') { P(x, wx - 3, wy - 1, 2, 9, '#7a3a2a'); P(x, wx + 9, wy - 1, 2, 9, '#7a3a2a'); P(x, wx - 3, wy + 3, 2, 1, '#5a2a1a'); P(x, wx + 9, wy + 3, 2, 1, '#5a2a1a'); }
    P(x, wx - 2, wy + 7, 12, 2, sh(S.wall, -0.32)); P(x, wx - 2, wy + 7, 12, 1, sh(S.wall, 0.15));
  };
  Buildings.get = function (style, w, h, doorX) {
    const key = 'v2:' + [style, w, h, doorX].join(',');
    if (this.cache[key]) return this.cache[key];
    const S = this.STYLES[style] || this.STYLES.house, B = BSTY[style] || {};
    const pw = w * 16, ph = h * 16;
    const [c, x] = U.makeCanvas(pw, ph);
    const roofH = Math.round(ph * (h >= 5 ? 0.5 : 0.56));
    // pared con textura, esquinas y zócalo
    P(x, 1, roofH - 2, pw - 2, ph - roofH + 2, sh(S.wall, -0.32));
    tex(x, pw, roofH, ph - 3, style, S);
    P(x, 2, roofH, 2, ph - roofH - 3, sh(S.wall, 0.08)); P(x, pw - 4, roofH, 2, ph - roofH - 3, sh(S.wall, -0.16));
    for (let i = 2; i < pw - 2; i++) for (let y = ph - 4; y < ph - 1; y++) P(x, i, y, 1, 1, (i + (y % 2) * 3) % 6 === 0 ? '#6a6470' : y === ph - 4 ? '#a8a2ae' : '#8a8490');
    // sombra del alero sobre la pared
    x.globalAlpha = 0.25; P(x, 2, roofH, pw - 4, 3, '#000'); x.globalAlpha = 1;
    // franja de color (edificios públicos)
    if (B.band) { P(x, 2, roofH + 2, pw - 4, 2, B.band); P(x, 2, roofH + 2, pw - 4, 1, sh(B.band, 0.25)); }
    // ventanas
    const winY = roofH + 4, list = [];
    for (let tx = 0; tx < w; tx++) {
      if (tx === doorX || ((style === 'center' || style === 'mart' || style === 'gym') && Math.abs(tx - doorX) === 1 && w <= 5)) continue;
      if (ph - roofH < 18) continue;
      windowAt(x, tx * 16 + 4, winY, S, style);
      list.push({ x: tx * 16 + 4, y: winY, w: 8, h: 7 });
    }
    // puerta
    if (doorX >= 0) {
      const dx = doorX * 16 + 3, glass = ['center', 'mart', 'lab', 'gym', 'tower'].includes(style);
      P(x, dx - 2, ph - 16, 14, 16, sh(S.trim, -0.35)); P(x, dx - 1, ph - 15, 12, 15, sh(S.trim, -0.1));
      if (glass) {
        P(x, dx, ph - 14, 10, 14, '#2a3644');
        for (let j = 0; j < 12; j++) { P(x, dx + 1, ph - 13 + j, 4, 1, j < 4 ? '#bce4f8' : '#7cb4d8'); P(x, dx + 5, ph - 13 + j, 4, 1, j < 4 ? '#a8d4ec' : '#6aa0c8'); }
        P(x, dx + 1, ph - 13, 1, 12, '#e4f6ff'); P(x, dx + 4, ph - 8, 1, 2, '#d0d8e0'); P(x, dx + 5, ph - 8, 1, 2, '#d0d8e0');
      } else {
        P(x, dx, ph - 14, 10, 14, PAL.wood4 || '#5a3a22');
        for (let j = 0; j < 13; j++) for (let i = 0; i < 8; i++) P(x, dx + 1 + i, ph - 13 + j, 1, 1, (i === 0 || i === 4) ? '#6a4428' : j % 6 === 5 ? '#7a5030' : '#9a6a3c');
        P(x, dx + 1, ph - 13, 8, 1, '#b8844c'); P(x, dx + 7, ph - 8, 1, 2, '#f0d060');
      }
      P(x, dx - 2, ph - 1, 14, 1, '#c8c2cc');
    }
    // tejado
    roofTex(x, pw, roofH, S, style);
    // toldo de la tienda
    if (B.awning && doorX >= 0) {
      const ax = doorX * 16 - 6, ay = ph - 20;
      for (let i = 0; i < 28; i++) { const col = B.awning[Math.floor(i / 4) % 2]; P(x, ax + i, ay, 1, 4, col); P(x, ax + i, ay + 4, 1, 1, i % 4 < 2 ? col : 'rgba(0,0,0,0)'); }
      x.globalAlpha = 0.3; P(x, ax, ay + 5, 28, 2, '#000'); x.globalAlpha = 1;
    }
    // columnas del gimnasio y la torre
    if ((style === 'gym' || style === 'tower') && doorX >= 0) {
      for (const px of [doorX * 16 - 5, doorX * 16 + 17]) { P(x, px, roofH, 4, ph - roofH - 3, '#e8e0f0'); P(x, px, roofH, 1, ph - roofH - 3, '#ffffff'); P(x, px + 3, roofH, 1, ph - roofH - 3, '#a8a0b8'); }
    }
    // chimenea de ladrillo
    if (style.startsWith('house') || style === 'forge' || style === 'chalet') {
      const cx0 = pw - 15;
      for (let y = 0; y < 9; y++) for (let i = 0; i < 6; i++) P(x, cx0 + i, y, 1, 1, (y % 3 === 2 || (i + (Math.floor(y / 3) % 2) * 3) % 6 === 0) ? '#6a3a2a' : '#a85a40');
      P(x, cx0 - 1, 0, 8, 2, '#5a3a32'); P(x, cx0, 0, 6, 1, '#8a6a5a');
      if (style === 'forge') { x.globalAlpha = 0.5; P(x, cx0 + 1, 0, 4, 1, '#ff9040'); x.globalAlpha = 1; }
    }
    // letrero
    if (S.sign && doorX >= 0) {
      const sx = doorX * 16 - 1, sy = roofH - 9;
      P(x, sx - 1, sy - 1, 20, 12, '#1a1420'); P(x, sx, sy, 18, 10, '#fdfaf2'); P(x, sx, sy, 18, 1, '#ffffff'); P(x, sx, sy + 9, 18, 1, '#d8d0c8');
      Icons.drawSign(x, S.sign, sx + 5, sy + 2);
    }
    // jardineras bajo las ventanas de las casas
    if (style.startsWith('house') || style === 'chalet') for (const wd of list) { P(x, wd.x - 1, wd.y + 9, 10, 2, '#7a4428'); P(x, wd.x - 1, wd.y + 9, 10, 1, '#a0603a'); P(x, wd.x, wd.y + 8, 2, 1, '#f8607a'); P(x, wd.x + 3, wd.y + 8, 2, 1, '#ffd040'); P(x, wd.x + 6, wd.y + 8, 2, 1, '#f8607a'); P(x, wd.x + 2, wd.y + 8, 1, 1, '#3c8a3a'); P(x, wd.x + 5, wd.y + 8, 1, 1, '#3c8a3a'); }
    if (doorX >= 0 && ['center', 'mart', 'lab', 'gym', 'tower'].includes(style)) list.push({ x: doorX * 16 + 4, y: ph - 13, w: 8, h: 12, door: true });
    c.windows = list;
    this.cache[key] = c;
    return c;
  };
}
