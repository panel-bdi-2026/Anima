'use strict';
// ============================================================
//  EFECTOS DE COMBATE EN 3D
//  - Partículas con luz propia según el tipo: brasas y humo (fuego),
//    gotas y salpicaduras (agua), hojas que giran (planta), chispas
//    y relámpagos (eléctrico), esquirlas que caen (roca), remolinos
//    (viento), polvo verde (bicho), humo violeta (sombra), anillos
//    rosados (mente) y estrellas (normal).
//  - Cada proyectil deja una estela y lleva una luz de su color.
//  - Golpes: estallido, onda en el suelo y destello de luz; los
//    críticos y los súper eficaces sacuden más la cámara.
//  - Rayos con un núcleo brillante en 3D.
// ============================================================
const FX3D = {
  N: 1600,
  ready: false,
  init() {
    if (this.ready || typeof World3D === 'undefined' || !World3D.init()) return this.ready;
    const N = this.N;
    this.pos = new Float32Array(N * 3); this.col = new Float32Array(N * 3); this.size = new Float32Array(N); this.alpha = new Float32Array(N);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1)); g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));
    const mk = (blend) => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: blend,
      uniforms: { scale: { value: 300 } },
      vertexShader: 'attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float scale; void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }',
      // partículas cuadradas de borde duro (estilo píxel), con el centro más claro
      fragmentShader: 'varying vec3 vC; varying float vA; void main(){ vec2 q = abs(gl_PointCoord - 0.5); float m = max(q.x, q.y); if (m > 0.5) discard; vec3 c = m < 0.2 ? min(vC * 1.3, vec3(1.)) : m > 0.4 ? vC * 0.7 : vC; gl_FragColor = vec4(c, vA); }',
    });
    this.matAdd = mk(THREE.NormalBlending);
    this.points = new THREE.Points(g, this.matAdd); this.points.frustumCulled = false; this.points.renderOrder = 10;
    // segunda capa (humo y polvo, mezcla normal)
    this.posS = new Float32Array(N * 3); this.colS = new Float32Array(N * 3); this.sizeS = new Float32Array(N); this.alphaS = new Float32Array(N);
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute('position', new THREE.BufferAttribute(this.posS, 3)); g2.setAttribute('color', new THREE.BufferAttribute(this.colS, 3));
    g2.setAttribute('size', new THREE.BufferAttribute(this.sizeS, 1)); g2.setAttribute('alpha', new THREE.BufferAttribute(this.alphaS, 1));
    this.smoke = new THREE.Points(g2, mk(THREE.NormalBlending)); this.smoke.frustumCulled = false; this.smoke.renderOrder = 9;
    this.group = new THREE.Group(); this.group.add(this.points, this.smoke);
    World3D.scene.add(this.group);
    // luces de efectos
    this.lights = [];
    for (let i = 0; i < 5; i++) { const l = new THREE.PointLight('#ffffff', 0, 5, 1.6); World3D.scene.add(l); this.lights.push({ l, t: 0, dur: 0, power: 0 }); }
    this.projLights = [];
    for (let i = 0; i < 3; i++) { const l = new THREE.PointLight('#ffffff', 0, 4, 1.6); World3D.scene.add(l); this.projLights.push(l); }
    // ondas en el suelo y rayos
    this.waves = []; this.beams = [];
    this.next = 0; this.alive = 0;
    this.ready = true;
    return true;
  },
  COL: {
    fuego: ['#ffd060', '#ff8020', '#ff4010'], agua: ['#c8f0ff', '#60b0ff', '#2a70d0'], planta: ['#c0ff80', '#60d040', '#2a8a30'],
    electrico: ['#ffffe0', '#fff060', '#ffd020'], roca: ['#d8c0a0', '#a08060', '#6a5040'], viento: ['#ffffff', '#c8f0ff', '#90d0f0'],
    bicho: ['#e0ff80', '#a0d030', '#6a9020'], sombra: ['#d0a0ff', '#8050d0', '#40206a'], mente: ['#ffd0f0', '#ff80c8', '#c050a0'], normal: ['#ffffff', '#fff0c0', '#d0c8b8'],
  },
  rgb(c) { this.cc = this.cc || {}; return this.cc[c] || (this.cc[c] = new THREE.Color(c)); },
  // ---------- emisión ----------
  emit(o) {
    const smoke = o.smoke, i = smoke ? (this.nextS = ((this.nextS || 0) + 1) % this.N) : (this.next = (this.next + 1) % this.N);
    const P = smoke ? this.posS : this.pos, C = smoke ? this.colS : this.col;
    P[i * 3] = o.x; P[i * 3 + 1] = o.y; P[i * 3 + 2] = o.z;
    const c = this.rgb(o.c); C[i * 3] = c.r; C[i * 3 + 1] = c.g; C[i * 3 + 2] = c.b;
    const k = i + (smoke ? this.N : 0);
    this.st = this.st || { vel: new Float32Array(this.N * 6), life: new Float32Array(this.N * 2), max: new Float32Array(this.N * 2), grav: new Float32Array(this.N * 2), drag: new Float32Array(this.N * 2), size0: new Float32Array(this.N * 2), grow: new Float32Array(this.N * 2), a0: new Float32Array(this.N * 2) };
    const S = this.st;
    S.vel[k * 3] = o.vx || 0; S.vel[k * 3 + 1] = o.vy || 0; S.vel[k * 3 + 2] = o.vz || 0;
    S.life[k] = S.max[k] = o.life || 0.5; S.grav[k] = o.g || 0; S.drag[k] = o.drag !== undefined ? o.drag : 0.96; S.size0[k] = o.s || 0.08; S.grow[k] = o.grow || 0; S.a0[k] = o.a !== undefined ? o.a : 1;
  },
  rand(a, b) { return a + Math.random() * (b - a); },
  // explosión de partículas del tipo en un punto (coordenadas 3D)
  burst(type, x, y, z, n = 18, power = 1) {
    if (!this.init()) return;
    const C = this.COL[type] || this.COL.normal, R = (a, b) => this.rand(a, b);
    for (let i = 0; i < n; i++) {
      const a = R(0, Math.PI * 2), e = R(-0.2, 1.2), sp = R(1.2, 3.8) * power;
      const vx = Math.cos(a) * Math.cos(e) * sp, vz = Math.sin(a) * Math.cos(e) * sp * 0.7, vy = Math.sin(e) * sp;
      const c = C[i % 3];
      if (type === 'fuego') { this.emit({ x, y, z, vx: vx * 0.7, vy: vy * 0.5 + 1.2, vz, c, life: R(0.35, 0.7), g: -1.5, s: R(0.08, 0.16), grow: -0.1 }); if (i % 3 === 0) this.emit({ smoke: true, x, y: y + 0.2, z, vx: vx * 0.2, vy: R(0.6, 1.2), vz: vz * 0.2, c: '#3a2a28', life: R(0.6, 1.1), s: 0.18, grow: 0.5, a: 0.55, drag: 0.98 }); }
      else if (type === 'agua') this.emit({ x, y, z, vx, vy: Math.abs(vy) + 1.5, vz, c, life: R(0.4, 0.75), g: 9, s: R(0.05, 0.1), drag: 0.99 });
      else if (type === 'planta') this.emit({ x, y, z, vx: vx * 0.8, vy: vy * 0.6 + 0.6, vz, c, life: R(0.6, 1.0), g: 1.2, s: R(0.07, 0.11), drag: 0.93 });
      else if (type === 'electrico') this.emit({ x, y, z, vx: vx * 1.8, vy: vy * 1.5, vz: vz * 1.8, c, life: R(0.12, 0.3), s: R(0.04, 0.08), drag: 0.85 });
      else if (type === 'roca') { this.emit({ x, y, z, vx, vy: Math.abs(vy) + 2, vz, c, life: R(0.5, 0.8), g: 12, s: R(0.07, 0.13), drag: 0.99 }); if (i % 3 === 0) this.emit({ smoke: true, x, y: 0.15, z, vx: vx * 0.4, vy: 0.3, vz: vz * 0.4, c: '#a89070', life: 0.9, s: 0.2, grow: 0.6, a: 0.5 }); }
      else if (type === 'viento') { const r = R(0.2, 0.6); this.emit({ x: x + Math.cos(a) * r, y: y + R(-0.2, 0.4), z: z + Math.sin(a) * r * 0.7, vx: -Math.sin(a) * 3, vy: R(0.5, 1.5), vz: Math.cos(a) * 2, c, life: R(0.3, 0.6), s: R(0.04, 0.08), a: 0.8, drag: 0.94 }); }
      else if (type === 'sombra') { this.emit({ smoke: true, x, y, z, vx: vx * 0.4, vy: vy * 0.3 + 0.3, vz: vz * 0.4, c: i % 2 ? '#2a1040' : '#5a2a90', life: R(0.5, 0.9), s: 0.15, grow: 0.4, a: 0.7, drag: 0.95 }); if (i % 2) this.emit({ x, y, z, vx, vy, vz, c, life: 0.4, s: 0.06 }); }
      else if (type === 'mente') this.emit({ x: x + Math.cos(a) * 0.4, y: y + Math.sin(e) * 0.3, z: z + Math.sin(a) * 0.3, vx: Math.cos(a) * 1.5, vy: 0.4, vz: Math.sin(a) * 1, c, life: R(0.4, 0.7), s: R(0.06, 0.1), drag: 0.9 });
      else this.emit({ x, y, z, vx, vy, vz, c, life: R(0.3, 0.55), s: R(0.05, 0.1), g: 2 });
    }
  },
  flash(type, x, y, z, power = 1, dur = 0.25) {
    if (!this.init()) return;
    const L = this.lights.reduce((a, b) => (a.t / (a.dur || 1) > b.t / (b.dur || 1) ? a : b));
    L.l.position.set(x, y + 0.4, z); L.l.color.copy(this.rgb((this.COL[type] || this.COL.normal)[1])); L.t = 0; L.dur = dur; L.power = 6 * power;
  },
  wave(type, x, z, r = 1.4, dur = 0.45) {
    if (!this.init()) return;
    const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 32), new THREE.MeshBasicMaterial({ color: (this.COL[type] || this.COL.normal)[1], transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.04, z); World3D.scene.add(m);
    this.waves.push({ m, t: 0, dur, r });
  },
  bolt(x0, y0, z0, x1, y1, z1, col = '#fff8a0') {
    if (!this.init()) return;
    const pts = [], n = 8;
    for (let i = 0; i <= n; i++) { const k = i / n, j = i && i < n ? 0.25 : 0; pts.push(new THREE.Vector3(x0 + (x1 - x0) * k + this.rand(-j, j), y0 + (y1 - y0) * k + this.rand(-j, j), z0 + (z1 - z0) * k + this.rand(-j, j))); }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
    World3D.scene.add(l); this.beams.push({ m: l, t: 0, dur: 0.12 });
  },
  // ---------- actualización ----------
  update(dt, B) {
    if (!this.ready) return;
    const S = this.st; if (!S) return;
    for (const layer of [0, 1]) {
      const P = layer ? this.posS : this.pos, SZ = layer ? this.sizeS : this.size, AL = layer ? this.alphaS : this.alpha;
      for (let i = 0; i < this.N; i++) {
        const k = i + layer * this.N;
        if (S.life[k] <= 0) { if (AL[i] !== 0) { AL[i] = 0; SZ[i] = 0; } continue; }
        S.life[k] -= dt;
        const d = Math.pow(S.drag[k], dt * 60);
        S.vel[k * 3] *= d; S.vel[k * 3 + 1] = S.vel[k * 3 + 1] * d - S.grav[k] * dt; S.vel[k * 3 + 2] *= d;
        P[i * 3] += S.vel[k * 3] * dt; P[i * 3 + 1] += S.vel[k * 3 + 1] * dt; P[i * 3 + 2] += S.vel[k * 3 + 2] * dt;
        if (P[i * 3 + 1] < 0.02) { P[i * 3 + 1] = 0.02; S.vel[k * 3 + 1] *= -0.3; S.vel[k * 3] *= 0.6; S.vel[k * 3 + 2] *= 0.6; }
        const q = Math.max(0, S.life[k] / S.max[k]);
        SZ[i] = Math.max(0, S.size0[k] * (1 + S.grow[k] * (1 - q) * 4));
        AL[i] = S.a0[k] * Math.min(1, q * 2.5);
      }
      const g = layer ? this.smoke.geometry : this.points.geometry;
      for (const a of ['position', 'color', 'size', 'alpha']) g.attributes[a].needsUpdate = true;
    }
    for (const L of this.lights) { L.t += dt; const k = Math.max(0, 1 - L.t / (L.dur || 1)); L.l.intensity = L.power * k * k; }
    for (const w of this.waves) { w.t += dt; const k = w.t / w.dur, r = 0.2 + w.r * (1 - Math.pow(1 - k, 2)); w.m.scale.set(r, r, r); w.m.material.opacity = 0.8 * (1 - k); }
    this.waves = this.waves.filter((w) => { if (w.t < w.dur) return true; World3D.scene.remove(w.m); w.m.geometry.dispose(); w.m.material.dispose(); return false; });
    for (const b of this.beams) { b.t += dt; b.m.material.opacity = 1 - b.t / b.dur; }
    this.beams = this.beams.filter((b) => { if (b.t < b.dur) return true; World3D.scene.remove(b.m); b.m.geometry.dispose(); b.m.material.dispose(); return false; });
    // estelas y luces de los proyectiles
    const projs = B && B.state ? B.projs : [];
    projs.forEach((p, i) => {
      const x = p.x / 16, z = p.y / 16, y = 0.45, t = p.m.type, C = this.COL[t] || this.COL.normal;
      for (let rep = 0; rep < 3; rep++) {
        if (t === 'fuego') { this.emit({ x, y, z, vx: this.rand(-0.3, 0.3), vy: this.rand(0.3, 1), vz: this.rand(-0.3, 0.3), c: C[(i + rep) % 3], life: 0.45, s: 0.15, g: -1, grow: -0.2 }); if (Math.random() < 0.3) this.emit({ smoke: true, x, y, z, vy: 0.6, c: '#3a2a28', life: 0.6, s: 0.12, grow: 0.5, a: 0.45 }); }
        else if (t === 'agua') this.emit({ x, y, z, vx: this.rand(-0.4, 0.4), vy: this.rand(0, 0.8), vz: this.rand(-0.4, 0.4), c: C[rep % 2], life: 0.4, s: 0.1, g: 6 });
        else if (t === 'electrico') { this.emit({ x: x + this.rand(-0.15, 0.15), y: y + this.rand(-0.15, 0.15), z, c: C[rep % 2], life: 0.14, s: 0.11 }); if (Math.random() < 0.15) this.bolt(x, y, z, x + this.rand(-0.5, 0.5), y + this.rand(-0.3, 0.3), z + this.rand(-0.4, 0.4)); }
        else if (t === 'sombra') this.emit({ smoke: true, x, y, z, vy: 0.2, c: '#3a1a5a', life: 0.5, s: 0.12, grow: 0.3, a: 0.6 });
        else this.emit({ x, y, z, vx: this.rand(-0.3, 0.3), vy: this.rand(-0.1, 0.4), vz: this.rand(-0.3, 0.3), c: C[(i + rep) % 3], life: 0.4, s: 0.11 });
      }
    });
    this.projLights.forEach((l, i) => { const p = projs[i]; if (!p) { l.intensity = 0; return; } l.position.set(p.x / 16, 0.6, p.y / 16); l.color.copy(this.rgb((this.COL[p.m.type] || this.COL.normal)[1])); l.intensity = 3; });
    // rayos: chispas a lo largo y luz
    if (B && B.fx) for (const e of B.fx) if (e.k === 'beam' && e.t < e.dur * 0.6) {
      const type = Object.keys(this.COL).find((k) => TYPES[k] && TYPES[k].color === e.color) || 'normal';
      for (let k = 0; k < 4; k++) { const d = Math.random() * e.len; this.emit({ x: (e.x + Math.cos(e.ang) * d) / 16, y: 0.45, z: (e.y + Math.sin(e.ang) * d) / 16, vx: this.rand(-0.6, 0.6), vy: this.rand(0.2, 1.2), vz: this.rand(-0.6, 0.6), c: (this.COL[type] || this.COL.normal)[k % 3], life: 0.3, s: 0.07 }); }
    }
    this.matAdd.uniforms.scale.value = World3D.cv ? World3D.cv.height * 3.8 : 1300;
    this.smoke.material.uniforms.scale.value = this.matAdd.uniforms.scale.value;
  },
  clear() {
    if (!this.st) return;
    this.st.life.fill(0);
    for (const L of this.lights) L.power = 0;
  },
};

// ---------- integración con el combate ----------
{
  const BP = BattleScene.prototype;
  const on = () => typeof World3D !== 'undefined' && World3D.usable(World) && FX3D.init();
  const _hit = BP.hit;
  BP.hit = function (tgt, att, m, mult, ang) {
    const h0 = tgt ? tgt.hp : 0, crit0 = Shake.mag || 0;
    const r = _hit.call(this, tgt, att, m, mult, ang);
    if (!on() || !tgt || !m) return r;
    const dmg = h0 - tgt.hp;
    // delante del sprite (hacia la cámara) y a media altura del cuerpo
    const x = tgt.x / 16, z = (tgt.y + 2) / 16 + 0.45, y = 0.75;
    if (dmg > 0) {
      const eff = typeMult(m.type, tgt.types), big = eff > 1 || (Shake.mag || 0) > crit0 + 1 || m.pow >= 90;
      FX3D.burst(m.type, x, y, z, big ? 44 : 26, big ? 1.5 : 1.1);
      FX3D.flash(m.type, x, y, z, big ? 1.6 : 1, big ? 0.35 : 0.22);
      FX3D.wave(m.type, x, z, big ? 2.2 : 1.3);
      if (m.type === 'electrico') for (let k = 0; k < 3; k++) FX3D.bolt(x, 2.2, z, x + FX3D.rand(-0.4, 0.4), 0.3, z + FX3D.rand(-0.3, 0.3));
      if (big) { Shake.start(3, 0.22); FX3D.burst('normal', x, y + 0.2, z, 10, 1.6); }
    } else if (tgt.dodgeT > 0 || tgt.invuln > 0) FX3D.burst('viento', x, 0.4, z, 10, 0.8);
    return r;
  };
  const _start = BP.startMove;
  BP.startMove = function (f, i, cm) {
    const ok = _start.call(this, f, i, cm);
    if (ok === false || !on() || !f || !f.c.moves[i]) return ok;
    const m = MOVES[f.c.moves[i]], x = f.x / 16, z = (f.y + 2) / 16 + 0.35;
    FX3D.burst(m.type, x + Math.cos(f.ang) * 0.4, 0.5, z + Math.sin(f.ang) * 0.3, cm > 1.2 ? 16 : 7, 0.6);
    FX3D.flash(m.type, x, 0.5, z, cm > 1.2 ? 1.2 : 0.6, 0.18);
    if (m.kind === 'ring' || m.kind === 'area') FX3D.wave(m.type, x, z, (m.radius || 40) / 16, 0.5);
    return ok;
  };
  const _upd = BP.update;
  BP.update = function (dt) {
    const r = _upd.call(this, dt);
    if (FX3D.ready) FX3D.update(dt * (this.timeScale || 1), this);
    return r;
  };
  const _run = BP.run;
  if (_run) BP.run = async function (...a) { try { return await _run.apply(this, a); } finally { FX3D.clear(); } };
  // en 3D, las partículas planas de los golpes se reducen (las sustituyen las 3D)
  const _burst = BP.burst;
  BP.burst = function (x, y, type, n = 12, spd = 80) { return _burst.call(this, x, y, type, on() ? Math.ceil(n / 3) : n, spd); };
}
