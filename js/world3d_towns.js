'use strict';
// ============================================================
//  MUNDO 3D: IDENTIDAD DE CADA CIUDAD
//  - Puerto Marea: barcas que se mecen en el mar y gaviotas.
//  - Ciudad Brasa: la lava brilla y suelta brasas; luz rojiza.
//  - Pico Céfiro: molinos de viento en los riscos.
//  - Villa Musgo: setas gigantes que brillan y esporas flotantes.
//  - Ciudad Roca: vagonetas de mina y faroles en los riscos.
//  - Ciudad Aurora: grandes cristales violetas con luz propia.
//  Todo se coloca sobre casillas que ya no se pueden pisar (agua,
//  lava, riscos, árboles), así que no cambia el recorrido.
// ============================================================
{
  const M = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  // casillas de un tipo, con al menos una casilla pisable al lado y separadas entre sí
  const pick = (world, test, n, gap, near = true) => {
    const m = world.map, out = [];
    const walk = (x, y) => { const d = world.tileAt(x, y); return d && !d.solid && !d.water; };
    const cand = [];
    for (let ty = 0; ty < m.h - 2; ty++) for (let tx = 0; tx < m.w; tx++) {
      const d = world.tileAt(tx, ty); if (!d || !test(d, tx, ty)) continue;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => walk(tx + dx, ty + dy));
      if (near && !nb) continue;
      cand.push([tx, ty, hash2(tx * 13, ty * 7), nb || [0, 0]]);
    }
    cand.sort((a, b) => a[2] - b[2]);
    for (const [x, y, , nb] of cand) { if (out.length >= n) break; if (out.every(([ox, oy]) => Math.abs(ox - x) + Math.abs(oy - y) >= gap)) out.push([x, y, nb[0] * 0.4, nb[1] * 0.4]); }
    return out;
  };
  // quita el árbol (instanciado) de una casilla para poner otra cosa en su lugar
  const removeTree = (W3D, tx, ty) => {
    for (const T of W3D.trees || []) if (Math.floor(T.x) === tx && Math.floor(T.z) === ty && T.inst) { T.inst.setMatrixAt(T.i, new THREE.Matrix4().makeScale(0, 0, 0)); T.inst.instanceMatrix.needsUpdate = true; T.matrix = new THREE.Matrix4().makeScale(0, 0, 0); }
  };
  const BUILD = {
    puerto_marea(world) {
      const deep = (d, x, y) => d.water && [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, -1]].every(([dx, dy]) => { const e = world.tileAt(x + dx, y + dy); return e && e.water; });
      for (const [tx, ty] of pick(world, deep, 3, 6, false)) {
        const g = new THREE.Group(); g.position.set(tx + 0.5, 0.05, ty + 0.5); g.rotation.y = hash2(tx, ty) * 6;
        // casco: caja de madera con proa en punta, franja pintada y bancos
        const hull = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.32, 0.62), M('#8a5030')); hull.position.y = 0.12; g.add(hull);
        const bow = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.44, 0.32, 3), M('#8a5030', { flatShading: true })); bow.rotation.set(0, 0, -Math.PI / 2); bow.scale.set(1, 1, 0.82); bow.position.set(0.86, 0.12, 0); g.add(bow);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.07, 0.64), M(['#e8e0d0', '#d84848', '#4878c8'][Math.floor(hash2(tx, ty) * 3)])); stripe.position.y = 0.22; g.add(stripe);
        const inner = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.52), M('#5a3420')); inner.position.y = 0.27; g.add(inner);
        for (const bx of [-0.35, 0.25]) { const seat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.54), M('#a87048')); seat.position.set(bx, 0.31, 0); g.add(seat); }
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 5), M('#6a4428')); mast.position.y = 0.9; g.add(mast);
        const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.9), M(['#f4f0e8', '#e05050', '#5080d0'][Math.floor(hash2(ty, tx) * 3)], { side: THREE.DoubleSide })); sail.position.set(0.36, 1.05, 0); sail.rotation.y = Math.PI / 2; g.add(sail);
        g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        this.root.add(g); this.town.push({ k: 'boat', g, ph: hash2(tx, ty) * 6 });
      }
      for (let i = 0; i < 4; i++) {
        const b = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.18), new THREE.MeshBasicMaterial({ color: '#f8f8f8', side: THREE.DoubleSide })); this.root.add(b);
        this.town.push({ k: 'gull', g: b, ph: i * 1.6, cx: world.map.w - 6, cz: 10 + i * 3 });
      }
    },
    ciudad_brasa(world) {
      const lava = pick(world, (d) => d.t === 'lava', 40, 1, false);
      for (const [tx, ty] of lava) {
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ff6020', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
        glow.rotation.x = -Math.PI / 2; glow.position.set(tx + 0.5, 0.04, ty + 0.5); this.root.add(glow); this.town.push({ k: 'lava', g: glow, ph: hash2(tx, ty) * 6, x: tx + 0.5, z: ty + 0.5 });
      }
    },
    pico_cefiro(world) {
      for (const [tx, ty, sx, sz] of pick(world, (d) => d.t === 'cliff', 3, 7)) {
        const g = new THREE.Group(); g.position.set(tx + 0.5 + sx, 0.95, ty + 0.5 + sz);
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 1.6, 8), M('#e8dcc8', { flatShading: true })); tower.position.y = 0.8; g.add(tower);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.45, 8), M('#b04a3a', { flatShading: true })); roof.position.y = 1.82; g.add(roof);
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.36, 0.05), M('#6a4428')); door.position.set(0, 0.18, 0.4); g.add(door);
        const hub = new THREE.Group(); hub.position.set(0, 1.45, 0.42); g.add(hub);
        for (let k = 0; k < 4; k++) { const arm = new THREE.Group(); arm.rotation.z = (k * Math.PI) / 2; const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.95, 0.02), M('#f4ecd8')); blade.position.y = 0.55; arm.add(blade); const spar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.0, 0.04), M('#6a4428')); spar.position.y = 0.5; arm.add(spar); hub.add(arm); }
        g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        this.root.add(g); this.town.push({ k: 'mill', g: hub, ph: hash2(tx, ty) * 6 });
      }
    },
    villa_musgo(world) {
      for (const [tx, ty, sx, sz] of pick(world, (d) => d.canopy, 4, 6)) {
        removeTree(this, tx, ty);
        const g = new THREE.Group(); g.position.set(tx + 0.5 + sx, 0, ty + 0.75 + sz); const s = 1.1 + hash2(tx, ty) * 0.4;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.22 * s, 1.1 * s, 8), M('#f0e4c8')); stem.position.y = 0.55 * s; g.add(stem);
        const capM = M(['#d04848', '#9050d0', '#e0a030'][Math.floor(hash2(ty, tx) * 3)], { emissive: '#402010', emissiveIntensity: 0.4 });
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.62 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), capM); cap.position.y = 1.05 * s; g.add(cap);
        for (let k = 0; k < 6; k++) { const a = k * 1.05; const d = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff4d0' })); d.position.set(Math.cos(a) * 0.4 * s, 1.05 * s + 0.3 * s, Math.sin(a) * 0.4 * s); g.add(d); }
        g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        this.root.add(g); this.town.push({ k: 'shroom', g, cap: capM, ph: hash2(tx, ty) * 6 });
      }
    },
    ciudad_roca(world) {
      for (const [tx, ty] of pick(world, (d) => d.t === 'cliff' || d.t === 'rock', 3, 6)) {
        const g = new THREE.Group(); g.position.set(tx + 0.5, (world.tileAt(tx, ty).t === 'cliff' ? 0.95 : 0.4), ty + 0.5);
        const cart = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.36, 0.5), M('#6a6470', { flatShading: true })); cart.position.y = 0.3; g.add(cart);
        const ore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), M('#9a8a70', { flatShading: true })); ore.position.y = 0.52; ore.scale.y = 0.6; g.add(ore);
        for (const [sx, sz] of [[-0.25, 0.27], [0.25, 0.27], [-0.25, -0.27], [0.25, -0.27]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8), M('#2a2830')); w.rotation.x = Math.PI / 2; w.position.set(sx, 0.1, sz); g.add(w); }
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5), M('#5a3a20')); post.position.set(0.5, 0.45, -0.3); g.add(post);
        const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.14), new THREE.MeshLambertMaterial({ color: '#ffe0a0', emissive: '#ffb040', emissiveIntensity: 0.8 })); lantern.position.set(0.5, 0.95, -0.3); g.add(lantern);
        g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        this.root.add(g); this.lamps.push({ x: tx + 1, z: ty + 0.2, glassM: lantern.material });
      }
    },
    ciudad_aurora(world) {
      for (const [tx, ty, sx, sz] of pick(world, (d) => d.canopy || d.t === 'cliff', 5, 5)) {
        if (world.tileAt(tx, ty).canopy) removeTree(this, tx, ty);
        const g = new THREE.Group(); g.position.set(tx + 0.5 + sx, world.tileAt(tx, ty).t === 'cliff' ? 0.95 : 0, ty + 0.6 + sz);
        const cm = new THREE.MeshLambertMaterial({ color: '#c8a0ff', emissive: '#9050ff', emissiveIntensity: 0.6, transparent: true, opacity: 0.9, flatShading: true });
        for (const [ox, oz, h, tilt] of [[0, 0, 1.6, 0], [-0.25, 0.1, 1.0, -0.35], [0.28, -0.05, 1.15, 0.3]]) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), cm); c.scale.y = h * 2.2; c.position.set(ox, h * 0.45, oz); c.rotation.z = tilt; c.castShadow = true; g.add(c); }
        this.root.add(g); this.town.push({ k: 'crystal', g, cm, ph: hash2(tx, ty) * 6 });
        this.lamps.push({ x: tx + 0.5, z: ty + 1, glassM: cm });
      }
    },
  };
  const _build = World3D.build;
  World3D.build = function (world) {
    _build.call(this, world);
    this.town = [];
    const f = this.mode === 'out' && BUILD[world.map.id];
    if (f) f.call(this, world);
    // brasas que suben de la lava (Ciudad Brasa)
    this.embers = null;
    const lava = this.town.filter((o) => o.k === 'lava');
    if (lava.length) {
      const n = 160, pos = new Float32Array(n * 3), base = [];
      for (let i = 0; i < n; i++) { const L = lava[i % lava.length]; base.push([L.x + Math.random() - 0.5, L.z + Math.random() - 0.5, Math.random() * 3]); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.embers = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffa040', size: 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      this.embers.base = base; this.root.add(this.embers);
    }
  };
  const _render = World3D.render;
  World3D.render = function (world) {
    const t = Engine.time;
    for (const o of this.town || []) {
      if (o.k === 'boat') { o.g.position.y = 0.05 + Math.sin(t * 1.3 + o.ph) * 0.05; o.g.rotation.z = Math.sin(t * 1.1 + o.ph) * 0.06; o.g.rotation.x = Math.sin(t * 0.9 + o.ph) * 0.04; }
      else if (o.k === 'gull') { const a = t * 0.5 + o.ph; o.g.position.set(o.cx + Math.cos(a) * 4, 3.2 + Math.sin(t + o.ph) * 0.3, o.cz + Math.sin(a) * 2.5); o.g.lookAt(this.cam.position); o.g.scale.y = 0.4 + 0.6 * Math.abs(Math.sin(t * 6 + o.ph)); }
      else if (o.k === 'lava') o.g.material.opacity = 0.25 + 0.15 * Math.sin(t * 2 + o.ph);
      else if (o.k === 'mill') o.g.rotation.z = t * 0.9 + o.ph;
      else if (o.k === 'shroom') o.cap.emissiveIntensity = 0.3 + 0.25 * Math.sin(t * 1.5 + o.ph) + (this.night || 0) * 0.6;
      else if (o.k === 'crystal') { o.cm.emissiveIntensity = 0.5 + 0.3 * Math.sin(t * 2 + o.ph) + (this.night || 0) * 0.8; o.g.rotation.y = Math.sin(t * 0.3 + o.ph) * 0.1; }
    }
    if (this.embers) {
      const p = this.embers.geometry.attributes.position, b = this.embers.base;
      for (let i = 0; i < b.length; i++) { const k = (b[i][2] + t * 0.5) % 3; p.array[i * 3] = b[i][0] + Math.sin(t * 2 + i) * 0.15; p.array[i * 3 + 1] = k; p.array[i * 3 + 2] = b[i][1]; }
      p.needsUpdate = true;
    }
    return _render.call(this, world);
  };
}
