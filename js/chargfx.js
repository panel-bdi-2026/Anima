'use strict';
// ============================================================
//  Personajes 16x24 generados por partes: peinados, sombreros,
//  atuendos y accesorios, 4 direcciones y animación de paso.
//  Hoja: columnas [quieto, paso A, paso B], filas [abajo, arriba, izq, der]
// ============================================================

const CW = 16, CH = 24;

function normLook(L) {
  return {
    skin: L.skin || '#f4c4a0',
    hair: L.hair || '#3a2a20',
    hairStyle: L.hairStyle || (L.long ? 'long' : 'short'),
    hat: L.hat ? (L.hatStyle || 'cap') : null,
    hatC: L.hat || null,
    outfit: L.outfit || 'shirt',
    c1: L.shirt || '#4a78d0',
    c2: L.c2 || U.shade(L.shirt || '#4a78d0', 0.28),
    pants: L.pants || '#3c3c54',
    shoes: L.shoes || '#4a3832',
    acc: L.acc || null,
    accC: L.accC || '#e8b040',
  };
}

const CharGfx = {
  drawCell(R, L, dir, frame) {
    const set = (x, y, c) => { if (c) R.set(x, y, c); };
    const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };
    const ell = (cx, cy, rx, ry, c, clip) => {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1 && (!clip || clip(x, y))) set(x, y, typeof c === 'function' ? c(x, y, dx, dy) : c);
      }
    };
    const dk = (c, a = 0.14) => U.shade(c, -a, 0.02);
    const lt = (c, a = 0.1) => U.shade(c, a, -0.01);
    const skin = L.skin, skinD = dk(skin, 0.1), hair = L.hair, hairD = dk(hair), hairL = lt(hair, 0.12);
    const c1 = L.c1, c1D = dk(c1), c1L = lt(c1), c2 = L.c2, pants = L.pants, pantsD = dk(pants, 0.1), shoes = L.shoes;
    const step = frame === 0 ? 0 : frame === 1 ? 1 : -1;
    const side = dir === 'left';
    const bodyBob = frame === 0 ? 0 : 0;
    const by = bodyBob;

    if (!side) {
      const up = dir === 'up';
      // mochila (desde atrás)
      // piernas
      const lLeg = 21 + (step === 1 ? 1 : step === -1 ? -1 : 0), rLeg = 21 + (step === -1 ? 1 : step === 1 ? -1 : 0);
      const legTop = L.outfit === 'dress' ? 19 : L.outfit === 'coat' ? 20 : 18;
      const legC = L.outfit === 'dress' ? skinD : pants, legCD = L.outfit === 'dress' ? dk(skin, 0.18) : pantsD;
      rect(5, legTop, 7, lLeg, legC); rect(8, legTop, 10, rLeg, legCD);
      rect(5, lLeg + 1, 7, lLeg + 2, shoes); rect(8, rLeg + 1, 10, rLeg + 2, shoes);
      set(5, lLeg + 1, lt(shoes, 0.12)); set(8, rLeg + 1, lt(shoes, 0.12));
      // torso
      rect(4, 12 + by, 11, 17 + by, c1); rect(10, 12 + by, 11, 17 + by, c1D); rect(5, 12 + by, 9, 12 + by, c1L);
      if (!up) {
        if (L.outfit === 'jacket') { rect(7, 12, 8, 17, c2); }
        if (L.outfit === 'overalls') { rect(4, 12, 11, 17, c2); rect(5, 14, 10, 17, c1); set(5, 12, c1); set(5, 13, c1); set(10, 12, c1); set(10, 13, c1); rect(5, 18, 10, 18, c1); }
        if (L.outfit === 'apron') { rect(5, 14, 10, 20, c2); rect(5, 14, 10, 14, lt(c2)); }
        if (L.outfit === 'coat') { rect(4, 12, 11, 20, c1); rect(7, 12, 8, 16, c2); rect(10, 12, 11, 20, c1D); }
        if (L.outfit === 'shirt') rect(4, 17, 11, 17, dk(pants, 0.05));
      } else {
        if (L.outfit === 'coat') { rect(4, 12, 11, 20, c1); rect(10, 12, 11, 20, c1D); }
        if (L.outfit === 'overalls') { rect(5, 14, 10, 17, c1); set(5, 12, c1); set(5, 13, c1); set(10, 12, c1); set(10, 13, c1); }
        if (L.outfit === 'apron') { rect(4, 14, 11, 14, c2); }
      }
      if (L.outfit === 'dress') { for (let y = 15; y <= 19; y++) { const e = Math.floor((y - 15) / 2); rect(4 - e, y, 11 + e, y, y === 19 ? c1D : c1); rect(10 + e, y, 11 + e, y, c1D); } }
      // brazos con balanceo
      const lArm = 16 + (step === -1 ? 1 : 0), rArm = 16 + (step === 1 ? 1 : 0);
      const sleeve = L.outfit === 'overalls' ? c2 : c1;
      rect(3, 13, 3, lArm - 1, sleeve); set(3, lArm, skin); rect(12, 13, 12, rArm - 1, dk(sleeve)); set(12, rArm, skinD);
      // mochila
      if (L.acc === 'backpack') {
        if (up) { rect(5, 12, 10, 17, L.accC); rect(5, 12, 10, 13, lt(L.accC)); rect(6, 15, 9, 15, dk(L.accC)); }
        else { set(4, 13, dk(L.accC)); set(4, 14, dk(L.accC)); set(11, 13, dk(L.accC)); set(11, 14, dk(L.accC)); }
      }
      // cabeza
      ell(7.5, 7.5, 5, 5, (x, y, dx, dy) => (dx + dy > 0.9 ? skinD : skin));
      if (up) {
        // pelo por detrás
        ell(7.5, 7.2, 5.4, 5.3, (x, y, dx, dy) => (dy > 0.6 ? hairD : dx < -0.3 && dy < -0.2 ? hairL : hair));
        if (L.hairStyle === 'long') { rect(3, 8, 12, 14, hair); rect(3, 14, 12, 14, hairD); }
        if (L.hairStyle === 'pony') { rect(7, 11, 8, 16, hair); set(7, 16, hairD); set(8, 16, hairD); }
        if (L.hairStyle === 'bun') ell(7.5, 2, 2.2, 2, hair);
        if (L.hairStyle === 'spiky') for (const sx of [4, 7, 10]) { set(sx, 1, hair); set(sx + 1, 1, hair); set(sx, 0, hair); }
      } else {
        // cara
        const eye = '#2a1e28';
        set(5, 8, eye); set(5, 9, eye); set(10, 8, eye); set(10, 9, eye);
        set(4, 10, '#f0a0a0'); set(11, 10, '#f0a0a0');
        set(7, 11, '#c87868'); set(8, 11, '#c87868');
        if (L.acc === 'glasses') { rect(4, 8, 6, 8, '#3a3048'); rect(9, 8, 11, 8, '#3a3048'); set(7, 8, '#3a3048'); set(8, 8, '#3a3048'); }
        // pelo
        if (L.hairStyle !== 'bald') {
          ell(7.5, 6, 5.6, 4.4, (x, y, dx, dy) => (dx < -0.3 && dy < -0.3 ? hairL : hair), (x, y) => y <= 6);
          for (let x = 3; x <= 12; x++) if (x !== 5 && x !== 10) set(x, 7, x > 9 ? hairD : hair);
          rect(2, 6, 3, 10, hair); rect(12, 6, 13, 10, hairD);
          if (L.hairStyle === 'long') { rect(2, 10, 3, 15, hair); rect(12, 10, 13, 15, hairD); }
          if (L.hairStyle === 'pony') { set(13, 9, hairD); set(14, 10, hairD); set(14, 11, hairD); }
          if (L.hairStyle === 'bun') ell(7.5, 1.6, 2.2, 1.9, hair);
          if (L.hairStyle === 'spiky') for (const sx of [3, 6, 9, 12]) { set(sx, 1, hair); set(sx, 2, hair); set(sx + 1, 2, hair); }
          if (L.hairStyle === 'curly') for (const [x, y] of [[2, 5], [13, 5], [4, 2], [11, 2], [7, 1]]) ell(x + 0.5, y + 0.5, 1.4, 1.4, hair);
        }
      }
      // sombreros
      const hc = L.hatC;
      if (L.hat === 'cap') { ell(7.5, 4.6, 5.7, 3.5, (x, y, dx) => (dx > 0.4 ? dk(hc) : hc), (x, y) => y <= 6); if (!up) { rect(3, 6, 12, 7, dk(hc, 0.2)); rect(4, 6, 8, 6, dk(hc, 0.08)); } else rect(5, 6, 10, 6, dk(hc, 0.2)); set(7, 1, lt(hc, 0.2)); }
      else if (L.hat === 'beanie') { ell(7.5, 5, 6, 4.3, hc, (x, y) => y <= 6); rect(2, 6, 13, 7, lt(hc, 0.12)); ell(7.5, 0.8, 1.3, 1.1, '#f4f4f4'); }
      else if (L.hat === 'hardhat') { ell(7.5, 4.6, 6, 3.7, (x, y, dx) => (dx < -0.3 ? lt(hc) : hc), (x, y) => y <= 6); rect(1, 6, 14, 6, dk(hc, 0.12)); }
      else if (L.hat === 'sun') { ell(7.5, 6, 8, 2.2, dk(hc, 0.08)); ell(7.5, 4, 4.2, 2.8, hc, (x, y) => y <= 5); rect(4, 5, 11, 5, '#d84860'); }
      else if (L.hat === 'sailor') { ell(7.5, 4.6, 5.6, 3.2, '#f8f8f8', (x, y) => y <= 6); rect(3, 5, 12, 6, hc); }
      else if (L.hat === 'bandana') { rect(3, 4, 12, 6, hc); rect(3, 6, 12, 6, dk(hc)); if (up) { set(7, 7, hc); set(8, 8, hc); } }
    } else {
      // ---- vista lateral (mirando a la izquierda) ----
      const front = step === 1 ? -2 : step === -1 ? 1 : 0, back = step === 1 ? 2 : step === -1 ? -1 : 0;
      const legTop = L.outfit === 'dress' ? 19 : L.outfit === 'coat' ? 20 : 18;
      const legC = L.outfit === 'dress' ? skinD : pants;
      if (L.acc === 'backpack') { rect(10, 12, 12, 17, L.accC); rect(10, 12, 12, 12, lt(L.accC)); }
      // pierna trasera
      rect(7 + back, legTop, 9 + back, 21, dk(legC, 0.12)); rect(7 + back, 22, 9 + back, 23, dk(shoes, 0.1));
      // torso
      rect(5, 12, 10, 17, c1); rect(9, 12, 10, 17, c1D); rect(5, 12, 8, 12, c1L);
      if (L.outfit === 'jacket') rect(5, 12, 5, 17, c2);
      if (L.outfit === 'overalls') { rect(5, 12, 10, 17, c2); rect(5, 14, 9, 17, c1); rect(5, 18, 10, 18, c1); }
      if (L.outfit === 'apron') rect(4, 14, 5, 20, c2);
      if (L.outfit === 'coat') { rect(5, 12, 10, 20, c1); rect(9, 12, 10, 20, c1D); }
      if (L.outfit === 'dress') for (let y = 15; y <= 19; y++) { const e = Math.floor((y - 15) / 2); rect(5 - e, y, 10 + e, y, c1); }
      // pierna delantera
      rect(6 + front, legTop, 8 + front, 21, legC); rect(5 + front, 22, 8 + front, 23, shoes); set(5 + front, 22, lt(shoes, 0.12));
      // brazo
      const ax = 7 + (step === 1 ? 1 : step === -1 ? -1 : 0);
      const sleeve = L.outfit === 'overalls' ? c2 : c1;
      rect(ax, 13, ax + 1, 15, dk(sleeve, 0.06)); rect(ax, 16, ax + 1, 16, skin);
      // cabeza
      ell(7, 7.5, 5, 5, (x, y, dx, dy) => (dx + dy > 0.9 ? skinD : skin));
      set(1, 9, skin); // nariz
      const eye = '#2a1e28';
      set(4, 8, eye); set(4, 9, eye); set(3, 11, '#c87868'); set(5, 10, '#f0a0a0');
      if (L.acc === 'glasses') { rect(2, 8, 5, 8, '#3a3048'); rect(6, 8, 9, 8, '#3a3048'); }
      if (L.hairStyle !== 'bald') {
        ell(7.3, 6.6, 5.5, 5, (x, y, dx, dy) => (dy > 0.5 ? hairD : dx < -0.3 && dy < -0.3 ? hairL : hair), (x, y) => y <= 5 || x >= 7);
        rect(3, 5, 6, 6, hair); set(2, 6, hair); set(7, 9, skin); set(7, 10, skinD); // oreja
        if (L.hairStyle === 'long') rect(8, 9, 12, 15, hair);
        if (L.hairStyle === 'pony') { rect(12, 6, 13, 12, hair); set(13, 12, hairD); }
        if (L.hairStyle === 'bun') ell(10, 2.5, 2, 2, hair);
        if (L.hairStyle === 'spiky') for (const [x, y] of [[4, 1], [7, 0], [10, 1], [12, 3]]) { set(x, y, hair); set(x + 1, y + 1, hair); }
        if (L.hairStyle === 'curly') for (const [x, y] of [[11, 4], [11, 9], [6, 2]]) ell(x + 0.5, y + 0.5, 1.5, 1.5, hair);
      }
      const hc = L.hatC;
      if (L.hat === 'cap') { ell(7.2, 4.6, 5.6, 3.4, (x, y, dx) => (dx > 0.4 ? dk(hc) : hc), (x, y) => y <= 6); rect(0, 6, 5, 7, dk(hc, 0.2)); }
      else if (L.hat === 'beanie') { ell(7.2, 5, 5.9, 4.2, hc, (x, y) => y <= 6); rect(1, 6, 12, 7, lt(hc, 0.12)); ell(8, 0.8, 1.3, 1.1, '#f4f4f4'); }
      else if (L.hat === 'hardhat') { ell(7.2, 4.6, 6, 3.6, hc, (x, y) => y <= 6); rect(0, 6, 13, 6, dk(hc, 0.12)); }
      else if (L.hat === 'sun') { ell(7, 6, 8, 2, dk(hc, 0.08)); ell(7, 4, 4, 2.7, hc, (x, y) => y <= 5); rect(4, 5, 10, 5, '#d84860'); }
      else if (L.hat === 'sailor') { ell(7.2, 4.6, 5.5, 3.1, '#f8f8f8', (x, y) => y <= 6); rect(2, 5, 12, 6, hc); }
      else if (L.hat === 'bandana') { rect(2, 4, 12, 6, hc); set(13, 6, hc); set(14, 7, hc); }
    }
  },
  render(look) {
    const L = normLook(look);
    const [c, x] = U.makeCanvas(CW * 3, CH * 4);
    const dirs = ['down', 'up', 'left', 'right'];
    dirs.forEach((d, row) => {
      for (let f = 0; f < 3; f++) {
        const R = new Raster(CW, CH);
        this.drawCell(R, L, d === 'right' ? 'left' : d, f);
        const filled = R.c.map((v) => !!v);
        const n = (a, b) => a >= 0 && b >= 0 && a < CW && b < CH && filled[b * CW + a];
        // volumen: borde iluminado arriba-izquierda y sombra abajo-derecha
        const src = R.c.slice();
        for (let y = 0; y < CH; y++) for (let xx = 0; xx < CW; xx++) {
          const c0 = src[y * CW + xx];
          if (!c0 || c0 === '#2a1e28') continue;
          if (!n(xx + 1, y) || !n(xx, y + 1)) R.c[y * CW + xx] = U.shade(c0, -0.1, 0.02);
          else if ((!n(xx - 1, y) || !n(xx, y - 1)) && y > 2) R.c[y * CW + xx] = U.shade(c0, 0.07);
        }
        // contorno selectivo: toma el color vecino oscurecido
        for (let y = 0; y < CH; y++) for (let xx = 0; xx < CW; xx++) {
          if (filled[y * CW + xx]) continue;
          const nb = [[xx, y + 1], [xx + 1, y], [xx - 1, y], [xx, y - 1]].find(([a, b]) => n(a, b));
          if (!nb) continue;
          const below = nb[1] < y;
          R.set(xx, y, below ? '#1a1420' : U.shade(src[nb[1] * CW + nb[0]], -0.62, 0.03));
        }
        const cell = R.toCanvas();
        if (d === 'right') { x.save(); x.translate(f * CW + CW, row * CH); x.scale(-1, 1); x.drawImage(cell, 0, 0); x.restore(); }
        else x.drawImage(cell, f * CW, row * CH);
      }
    });
    return c;
  },
};

// sustituye al generador antiguo de 16x16
CharSprites.get = function (cfg) {
  const key = JSON.stringify(cfg);
  if (!this.cache[key]) this.cache[key] = CharGfx.render(cfg);
  return this.cache[key];
};
CharSprites.W = CW; CharSprites.H = CH;
