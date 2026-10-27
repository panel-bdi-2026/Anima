'use strict';
// ============================================================
//  PANTALLA DE TÍTULO EN 3D — "Atardecer sobre la Región Alba"
//  - El protagonista y su ánima, de espaldas en lo alto de un
//    acantilado, miran el valle al atardecer.
//  - Abajo: el pueblo con sus casas (las mismas del juego) y las
//    ventanas encendidas, un río que refleja el sol, bosques, un faro
//    en la costa y el mar.
//  - Al fondo: cordilleras nevadas, un volcán humeante y la Torre
//    Eclipse. Cielo con sol, haces de luz, nubes y primeras estrellas.
//  - Un ánima legendaria cruza el cielo de vez en cuando; pétalos y
//    luciérnagas flotan delante de la cámara.
//  - Entrada de cámara cinematográfica: baja desde el cielo.
// ============================================================
const Title3D = {
  built: false,
  SUN: [10, 7, -95],
  build() {
    if (this.built) return true;
    if (!World3D.init()) return false;
    const S = (this.scene = new THREE.Scene()), W3D = World3D;
    const tex = (c, rep) => W3D.tex(c, rep);
    const M = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
    S.fog = new THREE.Fog('#e88a70', 70, 240);
    // ---------- cielo ----------
    this.skyU = { t: { value: 0 }, sun: { value: new THREE.Vector3(...this.SUN).normalize() } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(190, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.skyU,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `varying vec3 vP; uniform float t; uniform vec3 sun;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
        void main(){
          vec3 d = normalize(vP); float h = d.y;
          vec3 c = mix(vec3(1.0,0.56,0.28), vec3(0.92,0.34,0.4), smoothstep(-0.02, 0.12, h));
          c = mix(c, vec3(0.36,0.16,0.42), smoothstep(0.1, 0.34, h));
          c = mix(c, vec3(0.08,0.07,0.22), smoothstep(0.3, 0.75, h));
          float s = max(dot(d, sun), 0.);
          c += vec3(1.0,0.85,0.55) * pow(s, 900.) * 6. + vec3(1.0,0.7,0.4) * pow(s, 40.) * 0.55 + vec3(1.0,0.5,0.35) * pow(s, 6.) * 0.25;
          // nubes altas en bandas, iluminadas desde abajo por el sol
          vec2 uv = d.xz / max(h + 0.12, 0.05) * 1.6 + vec2(t * 0.01, 0.);
          float cl = smoothstep(0.55, 0.85, n2(uv * 1.3) * 0.6 + n2(uv * 3.1) * 0.4) * smoothstep(0.02, 0.18, h) * (1. - smoothstep(0.35, 0.6, h));
          c = mix(c, mix(vec3(1.0,0.55,0.45), vec3(1.0,0.82,0.6), pow(s, 3.)), cl * 0.75);
          // estrellas
          vec2 st = floor(d.xz / (h + 0.4) * 180.);
          float star = step(0.9975, h21(st)) * smoothstep(0.35, 0.8, h) * (0.6 + 0.4 * sin(t * 3. + h21(st + 3.) * 30.));
          c += vec3(star);
          gl_FragColor = vec4(c, 1.); }`,
    }));
    S.add(sky);
    // ---------- luces ----------
    const sun = new THREE.DirectionalLight('#ffc890', 2.4); sun.position.set(6, 9, -20); sun.target.position.set(0, 0, 4); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 60 }); sun.shadow.bias = -0.001;
    S.add(sun, sun.target);
    S.add(new THREE.HemisphereLight('#b090e0', '#5a3030', 1.0));
    const fill = new THREE.DirectionalLight('#7080ff', 0.5); fill.position.set(-8, 6, 12); S.add(fill);
    // ---------- acantilado en primer plano ----------
    const [gc, gx] = U.makeCanvas(64, 64);
    for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) gx.drawImage(Tiles.get('grass', 0, ((x + y) / 16) % 3), x, y);
    const grassT = tex(gc, true); grassT.repeat.set(7, 3);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), M('#ffffff', { map: grassT })); top.rotation.x = -Math.PI / 2; top.position.set(-3, 0, 8); top.receiveShadow = true; S.add(top);
    const [rc, rx] = U.makeCanvas(32, 32); rx.fillStyle = '#6a4a40'; rx.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 120; i++) { rx.fillStyle = Math.random() < 0.5 ? '#4a3430' : '#8a6a58'; rx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 1 + Math.floor(Math.random() * 3), 1); }
    for (let y = 5; y < 32; y += 8) { rx.fillStyle = '#3a2824'; rx.fillRect(0, y, 32, 1); }
    const rockT = tex(rc, true); rockT.repeat.set(10, 3);
    // borde irregular del acantilado
    const edge = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 1.2, 30, 1, 1), M('#ffffff', { map: rockT, flatShading: true }));
    { const p = edge.geometry.attributes.position; for (let i = 0; i < p.count; i++) if (p.getZ(i) > 0) p.setZ(i, p.getZ(i) + (hash2(Math.round(p.getX(i) * 3), 7) - 0.5) * 0.8); edge.geometry.computeVertexNormals(); }
    edge.position.set(-3, -4, 1.6); edge.receiveShadow = true; S.add(edge);
    for (let i = 0; i < 9; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + hash2(i, 3) * 0.6, 0), M('#7a5a4a', { flatShading: true })); r.position.set(-14 + i * 3.2 + hash2(i, 9) * 1.5, -0.1, 2.3 + hash2(i, 5) * 0.6); r.scale.y = 0.6; r.castShadow = r.receiveShadow = true; S.add(r); }
    // matas de hierba en el borde, mecidas por el viento
    this.windU = { value: 0 };
    // pradera densa de matas en abanico, siempre de frente a la cámara (con profundidad, nunca de canto)
    const gcols = ['#2e6e2c', '#4aa43c', '#76cc4c', '#d0f488'];
    const gg = new THREE.PlaneGeometry(0.8, 0.85); gg.translate(0, 0.4, 0);
    const o = new THREE.Object3D(), tint = new THREE.Color();
    for (let v = 0; v < 3; v++) {
      const gm = new THREE.MeshLambertMaterial({ map: W3D.grassClump(gcols, v), alphaTest: 0.5, side: THREE.DoubleSide });
      gm.onBeforeCompile = (sh) => { sh.uniforms.uWind = this.windU; sh.vertexShader = 'uniform float uWind;' + String.fromCharCode(10) + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + String.fromCharCode(10) + '#ifdef USE_INSTANCING' + String.fromCharCode(10) + 'transformed.x += sin(uWind * 1.8 + instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 1.3) * 0.07 * max(position.y, 0.0);' + String.fromCharCode(10) + '#endif'); };
      const N = 900, grass = new THREE.InstancedMesh(gg, gm, N);
      for (let i = 0; i < N; i++) {
        // más densa cerca del borde y de la cámara, sin tapar del todo a los personajes
        const x = -16 + Math.random() * 32, z = 2.1 + Math.pow(Math.random(), 1.3) * 9.5;
        const dh = Math.min(Math.hypot(x + 2.4, z - 3.4), Math.hypot(x + 1.2, z - 3.2)); if (dh < 0.7) { o.scale.setScalar(0); o.updateMatrix(); grass.setMatrixAt(i, o.matrix); continue; }
        const near = dh < 1.6;
        o.position.set(x, 0, z); o.rotation.set(-0.12, Math.atan2(0.6 - x, 10.5 - z) + (Math.random() - 0.5) * 0.4, 0);
        const sc = (near ? 0.3 : 0.45) + Math.random() * 0.35 + (z > 7 ? 0.25 : 0); o.scale.set(sc * (0.9 + Math.random() * 0.4), sc, sc); o.updateMatrix(); grass.setMatrixAt(i, o.matrix);
        const l = 0.82 + Math.random() * 0.3; tint.setRGB(l * 1.02, l, l * 0.85); grass.setColorAt(i, tint);
      }
      grass.castShadow = true; S.add(grass);
    }
    // flores
    const fcols = ['#ff6a8a', '#ffe060', '#ffffff', '#b090ff', '#ff9a40'];
    for (let i = 0; i < 70; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), M(fcols[i % 5], { emissive: fcols[i % 5], emissiveIntensity: 0.15 })); f.position.set(-14 + Math.random() * 28, 0.35 + Math.random() * 0.2, 2.6 + Math.random() * 7); S.add(f); }
    // árboles que enmarcan la escena
    const bill = (t, w, h, x, y, z, opts = {}) => {
      const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2 - (opts.foot || 0), 0);
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, color: opts.color || '#ffffff' }));
      m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 });
      m.position.set(x, y, z); m.castShadow = opts.shadow !== false; S.add(m); (this.bills = this.bills || []).push(m); return m;
    };
    bill(W3D.treeTex(2), 6.5, 8.5, -9.5, 0, 5.5, { foot: 0.4, color: '#c8b0c8' });
    bill(W3D.treeTex(5), 5, 6.5, 8.8, 0, 6.5, { foot: 0.3, color: '#c8b0c8' });
    bill(W3D.treeTex(0), 4, 5.2, -6.5, 0, 3.4, { foot: 0.3, color: '#d0b8c8' });
    // protagonista de espaldas y su ánima
    const [pc, px] = U.makeCanvas(32, 48); px.drawImage(HiChar.get(LOOKS.player), 0, 48, 32, 48, 0, 0, 32, 48);
    this.hero = bill(tex(pc), 1.0, 1.5, -2.4, 0, 3.4);
    const lead = ['ignito', 'burbujo', 'semillin'][Math.floor(Math.random() * 3)];
    const [sc] = U.makeCanvas(64, 64); this.petC = sc; this.petT = tex(sc); this.petSp = lead;
    this.pet = bill(this.petT, 2.1, 2.1, -1.2, -0.12, 3.2);
    // ---------- valle ----------
    const vT = tex(gc, true); vT.repeat.set(24, 16);
    const valley = new THREE.Mesh(new THREE.PlaneGeometry(160, 110), M('#d8c8c0', { map: vT })); valley.rotation.x = -Math.PI / 2; valley.position.set(0, -7, -50); valley.receiveShadow = true; S.add(valley);
    // río que serpentea hasta el mar, reflejando el sol
    const rp = [];
    for (let i = 0; i <= 40; i++) { const z = -4 - i * 2.2, x = -6 + Math.sin(i * 0.28) * 6 + i * 0.55; rp.push(new THREE.Vector3(x, -6.95, z)); }
    const curve = new THREE.CatmullRomCurve3(rp), pos = [], idx = [];
    for (let i = 0; i <= 120; i++) { const p = curve.getPoint(i / 120), tg = curve.getTangent(i / 120), nx = -tg.z, nz = tg.x, w = 1.1 + i / 120 * 1.8; pos.push(p.x + nx * w, p.y, p.z + nz * w, p.x - nx * w, p.y, p.z - nz * w); if (i < 120) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setIndex(idx); rg.computeVertexNormals();
    this.river = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: '#ff9a70', side: THREE.DoubleSide, transparent: true, opacity: 0.85 })); S.add(this.river);
    // mar al fondo a la derecha
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), new THREE.MeshBasicMaterial({ color: '#d87870' })); sea.rotation.x = -Math.PI / 2; sea.position.set(70, -7.2, -95); S.add(sea);
    const glint = new THREE.Mesh(new THREE.PlaneGeometry(6, 60), new THREE.MeshBasicMaterial({ color: '#ffe0a0', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    glint.rotation.x = -Math.PI / 2; glint.position.set(14, -7.1, -75); S.add(glint); this.glint = glint;
    // pueblo con las casas del juego
    const village = new THREE.Group(); village.position.set(2, -7, -24); S.add(village);
    const proxy = Object.assign(Object.create(W3D), { root: village, buildings: [], chimney: new Map() });
    const houses = [{ x: 0, y: 0, w: 5, h: 4, style: 'house', door: 2 }, { x: 7, y: -2, w: 5, h: 4, style: 'house2', door: 2 }, { x: -6, y: -5, w: 5, h: 4, style: 'house3', door: 2 }, { x: 3, y: -9, w: 7, h: 5, style: 'center', door: 3 }, { x: 12, y: -8, w: 5, h: 4, style: 'mart', door: 2 }, { x: -3, y: -14, w: 5, h: 4, style: 'house', door: 2 }, { x: 9, y: -15, w: 5, h: 4, style: 'house2', door: 2 }];
    for (const b of houses) proxy.buildBuilding(b);
    for (const B of proxy.buildings) B.faceM.emissiveIntensity = 1.3;
    this.chim = [...proxy.chimney.values()].map(([x, y, z]) => [x + 2, y - 7, z - 24]);
    // faroles del pueblo
    for (let i = 0; i < 6; i++) { const l = new THREE.PointLight('#ffb060', 3, 7, 1.6); l.position.set(-4 + i * 4, -5.6, -26 + (i % 2) * 6); S.add(l); }
    // faro en la costa
    const lh = new THREE.Group(); lh.position.set(26, -7, -48); S.add(lh);
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.85 - i * 0.08, 0.95 - i * 0.08, 1.4, 12), M(i % 2 ? '#d84848' : '#f4f0e8')); m.position.y = 0.7 + i * 1.4; lh.add(m); }
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.7, 10), new THREE.MeshBasicMaterial({ color: '#fff2c0' })); lamp.position.y = 7.4; lh.add(lamp);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(3, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#fff0b0', transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    beam.rotation.z = Math.PI / 2; beam.position.set(15, 0, 0); this.beam = new THREE.Group(); this.beam.position.y = 7.4; this.beam.add(beam); lh.add(this.beam);
    // bosques del valle (instanciados)
    const trees = [];
    for (let i = 0; i < 260; i++) {
      const x = -60 + Math.random() * 100, z = -6 - Math.random() * 70;
      if (x > -10 && x < 22 && z < -14 && z > -44) continue; // pueblo
      const p = curve.getPoint(U.clamp((-4 - z) / 88, 0, 1)); if (Math.abs(p.x - x) < 4) continue; // río
      if (x > 18 && z < -40) continue; // costa
      trees.push([x, z, Math.floor(Math.random() * 7), 1.6 + Math.random() * 1.4]);
    }
    const byV = {};
    for (const T of trees) (byV[T[2]] = byV[T[2]] || []).push(T);
    for (const v in byV) {
      const t = W3D.treeTex(+v), g = new THREE.PlaneGeometry(26 / 16, 34 / 16); g.translate(0, 15 / 16, 0);
      const inst = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, color: '#c8a8b0' }), byV[v].length);
      byV[v].forEach(([x, z, , s], i) => { o.position.set(x, -7, z); o.rotation.set(0, Math.atan2(-x, 12 - z), 0); o.scale.setScalar(s); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); });
      S.add(inst);
    }
    // ---------- montañas, volcán y torre ----------
    const ridge = (n, z, hMin, hMax, col, snow, seed) => {
      for (let i = 0; i < n; i++) {
        const x = -110 + (i / (n - 1)) * 200 + (hash2(i, seed) - 0.5) * 12, hgt = hMin + hash2(seed, i) * (hMax - hMin), r = hgt * (0.9 + hash2(i * 3, seed) * 0.5);
        const m = new THREE.Mesh(new THREE.ConeGeometry(r, hgt, 6 + (i % 3), 1), M(col, { flatShading: true })); m.position.set(x, -7 + hgt / 2, z + (hash2(i, seed * 2) - 0.5) * 10); m.rotation.y = hash2(i, seed) * 3; S.add(m);
        if (snow && hgt > hMin + (hMax - hMin) * 0.35) { const c = new THREE.Mesh(new THREE.ConeGeometry(r * 0.32, hgt * 0.32, 6 + (i % 3), 1), M('#f4e8f0', { flatShading: true })); c.position.set(m.position.x, -7 + hgt * 0.84 + 0.02, m.position.z); c.rotation.y = m.rotation.y; S.add(c); }
      }
    };
    ridge(16, -125, 18, 38, '#5a3a6a', true, 3);
    ridge(14, -92, 10, 22, '#4a3550', true, 7);
    ridge(10, -64, 5, 11, '#3a4a40', false, 11);
    const volc = new THREE.Mesh(new THREE.CylinderGeometry(4, 18, 24, 9, 1), M('#4a3438', { flatShading: true })); volc.position.set(-52, 5, -100); S.add(volc);
    const crater = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.4, 9), new THREE.MeshBasicMaterial({ color: '#ff6020' })); crater.position.set(-52, 17.1, -100); S.add(crater);
    this.smoke = [];
    for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6), new THREE.MeshLambertMaterial({ color: '#7a6070', transparent: true, opacity: 0.4, depthWrite: false })); S.add(s); this.smoke.push({ s, ph: i / 10 }); }
    const tower = new THREE.Group(); tower.position.set(-24, -7, -78); S.add(tower);
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 22, 8), M('#3a2850', { flatShading: true })); tw.position.y = 11; tower.add(tw);
    const sp = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4, 8), M('#2a1a40')); sp.position.y = 24; tower.add(sp);
    this.orb = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshBasicMaterial({ color: '#d080ff' })); this.orb.position.y = 26.6; tower.add(this.orb);
    // ---------- haces de luz del sol ----------
    this.rays = new THREE.Group(); this.rays.position.set(...this.SUN).multiplyScalar(0.6); S.add(this.rays);
    for (let i = 0; i < 9; i++) {
      const g = new THREE.PlaneGeometry(4 + (i % 3) * 3, 120); g.translate(0, -60, 0);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#ffd8a0', transparent: true, opacity: 0.045, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
      m.rotation.z = (i - 4) * 0.13; this.rays.add(m);
    }
    // ---------- nubes bajas ----------
    const [cc, cx] = U.makeCanvas(96, 40);
    for (let i = 0; i < 10; i++) { const x = 12 + i * 7.5, y = 24 - Math.sin(i * 0.7) * 6, r = 9 + (i % 3) * 3; const gr = cx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, 96, 40); }
    const ct = new THREE.CanvasTexture(cc);
    this.clouds = [];
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(34, 14), new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: 0.55, depthWrite: false, color: i % 2 ? '#ffb0a0' : '#ff9a90', fog: false }));
      m.position.set(-90 + i * 24, 14 + (i % 3) * 7, -110 - (i % 2) * 15); S.add(m); this.clouds.push(m);
    }
    // ---------- ánima legendaria que cruza el cielo ----------
    const leg = CreatureGfx.get('marealis', 96), lt = tex(leg);
    this.legend = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: lt, alphaTest: 0.5, side: THREE.DoubleSide, color: '#ffc8d8', fog: false })); S.add(this.legend);
    // pájaros
    this.birds = [];
    for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.25), new THREE.MeshBasicMaterial({ color: '#2a1428', side: THREE.DoubleSide, fog: false })); S.add(b); this.birds.push(b); }
    // ---------- pétalos y luciérnagas delante de la cámara ----------
    const n = 90, ppos = new Float32Array(n * 3), pcol = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { ppos[i * 3] = -12 + Math.random() * 24; ppos[i * 3 + 1] = Math.random() * 6; ppos[i * 3 + 2] = Math.random() * 8 - 2; const c = new THREE.Color(i % 3 ? '#ffd0e0' : '#fff4a0'); pcol.set([c.r, c.g, c.b], i * 3); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(ppos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pcol, 3));
    const [dc, dx] = U.makeCanvas(8, 8); const dg = dx.createRadialGradient(4, 4, 0, 4, 4, 4); dg.addColorStop(0, 'rgba(255,255,255,1)'); dg.addColorStop(1, 'rgba(255,255,255,0)'); dx.fillStyle = dg; dx.fillRect(0, 0, 8, 8);
    this.motes = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.16, map: new THREE.CanvasTexture(dc), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); this.moteBase = ppos.slice(); S.add(this.motes);
    this.cam = new THREE.PerspectiveCamera(42, WIDE / H, 0.1, 400);
    this.built = true;
    return true;
  },
  render(t) {
    if (!this.build()) return false;
    const W3D = World3D;
    this.skyU.t.value = t; this.windU.value = t;
    // cámara: baja desde el cielo y se queda con un leve vaivén
    const k = Math.min(1, t / 4.5), e = 1 - Math.pow(1 - k, 3);
    const cx = 0.6 + Math.sin(t * 0.12) * 0.6, cy = U.lerp(15, 3.3, e) + Math.sin(t * 0.3) * 0.08, cz = U.lerp(16, 10.5, e);
    this.cam.position.set(cx, cy, cz);
    this.cam.lookAt(U.lerp(4, 2.4, e), U.lerp(12, -2.6, e), -30);
    // los planos de primer plano miran a la cámara
    for (const b of this.bills) b.rotation.y = Math.atan2(this.cam.position.x - b.position.x, this.cam.position.z - b.position.z);
    // el ánima respira y mira al valle
    const x = this.petC.getContext('2d'); x.clearRect(0, 0, 64, 64);
    CreatureAnim.draw(x, this.petAnim || (this.petAnim = { animSeed: 2 }), { sp: this.petSp, S: 40, px: 32, py: 60, flip: true, t, dt: 1 / 60, speed: 0 });
    this.petT.needsUpdate = true;
    this.hero.position.y = Math.abs(Math.sin(t * 0.9)) * 0.015;
    // animaciones del paisaje
    this.beam.rotation.y = t * 0.6;
    this.orb.material.color.setHSL(0.8, 0.8, 0.6 + 0.15 * Math.sin(t * 3));
    this.glint.material.opacity = 0.4 + 0.15 * Math.sin(t * 2.3);
    this.river.material.color.setHSL(0.04, 0.85, 0.66 + 0.04 * Math.sin(t * 1.7));
    for (const s of this.smoke) { const q = (s.ph + t * 0.05) % 1; s.s.position.set(-52 + q * 14, 18 + q * 22, -100 + q * 4); s.s.scale.setScalar(0.7 + q * 2.6); s.s.material.opacity = 0.45 * (1 - q) * Math.min(1, q * 5); }
    for (const c of this.clouds) { c.position.x += 0.012; if (c.position.x > 130) c.position.x = -130; c.lookAt(this.cam.position); }
    this.rays.lookAt(this.cam.position); this.rays.children.forEach((r, i) => { r.material.opacity = 0.03 + 0.025 * Math.sin(t * 0.7 + i * 1.3); });
    // ánima legendaria: cruza cada 16 s
    const L = (t % 16) / 16;
    this.legend.visible = t > 5;
    this.legend.position.set(-70 + L * 150, 22 + Math.sin(L * Math.PI) * 10 + Math.sin(t * 2) * 0.6, -70); this.legend.lookAt(this.cam.position);
    this.legend.scale.x = 1;
    // bandada de pájaros
    this.birds.forEach((b, i) => { const q = ((t * 0.04 + i * 0.012) % 1); b.position.set(30 - q * 90 + (i % 3) * 1.5, 10 + Math.sin(q * 6 + i) * 1.5 + (i % 2), -40 + (i % 4)); b.lookAt(this.cam.position); b.scale.y = 0.3 + 0.7 * Math.abs(Math.sin(t * 8 + i)); });
    const p = this.motes.geometry.attributes.position, mb = this.moteBase;
    for (let i = 0; i < p.count; i++) { p.array[i * 3] = mb[i * 3] + Math.sin(t * 0.4 + i) * 0.8 - ((t * 0.3 + i) % 6) + 3; p.array[i * 3 + 1] = mb[i * 3 + 1] + Math.sin(t * 0.7 + i * 1.7) * 0.3; }
    p.needsUpdate = true;
    W3D.fitCanvas();
    const post = W3D.post.uniforms; post.exposure.value = 0.95; post.night.value = 0.4; post.dof.value = 0;
    W3D.r.setRenderTarget(W3D.rt); W3D.r.render(this.scene, this.cam);
    post.tDiffuse.value = W3D.rt.texture;
    W3D.r.setRenderTarget(null); W3D.r.render(W3D.postScene, W3D.postCam);
    post.dof.value = W3D.dofBase !== undefined ? W3D.dofBase : 1;
    W3D.used = true;
    return true;
  },
  // logotipo grande con degradado, contorno y sombra
  logo() {
    if (this.logoC) return this.logoC;
    const txt = 'ÁNIMA', S = 5, w = Font.width(txt) + 2, h = 13;
    const [m, mx] = U.makeCanvas(w, h); Font.draw(mx, txt, 1, 2, '#ffffff');
    const [c, x] = U.makeCanvas(w * S + 16, h * S + 16); x.imageSmoothingEnabled = false;
    // contorno grueso oscuro
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (Math.abs(dx) + Math.abs(dy) <= 3) x.drawImage(m, 8 + dx * 2, 8 + dy * 2 + 4, w * S, h * S);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = '#2a1030'; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-over';
    // relleno con degradado
    const [f, fx] = U.makeCanvas(c.width, c.height); fx.imageSmoothingEnabled = false;
    fx.drawImage(m, 8, 8, w * S, h * S);
    fx.globalCompositeOperation = 'source-in';
    const g = fx.createLinearGradient(0, 8 + 2 * S, 0, 8 + 10 * S);
    g.addColorStop(0, '#fff8c0'); g.addColorStop(0.45, '#ffd048'); g.addColorStop(0.5, '#ffb030'); g.addColorStop(1, '#e06020');
    fx.fillStyle = g; fx.fillRect(0, 0, c.width, c.height);
    // brillo en la parte alta de cada letra
    fx.globalCompositeOperation = 'source-atop'; fx.fillStyle = 'rgba(255,255,255,0.35)'; fx.fillRect(0, 8 + 2 * S, c.width, S);
    x.drawImage(f, 0, 0);
    this.mask = f;
    return (this.logoC = c);
  },
};

// ---------- pantalla de título ----------
{
  const TS = TitleScreen.prototype, _draw = TS.draw;
  TS.wide = true;
  // resplandor dorado detrás del logotipo
  const glowOf = (L) => {
    if (Title3D.glowC) return Title3D.glowC;
    const [c, x] = U.makeCanvas(L.width + 40, L.height + 40);
    x.filter = 'blur(8px)'; x.globalAlpha = 0.9; x.drawImage(Title3D.mask, 20, 20); x.filter = 'none';
    x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ffb040'; x.fillRect(0, 0, c.width, c.height);
    return (Title3D.glowC = c);
  };
  TS.draw = function (ctx) {
    const t = this.t;
    if (Options.gfx3d === false || !Title3D.render(t)) return _draw.call(this, ctx);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, WIDE, H); ctx.restore();
    // franjas de cine durante la entrada de cámara
    const bars = Math.round(Math.max(0, 1 - Math.max(0, t - 3.5) / 1) * 22);
    if (bars > 0) { P(ctx, 0, 0, W, bars, '#05030a'); P(ctx, 0, H - bars, W, bars, '#05030a'); }
    // logotipo: aparece tras la entrada, con resplandor y destello que lo recorre
    const L = Title3D.logo(), lx = Math.round(W / 2 - L.width / 2), k = U.clamp((t - 2.6) / 1.4, 0, 1), e = 1 - Math.pow(1 - k, 3);
    const ly = Math.round(10 + Math.sin(t * 1.3) * 1.5 - (1 - e) * 16);
    if (k > 0) {
      const G = glowOf(L);
      ctx.globalAlpha = e * (0.35 + 0.15 * Math.sin(t * 2)); ctx.drawImage(G, lx - 20, ly - 20); ctx.globalAlpha = e;
      ctx.drawImage(L, lx, ly);
      const sw = ((t * 0.5) % 2.6) * L.width * 1.2 - L.width * 0.3;
      if (!this.shine) { const [c] = U.makeCanvas(L.width, L.height); this.shine = c; }
      const sx = this.shine.getContext('2d'); sx.clearRect(0, 0, L.width, L.height); sx.drawImage(Title3D.mask, 0, 0); sx.globalCompositeOperation = 'source-atop';
      sx.fillStyle = 'rgba(255,255,255,0.8)'; sx.beginPath(); sx.moveTo(sw, 0); sx.lineTo(sw + 10, 0); sx.lineTo(sw - 14, L.height); sx.lineTo(sw - 24, L.height); sx.fill(); sx.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.shine, lx, ly);
      // subtítulo con adornos
      const st = 'R E G I Ó N   A L B A', sy = ly + L.height - 4, sw2 = Font.width(st);
      ctx.globalAlpha = U.clamp((t - 3.4) / 0.8, 0, 1);
      const lx1 = Math.round(W / 2 - sw2 / 2 - 40), lx2 = Math.round(W / 2 + sw2 / 2 + 8);
      for (const xx of [lx1, lx2]) { P(ctx, xx, sy + 4, 32, 1, '#fff0c0'); P(ctx, xx + (xx === lx1 ? 30 : 0), sy + 3, 2, 3, '#ffd048'); }
      Font.drawOutlined(ctx, st, Math.round(W / 2 - sw2 / 2), sy, '#fff4d8', '#3a1030');
      ctx.globalAlpha = 1;
    }
    if (!this.menu) {
      if (t > 4.2) { ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 3.5); const s = 'Pulsa Z o Intro', w = Font.width(s) + 30; P(ctx, Math.round(W / 2 - w / 2), 202, w, 15, '#1a0c24'); P(ctx, Math.round(W / 2 - w / 2), 202, w, 1, '#ffd048'); Font.drawCenter(ctx, s, W / 2, 205, '#fff4d8'); ctx.globalAlpha = 1; }
    } else {
      // menú en la parte inferior derecha, sin tapar al protagonista
      const o = this.options(), bw = 128, bx = W - bw - 18, by0 = H - 26 - o.length * 19;
      P(ctx, bx - 6, by0 - 8, bw + 12, o.length * 19 + 12, 'rgba(12,6,20,0.55)');
      o.forEach((s, i) => {
        const y = by0 + i * 19, sel = i === this.i;
        P(ctx, bx, y, bw, 16, sel ? '#ffd048' : '#1a0c24'); P(ctx, bx + 1, y + 1, bw - 2, 14, sel ? '#4a2060' : '#2a1638');
        if (sel) { P(ctx, bx + 1, y + 1, bw - 2, 1, '#9a6ac0'); UI.cursor(ctx, bx + 6, y + 4, '#ffd048'); }
        Font.drawCenter(ctx, s, bx + bw / 2 + 4, y + 3, sel ? '#ffffff' : '#c8b0e0');
      });
      if (this.sum && o[this.i] === 'CONTINUAR') {
        const x = bx - 118, y = by0;
        P(ctx, x, y, 106, 64, '#1a0c24'); P(ctx, x + 1, y + 1, 104, 62, '#2a1638'); P(ctx, x + 1, y + 1, 104, 1, '#ffd048');
        Font.draw(ctx, this.sum.name, x + 7, y + 6, '#ffffff');
        Font.draw(ctx, '★ ' + this.sum.badges + ' medallas', x + 7, y + 19, '#ffd048');
        Font.draw(ctx, 'Códice: ' + this.sum.dex, x + 7, y + 31, '#d0c0e8'); Font.draw(ctx, Game.timeStr(this.sum.time), x + 7, y + 43, '#d0c0e8');
      }
    }
    if (bars <= 0) { Font.draw(ctx, 'v1.0', 6, 229, '#ffe8d8'); Font.drawRight(ctx, this.menu ? '' : 'Un juego original', W - 6, 229, '#ffe8d8'); }
  };
}
