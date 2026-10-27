'use strict';
// ============================================================
//  MUNDO 3D: objetos y muebles con volumen
//  - Exteriores: vallas que se unen entre sí, rocas facetadas,
//    carteles, bancos, barriles, buzones, jardineras, arbustos,
//    setos y flores de pie que se mecen.
//  - Interiores: estanterías con libros, televisores, ordenadores,
//    mesas con patas, camas con almohada, mostradores, máquinas.
//  - Agua con oleaje suave y destellos en dos capas.
//  Cada objeto usa sus colores y dibujos originales.
// ============================================================
Object.assign(World3D, {
  // ---------- utilidades ----------
  mat(color, opts) {
    this.matC = this.matC || {};
    const k = color + (opts ? JSON.stringify(opts) : '');
    if (!this.matC[k]) this.matC[k] = new THREE.MeshLambertMaterial(Object.assign({ color }, opts || {}));
    return this.matC[k];
  },
  box(w, h, d, mat, x, y, z, parent) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    b.position.set(x, y, z); b.castShadow = b.receiveShadow = true;
    (parent || this.root).add(b); return b;
  },
  // color de un píxel opaco del dibujo
  pick(img, x, y) {
    const c = img.getContext('2d');
    for (let yy = y; yy < img.height; yy++) { const p = c.getImageData(x, yy, 1, 1).data; if (p[3] > 128) return "#" + [p[0], p[1], p[2]].map((q) => q.toString(16).padStart(2, "0")).join(""); }
    return '#808080';
  },
  // color medio de los píxeles opacos (sin contorno)
  avg(img) {
    const d = img.getContext('2d').getImageData(0, 0, img.width, img.height).data; let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; const l = d[i] + d[i + 1] + d[i + 2]; if (l < 90) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    const hx = (v) => Math.round(v / n).toString(16).padStart(2, '0');
    return n ? '#' + hx(r) + hx(g) + hx(b) : '#808080';
  },
  cropTex(img, sx, sy, sw, sh) { return this.tex(this.crop(img, sx, sy, sw, sh)); },
  // ---------- exteriores ----------
  makeProp(world, t, tx, ty) {
    const x = tx + 0.5, z = ty + 0.5, v = Math.floor(hash2(tx, ty) * 3);
    const same = (dx, dy) => { const d = world.tileAt(tx + dx, ty + dy); return d && d.t === t; };
    switch (t) {
      case 'fence': {
        const white = this.mat('#f4f0e8'), shade = this.mat('#c8c0b8');
        this.fenceList = this.fenceList || [];
        const post = (px, pz) => { this.box(0.13, 0.62, 0.13, white, px, 0.31, pz); this.box(0.17, 0.05, 0.17, shade, px, 0.64, pz); };
        post(x, z);
        if (same(1, 0)) { this.box(1, 0.08, 0.06, white, x + 0.5, 0.48, z); this.box(1, 0.08, 0.06, white, x + 0.5, 0.24, z); }
        if (same(0, 1)) { this.box(0.06, 0.08, 1, white, x, 0.48, z + 0.5); this.box(0.06, 0.08, 1, white, x, 0.24, z + 0.5); }
        if (!same(-1, 0) && !same(1, 0) && !same(0, 1) && !same(0, -1)) { this.box(0.9, 0.08, 0.06, white, x, 0.48, z); this.box(0.9, 0.08, 0.06, white, x, 0.24, z); }
        return true;
      }
      case 'rock': case 'ashrock': case 'caverock': case 'crackrock': case 'cavecrack': {
        const img = Obj.get(OBJ_OF[t] || t, 0, v), col = U.shade(this.avg(img), -0.08);
        const g = new THREE.IcosahedronGeometry(0.42, 1), p = g.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const k = 0.82 + hash2(Math.round(p.getX(i) * 50) + tx * 7, Math.round(p.getZ(i) * 50) + ty * 3) * 0.32;
          p.setXYZ(i, p.getX(i) * k * 1.15, Math.max(-0.05, p.getY(i)) * k * (t === 'caverock' ? 1.5 : 0.95), p.getZ(i) * k);
        }
        g.computeVertexNormals();
        const m = new THREE.Mesh(g, this.mat(col, { flatShading: true }));
        m.position.set(x, 0.12, z + 0.05); m.rotation.y = hash2(tx, ty) * 6; m.castShadow = m.receiveShadow = true; this.root.add(m);
        // musgo, brasas o grietas
        if (t === 'rock') { const mo = this.box(0.22, 0.05, 0.18, this.mat('#5aa040'), x - 0.08, 0.42, z, null); mo.rotation.y = 0.4; }
        if (t === 'ashrock') { const e = this.box(0.08, 0.06, 0.08, this.mat('#ff6020', { emissive: '#ff4010', emissiveIntensity: 0.8 }), x + 0.12, 0.35, z + 0.25); e.castShadow = false; }
        if (t === 'crackrock' || t === 'cavecrack') for (let i = 0; i < 3; i++) { const c = this.box(0.04, 0.3, 0.04, this.mat('#2a2430'), x - 0.15 + i * 0.15, 0.3, z + 0.32); c.rotation.z = (i - 1) * 0.5; }
        if (hash2(tx * 3, ty) < 0.6) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), this.mat(U.shade(col, -0.1), { flatShading: true })); s.position.set(x + 0.35, 0.05, z + 0.3); s.castShadow = true; this.root.add(s); }
        return true;
      }
      case 'sign': case 'ashsign': {
        const img = Obj.get('sign', 0, v), wood = this.pick(img, 8, 2), dark = U.shade(wood, -0.3);
        this.box(0.1, 0.55, 0.1, this.mat(dark), x, 0.27, z + 0.1);
        const face = this.cropTex(img, 1, 1, 14, 9);
        this.box(0.86, 0.52, 0.08, [this.mat(dark), this.mat(dark), this.mat(wood), this.mat(dark), new THREE.MeshLambertMaterial({ map: face }), this.mat(dark)], x, 0.72, z + 0.12);
        return true;
      }
      case 'bench': {
        const img = Obj.get('bench', 0, v), wood = this.pick(img, 8, 5), dark = this.mat(U.shade(wood, -0.35)), w = this.mat(wood);
        this.box(0.9, 0.07, 0.36, w, x, 0.34, z + 0.1);
        this.box(0.9, 0.24, 0.06, w, x, 0.56, z - 0.08);
        for (const dx of [-0.38, 0.38]) for (const dz of [-0.04, 0.22]) this.box(0.06, 0.32, 0.06, dark, x + dx, 0.16, z + dz);
        return true;
      }
      case 'barrel': {
        const img = Obj.get('barrel', 0, v), wood = this.avg(img);
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.72, 10), this.mat(wood));
        b.position.set(x, 0.36, z); b.castShadow = b.receiveShadow = true; this.root.add(b);
        const bulge = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.36, 10), this.mat(U.shade(wood, 0.06)));
        bulge.position.set(x, 0.36, z); bulge.castShadow = true; this.root.add(bulge);
        for (const y of [0.12, 0.6]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.315, 0.315, 0.05, 10), this.mat('#4a4048')); h.position.set(x, y, z); this.root.add(h); }
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.02, 10), this.mat(U.shade(wood, 0.12))); lid.position.set(x, 0.73, z); this.root.add(lid);
        return true;
      }
      case 'mailbox': {
        const img = Obj.get('mailbox', 0, v), red = '#d83a3a';
        this.box(0.08, 0.6, 0.08, this.mat('#5a4a40'), x, 0.3, z + 0.1);
        this.box(0.34, 0.26, 0.46, this.mat(red), x, 0.72, z + 0.1);
        const top = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.46, 10, 1, false, 0, Math.PI), this.mat(red));
        top.rotation.set(Math.PI / 2, 0, Math.PI / 2); top.position.set(x, 0.85, z + 0.1); top.castShadow = true; this.root.add(top);
        this.box(0.03, 0.2, 0.04, this.mat('#f0c030'), x + 0.19, 0.9, z + 0.05);
        this.box(0.03, 0.08, 0.1, this.mat('#f0c030'), x + 0.19, 0.98, z + 0.1);
        return true;
      }
      case 'planter': {
        const img = Obj.get('planter', 0, v), wood = this.pick(img, 8, 13);
        this.box(0.9, 0.34, 0.5, this.mat(wood), x, 0.17, z + 0.1);
        this.box(0.84, 0.03, 0.44, this.mat('#4a3020'), x, 0.35, z + 0.1);
        const fl = this.cropTex(img, 0, 0, 16, 8);
        const mesh = this.billMesh(fl, 0.95, 0.48, 0, { tilt: 0.3 });
        mesh.position.set(x, 0.32, z + 0.12); this.root.add(mesh);
        return true;
      }
      case 'cutbush': case 'hedge': {
        const img = t === 'hedge' ? Tiles.get('hedge', 0, v) : Obj.get('cutbush', 0, v);
        const leaf = this.leafTex || (this.leafTex = (() => { const tt = this.tex(this.crop(Obj.get('cutbush', 0, 0), 3, 3, 10, 10), true); tt.shared = true; return tt; })());
        if (t === 'hedge') {
          const m = new THREE.MeshLambertMaterial({ map: leaf, color: '#e8ffe0' });
          this.box(same(1, 0) ? 1.02 : 0.92, 0.72, same(0, 1) ? 1.02 : 0.86, m, x + (same(1, 0) ? 0.01 : 0), 0.36, z + (same(0, 1) ? 0.01 : 0));
          this.box(0.8, 0.12, 0.7, new THREE.MeshLambertMaterial({ map: leaf, color: '#e8ffd8' }), x, 0.76, z);
        } else {
          const g = new THREE.IcosahedronGeometry(0.42, 1);
          const b = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: leaf, flatShading: true }));
          b.position.set(x, 0.38, z); b.scale.set(1, 0.85, 1); b.castShadow = b.receiveShadow = true; this.root.add(b);
        }
        void img;
        return true;
      }
    }
    return false;
  },
  // flores de pie (en las casillas de flores y, de vez en cuando, en la hierba)
  buildFlowers(world) {
    const m = world.map, spots = [];
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const d = world.tileAt(tx, ty); if (!d) continue;
      if (d.t === 'flower') for (let k = 0; k < 4; k++) spots.push([tx + 0.2 + hash2(tx * 5 + k, ty) * 0.6, ty + 0.25 + hash2(tx, ty * 5 + k) * 0.6, k]);
      else if (d.t === 'grass' && m.outdoor && hash2(tx * 13, ty * 7) < 0.05) spots.push([tx + 0.5, ty + 0.6, tx + ty]);
    }
    if (!spots.length) return;
    const cols = ['#ff6a8a', '#ffe060', '#ffffff', '#b090ff', '#ff9a40'];
    const byC = {};
    for (const s of spots) { const c = cols[Math.floor(hash2(s[0] * 9, s[1] * 7) * cols.length)]; (byC[c] = byC[c] || []).push(s); }
    const o = new THREE.Object3D();
    for (const c in byC) {
      const [cv, x] = U.makeCanvas(7, 10);
      x.fillStyle = '#3a8a30'; x.fillRect(3, 4, 1, 6); x.fillRect(1, 7, 2, 1); x.fillRect(4, 6, 2, 1);
      x.fillStyle = c; x.fillRect(2, 0, 3, 1); x.fillRect(1, 1, 5, 3); x.fillRect(2, 4, 3, 1);
      x.fillStyle = U.shade(c, -0.25); x.fillRect(1, 3, 5, 1);
      x.fillStyle = '#ffe080'; x.fillRect(3, 2, 1, 1);
      const t = this.tex(cv);
      const g = new THREE.PlaneGeometry(0.28, 0.4); g.translate(0, 0.2, 0);
      const mat = new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide });
      mat.onBeforeCompile = (sh) => { sh.uniforms.uWind = this.windU; sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x += sin(uWind * 2.1 + instanceMatrix[3].x * 2.3 + instanceMatrix[3].z) * 0.05 * max(position.y, 0.0) * 2.5;\n#endif'); };
      const list = byC[c], inst = new THREE.InstancedMesh(g, mat, list.length);
      list.forEach(([fx, fz], i) => { o.position.set(fx, 0, fz); o.rotation.set(-W3.PITCH * 0.35, 0, 0); const s = 0.85 + hash2(fx * 3, fz * 3) * 0.4; o.scale.set(s, s, s); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); });
      inst.castShadow = true; this.root.add(inst);
    }
  },
  // ---------- interiores ----------
  makeFurniture(world, t, tx, ty, img) {
    const x = tx + 0.5, z = ty + 0.5;
    const edge = (y) => this.pick(img, 8, y);
    switch (t) {
      case 'shelf': {
        // estantería alta con tres baldas de libros
        const wood = edge(0), dark = this.mat(U.shade(wood, -0.3)), w = this.mat(wood);
        const H = 1.7, D = 0.48, zb = ty + 0.08 + D / 2;
        const books = this.cropTex(img, 1, 1, 14, 14);
        this.box(1, H, D, [dark, dark, w, dark, new THREE.MeshLambertMaterial({ map: books }), dark], x, H / 2, zb);
        this.box(1.04, 0.08, D + 0.06, w, x, H + 0.04, zb);
        return true;
      }
      case 'tv': {
        // mueble de madera con cajones
        const [cv, cx] = U.makeCanvas(16, 8);
        cx.fillStyle = '#8a6040'; cx.fillRect(0, 0, 16, 8); cx.fillStyle = '#6a4428'; cx.fillRect(0, 0, 16, 1); cx.fillRect(7, 1, 1, 7); cx.fillRect(0, 7, 16, 1);
        cx.fillStyle = '#e0c060'; cx.fillRect(3, 3, 2, 1); cx.fillRect(11, 3, 2, 1);
        const wood = this.mat('#8a6040'), front = new THREE.MeshLambertMaterial({ map: this.tex(cv) });
        this.box(0.98, 0.44, 0.5, [wood, wood, this.mat('#9a7050'), wood, front, wood], x, 0.22, ty + 0.36);
        // televisor de tubo: carcasa, pantalla con brillo y antenas
        const [sv, sx] = U.makeCanvas(16, 12);
        sx.fillStyle = '#2a2a34'; sx.fillRect(0, 0, 16, 12);
        sx.drawImage(img, 3, 3, 9, 7, 1, 1, 11, 9);
        sx.fillStyle = 'rgba(255,255,255,0.35)'; sx.fillRect(2, 2, 4, 1); sx.fillRect(2, 3, 1, 2);
        sx.fillStyle = '#5a5a68'; sx.fillRect(13, 1, 2, 10); sx.fillStyle = '#e04848'; sx.fillRect(13, 2, 2, 2); sx.fillStyle = '#a0a0b0'; sx.fillRect(13, 5, 2, 1); sx.fillRect(13, 7, 2, 1);
        const st = this.tex(sv), shell = this.mat('#3a3a46');
        this.box(0.78, 0.58, 0.36, [shell, shell, this.mat('#4a4a58'), shell, new THREE.MeshLambertMaterial({ map: st, emissive: '#ffffff', emissiveMap: st, emissiveIntensity: 0.22 }), shell], x, 0.73, ty + 0.38);
        this.box(0.56, 0.4, 0.18, shell, x, 0.7, ty + 0.14);
        for (const sgn of [-1, 1]) { const an = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.38, 4), this.mat('#b0b0c0')); an.position.set(x + sgn * 0.1, 1.15, ty + 0.36); an.rotation.z = -sgn * 0.45; this.root.add(an); }
        return true;
      }
      case 'pc': case 'machine': {
        const body = edge(1), front = this.cropTex(img, 0, 0, 16, 16);
        const h = t === 'machine' ? 1.3 : 1.05;
        const mats = [this.mat(U.shade(body, -0.2)), this.mat(U.shade(body, -0.2)), this.mat(U.shade(body, 0.1)), this.mat(body), new THREE.MeshLambertMaterial({ map: front, emissive: '#ffffff', emissiveMap: front, emissiveIntensity: 0.18 }), this.mat(body)];
        this.box(0.9, h, 0.55, mats, x, h / 2, ty + 0.36);
        return true;
      }
      case 'healer': {
        const front = this.cropTex(img, 0, 0, 16, 16);
        this.box(0.95, 0.75, 0.7, [this.mat('#d8d0d8'), this.mat('#d8d0d8'), new THREE.MeshLambertMaterial({ map: front }), this.mat('#d8d0d8'), this.mat('#e8e0e8'), this.mat('#d8d0d8')], x, 0.375, z);
        for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), this.mat('#ff5060', { emissive: '#ff3040', emissiveIntensity: 0.4 })); s.position.set(x - 0.25 + i * 0.25, 0.82, z); this.root.add(s); }
        return true;
      }
      case 'table': {
        const top = this.cropTex(img, 0, 0, 16, 16), wood = edge(8), leg = this.mat(U.shade(wood, -0.3));
        this.box(1, 0.08, 1, [this.mat(wood), this.mat(wood), new THREE.MeshLambertMaterial({ map: top }), this.mat(wood), this.mat(U.shade(wood, -0.1)), this.mat(wood)], x, 0.56, z);
        // patas solo en las esquinas exteriores de mesas que ocupan varias casillas
        const nb = (dx, dy) => { const d = TILEDEF[(world.map.rows[ty + dy] || '')[tx + dx]]; return d && d.t === 'table'; };
        for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) if (!nb(dx, 0) && !nb(0, dz)) this.box(0.08, 0.52, 0.08, leg, x + dx * 0.42, 0.26, z + dz * 0.42);
        return true;
      }
      case 'bed': {
        const top = this.cropTex(img, 0, 0, 16, 16);
        this.box(0.95, 0.32, 1, [this.mat('#8a6040'), this.mat('#8a6040'), new THREE.MeshLambertMaterial({ map: top }), this.mat('#8a6040'), this.mat('#6a92d0'), this.mat('#8a6040')], x, 0.16, z);
        this.box(0.95, 0.6, 0.08, this.mat('#7a5034'), x, 0.3, ty + 0.04);
        this.box(0.6, 0.12, 0.28, this.mat('#ffffff'), x, 0.38, ty + 0.25);
        return true;
      }
      case 'counter': {
        const top = this.cropTex(img, 0, 0, 16, 7), front = this.cropTex(img, 0, 7, 16, 9);
        const side = this.mat(edge(12));
        this.box(1.001, 0.78, 1, [side, side, new THREE.MeshLambertMaterial({ map: top }), side, new THREE.MeshLambertMaterial({ map: front }), side], x, 0.39, z);
        return true;
      }
      case 'plant': {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.34, 10), this.mat('#b8603a'));
        pot.position.set(x, 0.17, z + 0.1); pot.castShadow = true; this.root.add(pot);
        const leaf = this.leafTex || (this.leafTex = (() => { const tt = this.tex(this.crop(Obj.get('cutbush', 0, 0), 3, 3, 10, 10), true); tt.shared = true; return tt; })());
        for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22 - i * 0.03, 1), new THREE.MeshLambertMaterial({ map: leaf, flatShading: true })); b.position.set(x + (i - 1) * 0.12, 0.48 + i * 0.12, z + 0.1 - (i % 2) * 0.06); b.castShadow = true; this.root.add(b); }
        return true;
      }
    }
    return false;
  },
});

// ---------- agua con oleaje ----------
{
  const _water = World3D.buildWater;
  World3D.buildWater = function (world) {
    _water.call(this, world);
    if (!this.water) return;
    const w = this.root.children[this.root.children.length - 1];
    this.waveU = this.waveU || { value: 0 };
    w.material.onBeforeCompile = (sh) => {
      sh.uniforms.uWave = this.waveU;
      sh.vertexShader = 'uniform float uWave;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvec4 wp = modelMatrix * vec4(transformed, 1.0);\ntransformed.y += sin(wp.x * 1.7 + uWave * 1.6) * 0.025 + sin(wp.z * 2.3 - uWave * 1.2) * 0.02;');
    };
    // segunda capa de destellos que se mueve en otra dirección
    const t2 = this.water.clone(); t2.needsUpdate = true; t2.repeat.set(1.7, 1.7);
    const m2 = new THREE.MeshBasicMaterial({ map: t2, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending });
    const w2 = new THREE.Mesh(w.geometry, m2); w2.position.y = 0.045; w2.renderOrder = 3; this.root.add(w2);
    this.water2 = t2;
  };
  const _render = World3D.render;
  World3D.render = function (world) {
    const t = Engine.time;
    if (this.waveU) this.waveU.value = t;
    if (this.water2) { this.water2.offset.x = (-t * 0.045) % 1; this.water2.offset.y = (t * 0.02) % 1; }
    return _render.call(this, world);
  };
}

// ---------- puntos de recolección (bayas, minerales, setas) con volumen ----------
{
  const _build = World3D.build;
  World3D.build = function (world) {
    _build.call(this, world);
    this.gather = [];
    const l = typeof NODES !== 'undefined' && NODES[world.map.id]; if (!l) return;
    for (const n of l) {
      const g = new THREE.Group(), x = n[0] + 0.5, z = n[1] + 0.5, extra = new THREE.Group();
      g.position.set(x, 0, z); g.add(extra); this.root.add(g);
      if (n[2] === 'baya') {
        const leaf = this.leafTex || (this.leafTex = (() => { const tt = this.tex(this.crop(Obj.get('cutbush', 0, 0), 3, 3, 10, 10), true); tt.shared = true; return tt; })());
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), new THREE.MeshLambertMaterial({ map: leaf, flatShading: true })); b.position.y = 0.38; b.scale.y = 0.85; b.castShadow = b.receiveShadow = true; g.add(b);
        for (let i = 0; i < 9; i++) { const a = i * 2.4, e = 0.4 + (i % 3) * 0.35; const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), this.mat(i % 3 ? '#e03050' : '#f070a0')); s.position.set(Math.cos(a) * Math.sin(e) * 0.42, 0.38 + Math.cos(e) * 0.36, Math.sin(a) * Math.sin(e) * 0.42); extra.add(s); }
      } else if (n[2] === 'mineral') {
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), this.mat('#7a7088', { flatShading: true })); r.position.y = 0.22; r.scale.y = 0.65; r.castShadow = r.receiveShadow = true; g.add(r);
        const cm = this.mat('#a0f0ff', { emissive: '#40c0e0', emissiveIntensity: 0.5, flatShading: true });
        for (const [ox, oz, h, tilt] of [[-0.12, 0, 0.5, -0.3], [0.08, -0.05, 0.62, 0.15], [0.2, 0.1, 0.4, 0.45]]) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), cm); c.scale.y = h * 4; c.position.set(ox, 0.42 + h * 0.2, oz); c.rotation.z = tilt; c.castShadow = true; extra.add(c); }
      } else {
        for (const [ox, oz, s] of [[-0.18, 0.05, 1], [0.12, -0.1, 1.25], [0.22, 0.2, 0.8]]) {
          const st = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.06 * s, 0.22 * s, 6), this.mat('#e8dcc0')); st.position.set(ox, 0.11 * s, oz); g.add(st);
          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16 * s, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), this.mat('#b07040')); cap.position.set(ox, 0.2 * s, oz); cap.castShadow = true; extra.add(cap);
          const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03 * s, 4, 3), this.mat('#f0e0c0')); dot.position.set(ox + 0.05 * s, 0.31 * s, oz + 0.06 * s); extra.add(dot);
        }
      }
      this.gather.push({ n, extra });
    }
  };
  const _render = World3D.render;
  World3D.render = function (world) {
    for (const q of this.gather || []) q.extra.visible = Gather.ready(q.n);
    return _render.call(this, world);
  };
  // en 3D no se pinta su dibujo plano sobre el suelo
  const _draw = Gather.draw;
  Gather.draw = function (ctx, cx, cy) { if (World3D.usable(World)) return; return _draw.call(this, ctx, cx, cy); };
}
