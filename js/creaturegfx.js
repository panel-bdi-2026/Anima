'use strict';
// ============================================================
//  Generador de sprites de criaturas (diseños originales)
//  Cada especie se describe con parámetros (cuerpo, colores, rasgos)
//  y se rasteriza a cualquier tamaño con sombreado y contorno.
// ============================================================

const FIRE_PAL = { hi: '#fff0a0', base: '#ff9a38', sh: '#e85020', line: '#a83010' };
const ELEC_PAL = { hi: '#fffbd0', base: '#ffe048', sh: '#e0a818', line: '#906010' };

function mkPal(hex) {
  return { hi2: U.shade(hex, 0.24, -0.03, 0.06), hi: U.shade(hex, 0.12, -0.015, 0.05), base: hex, sh: U.shade(hex, -0.13, 0.02), sh2: U.shade(hex, -0.24, 0.035), line: U.shade(hex, -0.38, 0.03) };
}

class Raster {
  constructor(w, h) { this.w = w; this.h = h; this.c = new Array(w * h).fill(null); }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.c[y * this.w + x]; }
  set(x, y, col) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y * this.w + x] = col; }
  toCanvas() {
    const [cv, ctx] = U.makeCanvas(this.w, this.h);
    const img = ctx.createImageData(this.w, this.h);
    const cache = {};
    for (let i = 0; i < this.c.length; i++) {
      const col = this.c[i]; if (!col) continue;
      const rgb = cache[col] || (cache[col] = U.hexToRgb(col));
      img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}

const CreatureGfx = {
  cache: {},
  get(speciesId, S, shiny) {
    const key = speciesId + ':' + S + (shiny ? ':s' : '');
    if (!this.cache[key]) {
      let sp = SPECIES[speciesId];
      if (shiny) {
        const L0 = sp.look, sh = (c) => (c ? U.shade(c, 0.04, 0.42, 0.05) : c);
        sp = Object.assign({}, sp, { look: Object.assign({}, L0, { c1: sh(L0.c1), c2: L0.c2, c3: sh(L0.c3), eyeColor: L0.eyeColor }) });
      }
      this.cache[key] = this.render(sp, S);
    }
    return this.cache[key];
  },
  // silueta blanca para destellos de daño
  flash(speciesId, S, color = '#ffffff') {
    const key = speciesId + ':' + S + ':f' + color;
    if (!this.cache[key]) {
      const src = this.get(speciesId, S);
      const [c, x] = U.makeCanvas(S, S);
      x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, S, S);
      this.cache[key] = c;
    }
    return this.cache[key];
  },

  render(sp, S, layered) {
    const L = sp.look;
    // capas (en modo animado cada parte del cuerpo va en su propia capa)
    const layers = {}; let curName = 'all';
    const RR = (n) => layers[n] || (layers[n] = new Raster(S, S));
    const R = { get: (x, y) => RR(curName).get(x, y), set: (x, y, c) => RR(curName).set(x, y, c) };
    const use = (n) => { if (layered) curName = n; };
    const eyeBoxes = [];
    const k = S / 32, sz = L.size || 1;
    const TX = (x) => (16 + (x - 16) * sz) * k, TY = (y) => (30.5 + (y - 30.5) * sz) * k, TR = (r) => Math.max(0.6, r * sz * k);
    const p1 = mkPal(L.c1), p2 = mkPal(L.c2 || U.shade(L.c1, 0.25)), p3 = mkPal(L.c3 || U.shade(L.c1, -0.15));
    const pDark = { hi: p1.sh, base: p1.sh, sh: p1.line, line: p1.line };
    const pals = { 1: p1, 2: p2, 3: p3, fire: FIRE_PAL, elec: ELEC_PAL, dark: pDark, beak: mkPal('#f8c040'), white: mkPal('#f4f2f8'), leg: mkPal(L.leg || '#e89040') };
    const pal = (p) => (typeof p === 'object' ? p : pals[p] || mkPal(p));

    // --- rasterización a máscara ---
    const maskEll = (cx, cy, rx, ry) => {
      const px = TX(cx), py = TY(cy), ax = TR(rx), ay = TR(ry === undefined ? rx : ry);
      const out = [];
      for (let y = Math.floor(py - ay - 1); y <= Math.ceil(py + ay + 1); y++)
        for (let x = Math.floor(px - ax - 1); x <= Math.ceil(px + ax + 1); x++) {
          const dx = (x + 0.5 - px) / ax, dy = (y + 0.5 - py) / ay;
          if (dx * dx + dy * dy <= 1) out.push([x, y]);
        }
      return out;
    };
    const maskPoly = (pts) => {
      const P2 = pts.map(([x, y]) => [TX(x), TY(y)]);
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const [x, y] of P2) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const out = [];
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++)
        for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
          const tx = x + 0.5, ty = y + 0.5; let ins = false;
          for (let i = 0, j = P2.length - 1; i < P2.length; j = i++) {
            const [xi, yi] = P2[i], [xj, yj] = P2[j];
            if ((yi > ty) !== (yj > ty) && tx < ((xj - xi) * (ty - yi)) / (yj - yi) + xi) ins = !ins;
          }
          if (ins) out.push([x, y]);
        }
      return out;
    };
    const maskCap = (ax, ay, bx, by, r) => {
      const A = [TX(ax), TY(ay)], B = [TX(bx), TY(by)], rr = Math.max(0.55, TR(r));
      const out = [];
      for (let y = Math.floor(Math.min(A[1], B[1]) - rr - 1); y <= Math.ceil(Math.max(A[1], B[1]) + rr + 1); y++)
        for (let x = Math.floor(Math.min(A[0], B[0]) - rr - 1); x <= Math.ceil(Math.max(A[0], B[0]) + rr + 1); x++) {
          const px = x + 0.5, py = y + 0.5, vx = B[0] - A[0], vy = B[1] - A[1];
          const t = U.clamp(((px - A[0]) * vx + (py - A[1]) * vy) / (vx * vx + vy * vy || 1), 0, 1);
          if (Math.hypot(px - (A[0] + vx * t), py - (A[1] + vy * t)) <= rr) out.push([x, y]);
        }
      return out;
    };
    const fill = (mask, pp, opt = {}) => {
      if (!mask.length) return;
      const P0 = pal(pp);
      const set = new Set(mask.map(([x, y]) => y * 10000 + x));
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const [x, y] of mask) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2, hx = Math.max(1, (x1 - x0 + 1) / 2), hy = Math.max(1, (y1 - y0 + 1) / 2);
      for (const [x, y] of mask) {
        if (x < 0 || y < 0 || x >= S || y >= S) continue;
        const nx = (x + 0.5 - cx) / hx, ny = (y + 0.5 - cy) / hy;
        const d = nx * nx + ny * ny, lit = -(nx * 0.6 + ny * 0.8);
        let col = P0.base;
        if (opt.flat) col = P0.base;
        else {
          // sombreado en 5 tonos con tramado + luz rebotada en el borde inferior
          const bay = ([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][(y & 3) * 4 + (x & 3)] / 16 - 0.47) * (S >= 24 ? 0.32 : 0.12);
          const v = lit * 0.62 + (0.32 - d * 0.42) + bay;
          col = v > 0.78 && d < 0.35 && S >= 24 ? (P0.hi2 || P0.hi) : v > 0.36 ? P0.hi : v > -0.12 ? P0.base : v > -0.42 ? P0.sh : (P0.sh2 || P0.sh);
          if (S >= 24 && lit < -0.45 && d > 0.62 && d < 0.86) col = P0.sh;
        }
        const edge = !set.has(y * 10000 + x - 1) || !set.has(y * 10000 + x + 1) || !set.has((y - 1) * 10000 + x) || !set.has((y + 1) * 10000 + x);
        if (edge && R.get(x, y) && opt.line !== false && S >= 24) col = P0.line;
        R.set(x, y, col);
      }
    };
    const ell = (cx, cy, rx, ry, p, o) => fill(maskEll(cx, cy, rx, ry), p, o);
    const poly = (pts, p, o) => fill(maskPoly(pts), p, o);
    const cap = (ax, ay, bx, by, r, p, o) => fill(maskCap(ax, ay, bx, by, r), p, o);

    // --- plantillas de cuerpo ---
    const A = {}; // anclas
    const behind = [], front = [];
    const T = {
      quad() {
        cap(13, 22, 13.5, 28, 1.7, 'dark'); cap(23, 21, 23.5, 28, 1.7, 'dark');
        A.body = () => ell(17.5, 21, 8.5, 5.6, 1);
        A.after = () => { cap(10.5, 22, 10, 28.3, 1.8, 1); cap(20, 22, 20, 28.3, 1.8, 1); if (L.pattern !== 'none') ell(15, 23.5, 5, 2.5, 2, { line: false }); };
        A.head = () => { ell(9.5, 14.5, 5.8, 5.4, 1); ell(6.2, 16.6, 2.8, 2.1, 2); ell(4.1, 15.8, 0.9, 0.7, 'dark', { flat: true }); };
        A.eyes = [[7.4, 13.6], [11.3, 13.6]]; A.top = [9.5, 9]; A.ears = [[6.6, 10.2], [12.6, 10]];
        A.tail = [25.5, 18.5]; A.back = [18, 15.6]; A.cheek = [12, 16.5];
      },
      biped() {
        ell(12.5, 28.6, 3.2, 1.9, 'dark'); ell(19.5, 28.6, 3.2, 1.9, 'dark');
        A.body = () => ell(16, 22, 6.8, 6.6, 1);
        A.after = () => { if (L.pattern !== 'none') ell(15.6, 23.3, 4.2, 4.6, 2, { line: false }); ell(9.3, 21.5, 2, 3.2, 1); ell(22.7, 21.5, 2, 3.2, 1); };
        A.head = () => ell(16, 11.8, 7.2, 6.8, 1);
        A.eyes = [[13, 11.8], [19, 11.8]]; A.top = [16, 5]; A.ears = [[10.8, 6.8], [21.2, 6.8]];
        A.tail = [22, 25.5]; A.back = [16, 17]; A.cheek = [16, 14.5];
      },
      round() {
        ell(12, 29, 3, 1.8, 'dark'); ell(20, 29, 3, 1.8, 'dark');
        A.body = () => ell(16, 20, 9.6, 9.2, 1);
        A.after = () => { if (L.pattern === 'belly') ell(15.5, 22.5, 6, 5, 2, { line: false }); ell(6.8, 21.5, 2, 2.4, 1); ell(25.2, 21.5, 2, 2.4, 1); };
        A.head = () => {};
        A.eyes = [[12.6, 17.6], [18.8, 17.6]]; A.top = [16, 11]; A.ears = [[10.5, 12.6], [21.5, 12.6]];
        A.tail = [25, 23]; A.back = [16, 12]; A.cheek = [16, 21];
      },
      bird() {
        cap(14, 25, 14, 29.3, 0.7, 'leg'); cap(18.5, 25, 18.5, 29.3, 0.7, 'leg');
        A.body = () => { poly([[22, 21], [30.5, 25.5], [29.5, 18.5]], 3); ell(17.5, 20, 7.2, 6.8, 1); };
        A.after = () => { if (L.pattern !== 'none') ell(15, 22.5, 4.2, 3.8, 2, { line: false }); if (!L.wings) ell(20, 19.8, 5.2, 3.8, 3); };
        A.head = () => { ell(12.8, 11.5, 5.6, 5.3, 1); poly([[8.6, 10.2], [3.5, 12.6], [8.6, 14]], 'beak'); };
        A.eyes = [[11.2, 10.8], [14.8, 10.8]]; A.top = [12.8, 6]; A.ears = [[10.5, 7.2], [15, 7]];
        A.tail = [26, 22]; A.back = [20, 14.5]; A.cheek = [13, 13.5];
      },
      bug() {
        A.body = () => { ell(24, 25, 3.8, 3.6, 1); ell(18, 24.6, 4.6, 4.3, 1); };
        A.after = () => { for (const x of [16, 20, 24]) ell(x, 28.6, 1, 0.9, 'dark', { flat: true }); if (L.pattern === 'spots') { ell(18, 22.6, 1.3, 1.1, 3); ell(24, 23.2, 1.1, 1, 3); } };
        A.head = () => ell(11, 21.5, 5.8, 5.6, 1);
        A.eyes = [[9, 20.8], [12.8, 20.8]]; A.top = [11, 16]; A.ears = [[8.5, 16.6], [13.5, 16.6]];
        A.tail = [27.5, 24]; A.back = [20, 20]; A.cheek = [11, 24];
      },
      pupa() {
        A.body = () => { ell(16, 19.5, 6.6, 10.4, 1); };
        A.after = () => { for (const y of [15, 19.5, 24]) cap(10.5, y, 21.5, y + 0.6, 0.45, 'dark'); };
        A.head = () => {};
        A.eyes = [[13.4, 12.6], [18.4, 12.6]]; A.top = [16, 9]; A.ears = [[12.5, 10], [19.5, 10]];
        A.tail = [16, 30]; A.back = [16, 14]; A.cheek = [16, 16];
      },
      beetle() {
        for (const x of [13, 18, 23]) cap(x, 24, x - 1.5, 29, 0.9, 'dark');
        A.body = () => { ell(18.5, 20.5, 9.4, 7.4, 1); };
        A.after = () => { cap(19.5, 13.5, 19.5, 27.5, 0.45, 'dark'); if (L.pattern === 'spots') { ell(15.5, 18.5, 1.6, 1.4, 3); ell(23, 21.5, 1.6, 1.4, 3); } };
        A.head = () => ell(9, 21.5, 4.8, 4.5, 2);
        A.eyes = [[7.4, 20.8], [10.6, 20.8]]; A.top = [9, 17]; A.ears = [[7, 17.6], [11, 17.6]];
        A.tail = [27.5, 22]; A.back = [19, 14]; A.cheek = [9, 24];
      },
      fish() {
        A.body = () => { poly([[22, 18.5], [31, 10.5], [28.5, 18.5], [31, 26.5]], 3); poly([[10, 13], [17.5, 5.5], [21.5, 13]], 3); ell(15, 18.5, 10.2, 6.8, 1); };
        A.after = () => { if (L.pattern !== 'none') ell(13.5, 22, 7, 2.6, 2, { line: false }); poly([[14, 21], [19, 25], [19.5, 21.5]], 3); if (L.pattern === 'stripes') { cap(17, 13, 17, 23, 0.6, 3); cap(21, 14, 21, 22, 0.6, 3); } };
        A.head = () => {};
        A.eyes = [[8.6, 16.6]]; A.top = [10, 12.4]; A.ears = [[8, 14], [10, 13]];
        A.tail = [29, 18.5]; A.back = [16, 12]; A.cheek = [7, 20];
      },
      serpent() {
        const coil = []; for (let i = 0; i <= 22; i++) { const t = i / 22, a = Math.PI * (0.15 + t * 1.55); coil.push([18 + Math.cos(a) * (9 - t * 2.5) * (t < 0.6 ? 1 : 0.9), 22.5 + Math.sin(a) * (5.2 - t * 1.4) + (t > 0.7 ? (0.7 - t) * 10 : 0), 4.6 - t * 1.4]); }
        A.body = () => { for (let i = coil.length - 1; i >= 0; i--) ell(coil[i][0], coil[i][1], coil[i][2] + 0.4, coil[i][2], 1, { line: false }); ell(27.5, 23, 1.6, 1.4, 1, { line: false }); };
        A.after = () => { if (L.pattern !== 'none') for (let i = 1; i < coil.length - 3; i++) { const [x0, y0, r0] = coil[i], [x1, y1, r1] = coil[i + 1]; cap(x0, y0 + r0 * 0.5, x1, y1 + r1 * 0.5, r0 * 0.32, 2, { line: false }); } };
        A.head = () => { ell(13, 11.5, 6.8, 6, 1); ell(10, 14, 3.8, 2.4, 2, { line: false }); };
        A.eyes = [[10.6, 10.6], [15.6, 10.6]]; A.top = [13, 5.6]; A.ears = [[8.4, 7.4], [17.8, 7.2]];
        A.tail = [27.5, 23]; A.back = [20, 20.5]; A.cheek = [13, 14];
      },
      golem() {
        cap(11.5, 24, 11.5, 29, 2.6, 'dark'); cap(20.5, 24, 20.5, 29, 2.6, 'dark');
        A.body = () => { ell(16, 19.5, 8.6, 7.4, 1); ell(9.5, 14.5, 3.6, 3, 1); ell(22.5, 14.5, 3.6, 3, 1); };
        A.after = () => { cap(8, 15, 6, 22, 2.4, 1); cap(24, 15, 26, 22, 2.4, 1); ell(5.6, 23.8, 2.9, 2.5, 3); ell(26.4, 23.8, 2.9, 2.5, 3); if (L.pattern !== 'none') { ell(16, 19.5, 4.6, 3.6, 2); ell(15, 18.6, 2, 1.3, 2, { line: false }); } };
        A.head = () => ell(16, 10.4, 5.6, 4.8, 1);
        A.eyes = [[13.8, 10.2], [18.2, 10.2]]; A.top = [16, 5.8]; A.ears = [[12, 7.3], [20, 7.3]];
        A.tail = [25, 24]; A.back = [16, 12]; A.cheek = [16, 12];
      },
      ghost() {
        A.body = () => { poly([[8, 15], [24, 15], [24.5, 23.5], [21.5, 27], [18.5, 23.5], [15, 28.5], [11.5, 24], [7.5, 26.5]], 1); ell(16, 15, 8.2, 8.4, 1); };
        A.after = () => { ell(13.5, 12.5, 4.2, 3.6, 2, { line: false }); ell(12.5, 11.5, 1.6, 1.2, 'white', { line: false, flat: true }); cap(8, 19, 5, 21.5, 1.3, 1); cap(24, 19, 27, 21.5, 1.3, 1); ell(21.5, 27, 1.4, 1.2, 1); ell(15, 28.5, 1.3, 1.1, 1); ell(7.5, 26.5, 1.3, 1.1, 1); };
        A.head = () => {};
        A.eyes = [[12.6, 14.6], [19.2, 14.6]]; A.top = [16, 7]; A.ears = [[10.5, 8.6], [21.5, 8.6]];
        A.tail = [24, 25]; A.back = [16, 9]; A.cheek = [16, 18];
      },
      flyer() {
        A.body = () => { ell(16, 20, 4.2, 6.6, 1); };
        A.after = () => { for (const y of [19, 22.5]) cap(12.6, y, 19.4, y, 0.4, 'dark'); };
        A.head = () => ell(16, 11.6, 4.6, 4.4, 1);
        A.eyes = [[14.2, 11.4], [17.8, 11.4]]; A.top = [16, 7.4]; A.ears = [[13.8, 8], [18.2, 8]];
        A.tail = [16, 27]; A.back = [16, 15]; A.cheek = [16, 14];
      },
    };
    use('legs');
    (T[L.body] || T.biped)();

    // --- rasgos ---
    const tailFns = {
      flame: ([x, y]) => { poly([[x - 1.5, y + 2], [x + 2.5, y - 7], [x + 2, y - 3], [x + 5.5, y - 9], [x + 5, y - 2], [x + 3.5, y + 3]], 'fire'); ell(x + 2, y + 0.5, 2.2, 2.2, 'fire'); },
      leaf: ([x, y]) => { cap(x - 1, y + 1, x + 3, y - 3, 0.7, 'dark'); poly([[x + 2, y - 2], [x + 8.5, y - 9], [x + 5.5, y - 1.5], [x + 3, y]], 3); },
      bolt: ([x, y]) => poly([[x - 1, y + 1], [x + 3, y - 4], [x + 1.5, y - 4.5], [x + 6, y - 10], [x + 5, y - 5], [x + 6.5, y - 5], [x + 1.5, y + 2]], 'elec'),
      fluffy: ([x, y]) => { ell(x + 2.5, y - 3, 3.6, 4.6, 2); ell(x + 3.5, y - 6.5, 2.2, 2.2, 2); },
      fin: ([x, y]) => poly([[x - 2, y], [x + 6, y - 6], [x + 4.5, y + 1.5], [x + 6, y + 5]], 3),
      thin: ([x, y]) => { cap(x - 1, y, x + 4, y - 2, 0.9, 1); cap(x + 4, y - 2, x + 5.5, y - 6, 0.9, 1); ell(x + 5.5, y - 6.8, 1.4, 1.4, 3); },
      club: ([x, y]) => { cap(x - 1, y, x + 4, y - 3, 1, 1); ell(x + 5, y - 4, 2.8, 2.6, 3); },
      swirl: ([x, y]) => { cap(x - 1, y, x + 3, y - 1, 1.1, 1); ell(x + 4.5, y - 3, 2.8, 2.8, 1); ell(x + 4.5, y - 3, 1.3, 1.3, 2); },
      spikes: ([x, y]) => { poly([[x - 2, y + 1], [x + 7, y - 2], [x - 1, y - 2]], 3); poly([[x - 1, y + 3], [x + 6, y + 3], [x - 1, y]], 3); },
      crystal: ([x, y]) => { poly([[x - 1, y + 1], [x + 3, y - 7], [x + 5, y - 1], [x + 2, y + 2]], 3); },
      feather: ([x, y]) => { poly([[x - 2, y], [x + 7, y - 2], [x + 8, y + 3], [x + 6, y + 1], [x + 7, y + 6], [x - 1, y + 3]], 3); },
      none: () => {},
    };
    const earFns = {
      pointy: ([x, y], i) => { poly([[x - 2.4, y + 2.6], [x + (i ? 0.8 : -0.8), y - 4.4], [x + 2.4, y + 2.6]], 1); poly([[x - 1.1, y + 1.8], [x + (i ? 0.6 : -0.6), y - 2.2], [x + 1.1, y + 1.8]], 2, { line: false }); },
      round: ([x, y]) => { ell(x, y - 0.5, 2.6, 2.6, 1); ell(x, y - 0.4, 1.3, 1.3, 2, { line: false }); },
      long: ([x, y], i) => { ell(x + (i ? 1 : -1), y - 4.5, 1.9, 5.4, 1); ell(x + (i ? 1 : -1), y - 4.2, 0.8, 3.8, 2, { line: false }); },
      fin: ([x, y], i) => poly([[x, y + 2], [x + (i ? 5 : -5), y - 2.5], [x + (i ? 4 : -4), y + 1], [x + (i ? 5.5 : -5.5), y + 3]], 3),
      horn: ([x, y], i) => poly([[x - 1.2, y + 1.5], [x + (i ? 2.5 : -2.5), y - 5], [x + 1.2, y + 1.5]], 3),
      leafy: ([x, y], i) => poly([[x, y + 2], [x + (i ? 4.5 : -4.5), y - 4], [x + (i ? 1 : -1), y - 1]], 3),
      none: () => {},
    };
    const headFns = {
      flame: ([x, y]) => poly([[x - 3, y + 2], [x - 2.5, y - 3], [x - 0.5, y - 1], [x + 0.5, y - 6], [x + 2, y - 1.5], [x + 3.5, y - 4], [x + 3.5, y + 2]], 'fire'),
      leaf: ([x, y]) => { cap(x, y + 1.5, x + 0.5, y - 1.5, 0.5, 'dark'); poly([[x + 0.5, y - 1], [x - 4, y - 5], [x - 1, y - 7.5], [x + 3.5, y - 5.5]], 3); },
      sprout: ([x, y]) => { cap(x, y + 1.5, x, y - 2, 0.5, 'dark'); ell(x - 2.2, y - 2.6, 2.4, 1.4, 3); ell(x + 2.2, y - 2.6, 2.4, 1.4, 3); },
      crest: ([x, y]) => poly([[x - 3.5, y + 2], [x - 1, y - 5], [x + 1, y - 2], [x + 3, y - 6], [x + 4, y + 2]], 3),
      crown: ([x, y]) => poly([[x - 4, y + 1.5], [x - 4, y - 3.5], [x - 2, y - 1], [x, y - 5], [x + 2, y - 1], [x + 4, y - 3.5], [x + 4, y + 1.5]], 3),
      gem: ([x, y]) => poly([[x, y], [x + 1.8, y + 2.2], [x, y + 4.4], [x - 1.8, y + 2.2]], 3),
      antenna: ([x, y]) => { cap(x - 2, y + 1, x - 4, y - 4, 0.5, 'dark'); cap(x + 2, y + 1, x + 4, y - 4, 0.5, 'dark'); ell(x - 4.2, y - 4.6, 1.5, 1.5, 3); ell(x + 4.2, y - 4.6, 1.5, 1.5, 3); },
      horn: ([x, y]) => poly([[x - 1.6, y + 1.5], [x - 0.5, y - 6.5], [x + 1.6, y + 1.5]], 3),
      bighorn: ([x, y]) => poly([[x - 2.6, y + 2], [x - 1.5, y - 7], [x + 2, y - 9.5], [x + 1, y - 4], [x + 2.6, y + 2]], 3),
      spikes: ([x, y]) => { for (const o of [-3, 0, 3]) poly([[x + o - 1.6, y + 2], [x + o, y - 3.5 - (o === 0 ? 1.5 : 0)], [x + o + 1.6, y + 2]], 3); },
      tuft: ([x, y]) => { ell(x - 1.5, y, 2.2, 2, 2); ell(x + 1.5, y - 0.6, 2.2, 2, 2); },
      cap: ([x, y]) => { ell(x, y + 1.5, 9, 4.6, 3); ell(x - 3.5, y, 1.6, 1.1, 'white', { line: false }); ell(x + 2.5, y - 1.2, 1.3, 1, 'white', { line: false }); ell(x + 5.5, y + 1.6, 1.1, 0.9, 'white', { line: false }); },
      wisp: ([x, y]) => poly([[x - 2, y + 2], [x + 1, y - 4], [x + 4, y - 7], [x + 2, y - 1], [x + 2.5, y + 2]], 1),
      none: () => {},
    };
    const wingFns = {
      bird: () => { poly([[19, 16], [31, 7], [30, 13], [27.5, 13.5], [28.5, 18], [21, 21]], 3); },
      bigbird: () => { poly([[18, 17], [8, 3], [12, 4], [14.5, 2], [22, 15]], 3); poly([[20, 16], [31.5, 3], [31, 10], [29, 10.5], [30, 16], [23, 21]], 3); },
      bat: () => { poly([[18, 15], [30, 6], [29, 11], [31, 13], [27, 15], [28, 19], [21, 20]], 3); poly([[14, 15], [2, 6], [3, 11], [1, 13], [5, 15], [4, 19], [11, 20]], 3); },
      insect: () => { ell(8.5, 12.5, 7, 6.2, 3); ell(23.5, 12.5, 7, 6.2, 3); ell(9.5, 23, 5.4, 4.2, 2); ell(22.5, 23, 5.4, 4.2, 2);
        if (L.wingSpots !== false) { ell(7.5, 12, 2.2, 2, 1); ell(24.5, 12, 2.2, 2, 1); } },
      fins: () => { poly([[10, 18], [1, 13], [3, 21]], 3); poly([[22, 18], [31, 13], [29, 21]], 3); },
    };
    const backFns = {
      shell: () => ell(A.back[0] + 1.5, A.back[1] + 3.5, 6.4, 5.4, 3),
      spikes: () => { const [x, y] = A.back; for (const o of [-4, 0, 4]) poly([[x + o - 2, y + 2], [x + o + 0.5, y - 4], [x + o + 2.2, y + 2]], 3); },
      crystals: () => { const [x, y] = A.back; poly([[x - 5, y + 2], [x - 4, y - 5], [x - 2, y + 1]], 3); poly([[x - 1.5, y + 1.5], [x + 0.5, y - 7], [x + 2.5, y + 1.5]], 3); poly([[x + 3, y + 2], [x + 5.5, y - 4], [x + 6, y + 2]], 3); },
      mane: () => { const [x, y] = A.top; const hy = y + 6.5; for (let a = 0; a < 9; a++) { const ang = Math.PI * 0.9 + (a / 8) * Math.PI * 1.25; ell(x + Math.cos(ang) * 6.4, hy + Math.sin(ang) * 6, 3, 3, 3); } },
      flames: () => { const [x, y] = A.back; poly([[x - 4, y + 2], [x - 3, y - 4], [x - 1, y - 1], [x + 1, y - 7], [x + 2.5, y - 1], [x + 5, y - 5], [x + 5, y + 2]], 'fire'); },
      leaves: () => { const [x, y] = A.back; poly([[x - 1, y + 2], [x - 8, y - 4], [x - 3, y - 2]], 3); poly([[x, y + 2], [x + 2, y - 7], [x + 3, y + 1]], 3); poly([[x + 1, y + 2], [x + 8, y - 3], [x + 3, y - 1]], 3); },
      cloud: () => { const [x, y] = A.back; ell(x + 5, y + 1, 4, 3, 'white'); ell(x + 8, y - 1, 3, 2.6, 'white'); },
      none: () => {},
    };

    // halo de los legendarios (anillo detrás del cuerpo)
    if (L.halo) {
      use('halo');
      const hp = L.halo === 'fire' ? FIRE_PAL : mkPal(L.halo);
      const outer = maskEll(16, 14.5, 14.4, 13.8), inner = new Set(maskEll(16, 14.5, 13.1, 12.5).map(([x, y]) => y * 10000 + x));
      fill(outer.filter(([x, y]) => !inner.has(y * 10000 + x)), hp, { line: false });
      for (let a = 0; a < 8; a++) { const ang = (a / 8) * Math.PI * 2; ell(16 + Math.cos(ang) * 13.8, 14.5 + Math.sin(ang) * 13.2, 1.3, 1.3, hp, { line: false }); }
    }
    // orden: detrás -> cuerpo -> cabeza -> delante
    use('wings');
    if (L.wings && L.wings !== 'bird' && L.wings !== 'fins') wingFns[L.wings]();
    use('tail');
    (tailFns[L.tail || 'none'] || tailFns.none)(A.tail);
    use('headBack');
    if (L.backExtra === 'mane') backFns.mane();
    (earFns[L.ears || 'none'] || earFns.none)(A.ears[0], 0);
    use('body');
    A.body();
    if (L.backExtra && L.backExtra !== 'mane') (backFns[L.backExtra] || backFns.none)();
    A.after();
    use('wingsF');
    if (L.wings === 'bird' || L.wings === 'fins') wingFns[L.wings]();
    use('head');
    A.head();
    (earFns[L.ears || 'none'] || earFns.none)(A.ears[1], 1);
    if (L.body === 'round' || L.body === 'ghost' || L.body === 'pupa') {
      // en cuerpos sin cabeza separada, la oreja izquierda debe ir encima
      (earFns[L.ears || 'none'] || earFns.none)(A.ears[0], 0);
    }
    (headFns[L.head || 'none'] || headFns.none)(A.top);
    if (L.pattern === 'mask') ell(A.eyes[0][0] + (A.eyes[1] ? (A.eyes[1][0] - A.eyes[0][0]) / 2 : 0), A.eyes[0][1], 6, 2.2, 3, { line: false });
    use('body');
    if (L.pattern === 'rock') { const r = mulberry(L.c1.length * 97 + sp.id * 13); for (let i = 0; i < 6; i++) ell(10 + r() * 12, 15 + r() * 12, 1, 0.8, 'dark', { flat: true }); }
    if (L.pattern === 'spots' && (L.body === 'quad' || L.body === 'biped' || L.body === 'round')) { ell(A.back[0] + 3, A.back[1] + 3, 1.4, 1.2, 3, { line: false }); ell(A.back[0] - 2, A.back[1] + 4.5, 1.2, 1, 3, { line: false }); }
    if (L.pattern === 'stripes' && L.body !== 'fish') { const [x, y] = A.back; cap(x - 3, y, x - 2, y + 5, 0.6, 3); cap(x + 1, y - 0.5, x + 2, y + 5, 0.6, 3); cap(x + 5, y + 0.5, x + 5.5, y + 4.5, 0.6, 3); }
    use('head');
    if (L.cheeks) { const [x, y] = A.cheek; ell(x - 4.8, y, 1.4, 1, L.cheeks, { line: false, flat: true }); ell(x + 4.8, y, 1.4, 1, L.cheeks, { line: false, flat: true }); }

    // ojos
    use('eyes');
    const ink = '#1a1420';
    for (const [ex0, ey0] of A.eyes) {
      const ex = TX(ex0), ey = TY(ey0);
      const big = S >= 40, w = Math.max(1, Math.round((big ? 2.1 : 1.7) * k * sz)), h = Math.max(1, Math.round((big ? 2.9 : 2.5) * k * sz));
      const x0 = Math.round(ex - w / 2), y0 = Math.round(ey - h / 2);
      const style = L.eyes || 'cute';
      eyeBoxes.push([x0, y0, w, h]);
      if (style === 'sleepy') { for (let i = -1; i <= w; i++) R.set(x0 + i, y0 + h - 1, ink); continue; }
      const ec = style === 'glow' ? (L.eyeColor || '#f8e050') : ink;
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) R.set(x0 + xx, y0 + yy, ec);
      if (style === 'fierce' && h >= 2) {
        const left = ex0 < 16;
        for (let i = -1; i <= w; i++) R.set(x0 + i, y0 - 1 + (left ? (i > w / 2 ? 1 : 0) : (i < w / 2 ? 1 : 0)), ink);
      }
      if (big && w >= 2 && h >= 3 && style !== 'glow') { const iris = U.shade(L.eyeColor || L.c3 || '#3a2a50', -0.15); for (let xx = 0; xx < w; xx++) R.set(x0 + xx, y0 + h - 1, iris); if (h >= 4) R.set(x0 + w - 1, y0 + h - 2, iris); }
      if (w >= 2 && h >= 2) R.set(x0, y0, '#ffffff');
      if (big && w >= 3 && h >= 3) R.set(x0 + w - 1, y0 + h - 2, '#f0f0ff');
      else if (S >= 20 && style !== 'glow') R.set(x0, y0 - 0, ink);
    }

    // boca
    if (S >= 32 && L.body !== 'bird' && L.body !== 'fish' && L.eyes !== 'sleepy') {
      use('head');
      const mx = A.eyes.reduce((a, e) => a + e[0], 0) / A.eyes.length, my = A.eyes[0][1] + (L.body === 'golem' ? 2.8 : 3.4);
      const X = Math.round(TX(mx)), Y = Math.round(TY(my)), lineC = U.shade(L.c1, -0.45);
      if (A.eyes.length > 1) { R.set(X - 1, Y, lineC); R.set(X, Y + 1, lineC); R.set(X + 1, Y, lineC); if (L.eyes === 'fierce' && S >= 40) R.set(X + 2, Y + 1, '#ffffff'); }
    }
    // contorno exterior
    const outline = U.mix(U.shade(L.c1, -0.45), '#1a1420', 0.55);
    const outlineOf = (Rs) => {
      const filled = Rs.c.map((c) => !!c);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        if (filled[y * S + x]) continue;
        const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < S && yy < S && filled[yy * S + xx];
        if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) Rs.set(x, y, outline);
      }
    };
    if (!layered) { const R0 = RR('all'); outlineOf(R0); return R0.toCanvas(); }
    const parts = {};
    for (const [n, Rs] of Object.entries(layers)) { if (n !== 'eyes') outlineOf(Rs); parts[n] = Rs.toCanvas(); }
    // ojos cerrados (parpadeo) y apretados (daño)
    const [cc, cx] = U.makeCanvas(S, S), [hc, hx] = U.makeCanvas(S, S);
    for (const [x0, y0, w, h] of eyeBoxes) { cx.fillStyle = ink; cx.fillRect(x0 - (w > 1 ? 0 : 1), y0 + h - 1, Math.max(2, w + 1), 1); hx.fillStyle = ink; hx.fillRect(x0 - 1, y0 + Math.floor(h / 2) - 1, 1, 1); hx.fillRect(x0, y0 + Math.floor(h / 2), Math.max(1, w), 1); hx.fillRect(x0 - 1, y0 + Math.floor(h / 2) + 1, 1, 1); }
    parts.eyesClosed = cc; parts.eyesHurt = hc;
    const avgEye = A.eyes.reduce((a, e) => [a[0] + e[0] / A.eyes.length, a[1] + e[1] / A.eyes.length], [0, 0]);
    const piv = { head: [TX(avgEye[0]), TY(avgEye[1] + 4.5)], tail: [TX(A.tail[0]), TY(A.tail[1])], wing: [TX(A.back[0]), TY(A.back[1] + 2)], feet: [S / 2, TY(29.5)] };
    return { parts, piv, body: L.body, flyer: !!(L.wings || L.body === 'ghost' || L.body === 'flyer') };
  },
};
