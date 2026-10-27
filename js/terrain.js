'use strict';
// ============================================================
//  TERRENO 2.0
//  El suelo de exteriores y cuevas se pinta píxel a píxel en
//  coordenadas del mundo (sin cuadrícula visible):
//  - ruido continuo con tramado (dithering) para el tono
//  - bordes orgánicos entre hierba, camino, arena, agua y lava
//  - agua con profundidad y espuma; lava con costra
//  - acantilados y paredes de cueva con cara y meseta
//  - sombras de contacto y relieve (luz desde arriba a la izquierda)
//  Los objetos (troncos, rocas, carteles, flores...) se dibujan
//  encima con fondo transparente.
// ============================================================

const TerrainNoise = {
  seed: 0,
  h(x, y) { let n = (x * 374761393 + y * 668265263 + this.seed * 1442695041) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; },
  smooth(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = this.h(xi, yi), b = this.h(xi + 1, yi), c = this.h(xi, yi + 1), d = this.h(xi + 1, yi + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  },
  fbm(x, y) { return this.smooth(x / 34, y / 34) * 0.6 + this.smooth(x / 11 + 31, y / 11 + 17) * 0.3 + this.smooth(x / 4 + 7, y / 4 + 3) * 0.1; },
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const ramp = (list) => list.map(hexRGB);

// materiales del suelo
const MAT = { grass: 0, tall: 1, path: 2, sand: 3, ash: 4, burnt: 5, cave: 6, water: 7, cwater: 8, lava: 9, cliff: 10, cwall: 11, hedge: 12, snow: 13 };
const SOFT = new Set([MAT.grass, MAT.path, MAT.sand, MAT.ash, MAT.burnt, MAT.cave, MAT.water, MAT.cwater, MAT.lava]);
const HEIGHT = [2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 5, 5, 4, 2];
const PALS = {
  grass: ramp(['#2c6434', '#3a7c3c', '#4a9442', '#5caa4c', '#72bf58', '#8fd26a', '#b2e488']),
  meadow: ramp(['#2e6a40', '#3c8246', '#4c9a4e', '#60ae58', '#78c266', '#96d47a', '#bce69a']),
  tall: ramp(['#1e4c28', '#275e30', '#327238', '#3e8640', '#4c984a']),
  dry: ramp(['#3e321a', '#4e4022', '#5e4e2a', '#6e5e34', '#7e6c3e']),
  path: ramp(['#7a5a3a', '#977452', '#b08c62', '#c6a274', '#d8b888', '#e8cea0', '#f4e2bc']),
  sand: ramp(['#b89458', '#cea96c', '#ddbd80', '#ead096', '#f4e0b0', '#fbefd0']),
  ash: ramp(['#3c3638', '#4a4446', '#585054', '#666064', '#767074', '#888286']),
  burnt: ramp(['#2e2e22', '#3c3c2c', '#4a4a36', '#5a5a40', '#6a6a4c']),
  cave: ramp(['#3e3640', '#4c434e', '#5a505a', '#685e68', '#786e76', '#8a8088']),
  water: ramp(['#1e3a80', '#244c98', '#2c62b2', '#3a7ec8', '#4a9ad8', '#62b6e2', '#86d0ea']),
  cwater: ramp(['#141e40', '#1a2a56', '#22386c', '#2e4a84', '#3e5e9a']),
  lava: ramp(['#3a1410', '#6a1a0c', '#a02a0e', '#d04412', '#f06a1c', '#ffa030', '#ffd870']),
  crust: ramp(['#1e1416', '#2a1e1e', '#3a2a26', '#4a3630']),
  rock: ramp(['#4a3626', '#634a34', '#7c5e42', '#967454', '#ae8c68', '#c6a682', '#dcc09e']),
  cavewall: ramp(['#0c090c', '#161116', '#221a20', '#3a3036', '#4e424a', '#62545c', '#76686e']),
  hedge: ramp(['#163c1e', '#1f5026', '#2a6430', '#367a38', '#469044', '#5aa852', '#78c066']),
};

PALS.grassWarm = ramp(['#2e5a24', '#3b6e2a', '#4a8433', '#5a9a3c', '#6eb048', '#88c45a', '#a8d878', '#c8eaa0']);
PALS.grassCool = ramp(['#24563a', '#2e6a44', '#3a8050', '#48965c', '#5aac6a', '#74c07e', '#96d49c', '#bce6bc']);
PALS.grassMix = Array.from({ length: 6 }, (_, k) => PALS.grassWarm.map((c, i) => c.map((v, j) => Math.round(v + (PALS.grassCool[i][j] - v) * (k / 5) * 0.8))));
const Terrain = {
  // hierba: manchas cálidas/frías, matas de briznas con punta clara y base oscura, tréboles y florecillas
  grassPixel(N, x, y, b, lush) {
    const patch = N.smooth(x / 52 + 200, y / 52 + 200) + (lush ? 0.18 : 0);
    const tb = U.clamp((patch + N.smooth(x / 17 + 70, y / 17 + 70) * 0.25 - 0.5) / 0.4 + b * 0.25, 0, 0.999);
    const pal = PALS.grassMix[Math.floor(tb * PALS.grassMix.length)], L = pal.length;
    const tone = N.smooth(x / 30, y / 30) * 0.6 + N.smooth(x / 9 + 9, y / 9 + 4) * 0.4;
    let idx = 1.1 + tone * (L - 5) + b * 0.35, rgb = null;
    // matas de briznas (celdas de 6 px con una mata cada una, según la densidad)
    const C = 5, dens = 0.4 + N.smooth(x / 23 + 40, y / 23 + 40) * 0.5;
    const gx0 = Math.floor(x / C), gy0 = Math.floor(y / C);
    let blade = 0;
    for (let gy = gy0; gy <= gy0 + 1 && !blade; gy++) for (let gx = gx0 - 1; gx <= gx0 + 1 && !blade; gx++) {
      if (N.h(gx * 7 + 1, gy * 13 + 5) > dens) continue;
      const bx = gx * C + Math.floor(N.h(gx, gy + 99) * C), by = gy * C + Math.floor(N.h(gx + 51, gy) * C);
      const dy = by - y, dx = x - bx;
      if (dy === -1 && Math.abs(dx) <= 1) { blade = -1; break; } // sombra bajo la mata
      if (dy < 0 || dy > 4) continue;
      const big = N.h(gx + 7, gy + 3) > 0.5;
      if (dx === 0 && dy <= (big ? 4 : 3)) blade = dy === (big ? 4 : 3) ? 4.2 : dy === 0 ? 0.6 : 2.8;
      else if (dy <= 2 && dx === (dy === 2 ? -2 : -1)) blade = dy === 2 ? 3.6 : 1.4;
      else if (dy <= 2 && dx === (dy === 2 ? 2 : 1)) blade = dy === 2 ? 2.8 : 1;
    }
    if (blade) idx = blade < 0 ? idx - 1.8 : Math.max(idx - 1.2, 0.6) + blade;
    // tréboles y florecillas ocasionales
    const fh = N.h(Math.floor(x / 3) * 3 + 11, Math.floor(y / 3) * 3 + 17);
    if (!blade && fh < 0.006) {
      const lx = x % 3, ly = y % 3;
      if (lx === 1 && ly === 1) rgb = [[255, 236, 120], [255, 255, 255], [255, 190, 210]][Math.floor(fh * 500) % 3];
      else if ((lx === 1) !== (ly === 1)) rgb = [[255, 255, 245], [250, 220, 240], [240, 240, 255]][Math.floor(fh * 500) % 3];
    } else if (!blade && fh > 0.992) idx = (x + y) % 2 ? L - 2 : 2.2;
    return { pal, idx, rgb };
  },

  // material base del mapa (lo que hay "debajo" de los objetos)
  baseMat(m) { return m.volcanic ? MAT.ash : m.cave ? MAT.cave : MAT.grass; },
  matOfTile(m, tx, ty) {
    tx = U.clamp(tx, 0, m.w - 1); ty = U.clamp(ty, 0, m.h - 1);
    const ch = World.charAt(tx, ty), def = TILEDEF[ch] || TILEDEF['.'], t = def.t;
    switch (t) {
      case 'tallgrass': return MAT.tall;
      case 'path': return MAT.path;
      case 'sand': return MAT.sand;
      case 'ash': case 'ashsign': case 'ashlamp': case 'ashrock': return MAT.ash;
      case 'burnt': return MAT.burnt;
      case 'cave': case 'caverock': case 'ladder': case 'cavecrack': return MAT.cave;
      case 'water': case 'bridge': case 'dock': return MAT.water;
      case 'cavewater': return MAT.cwater;
      case 'lava': return MAT.lava;
      case 'cliff': case 'cavemouth': return MAT.cliff;
      case 'cavewall': return MAT.cwall;
      case 'hedge': return MAT.hedge;
      default: return this.baseMat(m);
    }
  },
  usesNew(m) { return !!(m.outdoor || m.cave); },

  // ---------- render de una región (en casillas) ----------
  render(m, ctx, tx0, ty0, tx1, ty1) {
    tx0 = Math.max(0, tx0); ty0 = Math.max(0, ty0); tx1 = Math.min(m.w - 1, tx1); ty1 = Math.min(m.h - 1, ty1);
    TerrainNoise.seed = (hash2(m.id.length * 31, m.id.charCodeAt(0)) * 100000) | 0;
    const N = TerrainNoise;
    const PX = tx0 * 16, PY = ty0 * 16, w = (tx1 - tx0 + 1) * 16, h = (ty1 - ty0 + 1) * 16;
    // margen para consultar vecinos
    const M = 3, W2 = w + M * 2, H2 = h + M * 2;
    const GX0 = tx0 - 4, GY0 = ty0 - 4, GW = tx1 - tx0 + 9, GH = ty1 - ty0 + 9;
    const grid = new Int8Array(GW * GH);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) grid[j * GW + i] = this.matOfTile(m, GX0 + i, GY0 + j);
    const tm = (tx, ty) => { const i = tx - GX0, j = ty - GY0; return i >= 0 && j >= 0 && i < GW && j < GH ? grid[j * GW + i] : this.matOfTile(m, tx, ty); };
    const mat = new Uint8Array(W2 * H2);
    for (let j = 0; j < H2; j++) for (let i = 0; i < W2; i++) {
      const x = PX + i - M, y = PY + j - M;
      const own = tm(Math.floor(x / 16), Math.floor(y / 16));
      let mm = own;
      if (SOFT.has(own)) {
        const jx = (N.smooth(x / 8, y / 8) - 0.5) * 6, jy = (N.smooth(x / 8 + 50, y / 8 + 50) - 0.5) * 6;
        const o = tm(Math.floor((x + jx) / 16), Math.floor((y + jy) / 16));
        if (SOFT.has(o)) mm = o;
      }
      mat[j * W2 + i] = mm;
    }
    const at = (i, j) => mat[U.clamp(j, 0, H2 - 1) * W2 + U.clamp(i, 0, W2 - 1)];
    // profundidad del agua por casilla (distancia a tierra)
    const depthOf = (tx, ty) => {
      let best = 4;
      for (let r = 1; r <= 3 && best === 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const o = tm(tx + dx, ty + dy); if (o !== MAT.water && o !== MAT.cwater && o !== MAT.lava) { best = Math.min(best, r); }
      }
      return best;
    };
    const dgrid = new Int8Array(GW * GH).fill(-1);
    const depth = (tx, ty) => { const i = tx - GX0, j = ty - GY0; if (i < 0 || j < 0 || i >= GW || j >= GH) return depthOf(tx, ty); let v = dgrid[j * GW + i]; if (v < 0) { v = depthOf(tx, ty); dgrid[j * GW + i] = v; } return v; };
    const img = ctx.createImageData(w, h), d = img.data;
    const baseM = this.baseMat(m);
    const lush = m.id === 'bosque' || m.id === 'ruta6' || m.id === 'ciudad_aurora';
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = PX + i, y = PY + j, I = i + M, J = j + M;
      const mm = at(I, J);
      const lx = x & 15, ly = y & 15, tx = x >> 4, ty = y >> 4;
      const b = BAYER[(y & 3) * 4 + (x & 3)];
      let pal, idx, rgb = null;
      const n = N.fbm(x, y);
      const up = at(I, J - 1), up2 = at(I, J - 2), dn = at(I, J + 1), lf = at(I - 1, J), rt = at(I + 1, J);
      const hh = HEIGHT[mm];
      switch (mm) {
        case MAT.grass: case MAT.burnt: case MAT.ash: case MAT.cave: case MAT.path: case MAT.sand: case MAT.tall: {
          pal = mm === MAT.grass ? (lush ? PALS.meadow : PALS.grass) : mm === MAT.tall ? (m.volcanic ? PALS.dry : PALS.tall) : mm === MAT.path ? PALS.path : mm === MAT.sand ? PALS.sand : mm === MAT.ash ? PALS.ash : mm === MAT.burnt ? PALS.burnt : PALS.cave;
          const L = pal.length;
          idx = n * (L - 1.4) + 0.5 + b * 0.55;
          const hs = N.h(x, y);
          if (mm === MAT.grass) {
            const gp = Terrain.grassPixel(N, x, y, b, lush);
            pal = gp.pal; idx = gp.idx; if (gp.rgb) rgb = gp.rgb;
          } else if (mm === MAT.tall) {
            const k = (x + ((y >> 2) & 1) * 2) % 4;
            idx += k === 0 ? 1.4 : k === 2 ? -0.6 : 0;
            if (ly % 5 === 4) idx -= 0.8;
          } else if (mm === MAT.path || mm === MAT.sand) {
            if (hs < 0.03) idx += 1.5; else if (N.h(x, y - 1) < 0.03) idx -= 1.5;
            if (mm === MAT.sand) idx += Math.sin(x * 0.35 + y * 0.9 + N.smooth(x / 20, y / 20) * 6) * 0.45;
          } else if (mm === MAT.ash || mm === MAT.cave || mm === MAT.burnt) {
            if (hs < 0.06) idx += 1.3; else if (hs > 0.96) idx -= 1.5;
            const cr = N.smooth(x / 5 + 90, y / 5 + 90);
            if (cr > 0.47 && cr < 0.5) idx -= 1.4; // grietas
          }
          // relieve: borde iluminado arriba, sombra bajo superficies más altas
          if (HEIGHT[up] > hh || HEIGHT[up2] > hh + 1) idx -= HEIGHT[up] > hh ? 2 : 1;
          else if (HEIGHT[up] < hh) idx += 1.3;
          if (HEIGHT[dn] < hh) idx -= 1.6;
          if (HEIGHT[lf] < hh) idx += 0.6; if (HEIGHT[rt] < hh) idx -= 0.6;
          // orilla húmeda junto al agua
          if (up === MAT.water || dn === MAT.water || lf === MAT.water || rt === MAT.water) idx -= 1;
          break;
        }
        case MAT.water: case MAT.cwater: case MAT.lava: {
          pal = mm === MAT.water ? PALS.water : mm === MAT.cwater ? PALS.cwater : PALS.lava;
          // profundidad interpolada entre centros de casilla
          const fx = (x - 8) / 16, fy = (y - 8) / 16, ax = Math.floor(fx), ay = Math.floor(fy), sx = fx - ax, sy = fy - ay;
          const d00 = depth(ax, ay), d10 = depth(ax + 1, ay), d01 = depth(ax, ay + 1), d11 = depth(ax + 1, ay + 1);
          const dep = (d00 * (1 - sx) + d10 * sx) * (1 - sy) + (d01 * (1 - sx) + d11 * sx) * sy;
          const L = pal.length;
          if (mm === MAT.lava) {
            const crust = N.smooth(x / 7 + 13, y / 7 + 5) * 0.7 + N.smooth(x / 3, y / 3) * 0.3;
            if (crust > 0.6) { const c = PALS.crust; rgb = c[U.clamp(Math.floor((crust - 0.6) * 10 + b + 1), 0, c.length - 1)]; break; }
            idx = (1 - crust) * (L - 1) * 0.9 + b + (dep - 2) * 0.3;
          } else {
            idx = (L - 1) - Math.min(L - 1, (dep - 0.6) * 1.55) + b + (n - 0.5) * 1.2;
            if (N.h(x, y) < 0.02 && (x + y) % 2) idx += 1.5;
            const land = (k) => k !== MAT.water && k !== MAT.cwater && k !== MAT.lava;
            if (land(up) || land(dn) || land(lf) || land(rt)) rgb = mm === MAT.water ? [228, 246, 255] : [120, 150, 200];
            else if (land(at(I, J - 2)) || land(at(I, J + 2)) || land(at(I - 2, J)) || land(at(I + 2, J))) idx = L - 1;
            else if (land(up2)) idx -= 1.5; // sombra de la orilla de arriba
          }
          break;
        }
        case MAT.cliff: case MAT.cwall: {
          const isCave = mm === MAT.cwall;
          const below = tm(tx, ty + 1), above = tm(tx, ty - 1), lft = tm(tx - 1, ty), rgt = tm(tx + 1, ty);
          const face = below !== mm;
          if (!face) {
            // meseta: suelo del mapa algo más claro o techo de roca
            if (isCave) { pal = PALS.cavewall; idx = 0.6 + n * 1.4 + b * 0.5 + (N.h(x, y) < 0.04 ? 1 : 0); if (below !== MAT.cwall) idx += 0; }
            else { pal = baseM === MAT.ash ? PALS.ash : PALS.grass; idx = 1.6 + n * (pal.length - 2.4) + b + (N.h(x, y) < 0.05 ? 1.5 : 0); }
            if (above !== mm && ly < 2) idx += isCave ? 2.5 : 1.5;
            if (lft !== mm && lx < 2) idx += isCave ? 2.2 : -(lx === 0 ? 2 : 1);
            if (rgt !== mm && lx > 13) idx += isCave ? 1.6 : -(lx === 15 ? 2 : 1);
          } else {
            pal = isCave ? PALS.cavewall : PALS.rock;
            const band = Math.floor((ly + N.smooth(x / 9, y / 3) * 3) / 4);
            idx = (isCave ? 3 : 3.4) + (band % 2 ? 0.8 : -0.4) + b + (N.smooth(x / 4, y / 9) - 0.5) * 2;
            if (N.smooth(x / 5 + 3, y / 2 + 7) > 0.72) idx -= 1.6; // grieta
            if (above === mm && ly < 2) { // labio de la meseta
              if (!isCave) { pal = baseM === MAT.ash ? PALS.ash : PALS.grass; idx = ly === 0 ? 3 + b : 1 + b; if (ly === 1 && N.h(x, 3) < 0.5) idx = 0; }
              else idx = ly === 0 ? 2 : 1;
            } else if (above === mm && ly < 4) idx -= 1.6;
            if (ly > 12) idx -= (ly - 12) * 0.7;
            if (lft !== mm && lx < 2) idx -= 1.2;
            if (rgt !== mm && lx > 13) idx -= 1.5;
          }
          break;
        }
        case MAT.hedge: {
          pal = PALS.hedge;
          const leaf = N.smooth(x / 2.6, y / 2.6);
          idx = 1.5 + leaf * 3.2 + b + (n - 0.5);
          const above = at(I, J - 1) !== MAT.hedge, below = at(I, J + 1) !== MAT.hedge;
          if (above) idx += 1.6; else if (at(I, J - 2) !== MAT.hedge) idx += 0.8;
          if (below) idx = 0; else if (at(I, J + 2) !== MAT.hedge) idx -= 1.4; else if (at(I, J + 3) !== MAT.hedge) idx -= 0.7;
          if (at(I - 1, J) !== MAT.hedge) idx -= 1; if (at(I + 1, J) !== MAT.hedge) idx -= 1.4;
          break;
        }
        default: pal = PALS.grass; idx = 3;
      }
      // sombra al pie de paredes, acantilados y setos (oclusión ambiental)
      if (mm !== MAT.cliff && mm !== MAT.cwall && mm !== MAT.hedge) {
        const tAbove = tm(tx, ty - 1);
        if ((tAbove === MAT.cliff || tAbove === MAT.cwall || tAbove === MAT.hedge) && ly < 4 && !rgb) idx -= (4 - ly) * 0.55;
      }
      if (!rgb) rgb = pal[U.clamp(Math.floor(idx), 0, pal.length - 1)];
      const o = (j * w + i) * 4;
      d[o] = rgb[0]; d[o + 1] = rgb[1]; d[o + 2] = rgb[2]; d[o + 3] = 255;
    }
    ctx.putImageData(img, PX, PY);
    // bordes de bordillo (salto)
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const def = TILEDEF[World.charAt(tx, ty)] || {};
      if (def.ledge) this.drawLedge(ctx, m, tx, ty);
    }
  },
  drawLedge(ctx, m, tx, ty) {
    const x0 = tx * 16, y0 = ty * 16;
    const L = (TILEDEF[World.charAt(tx - 1, ty)] || {}).ledge, Rr = (TILEDEF[World.charAt(tx + 1, ty)] || {}).ledge;
    const dark = m.volcanic ? '#2a2426' : '#1e4a26', face = m.volcanic ? ['#5a5052', '#4a4244', '#3a3436'] : ['#c49a62', '#a87e4c', '#8a643c'];
    for (let i = 0; i < 16; i++) {
      const edgeL = !L && i < 2, edgeR = !Rr && i > 13;
      const wob = (hash2(tx * 16 + i, ty * 7) * 1.6) | 0, top = 9 + wob;
      P(ctx, x0 + i, y0 + top, 1, 1, dark);
      if (edgeL || edgeR) { P(ctx, x0 + i, y0 + top + 1, 1, 14 - top, face[2]); continue; }
      for (let y = top + 1; y < 15; y++) P(ctx, x0 + i, y0 + y, 1, 1, face[y === top + 1 ? 0 : (i + y) % 4 === 0 ? 2 : 1]);
      P(ctx, x0 + i, y0 + 15, 1, 1, face[2]);
      if (hash2(tx * 16 + i, ty) < 0.3) P(ctx, x0 + i, y0 + top + 1, 1, 1 + wob, dark);
    }
    ctx.globalAlpha = 0.28; P(ctx, x0, y0 + 16, 16, 2, '#000'); ctx.globalAlpha = 1;

  },
};
