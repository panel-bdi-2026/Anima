'use strict';
// ============================================================
//  MUNDO 3D: casas y edificios (dirección de arte: docs/estilo.md)
//  - Paredes con textura de revoque, humedad abajo y sombra bajo el alero;
//    zócalo de piedra; en las casas, vigas de madera en esquinas y alero.
//  - Ventanas en 3D: marco, vidrio con reflejo (brilla de noche), alféizar,
//    postigos y, en algunas casas, jardinera con flores.
//  - Puerta hundida con marco, escalón, alero pequeño y farol; en tiendas
//    y edificios públicos, puerta de vidrio y letrero.
//  - Tejado con grosor y aleros, tejas pixeladas con relieve, cumbrera y
//    chimenea de ladrillo.
//  Las piezas del mismo material se juntan en una sola malla por casa
//  (pocas llamadas de dibujo, importante en el celular).
// ============================================================
const HouseKit = {
  px(x, c, a, b, w = 1, h = 1) { x.fillStyle = c; x.fillRect(a, b, w, h); },
  // revoque: color base con grano, manchas de humedad abajo y sombra bajo el alero
  plaster(wPx, hPx, col, seed, eave = true) {
    const [c, x] = U.makeCanvas(wPx, hPx);
    this.px(x, col, 0, 0, wPx, hPx);
    const L = U.shade(col, 0.06), D = U.shade(col, -0.07), DD = U.shade(col, -0.16);
    for (let y = 0; y < hPx; y++) for (let i = 0; i < wPx; i++) {
      const h = hash2(i * 7 + seed, y * 13 + seed * 3);
      if (h < 0.05) this.px(x, D, i, y); else if (h > 0.96) this.px(x, L, i, y);
    }
    // humedad: manchas irregulares que suben desde el suelo
    for (let i = 0; i < wPx; i++) { const top = Math.round(3 + hash2(i >> 2, seed) * 5); for (let y = hPx - top; y < hPx; y++) if (hash2(i, y + seed) < 0.75) this.px(x, y > hPx - 3 ? DD : D, i, y); }
    // sombra bajo el alero
    if (eave) for (let y = 0; y < 4; y++) { x.globalAlpha = 0.35 - y * 0.08; this.px(x, '#1a1020', 0, y, wPx, 1); x.globalAlpha = 1; }
    // alguna grieta
    for (let k = 0; k < Math.max(1, wPx / 40); k++) { let cx = Math.floor(hash2(k, seed + 5) * wPx), cy = Math.floor(hPx * 0.2 + hash2(seed, k + 9) * hPx * 0.4); for (let s = 0; s < 6; s++) { this.px(x, D, cx, cy); cx += hash2(cx, cy) < 0.5 ? 0 : (hash2(cy, cx) < 0.5 ? -1 : 1); cy++; } }
    return c;
  },
  // tejas: hileras escalonadas, cada teja con su tono y borde inferior oscuro
  roofTex(col) {
    // tejas en filas escalonadas: cada teja con borde de luz arriba y sombra abajo; filas que se superponen
    const N = 16, [c, x] = U.makeCanvas(N, N), L = U.shade(col, 0.16), D = U.shade(col, -0.14), DD = U.shade(col, -0.34);
    this.px(x, D, 0, 0, N, N);
    for (let r = 0; r < 4; r++) {
      const y0 = r * 4, off = (r % 2) * 2;
      for (let k = -1; k < 5; k++) {
        const x0 = k * 4 + off, tone = hash2(k + 9 + r * 5, r + 3) < 0.25 ? U.shade(col, -0.06) : hash2(k, r * 7) > 0.85 ? U.shade(col, 0.06) : col;
        this.px(x, tone, x0 + 1, y0, 3, 3); this.px(x, L, x0 + 1, y0, 3, 1); this.px(x, D, x0 + 3, y0 + 1, 1, 2);
      }
      this.px(x, DD, 0, y0 + 3, N, 1);
    }
    return World3D.tex(c, true);
  },
  stoneTex() {
    if (this._stone) return this._stone;
    const [c, x] = U.makeCanvas(16, 8);
    this.px(x, '#4a4450', 0, 0, 16, 8);
    const cols = ['#7a7480', '#8a8490', '#6a6470', '#948e98'];
    for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) { const x0 = k * 6 - (r ? 3 : 0), w = 5; this.px(x, cols[(k + r * 2) % 4], x0 + 1, r * 4 + 1, w, 3); this.px(x, '#a8a2ac', x0 + 1, r * 4 + 1, w - 1, 1); }
    return (this._stone = World3D.tex(c, true));
  },
  brickTex() {
    if (this._brick) return this._brick;
    const [c, x] = U.makeCanvas(16, 16);
    this.px(x, '#5a3028', 0, 0, 16, 16);
    for (let r = 0; r < 4; r++) for (let k = -1; k < 3; k++) { const x0 = k * 8 + (r % 2) * 4; this.px(x, ['#a85a40', '#985038', '#b86a48'][(k + r + 3) % 3], x0 + 1, r * 4 + 1, 7, 3); }
    return (this._brick = World3D.tex(c, true));
  },
  // vidrio: azul oscuro con un reflejo en diagonal (de noche brilla con la luz de dentro)
  glassTex() {
    if (this._glass) return this._glass;
    const [c, x] = U.makeCanvas(8, 8);
    this.px(x, '#34506e', 0, 0, 8, 8); this.px(x, '#4a6e90', 0, 0, 8, 3);
    for (let i = 0; i < 4; i++) this.px(x, '#b8d8f0', 4 - i, 1 + i, 2, 1);
    return (this._glass = World3D.tex(c));
  },
  doorTex(kind, wood) {
    const key = kind + wood; this._door = this._door || {};
    if (this._door[key]) return this._door[key];
    const [c, x] = U.makeCanvas(10, 16);
    if (kind === 'glass') {
      this.px(x, '#2a3440', 0, 0, 10, 16); this.px(x, '#6aa8d0', 1, 1, 3, 15); this.px(x, '#5a98c0', 6, 1, 3, 15); this.px(x, '#d8f0ff', 1, 1, 1, 5); this.px(x, '#d8f0ff', 6, 1, 1, 3);
    } else {
      this.px(x, U.shade(wood, -0.25), 0, 0, 10, 16);
      for (let i = 0; i < 4; i++) this.px(x, i % 2 ? wood : U.shade(wood, 0.08), 1 + i * 2, 1, 2, 15);
      this.px(x, U.shade(wood, -0.3), 1, 5, 8, 1); this.px(x, U.shade(wood, -0.3), 1, 11, 8, 1); this.px(x, '#f0d060', 7, 8, 1, 2);
    }
    return (this._door[key] = World3D.tex(c));
  },
  signTex(sign) {
    const [c, x] = U.makeCanvas(18, 10);
    this.px(x, '#2a2430', 0, 0, 18, 10); this.px(x, '#fdfaf2', 1, 1, 16, 8);
    Icons.drawSign(x, sign, 6, 2);
    return World3D.tex(c);
  },
  // junta geometrías (ya colocadas) en una sola
  merge(geos) {
    let n = 0; for (const g of geos) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let o = 0;
    for (const g of geos) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; g.dispose(); }
    const m = new THREE.BufferGeometry();
    m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return m;
  },
};

World3D.buildBuilding = function (b) {
  const S = Buildings.STYLES[b.style] || Buildings.STYLES.house;
  const img = Buildings.get(b.style, b.w, b.h, b.door), Hp = img.height;
  const rh = Math.round(Hp * (b.h >= 5 ? 0.5 : 0.56));
  const wd = b.w, depth = Math.max(2, b.h * 0.72), hgt = ((Hp - rh) / 16) * 1.22;
  const front = b.y + b.h - 0.02, back = front - depth, cx = b.x + wd / 2, cz = front - depth / 2;
  const seed = (b.x * 31 + b.y * 17) | 0, house = b.style.startsWith('house'), shop = !!S.sign;
  const doorTx = b.door !== undefined ? b.door : Math.floor(b.w / 2), doorX = b.x + doorTx + 0.5;
  const grp = new THREE.Group(), mats = [];
  const M = (o) => { const m = new THREE.MeshLambertMaterial(Object.assign({ transparent: true }, o)); mats.push(m); return m; };
  const K = HouseKit, buckets = new Map();
  // pieza: geometría colocada (giro en Y alrededor de la casa + traslado) en el «balde» de su material
  const add = (mat, geo, x, y, z, ry = 0, rx = 0) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (rx) g.rotateX(rx);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    if (!buckets.has(mat)) buckets.set(mat, []);
    buckets.get(mat).push(g);
  };
  const box = (mat, w, h, d, x, y, z, ry = 0, rx = 0) => add(mat, new THREE.BoxGeometry(w, h, d), x, y, z, ry, rx);
  // ---------- materiales ----------
  const wallCol = S.wall, trim = U.shade(S.trim, -0.1);
  const tFront = World3D.tex(K.plaster(Math.round(wd * 16), Math.round(hgt * 16), wallCol, seed));
  const tSide = World3D.tex(K.plaster(Math.round(depth * 16), Math.round(hgt * 16), U.shade(wallCol, -0.04), seed + 1));
  const wallF = M({ map: tFront }), wallS = M({ map: tSide });
  const gableT = World3D.tex(K.plaster(32, 32, U.shade(wallCol, -0.04), seed + 2, false), true);
  const gableM = M({ map: gableT, side: THREE.DoubleSide });
  const trimM = M({ color: trim }), beamM = M({ color: U.shade(S.trim, -0.35) });
  const shutM = M({ color: U.shade(S.roof, -0.12) });
  const stoneT = K.stoneTex(), stoneM = M({ map: stoneT });
  const glassM = M({ map: K.glassTex(), emissive: '#ffd070', emissiveIntensity: 0 });
  const doorM = M({ map: K.doorTex(shop ? 'glass' : 'wood', '#8a5a34') });
  const roofT = K.roofTex(S.roof), roofM = M({ map: roofT });
  const ridgeM = M({ color: U.shade(S.roof, -0.38) });
  // ---------- paredes ----------
  add(wallF, new THREE.PlaneGeometry(wd, hgt), cx, hgt / 2, front);
  add(wallF, new THREE.PlaneGeometry(wd, hgt), cx, hgt / 2, back, Math.PI);
  add(wallS, new THREE.PlaneGeometry(depth, hgt), cx + wd / 2, hgt / 2, cz, Math.PI / 2);
  add(wallS, new THREE.PlaneGeometry(depth, hgt), cx - wd / 2, hgt / 2, cz, -Math.PI / 2);
  // zócalo de piedra
  stoneT.repeat.set(1, 1);
  { const g = new THREE.BoxGeometry(wd + 0.1, 0.3, depth + 0.1), uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + p.getZ(i)) * 1.2, p.getY(i) * 2.4); add(stoneM, g, cx, 0.15, cz); }
  // vigas de madera: esquinas y bajo el alero (casas)
  if (house) {
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) box(beamM, 0.13, hgt, 0.13, cx + sx * (wd / 2 - 0.02), hgt / 2, cz + sz * (depth / 2 - 0.02));
    box(beamM, wd + 0.06, 0.1, 0.1, cx, hgt - 0.05, front + 0.02);
    box(beamM, wd + 0.06, 0.08, 0.08, cx, 0.34, front + 0.02);
  } else {
    box(trimM, wd + 0.04, 0.12, 0.08, cx, hgt - 0.06, front + 0.02);
  }
  // ---------- ventanas ----------
  const flowers = house && hash2(seed, 77) < 0.65, fcol = ['#ff5a7a', '#ffd040', '#ffffff', '#c070ff'][seed & 3];
  const flowerM = flowers ? M({ color: fcol, emissive: fcol, emissiveIntensity: 0.12 }) : null, leafM = flowers ? M({ color: '#3a8a3a' }) : null;
  // ventana en el plano local (mirando a +z) y luego girada a su pared
  const windowAt = (lx, ly, ry, wx, wz, ww = 0.5, wh = 0.56) => {
    const put = (mat, w, h, d, ox, oy, oz) => {
      const g = new THREE.BoxGeometry(w, h, d); const c = Math.cos(ry), s = Math.sin(ry);
      add(mat, g, wx + (ox + lx) * c + oz * s, ly + oy, wz - (ox + lx) * s + oz * c, ry);
    };
    put(glassM, ww, wh, 0.02, 0, 0, 0.01);
    put(trimM, ww + 0.1, 0.07, 0.09, 0, wh / 2 + 0.02, 0.04); put(trimM, ww + 0.1, 0.06, 0.09, 0, -wh / 2 - 0.02, 0.04);
    put(trimM, 0.06, wh, 0.09, -ww / 2 - 0.02, 0, 0.04); put(trimM, 0.06, wh, 0.09, ww / 2 + 0.02, 0, 0.04);
    put(trimM, 0.035, wh, 0.05, 0, 0, 0.03); put(trimM, ww, 0.035, 0.05, 0, wh * 0.1, 0.03);
    put(stoneM, ww + 0.2, 0.05, 0.16, 0, -wh / 2 - 0.07, 0.07); // alféizar
    if (house) { put(shutM, ww * 0.42, wh + 0.04, 0.03, -ww / 2 - ww * 0.25 - 0.06, 0, 0.02); put(shutM, ww * 0.42, wh + 0.04, 0.03, ww / 2 + ww * 0.25 + 0.06, 0, 0.02); }
    if (flowers) {
      put(beamM, ww + 0.06, 0.12, 0.13, 0, -wh / 2 - 0.15, 0.1);
      for (let k = 0; k < 5; k++) { put(leafM, 0.08, 0.07, 0.08, -ww / 2 + 0.05 + k * ww / 4.6, -wh / 2 - 0.06, 0.1 + (k % 2) * 0.03); if (k % 2 === 0) put(flowerM, 0.06, 0.06, 0.06, -ww / 2 + 0.05 + k * ww / 4.6, -wh / 2 - 0.01, 0.11); }
    }
  };
  const rows = hgt > 2.7 ? [hgt * 0.36, hgt * 0.74] : [hgt * 0.54];
  for (let tx = 0; tx < b.w; tx++) {
    if (tx === doorTx) continue;
    if (shop && Math.abs(tx - doorTx) === 1 && b.w <= 5) continue;
    for (const wy of rows) windowAt(b.x + tx + 0.5 - cx, wy, 0, cx, front);
  }
  // en lo alto sobre la puerta también, si el edificio es alto
  if (rows.length > 1 && !shop) windowAt(doorX - cx, rows[1], 0, cx, front);
  // ventanas laterales
  if (depth >= 2.2) for (const s of [-1, 1]) windowAt(0, rows[0], s * Math.PI / 2, cx + s * wd / 2, cz);
  // ---------- puerta ----------
  const dw = shop ? 0.78 : 0.62, dh = Math.min(1.25, hgt * 0.58);
  add(doorM, new THREE.PlaneGeometry(dw, dh), doorX, dh / 2 + 0.02, front + 0.012);
  box(trimM, dw + 0.14, 0.09, 0.12, doorX, dh + 0.06, front + 0.05);
  box(trimM, 0.08, dh, 0.12, doorX - dw / 2 - 0.03, dh / 2, front + 0.05); box(trimM, 0.08, dh, 0.12, doorX + dw / 2 + 0.03, dh / 2, front + 0.05);
  box(stoneM, dw + 0.4, 0.08, 0.34, doorX, 0.04, front + 0.17); // escalón
  // alero sobre la puerta
  box(roofM, dw + 0.5, 0.06, 0.46, doorX, dh + 0.24, front + 0.22, 0, 0.32);
  box(beamM, 0.05, 0.3, 0.05, doorX - dw / 2 - 0.18, dh + 0.06, front + 0.32, 0, 0.6); box(beamM, 0.05, 0.3, 0.05, doorX + dw / 2 + 0.18, dh + 0.06, front + 0.32, 0, 0.6);
  // farol junto a la puerta (brilla de noche, con las ventanas)
  box(beamM, 0.05, 0.05, 0.14, doorX + dw / 2 + 0.3, dh * 0.85, front + 0.07);
  box(glassM, 0.12, 0.17, 0.12, doorX + dw / 2 + 0.3, dh * 0.85 - 0.08, front + 0.14);
  // letrero de tiendas y edificios públicos
  if (shop) {
    const sm = M({ map: K.signTex(S.sign) });
    add(sm, new THREE.PlaneGeometry(0.9, 0.5), doorX, dh + 0.62, front + 0.04);
    box(trimM, 1.0, 0.6, 0.04, doorX, dh + 0.62, front + 0.01);
  }
  // ---------- tejado ----------
  const ovh = 0.22, rise = depth * 0.36, y0 = hgt, y1 = hgt + rise, zm = cz, half = depth / 2 + ovh;
  const ang = Math.atan2(rise, depth / 2), L = half / Math.cos(ang), rw = wd + 0.5;
  roofT.repeat.set(rw * 1.5, L * 1.5);
  for (const s of [1, -1]) {
    // losa con grosor, inclinada; el centro a mitad de camino entre la cumbrera y el alero
    const g = new THREE.BoxGeometry(rw, 0.12, L);
    add(roofM, g, cx, y1 - (L / 2) * Math.sin(ang) + 0.06, zm + s * (L / 2) * Math.cos(ang), s > 0 ? 0 : Math.PI, ang);
  }
  box(ridgeM, rw + 0.04, 0.12, 0.2, cx, y1 + 0.1, zm);
  // hastiales (triángulos bajo el tejado, a los lados)
  const tri = new THREE.Shape(); tri.moveTo(-depth / 2, 0); tri.lineTo(depth / 2, 0); tri.lineTo(0, rise); tri.lineTo(-depth / 2, 0);
  for (const s of [-1, 1]) add(gableM, new THREE.ShapeGeometry(tri), cx + s * wd / 2, hgt - 0.01, cz, s * Math.PI / 2);
  // ventanita redonda en el hastial de los edificios grandes
  if (!house) for (const s of [-1, 1]) box(glassM, 0.06, 0.28, 0.28, cx + s * (wd / 2 + 0.02), hgt + rise * 0.4, cz);
  // ---------- chimenea ----------
  if (house) {
    const chx = b.x + wd - 0.9, chz = zm - depth * 0.18, chM = M({ map: K.brickTex() });
    const chH = 1.1; box(chM, 0.42, chH, 0.42, chx, y1 - 0.1, chz);
    box(beamM, 0.52, 0.08, 0.52, chx, y1 - 0.1 + chH / 2 + 0.04, chz);
    this.chimney = this.chimney || new Map(); this.chimney.set(b, [chx, y1 + chH / 2, chz]);
  }
  // ---------- mallas (una por material) ----------
  for (const [mat, geos] of buckets) {
    const mesh = new THREE.Mesh(K.merge(geos), mat);
    mesh.castShadow = mesh.receiveShadow = true;
    grp.add(mesh);
  }
  this.root.add(grp);
  // sombra de contacto alrededor de la base (oclusión ambiental)
  this.root.add(this.aoPatch(cx, cz, wd + 0.9, depth + 0.9));
  this.buildings.push({ b, grp, mats, faceM: glassM, op: 1, x0: cx - wd / 2, x1: cx + wd / 2, z0: front - depth, z1: front, top: y1, wallH: hgt, door: [doorX, front + 0.4] });
};
