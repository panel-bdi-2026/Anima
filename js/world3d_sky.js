'use strict';
// ============================================================
//  MUNDO 3D: CIELO Y CLIMA
//  - Cúpula de cielo que cambia con la hora: azul de día, naranja al
//    amanecer y al atardecer, noche con luna y estrellas; nubes que
//    se espesan con el mal tiempo.
//  - Lluvia de verdad en 3D (gotas que caen inclinadas por el viento
//    y salpican en el suelo), con suelo más oscuro y relámpagos.
//  - Nieve en Pico Céfiro cuando el tiempo empeora.
//  - Niebla matinal: bancos bajos de bruma que se deslizan (y la
//    niebla del Bosque).
// ============================================================
// la nieve: en Pico Céfiro, la lluvia y el cielo nublado pasan a nieve
{
  const _at = Weather.at.bind(Weather);
  Weather.at = function (map) {
    const w = _at(map);
    if (map && map.id === 'pico_cefiro' && (w === 'lluvia' || w === 'nublado' || w === 'tormenta')) return 'nieve';
    return w;
  };
  const _icon = Weather.icon.bind(Weather);
  Weather.icon = function (w, day) { return w === 'nieve' ? '❄' : _icon(w, day); };
}

const Sky3D = {
  ready: false,
  init() {
    if (this.ready) return true;
    if (!World3D.init()) return false;
    const S = World3D.scene;
    this.U = { t: { value: 0 }, sun: { value: new THREE.Vector3(0, 1, 0) }, moon: { value: new THREE.Vector3(0, 1, 0) }, day: { value: 1 }, dusk: { value: 0 }, cloud: { value: 0.3 }, dark: { value: 0 } };
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.U,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `varying vec3 vP; uniform float t, day, dusk, cloud, dark; uniform vec3 sun, moon;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
        void main(){
          vec3 d = normalize(vP); float h = d.y;
          vec3 dayTop = vec3(0.30,0.55,0.92), dayLow = vec3(0.72,0.86,1.0);
          vec3 duskTop = vec3(0.30,0.22,0.52), duskLow = vec3(1.0,0.56,0.36);
          vec3 ngtTop = vec3(0.02,0.03,0.10), ngtLow = vec3(0.08,0.10,0.24);
          vec3 top = mix(mix(ngtTop, dayTop, day), duskTop, dusk), low = mix(mix(ngtLow, dayLow, day), duskLow, dusk);
          vec3 c = mix(low, top, smoothstep(-0.05, 0.6, h));
          float s = max(dot(d, sun), 0.);
          c += vec3(1.0,0.9,0.7) * pow(s, 600.) * 4. * max(day, dusk) + vec3(1.0,0.7,0.4) * pow(s, 8.) * 0.35 * dusk;
          float mo = max(dot(d, moon), 0.);
          c += vec3(0.85,0.9,1.0) * smoothstep(0.9993, 0.9996, mo) * (1. - day) + vec3(0.4,0.5,0.8) * pow(mo, 30.) * 0.25 * (1. - day);
          vec2 st = floor(d.xz / (h + 0.3) * 150.);
          c += vec3(step(0.997, h21(st)) * smoothstep(0.05, 0.5, h) * (1. - day) * (1. - cloud) * (0.6 + 0.4 * sin(t * 3. + h21(st) * 40.)));
          vec2 uv = d.xz / max(h + 0.15, 0.06) + vec2(t * 0.012, t * 0.004);
          float cl = smoothstep(0.62 - cloud * 0.45, 0.95 - cloud * 0.3, n2(uv * 1.4) * 0.6 + n2(uv * 3.7) * 0.4) * smoothstep(-0.02, 0.15, h);
          vec3 cc = mix(vec3(0.95), vec3(1.0,0.75,0.6), dusk) * mix(0.25, 1.0, max(day, dusk * 0.8));
          cc = mix(cc, vec3(0.45,0.48,0.55) * mix(0.3, 1.0, day), dark);
          c = mix(c, cc, cl * (0.55 + cloud * 0.4));
          c = mix(c, vec3(0.42,0.46,0.52) * mix(0.25, 1.0, day), dark * 0.55);
          gl_FragColor = vec4(c, 1.); }`,
    }));
    this.dome.renderOrder = -10; S.add(this.dome);
    // lluvia
    const NR = 1400, rp = new Float32Array(NR * 6);
    this.rain = { n: NR, pos: rp, base: new Float32Array(NR * 3), sp: new Float32Array(NR) };
    for (let i = 0; i < NR; i++) { this.rain.base[i * 3] = Math.random() * 30 - 15; this.rain.base[i * 3 + 1] = Math.random() * 9; this.rain.base[i * 3 + 2] = Math.random() * 22 - 14; this.rain.sp[i] = 13 + Math.random() * 5; }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    this.rainMesh = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#b8d0ff', transparent: true, opacity: 0.5, depthWrite: false }));
    this.rainMesh.frustumCulled = false; S.add(this.rainMesh);
    // salpicaduras
    const NS = 160; this.spl = { n: NS, pos: new Float32Array(NS * 3), t: new Float32Array(NS) };
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(this.spl.pos, 3));
    this.splMesh = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#d8e8ff', size: 0.09, transparent: true, opacity: 0.8, depthWrite: false })); this.splMesh.frustumCulled = false; S.add(this.splMesh);
    // nieve
    const NN = 900, np = new Float32Array(NN * 3);
    this.snow = { n: NN, pos: np, base: new Float32Array(NN * 3), ph: new Float32Array(NN) };
    for (let i = 0; i < NN; i++) { this.snow.base[i * 3] = Math.random() * 30 - 15; this.snow.base[i * 3 + 1] = Math.random() * 9; this.snow.base[i * 3 + 2] = Math.random() * 22 - 14; this.snow.ph[i] = Math.random() * 6; }
    const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.BufferAttribute(np, 3));
    const [fc, fx] = U.makeCanvas(8, 8); fx.fillStyle = '#ffffff'; fx.fillRect(2, 2, 4, 4); fx.fillRect(3, 1, 2, 6); fx.fillRect(1, 3, 6, 2);
    this.snowMesh = new THREE.Points(ng, new THREE.PointsMaterial({ size: 0.32, map: new THREE.CanvasTexture(fc), transparent: true, depthWrite: false, alphaTest: 0.3 })); this.snowMesh.frustumCulled = false; S.add(this.snowMesh);
    // bancos de niebla
    const [mc, mx] = U.makeCanvas(128, 64);
    for (let i = 0; i < 14; i++) { const x = 32 + Math.random() * 64, y = 28 + Math.random() * 8, r = 10 + Math.random() * 14; const g = mx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); mx.fillStyle = g; mx.fillRect(0, 0, 128, 64); }
    const mt = new THREE.CanvasTexture(mc);
    this.mists = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map: mt, transparent: true, opacity: 0, depthWrite: false, color: '#e8f0ff' }));
      m.rotation.x = -Math.PI / 2 + 0.5; m.renderOrder = 4; S.add(m);
      this.mists.push({ m, ox: Math.random() * 30 - 15, oz: Math.random() * 20 - 12, sp: 0.2 + Math.random() * 0.3, y: 0.2 + Math.random() * 0.5 });
    }
    this.ready = true;
    return true;
  },
  update(world) {
    if (!this.init()) return;
    const t = Engine.time, m = world.map, out = World3D.mode === 'out', w = out ? Weather.at(m) : 'despejado', tg = World3D.target;
    const h = Clock.hour(), L = Clock.light();
    this.dome.visible = out; this.dome.position.set(tg.x, 0, tg.z);
    // sol y luna según la hora
    const sa = ((h - 6) / 12) * Math.PI, sun = new THREE.Vector3(Math.cos(sa) * -0.6, Math.sin(sa), -0.8).normalize();
    this.U.sun.value.copy(sun); this.U.moon.value.set(0.4, 0.55, -0.75).normalize();
    this.U.t.value = t;
    const day = U.clamp(1 - L.a / 0.6, 0, 1), dusk = L.tint ? Math.min(1, L.ta * 3.2) : 0;
    this.U.day.value = day; this.U.dusk.value = dusk;
    const rain = Weather.isRain(w), snow = w === 'nieve';
    const cloudGoal = w === 'tormenta' ? 1 : rain || snow ? 0.8 : w === 'nublado' || w === 'niebla' ? 0.65 : 0.25;
    this.U.cloud.value += (cloudGoal - this.U.cloud.value) * 0.02;
    this.U.dark.value += ((w === 'tormenta' ? 0.75 : rain || snow ? 0.45 : w === 'nublado' ? 0.25 : 0) - this.U.dark.value) * 0.02;
    // lluvia
    const R = this.rain, rp = R.pos, wind = w === 'tormenta' ? 0.35 : 0.18;
    this.rainMesh.visible = out && rain;
    if (this.rainMesh.visible) {
      this.rainMesh.material.opacity = w === 'tormenta' ? 0.6 : 0.45;
      const n = w === 'tormenta' ? R.n : Math.floor(R.n * 0.6);
      for (let i = 0; i < R.n; i++) {
        if (i >= n) { rp.fill(0, i * 6, i * 6 + 6); continue; }
        let y = (R.base[i * 3 + 1] - t * R.sp[i]) % 9; if (y < 0) y += 9;
        const x = tg.x + R.base[i * 3] - y * wind, z = tg.z + R.base[i * 3 + 2];
        rp[i * 6] = x; rp[i * 6 + 1] = y; rp[i * 6 + 2] = z; rp[i * 6 + 3] = x + 0.35 * wind * 2; rp[i * 6 + 4] = y + 0.55; rp[i * 6 + 5] = z;
      }
      this.rainMesh.geometry.attributes.position.needsUpdate = true;
      const S = this.spl;
      for (let i = 0; i < S.n; i++) { S.t[i] -= 1 / 60; if (S.t[i] <= 0) { S.t[i] = 0.12 + Math.random() * 0.25; S.pos[i * 3] = tg.x + Math.random() * 26 - 13; S.pos[i * 3 + 1] = 0.05; S.pos[i * 3 + 2] = tg.z + Math.random() * 18 - 11; } else S.pos[i * 3 + 1] += 0.012; }
      this.splMesh.geometry.attributes.position.needsUpdate = true;
    }
    this.splMesh.visible = this.rainMesh.visible;
    // nieve
    const N = this.snow, np = N.pos;
    this.snowMesh.visible = out && snow;
    if (this.snowMesh.visible) {
      for (let i = 0; i < N.n; i++) {
        let y = (N.base[i * 3 + 1] - t * 0.9) % 9; if (y < 0) y += 9;
        np[i * 3] = tg.x + N.base[i * 3] + Math.sin(t * 0.8 + N.ph[i]) * 0.6; np[i * 3 + 1] = y; np[i * 3 + 2] = tg.z + N.base[i * 3 + 2] + Math.cos(t * 0.6 + N.ph[i]) * 0.3;
      }
      this.snowMesh.geometry.attributes.position.needsUpdate = true;
    }
    // niebla matinal (5-8 h) y del Bosque
    const morning = out ? U.clamp(1 - Math.abs(h - 6.5) / 1.6, 0, 1) : 0, fogW = w === 'niebla' ? 1 : 0;
    const mist = Math.max(morning * 0.45, fogW * 0.8, snow ? 0.3 : 0);
    for (const M of this.mists) {
      const x = ((M.ox + t * M.sp) % 34 + 34) % 34 - 17;
      M.m.position.set(tg.x + x, M.y, tg.z + M.oz); M.m.material.opacity += (mist * 0.4 - M.m.material.opacity) * 0.03; M.m.visible = M.m.material.opacity > 0.01;
    }
    // la niebla también acerca la bruma de lejos
    if (out && World3D.scene.fog) { const f = World3D.scene.fog; f.near = U.lerp(22, 14, mist); f.far = U.lerp(46, 36, mist); if (mist > 0.05) f.color.lerp(new THREE.Color('#c8d0dc').multiplyScalar(0.3 + 0.7 * day), mist * 0.4); }
    // con lluvia o nieve el sol se apaga un poco y el suelo se ve húmedo/blanco
    if (out && (rain || snow)) { World3D.sun.intensity *= rain ? 0.6 : 0.8; World3D.hemi.intensity *= rain ? 0.85 : 1.1; }
    if (out && this.dome.visible) World3D.scene.background = null;
  },
};

// ---------- integración ----------
{
  const _light = World3D.syncLight;
  World3D.syncLight = function (world) { const r = _light.call(this, world); Sky3D.update(world); return r; };
  // en 3D, la lluvia y la niebla son 3D: del dibujo 2D solo queda el tono y el relámpago
  const _wd = Weather.draw.bind(Weather);
  Weather.draw = function (ctx, w) {
    if (typeof World3D === 'undefined' || !World3D.usable(World) || !World3D.camT) return _wd(ctx, w);
    if (w === 'tormenta') { ctx.globalAlpha = 0.12; P(ctx, 0, 0, W, H, '#283048'); ctx.globalAlpha = 1; }
    if (this.flash > 0) { ctx.globalAlpha = this.flash; P(ctx, 0, 0, W, H, '#ffffff'); ctx.globalAlpha = 1; }
  };
}

// ============================================================
//  AGUA: reflejo del cielo, destellos del sol, espuma en la orilla y
//  ondas cuando alguien se mueve cerca o dentro del agua.
// ============================================================
{
  World3D.buildWater = function (world) {
    const m = world.map, isW = (x, y) => { const d = world.tileAt(x, y); return !!(d && d.water); };
    const pos = [], has = [];
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      if (!isW(tx, ty)) continue;
      const x0 = tx, x1 = tx + 1, z0 = ty, z1 = ty + 1;
      pos.push(x0, 0, z0, x0, 0, z1, x1, 0, z0, x1, 0, z0, x0, 0, z1, x1, 0, z1); has.push(1);
    }
    if (!pos.length) { this.waterU = null; return; }
    // máscara de orilla: distancia a tierra, difuminada (4 px por casilla)
    const S = 4, [mc, mx] = U.makeCanvas(m.w * S, m.h * S);
    mx.fillStyle = '#000'; mx.fillRect(0, 0, mc.width, mc.height);
    mx.fillStyle = '#fff';
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) if (!isW(tx, ty)) mx.fillRect(tx * S, ty * S, S, S);
    const [bc, bx] = U.makeCanvas(mc.width, mc.height); bx.filter = 'blur(3px)'; bx.drawImage(mc, 0, 0); bx.filter = 'none';
    const shore = new THREE.CanvasTexture(bc); shore.magFilter = THREE.LinearFilter; shore.flipY = false;
    const cave = m.cave;
    this.waterU = {
      uT: { value: 0 }, uShore: { value: shore }, uSize: { value: new THREE.Vector2(m.w, m.h) },
      uSky: { value: new THREE.Color('#9ac8f0') }, uDeep: { value: new THREE.Color(cave ? '#1a2a50' : '#1e5aa0') }, uShallow: { value: new THREE.Color(cave ? '#3a5a90' : '#3a92cc') },
      uSun: { value: new THREE.Vector3(-0.5, 0.8, 0.3).normalize() }, uSunCol: { value: new THREE.Color('#fff4d0') }, uCam: { value: new THREE.Vector3() },
      uLight: { value: 1 }, uRip: { value: Array.from({ length: 6 }, () => new THREE.Vector4(-99, -99, 0, 0)) },
    };
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: this.waterU, transparent: true, depthWrite: false, fog: false,
      vertexShader: `uniform float uT; varying vec3 vW;
        void main(){ vec3 p = position; p.y += sin(p.x * 1.7 + uT * 1.6) * 0.02 + sin(p.z * 2.3 - uT * 1.2) * 0.018; vW = p; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
      fragmentShader: `uniform float uT; uniform sampler2D uShore; uniform vec2 uSize; uniform vec3 uSky, uDeep, uShallow, uSun, uSunCol, uCam; uniform vec4 uRip[6]; uniform float uLight; varying vec3 vW;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
        void main(){
          // píxeles de 1/16 de casilla para que encaje con el estilo del juego
          vec2 q = floor(vW.xz * 16.) / 16.;
          float sh = texture2D(uShore, q / uSize).r;
          // normal ondulada a partir de dos ruidos que se desplazan
          float a = n2(q * 2.2 + vec2(uT * 0.35, uT * 0.2)), b = n2(q * 3.7 - vec2(uT * 0.25, -uT * 0.3));
          vec3 N = normalize(vec3((a - 0.5) * 0.5 + (b - 0.5) * 0.3, 1., (b - 0.5) * 0.5));
          // ondas concéntricas
          float rip = 0.;
          for (int i = 0; i < 6; i++) { vec4 r = uRip[i]; if (r.w <= 0.) continue; float d = distance(q, r.xy); float ring = sin(d * 18. - uT * 7. + r.z) * exp(-d * 2.2) * r.w; rip += ring; N.xz += normalize(q - r.xy + 0.001) * ring * 0.25; }
          N = normalize(N);
          vec3 V = normalize(uCam - vW);
          float fres = pow(1. - max(dot(V, N), 0.), 3.) * 0.8 + 0.12;
          vec3 base = mix(uDeep, uShallow, smoothstep(0.2, 0.9, sh));
          vec3 c = mix(base, uSky, fres);
          vec3 Hh = normalize(uSun + V);
          float spec = pow(max(dot(N, Hh), 0.), 140.);
          c += uSunCol * step(0.55, spec) * 0.9 + uSunCol * spec * 0.4;
          // destellos sueltos
          c += vec3(step(0.985, n2(q * 9. + uT * 0.8)) * 0.6);
          // espuma en la orilla
          float foamBand = smoothstep(0.66, 0.9, sh + (n2(q * 5. + uT * 0.6) - 0.5) * 0.2);
          float foamLine = step(0.82, fract(sh * 3. - uT * 0.4)) * smoothstep(0.3, 0.5, sh) * 0.6;
          c = mix(c, vec3(0.95, 0.98, 1.0), clamp(foamBand * 0.8 + foamLine * 0.35, 0., 1.));
          c += vec3(rip * 0.12);
          c *= uLight;
          // los colores están en sRGB y el pase final los vuelve a codificar: se pasan a lineal
          gl_FragColor = vec4(pow(clamp(c, 0., 1.), vec3(2.2)), 0.85 + foamBand * 0.12);
        }`,
    });
    const w = new THREE.Mesh(geo, mat); w.position.y = 0.035; w.renderOrder = 2; this.root.add(w);
    this.water = null; this.water2 = null;
  };
  // cada fotograma: color del cielo, sol, cámara y ondas
  const _render = World3D.render;
  World3D.render = function (world) {
    const U3 = this.waterU;
    if (U3 && this.cam) {
      U3.uT.value = Engine.time; U3.uCam.value.copy(this.cam.position);
      const L = world.lightLevel(), day = U.clamp(1 - L.a / 0.6, 0, 1), dusk = L.tint ? Math.min(1, L.ta * 3.2) : 0;
      U3.uSky.value.set('#0c1838').lerp(new THREE.Color('#9ac8f0'), day).lerp(new THREE.Color('#f0a080'), dusk);
      if (this.mode === 'cave') U3.uSky.value.set('#28304a');
      U3.uLight.value = this.mode === 'cave' ? 0.45 : this.mode === 'in' ? 0.9 : 0.3 + 0.7 * Math.max(day, dusk * 0.8);
      U3.uSunCol.value.set('#fff4d0').lerp(new THREE.Color('#ffb070'), dusk).multiplyScalar(0.3 + 0.7 * Math.max(day, dusk));
      if (Sky3D.ready) U3.uSun.value.copy(Sky3D.U.sun.value).setY(Math.max(0.25, Sky3D.U.sun.value.y));
      // ondas: jugador o ánimas cerca o dentro del agua
      const movers = [], B = world.battle;
      if (B) { for (const f of B.fighters()) if (!f.inBall) movers.push([f.x / 16, (f.y + 4) / 16, Math.hypot(f.vx, f.vy) > 10]); }
      else { const p = world.player; movers.push([(p.px + 8) / 16, (p.py + 14) / 16, !!p.moving || !!world.swimming]); for (const c of Critters.list) movers.push([c.x / 16, (c.y + 2) / 16, true]); }
      let k = 0;
      for (const [x, z, mv] of movers) {
        if (k >= 6) break;
        const d = world.tileAt(Math.floor(x), Math.floor(z)), near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const t = world.tileAt(Math.floor(x) + dx, Math.floor(z) + dy); return t && t.water; });
        if (!near) continue;
        const r = U3.uRip.value[k++]; const inside = d && d.water;
        r.set(x, z, k * 1.7, (inside ? 1 : 0.45) * (mv ? 1 : 0.4));
      }
      for (; k < 6; k++) U3.uRip.value[k].w = 0;
    }
    return _render.call(this, world);
  };
}
