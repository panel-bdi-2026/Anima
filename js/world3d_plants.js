'use strict';
// ============================================================
//  MUNDO 3D: plantas en maceta
//  - 12 especies (helecho, palmera, cactus, costilla de Adán,
//    ficus, suculenta, bambú, girasol, lavanda, hiedra, flor
//    en arbusto y sansevieria) y 6 macetas distintas.
//  - Cada planta se elige y se varía (tamaño, giro, color) según
//    su posición, así que no hay dos iguales seguidas.
//  - Más plantas: en mesas y mostradores, colgadas de la pared
//    del fondo de los interiores y junto a las puertas de las casas.
// ============================================================
const PlantKit = {
  tx: {},
  // texturas de hojas dibujadas píxel a píxel (con el contorno del juego)
  leaf(kind, col) {
    const key = kind + col; if (this.tx[key]) return this.tx[key];
    const L = U.shade(col, 0.18), D = U.shade(col, -0.22), ink = U.shade(col, -0.45);
    let c, x;
    const px = (a, b, cc) => { x.fillStyle = cc; x.fillRect(a, b, 1, 1); };
    if (kind === 'frond') { // hoja de helecho: nervio central y foliolos
      [c, x] = U.makeCanvas(9, 24);
      for (let y = 0; y < 24; y++) {
        px(4, y, D);
        const w = Math.round(Math.sin((y / 24) * Math.PI) * 4);
        if (y % 2 === 0) for (let i = 1; i <= w; i++) { px(4 - i, y + (i > 2 ? 1 : 0), i === w ? ink : col); px(4 + i, y + (i > 2 ? 1 : 0), i === w ? ink : L); }
      }
    } else if (kind === 'broad') { // hoja ancha (costilla de Adán, ficus)
      [c, x] = U.makeCanvas(14, 16);
      for (let y = 0; y < 16; y++) {
        const w = Math.round(Math.sin(((y + 1) / 17) * Math.PI) * 6.5);
        for (let i = -w; i <= w; i++) px(7 + i, y, Math.abs(i) === w ? ink : i < 0 ? col : L);
        px(7, y, D);
        if (kind === 'broad' && y % 4 === 2 && w > 3) { px(7 - w + 1, y, '#00000000'); x.clearRect(7 - w, y, 2, 1); x.clearRect(7 + w - 1, y, 2, 1); }
      }
    } else if (kind === 'blade') { // hoja alargada (sansevieria, lavanda, bambú)
      [c, x] = U.makeCanvas(4, 24);
      for (let y = 0; y < 24; y++) { const w = y < 3 ? 1 : 2; for (let i = 0; i < w; i++) px(1 + i, y, i ? L : col); px(0, y, ink); if (w > 1) px(3, y, ink); if (y % 5 === 2) px(1, y, U.shade(col, 0.35)); }
    } else if (kind === 'ivy') { // tallo colgante con hojitas
      [c, x] = U.makeCanvas(8, 24);
      for (let y = 0; y < 24; y++) { px(4 + Math.round(Math.sin(y * 0.5)), y, D); if (y % 4 === 1) { const s = (y >> 2) % 2 ? -1 : 1; for (const [a, b] of [[0, 0], [1, 0], [1, 1], [2, 0], [0, 1]]) px(4 + s * (1 + a), y + b, b ? D : L); } }
    } else if (kind === 'puff') { // follaje redondo con flores
      [c, x] = U.makeCanvas(16, 16);
      for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) { const d = Math.hypot(i - 7.5, y - 7.5); if (d < 7.5) px(i, y, d > 6.6 ? ink : hash2(i, y) < 0.3 ? D : hash2(i * 3, y) < 0.3 ? L : col); }
    }
    const t = World3D.tex(c); t.shared = true;
    return (this.tx[key] = t);
  },
  mat(t) { this.mt = this.mt || new Map(); if (!this.mt.has(t)) this.mt.set(t, new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide })); return this.mt.get(t); },
  depth(t) { this.dt = this.dt || new Map(); if (!this.dt.has(t)) this.dt.set(t, new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 })); return this.dt.get(t); },
  // una hoja plana anclada por la base, inclinada hacia fuera
  blade(grp, t, w, h, yaw, tilt, y = 0) {
    const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
    const m = new THREE.Mesh(g, this.mat(t)); m.customDepthMaterial = this.depth(t);
    m.rotation.order = 'YXZ'; m.rotation.set(-tilt, yaw, 0); m.position.y = y; m.castShadow = true;
    grp.add(m); return m;
  },
  // ---------- macetas ----------
  pot(grp, kind, r, glaze) {
    const M = (c) => World3D.mat(c);
    let top = 0.3;
    if (kind === 0) { // terracota con borde
      const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.75, 0.3, 12), M('#c0663c')); p.position.y = 0.15; grp.add(p);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.1, 0.07, 12), M('#d07848')); rim.position.y = 0.31; grp.add(rim); top = 0.34;
    } else if (kind === 1) { // cerámica esmaltada con franja
      const p = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.8, 0.34, 14), M(glaze)); p.position.y = 0.17; grp.add(p);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.93, r * 0.9, 0.06, 14), M(U.shade(glaze, 0.25))); band.position.y = 0.24; grp.add(band); top = 0.34;
    } else if (kind === 2) { // jardinera cuadrada de madera
      const p = new THREE.Mesh(new THREE.BoxGeometry(r * 1.8, 0.3, r * 1.8), M('#8a5a34')); p.position.y = 0.15; grp.add(p);
      for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(r * 1.86, 0.04, 0.04), M('#5e3a1e')); l.position.set(0, 0.24, s * r * 0.9); grp.add(l); } top = 0.3;
    } else if (kind === 3) { // cesta de mimbre
      const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.85, 0.32, 10), M('#c8a060')); p.position.y = 0.16; grp.add(p);
      for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(r * (1.01 - i * 0.03), r * (1 - i * 0.03), 0.03, 10), M('#9a7038')); b.position.y = 0.07 + i * 0.1; grp.add(b); } top = 0.32;
    } else if (kind === 4) { // urna blanca con pie
      const f = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.6, 0.08, 12), M('#e8e4e0')); f.position.y = 0.04; grp.add(f);
      const p = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), M('#f4f0ec')); p.rotation.x = Math.PI; p.position.y = 0.38; grp.add(p); top = 0.38;
    } else { // cubo de metal
      const p = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.32, 12, 1, true), M('#8a98a8')); p.position.y = 0.16; grp.add(p);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.02, 12), M('#6a7888')); b.position.y = 0.01; grp.add(b); top = 0.32;
    }
    // tierra
    const soil = kind === 2 ? new THREE.Mesh(new THREE.BoxGeometry(r * 1.7, 0.02, r * 1.7), M('#3a2416')) : new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.88, 0.02, 12), M('#3a2416'));
    soil.position.y = top - 0.03; grp.add(soil);
    grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return top - 0.02;
  },
  // ---------- especies ----------
  plants: {
    fern(g, y, h, k) { const t = PlantKit.leaf('frond', ['#4aa040', '#3a9050', '#5ab048'][k % 3]); for (let i = 0; i < 9; i++) PlantKit.blade(g, t, 0.26, 0.55 * h, (i / 9) * Math.PI * 2 + k, 0.65 + (i % 3) * 0.2, y); },
    palm(g, y, h, k) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.75 * h, 6), World3D.mat('#8a6a40')); trunk.position.y = y + 0.37 * h; trunk.castShadow = true; g.add(trunk);
      for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 4, 8), World3D.mat('#6a4a28')); r.rotation.x = Math.PI / 2; r.position.y = y + (0.12 + i * 0.16) * h; g.add(r); }
      const t = PlantKit.leaf('frond', '#3aa048'); for (let i = 0; i < 7; i++) PlantKit.blade(g, t, 0.3, 0.6, (i / 7) * Math.PI * 2 + k, 1.15, y + 0.72 * h);
    },
    cactus(g, y, h, k) {
      const C = World3D.mat(['#4a9a50', '#3a8a60', '#5aa048'][k % 3], { flatShading: true });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.6 * h, 8), C); body.position.y = y + 0.3 * h; body.castShadow = true; g.add(body);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), C); cap.position.y = y + 0.6 * h; g.add(cap);
      for (const s of [-1, 1]) {
        if (s === 1 && k % 2) continue;
        const a = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.24, 6), C); a.position.set(s * 0.17, y + 0.38 * h, 0); g.add(a);
        const j = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 6), C); j.rotation.z = Math.PI / 2; j.position.set(s * 0.11, y + 0.27 * h, 0); g.add(j);
      }
      // espinas y flor
      for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.04), World3D.mat('#f0f0d0')); const a = i * 2.4; s.position.set(Math.cos(a) * 0.12, y + 0.1 + (i / 10) * 0.45 * h, Math.sin(a) * 0.12); s.lookAt(0, s.position.y, 0); g.add(s); }
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), World3D.mat(['#ff6a9a', '#ffd040', '#ff8040'][k % 3])); fl.position.y = y + 0.63 * h + 0.04; g.add(fl);
    },
    monstera(g, y, h, k) { const t = PlantKit.leaf('broad', '#2e8a48'); for (let i = 0; i < 6; i++) { const l = PlantKit.blade(g, t, 0.36, 0.42, (i / 6) * Math.PI * 2 + k * 0.7, 0.7 + (i % 2) * 0.35, y + 0.1 + (i % 3) * 0.12 * h); l.scale.setScalar(0.85 + (i % 3) * 0.12); } },
    ficus(g, y, h, k) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.5 * h, 5), World3D.mat('#7a5a38')); trunk.position.y = y + 0.25 * h; g.add(trunk);
      const t = PlantKit.leaf('puff', ['#3e8a40', '#4a9a3a'][k % 2]);
      for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17 - i * 0.015, 1), new THREE.MeshLambertMaterial({ map: t, flatShading: true })); const a = i * 1.9 + k; b.position.set(Math.cos(a) * 0.1, y + 0.55 * h + (i % 2) * 0.12, Math.sin(a) * 0.08); b.castShadow = true; g.add(b); }
    },
    succulent(g, y, h, k) {
      const col = ['#7ab890', '#8aa8c0', '#a0b870'][k % 3];
      for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 7 - ring * 2; i++) {
        const l = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16 - ring * 0.03, 4), World3D.mat(U.shade(col, ring * 0.08), { flatShading: true }));
        const a = (i / (7 - ring * 2)) * Math.PI * 2 + ring * 0.4;
        l.position.set(Math.cos(a) * (0.11 - ring * 0.035), y + 0.04 + ring * 0.03, Math.sin(a) * (0.11 - ring * 0.035)); l.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); l.castShadow = true; g.add(l);
      }
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), World3D.mat('#ff9aa0')); tip.position.y = y + 0.12; g.add(tip);
    },
    bamboo(g, y, h, k) {
      const C = World3D.mat('#8ab840'), N = World3D.mat('#5a8a28'), t = PlantKit.leaf('blade', '#4a9a38');
      for (let i = 0; i < 3; i++) {
        const hh = (0.7 + i * 0.18) * h, a = i * 2.1 + k, ox = Math.cos(a) * 0.07, oz = Math.sin(a) * 0.07;
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, hh, 6), C); s.position.set(ox, y + hh / 2, oz); s.castShadow = true; g.add(s);
        for (let j = 1; j < 4; j++) { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 6), N); n.position.set(ox, y + (hh * j) / 4, oz); g.add(n); }
        for (let j = 0; j < 3; j++) { const b = PlantKit.blade(g, t, 0.07, 0.26, a + j * 2, 1.2, y + hh * (0.6 + j * 0.13)); b.position.x = ox; b.position.z = oz; }
      }
    },
    sunflower(g, y, h, k) {
      const t = PlantKit.leaf('broad', '#4a9a38');
      for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, (0.55 + i * 0.12) * h, 5), World3D.mat('#4a8a30')); const a = i * 2.2 + k; st.position.set(Math.cos(a) * 0.06, y + st.geometry.parameters.height / 2, Math.sin(a) * 0.06); g.add(st);
        const hd = new THREE.Group(); hd.position.set(st.position.x, y + st.geometry.parameters.height, st.position.z); hd.rotation.x = -0.5;
        for (let p = 0; p < 10; p++) { const pt = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.01), World3D.mat('#ffd030')); const pa = (p / 10) * Math.PI * 2; pt.position.set(Math.cos(pa) * 0.06, Math.sin(pa) * 0.06, 0); pt.rotation.z = pa - Math.PI / 2; hd.add(pt); }
        const ctr = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8), World3D.mat('#6a3a18')); ctr.rotation.x = Math.PI / 2; hd.add(ctr); g.add(hd);
        PlantKit.blade(g, t, 0.16, 0.18, a + 1, 1.0, y + 0.2 * h); }
    },
    lavender(g, y, h, k) {
      const t = PlantKit.leaf('blade', '#7a9a70'), fc = ['#9a70d0', '#b080e0', '#e090c0'][k % 3];
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + k; const b = PlantKit.blade(g, t, 0.05, 0.38 * h, a, 0.3 + (i % 3) * 0.12, y);
        const f = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.1, 4), World3D.mat(fc)); const r = Math.sin(b.rotation.x * -1) * 0.38 * h; f.position.set(Math.sin(a) * r, y + Math.cos(b.rotation.x) * 0.38 * h + 0.03, Math.cos(a) * r); f.rotation.copy(b.rotation); g.add(f); }
    },
    ivy(g, y, h, k) {
      const t = PlantKit.leaf('ivy', '#3a9a4a'); const p = PlantKit.leaf('puff', '#3a9a4a');
      const top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), new THREE.MeshLambertMaterial({ map: p, flatShading: true })); top.position.y = y + 0.06; top.scale.y = 0.6; g.add(top);
      for (let i = 0; i < 6; i++) { const b = PlantKit.blade(g, t, 0.12, 0.5, (i / 6) * Math.PI * 2 + k, Math.PI - 0.15, y + 0.08); b.position.x = Math.sin(b.rotation.y) * 0.14; b.position.z = Math.cos(b.rotation.y) * 0.14; }
    },
    flowerbush(g, y, h, k) {
      const p = PlantKit.leaf('puff', '#3e9040'), fc = ['#ff6a8a', '#ffffff', '#ffd040', '#c080ff', '#ff8a40'][k % 5];
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), new THREE.MeshLambertMaterial({ map: p, flatShading: true })); b.position.y = y + 0.18 * h; b.scale.y = 0.85; b.castShadow = true; g.add(b);
      for (let i = 0; i < 14; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 0), World3D.mat(fc)); const a = i * 2.39, e = (i / 14) * 1.3; f.position.set(Math.cos(a) * Math.sin(e + 0.3) * 0.24, y + 0.18 * h + Math.cos(e + 0.3) * 0.2, Math.sin(a) * Math.sin(e + 0.3) * 0.24); g.add(f);
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.015), World3D.mat('#ffe080')); c.position.copy(f.position).multiplyScalar(1.04); c.position.y = f.position.y + 0.01; g.add(c); }
    },
    snake(g, y, h, k) { const t = PlantKit.leaf('blade', ['#3a7a40', '#4a8a30'][k % 2]); for (let i = 0; i < 7; i++) { const b = PlantKit.blade(g, t, 0.09, (0.45 + (i % 3) * 0.12) * h, (i / 7) * Math.PI * 2 + k, 0.12 + (i % 2) * 0.12, y); b.position.x = Math.cos(i * 2.3) * 0.05; b.position.z = Math.sin(i * 2.3) * 0.05; } },
  },
  // planta completa: se elige según la semilla
  make(seed, scale = 1, opts = {}) {
    const names = opts.only || Object.keys(this.plants);
    const k = Math.floor(hash2(seed * 7.3, seed * 1.7) * 1000);
    const name = names[k % names.length], potK = opts.pot !== undefined ? opts.pot : Math.floor(hash2(seed, seed * 3) * 6);
    const glaze = ['#4a78c8', '#e8e0d8', '#3a9a8a', '#c85a5a', '#e0b040', '#7a5ab0'][k % 6];
    const g = new THREE.Group();
    const r = name === 'cactus' || name === 'succulent' ? 0.14 : 0.2;
    const y = this.pot(g, potK, r, glaze);
    this.plants[name](g, y, 0.9 + hash2(seed * 2, seed) * 0.35, k);
    g.scale.setScalar(scale);
    g.rotation.y = hash2(seed, seed * 9) * Math.PI * 2;
    return g;
  },
};

Object.assign(World3D, {
  // decoración extra: plantas en mesas, colgadas de la pared y junto a las puertas
  buildPlantDecor(world) {
    const m = world.map;
    if (this.mode === 'in') {
      const T = (x, y) => (TILEDEF[(m.rows[y] || '')[x]] || {}).t;
      for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
        const t = T(tx, ty), s = hash2(tx * 11 + 3, ty * 7 + 1);
        if (t === 'table' && s < 0.45 && T(tx - 1, ty) !== 'table') { const p = PlantKit.make(tx * 31 + ty * 17, 0.55, { only: ['succulent', 'cactus', 'flowerbush', 'lavender', 'snake'], pot: s < 0.2 ? 1 : 4 }); p.position.set(tx + 0.5, 0.6, ty + 0.5); this.root.add(p); }
        if (t === 'counter' && T(tx + 1, ty) !== 'counter' && s < 0.7) { const p = PlantKit.make(tx * 13 + ty, 0.5, { only: ['succulent', 'flowerbush', 'cactus'], pot: 1 }); p.position.set(tx + 0.6, 0.78, ty + 0.4); this.root.add(p); }
        // macetas colgantes en la pared del fondo
        if ((t === 'wall' || t === 'gymwall') && ty === 0 && tx > 0 && tx < m.w - 1 && tx % 4 === 2 && T(tx, 1) && !(TILEDEF[m.rows[1][tx]] || {}).solid) {
          const p = PlantKit.make(tx * 7 + 99, 0.85, { only: ['ivy'], pot: tx % 8 === 2 ? 3 : 5 });
          p.position.set(tx + 0.5, 1.3, 1.16); p.rotation.y = 0; this.root.add(p);
          const hook = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.18), this.mat('#3a3440')); hook.position.set(tx + 0.5, 1.78, 1.05); this.root.add(hook);
          const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 3), this.mat('#c8b080')); rope.position.set(tx + 0.5, 1.68, 1.14); this.root.add(rope);
        }
      }
    } else if (this.mode === 'out') {
      // dos macetas junto a la puerta de cada casa
      for (const B of this.buildings) {
        if (!B.b) continue;
        const dx = B.door[0], z = B.z1 + 0.18;
        for (const s of [-1, 1]) {
          const x = dx + s * 0.85; if (x < B.x0 + 0.3 || x > B.x1 - 0.3) continue;
          const p = PlantKit.make(Math.round(x * 13 + B.z1 * 7), 0.7, { only: ['flowerbush', 'palm', 'fern', 'lavender', 'sunflower', 'monstera', 'bamboo'] });
          p.position.set(x, 0, z); this.root.add(p);
        }
      }
    }
  },
});
// la planta de los interiores usa la colección
{
  const _f = World3D.makeFurniture;
  World3D.makeFurniture = function (world, t, tx, ty, img) {
    if (t === 'plant') { const p = PlantKit.make(tx * 37 + ty * 101 + world.map.id.length * 13, 1.25); p.position.set(tx + 0.5, 0, ty + 0.55); this.root.add(p); return true; }
    return _f.call(this, world, t, tx, ty, img);
  };
  const _build = World3D.build;
  World3D.build = function (world) { _build.call(this, world); this.buildPlantDecor(world); };
}

// más plantas en los interiores: macetas en las esquinas libres de cada sala
// (una esquina es un callejón sin salida, así que nunca corta el paso)
for (const m of Object.values(MAPS)) {
  if (!m.rows || m.outdoor || m.cave || m.dungeon) continue;
  const at = (x, y) => TILEDEF[(m.rows[y] || '')[x]];
  const busy = (x, y) => (m.warps || []).some((w) => w.x === x && w.y === y) || (m.npcs || []).some((n) => n.x === x && n.y === y) || (m.items || []).some((i) => i.x === x && i.y === y);
  for (const [x, y] of [[0, 1], [m.w - 1, 1], [0, m.h - 2], [m.w - 1, m.h - 2]]) {
    const d = at(x, y);
    if (!d || d.solid || d.t === 'mat' || d.t === 'stairs' || busy(x, y)) continue;
    // la casilla vecina hacia dentro debe seguir libre
    const nx = x === 0 ? 1 : x - 1, n = at(nx, y), ny = y === 1 ? 2 : y - 1, n2 = at(x, ny);
    if (!n || n.solid || !n2 || n2.solid) continue;
    m.rows[y] = m.rows[y].slice(0, x) + 'q' + m.rows[y].slice(x + 1);
  }
}
