'use strict';
// ============================================================
//  PERSONAJES EN ALTA DEFINICIÓN (32x48 por fotograma)
//  El doble de resolución que los de 16x24: ojos con brillo, cejas,
//  nariz, boca y rubor; mechones y reflejos en el pelo; costuras,
//  cuellos, botones y bolsillos en la ropa; manos y zapatos con
//  volumen; balanceo de brazos y piernas al andar.
//  Se usa en el mundo 3D, en los retratos de combate y en el título;
//  el modo clásico mantiene los sprites de 16x24.
// ============================================================
const HCW = 32, HCH = 48;

const HiChar = {
  cache: {},
  get(look) {
    const key = JSON.stringify(look);
    if (!this.cache[key]) this.cache[key] = this.render(look);
    return this.cache[key];
  },
  drawCell(R, L, dir, frame) {
    const set = (x, y, c) => { if (c) R.set(x, y, c); };
    const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, typeof c === 'function' ? c(x, y) : c); };
    const ell = (cx, cy, rx, ry, c, clip) => {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1 && (!clip || clip(x, y))) set(x, y, typeof c === 'function' ? c(x, y, dx, dy) : c);
      }
    };
    const dk = (c, a = 0.14) => U.shade(c, -a, 0.02);
    const lt = (c, a = 0.1) => U.shade(c, a, -0.01);
    const skin = L.skin, skinD = dk(skin, 0.1), skinDD = dk(skin, 0.2), skinL = lt(skin, 0.06);
    const hair = L.hair, hairD = dk(hair, 0.16), hairDD = dk(hair, 0.3), hairL = lt(hair, 0.16);
    const c1 = L.c1, c1D = dk(c1), c1DD = dk(c1, 0.26), c1L = lt(c1), c2 = L.c2, c2D = dk(c2);
    const pants = L.pants, pantsD = dk(pants, 0.12), pantsL = lt(pants, 0.08), shoes = L.shoes, shoesL = lt(shoes, 0.14);
    const eye = '#241a2c', eyeHi = '#ffffff', mouth = '#b86060', blush = '#f2a0a0';
    const step = frame === 0 ? 0 : frame === 1 ? 1 : -1;
    const side = dir === 'left', up = dir === 'up';
    const O = L.outfit;
    const sleeve = O === 'overalls' ? c2 : c1, sleeveD = dk(sleeve);
    const hairCol = (x, y, dx, dy) => (dy > 0.55 ? hairD : (dx < -0.25 && dy < -0.35) || (dx < 0.1 && dx > -0.2 && dy < -0.6) ? hairL : hair);

    if (!side) {
      // ---------- piernas ----------
      const legTop = O === 'dress' ? 37 : O === 'coat' ? 39 : 35;
      const lBot = 42 + (step === 1 ? -2 : 0), rBot = 42 + (step === -1 ? -2 : 0);
      const legC = O === 'dress' ? skinD : pants;
      rect(10, legTop, 14, lBot, (x) => (x === 10 ? lt(legC, 0.06) : legC)); rect(17, legTop, 21, rBot, (x) => (x >= 20 ? dk(legC, 0.1) : legC));
      if (O !== 'dress') { set(15, legTop, pantsD); set(16, legTop, pantsD); }
      // zapatos
      for (const [x0, bot] of [[9, lBot], [17, rBot]]) { rect(x0, bot + 1, x0 + 5, bot + 3, shoes); rect(x0 + 1, bot + 1, x0 + 3, bot + 1, shoesL); rect(x0, bot + 3, x0 + 5, bot + 3, dk(shoes, 0.18)); }
      // ---------- mochila desde atrás ----------
      if (up && L.acc === 'backpack') { /* se dibuja después del torso */ }
      // ---------- torso ----------
      const tBot = O === 'coat' ? 39 : 35;
      for (let y = 23; y <= tBot; y++) {
        const x0 = y === 23 ? 10 : y === 24 ? 9 : 8, x1 = y === 23 ? 21 : y === 24 ? 22 : 23;
        for (let x = x0; x <= x1; x++) set(x, y, x >= x1 - 2 ? c1D : y === 24 && x < 16 ? c1L : c1);
      }
      if (!up) {
        if (O === 'shirt') { set(14, 23, c2); set(17, 23, c2); set(15, 24, c2); set(16, 24, c2); rect(8, 34, 23, 35, pantsD); set(15, 34, '#d8c060'); set(16, 34, '#d8c060'); }
        if (O === 'jacket') { rect(14, 23, 17, tBot, c2); rect(13, 23, 13, 29, c1DD); rect(18, 23, 18, 29, c1DD); for (let y = 26; y < tBot; y += 3) set(15, y, dk(c2, 0.2)); set(10, 30, c1D); set(21, 30, c1DD); }
        if (O === 'coat') { rect(15, 23, 16, tBot, c1DD); for (let y = 27; y <= 37; y += 4) { set(13, y, '#e8d8a0'); set(18, y, '#e8d8a0'); } rect(12, 23, 19, 24, c2); rect(9, 32, 22, 32, c1D); }
        if (O === 'overalls') { rect(8, 23, 23, 35, c2); rect(10, 23, 23, 35, (x) => (x >= 21 ? c2D : c2)); rect(11, 27, 20, 35, c1); rect(11, 27, 20, 27, c1L); rect(11, 23, 12, 27, c1); rect(19, 23, 20, 27, c1); set(12, 28, '#e8d8a0'); set(19, 28, '#e8d8a0'); rect(13, 30, 18, 32, c1D); }
        if (O === 'apron') { rect(10, 27, 21, 39, c2); rect(10, 27, 21, 27, lt(c2)); rect(13, 33, 18, 36, c2D); rect(13, 33, 18, 33, dk(c2, 0.3)); rect(14, 23, 14, 26, c2D); rect(17, 23, 17, 26, c2D); }
        if (O === 'dress') { rect(12, 23, 19, 24, c2); rect(8, 30, 23, 30, c2); }
      } else {
        rect(15, 24, 16, tBot, c1D);
        if (O === 'overalls') { rect(11, 23, 12, 30, c1); rect(19, 23, 20, 30, c1); rect(10, 30, 21, 35, c1); }
        if (O === 'apron') { rect(8, 30, 23, 31, c2); }
      }
      if (O === 'dress') for (let y = 31; y <= 39; y++) { const e = Math.floor((y - 31) / 2); rect(8 - e, y, 23 + e, y, (x) => (y === 39 ? c1DD : x >= 21 + e ? c1D : (x - y) % 7 === 0 ? c1L : c1)); }
      // mochila
      if (L.acc === 'backpack') {
        const A = L.accC;
        if (up) { rect(9, 23, 22, 35, A); rect(9, 23, 22, 25, lt(A)); rect(11, 29, 20, 33, dk(A)); rect(11, 29, 20, 29, dk(A, 0.3)); rect(20, 23, 22, 35, dk(A)); set(15, 31, '#e8e0d0'); set(16, 31, '#e8e0d0'); }
        else { rect(9, 23, 10, 31, dk(A)); rect(21, 23, 22, 31, dk(A, 0.25)); }
      }
      // ---------- brazos ----------
      const lArm = 32 + (step === -1 ? 2 : step === 1 ? -1 : 0), rArm = 32 + (step === 1 ? 2 : step === -1 ? -1 : 0);
      rect(5, 25, 7, lArm, (x) => (x === 5 ? lt(sleeve, 0.06) : sleeve)); set(6, 24, sleeve); set(7, 24, sleeve);
      rect(24, 25, 26, rArm, sleeveD); set(24, 24, sleeveD); set(25, 24, sleeveD);
      if (O === 'overalls' || O === 'shirt') { rect(5, 29, 7, lArm, skin); rect(24, 29, 26, rArm, skinD); rect(5, 28, 7, 28, sleeve); rect(24, 28, 26, 28, sleeveD); }
      else { rect(5, lArm, 7, lArm, dk(sleeve, 0.2)); rect(24, rArm, 26, rArm, dk(sleeve, 0.3)); }
      ell(6.5, lArm + 2, 1.9, 1.8, skin); ell(25.5, rArm + 2, 1.9, 1.8, skinD);
      // ---------- cuello y cabeza ----------
      rect(13, 20, 18, 23, skinD); rect(13, 22, 18, 22, skinDD);
      // orejas
      ell(6.5, 14, 1.6, 2.2, skinD); ell(25.5, 14, 1.6, 2.2, skinDD);
      ell(16, 12.5, 9.2, 9.6, (x, y, dx, dy) => (dx + dy * 0.6 > 0.95 ? skinD : dx < -0.55 && dy < -0.2 ? skinL : skin));
      if (up) {
        // pelo por detrás
        if (L.hairStyle !== 'bald') ell(16, 12, 9.8, 10, (x, y, dx, dy) => (dy > 0.62 ? hairDD : Math.abs(dx) > 0.75 && dy > -0.3 ? hairD : hairCol(x, y, dx, dy)));
        else ell(16, 12, 9.2, 9.6, (x, y, dx, dy) => (dx < -0.3 && dy < -0.4 ? skinL : skin));
        if (L.hairStyle === 'long') { rect(7, 16, 24, 30, (x) => (x === 11 || x === 16 || x >= 21 ? hairD : hair)); rect(8, 30, 23, 31, hairDD); }
        if (L.hairStyle === 'pony') { ell(16, 22, 2.4, 6, (x, y, dx) => (dx > 0.2 ? hairD : hair)); rect(14, 15, 17, 16, '#e05060'); }
        if (L.hairStyle === 'bun') { ell(16, 3, 4.2, 3.6, (x, y, dx, dy) => (dy < -0.3 && dx < 0 ? hairL : hair)); rect(13, 6, 18, 6, '#e05060'); }
        if (L.hairStyle === 'spiky') for (const sx of [8, 12, 16, 20, 24]) for (let k = 0; k < 4; k++) rect(sx - (3 - k) / 2, 1 + k, sx + (3 - k) / 2, 1 + k, hair);
        if (L.hairStyle === 'curly') for (const [x, y] of [[7, 8], [25, 8], [10, 3], [22, 3], [16, 2], [7, 15], [25, 15]]) ell(x, y, 2.8, 2.8, (xx, yy, dx, dy) => (dy < -0.3 ? hairL : hair));
      } else {
        // ---------- cara ----------
        for (const ex of [10, 19]) {
          rect(ex, 13, ex + 2, 16, eye); set(ex, 13, eyeHi); set(ex + 1, 16, '#5a4070');
          rect(ex, 11, ex + 2, 11, hairD);
        }
        set(15, 17, skinD); set(16, 17, skinDD);
        rect(14, 19, 17, 19, mouth); set(14, 19, dk(mouth, 0.1)); set(17, 19, dk(mouth, 0.1));
        rect(8, 17, 9, 17, blush); rect(22, 17, 23, 17, blush);
        if (L.acc === 'glasses') { const g = '#3a3048'; for (const ex of [9, 18]) { rect(ex, 12, ex + 4, 12, g); rect(ex, 17, ex + 4, 17, g); rect(ex, 12, ex, 17, g); rect(ex + 4, 12, ex + 4, 17, g); set(ex + 1, 13, '#c8e8ff'); } rect(14, 13, 17, 13, g); }
        // ---------- pelo ----------
        if (L.hairStyle !== 'bald') {
          ell(16, 9.5, 10.2, 7.6, hairCol, (x, y) => y <= 10);
          // flequillo en mechones
          for (let x = 7; x <= 25; x++) { const d = [0, 1, 2, 1, 0, 2, 1][x % 7]; rect(x, 10, x, 10 + d, x >= 22 ? hairD : hair); }
          set(12, 8, hairL); set(13, 7, hairL); set(14, 7, hairL); set(10, 9, hairL);
          rect(5, 9, 7, L.hairStyle === 'long' ? 32 : 18, (x, y) => (x === 5 ? hairD : (y % 5 === 0 ? hairD : hair)));
          rect(24, 9, 26, L.hairStyle === 'long' ? 32 : 18, (x, y) => (x === 26 ? hairDD : hairD));
          if (L.hairStyle === 'long') { rect(5, 31, 7, 32, hairDD); rect(24, 31, 26, 32, hairDD); }
          if (L.hairStyle === 'pony') { rect(26, 14, 28, 24, (x, y) => (x === 28 ? hairDD : hairD)); set(26, 13, '#e05060'); set(27, 13, '#e05060'); }
          if (L.hairStyle === 'bun') { ell(16, 2.2, 4.2, 3.4, (x, y, dx, dy) => (dy < -0.3 && dx < 0 ? hairL : hair)); rect(13, 5, 18, 5, '#e05060'); }
          if (L.hairStyle === 'spiky') for (const sx of [7, 11, 16, 21, 25]) for (let k = 0; k < 4; k++) rect(Math.round(sx - (3 - k) / 2), 1 + k, Math.round(sx + (3 - k) / 2), 1 + k, k === 0 ? hairL : hair);
          if (L.hairStyle === 'curly') for (const [x, y] of [[5, 7], [27, 7], [9, 2], [23, 2], [16, 1], [5, 14], [27, 14]]) ell(x, y, 2.8, 2.8, (xx, yy, dx, dy) => (dy < -0.3 ? hairL : dx > 0.3 ? hairD : hair));
        } else { set(12, 5, skinL); set(13, 5, skinL); set(12, 6, skinL); }
      }
      // ---------- sombreros ----------
      const hc = L.hatC;
      if (L.hat === 'cap') { ell(16, 8, 10.4, 6.6, (x, y, dx) => (dx > 0.45 ? dk(hc) : dx < -0.4 ? lt(hc, 0.08) : hc), (x, y) => y <= 11); if (!up) { rect(6, 11, 25, 13, dk(hc, 0.22)); rect(8, 11, 16, 11, dk(hc, 0.1)); } else rect(9, 11, 22, 12, dk(hc, 0.22)); ell(16, 2.2, 1.6, 1.2, lt(hc, 0.2)); rect(13, 6, 18, 8, up ? hc : lt(hc, 0.15)); }
      else if (L.hat === 'beanie') { ell(16, 9, 11, 8, (x, y, dx) => ((x % 3 === 0) ? dk(hc, 0.08) : dx > 0.45 ? dk(hc) : hc), (x, y) => y <= 11); rect(4, 11, 27, 14, (x) => (x % 2 ? lt(hc, 0.14) : lt(hc, 0.06))); ell(16, 1.2, 2.6, 2.2, '#f4f4f4'); }
      else if (L.hat === 'hardhat') { ell(16, 8.4, 11, 7, (x, y, dx) => (dx < -0.35 ? lt(hc) : dx > 0.45 ? dk(hc) : hc), (x, y) => y <= 11); rect(2, 11, 29, 12, dk(hc, 0.14)); rect(15, 2, 16, 11, lt(hc, 0.14)); }
      else if (L.hat === 'sun') { ell(16, 11, 15.5, 3.6, (x, y, dx, dy) => (dy > 0.2 ? dk(hc, 0.18) : dk(hc, 0.05))); ell(16, 7, 8, 5.6, (x, y, dx) => (dx > 0.4 ? dk(hc, 0.1) : hc), (x, y) => y <= 10); rect(8, 9, 23, 10, '#d84860'); }
      else if (L.hat === 'sailor') { ell(16, 8, 10, 5.8, (x, y, dx) => (dx > 0.45 ? '#d8d8e0' : '#f8f8f8'), (x, y) => y <= 11); rect(5, 10, 26, 12, hc); rect(5, 12, 26, 12, dk(hc)); set(16, 6, hc); }
      else if (L.hat === 'bandana') { rect(5, 7, 26, 11, (x, y) => ((x + y) % 4 === 0 ? lt(hc, 0.2) : hc)); rect(5, 11, 26, 11, dk(hc)); if (up) { rect(15, 12, 17, 15, hc); rect(17, 15, 19, 17, dk(hc)); } }
    } else {
      // ---------- vista lateral (mirando a la izquierda) ----------
      const front = step === 1 ? -3 : step === -1 ? 2 : 0, back = step === 1 ? 3 : step === -1 ? -2 : 0;
      const legTop = O === 'dress' ? 37 : O === 'coat' ? 39 : 35;
      const legC = O === 'dress' ? skinD : pants;
      if (L.acc === 'backpack') { rect(20, 23, 24, 35, L.accC); rect(20, 23, 24, 24, lt(L.accC)); rect(23, 25, 24, 35, dk(L.accC)); rect(21, 29, 23, 32, dk(L.accC, 0.2)); }
      // pierna trasera
      rect(15 + back, legTop, 18 + back, 43, dk(legC, 0.14)); rect(14 + back, 44, 19 + back, 46, dk(shoes, 0.12));
      // brazo trasero
      const ba = step === 1 ? 2 : step === -1 ? -2 : 0;
      rect(16 + ba, 25, 18 + ba, 32, dk(sleeve, 0.22)); ell(17 + ba, 34, 1.7, 1.7, skinDD);
      // torso
      for (let y = 23; y <= (O === 'coat' ? 39 : 35); y++) rect(y === 23 ? 12 : 11, y, y === 23 ? 19 : 20, y, (x) => (x >= 19 ? c1D : y === 24 && x < 15 ? c1L : c1));
      if (O === 'jacket') { rect(11, 23, 12, 35, c2); rect(13, 23, 13, 28, c1DD); }
      if (O === 'overalls') { rect(11, 23, 20, 35, c2); rect(11, 27, 18, 35, c1); rect(16, 23, 17, 27, c1); }
      if (O === 'apron') rect(9, 27, 11, 39, c2);
      if (O === 'coat') { rect(19, 23, 20, 39, c1D); rect(11, 31, 20, 31, c1D); }
      if (O === 'shirt') rect(11, 34, 20, 35, pantsD);
      if (O === 'dress') for (let y = 31; y <= 39; y++) { const e = Math.floor((y - 31) / 2); rect(11 - e, y, 20 + e, y, y === 39 ? c1DD : c1); }
      // pierna delantera
      rect(12 + front, legTop, 15 + front, 43, (x) => (x === 12 + front ? lt(legC, 0.06) : legC)); rect(10 + front, 44, 15 + front, 46, shoes); rect(10 + front, 44, 12 + front, 44, shoesL);
      // brazo delantero
      const fa = step === 1 ? -2 : step === -1 ? 2 : 0;
      rect(13 + fa, 25, 15 + fa, 32, (x) => (x === 13 + fa ? lt(sleeve, 0.06) : dk(sleeve, 0.06)));
      if (O === 'overalls' || O === 'shirt') rect(13 + fa, 29, 15 + fa, 32, skin);
      ell(14 + fa, 34, 1.9, 1.8, skin);
      // cuello y cabeza
      rect(13, 20, 17, 23, skinD);
      ell(14.5, 12.5, 8.8, 9.4, (x, y, dx, dy) => (dx + dy * 0.6 > 0.95 ? skinD : dx < -0.55 && dy < -0.2 ? skinL : skin));
      set(5, 15, skin); set(5, 16, skinD); set(6, 17, skinD); // nariz
      rect(8, 13, 10, 16, eye); set(8, 13, eyeHi); rect(8, 11, 10, 11, hairD);
      rect(7, 19, 9, 19, mouth); rect(10, 17, 11, 17, blush);
      if (L.acc === 'glasses') { const g = '#3a3048'; rect(6, 12, 11, 12, g); rect(6, 17, 11, 17, g); rect(11, 12, 11, 17, g); rect(12, 13, 19, 13, g); }
      if (L.hairStyle !== 'bald') {
        ell(15, 10.5, 9.6, 9, hairCol, (x, y) => y <= 9 || x >= 14);
        for (let x = 6; x <= 14; x++) rect(x, 9, x, 9 + [0, 1, 2, 1][x % 4], hair);
        ell(18, 15, 1.7, 2.3, skinD); set(18, 15, skinDD); // oreja
        if (L.hairStyle === 'long') rect(17, 16, 24, 31, (x, y) => ((x + y) % 4 === 0 ? hairD : x >= 22 ? hairD : hair));
        if (L.hairStyle === 'pony') { rect(23, 12, 26, 26, (x) => (x >= 25 ? hairD : hair)); set(23, 11, '#e05060'); set(24, 11, '#e05060'); }
        if (L.hairStyle === 'bun') ell(20, 4, 4, 3.6, (x, y, dx, dy) => (dy < -0.3 ? hairL : hair));
        if (L.hairStyle === 'spiky') for (const [x, y] of [[8, 2], [13, 0], [18, 1], [23, 4]]) for (let k = 0; k < 4; k++) rect(x - (3 - k) / 2, y + k, x + (3 - k) / 2, y + k, hair);
        if (L.hairStyle === 'curly') for (const [x, y] of [[22, 8], [22, 17], [12, 3], [18, 2]]) ell(x, y, 3, 3, (xx, yy, dx, dy) => (dy < -0.3 ? hairL : hair));
      } else { ell(18, 15, 1.7, 2.3, skinD); set(13, 5, skinL); }
      const hc = L.hatC;
      if (L.hat === 'cap') { ell(15, 8, 10, 6.4, (x, y, dx) => (dx > 0.45 ? dk(hc) : hc), (x, y) => y <= 11); rect(1, 11, 11, 13, dk(hc, 0.22)); }
      else if (L.hat === 'beanie') { ell(15, 9, 10.6, 7.8, (x) => (x % 3 === 0 ? dk(hc, 0.08) : hc), (x, y) => y <= 11); rect(3, 11, 25, 14, lt(hc, 0.1)); ell(17, 1.2, 2.6, 2.2, '#f4f4f4'); }
      else if (L.hat === 'hardhat') { ell(15, 8.4, 10.8, 7, hc, (x, y) => y <= 11); rect(1, 11, 27, 12, dk(hc, 0.14)); }
      else if (L.hat === 'sun') { ell(15, 11, 15, 3.4, dk(hc, 0.08)); ell(15, 7, 8, 5.4, hc, (x, y) => y <= 10); rect(8, 9, 21, 10, '#d84860'); }
      else if (L.hat === 'sailor') { ell(15, 8, 9.8, 5.6, '#f8f8f8', (x, y) => y <= 11); rect(4, 10, 25, 12, hc); }
      else if (L.hat === 'bandana') { rect(4, 7, 25, 11, hc); rect(4, 11, 25, 11, dk(hc)); rect(26, 11, 28, 13, hc); rect(27, 13, 29, 16, dk(hc)); }
    }
  },
  render(look) {
    const L = normLook(look);
    const [c, x] = U.makeCanvas(HCW * 3, HCH * 4);
    ['down', 'up', 'left', 'right'].forEach((d, row) => {
      for (let f = 0; f < 3; f++) {
        const R = new Raster(HCW, HCH);
        this.drawCell(R, L, d === 'right' ? 'left' : d, f);
        const filled = R.c.map((v) => !!v), src = R.c.slice();
        const n = (a, b) => a >= 0 && b >= 0 && a < HCW && b < HCH && filled[b * HCW + a];
        // contorno: oscuro debajo, color vecino oscurecido en los lados (contorno "selectivo")
        for (let y = 0; y < HCH; y++) for (let xx = 0; xx < HCW; xx++) {
          if (filled[y * HCW + xx]) continue;
          const nb = [[xx, y + 1], [xx + 1, y], [xx - 1, y], [xx, y - 1]].find(([a, b]) => n(a, b));
          if (!nb) continue;
          R.set(xx, y, nb[1] < y ? '#1a1420' : U.shade(src[nb[1] * HCW + nb[0]], -0.6, 0.03));
        }
        const cell = R.toCanvas();
        if (d === 'right') { x.save(); x.translate(f * HCW + HCW, row * HCH); x.scale(-1, 1); x.drawImage(cell, 0, 0); x.restore(); }
        else x.drawImage(cell, f * HCW, row * HCH);
      }
    });
    return c;
  },
};

// ---------- dónde se usan ----------
// mundo 3D: las personas se dibujan con el sprite HD (el lienzo del sprite es del doble de tamaño)
{
  const _de = World.drawEntity;
  World.drawEntity = function (ctx, e, cx, cy) {
    if (!World.hiDraw || e === this.follower || (e.def && e.def.creature) || e.lying || (e === this.player && this.swimming)) return _de.call(this, ctx, e, cx, cy);
    const sx = Math.round(e.px - cx), sy = Math.round(e.py - cy), hop = e.hop || 0;
    const look = e === this.player ? LOOKS.player : LOOKS[e.look] || LOOKS.boy;
    let frame = 0;
    if (e.moving && e.jump <= 0) frame = e.t < 0.5 ? (e.step % 2 ? 1 : 2) : 0;
    ctx.drawImage(HiChar.get(look), frame * HCW, DIR_ROW[e.dir] * HCH, HCW, HCH, sx, sy - 9 - hop - (frame ? 1 : 0), 16, 24);
    const t = this.tileAt(e.moving ? (e.t > 0.5 ? e.tx : e.fx) : e.x, e.moving ? (e.t > 0.5 ? e.ty : e.fy) : e.y);
    if (t && t.grass && !hop && !(typeof World3D !== 'undefined' && World3D.usable(this))) ctx.drawImage(Tiles.get('tallgrass_top', Math.floor(Engine.time * 3) % 2), sx, sy);
  };
  // entrenador en combate
  const BP = BattleScene.prototype, _dt = BP.drawTrainer;
  BP.drawTrainer = function (ctx) {
    const T = this.trainer;
    if (!World.hiDraw || !T) return _dt.call(this, ctx);
    const frame = T.step % 2 === 1 ? (T.step === 1 ? 1 : 2) : 0;
    if (T.stun > 0 && Math.floor(this.t * 12) % 2) ctx.globalAlpha = 0.5;
    ctx.drawImage(HiChar.get(LOOKS.player), frame * HCW, DIR_ROW[T.dir] * HCH, HCW, HCH, Math.round(T.x - 8), Math.round(T.y - 23), 16, 24);
    ctx.globalAlpha = 1;
    if (T.stun > 0) for (let i = 0; i < 3; i++) { const a = this.t * 6 + i * 2.1; Font.draw(ctx, '★', Math.round(T.x + Math.cos(a) * 7) - 2, Math.round(T.y - 28 + Math.sin(a) * 2), '#ffe060'); }
  };
}
// retratos ampliados (combate, historia, mapa, ficha): con el sprite HD se ven el doble de nítidos
{
  const _get = CharSprites.get.bind(CharSprites);
  CharSprites.hd = (look) => HiChar.get(look);
}
