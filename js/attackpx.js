'use strict';
// ============================================================
//  ATAQUES EN PIXEL ART NÍTIDO (prueba: Lanzallamas, Burbuja, Trueno y Bola Sombra)
//  Como en los juegos de pixel art: cada efecto es una animación dibujada (PixelLab),
//  siempre de frente a la cámara, a tamaño exacto (un píxel del dibujo = medio píxel
//  del mundo, igual que las ánimas) y sin suavizado; con estelas de partículas
//  cuadradas y un estallido grande al golpear.
// ============================================================
const AttackPX = {
  MOVES: ['lanzallamas', 'burbuja', 'trueno', 'bola_sombra'],
  PX: 1 / 32,                                            // un píxel del dibujo, en unidades del mundo
  tex: {}, live: [],
  strip(k) {
    if (this.tex[k] !== undefined) return this.tex[k];
    this.tex[k] = null;
    const im = new Image();
    im.onload = () => { const t = new THREE.Texture(im); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; this.tex[k] = t; };
    im.src = 'assets/ataques/' + k + '.png';
    return null;
  },
  // un cartel que mira a la cámara con la animación k; escala entera (mul) para que los píxeles queden nítidos
  sprite(k, o) {
    const base = this.strip(k); if (!base) return null;
    const [S, n] = AttackFX.SRC[k], t = base.clone(); t.needsUpdate = true;
    t.repeat.set(1 / n, 1);
    const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, fog: false });
    const sp = new THREE.Sprite(m); sp.renderOrder = 14;
    const w = S * this.PX * (o.mul || 1); sp.scale.set(w, w, 1);
    if (o.bottom) sp.center.set(0.5, 0.06);
    World3D.scene.add(sp);
    const e = Object.assign({ k, sp, t, n, age: 0, fps: 16, loop: false, dur: n / 16 }, o);
    this.live.push(e); return e;
  },
  // ángulo en pantalla de la dirección (x, y) del combate, para girar el dibujo hacia donde va
  screenAngle(x0, y0, x1, y1) {
    const cam = World3D.cam, a = new THREE.Vector3(x0 / 16, 0.5, y0 / 16).project(cam), b = new THREE.Vector3(x1 / 16, 0.5, y1 / 16).project(cam);
    return Math.atan2((b.y - a.y) * H, (b.x - a.x) * WIDE);
  },
  update(dt) {
    for (const e of this.live) {
      e.age += dt;
      if (e.follow) { const p = e.follow; e.sp.position.set(p.x / 16, e.y3 || 0.5, p.y / 16 + 0.2); if (e.alive && !e.alive()) e.dur = Math.min(e.dur, e.age); }
      const f = e.loop ? Math.floor(e.age * e.fps) % e.n : Math.min(e.n - 1, Math.floor(e.age * e.fps));
      e.t.offset.x = f / e.n;
      if (e.fade) e.sp.material.opacity = Math.max(0, Math.min(1, (e.dur - e.age) / e.fade));
      if (e.tick) e.tick(e, dt);
    }
    this.live = this.live.filter((e) => { if (e.age < e.dur) return true; World3D.scene.remove(e.sp); e.sp.material.dispose(); e.t.dispose(); return false; });
  },
  clear() { for (const e of this.live) { World3D.scene.remove(e.sp); e.sp.material.dispose(); e.t.dispose(); } this.live = []; },
  // partícula cuadrada (las de FX3D)
  dot(x, y, z, o) { FX3D.emit(Object.assign({ x, y, z }, o)); },

  // ---------- Lanzallamas: un chorro de llamas en cadena, del ánima hacia adelante ----------
  lanzallamas(f, len, ang) {
    const segW = 96 * this.PX * 16, n = Math.max(2, Math.ceil(len / segW)), rot = this.screenAngle(f.x, f.y, f.x + Math.cos(ang), f.y + Math.sin(ang)) + Math.PI;
    for (let i = 0; i < n; i++) {
      const d = (i + 0.5) * Math.min(segW, len / n);
      const e = this.sprite('lanzallamas', { loop: true, fps: 18, dur: 0.55, fade: 0.15 });
      if (!e) return;
      e.sp.material.rotation = rot; e.age = i * 0.05;
      e.sp.position.set((f.x + Math.cos(ang) * d) / 16, 0.55, (f.y + Math.sin(ang) * d) / 16 + 0.2);
    }
    for (let i = 0; i < 26; i++) { const d = Math.random() * len; this.dot((f.x + Math.cos(ang) * d) / 16, 0.4 + Math.random() * 0.5, (f.y + Math.sin(ang) * d) / 16 + 0.2, { vx: Math.cos(ang) * 2.5, vy: 1 + Math.random() * 1.5, vz: Math.sin(ang) * 2.5, c: ['#fff4a0', '#ffc040', '#ff7020', '#e03010'][i % 4], life: 0.35 + Math.random() * 0.3, g: -1.5, s: 0.07 + Math.random() * 0.05 }); }
  },
  // ---------- Burbuja y Bola Sombra: el proyectil dibujado, con su estela ----------
  proyectil(k, B, p, trail) {
    const e = this.sprite(k, { follow: p, alive: () => B.projs.includes(p), loop: true, fps: 14, dur: 4 });
    if (!e) return;
    e.sp.material.rotation = this.screenAngle(p.x, p.y, p.x + p.vx, p.y + p.vy) + Math.PI;
    e.tick = (e, dt) => { e.acc = (e.acc || 0) + dt; while (e.acc > 0.03) { e.acc -= 0.03; trail(p); } };
  },
  // ---------- Trueno: el rayo dibujado cae sobre el rival (al doble de tamaño, nítido) ----------
  trueno(x, y, delay) {
    setTimeout(() => {
      if (!World3D.scene) return;
      const e = this.sprite('trueno', { mul: 2, bottom: true, fps: 22, dur: 9 / 22 + 0.08, fade: 0.1 });
      if (!e) return;
      e.sp.position.set(x / 16, 0, y / 16);
      FX3D.flash('electrico', x / 16, 1.5, y / 16, 2.5, 0.35);
      for (let i = 0; i < 30; i++) { const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 3; this.dot(x / 16, 0.2, y / 16, { vx: Math.cos(a) * s, vy: 1 + Math.random() * 3, vz: Math.sin(a) * s, c: ['#ffffff', '#fff060', '#ffd020'][i % 3], life: 0.2 + Math.random() * 0.25, s: 0.06 + Math.random() * 0.05, drag: 0.88 }); }
      if (typeof Shake !== 'undefined') Shake.start(2.5, 0.25);
    }, delay * 1000);
  },
  // estallido grande al golpear (el último cuadro del efecto, ampliado y desvaneciéndose)
  impact(type, x, y) {
    const C = { fuego: ['#fff4a0', '#ffb030', '#ff6010', '#c02008'], agua: ['#ffffff', '#c8f0ff', '#70c0ff', '#3080e0'], sombra: ['#e0c0ff', '#9060e0', '#5a2aa0', '#200838'], electrico: ['#ffffff', '#fff060', '#ffd020', '#e0a010'] }[type];
    if (!C) return;
    for (let i = 0; i < 34; i++) { const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 3.5; this.dot(x / 16, 0.5, y / 16 + 0.2, { vx: Math.cos(a) * s, vy: Math.random() * 3, vz: Math.sin(a) * s * 0.7, c: C[i % 4], life: 0.25 + Math.random() * 0.35, s: 0.07 + Math.random() * 0.08, drag: 0.9, g: type === 'agua' ? 6 : 0 }); }
  },
};

{
  // tamaño de cuadro y cantidad de cuadros de cada tira (las mismas de AttackFX)
  AttackFX.SRC = {};
  for (const k of AttackPX.MOVES) { AttackFX.SRC[k] = AttackFX.DATA[k]; delete AttackFX.DATA[k]; }
  const BP = BattleScene.prototype;
  const on = () => typeof World3D !== 'undefined' && World3D.usable(World) && typeof FX3D !== 'undefined' && FX3D.init();
  const _upd = FX3D.update;
  FX3D.update = function (dt, B) {
    // los proyectiles dibujados no usan la estela continua ni la bola de antes: llevan la suya
    const all = B && B.projs;
    if (all && all.some((p) => p._px)) B.projs = all.filter((p) => !p._px);
    try { _upd.call(this, dt, B); } finally { if (all) B.projs = all; }
    if (!B || !on()) { if (AttackPX.live.length) AttackPX.clear(); return; }
    if (B !== AttackPX.battle) { AttackPX.clear(); AttackPX.battle = B; for (const k of AttackPX.MOVES) AttackPX.strip(k); }
    AttackPX.update(dt);
  };
  const keyOf = (m) => Object.keys(MOVES).find((q) => MOVES[q] === m);
  const _exec = BP.execMove;
  BP.execMove = function (f, a) {
    const n0 = this.fx.length, p0 = this.projs.length, a0 = this.areas.length;
    const r = _exec.call(this, f, a);
    if (!on()) return r;
    const k = keyOf(a.m);
    if (!AttackPX.MOVES.includes(k)) return r;
    if (k === 'lanzallamas') for (const e of this.fx.slice(n0)) if (e.k === 'beam') { e._fxAF = true; AttackPX.lanzallamas(f, e.len, e.ang); }
    if (k === 'burbuja') for (const p of this.projs.slice(p0)) { p._fxAF = p._px = true; AttackPX.proyectil('burbuja', this, p, (q) => AttackPX.dot(q.x / 16, 0.5 + (Math.random() - 0.5) * 0.15, q.y / 16 + 0.2, { vx: (Math.random() - 0.5) * 0.6, vy: 0.4 + Math.random() * 0.5, vz: (Math.random() - 0.5) * 0.4, c: Math.random() < 0.5 ? '#e8f8ff' : '#a8dcff', life: 0.5 + Math.random() * 0.4, s: 0.06 + Math.random() * 0.07, drag: 0.95, g: -0.4 })); }
    if (k === 'bola_sombra') for (const p of this.projs.slice(p0)) { p._fxAF = p._px = true; AttackPX.proyectil('bola_sombra', this, p, (q) => AttackPX.dot(q.x / 16, 0.5 + (Math.random() - 0.5) * 0.2, q.y / 16 + 0.2, { smoke: true, vx: (Math.random() - 0.5) * 0.4, vy: 0.3, vz: (Math.random() - 0.5) * 0.3, c: Math.random() < 0.5 ? '#2a1040' : '#6a3aa0', life: 0.4, s: 0.12, grow: 0.3, a: 0.7 })); }
    if (k === 'trueno') for (const ar of this.areas.slice(a0)) AttackPX.trueno(ar.x, ar.y, ar.delay || 0.5);
    return r;
  };
  // al golpear, estallido de partículas del tipo
  const _hit = BP.hit;
  BP.hit = function (tgt, att, m, mult, ang) {
    const h0 = tgt ? tgt.hp : 0, r = _hit.call(this, tgt, att, m, mult, ang);
    if (on() && tgt && m && h0 - tgt.hp > 0 && AttackPX.MOVES.includes(keyOf(m))) AttackPX.impact(m.type, tgt.x, tgt.y);
    return r;
  };
}
