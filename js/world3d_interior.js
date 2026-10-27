'use strict';
// ============================================================
//  MUNDO 3D: INTERIORES CON MÁS VIDA
//  - Cuadros en la pared del fondo (paisajes de la región y retratos
//    de ánimas), con marco de madera o dorado.
//  - Chimenea encendida en las casas, con fuego animado y luz que
//    parpadea.
//  - Haces de luz que entran por las ventanas durante el día.
// ============================================================
{
  const paintingCache = {};
  // paisaje pintado: cielo, montañas, colinas y un sol o luna
  const landscape = (seed) => {
    if (paintingCache[seed]) return paintingCache[seed];
    let s = seed * 9301 + 49297; const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const [c, x] = U.makeCanvas(24, 16);
    const skies = [['#7ab0e8', '#c8e0f8'], ['#f0a070', '#ffd8a0'], ['#283868', '#6a70b0'], ['#90c8a0', '#e0f0d0']], sk = skies[Math.floor(r() * 4)];
    for (let y = 0; y < 16; y++) { x.fillStyle = U.mix(sk[0], sk[1], y / 10); x.fillRect(0, y, 24, 1); }
    x.fillStyle = sk === skies[2] ? '#f0f0d0' : '#fff4c0'; x.fillRect(4 + Math.floor(r() * 14), 2 + Math.floor(r() * 3), 3, 3);
    const hills = [U.shade('#6a7aa0', -0.1 * r()), '#4a8a50', '#3a6a3a'];
    hills.forEach((col, k) => { x.fillStyle = col; const base = 7 + k * 3, amp = 3 - k, ph = r() * 6; for (let i = 0; i < 24; i++) { const h = base + Math.round(Math.sin(i * 0.4 + ph) * amp); x.fillRect(i, h, 1, 16 - h); } });
    if (r() < 0.5) { x.fillStyle = '#2a5a30'; for (let i = 0; i < 3; i++) { const tx = 2 + Math.floor(r() * 20); x.fillRect(tx, 11, 2, 3); x.fillRect(tx - 1, 9, 4, 2); } }
    return (paintingCache[seed] = c);
  };
  const portrait = (sp) => {
    const k = 'p' + sp; if (paintingCache[k]) return paintingCache[k];
    const [c, x] = U.makeCanvas(18, 22);
    const col = TYPES[SPECIES[sp].types[0]].color;
    for (let y = 0; y < 22; y++) { x.fillStyle = U.mix(U.shade(col, 0.3), U.shade(col, -0.2), y / 22); x.fillRect(0, y, 18, 1); }
    x.drawImage(CreatureGfx.get(sp, 18), 0, 3);
    return (paintingCache[k] = c);
  };

  const _build = World3D.build;
  World3D.build = function (world) {
    _build.call(this, world);
    this.fires = []; this.shafts = [];
    if (this.mode !== 'in') return;
    const m = world.map, T = (x, y) => (TILEDEF[(m.rows[y] || '')[x]] || {}).t;
    const wood = this.mat('#7a5034'), gold = this.mat('#d8a840'), WH = 2.3;
    const gym = /^gym/.test(m.id) || m.id === 'torre_eclipse';
    // columna de la chimenea (para no colgar cuadros encima)
    let fireX = -9;
    if (/^casa_/.test(m.id)) for (const tx of [m.w - 3, 2, Math.floor(m.w / 2)]) if (T(tx, 0) === 'wall' && T(tx, 1) && !(TILEDEF[m.rows[1][tx]] || {}).solid) { fireX = tx; break; }
    // ---- cuadros en la pared del fondo ----
    if (!gym) {
      let last = -9;
      for (let tx = 1; tx < m.w - 1; tx++) {
        if (T(tx, 0) !== 'wall' || tx - last < 3 || Math.abs(tx - fireX) < 2) continue;
        const under = TILEDEF[(m.rows[1] || '')[tx]]; if (under && ['shelf', 'tv', 'pc', 'machine', 'healer'].includes(under.t)) continue;
        last = tx;
        const isP = hash2(tx, m.h) < 0.4, sps = ['ignito', 'burbujo', 'semillin', 'voltin', 'pipio', 'umbrin', 'rabin', 'hongui'];
        const img = isP ? portrait(sps[Math.floor(hash2(tx * 7, m.w * 3) * sps.length)]) : landscape(tx * 31 + m.id.length * 7);
        const w = isP ? 0.62 : 0.86, h = isP ? 0.76 : 0.58, fr = hash2(tx, 9) < 0.5 ? wood : gold;
        const g = new THREE.Group(); g.position.set(tx + 0.5, 1.55, 1.02);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.05), fr); frame.castShadow = true; g.add(frame);
        const t = this.tex(img);
        const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: t })); pic.position.z = 0.03; g.add(pic);
        this.root.add(g);
      }
    }
    // (las lámparas colgantes se quitaron: con la cámara cenital tapaban la sala)
    // ---- chimenea en las casas ----
    if (/^casa_/.test(m.id)) {
      let fx = -1;
      for (const tx of [m.w - 3, 2, Math.floor(m.w / 2)]) if (T(tx, 0) === 'wall' && T(tx, 1) && !(TILEDEF[m.rows[1][tx]] || {}).solid) { fx = tx; break; }
      if (fx >= 0) {
        const stone = new THREE.MeshLambertMaterial({ color: '#8a7a78', flatShading: true }), dark = this.mat('#2a2024');
        const g = new THREE.Group(); g.position.set(fx + 0.5, 0, 1.0);
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.05, 0.4), stone); body.position.set(0, 0.52, 0.12); body.castShadow = true; g.add(body);
        const hole = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.05), dark); hole.position.set(0, 0.3, 0.33); g.add(hole);
        const mantle = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 0.5), wood); mantle.position.set(0, 1.08, 0.15); g.add(mantle);
        const flue = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.3, 0.3), stone); flue.position.set(0, 1.75, 0.05); g.add(flue);
        // fuego: tres llamas que bailan
        const flames = [];
        for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.08 + (i === 1 ? 0.03 : 0), 0.3, 6), new THREE.MeshBasicMaterial({ color: i === 1 ? '#ffe070' : '#ff8030' })); f.position.set(-0.15 + i * 0.15, 0.2, 0.32); g.add(f); flames.push(f); }
        const logs = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6), this.mat('#5a3a20')); logs.rotation.z = Math.PI / 2; logs.position.set(0, 0.08, 0.32); g.add(logs);
        this.root.add(g);
        this.fires.push({ flames, x: fx + 0.5, z: 1.5 });
      }
    }
    // ---- haces de luz por las ventanas ----
    for (let tx = 0; tx < m.w; tx++) if (T(tx, 0) === 'wallwindow') {
      const g = new THREE.PlaneGeometry(0.7, 2.6); g.translate(0, -1.3, 0);
      const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#fff2c8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      mesh.position.set(tx + 0.5, 1.75, 1.02); mesh.rotation.x = -0.75; mesh.renderOrder = 5;
      this.root.add(mesh); this.shafts.push(mesh);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.9), new THREE.MeshBasicMaterial({ color: '#fff0c0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      pool.rotation.x = -Math.PI / 2; pool.position.set(tx + 0.5, 0.02, 2.6); this.root.add(pool); this.shafts.push(pool);
    }
  };
  const _light = World3D.syncLightInside;
  World3D.syncLightInside = function (world) {
    const r = _light.call(this, world);
    const t = Engine.time, night = U.clamp(Clock.light().a / 0.75, 0, 1);
    for (const s of this.shafts || []) s.material.opacity = (1 - night) * (0.07 + 0.015 * Math.sin(t * 0.7 + s.position.x));
    // el fuego de la chimenea parpadea y es una de las luces de la sala
    for (const F of this.fires || []) {
      F.flames.forEach((f, i) => { f.scale.y = 0.8 + 0.35 * Math.abs(Math.sin(t * (7 + i * 2) + i)); f.position.x = -0.15 + i * 0.15 + Math.sin(t * 9 + i) * 0.015; });
      const p = this.pl[this.pl.length - 1];
      p.position.set(F.x, 0.5, F.z); p.color.set('#ff9040'); p.distance = 6; p.intensity = 5 + Math.sin(t * 13) * 1.2 + Math.sin(t * 7.3) * 0.8;
    }
    return r;
  };
}
