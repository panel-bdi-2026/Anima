'use strict';
// ============================================================
//  EFECTOS ANIMADOS DE CADA ATAQUE (dibujados con PixelLab)
//  Cada ataque tiene su propia tira de cuadros en assets/ataques/<clave>.png.
//  En el combate 3D se muestran según la forma del ataque:
//  - proyectil: un cartel que sigue al proyectil (mira hacia donde vuela)
//  - rayo: una lámina inclinada (se ve bien hacia cualquier lado), del atacante hacia adelante
//  - onda y zona vista desde arriba: una lámina en el suelo del tamaño del área
//  - golpe, embestida, mejora, curación, teletransporte: un cartel en el ánima
//  Las partículas, luces y sacudidas de FX3D siguen funcionando por debajo.
// ============================================================
const AttackFX = {
  // clave -> [tamaño del cuadro, cuadros, vista ('lado' de perfil, 'arriba' en el suelo, 'frente' de frente)]
  DATA: {
    embestida: [64, 9, 'lado'], zarpazo: [64, 9, 'lado'], rugido: [64, 9, 'frente'], acometida: [64, 9, 'lado'], carga_brutal: [96, 9, 'lado'],
    grito: [96, 9, 'arriba'], rayo_total: [96, 9, 'lado'], refuerzo: [64, 9, 'frente'], ascua: [48, 9, 'lado'], colmillo_igneo: [64, 9, 'lado'],
    brasas: [64, 9, 'lado'], llamarada: [96, 9, 'lado'], anillo_igneo: [96, 9, 'arriba'], lanzallamas: [96, 9, 'lado'], burbuja: [48, 9, 'lado'],
    cola_marea: [64, 9, 'lado'], chorro: [96, 9, 'lado'], hidrobomba: [96, 9, 'lado'], remolino: [96, 9, 'arriba'], rocio: [64, 9, 'frente'],
    ola: [96, 9, 'arriba'], hoja_filo: [64, 9, 'lado'], latigo: [64, 9, 'lado'], esporas: [64, 9, 'frente'], drenaje: [64, 9, 'lado'],
    tormenta_petalo: [96, 9, 'arriba'], rayo_solar: [96, 9, 'lado'], espino: [64, 9, 'lado'], chispa: [64, 9, 'lado'], puno_voltio: [64, 9, 'lado'],
    onda_estatica: [96, 9, 'arriba'], rayo: [96, 9, 'lado'], trueno: [96, 9, 'frente'], relampago: [64, 9, 'lado'], lanzarrocas: [64, 9, 'lado'],
    golpe_roca: [64, 9, 'lado'], avalancha: [96, 9, 'frente'], coraza: [64, 9, 'frente'], terremoto: [96, 9, 'arriba'], pedrisco: [64, 9, 'lado'],
    picotazo: [64, 9, 'lado'], rafaga: [64, 9, 'lado'], ala_corte: [64, 9, 'lado'], tornado: [96, 9, 'frente'], vendaval: [96, 9, 'lado'],
    viento_afin: [64, 9, 'frente'], picadura: [64, 9, 'lado'], hilo: [64, 9, 'lado'], zumbido: [96, 9, 'arriba'], tijera: [64, 9, 'lado'],
    polvo_toxico: [64, 9, 'frente'], aguijon: [64, 9, 'lado'], lenguetazo: [64, 9, 'lado'], bola_sombra: [64, 9, 'lado'], sombra_furtiva: [64, 9, 'frente'],
    pesadilla: [96, 9, 'frente'], velo: [64, 9, 'frente'], garra_umbria: [64, 9, 'lado'], confusion: [64, 9, 'lado'], psicorrayo: [96, 9, 'lado'],
    barrera: [64, 9, 'frente'], onda_mental: [96, 9, 'arriba'], teletransporte: [64, 9, 'frente'], psiquico: [64, 9, 'frente'], bosque_ancestral: [96, 9, 'arriba'],
    alba_solar: [96, 9, 'lado'], maremoto: [96, 9, 'frente'], destello_alba: [96, 9, 'arriba'], meditar: [64, 9, 'frente'],
    // ataques de los iniciales (recoloreados a partir de efectos de la misma forma)
    chispa_estelar: [64, 9, 'lado'], maullido_lunar: [96, 9, 'arriba'], rizo_piedra: [64, 9, 'lado'], alud_rizado: [64, 9, 'lado'],
    zarpa_nocturna: [64, 9, 'lado'], eclipse_felino: [64, 9, 'frente'],
  },
  tex: {}, live: [],
  keyOf(m) {
    if (!this.byMove) { this.byMove = new Map(); for (const k in MOVES) this.byMove.set(MOVES[k], k); }
    const k = this.byMove.get(m);
    return k && this.DATA[k] ? k : null;
  },
  // textura de la tira (una por ataque); cada efecto usa una copia con su propio cuadro
  texture(k) {
    if (this.tex[k] !== undefined) return this.tex[k];
    this.tex[k] = null;
    const im = new Image();
    im.onload = () => { const t = new THREE.Texture(im); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; this.tex[k] = t; };
    im.src = 'assets/ataques/' + k + '.png';
    return null;
  },
  preload(f) { for (const mk of (f && f.c && f.c.moves) || []) if (this.DATA[mk]) this.texture(mk); },
  // crea un efecto: ground = lámina en el suelo; si no, cartel que mira a la cámara
  spawn(k, o) {
    const base = this.texture(k);
    if (!base || typeof World3D === 'undefined' || !World3D.scene) return null;
    const [, n] = this.DATA[k], t = base.clone(); t.needsUpdate = true;
    t.repeat.set((o.flip ? -1 : 1) / n, 1); t.offset.set(o.flip ? 1 / n : 0, 0);
    let obj;
    if (o.ground) {
      const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      obj = new THREE.Mesh(this.plane || (this.plane = new THREE.PlaneGeometry(1, 1)), mat);
      obj.rotation.order = 'YXZ'; obj.rotation.x = o.tilt !== undefined ? o.tilt : -Math.PI / 2; obj.rotation.y = o.rotY || 0;
    } else {
      obj = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
      obj.center.set(0.5, o.anchorBottom ? 0.08 : 0.5);
    }
    obj.renderOrder = 12;
    // los efectos grandes tapaban a las ánimas: un poco más chicos y algo transparentes
    // (los de Mente, que son nubes enteras de color, más todavía)
    const mv = MOVES[k], mind = mv && mv.type === 'mente', big = o.w > 2.4, beam = o.tilt !== undefined;
    const ks = beam ? 1 : mind ? 0.78 : big ? 0.86 : 1; // los rayos conservan su largo (llegan hasta donde pegan)
    o.w *= ks; o.h *= ks;
    o.maxOp = mind ? 0.62 : big ? 0.8 : 0.92;
    obj.scale.set(o.w, o.h, 1);
    World3D.scene.add(obj);
    const e = Object.assign({ k, obj, t, n, age: 0, dur: 0.5, loop: false }, o);
    this.place(e); this.live.push(e);
    return e;
  },
  place(e) {
    const x = e.follow ? e.follow.x : e.x, y = e.follow ? e.follow.y : e.y;
    if (e.ground) e.obj.position.set(x / 16 + (e.dx || 0), e.tilt !== undefined ? 0.55 : 0.04, y / 16 + (e.dz || 0));
    else e.obj.position.set(x / 16, e.lift || 0.55, y / 16 + 0.25);
  },
  update(dt) {
    for (const e of this.live) {
      e.age += dt;
      if (e.follow && e.followAlive && !e.followAlive()) e.dur = Math.min(e.dur, e.age + 0.08);
      this.place(e);
      const q = e.loop ? (e.age * (e.fps || 18)) % e.n : Math.min(e.n - 1, Math.floor((e.age / e.dur) * e.n));
      const fr = Math.floor(q);
      e.t.offset.x = (e.flip ? fr + 1 : fr) / e.n;
      const left = e.dur - e.age;
      e.obj.material.opacity = (e.maxOp || 1) * (left < 0.12 ? Math.max(0, left / 0.12) : 1);
    }
    this.live = this.live.filter((e) => {
      if (e.age < e.dur) return true;
      World3D.scene.remove(e.obj); e.obj.material.dispose(); e.t.dispose(); return false;
    });
  },
  clear() {
    for (const e of this.live) { if (World3D.scene) World3D.scene.remove(e.obj); e.obj.material.dispose(); e.t.dispose(); }
    this.live = [];
  },
  // tamaño en unidades del mundo (1 = una casilla = 16 px del combate)
  U(px) { return px / 16; },
};

{
  const BP = BattleScene.prototype;
  const on = () => typeof World3D !== 'undefined' && World3D.usable(World) && typeof FX3D !== 'undefined' && FX3D.init();
  // al empezar el combate se cargan los ataques de las dos ánimas
  const _upd = FX3D.update;
  FX3D.update = function (dt, B) {
    _upd.call(this, dt, B);
    if (!B || !on()) { if (AttackFX.live.length) AttackFX.clear(); return; }
    if (B !== AttackFX.battle) { AttackFX.clear(); AttackFX.battle = B; }
    for (const f of [B.ally, B.foe]) if (f && f._fxPre !== f.c) { f._fxPre = f.c; AttackFX.preload(f); }
    AttackFX.update(dt);
  };
  const _clear = FX3D.clear;
  FX3D.clear = function () { _clear.call(this); AttackFX.clear(); };

  const _exec = BP.execMove;
  BP.execMove = function (f, a) {
    const n0 = this.fx.length, p0 = this.projs.length, a0 = this.areas.length;
    const r = _exec.call(this, f, a);
    if (!on()) return r;
    const m = a.m, k = AttackFX.keyOf(m);
    if (!k) return r;
    const [S, , vista] = AttackFX.DATA[k], U2 = AttackFX.U, big = S >= 96;
    const flip = Math.cos(f.ang) > 0;                      // los dibujos miran a la izquierda
    const nuevos = this.fx.slice(n0);
    switch (m.kind) {
      case 'proj':
        for (const p of this.projs.slice(p0)) {
          p._fxAF = true;
          AttackFX.spawn(k, { follow: p, followAlive: () => this.projs.includes(p), flip: p.vx > 0, w: U2(big ? 40 : 28), h: U2(big ? 40 : 28), dur: 3, loop: true, fps: 16, lift: 0.5 });
        }
        break;
      case 'beam':
        for (const e of nuevos) if (e.k === 'beam') {
          e._fxAF = true;
          const len = U2(e.len), w = Math.max(U2(e.w * 4), 1.6);
          // la lámina va del atacante hacia adelante: su centro, a media distancia
          AttackFX.spawn(k, { ground: true, x: e.x, y: e.y, dx: Math.cos(e.ang) * len / 2, dz: Math.sin(e.ang) * len / 2, rotY: -e.ang + Math.PI, tilt: -0.8, w: len, h: w, dur: 0.45 });
        }
        break;
      case 'ring':
        for (const e of nuevos) if (e.k === 'ring') {
          e._fxAF = true;
          if (vista === 'arriba') AttackFX.spawn(k, { ground: true, x: e.x, y: e.y, w: U2(e.r * 2.3), h: U2(e.r * 2.3), dur: 0.55 });
          else AttackFX.spawn(k, { x: e.x, y: e.y, w: U2(e.r * 1.6), h: U2(e.r * 1.6), dur: 0.55, anchorBottom: true, lift: 0 });
        }
        break;
      case 'area':
        for (const ar of this.areas.slice(a0)) {
          const dur = (ar.delay || 0.5) + 0.45;
          if (vista === 'arriba') AttackFX.spawn(k, { ground: true, x: ar.x, y: ar.y, w: U2(ar.r * 2.4), h: U2(ar.r * 2.4), dur });
          else AttackFX.spawn(k, { x: ar.x, y: ar.y, w: U2(Math.max(ar.r * 2.2, 48)), h: U2(Math.max(ar.r * 2.2, 48)), dur, anchorBottom: true, lift: 0 });
        }
        break;
      case 'melee': case 'stealth':
        for (const e of nuevos) if (e.k === 'slash') {
          e._fxAF = true;
          AttackFX.spawn(k, { x: e.x + Math.cos(e.ang) * 6, y: e.y + Math.sin(e.ang) * 6, flip: Math.cos(e.ang) > 0, w: U2(big ? 52 : 38), h: U2(big ? 52 : 38), dur: 0.34 });
        }
        break;
      case 'dash':
        if (f.dash) AttackFX.spawn(k, { follow: f, followAlive: () => !!f.dash, flip, w: U2(big ? 56 : 44), h: U2(big ? 56 : 44), dur: 1.2, loop: true, fps: 20, lift: 0.5 });
        break;
      case 'buff': {
        const e = nuevos.find((x) => x.k === 'ring');
        if (e) e._fxAF = true;
        const s = m.debuff ? Math.max(48, m.radius * 1.2) : 40;
        AttackFX.spawn(k, { follow: f, w: U2(s), h: U2(s), dur: 0.7, anchorBottom: true, lift: 0 });
        break;
      }
      case 'heal':
        AttackFX.spawn(k, { follow: f, w: U2(40), h: U2(40), dur: 0.8, anchorBottom: true, lift: 0 });
        break;
      case 'blink':
        AttackFX.spawn(k, { follow: f, w: U2(40), h: U2(40), dur: 0.5, anchorBottom: true, lift: 0 });
        break;
    }
    return r;
  };
  // los efectos de volumen que reemplaza el dibujo nuevo se ocultan (las partículas y luces siguen)
  const _sp = FX3D.syncProjs;
  FX3D.syncProjs = function (B, dt) {
    _sp.call(this, B, dt);
    for (const p of B.projs) if (p._fxAF && p._m3) { const D = p._m3.userData; if (D.core) D.core.visible = false; if (D.halo) D.halo.material.opacity *= 0.35; if (D.halo2) D.halo2.visible = false; }
  };
  const _sf = FX3D.syncFx;
  FX3D.syncFx = function (B) {
    _sf.call(this, B);
    for (const e of B.fx) if (e._fxAF && e._m3) e._m3.visible = false;
  };
}
