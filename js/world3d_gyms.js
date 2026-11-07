'use strict';
// ============================================================
//  MUNDO 3D: GIMNASIOS CON TEMA PROPIO
//  Cada gimnasio se viste según su tipo, sin cambiar el recorrido
//  (todo va sobre las paredes laterales o en la pared del fondo):
//  - Musgo: macetas con helechos y enredaderas.   - Roca: peñascos y cristales.
//  - Marea: fuentes de agua azul que brillan.     - Brasa: braseros con fuego.
//  - Céfiro: molinillos que giran con el viento.  - Aurora: cristales que flotan.
//  Además, estandartes del color del gimnasio en la pared del fondo y
//  un tinte del suelo a juego.
// ============================================================
{
  const THEME = {
    gym1: { col: '#5aa040', floor: 'rgba(60,140,50,0.10)', prop: 'planta' },
    gym2: { col: '#a08060', floor: 'rgba(120,100,80,0.10)', prop: 'roca' },
    gym3: { col: '#3a90d0', floor: 'rgba(40,120,200,0.10)', prop: 'fuente' },
    gym4: { col: '#e05a2a', floor: 'rgba(200,70,30,0.10)', prop: 'brasero' },
    gym5: { col: '#7ac0e0', floor: 'rgba(200,230,250,0.10)', prop: 'molino' },
    gym6: { col: '#9a6ad8', floor: 'rgba(140,90,210,0.12)', prop: 'cristal' },
    // la torre del final: oscura, paredes moradas, cristales negros y el eclipse en la pared del fondo
    torre_eclipse: { col: '#5a2a90', floor: 'rgba(16,0,36,0.5)', prop: 'cristal', walls: '#6a5888', crys: ['#5a3a8a', '#9a40ff'], eclipse: true },
  };
  // casas: cada una con su papel tapiz y su piso (mismo dibujo, otro tono)
  const HOUSE_WALL = ['#f0b48c', '#a8c4ee', '#b4dc9c', '#d4b0ec', '#f6dc88', '#eea4ac'];
  const HOUSE_FLOOR = [null, 'rgba(50,20,5,0.38)', 'rgba(255,235,200,0.3)', 'rgba(140,60,40,0.3)', 'rgba(30,15,5,0.5)'];
  const houseIdx = (id, n, k) => { let h = 5381 + k * 977; for (let i = 0; i < id.length; i++) h = ((h * 33) ^ id.charCodeAt(i)) >>> 0; return h % n; };
  const isHouse = (id) => /^casa_/.test(id) && id !== 'casa_jugador';
  const _floor = World3D.interiorFloor;
  World3D.interiorFloor = function (world, gx) {
    const r = _floor.apply(this, arguments);
    const id = world.map.id, fl = isHouse(id) && HOUSE_FLOOR[houseIdx(id, HOUSE_FLOOR.length, 1)];
    if (fl) { const m = world.map; gx.fillStyle = fl; for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) { const t = (TILEDEF[m.rows[ty][tx]] || {}).t; if (t === 'floor' || t === 'tilefloor') gx.fillRect(tx * 16, ty * 16, 16, 16); } }
    const th = THEME[world.map.id];
    if (th) {
      const m = world.map; gx.fillStyle = th.floor;
      for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) if (!this.isWallT((TILEDEF[m.rows[ty][tx]] || {}).t)) gx.fillRect(tx * 16, ty * 16, 16, 16);
    }
    return r;
  };
  const _build = World3D.build;
  World3D.build = function (world) {
    const r = _build.apply(this, arguments);
    this.gymFx = [];
    if (this.mode === 'in' && isHouse(world.map.id)) {
      const tint = new THREE.Color(HOUSE_WALL[houseIdx(world.map.id, HOUSE_WALL.length, 2)]);
      const seen = new Set(); // hay materiales compartidos entre paredes: se tiñen una sola vez
      for (const B of this.buildings) for (const mt of B.mats || []) if (mt.color && !seen.has(mt)) { seen.add(mt); mt.color.multiply(tint); }
      this.root.traverse((o) => { if (o.userData.sideWall && !seen.has(o.material)) { seen.add(o.material); o.material.color.multiply(tint); } });
    }
    const th = this.mode === 'in' && THEME[world.map.id];
    if (!th) return r;
    if (th.walls) { const tint = new THREE.Color(th.walls), seen = new Set(); for (const B of this.buildings) for (const mt of B.mats || []) if (mt.color && !seen.has(mt)) { seen.add(mt); mt.color.multiply(tint); } }
    try { this.buildGymTheme(world, th); } catch (e) { console.error(e); }
    return r;
  };
  World3D.buildGymTheme = function (world, th) {
    const m = world.map, M = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c, flatShading: true }, o));
    const isZ = (x, y) => (TILEDEF[(m.rows[y] || '')[x]] || {}).t === 'gymwall';
    // estandartes en la pared del fondo (a los lados del líder)
    const banner = M(th.col), trim = M('#d8b050'), pole = M('#4a3a30');
    for (const bx of [3, m.w - 4]) {
      if (!isZ(bx, 0)) continue;
      const g = new THREE.Group(); g.position.set(bx + 0.5, 0, 1.03);
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.1), banner); cloth.position.y = 1.55; g.add(cloth);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.31, 0.22, 3), banner); tip.rotation.z = Math.PI; tip.scale.z = 0.05; tip.position.y = 0.9; g.add(tip);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.05), pole); bar.position.y = 2.12; g.add(bar);
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.01), trim); band.position.set(0, 1.85, 0.01); g.add(band);
      const em = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12), trim); em.position.set(0, 1.5, 0.012); g.add(em);
      this.root.add(g);
    }
    // adornos sobre las paredes laterales, cada 3 casillas
    for (let ty = 2; ty < m.h - 1; ty += 3) for (const tx of [0, m.w - 1]) {
      if (!isZ(tx, ty)) continue;
      const g = new THREE.Group(); g.position.set(tx + 0.5, 1.0, ty + 0.5);
      const k = th.prop, ph = hash2(tx, ty) * 6;
      if (k === 'planta') {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.3, 8), M('#b0603a')); pot.position.y = 0.15; g.add(pot);
        for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.5, 4), M(i % 2 ? '#4a9a3a' : '#6ab848')); const a = i * 1.05; l.position.set(Math.cos(a) * 0.1, 0.5, Math.sin(a) * 0.1); l.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(l); }
        // enredadera que cuelga por la pared
        const vine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.06), M('#3a7a30')); vine.position.set(tx ? -0.52 : 0.52, -0.35, 0.1); g.add(vine);
      } else if (k === 'roca') {
        const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), M('#8a7a6a')); b.position.y = 0.22; b.rotation.set(ph, ph * 2, 0); g.add(b);
        for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.1 + i * 0.03, 0), M('#c8a0e8', { emissive: '#7a4ab0', emissiveIntensity: 0.5 })); c.position.set(-0.15 + i * 0.15, 0.42 + i * 0.05, 0.12); c.scale.y = 1.8; g.add(c); }
      } else if (k === 'fuente') {
        const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.2, 10), M('#a8b8c8')); basin.position.y = 0.1; g.add(basin);
        const water = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.02, 10), new THREE.MeshBasicMaterial({ color: '#60c8ff', transparent: true, opacity: 0.85 })); water.position.y = 0.21; g.add(water);
        const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.5, 6), new THREE.MeshBasicMaterial({ color: '#b8ecff', transparent: true, opacity: 0.7 })); jet.position.y = 0.45; g.add(jet);
        this.gymFx.push({ k, o: jet, ph });
      } else if (k === 'brasero') {
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.12, 0.2, 8), M('#3a3034')); bowl.position.y = 0.3; g.add(bowl);
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.22, 6), M('#2a2024')); leg.position.y = 0.1; g.add(leg);
        const flames = [];
        for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.09 + (i === 1 ? 0.04 : 0), 0.38, 6), new THREE.MeshBasicMaterial({ color: i === 1 ? '#ffe070' : '#ff7030' })); f.position.set(-0.1 + i * 0.1, 0.55, 0); g.add(f); flames.push(f); }
        this.gymFx.push({ k, flames, ph });
      } else if (k === 'molino') {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), M('#e8e0d0')); post.position.y = 0.3; g.add(post);
        const rotor = new THREE.Group(); rotor.position.set(0, 0.62, 0.05);
        for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.3), M(i % 2 ? '#7ac0e0' : '#f0f4f8', { side: THREE.DoubleSide })); b.position.set(Math.cos(i * Math.PI / 2) * 0.15, Math.sin(i * Math.PI / 2) * 0.15, 0); b.rotation.z = i * Math.PI / 2 - Math.PI / 2; rotor.add(b); }
        g.add(rotor); this.gymFx.push({ k, o: rotor, ph });
      } else if (k === 'cristal') {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.14, 6), M('#4a3a6a')); base.position.y = 0.07; g.add(base);
        const cc = th.crys || ['#d0b0ff', '#9a6ad8'], c = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), M(cc[0], { emissive: cc[1], emissiveIntensity: 0.8 })); c.scale.y = 1.7; c.position.y = 0.6; g.add(c);
        this.gymFx.push({ k, o: c, ph });
      }
      this.root.add(g);
    }
    // el eclipse: disco negro con corona morada que late, en lo alto de la pared del fondo
    if (th.eclipse) {
      const g = new THREE.Group(); g.position.set(m.w / 2, 1.62, 1.05);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshBasicMaterial({ color: '#08040e' })); disc.position.z = 0.02; g.add(disc);
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.78, 40), new THREE.MeshBasicMaterial({ color: '#b060ff', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.z = 0.01; g.add(halo);
      const rim = new THREE.Mesh(new THREE.RingGeometry(0.49, 0.53, 40), new THREE.MeshBasicMaterial({ color: '#ffe8ff' })); rim.position.z = 0.025; g.add(rim);
      this.root.add(g); this.gymFx.push({ k: 'eclipse', o: halo, ph: 0 });
    }
    // lo que se mueve no se junta con lo quieto (ver world3d_batch.js)
    for (const F of this.gymFx) for (const o of F.flames || [F.o]) o.traverse((c) => { c.userData.keep = true; });
  };
  // movimiento de los adornos (fuego, agua, molinillos, cristales)
  const _light = World3D.syncLightInside;
  World3D.syncLightInside = function (world) {
    const r = _light.apply(this, arguments), t = Engine.time;
    for (const F of this.gymFx || []) {
      if (F.k === 'brasero') F.flames.forEach((f, i) => { f.scale.y = 0.75 + 0.4 * Math.abs(Math.sin(t * (7 + i * 2) + F.ph + i)); });
      else if (F.k === 'fuente') F.o.scale.y = 0.85 + 0.2 * Math.sin(t * 6 + F.ph);
      else if (F.k === 'molino') F.o.rotation.z = t * 2.5 + F.ph;
      else if (F.k === 'eclipse') { const k = 1 + 0.08 * Math.sin(t * 1.8); F.o.scale.set(k, k, 1); F.o.material.opacity = 0.6 + 0.3 * Math.sin(t * 1.8); }
      else if (F.k === 'cristal') { F.o.position.y = 0.6 + Math.sin(t * 1.6 + F.ph) * 0.08; F.o.rotation.y = t * 0.8 + F.ph; }
    }
    return r;
  };
}
