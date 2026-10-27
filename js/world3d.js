'use strict';
// ============================================================
//  MUNDO EN 3D (exteriores) — estilo "HD-2D"
//  - La lógica sigue en 2D (casillas, colisiones, IA). Solo cambia
//    el dibujo: 1 unidad 3D = 1 casilla; (x, y) del mapa -> (x, z).
//  - Suelo animado, edificios con volumen, árboles, personajes y
//    criaturas de pie, faroles con luz, agua, nubes y partículas.
//  - Si un edificio o un árbol te tapa, se vuelve transparente.
//  - Combate, interiores y cuevas siguen en 2D (fase 1).
//  - Opción "Gráficos: 3D / Clásico" en Opciones.
// ============================================================
if (Options.gfx3d === undefined) Options.gfx3d = true;
{
  const _save = Options.save;
  Options.save = function () {
    _save.call(this);
    try { const o = JSON.parse(localStorage.getItem(OPT_KEY) || '{}'); o.gfx3d = this.gfx3d !== false; localStorage.setItem(OPT_KEY, JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ }
  };
  try { const o = JSON.parse(localStorage.getItem(OPT_KEY) || '{}'); if (o.gfx3d !== undefined) Options.gfx3d = o.gfx3d; } catch (e) { /* sin almacenamiento */ }
}

const W3 = {
  PITCH: 50 * Math.PI / 180, DIST: 21, FOV: 32,
  SPR: 1.1,  // escala de personajes y criaturas
  TREE: 1.35, // escala de los árboles
};

const World3D = {
  ok: false, mapId: null, used: false, t: 0, frame: 0,
  init() {
    if (this.inited) return this.ok;
    this.inited = true;
    try {
      if (typeof THREE === 'undefined') return false;
      const cv = document.createElement('canvas');
      cv.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:0;display:none;image-rendering:auto';
      document.body.appendChild(cv);
      Engine.canvas.style.position = 'relative'; Engine.canvas.style.zIndex = '1';
      const r = new THREE.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: 'high-performance' });
      r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
      r.outputEncoding = THREE.LinearEncoding; r.physicallyCorrectLights = true;
      this.cv = cv; this.r = r;
      this.scene = new THREE.Scene();
      this.cam = new THREE.PerspectiveCamera(W3.FOV, WIDE / H, 0.1, 200);
      // luces
      this.sun = new THREE.DirectionalLight('#ffe6c0', 2.4);
      this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
      Object.assign(this.sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 });
      this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.02;
      this.scene.add(this.sun, this.sun.target);
      this.hemi = new THREE.HemisphereLight('#c8dcff', '#4a6a3a', 0.85); this.scene.add(this.hemi);
      this.pl = [];
      for (let i = 0; i < 8; i++) { const p = new THREE.PointLight('#ffc070', 0, 8, 1.5); this.scene.add(p); this.pl.push(p); }
      this.scene.fog = new THREE.Fog('#b8d4f0', 22, 46);
      this.root = new THREE.Group(); this.scene.add(this.root);
      this.target = new THREE.Vector3(); this.camT = null;
      this.initPost();
      this.ok = true;
    } catch (e) { console.warn('3D no disponible: ' + e.message); this.ok = false; }
    return this.ok;
  },
  // ---------- texturas ----------
  tex(canvas, repeat) {
    const t = new THREE.CanvasTexture(canvas);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    t.encoding = THREE.sRGBEncoding;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    return t;
  },
  crop(img, sx, sy, sw, sh) { const [c, x] = U.makeCanvas(sw, sh); x.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh); return c; },
  // ---------- pase final: profundidad de campo, brillo y color ----------
  initPost() {
    this.rt = new THREE.WebGLRenderTarget(4, 4, { samples: 4 });
    this.postScene = new THREE.Scene();
    this.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.post = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(1, 1) }, focus: { value: 0.42 }, dof: { value: 1 }, exposure: { value: 1 }, night: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: `
        uniform sampler2D tDiffuse; uniform vec2 res; uniform float focus; uniform float dof; uniform float exposure; uniform float night; varying vec2 vUv;
        vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0., 1.); }
        vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1./2.4))-0.055, step(vec3(0.0031308), c)); }
        void main(){
          float dy = vUv.y - focus;
          float blur = smoothstep(0.16, 0.55, abs(dy)) * (dy > 0. ? 3.2 : 1.8) * (res.x / 900.) * dof;
          vec3 col = texture2D(tDiffuse, vUv).rgb;
          if (blur > 0.05) {
            float w = 1.;
            for (int i = 1; i < 14; i++) { float a = float(i) * 2.39996; float r = sqrt(float(i)) / 3.6; col += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * r * blur / res).rgb; w += 1.; }
            col /= w;
          }
          vec3 bl = vec3(0.);
          for (int i = 0; i < 8; i++) { float a = float(i) * 0.785; bl += max(texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * 7. / res).rgb - 0.7, 0.); }
          col += bl * (0.1 + night * 0.25);
          col = aces(col * exposure);
          float l = dot(col, vec3(0.299, 0.587, 0.114));
          col = mix(col, col * vec3(0.9, 0.96, 1.12), (1. - l) * 0.3);
          col = mix(col, col * vec3(1.06, 1.0, 0.92), l * 0.25);
          col = mix(vec3(l), col, 1.12);
          vec2 q = vUv - 0.5; col *= 1. - dot(q, q) * 0.6;
          gl_FragColor = vec4(toSRGB(col), 1.);
        }`,
      depthTest: false, depthWrite: false,
    });
    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.post));
  },
  // ---------- construcción del mapa ----------
  // mancha oscura difuminada en el suelo bajo un volumen
  aoPatch(x, z, w, d) {
    if (!this.aoTex) {
      const [c, g] = U.makeCanvas(64, 64);
      const im = g.createImageData(64, 64);
      for (let y = 0; y < 64; y++) for (let i = 0; i < 64; i++) {
        const dx = Math.max(0, Math.abs(i - 31.5) - 22) / 10, dy = Math.max(0, Math.abs(y - 31.5) - 22) / 10, k = Math.max(0, 1 - Math.hypot(dx, dy));
        im.data[(y * 64 + i) * 4 + 3] = Math.round(k * k * 150);
      }
      g.putImageData(im, 0, 0);
      this.aoTex = new THREE.CanvasTexture(c); this.aoTex.shared = true;
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: this.aoTex, color: '#0a0812', transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.012, z); m.renderOrder = 1;
    return m;
  },
  // quién aparta la hierba y levanta polvo al andar
  syncPush(world) {
    const B = world.battle, movers = [];
    const add = (x, y, moving) => movers.push([x / 16, y / 16, moving]);
    if (B) { for (const f of B.fighters()) if (!f.inBall) add(f.x, f.y + 4, Math.hypot(f.vx, f.vy) > 10); if (B.trainer) add(B.trainer.x, B.trainer.y, true); }
    else {
      for (const e of world.entities()) if (!e.hidden && !e.gone) add(e.px + 8, e.py + 14, !!e.moving);
      for (const c of Critters.list) add(c.x, c.y + 2, c.state !== 'wander' || c.hop > 0.5);
    }
    // los más cercanos a la cámara
    const tg = this.target; movers.sort((a, b) => Math.hypot(a[0] - tg.x, a[1] - tg.z) - Math.hypot(b[0] - tg.x, b[1] - tg.z));
    if (this.pushU) this.pushU.value.forEach((v, i) => { const m = movers[i]; if (m) v.set(m[0], m[1], 1); else v.set(-99, -99, 0); });
    // polvo al caminar por caminos y arena (y salpicaduras en la hierba alta)
    this.dust = this.dust || [];
    for (const [x, z, moving] of movers.slice(0, 6)) {
      if (!moving || Math.random() > 0.12) continue;
      const d = world.tileAt(Math.floor(x), Math.floor(z - 0.2));
      if (!d) continue;
      const col = d.t === 'path' || d.t === 'sand' ? '#d8c098' : d.t === 'ash' ? '#7a7078' : d.grass ? '#6ab848' : d.t === 'cave' ? '#a098a8' : null;
      if (col) this.dust.push({ x: x + (Math.random() - 0.5) * 0.3, y: 0.05, z: z + (Math.random() - 0.5) * 0.2, vy: 0.6 + Math.random() * 0.5, life: 0.5, col, leaf: !!d.grass });
    }
    for (const p of this.dust) { p.y += p.vy / 60; p.vy -= 1.6 / 60; p.life -= 1 / 60; }
    this.dust = this.dust.filter((p) => p.life > 0 && p.y > 0);
  },
  drawDust(ctx) {
    for (const p of this.dust || []) {
      const [x, y] = this.project(p.x, p.y, p.z);
      ctx.globalAlpha = Math.min(1, p.life * 2) * (p.leaf ? 0.9 : 0.55);
      P(ctx, Math.round(x), Math.round(y), p.leaf ? 1 : 2, p.leaf ? 2 : 2, p.col);
    }
    ctx.globalAlpha = 1;
  },
  // partículas del aire (mariposas, luciérnagas, hojas, pájaros, humo, polvo), proyectadas en 3D
  drawAir(ctx) {
    const H0 = { mariposa: 0.75, luciernaga: 0.6, hoja: 2.2, pajaro: 3.4, polvo: 0.9 };
    for (const p of Ambient.list) {
      let wx = p.x / 16, wy = H0[p.k] || 0.5, wz = p.y / 16;
      if (p.k === 'humo') {
        const c = this.chimney && this.chimney.get(p.b); if (!c) continue;
        wx = c[0] + (p.x - (p.b.x * 16 + p.b.w * 16 - 11)) / 16; wy = c[1] + (p.y0 - p.y) / 16; wz = c[2];
      }
      if (p.k === 'hoja') wy = Math.max(0.05, 2.6 - (p.ph * 0.9) % 2.6);
      if (p.k === 'mariposa') wy += Math.sin(p.ph * 3) * 0.15;
      const [x0, y0, z] = this.project(wx, wy, wz); if (z > 1 || x0 < -10 || x0 > WIDE + 10 || y0 < -10 || y0 > H + 10) continue;
      const x = Math.round(x0), y = Math.round(y0), fade = Math.min(1, p.life);
      ctx.globalAlpha = fade;
      if (p.k === 'mariposa') { const f = Math.sin(p.ph * 18) > 0; P(ctx, x - (f ? 3 : 1), y, f ? 3 : 1, 3, p.c); P(ctx, x + 1, y, f ? 3 : 1, 3, p.c); P(ctx, x, y, 1, 3, '#3a2a20'); }
      else if (p.k === 'luciernaga') { const on = 0.5 + 0.5 * Math.sin(p.ph * 3); ctx.globalAlpha = fade * on; P(ctx, x, y, 2, 2, '#f8ffa0'); ctx.globalAlpha = fade * on * 0.35; P(ctx, x - 2, y - 2, 6, 6, '#c8ff60'); }
      else if (p.k === 'hoja') { const s = Math.sin(p.ph * 3) > 0; P(ctx, x, y, s ? 3 : 2, s ? 2 : 3, p.c); }
      else if (p.k === 'pajaro') { const up = Math.sin(p.ph * 12) > 0; P(ctx, x, y, 2, 1, '#2a2a3a'); P(ctx, x - 3, y + (up ? -1 : 1), 3, 1, '#2a2a3a'); P(ctx, x + 2, y + (up ? -1 : 1), 3, 1, '#2a2a3a'); }
      else if (p.k === 'humo') { const k = 1 - p.life / p.max; ctx.globalAlpha = 0.4 * (1 - k) * Math.min(1, k * 5); pixCircle(ctx, x, y, Math.round(1.5 + k * 5), '#e8e4e8'); }
      else if (p.k === 'polvo') { ctx.globalAlpha = 0.4 * fade; P(ctx, x, y, 1, 1, '#d8c8b0'); }
    }
    ctx.globalAlpha = 1;
  },
  clear() {
    this.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { if (m.map && !m.map.shared) m.map.dispose(); m.dispose(); }); });
    this.root.clear();
    this.borderMats = []; this.chimney = new Map(); this.buildings = []; this.trees = []; this.props = []; this.lamps = []; this.items = []; this.sprites = new Map(); this.grass = [];
  },
  build(world) {
    const m = world.map;
    this.clear();
    this.mapId = m.id; this.layerRef = world.layer;
    this.mode = m.cave ? 'cave' : m.outdoor ? 'out' : 'in';
    const MW = m.w * 16, MH = m.h * 16;
    // suelo: terreno + objetos planos (puentes, muelles…); en interiores, baldosas sin muebles
    const [g, gx] = U.makeCanvas(MW, MH);
    if (this.mode === 'in') this.interiorFloor(world, gx);
    else {
      Terrain.render(m, gx, 0, 0, m.w - 1, m.h - 1);
      const FLAT = { bridge: 1, dock: 1, ladder: 1, cavemouth: 1, dngstairs: 1 };
      for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
        const d = world.tileAt(tx, ty); if (!d) continue;
        const o = OBJ_OF[d.t];
        if (o && FLAT[d.t]) gx.drawImage(Obj.get(o, 0, 0), tx * 16, ty * 16);
      }
    }
    this.gStatic = g;
    const [ga] = U.makeCanvas(MW, MH); ga.getContext('2d').drawImage(g, 0, 0);
    this.gAnim = ga; this.gTex = this.tex(ga);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), new THREE.MeshLambertMaterial({ map: this.gTex }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(m.w / 2, 0, m.h / 2); ground.receiveShadow = true;
    this.root.add(ground);
    // más allá del mapa: hierba oscura que se pierde en la bruma (en exteriores) o negro
    const far = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: this.mode === 'out' ? '#2f5a32' : '#050308' }));
    far.rotation.x = -Math.PI / 2; far.position.set(m.w / 2, -0.02, m.h / 2); far.receiveShadow = true; this.root.add(far);
    // capa de efectos 2D sobre el suelo (habilidades, cebos, recolección, avisos de combate)
    const [d] = U.makeCanvas(MW, MH);
    this.dCanvas = d; this.dTex = this.tex(d);
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), new THREE.MeshBasicMaterial({ map: this.dTex, transparent: true, depthWrite: false }));
    decal.rotation.x = -Math.PI / 2; decal.position.set(m.w / 2, 0.015, m.h / 2); decal.renderOrder = 1; this.root.add(decal);
    this.buildWater(world);
    if (this.mode === 'out') { this.buildClouds(m); for (const b of m.buildings) this.buildBuilding(b); this.buildCave(world, true); }
    if (this.mode === 'in') this.buildInterior(world);
    if (this.mode === 'cave') this.buildCave(world);
    this.buildTrees(world);
    this.buildProps(world);
    if (this.buildFlowers) this.buildFlowers(world);
    if (this.mode === 'out') this.buildMotes(m);
    this.camT = null;
  },
  // ---------- interiores ----------
  isWallT(t) { return t === 'wall' || t === 'wallwindow' || t === 'gymwall' || t === 'void'; },
  interiorFloor(world, gx) {
    const m = world.map;
    gx.fillStyle = '#050308'; gx.fillRect(0, 0, m.w * 16, m.h * 16);
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const d = TILEDEF[m.rows[ty][tx]] || TILEDEF['.'], v = Math.floor(hash2(tx, ty) * 3);
      if (this.isWallT(d.t)) continue;
      let t = d.t;
      // bajo los muebles: el suelo de alrededor
      if (d.solid && !d.water) {
        t = 'floor';
        for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) { const n = TILEDEF[(m.rows[ty + dy] || '')[tx + dx]]; if (n && !n.solid && !this.isWallT(n.t) && n.t !== 'mat' && n.t !== 'rug') { t = n.t; break; } }
      }
      gx.drawImage(Tiles.get(t, 0, v), tx * 16, ty * 16);
    }
  },
  buildInterior(world) {
    const m = world.map, WH = 2.3;
    const FLATTOP = { counter: 0.72, table: 0.56, bed: 0.42 };
    const TALLF = { shelf: 1.5, statue: 1.45, machine: 1.35, healer: 1.3, pc: 1.15, tv: 1.1, plant: 1.15 };
    const wallTex = {};
    const wallEm = {};
    const getWallTex = (t, v) => {
      const k = t + v; if (wallTex[k]) return wallTex[k];
      const tile = Tiles.get(t, 0, v), base = Tiles.get(t === 'wallwindow' ? 'wall' : t, 0, v);
      const [c, x] = U.makeCanvas(16, 37);
      if (t === 'gymwall') { for (let y = 0; y < 37; y += 16) x.drawImage(base, 0, y); }
      else {
        // papel pintado arriba, zócalo de madera abajo y la ventana a la altura de los ojos
        for (let y = 0; y < 32; y += 11) x.drawImage(base, 0, 0, 16, 11, 0, y, 16, 11);
        x.drawImage(base, 0, 11, 16, 5, 0, 32, 16, 5);
        x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, 31, 16, 1);
        if (t === 'wallwindow') {
          x.drawImage(tile, 0, 0, 16, 11, 0, 10, 16, 11);
          x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(2, 21, 12, 1); // sombra del alféizar
          const [e, ex] = U.makeCanvas(16, 37); ex.drawImage(tile, 4, 1, 8, 8, 4, 11, 8, 8); wallEm[k] = this.tex(e);
        }
        // moldura del techo
        x.fillStyle = U.shade(this.pick ? this.pick(base, 8, 12) : '#a07040', -0.1); x.fillRect(0, 0, 16, 2);
      }
      x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(0, 0, 16, 1);
      return (wallTex[k] = this.tex(c));
    };
    const capM = new THREE.MeshLambertMaterial({ color: '#3a2e30', transparent: true });
    const sample = (img, x, y) => { const c = img.getContext('2d'); for (let yy = y; yy >= 0; yy--) { const p = c.getImageData(x, yy, 1, 1).data; if (p[3] > 128) return "#" + [p[0], p[1], p[2]].map((q) => q.toString(16).padStart(2, "0")).join(""); } return '#8a6040'; };
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const d = TILEDEF[m.rows[ty][tx]] || TILEDEF['.'], v = Math.floor(hash2(tx, ty) * 3);
      if (this.isWallT(d.t)) {
        if (d.t === 'void') continue;
        const tex = getWallTex(d.t, v);
        const sideC = sample(Tiles.get(d.t === 'wallwindow' ? 'wall' : d.t, 0, v), 8, 4);
        const sideM = new THREE.MeshLambertMaterial({ color: U.shade(sideC, -0.25), transparent: true });
        const faceM = new THREE.MeshLambertMaterial({ map: tex, transparent: true, emissive: '#c8e0ff', emissiveIntensity: 0, emissiveMap: wallEm[d.t + v] || null });
        // la pared del fondo es alta; laterales y tabiques, a media altura (maqueta)
        const back = ty === 0, wh = back ? WH : 1.0;
        const box = new THREE.Mesh(new THREE.BoxGeometry(1, wh, 1), [sideM, sideM, back ? capM : this.mat(U.shade(sideC, -0.05)), sideM, back ? faceM : sideM, sideM]);
        box.position.set(tx + 0.5, wh / 2, ty + 0.5); box.castShadow = box.receiveShadow = true;
        this.root.add(box);
        this.buildings.push({ grp: box, mats: [sideM, faceM, capM], faceM: d.t === 'wallwindow' ? faceM : null, win: d.t === 'wallwindow', op: 1, x0: tx, x1: tx + 1, z0: ty, z1: ty + 1, top: wh, wallH: wh });
        continue;
      }
      if (!d.solid || d.water) continue;
      const img = Tiles.get(d.t, d.t === 'healer' || d.t === 'machine' ? 1 : 0, v);
      if (this.makeFurniture && this.makeFurniture(world, d.t, tx, ty, img)) continue;
      if (FLATTOP[d.t]) {
        // mueble bajo: bloque con la tapa dibujada
        const h = FLATTOP[d.t], topT = this.tex(img), sideC = sample(img, 8, 9);
        const sideM = new THREE.MeshLambertMaterial({ color: U.shade(sideC, -0.15) });
        const box = new THREE.Mesh(new THREE.BoxGeometry(1, h, 1), [sideM, sideM, new THREE.MeshLambertMaterial({ map: topT }), sideM, new THREE.MeshLambertMaterial({ map: topT, color: '#c8c0b8' }), sideM]);
        box.position.set(tx + 0.5, h / 2, ty + 0.5); box.castShadow = box.receiveShadow = true;
        this.root.add(box);
      } else {
        // mueble alto: de pie
        const s = TALLF[d.t] || 1.1, t = this.tex(img);
        const mesh = this.billMesh(t, 1.05 * Math.min(1.15, s), s, 0.06, { tilt: 0.3 });
        mesh.position.set(tx + 0.5, 0, ty + 0.92); this.root.add(mesh);
      }
    }
    // paredes laterales de la habitación (si el mapa no las tiene), como una maqueta abierta por delante
    const wallC = '#c8b8a0';
    for (const side of [0, 1]) {
      const col = side ? m.w - 1 : 0, has = m.rows.every((r) => this.isWallT((TILEDEF[r[col]] || {}).t));
      if (has) continue;
      const mat = new THREE.MeshLambertMaterial({ color: wallC, transparent: true });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.18, WH, m.h - 1), mat);
      wall.position.set(side ? m.w + 0.09 : -0.09, WH / 2, (m.h - 1) / 2 + 1); wall.castShadow = wall.receiveShadow = true;
      this.root.add(wall);
    }
    // zócalo delantero
    const lip = new THREE.Mesh(new THREE.BoxGeometry(m.w + 0.36, 0.22, 0.2), new THREE.MeshLambertMaterial({ color: '#5a4636' }));
    lip.position.set(m.w / 2, 0.11, m.h + 0.1); lip.receiveShadow = true; this.root.add(lip);
    // lámparas de techo (invisibles): luz cálida repartida por la sala
    this.ceil = [];
    for (let y = 2; y < m.h; y += 5) for (let x = 2; x < m.w; x += 5) this.ceil.push([x + 0.5, 2.6, y + 0.5]);
  },
  // ---------- cuevas y grietas ----------
  // agujero de visión: las rocas que tapan al jugador no se dibujan alrededor de él
  cutaway(mat) {
    this.cutU = this.cutU || { uP: { value: new THREE.Vector2(-99, -99) }, uS: { value: new THREE.Vector2(-999, -999) }, uR: { value: 60 } };
    const U3 = this.cutU;
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U3);
      sh.vertexShader = 'varying vec3 vW3;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvW3 = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform vec2 uP; uniform vec2 uS; uniform float uR; varying vec3 vW3;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n  if (vW3.z > uP.y + 0.35) { float dd = distance(gl_FragCoord.xy, uS); if (dd < uR * 0.75) discard; if (dd < uR && mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) < 1.0) discard; }');
    };
    return mat;
  },
  buildCave(world, cliffs) {
    const m = world.map, HC = cliffs ? 0.95 : 1.35;
    const isW = cliffs ? (x, y) => { const d = world.tileAt(x, y); return !!d && d.t === 'cliff'; } : (x, y) => { const d = world.tileAt(x, y); return !d || d.t === 'cavewall' || d.t === 'void'; };
    let any = false; for (let ty = 0; ty < m.h && !any; ty++) for (let tx = 0; tx < m.w; tx++) if (isW(tx, ty)) { any = true; break; }
    if (!any) return;
    const top = [], tuv = [], side = [], suv = [];
    const quad = (arr, uv, p, u) => { arr.push(...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[3]); uv.push(...u[0], ...u[1], ...u[2], ...u[0], ...u[2], ...u[3]); };
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      if (!isW(tx, ty)) continue;
      const x0 = tx, x1 = tx + 1, z0 = ty, z1 = ty + 1, h = HC + (hash2(tx, ty) - 0.5) * 0.25;
      const u0 = tx / m.w, u1 = (tx + 1) / m.w, v0 = 1 - ty / m.h, v1 = 1 - (ty + 1) / m.h;
      quad(top, tuv, [[x0, h, z0], [x0, h, z1], [x1, h, z1], [x1, h, z0]], [[u0, v0], [u0, v1], [u1, v1], [u1, v0]]);
      const hu = h / 1.4;
      if (!isW(tx, ty + 1)) quad(side, suv, [[x0, h, z1], [x0, 0, z1], [x1, 0, z1], [x1, h, z1]], [[tx, hu], [tx, 0], [tx + 1, 0], [tx + 1, hu]]);
      if (!isW(tx, ty - 1)) quad(side, suv, [[x1, h, z0], [x1, 0, z0], [x0, 0, z0], [x0, h, z0]], [[tx, hu], [tx, 0], [tx + 1, 0], [tx + 1, hu]]);
      if (!isW(tx - 1, ty)) quad(side, suv, [[x0, h, z0], [x0, 0, z0], [x0, 0, z1], [x0, h, z1]], [[ty, hu], [ty, 0], [ty + 1, 0], [ty + 1, hu]]);
      if (!isW(tx + 1, ty)) quad(side, suv, [[x1, h, z1], [x1, 0, z1], [x1, 0, z0], [x1, h, z0]], [[ty, hu], [ty, 0], [ty + 1, 0], [ty + 1, hu]]);
    }
    const mk = (pos, uv) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g; };
    // textura de roca para las paredes
    const [c, x] = U.makeCanvas(32, 32);
    const base = m.volcanic ? '#5a4038' : cliffs ? '#8a6a48' : '#5a5266';
    x.fillStyle = base; x.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 90; i++) { x.fillStyle = Math.random() < 0.5 ? U.shade(base, -0.25) : U.shade(base, 0.18); x.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 1 + Math.floor(Math.random() * 3), 1); }
    for (let y = 6; y < 32; y += 9) { x.fillStyle = U.shade(base, -0.35); x.fillRect(0, y, 32, 1); }
    const rock = this.tex(c, true);
    const sideM = this.cutaway(new THREE.MeshLambertMaterial({ map: rock, side: THREE.DoubleSide }));
    const topM = this.cutaway(new THREE.MeshLambertMaterial({ map: this.gTex, color: cliffs ? '#ffffff' : '#d8d0e0' }));
    const sides = new THREE.Mesh(mk(side, suv), sideM), tops = new THREE.Mesh(mk(top, tuv), topM);
    sides.castShadow = sides.receiveShadow = tops.receiveShadow = tops.castShadow = true;
    this.root.add(sides, tops);
  },
  buildWater(world) {
    const m = world.map, pos = [], uv = [];
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const d = world.tileAt(tx, ty); if (!d || !d.water) continue;
      const x0 = tx, x1 = tx + 1, z0 = ty, z1 = ty + 1;
      pos.push(x0, 0, z0, x0, 0, z1, x1, 0, z0, x1, 0, z0, x0, 0, z1, x1, 0, z1);
      uv.push(x0 / 4, z0 / 4, x0 / 4, z1 / 4, x1 / 4, z0 / 4, x1 / 4, z0 / 4, x0 / 4, z1 / 4, x1 / 4, z1 / 4);
    }
    if (!pos.length) return;
    // textura de destellos
    const [c, x] = U.makeCanvas(64, 64);
    x.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) { const px = Math.floor(Math.random() * 64), py = Math.floor(Math.random() * 64); x.globalAlpha = 0.4 + Math.random() * 0.6; x.fillRect(px, py, 2 + Math.floor(Math.random() * 3), 1); }
    const t = this.tex(c, true);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: '#a8dcff', map: t, transparent: true, opacity: 0.32, roughness: 0.12, metalness: 0.1, depthWrite: false });
    const w = new THREE.Mesh(geo, mat); w.position.y = 0.03; w.renderOrder = 2; w.receiveShadow = true;
    this.root.add(w); this.water = t;
  },
  // sombras de nubes que se desplazan
  buildClouds(m) {
    const [c, x] = U.makeCanvas(128, 128);
    for (let i = 0; i < 9; i++) {
      const cx = Math.random() * 128, cy = Math.random() * 128, r = 14 + Math.random() * 22;
      for (const [ox, oy] of [[0, 0], [128, 0], [0, 128], [-128, 0], [0, -128]]) { const gr = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); gr.addColorStop(0, 'rgba(0,0,0,0.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); }
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(m.w / 30, m.h / 30);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(m.w + 20, m.h + 20), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.13, depthWrite: false, color: '#10183a' }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(m.w / 2, 0.05, m.h / 2); mesh.renderOrder = 3;
    this.root.add(mesh); this.clouds = { t, mesh };
  },
  // ---------- edificios ----------
  buildBuilding(b) {
    const img = Buildings.get(b.style, b.w, b.h, b.door), Wp = img.width, Hp = img.height;
    const rh = Math.round(Hp * (b.h >= 5 ? 0.5 : 0.56));
    const wd = Wp / 16, depth = Math.max(2, b.h * 0.72), hgt = ((Hp - rh) / 16) * 1.22;
    const front = b.y + b.h - 0.02, cx = b.x + wd / 2, cz = front - depth / 2;
    const grp = new THREE.Group(), mats = [];
    const wallRGB = img.getContext('2d').getImageData(3, Math.min(Hp - 4, rh + 5), 1, 1).data;
    const wallCol = "#" + [wallRGB[0], wallRGB[1], wallRGB[2]].map((q) => q.toString(16).padStart(2, "0")).join("");
    // muro lateral con hiladas
    const [sw, sx] = U.makeCanvas(16, 16);
    sx.fillStyle = wallCol; sx.fillRect(0, 0, 16, 16);
    sx.fillStyle = U.shade(wallCol, -0.12); for (let y = 3; y < 16; y += 4) sx.fillRect(0, y, 16, 1);
    for (let y = 0; y < 16; y += 4) sx.fillRect(((y / 4) % 2) * 8, y, 1, 3);
    const sideT = this.tex(sw, true); sideT.repeat.set(depth, hgt);
    const sideM = new THREE.MeshLambertMaterial({ map: sideT, transparent: true }); mats.push(sideM);
    // fachada (con ventanas que brillan de noche)
    const facade = this.crop(img, 0, rh, Wp, Hp - rh);
    const [em, ex] = U.makeCanvas(Wp, Hp - rh);
    ex.fillStyle = '#ffd070';
    for (const w of img.windows || []) { const y = w.y - rh; if (y + w.h > 0) ex.fillRect(w.x, Math.max(0, y), w.w, w.h); }
    const faceM = new THREE.MeshLambertMaterial({ map: this.tex(facade), emissive: '#ffffff', emissiveMap: this.tex(em), emissiveIntensity: 0, transparent: true }); mats.push(faceM);
    const box = new THREE.Mesh(new THREE.BoxGeometry(wd, hgt, depth), [sideM, sideM, sideM, sideM, faceM, sideM]);
    box.position.set(cx, hgt / 2, cz); box.castShadow = box.receiveShadow = true; grp.add(box);
    // zócalo de piedra
    const baseM = new THREE.MeshLambertMaterial({ color: '#6a6470', transparent: true }); mats.push(baseM);
    const base = new THREE.Mesh(new THREE.BoxGeometry(wd + 0.12, 0.16, depth + 0.12), baseM);
    base.position.set(cx, 0.08, cz); base.castShadow = base.receiveShadow = true; grp.add(base);
    // tejado a dos aguas con alero; la mitad inferior de la imagen en la vertiente delantera
    const roofT = this.tex(this.crop(img, 0, 0, Wp, rh));
    const rise = depth * 0.42, x0 = cx - wd / 2 - 0.18, x1 = cx + wd / 2 + 0.18, zf = front + 0.22, zb = front - depth - 0.22, zm = (zf + zb) / 2, y0 = hgt - 0.06, y1 = hgt + rise;
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.Float32BufferAttribute([x0, y0, zf, x1, y0, zf, x1, y1, zm, x0, y1, zm, x0, y1, zm, x1, y1, zm, x1, y0, zb, x0, y0, zb], 3));
    rg.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 0.5, 0, 0.5, 0, 0.5, 1, 0.5, 1, 1, 0, 1], 2));
    rg.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]); rg.computeVertexNormals();
    const roofM = new THREE.MeshLambertMaterial({ map: roofT, side: THREE.DoubleSide, transparent: true }); mats.push(roofM);
    const roof = new THREE.Mesh(rg, roofM); roof.castShadow = roof.receiveShadow = true; grp.add(roof);
    // cumbrera
    const ridgeM = new THREE.MeshLambertMaterial({ color: U.shade(wallCol, -0.55), transparent: true }); mats.push(ridgeM);
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 0.04, 0.1, 0.16), ridgeM); ridge.position.set(cx, y1 + 0.02, zm); ridge.castShadow = true; grp.add(ridge);
    // hastiales
    const tri = new THREE.Shape(); tri.moveTo(-depth / 2, 0); tri.lineTo(depth / 2, 0); tri.lineTo(0, rise); tri.lineTo(-depth / 2, 0);
    for (const s of [-1, 1]) { const gm = new THREE.Mesh(new THREE.ShapeGeometry(tri), sideM); gm.rotation.y = s * Math.PI / 2; gm.position.set(cx + s * wd / 2, hgt - 0.01, cz); gm.castShadow = true; grp.add(gm); }
    // farolillo junto a la puerta
    this.root.add(grp);
    const doorX = b.x + (b.door !== undefined ? b.door : Math.floor(b.w / 2)) + 0.5;
    // sombra de contacto alrededor de la base (oclusión ambiental)
    this.root.add(this.aoPatch(cx, cz, wd + 0.9, depth + 0.9));
    if (b.style.startsWith('house')) {
      const chx = b.x + wd - 0.9, chz = zm + depth * 0.2, chM = new THREE.MeshLambertMaterial({ color: '#9a5a48', transparent: true }); mats.push(chM);
      const ch = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.95, 0.36), chM); ch.position.set(chx, y1 - 0.1, chz); ch.castShadow = true; grp.add(ch);
      const capM2 = new THREE.MeshLambertMaterial({ color: '#5a3a30', transparent: true }); mats.push(capM2);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.42), capM2); cap.position.set(chx, y1 + 0.39, chz); grp.add(cap);
      this.chimney = this.chimney || new Map(); this.chimney.set(b, [chx, y1 + 0.45, chz]);
    }
    this.buildings.push({ b, grp, mats, faceM, op: 1, x0: cx - wd / 2, x1: cx + wd / 2, z0: front - depth, z1: front, top: y1, wallH: hgt, door: [doorX, front + 0.4] });
  },
  // ---------- árboles ----------
  treeTex(v) {
    this.treeT = this.treeT || {};
    if (this.treeT[v]) return this.treeT[v];
    const can = Canopy.get(v), [c, x] = U.makeCanvas(26, 34);
    x.drawImage(Obj.get('trunk', 0, 0), 5, 16); x.drawImage(can, 0, 0);
    const t = this.tex(c); t.shared = true;
    return (this.treeT[v] = t);
  },
  billMesh(tex, w, h, footY, opts = {}) {
    const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2 - footY, 0);
    const m = opts.mat || new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, transparent: !!opts.fade });
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = opts.shadow !== false;
    mesh.customDepthMaterial = opts.depth || new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    mesh.rotation.x = -W3.PITCH * (opts.tilt !== undefined ? opts.tilt : 0.55);
    return mesh;
  },
  // árboles instanciados por variante; el viento los mece en el shader
  buildTrees(world) {
    const m = world.map, byV = {};
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const d = world.tileAt(tx, ty); if (!d || !d.canopy) continue;
      const v = Math.floor(hash2(tx * 7, ty * 3) * 7), s = W3.TREE * (0.92 + hash2(tx, ty * 5) * 0.2);
      // árbol del borde inferior: debajo de él solo hay más árboles (o el final del mapa)
      let border = ty >= m.h - 4; for (let y = ty + 1; y < m.h; y++) { const b = world.tileAt(tx, y); if (!b || !(b.canopy || b.solid)) { border = false; break; } }
      const T = { v, x: tx + 0.5 + (hash2(tx * 3, ty) - 0.5) * 0.15, z: ty + 0.85, s, op: 1, border };
      const key = v + (border ? 'b' : ''); (byV[key] = byV[key] || []).push(T); if (!border) this.trees.push(T);
    }
    this.windU = this.windU || { value: 0 };
    const wind = (mat) => { mat.onBeforeCompile = (sh) => { sh.uniforms.uWind = this.windU; sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x += sin(uWind * 1.3 + instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 0.9) * 0.035 * max(position.y, 0.0);\n#endif'); }; return mat; };
    const o = new THREE.Object3D();
    for (const v in byV) {
      const list = byV[v], tex = this.treeTex(parseInt(v, 10)), border = v.endsWith('b');
      const g = new THREE.PlaneGeometry(26 / 16, 34 / 16); g.translate(0, 17 / 16 - 2 / 16, 0);
      const mat = wind(new THREE.MeshLambertMaterial({ map: tex, alphaTest: border ? 0.05 : 0.5, side: THREE.DoubleSide, color: '#d4e2cc', transparent: border, opacity: border ? 0.2 : 1, depthWrite: !border }));
      const depth = wind(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 }));
      if (border) (this.borderMats = this.borderMats || []).push(mat);
      const inst = new THREE.InstancedMesh(g, mat, list.length);
      inst.customDepthMaterial = depth; inst.castShadow = true;
      list.forEach((T, i) => { o.position.set(T.x, 0, T.z); o.rotation.set(-W3.PITCH * 0.35, 0, 0); o.scale.set(T.s, T.s, T.s); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); T.inst = inst; T.i = i; T.matrix = o.matrix.clone(); });
      this.root.add(inst);
    }
  },
  grassTex(c) {
    const key = c.join(); this.gtx = this.gtx || {}; if (this.gtx[key]) return this.gtx[key];
    const [cv, x] = U.makeCanvas(20, 26);
    const blades = 9;
    for (let i = 0; i < blades; i++) {
      const bx = 1 + Math.round((i / (blades - 1)) * 17), hgt = 14 + Math.round(hash2(i * 7, 3) * 11), lean = (hash2(i, 9) - 0.5) * 6;
      for (let y = 0; y < hgt; y++) {
        const k = y / hgt, px = Math.round(bx + lean * k * k), py = 25 - y;
        const col = k < 0.25 ? c[0] : k < 0.55 ? c[1] : k < 0.85 ? c[2] : c[3];
        x.fillStyle = '#1c4a1e'; x.fillRect(px - 1, py, 1, 1); if (k < 0.8) x.fillRect(px + 2, py, 1, 1);
        x.fillStyle = col; x.fillRect(px, py, k < 0.8 ? 2 : 1, 1);
      }
    }
    const t = this.tex(cv); t.shared = true;
    return (this.gtx[key] = t);
  },
  // mata de hierba en abanico (vista de frente): hojas que salen de la base, con raíz oscura y puntas claras
  grassClump(c, v) {
    const key = c.join() + v; this.gcl = this.gcl || {}; if (this.gcl[key]) return this.gcl[key];
    const Wd = 28, Ht = 30, [cv, x] = U.makeCanvas(Wd, Ht);
    let s = 7 + v * 31; const rnd = () => { s = (s * 16807) % 2147483647; return (s % 1000) / 1000; };
    const blades = 13 + v * 2;
    const order = [];
    for (let i = 0; i < blades; i++) order.push(i);
    order.sort(() => rnd() - 0.5);
    for (const i of order) {
      const base = Wd / 2 + (i / (blades - 1) - 0.5) * 12, spread = (i / (blades - 1) - 0.5) * (14 + rnd() * 8), hgt = 13 + rnd() * 15, bend = (rnd() - 0.5) * 6;
      const shade = rnd();
      for (let y = 0; y < hgt; y++) {
        const k = y / hgt, px = Math.round(base + spread * k + bend * k * k), py = Ht - 1 - y;
        if (px < 1 || px >= Wd - 1) continue;
        const col = k < 0.22 ? c[0] : k < 0.5 ? c[1] : k < 0.82 ? c[2] : c[3];
        const w = k < 0.55 ? 2 : 1;
        x.fillStyle = '#123a16'; x.fillRect(px - 1, py, 1, 1);
        x.fillStyle = shade < 0.3 ? U.shade(col, -0.12) : shade > 0.8 ? U.shade(col, 0.08) : col; x.fillRect(px, py, w, 1);
      }
    }
    // algunas espigas / semillas en las puntas
    for (let i = 0; i < 3; i++) { const px = 6 + Math.floor(rnd() * 16), py = 2 + Math.floor(rnd() * 6); x.fillStyle = c[3]; x.fillRect(px, py, 1, 2); x.fillStyle = '#e8f0a0'; x.fillRect(px, py, 1, 1); }
    const t = this.tex(cv); t.shared = true;
    return (this.gcl[key] = t);
  },
  // ---------- objetos de pie, faroles y hierba alta ----------
  buildProps(world) {
    const m = world.map, FLAT = { bridge: 1, dock: 1, ladder: 1, cavemouth: 1, tree: 1, dngstairs: 1 };
    this.propT = this.propT || {};
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const d = world.tileAt(tx, ty); if (!d) continue;
      const o = OBJ_OF[d.t];
      if ((o && !FLAT[d.t]) || d.t === 'hedge') {
        if (this.makeProp && this.makeProp(world, d.t, tx, ty)) continue;
        if (!o) continue;
        const key = o; if (!this.propT[key]) { this.propT[key] = this.tex(Obj.get(o, 0, 0)); this.propT[key].shared = true; }
        const mesh = this.billMesh(this.propT[key], 1.05, 1.05, 0.08, { tilt: 0.5 });
        mesh.position.set(tx + 0.5, 0, ty + 0.92); this.root.add(mesh);
        this.props.push({ mesh, tx, ty, t: d.t });
      }
      if (d.t === 'lamp' || d.t === 'ashlamp') this.buildLamp(tx, ty);
      if (d.grass) this.grass.push([tx, ty]);
    }
    // matas de hierba alta (de pie, se mecen con el viento)
    if (this.grass.length) {
      // textura de mata: hojas finas con base oscura y puntas claras, con contorno
      const volc = !!world.map.volcanic;
      const gt = this.grassTex(volc ? ['#2a4a20', '#4a7a2a', '#8ab040', '#c8e070'] : ['#2e6e2c', '#4aa43c', '#76cc4c', '#d0f488']);
      const gm = new THREE.MeshLambertMaterial({ map: gt, alphaTest: 0.5, side: THREE.DoubleSide });
      // viento y apartarse al paso de personajes y criaturas (hasta 6 a la vez)
      this.windU = this.windU || { value: 0 };
      this.pushU = this.pushU || { value: Array.from({ length: 6 }, () => new THREE.Vector3(-99, -99, 0)) };
      gm.onBeforeCompile = (sh) => {
        sh.uniforms.uWind = this.windU; sh.uniforms.uPush = this.pushU;
        sh.vertexShader = 'uniform float uWind; uniform vec3 uPush[6];' + String.fromCharCode(10) + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
vec2 base = instanceMatrix[3].xz; float hgt = max(position.y, 0.0);
transformed.x += sin(uWind * 1.8 + base.x * 1.3 + base.y * 0.7) * 0.06 * hgt;
for (int i = 0; i < 6; i++) { vec2 d = base - uPush[i].xy; float l = length(d); float k = uPush[i].z * max(0.0, 1.0 - l / 0.9); transformed.x += (d.x / (l + 0.01)) * k * 0.35 * hgt; transformed.y -= k * 0.25 * hgt; }
#endif`);
      };
      // cada casilla: 9 matas de frente a la cámara (nunca se ven de canto), en tres variantes
      const cols = volc ? ['#2a4a20', '#4a7a2a', '#8ab040', '#c8e070'] : ['#2e6e2c', '#4aa43c', '#76cc4c', '#d0f488'];
      const geo = new THREE.PlaneGeometry(0.62, 0.66); geo.translate(0, 0.31, 0);
      const meshes = [0, 1, 2].map((v) => {
        const m = gm.clone(); m.map = this.grassClump(cols, v); m.onBeforeCompile = gm.onBeforeCompile;
        const inst = new THREE.InstancedMesh(geo, m, this.grass.length * 9); inst.count = 0; inst.castShadow = true; return inst;
      });
      const o = new THREE.Object3D(), tint = new THREE.Color();
      for (const [tx, ty] of this.grass) {
        for (let c = 0; c < 9; c++) {
          const gx = c % 3, gz = Math.floor(c / 3);
          const cx = tx + 0.18 + gx * 0.32 + (gz % 2) * 0.12 + (hash2(tx * 3 + c, ty) - 0.5) * 0.12, cz = ty + 0.22 + gz * 0.3 + (hash2(tx, ty * 3 + c) - 0.5) * 0.1;
          const h = 0.8 + hash2(tx * 7 + c, ty * 5) * 0.45, v = Math.floor(hash2(tx * 11 + c, ty * 13) * 3), inst = meshes[v];
          o.position.set(cx, 0, cz); o.rotation.set(-W3.PITCH * 0.22, (hash2(c, tx * ty) - 0.5) * 0.6, 0); o.scale.set(0.9 + hash2(tx, c) * 0.3, h, 1); o.updateMatrix();
          inst.setMatrixAt(inst.count, o.matrix);
          const l = 0.9 + hash2(tx * 5 + c, ty * 9) * 0.22; tint.setRGB(l * (0.95 + hash2(c, tx) * 0.1), l * 1.03, l * 0.9); inst.setColorAt(inst.count, tint);
          inst.count++;
        }
      }
      for (const inst of meshes) this.root.add(inst);
      this.grassMesh = meshes[0];
    }
    // objetos del suelo (esferas)
    for (const it of m.items || []) {
      const t = this.tex(Icons.sphere('esfera', 12));
      const mesh = this.billMesh(t, 0.75, 0.75, 0, { tilt: 0.5 });
      mesh.position.set(it.x + 0.5, 0.1, it.y + 0.75); this.root.add(mesh);
      this.items.push({ mesh, it });
    }
  },
  buildLamp(tx, ty) {
    const grp = new THREE.Group();
    const dark = new THREE.MeshLambertMaterial({ color: '#2e2c3a' });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.25, 6), dark); post.position.y = 0.62; post.castShadow = true;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.12, 6), dark); foot.position.y = 0.06;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.14, 4), dark); cap.position.y = 1.5; cap.rotation.y = Math.PI / 4;
    const glassM = new THREE.MeshLambertMaterial({ color: '#fff0c0', emissive: '#ffcc66', emissiveIntensity: 0.2 });
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.2), glassM); glass.position.y = 1.33;
    grp.add(post, foot, cap, glass); grp.position.set(tx + 0.5, 0, ty + 0.7);
    this.root.add(grp);
    this.lamps.push({ x: tx + 0.5, z: ty + 0.7, glassM });
  },
  // partículas: polen de día, luciérnagas de noche
  buildMotes(m) {
    const n = Math.round(m.w * m.h / 6), pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = Math.random() * m.w; pos[i * 3 + 1] = 0.3 + Math.random() * 2.5; pos[i * 3 + 2] = Math.random() * m.h; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const [c, x] = U.makeCanvas(8, 8); const gr = x.createRadialGradient(4, 4, 0, 4, 4, 4); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 8, 8);
    const mat = new THREE.PointsMaterial({ size: 0.12, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, color: '#fff8d0', blending: THREE.AdditiveBlending, opacity: 0.6 });
    this.motes = new THREE.Points(g, mat); this.root.add(this.motes); this.moteBase = pos.slice();
  },
  // ---------- sprites dinámicos (personajes, criaturas) ----------
  sprite(key, w, h, footY, res = 1) {
    let s = this.sprites.get(key);
    if (!s) {
      const [c, x] = U.makeCanvas(w * res, h * res); x.imageSmoothingEnabled = false;
      const t = this.tex(c);
      const mesh = this.billMesh(t, (w / 16) * W3.SPR, (h / 16) * W3.SPR, ((h - footY) / 16) * W3.SPR, { tilt: 0.6 });
      this.root.add(mesh);
      s = { c, x, t, mesh, seen: 0, res };
      this.sprites.set(key, s);
    }
    s.seen = this.frame;
    return s;
  },
  syncSprites(world) {
    const _sh = drawShadow;
    drawShadow = function () {};
    try {
      for (const e of world.entities()) {
        if (e.hidden || e.gone) continue;
        // personas y compañero a doble resolución (sprites HD)
        const s = this.sprite(e, 64, 72, 58, 2);
        s.x.setTransform(1, 0, 0, 1, 0, 0); s.x.clearRect(0, 0, 128, 144); s.x.setTransform(2, 0, 0, 2, 0, 0);
        World.hiDraw = true;
        try { world.drawEntity(s.x, e, e.px - 24, e.py - 44); } finally { World.hiDraw = false; s.x.setTransform(1, 0, 0, 1, 0, 0); }
        s.t.needsUpdate = true;
        s.mesh.position.set((e.px + 8) / 16, 0, (e.py + 14) / 16);
        s.mesh.visible = true;
      }
      // criaturas salvajes del mapa
      const list = Critters.list, baits = Critters.baits;
      for (const c of list) {
        if (c.ambush && c.state === 'wander') continue;
        const s = this.sprite(c, 80, 80, 66);
        s.x.clearRect(0, 0, 80, 80);
        Critters.list = [c]; if (baits) Critters.baits = [];
        Critters.draw(s.x, c.x - 40, c.y - 64, world);
        Critters.list = list; if (baits) Critters.baits = baits;
        s.t.needsUpdate = true;
        s.mesh.position.set(c.x / 16, 0, (c.y + 2) / 16);
        s.mesh.visible = true;
      }
      Critters.list = list; if (baits) Critters.baits = baits;
      // combate: ánimas luchando y entrenador
      const B = world.battle;
      if (B) {
        for (const f of B.fighters()) {
          if (f.inBall) continue;
          const s = this.sprite(f, 160, 160, 132);
          s.x.clearRect(0, 0, 160, 160);
          s.x.save(); s.x.translate(80 - f.x, 132 - (f.y + 4)); B.drawFighter(s.x, f); s.x.restore();
          s.t.needsUpdate = true;
          s.mesh.position.set(f.x / 16, 0, (f.y + 4) / 16);
        }
        if (B.trainer && B.drawTrainer) {
          const T = B.trainer, s = this.sprite(T, 64, 72, 60, 2);
          s.x.setTransform(1, 0, 0, 1, 0, 0); s.x.clearRect(0, 0, 128, 144);
          s.x.setTransform(2, 0, 0, 2, (32 - T.x) * 2, (60 - T.y) * 2); World.hiDraw = true;
          try { B.drawTrainer(s.x); } finally { World.hiDraw = false; s.x.setTransform(1, 0, 0, 1, 0, 0); }
          s.t.needsUpdate = true;
          s.mesh.position.set(T.x / 16, 0, T.y / 16);
        }
      }
    } finally { drawShadow = _sh; }
    // retirar los que ya no están
    for (const [k, s] of this.sprites) if (s.seen !== this.frame) { this.root.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); s.t.dispose(); this.sprites.delete(k); }
  },
  // efectos 2D sobre el suelo
  syncDecal(world) {
    const x = this.dCanvas.getContext('2d'), [px, py] = this.centerPx(world), B = world.battle;
    const wx = Math.max(0, Math.round(px - 320)), wy = Math.max(0, Math.round(py - 240));
    x.clearRect(0, 0, this.dCanvas.width, this.dCanvas.height);
    const oldW = W, oldCam = world.cam; W = 640;
    try {
      for (const oy of [0, 240]) {
        x.save(); x.translate(wx, wy + oy);
        Ambient.draw(x, wx, wy + oy, 'ground');
        if (world.drawTerrainFX) world.drawTerrainFX(x, wx, wy + oy);
        if (Critters.baits && Critters.baits.length) { const l = Critters.list; Critters.list = []; Critters.draw(x, wx, wy + oy, world); Critters.list = l; }
        // combate: arena, zonas de aviso, anillos y auras se pintan sobre el suelo
        if (B && B.drawGroundLayer) { world.cam = [wx, wy + oy]; B.drawGroundLayer(x, wx, wy + oy); }
        x.restore();
      }
    } finally { W = oldW; world.cam = oldCam; }
    this.dTex.needsUpdate = true;
  },
  syncGround(world) {
    const x = this.gAnim.getContext('2d'), [ppx, ppy] = this.centerPx(world), p = { px: ppx, py: ppy }, L = world.lightLevel();
    const wx = Math.max(0, Math.round(p.px - 320)), wy = Math.max(0, Math.round(p.py - 260));
    x.drawImage(this.gStatic, wx, wy, 640, 520, wx, wy, 640, 520);
    const keep = world.animTiles;
    world.animTiles = keep.filter((a) => a[2] !== 'lamp' && a[2] !== 'ashlamp' && a[2] !== 'tallgrass' && a[2] !== 'healer' && a[2] !== 'machine');
    const oldW = W; W = 640;
    try {
      for (const oy of [0, 240, 480]) { x.save(); x.translate(wx, wy + oy); world.drawAnimTiles(x, wx, wy + oy, L); x.restore(); }
    } finally { W = oldW; world.animTiles = keep; }
    // la hierba alta se pinta sin animar en el suelo (las matas de pie la cubren)
    for (const [tx, ty] of this.grass) if (Math.abs(tx * 16 - p.px) < 340 && Math.abs(ty * 16 - p.py) < 280) { x.drawImage(Tiles.get('tallgrass', 0, Math.floor(hash2(tx, ty) * 3)), tx * 16, ty * 16); x.fillStyle = 'rgba(8,30,10,0.18)'; x.fillRect(tx * 16, ty * 16, 16, 16); }
    this.gTex.needsUpdate = true;
  },
  // ---------- transparencias por oclusión ----------
  project(x, y, z) { const v = new THREE.Vector3(x, y, z).project(this.cam); return [(v.x + 1) / 2 * WIDE, (1 - v.y) / 2 * H, v.z]; },
  occlusion(world) {
    const who = []; const B = world.battle;
    if (!(B && B.hidePlayer)) who.push([(world.player.px + 8) / 16, (world.player.py + 14) / 16]);
    if (!world.follower.hidden && !B) who.push([(world.follower.px + 8) / 16, (world.follower.py + 14) / 16]);
    if (B) {
      for (const f of B.fighters()) if (!f.inBall) who.push([f.x / 16, (f.y + 4) / 16]);
      if (B.trainer) who.push([B.trainer.x / 16, B.trainer.y / 16]);
    }
    const pts = who.map(([x, z]) => ({ x, z, s: this.project(x, 0.6, z) }));
    for (const B of this.buildings) {
      let hide = false;
      for (const p of pts) {
        if (p.z >= B.z1 - 0.1 || p.x < B.x0 - 0.6 || p.x > B.x1 + 0.6) continue;
        // ¿el edificio cubre al personaje en pantalla?
        const mx = (B.x0 + B.x1) / 2, zm = (B.z0 + B.z1) / 2;
        const top = Math.min(this.project(mx, B.top, zm)[1], this.project(mx, B.wallH, B.z0 - 0.2)[1]), bot = this.project(mx, 0, B.z1)[1];
        if (p.s[1] > top + 2 && p.s[1] < bot + 4) hide = true;
      }
      const goal = hide ? 0.28 : 1;
      B.op += (goal - B.op) * 0.18;
      for (const m of B.mats) m.opacity = B.op;
      B.grp.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    }
    for (const T of this.trees) {
      let hide = false;
      for (const p of pts) if (T.z > p.z + 0.05 && T.z < p.z + 3 && Math.abs(T.x - p.x) < 1.6) hide = true;
      if (!hide && T.op >= 1 && !T.ghost) continue;
      T.op = Math.min(1, T.op + ((hide ? 0.35 : 1) - T.op) * 0.2 + (hide ? 0 : 0.005));
      // mientras está transparente se oculta su instancia y se dibuja aparte
      if (!T.ghost) {
        const mat = new THREE.MeshLambertMaterial({ map: T.inst.material.map, alphaTest: 0.05, side: THREE.DoubleSide, transparent: true, depthWrite: false });
        T.ghost = new THREE.Mesh(T.inst.geometry, mat); T.ghost.matrixAutoUpdate = false; T.ghost.matrix.copy(T.matrix); this.root.add(T.ghost);
        T.inst.setMatrixAt(T.i, new THREE.Matrix4().makeScale(0, 0, 0)); T.inst.instanceMatrix.needsUpdate = true;
      }
      T.ghost.material.opacity = T.op;
      if (T.op >= 0.995 && !hide) {
        this.root.remove(T.ghost); T.ghost.material.dispose(); T.ghost = null; T.op = 1;
        T.inst.setMatrixAt(T.i, T.matrix); T.inst.instanceMatrix.needsUpdate = true;
      }
    }
  },
  // ---------- luz del día y de la noche ----------
  syncLight(world) {
    if (this.mode !== 'out') return this.syncLightInside(world);
    const L = world.lightLevel(), a = U.clamp(L.a / 0.75, 0, 1);
    const night = a, rain = Weather.isRain(Weather.at(world.map));
    const dayFog = rain ? '#8a98a8' : '#b8d4f0', nightFog = '#0c1430';
    const fog = new THREE.Color(dayFog).lerp(new THREE.Color(nightFog), night);
    if (L.tint && L.ta) fog.lerp(new THREE.Color(L.tint), Math.min(0.5, L.ta * 1.5));
    this.scene.fog.color.copy(fog); this.scene.background = fog; this.scene.fog.near = 22; this.scene.fog.far = 46; this.hemi.groundColor.set('#4a6a3a');
    this.sun.intensity = U.lerp(rain ? 1.3 : 2.4, 0.22, night);
    this.sun.color.set('#ffe6c0').lerp(new THREE.Color('#8aa0ff'), night);
    if (L.tint && L.ta) this.sun.color.lerp(new THREE.Color(L.tint), Math.min(0.75, L.ta * 3));
    this.hemi.intensity = U.lerp(0.85, 0.26, night);
    this.hemi.color.set('#c8dcff').lerp(new THREE.Color('#3a4a90'), night);
    this.post.uniforms.exposure.value = U.lerp(1.0, 1.05, night);
    this.post.uniforms.night.value = night;
    for (const B of this.buildings) B.faceM.emissiveIntensity = night * 1.4;
    for (const l of this.lamps) l.glassM.emissiveIntensity = 0.2 + night * 2;
    // luces puntuales: los faroles y puertas más cercanos a la cámara
    const tg = this.target, srcs = this.lamps.map((l) => [l.x, 1.35, l.z, 1]).concat(this.buildings.map((B) => [B.door[0], 0.9, B.door[1], 0.6]));
    // en combate, las ánimas de fuego y eléctricas iluminan su alrededor (van primero)
    const glow = [];
    if (world.battle) for (const f of world.battle.fighters()) if (!f.inBall && (f.types.includes("fuego") || f.types.includes("electrico"))) glow.push([f.x / 16, 0.8, f.y / 16, 0.9]);
    srcs.sort((p, q) => Math.hypot(p[0] - tg.x, p[2] - tg.z) - Math.hypot(q[0] - tg.x, q[2] - tg.z));
    srcs.unshift(...glow);
    this.pl.forEach((p, i) => { const s = srcs[i]; if (!s || night < 0.05) { p.intensity = 0; return; } p.position.set(s[0], s[1], s[2]); p.color.set('#ffc070'); p.distance = 8; p.intensity = night * 7 * s[3]; });
    if (this.motes) { this.motes.material.color.set(night > 0.5 ? '#c8ff80' : '#fff8d0'); this.motes.material.size = night > 0.5 ? 0.16 : 0.1; this.motes.material.opacity = night > 0.5 ? 0.9 : 0.45; }
    this.night = night;
  },
  // interiores (luz cálida de techo, ventanas con luz de día) y cuevas (oscuridad y antorcha)
  syncLightInside(world) {
    const night = U.clamp(Clock.light().a / 0.75, 0, 1), cave = this.mode === 'cave', B = world.battle;
    const bg = new THREE.Color(cave ? '#020104' : '#050308');
    this.scene.background = bg; this.scene.fog.color.copy(bg);
    this.scene.fog.near = cave ? 18 : 40; this.scene.fog.far = cave ? 34 : 90;
    this.sun.intensity = cave ? 0.35 : 1.5; this.sun.color.set(cave ? '#7080c0' : '#fff0dc');
    this.hemi.intensity = cave ? 0.75 : 0.95; this.hemi.color.set(cave ? '#8a90c8' : '#fff4e8'); this.hemi.groundColor.set(cave ? '#3a3040' : '#6a5040');
    this.post.uniforms.exposure.value = cave ? 1.05 : 1.0; this.post.uniforms.night.value = cave ? 0.45 : 0.25;
    for (const Wl of this.buildings) if (Wl.win && Wl.faceM) Wl.faceM.emissiveIntensity = (1 - night) * 0.16;
    const srcs = [];
    if (B) for (const f of B.fighters()) if (!f.inBall && (f.types.includes('fuego') || f.types.includes('electrico'))) srcs.push([f.x / 16, 1.7, f.y / 16 + 0.7, cave ? 0.7 : 0.45, f.types.includes('fuego') ? '#ff9040' : '#fff070']);
    if (cave) {
      // antorcha del jugador; si el compañero es de fuego, también ilumina
      const p = B && B.trainer ? { px: B.trainer.x - 8, py: B.trainer.y - 14 } : world.player;
      srcs.unshift([(p.px + 8) / 16, 2.8, (p.py + 12) / 16 + 1.2, 1.05, '#ffc890']);
      const lead = G.party[0], fo = world.follower;
      if (!B && lead && !fo.hidden && SPECIES[lead.sp].types.includes('fuego')) srcs.push([(fo.px + 8) / 16, 0.9, (fo.py + 12) / 16, 1.3, '#ff9040']);
      if (B) for (const f of B.fighters()) if (!f.inBall) srcs.push([f.x / 16, 1.2, f.y / 16, 0.7, '#c8c0ff']);
    } else for (const c of this.ceil || []) srcs.push([c[0], c[1], c[2], 0.9, '#ffd8a0']);
    this.pl.forEach((p, i) => { const s = srcs[i]; if (!s) { p.intensity = 0; return; } p.position.set(s[0], s[1], s[2]); p.color.set(s[4]); p.distance = cave ? 13 : 9; p.intensity = s[3] * (cave ? 9 : 6); });
    this.night = cave ? 1 : night;
  },
  // punto central (en píxeles del mapa): el jugador o, en combate, el centro de la acción
  centerPx(world) {
    if (world.battle && world.battle.camPoint) { const [bx, by] = world.battle.camPoint(); return [bx, by + 10]; }
    return [world.player.px + 8, world.player.py + 8];
  },
  // ---------- cámara ----------
  updateCamera(world) {
    const m = world.map, B = world.battle, [px, py] = this.centerPx(world);
    let tx = px / 16, tz = py / 16;
    const mode = this.mode;
    if (!B && mode === 'out') { tx = m.w > 24 ? U.clamp(tx, 10, m.w - 10) : m.w / 2; tz = m.h > 14 ? U.clamp(tz, 5.5, m.h - 5) : m.h / 2; }
    if (!B && mode === 'in') { tx = m.w > 15 ? U.clamp(tx, 7, m.w - 7) : m.w / 2; tz = m.h > 10 ? U.clamp(tz, 4, m.h - 3) : m.h / 2 + 0.5; }
    if (!B && mode === 'cave') { tx = U.clamp(tx, 4, m.w - 4); tz = U.clamp(tz, 3, m.h - 2); }
    if (this.focus) [tx, tz] = this.focus; // solo para capturas de prueba
    // en combate la cámara se acerca un poco
    const base = this.mode === 'in' ? (B ? 19.5 : 15.5) : this.mode === 'cave' ? 17 : W3.DIST;
    const dist = U.lerp(base, base * 0.86, this.zoomK = U.lerp(this.zoomK || 0, B ? 1 : 0, 0.06));
    if (!this.camT || this.camMap !== m.id) { this.camT = [tx, tz]; this.camMap = m.id; }
    else { const k = B ? 0.16 : 0.12; this.camT[0] += (tx - this.camT[0]) * k; this.camT[1] += (tz - this.camT[1]) * k; }
    const [cx, cz] = this.camT;
    this.target.set(cx, 0, cz);
    const sh = Shake.offset ? Shake.offset() : [0, 0];
    this.cam.position.set(cx + sh[0] * 0.05, Math.sin(W3.PITCH) * dist + sh[1] * 0.03, cz + Math.cos(W3.PITCH) * dist);
    // en combate se mira un poco más al sur: la acción queda centrada sobre la barra inferior
    this.cam.lookAt(cx, 0, cz - 1.2 + (this.zoomK || 0) * 1.4);
    this.cam.updateMatrixWorld();
    // el sol recorre el cielo según la hora: sale por la derecha, se pone por la izquierda; al amanecer y al atardecer las sombras se alargan
    if (this.mode === 'out') { const h = U.clamp(Clock.hour(), 6, 18), a = ((h - 6) / 12) * Math.PI, el = Math.sin(a); this.sun.position.set(cx + Math.cos(a) * 15, 4 + el * 15, cz + 6 + (1 - el) * 2); }
    else this.sun.position.set(cx - 11, 17, cz + 7);
    this.sun.target.position.set(cx, 0, cz);
  },
  // proyección afín del suelo (a media altura) a la pantalla, para dibujar en 2D los efectos del combate
  affine(h = 0.45) {
    const [cx, cz] = this.camT, p0 = this.project(cx, h, cz), p1 = this.project(cx + 1, h, cz), p2 = this.project(cx, h, cz + 1);
    const a = (p1[0] - p0[0]) / 16, b = (p1[1] - p0[1]) / 16, c = (p2[0] - p0[0]) / 16, d = (p2[1] - p0[1]) / 16;
    const X = cx * 16, Y = cz * 16;
    return [a, b, c, d, p0[0] - a * X - c * Y, p0[1] - b * X - d * Y];
  },
  // del ratón (pantalla) al suelo del mapa, en píxeles del mapa
  screenToWorld(mx, my, h = 0.4) {
    const ray = this.ray || (this.ray = new THREE.Raycaster());
    ray.setFromCamera(new THREE.Vector2((mx / WIDE) * 2 - 1, 1 - (my / H) * 2), this.cam);
    const plane = this.plane || (this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
    plane.constant = -h;
    const v = new THREE.Vector3();
    if (!ray.ray.intersectPlane(plane, v)) return null;
    return [v.x * 16, v.z * 16];
  },
  // ---------- dibujo por fotograma ----------
  usable(world) {
    const m = world.map;
    if (!m || Options.gfx3d === false || !m.rows) return false;
    if (world.battle && !world.battle.field) return false;
    return this.init();
  },
  fitCanvas() {
    const r = Engine.canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(426, Math.min(1700, Math.round(r.width * dpr))), h = Math.round(w * H / WIDE);
    const st = this.cv.style;
    st.left = r.left + 'px'; st.top = r.top + 'px'; st.width = r.width + 'px'; st.height = r.height + 'px'; st.display = 'block';
    if (this.cv.width !== w || this.cv.height !== h) { this.r.setSize(w, h, false); this.rt.setSize(w, h); this.post.uniforms.res.value.set(w, h); }
  },
  render(world) {
    this.frame++; this.t += 1 / 60;
    if (this.mapId !== world.map.id || this.layerRef !== world.layer) this.build(world);
    this.updateCamera(world);
    this.syncSprites(world);
    if (this.frame % 3 === 0) this.syncGround(world);
    if (this.frame % 2 === 0 || world.battle) this.syncDecal(world);
    this.syncLight(world);
    this.occlusion(world);
    const t = Engine.time;
    if (this.windU) this.windU.value = t;
    this.syncPush(world);
    // franja inferior de árboles: casi invisible en combate para ver bien a las ánimas
    for (const bm of this.borderMats || []) bm.opacity = U.lerp(bm.opacity, world.battle ? 0.06 : 0.2, 0.1);
    for (const I of this.items) { I.mesh.visible = !Game.flag(I.it.flag); I.mesh.position.y = 0.1 + Math.sin(t * 3 + I.it.x) * 0.05; }
    if (this.water) { this.water.offset.x = (t * 0.03) % 1; this.water.offset.y = Math.sin(t * 0.4) * 0.05; }
    if (this.clouds) { this.clouds.t.offset.x = (t * 0.006) % 1; this.clouds.t.offset.y = (t * 0.003) % 1; }
    if (this.motes) {
      const a = this.motes.geometry.attributes.position, b = this.moteBase;
      for (let i = 0; i < a.count; i++) { a.array[i * 3] = b[i * 3] + Math.sin(t * 0.5 + i) * 0.4; a.array[i * 3 + 1] = b[i * 3 + 1] + Math.sin(t * 0.8 + i * 1.7) * 0.25; }
      a.needsUpdate = true;
    }
    this.fitCanvas();
    // agujero de visión en las rocas de las cuevas, alrededor del jugador
    if (this.cutU) {
      const p = world.battle && world.battle.trainer ? { px: world.battle.trainer.x - 8, py: world.battle.trainer.y - 14 } : world.player;
      const x = (p.px + 8) / 16, z = (p.py + 14) / 16, v = new THREE.Vector3(x, 0.8, z).project(this.cam);
      this.cutU.uP.value.set(x, z); this.cutU.uS.value.set((v.x + 1) / 2 * this.cv.width, (v.y + 1) / 2 * this.cv.height); this.cutU.uR.value = this.cv.width * 0.075;
    }
    this.r.setRenderTarget(this.rt); this.r.render(this.scene, this.cam);
    this.post.uniforms.tDiffuse.value = this.rt.texture;
    this.r.setRenderTarget(null); this.r.render(this.postScene, this.postCam);
    this.used = true;
  },
  hide() { if (this.cv && this.cv.style.display !== 'none') this.cv.style.display = 'none'; },
};

// ---------- integración con el mundo ----------
{
  const _draw = World.draw;
  World.draw = function (ctx) {
    if (!World3D.usable(this)) return _draw.call(this, ctx);
    // la cámara 2D se sigue calculando (la usan la IA, las criaturas y otras escenas)
    const m = this.map, p = this.player, mw = m.w * 16, mh = m.h * 16, B = this.battle;
    let tx = p.px + 8 - W / 2, ty = p.py + 8 - H / 2;
    if (B) { const [bx, by] = B.camPoint(); tx = bx - W / 2; ty = by - H / 2 - 4; }
    tx = mw <= W ? -Math.floor((W - mw) / 2) : U.clamp(tx, 0, mw - W);
    ty = B ? U.clamp(ty, Math.min(0, mh - H) - 36, Math.max(mh - H, 0) + 40) : mh <= H ? -Math.floor((H - mh) / 2) : U.clamp(ty, 0, mh - H);
    this.camF = [tx, ty]; this.camMap = m.id; this.cam = [Math.round(tx), Math.round(ty)];
    World3D.render(this);
    // el lienzo 2D queda transparente donde se ve el mundo
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, WIDE, H); ctx.restore();
    // combate: proyectiles, partículas, puntería y números, proyectados con la perspectiva
    if (B) {
      const A = World3D.affine(), [sx, sy] = Shake.offset();
      ctx.save(); ctx.setTransform(A[0], A[1], A[2], A[3], A[4] + sx, A[5] + sy); World3D.skew = true;
      try {
        B.drawWorldLayer(ctx, 0, 0);
        // los números se dibujan derechos y sin pisarse entre ellos
        const placed = [];
        for (const n of B._nums3d || []) {
          ctx.globalAlpha = n.t > 0.6 ? (0.9 - n.t) / 0.3 : 1;
          const w = Font.width(n.text), qx = Math.round(A[0] * n.x + A[2] * n.y + A[4] - w / 2);
          let qy = Math.round(A[1] * n.x + A[3] * n.y + A[5]);
          for (let k = 0; k < 6; k++) { const hit = placed.find((r) => qx < r[0] + r[2] + 2 && qx + w + 2 > r[0] && qy < r[1] + 10 && qy + 10 > r[1]); if (!hit) break; qy = hit[1] - 10; }
          placed.push([qx, qy, w]);
          ctx.save(); ctx.setTransform(1, 0, 0, 1, sx, sy);
          Font.drawOutlined(ctx, n.text, qx, qy, n.color, '#1a1420');
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      } finally { ctx.restore(); World3D.skew = false; }
      World3D.drawDust(ctx);
      Weather.draw(ctx, Weather.at(m));
      return;
    }
    World3D.drawDust(ctx); World3D.drawAir(ctx);
    // emociones sobre las cabezas
    for (const em of this.emotes) {
      const e = em.e, [sx, sy] = World3D.project((e.px + 8) / 16, 2.3, (e.py + 14) / 16);
      const x = Math.round(sx - 8), y = Math.round(sy) - Math.min(4, em.t * 30);
      UI.box(ctx, x + 2, y, 12, 13, 'panel');
      Font.drawCenter(ctx, em.ch, x + 8, y + 3, '#d03030');
    }
    Weather.draw(ctx, Weather.at(m));
    if (typeof HUD !== 'undefined') HUD.drawWorld(ctx, this);
    if (this.banner && Scenes.top() === this) {
      const t = this.banner.t, a = t < 0.3 ? t / 0.3 : t > 2.2 ? (2.6 - t) / 0.4 : 1;
      const w = Font.width(this.banner.text) + 24, y = Math.round(-26 + 32 * U.clamp(a, 0, 1));
      UI.box(ctx, 6, y, w, 22, 'title');
      Font.draw(ctx, this.banner.text, 18, y + 7, '#ffffff', '#1a1430');
    }
  };
  // el lienzo 3D solo se ve en los fotogramas en que se dibuja el mundo en 3D
  const _edraw = Engine.draw;
  Engine.draw = function () {
    World3D.used = false;
    _edraw.call(this);
    if (!World3D.used) World3D.hide();
  };
  // cambios de casillas (arbustos cortados, rocas rotas…): se reconstruye
  const _set = World.setTile;
  World.setTile = function (x, y, ch) { const r = _set.call(this, x, y, ch); World3D.mapId = null; return r; };
}


// ---------- combate en 3D ----------
{
  const BP = BattleScene.prototype;
  // los números de daño se dibujan con la perspectiva (desde World.draw)
  const _draw = BP.draw;
  BP.draw = function (ctx) {
    if (!World3D.usable(World)) return _draw.call(this, ctx);
    const n = this.nums; this._nums3d = n; this.nums = [];
    try { return _draw.call(this, ctx); } finally { this.nums = n; }
  };
  // el ratón apunta a un punto del suelo (rayo desde la cámara)
  const _mw = BP.mouseWorld;
  BP.mouseWorld = function () {
    if (World3D.usable(World) && World3D.camT) { const p = World3D.screenToWorld(Input.mouse.x, Input.mouse.y); if (p) return p; }
    return _mw.call(this);
  };
  // de coordenadas del mapa a la pantalla (selector táctico, marcas)
  BP.toScreen = function (x, y, h = 0) {
    if (World3D.usable(World) && World3D.camT) { const [sx, sy] = World3D.project(x / 16, h / 16, y / 16); return [sx, sy]; }
    const [cx, cy] = World.cam; return [x - cx, y - cy - h];
  };
}

// ---------- textos siempre derechos ----------
// Cuando se dibuja con la perspectiva del suelo (transformación con inclinación),
// el texto se coloca en su punto proyectado pero se dibuja recto, sin deformar.
{
  const wrapFont = (name) => {
    const orig = Font[name];
    Font[name] = function (ctx, str, x, y, ...rest) {
      const m = World3D.skew && ctx.getTransform ? ctx.getTransform() : null;
      if (!m || (Math.abs(m.b) < 1e-3 && Math.abs(m.c) < 1e-3 && Math.abs(m.a - m.d) < 1e-3)) return orig.call(this, ctx, str, x, y, ...rest);
      // punto de anclaje: centro inferior del texto, para que no se desplace al enderezarlo
      const w = Font.width(str), ax = x + w / 2, ay = y + 9;
      const sx = m.a * ax + m.c * ay + m.e, sy = m.b * ax + m.d * ay + m.f;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      try { return orig.call(this, ctx, str, Math.round(sx - w / 2), Math.round(sy - 9), ...rest); } finally { ctx.restore(); }
    };
  };
  for (const n of ['draw', 'drawOutlined']) wrapFont(n);
}
