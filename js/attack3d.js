'use strict';
// ============================================================
//  ATAQUES EN 3D (prueba: Lanzallamas, Trueno, Terremoto y Bola Sombra)
//  Formas con volumen y movimiento en la escena 3D, con texturas de pixel art
//  dibujadas con PixelLab (assets/texturas/). Las partículas, luces y sacudidas
//  de FX3D siguen funcionando; estos ataques ya no usan el dibujo plano de AttackFX.
// ============================================================
const Attack3D = {
  tex: {}, live: [],
  MOVES: ['lanzallamas', 'trueno', 'terremoto', 'bola_sombra'],
  texture(name) {
    if (this.tex[name]) return this.tex[name];
    const t = new THREE.TextureLoader().load('assets/texturas/' + name + '.png');
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
    return (this.tex[name] = t);
  },
  // material con la textura propia (cada efecto mueve su textura sin afectar a los demás)
  mat(name, o = {}) {
    const t = this.texture(name).clone(); t.needsUpdate = true;
    if (o.repeat) t.repeat.set(o.repeat[0], o.repeat[1]);
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
      blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, opacity: o.opacity !== undefined ? o.opacity : 1, color: o.color || '#ffffff' });
  },
  add(obj, upd, dur) {
    World3D.scene.add(obj);
    const e = { obj, upd, dur, t: 0 };
    this.live.push(e); return e;
  },
  update(dt) {
    for (const e of this.live) { e.t += dt; e.upd(e, Math.min(1, e.t / e.dur), dt); }
    this.live = this.live.filter((e) => {
      if (e.t < e.dur) return true;
      World3D.scene.remove(e.obj);
      e.obj.traverse((o) => { if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } if (o.geometry && !o.geometry._shared) o.geometry.dispose(); });
      return false;
    });
  },
  clear() { for (const e of this.live) World3D.scene.remove(e.obj); this.live = []; },
  W(x, y) { return [x / 16, y / 16]; },
  // ---------- Lanzallamas: un cono de fuego que sale de la boca y se abre hacia adelante ----------
  lanzallamas(B, f, len, ang) {
    const L = len / 16, g = new THREE.Group();
    const geo = new THREE.CylinderGeometry(1.0, 0.12, 1, 18, 1, true); geo.rotateZ(-Math.PI / 2); geo.translate(0.5, 0, 0);
    const outer = new THREE.Mesh(geo, this.mat('fuego', { repeat: [2, 1] }));
    const inner = new THREE.Mesh(geo, this.mat('fuego', { add: true, repeat: [3, 1], color: '#fff2b0' })); inner.scale.set(1, 0.5, 0.5);
    g.add(outer, inner);
    const [x, z] = this.W(f.x, f.y); g.position.set(x, 0.5, z + 0.15); g.rotation.y = -ang;
    this.add(g, (e, k, dt) => {
      const grow = Math.min(1, k * 4), fade = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      g.scale.set(L * grow, 0.7 + 0.12 * Math.sin(e.t * 40), 0.7 + 0.12 * Math.cos(e.t * 37));
      outer.material.map.offset.x -= dt * 3.2; inner.material.map.offset.x -= dt * 4.5;
      outer.material.opacity = 0.95 * fade; inner.material.opacity = 0.9 * fade;
      // brasas que saltan del chorro
      if (Math.random() < 0.7) { const d = Math.random() * L * grow; FX3D.emit({ x: x + Math.cos(ang) * d, y: 0.5 + (Math.random() - 0.5) * 0.4, z: z + 0.15 + Math.sin(ang) * d, vx: Math.cos(ang) * 2, vy: 1 + Math.random(), vz: Math.sin(ang) * 2, c: Math.random() < 0.5 ? '#ffd060' : '#ff6a20', life: 0.4, g: -1, s: 0.09 }); }
    }, 0.55);
  },
  // ---------- Trueno: el rayo cae del cielo sobre el rival, con un destello y una marca quemada ----------
  trueno(B, x0, y0, delay) {
    const [x, z] = this.W(x0, y0), H = 7;
    // marca en el suelo (avisa dónde va a caer) y luego queda quemada
    const ring = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), this.mat('rayo', { add: true, opacity: 0 })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.05, z);
    this.add(ring, (e, k, dt) => { const s = e.t < delay ? e.t / delay : 1; ring.scale.setScalar(0.4 + 0.8 * s); ring.material.opacity = e.t < delay ? 0.25 + 0.2 * Math.sin(e.t * 30) : 0.9 * (1 - k); ring.material.map.rotation += dt * 2; }, delay + 0.5);
    setTimeout(() => {
      if (!World3D.scene) return;
      const g = new THREE.Group();
      // tres láminas cruzadas con la textura del rayo: se ve con volumen desde cualquier lado
      for (let i = 0; i < 3; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, H), this.mat('rayo', { add: true, repeat: [1, 3] }));
        m.position.y = H / 2; m.rotation.y = (i * Math.PI) / 3; g.add(m);
      }
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, H, 8, 1, true), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      core.position.y = H / 2; g.add(core);
      g.position.set(x, 0, z);
      this.add(g, (e, k, dt) => {
        const flick = Math.random() < 0.5 ? 1 : 0.55;
        g.children.forEach((c, i) => { c.material.opacity = (1 - k) * flick; if (c.material.map) c.material.map.offset.y += dt * 6 + Math.random() * 0.3; });
        g.scale.x = g.scale.z = 1 + 0.3 * Math.sin(e.t * 60);
      }, 0.4);
      FX3D.flash('electrico', x, 1.5, z, 2.5, 0.4);
      FX3D.burst('electrico', x, 0.3, z, 40, 1.6);
      FX3D.wave('electrico', x, z, 2.2, 0.4);
      if (typeof Shake !== 'undefined') Shake.start(2.5, 0.25);
    }, delay * 1000);
  },
  // ---------- Terremoto: el suelo se agrieta alrededor y saltan rocas ----------
  terremoto(B, f, r) {
    const [x, z] = this.W(f.x, f.y), R = r / 16;
    const crack = new THREE.Mesh(new THREE.CircleGeometry(1, 40), this.mat('roca', { repeat: [3, 3], color: '#7a6450' }));
    // solo las grietas: un círculo que se oscurece hacia el borde
    crack.material.alphaMap = this.fadeMap(); crack.rotation.x = -Math.PI / 2; crack.position.set(x, 0.035, z);
    this.add(crack, (e, k) => { crack.scale.setScalar(0.3 + R * Math.min(1, k * 3)); crack.material.opacity = k > 0.6 ? (1 - k) / 0.4 : 1; }, 1.1);
    // rocas que salen del suelo, giran y caen
    const rockGeo = this.rockGeo || (this.rockGeo = new THREE.DodecahedronGeometry(0.22, 0)); rockGeo._shared = true;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + Math.random() * 0.3, d = R * (0.35 + Math.random() * 0.6);
      const m = new THREE.Mesh(rockGeo, new THREE.MeshLambertMaterial({ map: this.texture('roca'), color: '#c8b8a0' }));
      const s = 0.9 + Math.random() * 1.1; m.scale.setScalar(s);
      const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d * 0.8, vy = 3 + Math.random() * 2.5, spin = (Math.random() - 0.5) * 12, delay = (d / R) * 0.25;
      m.position.set(px, -0.3, pz);
      this.add(m, (e) => {
        const t = Math.max(0, e.t - delay), y = -0.3 + vy * t - 7 * t * t;
        m.position.y = Math.max(-0.3, y); m.rotation.x += spin * 0.016; m.rotation.z += spin * 0.012;
        if (y < -0.25 && t > 0.2) m.visible = false;
      }, 1.2);
    }
    for (let i = 0; i < 14; i++) { const a = Math.random() * Math.PI * 2, d = R * Math.random(); FX3D.emit({ smoke: true, x: x + Math.cos(a) * d, y: 0.12, z: z + Math.sin(a) * d, vx: Math.cos(a) * 0.8, vy: 0.5, vz: Math.sin(a) * 0.8, c: i % 2 ? '#6a5440' : '#806a52', life: 0.8, s: 0.14, grow: 0.5, a: 0.55 }); }
    if (typeof Shake !== 'undefined') Shake.start(3, 0.5);
  },
  fadeMap() {
    if (this._fade) return this._fade;
    const [c, x] = U.makeCanvas(64, 64), g = x.createRadialGradient(32, 32, 4, 32, 32, 32);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#ffffff'); g.addColorStop(1, '#000000');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (this._fade = new THREE.CanvasTexture(c));
  },
  // ---------- Bola Sombra: una esfera de sombra que gira, con un núcleo oscuro y estela de humo ----------
  bolaSombra(B, p) {
    const g = new THREE.Group(), r = Math.max(0.28, (p.r || 5) / 16 * 1.1);
    const core = new THREE.Mesh(new THREE.SphereGeometry(r * 0.6, 16, 12), new THREE.MeshBasicMaterial({ color: '#12061e' }));
    const shell = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), this.mat('sombra', { opacity: 0.85 }));
    const glow = new THREE.Mesh(new THREE.SphereGeometry(r * 1.35, 18, 14), this.mat('sombra', { add: true, opacity: 0.45, color: '#b080ff' }));
    g.add(core, shell, glow);
    this.add(g, (e, k, dt) => {
      if (!B.projs.includes(p)) { e.dur = Math.min(e.dur, e.t + 0.01); return; }
      g.position.set(p.x / 16, 0.5, p.y / 16 + 0.2);
      shell.rotation.y += dt * 4; shell.rotation.x += dt * 2.5; glow.rotation.y -= dt * 3;
      shell.material.map.offset.x += dt * 0.6; glow.scale.setScalar(1 + 0.12 * Math.sin(e.t * 18));
      if (Math.random() < 0.8) FX3D.emit({ smoke: true, x: g.position.x, y: 0.5, z: g.position.z, vx: -p.vx / 60, vy: 0.2, vz: -p.vy / 60, c: Math.random() < 0.5 ? '#2a1040' : '#6a3aa0', life: 0.45, s: r * 0.45, grow: 0.3, a: 0.5 });
    }, 3);
  },
};

{
  const BP = BattleScene.prototype;
  const on = () => typeof World3D !== 'undefined' && World3D.usable(World) && typeof FX3D !== 'undefined' && FX3D.init();
  for (const k of Attack3D.MOVES) delete AttackFX.DATA[k];     // estos ataques ya no usan el dibujo plano
  const _upd = FX3D.update;
  FX3D.update = function (dt, B) {
    _upd.call(this, dt, B);
    if (!B || !on()) { if (Attack3D.live.length) Attack3D.clear(); return; }
    if (B !== Attack3D.battle) { Attack3D.clear(); Attack3D.battle = B; for (const n of ['fuego', 'rayo', 'roca', 'sombra']) Attack3D.texture(n); }
    Attack3D.update(dt);
  };
  const _exec = BP.execMove;
  BP.execMove = function (f, a) {
    const n0 = this.fx.length, p0 = this.projs.length, a0 = this.areas.length;
    const r = _exec.call(this, f, a);
    if (!on()) return r;
    const m = a.m, k = Object.keys(MOVES).find((q) => MOVES[q] === m);
    if (!Attack3D.MOVES.includes(k)) return r;
    if (k === 'lanzallamas') for (const e of this.fx.slice(n0)) if (e.k === 'beam') { e._fxAF = true; Attack3D.lanzallamas(this, f, e.len, e.ang); }
    if (k === 'terremoto') for (const e of this.fx.slice(n0)) if (e.k === 'ring') { e._fxAF = true; Attack3D.terremoto(this, f, e.r); }
    if (k === 'bola_sombra') for (const p of this.projs.slice(p0)) { p._fxAF = true; Attack3D.bolaSombra(this, p); }
    if (k === 'trueno') for (const ar of this.areas.slice(a0)) Attack3D.trueno(this, ar.x, ar.y, ar.delay || 0.5);
    return r;
  };
}
