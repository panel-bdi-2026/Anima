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
// ---------- arte procedural del título (montañas, volcán, faro, cielo) ----------
// Todo dibujado por código, con textura pixelada y luz suave (dirección de arte: docs/estilo.md).
const TitleArt = {
  // ruido suave y fractal (para relieve y texturas)
  vnoise(x, z) {
    const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const h = (a, b) => hash2(a, b);
    return U.lerp(U.lerp(h(xi, zi), h(xi + 1, zi), u), U.lerp(h(xi, zi + 1), h(xi + 1, zi + 1), u), v);
  },
  fbm(x, z, oct = 5) { let a = 0, amp = 0.5, f = 1; for (let o = 0; o < oct; o++) { a += amp * this.vnoise(x * f + o * 17, z * f - o * 11); f *= 2.03; amp *= 0.5; } return a / (1 - Math.pow(0.5, oct)); },
  // crestas afiladas (ruido «ridged»)
  ridged(x, z, oct = 5) { let a = 0, amp = 0.5, f = 1, w = 1; for (let o = 0; o < oct; o++) { let n = 1 - Math.abs(this.vnoise(x * f + o * 31, z * f + o * 7) * 2 - 1); n *= n * w; w = U.clamp(n * 1.6, 0, 1); a += n * amp; f *= 2.1; amp *= 0.5; } return a; },
  // textura de roca pixelada en escala de grises (se tiñe con el color de cada vértice)
  rockTex(seed) {
    const N = 64, [c, x] = U.makeCanvas(N, N), img = x.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let i = 0; i < N; i++) {
      // vetas horizontales, grietas y grano
      const strata = Math.sin((y + this.fbm(i * 0.15 + seed, y * 0.05) * 9) * 0.9) * 0.5 + 0.5;
      let v = 0.84 + strata * 0.07 + (this.vnoise(i * 0.5 + seed, y * 0.5) - 0.5) * 0.14;
      if (this.ridged(i * 0.09 + seed, y * 0.13, 3) > 0.66) v *= 0.82; // grietas
      v = Math.round(U.clamp(v, 0, 1) * 7) / 7; // paleta corta: aspecto pixel art
      const k = (y * N + i) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.round(v * 255); img.data[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return World3D.tex(c, true);
  },
  // cordillera: una franja de terreno con relieve, nieve donde es plano y alto, y color por altura
  range(o) {
    const { x0, x1, zc, depth, hmax, seed } = o, nx = o.nx || 260, nz = o.nz || 44;
    const g = new THREE.PlaneGeometry(x1 - x0, depth, nx, nz); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, half = depth / 2, crags = new Float32Array(p.count);
    // picos con nombre propio: cada uno con su altura y su ancho; entre ellos, collados
    const peaks = [];
    for (let x = x0; x < x1; x += o.gap || 24) peaks.push([x + (hash2(Math.round(x), seed) - 0.5) * (o.gap || 24) * 0.7, hmax * (0.45 + 0.55 * hash2(seed, Math.round(x))), (o.gap || 24) * (0.55 + hash2(Math.round(x) * 3, seed) * 0.5)]);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + (x0 + x1) / 2, zl = p.getZ(i);
      // cumbres irregulares: el eje se tuerce con ruido (hombros y crestas asimétricas)
      const xw = x + (this.fbm(x * 0.02 + seed, zl * 0.03, 3) - 0.5) * (o.gap || 24) * 0.9;
      let P = 0; for (const [px, ph, pw] of peaks) { const d = Math.abs(xw - px) / pw; P = Math.max(P, ph * (Math.exp(-d * 2.4) * 0.7 + Math.max(0, 1 - d * 0.75) * 0.3)); }
      const env = Math.max(0, 1 - Math.pow(Math.abs(zl + half * 0.1) / half, 1.4));          // la cresta corre por el centro
      // crestas y quebradas: dos escalas (grandes espolones y aristas finas)
      const crag = this.ridged(x * 0.05 + seed, zl * 0.08 + seed, 5) * 0.65 + this.ridged(x * 0.16 + seed * 2, zl * 0.22, 4) * 0.35;
      crags[i] = crag;
      const h = P * Math.pow(env, 0.9) * (0.5 + 0.5 * crag) + crag * hmax * 0.1 - 4 * (1 - env);  // bordes bajo el suelo: sin huecos
      p.setXYZ(i, x, h, zl + zc);
    }
    g.computeVertexNormals();
    let top = 1; for (let i = 0; i < p.count; i++) top = Math.max(top, p.getY(i)); // altura real de la cordillera (para la línea de nieve)
    const n = g.attributes.normal, col = new Float32Array(p.count * 3), uv = g.attributes.uv, c = new THREE.Color(), rock = new THREE.Color(o.rock), rockD = new THREE.Color(o.rockDark), snow = new THREE.Color(o.snow || '#ffffff'), low = new THREE.Color(o.low || o.rockDark), rim = new THREE.Color(o.rim || '#ffffff'), sn = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ny = n.getY(i), hk = y / top;
      c.copy(rockD).lerp(rock, U.clamp(ny * 1.2 - 0.1 + (this.fbm(x * 0.15, y * 0.15, 3) - 0.5) * 0.6, 0, 1)); // laderas empinadas más oscuras, con manchas
      c.lerp(low, U.clamp(1 - hk * 2.2, 0, 1) * 0.8);                                       // pie de la montaña (bosque o sombra)
      c.multiplyScalar(0.78 + 0.32 * crags[i]);                                              // quebradas y canaletas más oscuras
      // luz pintada: desde arriba a la izquierda (forma y volumen)
      const lit = U.clamp(n.getX(i) * -0.45 + ny * 0.7 + n.getZ(i) * 0.45, 0, 1);
      c.multiplyScalar(0.36 + 0.75 * lit);
      let kSnow = 0;
      if (o.snow) {
        const line = 0.42 + (this.fbm(x * 0.08, z * 0.08, 3) - 0.5) * 0.3;
        // nieve en lo alto y en las canaletas; en las paredes empinadas y las aristas asoma la roca
        const k = U.clamp((hk - line) * 5, 0, 1) * U.clamp((ny - 0.42) * 4, 0, 1) * U.clamp(1.25 - crags[i] * 0.8, 0, 1);
        sn.copy(snow).multiplyScalar(0.7 + 0.42 * lit);                                      // la nieve siempre clara, con su propia luz
        c.lerp(sn, k); kSnow = k;
      }
      // luz de borde: el sol está detrás, así que las crestas brillan
      c.lerp(rim, U.clamp((hk - 0.7) * 3, 0, 1) * U.clamp(-n.getZ(i) * 2 + 0.4, 0, 1) * (o.rimK || 0.35) * (1 - kSnow * 0.75));
      c.convertSRGBToLinear(); // el render final convierte a sRGB: así se ven los colores elegidos
      col.set([c.r, c.g, c.b], i * 3);
      uv.setXY(i, x * 0.22, y * 0.22 + z * 0.05); // textura «de frente»: no se estira en las laderas
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    // luz ya pintada en los colores; bruma propia y suave (la de la escena borraba el detalle)
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, map: this.rockTex(seed), fog: false }));
    if (o.haze) { const hz = new THREE.Color(o.haze); for (let i = 0; i < p.count; i++) { const k = o.hazeK || 0.2; col[i * 3] += (hz.r - col[i * 3]) * k; col[i * 3 + 1] += (hz.g - col[i * 3 + 1]) * k; col[i * 3 + 2] += (hz.b - col[i * 3 + 2]) * k; } }
    return m;
  },
  // volcán: perfil cóncavo con relieve, cráter encendido y ríos de lava
  volcano(S, pos) {
    const pts = [];
    for (let i = 0; i <= 24; i++) { const k = i / 24, y = k * 24; pts.push(new THREE.Vector2(4 + 15 * Math.pow(1 - k, 1.7), y)); }
    pts.push(new THREE.Vector2(3.2, 23.4), new THREE.Vector2(2.6, 22.5));
    const g = new THREE.LatheGeometry(pts, 48), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z);
      const d = 1 + (this.ridged(a * 3 + 5, y * 0.12, 4) - 0.5) * 0.28 * Math.min(1, (24 - y) / 6);
      p.setXYZ(i, Math.cos(a) * r * d, y, Math.sin(a) * r * d);
    }
    g.computeVertexNormals();
    const col = new Float32Array(p.count * 3), c = new THREE.Color(), base = new THREE.Color('#3a2a30'), hi = new THREE.Color('#6a4a48'), ash = new THREE.Color('#8a7078');
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), a = Math.atan2(p.getZ(i), p.getX(i));
      c.copy(base).lerp(hi, this.vnoise(a * 6, y * 0.3)).lerp(ash, U.clamp((y - 17) / 6, 0, 1) * 0.6);
      const nn = g.attributes.normal; c.multiplyScalar(0.7 + 0.6 * U.clamp(nn.getX(i) * -0.5 + nn.getY(i) * 0.5 + nn.getZ(i) * 0.5, 0, 1));
      c.lerp(new THREE.Color('#ff7a40'), U.clamp((y - 20.5) / 3, 0, 1) * 0.45); // resplandor del cráter en el borde
      c.convertSRGBToLinear();
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const v = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, map: this.rockTex(9) }));
    { const uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getY(i) * 0.1, Math.atan2(p.getZ(i), p.getX(i)) * 4); } // vetas que bajan por la ladera
    v.position.copy(pos); S.add(v);
    // cráter que brilla y ríos de lava (cintas que bajan por la ladera)
    const glow = new THREE.Mesh(new THREE.CircleGeometry(2.8, 20), new THREE.MeshBasicMaterial({ color: '#ff7020', fog: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.set(pos.x, pos.y + 22.7, pos.z); S.add(glow);
    const lava = new THREE.MeshBasicMaterial({ color: '#ff5a1a', transparent: true, opacity: 0.85, side: THREE.DoubleSide, fog: false });
    for (const a0 of [0.35, 1.1, 2.4]) {
      const pts2 = [];
      for (let i = 0; i <= 14; i++) { const k = i / 14, y = 22.6 - k * 10, r = 3.1 + 15 * Math.pow(k * 10 / 24, 1.7) * 1.15 + 0.15, a = a0 + Math.sin(k * 6 + a0) * 0.12; pts2.push(new THREE.Vector3(pos.x + Math.cos(a) * r, pos.y + y, pos.z + Math.sin(a) * r)); }
      const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 24, 0.45, 5), lava); S.add(t);
    }
    // halo del cráter
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.softTex(), color: '#ff6a30', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    halo.position.set(pos.x, pos.y + 24, pos.z); halo.scale.set(16, 9, 1); S.add(halo);
  },
  // mancha suave (halos, humo, brillo)
  softTex() {
    if (this._soft) return this._soft;
    const [c, x] = U.makeCanvas(64, 64), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.15, 'rgba(255,255,255,0.7)'); g.addColorStop(0.4, 'rgba(255,255,255,0.22)'); g.addColorStop(0.7, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (this._soft = new THREE.CanvasTexture(c));
  },
  // bocanada de humo con forma irregular
  smokeTex() {
    if (this._smoke) return this._smoke;
    const N = 64, [c, x] = U.makeCanvas(N, N), img = x.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let i = 0; i < N; i++) {
      const d = Math.hypot(i - 31.5, y - 31.5) / 32, n = this.fbm(i * 0.09, y * 0.09, 4);
      const a = U.clamp((1 - d * (1.1 - n * 0.6)) * 1.6, 0, 1), sh = 0.75 + (31.5 - y) / 64 * 0.4; // más claro arriba
      const k = (y * N + i) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.round(U.clamp(sh, 0, 1) * 255); img.data[k + 3] = Math.round(a * a * 255);
    }
    x.putImageData(img, 0, 0);
    return (this._smoke = new THREE.CanvasTexture(c));
  },
  // nube: ruido con bordes suaves, base en sombra y borde iluminado por el sol
  cloudTex(seed) {
    const W = 128, H = 48, [c, x] = U.makeCanvas(W, H), img = x.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
      const ex = Math.sin((i / W) * Math.PI), ey = Math.sin((y / H) * Math.PI);
      const n = this.fbm(i * 0.05 + seed, y * 0.09 + seed, 5);
      const a = U.clamp((n * ex * Math.pow(ey, 0.6) - 0.28) * 3.2, 0, 1);
      const lit = U.clamp(1 - y / H * 1.3 + (n - 0.5), 0, 1);
      const k = (y * W + i) * 4; img.data[k] = 255; img.data[k + 1] = Math.round(200 + lit * 55); img.data[k + 2] = Math.round(190 + lit * 50); img.data[k + 3] = Math.round(a * 255);
    }
    x.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(c);
  },
  // olas pixeladas para el mar y el río (se desplazan en el render)
  waveTex(base, light) {
    const [c, x] = U.makeCanvas(64, 64);
    x.fillStyle = base; x.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 70; i++) { const w = 2 + Math.floor(hash2(i, 3) * 6); x.fillStyle = i % 3 ? light : U.shade(base, -0.08); x.fillRect(Math.floor(hash2(i, 7) * 64), Math.floor(hash2(i, 11) * 64), w, 1); }
    const t = World3D.tex(c, true);
    return t;
  },
  // haz del faro: brillante junto a la lámpara, se desvanece con la distancia y en los bordes
  beamMat() {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { t: { value: 0 }, col: { value: new THREE.Color('#fff0b8') } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vL; void main(){ vL = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }',
      fragmentShader: `varying vec3 vN; varying vec3 vV; varying float vL; uniform float t; uniform vec3 col;
        void main(){
          float facing = abs(dot(normalize(vN), normalize(vV)));       // el centro del haz (de frente) brilla más que los bordes
          float along = pow(vL, 2.2) * smoothstep(0.0, 0.35, vL);          // más fuerte junto a la lámpara
          float dust = 0.8 + 0.2 * sin(vL * 40. - t * 3.);                 // polvo que se mueve dentro del haz
          float a = pow(facing, 1.5) * along * dust * 1.1;
          gl_FragColor = vec4(col * a, a); }`,
    });
  },
};

const Title3D = {
  built: false,
  SUN: [10, 7, -95],
  build() {
    if (this.built) return true;
    if (!World3D.init()) return false;
    const S = (this.scene = new THREE.Scene()), W3D = World3D;
    const tex = (c, rep) => W3D.tex(c, rep);
    const M = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
    S.fog = new THREE.Fog('#e88a70', 90, 420);
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
    const lead = ['tofu', 'buppa', 'parker'][Math.floor(Math.random() * 3)];
    const [sc] = U.makeCanvas(64, 64); this.petC = sc; this.petT = tex(sc); this.petSp = lead;
    this.pet = bill(this.petT, 2.1, 2.1, -1.2, -0.12, 3.2);
    // ---------- valle ----------
    const vT = tex(gc, true); vT.repeat.set(63, 32);
    const valley = new THREE.Mesh(new THREE.PlaneGeometry(420, 220), M('#d8c8c0', { map: vT })); valley.rotation.x = -Math.PI / 2; valley.position.set(0, -7, -100); valley.receiveShadow = true; S.add(valley);
    // río que serpentea hasta el mar, reflejando el sol
    const rp = [];
    for (let i = 0; i <= 40; i++) { const z = -4 - i * 2.2, x = -6 + Math.sin(i * 0.28) * 6 + i * 0.55; rp.push(new THREE.Vector3(x, -6.95, z)); }
    const curve = new THREE.CatmullRomCurve3(rp), pos = [], idx = [];
    for (let i = 0; i <= 120; i++) { const p = curve.getPoint(i / 120), tg = curve.getTangent(i / 120), nx = -tg.z, nz = tg.x, w = 1.1 + i / 120 * 1.8; pos.push(p.x + nx * w, p.y, p.z + nz * w, p.x - nx * w, p.y, p.z - nz * w); if (i < 120) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setIndex(idx); rg.computeVertexNormals();
    { const uv = []; for (let i = 0; i <= 120; i++) uv.push(0, i * 0.8, 1, i * 0.8); rg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); }
    this.riverT = TitleArt.waveTex('#ff9a70', '#ffd0a0');
    this.river = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: this.riverT, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })); S.add(this.river);
    // mar al fondo a la derecha
    this.seaT = TitleArt.waveTex('#c86a70', '#f0a888'); this.seaT.repeat.set(40, 24);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), new THREE.MeshBasicMaterial({ map: this.seaT })); sea.rotation.x = -Math.PI / 2; sea.position.set(70, -7.2, -95); S.add(sea);
    const glint = new THREE.Mesh(new THREE.PlaneGeometry(6, 60), new THREE.MeshBasicMaterial({ color: '#ffe0a0', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    glint.rotation.x = -Math.PI / 2; glint.position.set(14, -7.1, -75); S.add(glint); this.glint = glint;
    // pueblo con las casas del juego
    const village = new THREE.Group(); village.position.set(2, -7, -24); S.add(village);
    const proxy = Object.assign(Object.create(W3D), { root: village, buildings: [], chimney: new Map() });
    const houses = [{ x: 0, y: 0, w: 5, h: 4, style: 'house', door: 2 }, { x: 7, y: -2, w: 5, h: 4, style: 'house2', door: 2 }, { x: -6, y: -5, w: 5, h: 4, style: 'house3', door: 2 }, { x: 3, y: -9, w: 7, h: 5, style: 'center', door: 3 }, { x: 12, y: -8, w: 5, h: 4, style: 'mart', door: 2 }, { x: -3, y: -14, w: 5, h: 4, style: 'house', door: 2 }, { x: 9, y: -15, w: 5, h: 4, style: 'house2', door: 2 }];
    for (const b of houses) proxy.buildBuilding(b);
    for (const B of proxy.buildings) B.faceM.emissiveIntensity = 0.75;
    this.chim = [...proxy.chimney.values()].map(([x, y, z]) => [x + 2, y - 7, z - 24]);
    // faroles del pueblo
    for (let i = 0; i < 6; i++) { const l = new THREE.PointLight('#ffb060', 3, 7, 1.6); l.position.set(-4 + i * 4, -5.6, -26 + (i % 2) * 6); S.add(l); }
    // faro en la costa
    const lh = new THREE.Group(); lh.position.set(26, -7, -48); S.add(lh);
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.85 - i * 0.08, 0.95 - i * 0.08, 1.4, 12), M(i % 2 ? '#d84848' : '#f4f0e8')); m.position.y = 0.7 + i * 1.4; lh.add(m); }
    // balcón, sala de la lámpara con cristal y cúpula
    const gal = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.12, 16), M('#3a2a30')); gal.position.y = 7.05; lh.add(gal);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.38, 0.05), M('#3a2a30')); b.position.set(Math.cos(a) * 0.9, 7.3, Math.sin(a) * 0.9); lh.add(b); }
    const rail = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.035, 4, 24), M('#3a2a30')); rail.rotation.x = Math.PI / 2; rail.position.y = 7.48; lh.add(rail);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.75, 12), new THREE.MeshBasicMaterial({ color: '#fff2c0' })); lamp.position.y = 7.5; lh.add(lamp);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, f = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.78, 0.06), M('#2a1a20')); f.position.set(Math.cos(a) * 0.5, 7.5, Math.sin(a) * 0.5); lh.add(f); }
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), M('#c03a3a')); dome.position.y = 7.88; lh.add(dome);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), M('#2a1a20')); tip.position.y = 8.6; lh.add(tip);
    // resplandor de la lámpara (más fuerte cuando el haz apunta hacia la cámara)
    this.lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TitleArt.softTex(), color: '#ffe6a0', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.lampGlow.position.y = 7.5; this.lampGlow.scale.set(5, 5, 1); lh.add(this.lampGlow);
    // haz: cono abierto con brillo suave (más fuerte junto a la lámpara y en el centro)
    const bg = new THREE.ConeGeometry(4, 38, 24, 1, true); bg.translate(0, -19, 0); bg.rotateZ(Math.PI / 2);
    this.beamM = TitleArt.beamMat();
    const beam = new THREE.Mesh(bg, this.beamM);
    this.beam = new THREE.Group(); this.beam.position.y = 7.5; this.beam.add(beam); lh.add(this.beam); this.lh = lh;
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
    // tres cordilleras con relieve: la más lejana alta y nevada; la cercana, colinas boscosas
    S.add(TitleArt.range({ x0: -220, x1: 220, zc: -170, depth: 70, hmax: 80, gap: 40, seed: 3, haze: '#e8a0a8', hazeK: 0.28, rock: '#6a4a78', rockDark: '#3a2848', snow: '#fff0f6', rim: '#ffc8a0', rimK: 0.5 }).translateY(-7));
    S.add(TitleArt.range({ x0: -170, x1: 170, zc: -112, depth: 40, hmax: 38, gap: 24, seed: 7, haze: '#d890a0', hazeK: 0.14, rock: '#5a3e62', rockDark: '#2e2238', snow: '#f4e4f0', rim: '#ffb890', low: '#3a3048', rimK: 0.4 }).translateY(-7));
    S.add(TitleArt.range({ x0: -140, x1: 140, zc: -74, depth: 24, hmax: 12, gap: 16, seed: 11, rock: '#3e5a40', rockDark: '#24382c', low: '#2a4430', rim: '#d8b080', rimK: 0.25 }).translateY(-7));
    TitleArt.volcano(S, new THREE.Vector3(-52, -7, -100));
    // bosque lejano al pie de las montañas: rompe la línea recta entre el valle y la roca
    { const fg = new THREE.PlaneGeometry(26 / 16, 34 / 16); fg.translate(0, 15 / 16, 0);
      for (const [z0, z1, n, sc, col] of [[-84, -100, 260, 1.5, '#6a6a88'], [-100, -122, 260, 2.1, '#8a7a98']]) {
        const inst = new THREE.InstancedMesh(fg, new THREE.MeshBasicMaterial({ map: W3D.treeTex(3), alphaTest: 0.5, side: THREE.DoubleSide, color: col }), n);
        for (let i = 0; i < n; i++) { const x = -150 + hash2(i, z0) * 300, z = z0 + hash2(z0, i) * (z1 - z0); if (x > -62 && x < -42 && z < -92) { o.scale.setScalar(0); } else { o.position.set(x, -7, z); o.rotation.set(0, Math.atan2(-x, 12 - z), 0); o.scale.setScalar(sc * (0.8 + hash2(i * 3, z0) * 0.5)); } o.updateMatrix(); inst.setMatrixAt(i, o.matrix); }
        S.add(inst); } }
    // humo del volcán: bocanadas suaves que suben y se abren
    this.smoke = [];
    for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TitleArt.smokeTex(), color: '#8a7080', transparent: true, depthWrite: false })); S.add(s); this.smoke.push({ s, ph: i / 12 }); }
    const tower = new THREE.Group(); tower.position.set(-24, -7, -78); S.add(tower);
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 22, 8), M('#3a2850', { flatShading: true })); tw.position.y = 11; tower.add(tw);
    const sp = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4, 8), M('#2a1a40')); sp.position.y = 24; tower.add(sp);
    this.orb = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshBasicMaterial({ color: '#d080ff' })); this.orb.position.y = 26.6; tower.add(this.orb);
    // ---------- haces de luz del sol ----------
    // degradado: fuerte cerca del sol, se apaga hacia abajo y en los bordes (sin franjas duras)
    const [rc2, rx2] = U.makeCanvas(32, 128), rgd = rx2.createLinearGradient(0, 0, 0, 128);
    rgd.addColorStop(0, 'rgba(255,255,255,1)'); rgd.addColorStop(1, 'rgba(255,255,255,0)'); rx2.fillStyle = rgd; rx2.fillRect(0, 0, 32, 128);
    rx2.globalCompositeOperation = 'destination-in'; const rgx = rx2.createLinearGradient(0, 0, 32, 0); rgx.addColorStop(0, 'rgba(0,0,0,0)'); rgx.addColorStop(0.5, 'rgba(0,0,0,1)'); rgx.addColorStop(1, 'rgba(0,0,0,0)'); rx2.fillStyle = rgx; rx2.fillRect(0, 0, 32, 128);
    const rayT = new THREE.CanvasTexture(rc2);
    this.rays = new THREE.Group(); this.rays.position.set(...this.SUN).multiplyScalar(0.6); S.add(this.rays);
    for (let i = 0; i < 9; i++) {
      const g = new THREE.PlaneGeometry(4 + (i % 3) * 3, 120); g.translate(0, -60, 0);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: rayT, color: '#ffd8a0', transparent: true, opacity: 0.06, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
      m.rotation.z = (i - 4) * 0.13; this.rays.add(m);
    }
    // ---------- nubes bajas ----------
    const cts = [TitleArt.cloudTex(1), TitleArt.cloudTex(5), TitleArt.cloudTex(9)];
    this.clouds = [];
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 15), new THREE.MeshBasicMaterial({ map: cts[i % 3], transparent: true, opacity: 0.8, depthWrite: false, color: i % 2 ? '#ffc0b0' : '#ffa898', fog: false }));
      m.position.set(-90 + i * 24, 14 + (i % 3) * 7, -110 - (i % 2) * 15); S.add(m); this.clouds.push(m);
    }
    // ---------- ánima legendaria que cruza el cielo ----------
    const leg = CreatureGfx.get('marealis', 96), lt = tex(leg);
    this.legend = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: lt, alphaTest: 0.5, side: THREE.DoubleSide, color: '#ffc8d8', fog: false })); S.add(this.legend);
    // pájaros
    this.birds = [];
    // silueta de pájaro en dos poses (alas arriba / abajo), pixelada
    const birdT = ['..........', 'X........X', '.XX....XX.', '...XXXX...'].length && [0, 1].map((f) => {
      const rows = f ? ['..........', '..........', 'XXX.XX.XXX', '...X..X...', '..........'] : ['X........X', '.X......X.', '..XX..XX..', '....XX....', '..........'];
      const [c, x] = U.makeCanvas(10, 5); x.fillStyle = '#2a1428';
      rows.forEach((r, y) => { for (let i = 0; i < 10; i++) if (r[i] === 'X') x.fillRect(i, y, 1, 1); });
      return World3D.tex(c);
    });
    this.birdT = birdT;
    for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: birdT[0], alphaTest: 0.5, side: THREE.DoubleSide, fog: false })); S.add(b); this.birds.push(b); }
    // ---------- pétalos y luciérnagas delante de la cámara ----------
    const n = 90, ppos = new Float32Array(n * 3), pcol = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { ppos[i * 3] = -12 + Math.random() * 24; ppos[i * 3 + 1] = Math.random() * 6; ppos[i * 3 + 2] = Math.random() * 8 - 2; const c = new THREE.Color(i % 3 ? '#ffd0e0' : '#fff4a0'); pcol.set([c.r, c.g, c.b], i * 3); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(ppos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pcol, 3));
    const [dc, dx] = U.makeCanvas(8, 8); const dg = dx.createRadialGradient(4, 4, 0, 4, 4, 4); dg.addColorStop(0, 'rgba(255,255,255,1)'); dg.addColorStop(1, 'rgba(255,255,255,0)'); dx.fillStyle = dg; dx.fillRect(0, 0, 8, 8);
    this.motes = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.16, map: new THREE.CanvasTexture(dc), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); this.moteBase = ppos.slice(); S.add(this.motes);
    this.cam = new THREE.PerspectiveCamera(42, WIDE / H, 0.5, 400);
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
    for (const s of this.smoke) { const q = (s.ph + t * 0.04) % 1; s.s.position.set(-52 + q * 16 + Math.sin(q * 5 + s.ph * 9) * 1.5, 18.5 + q * 26, -100 + q * 4); s.s.scale.setScalar(2.5 + q * 9); s.s.material.rotation = s.ph * 6 + q; s.s.material.opacity = 0.5 * (1 - q) * Math.min(1, q * 6); }
    this.beamM.uniforms.t.value = t;
    // el resplandor del faro crece cuando el haz apunta hacia la cámara
    { const bd = new THREE.Vector3(1, 0, 0).applyQuaternion(this.beam.getWorldQuaternion(new THREE.Quaternion())), tc = this.cam.position.clone().sub(this.lh.getWorldPosition(new THREE.Vector3())).normalize(); const k = Math.max(0, bd.dot(tc)); this.lampGlow.material.opacity = 0.3 + Math.pow(k, 8) * 0.8; this.lampGlow.scale.setScalar(2.6 + Math.pow(k, 8) * 6); }
    this.seaT.offset.x = (t * 0.02) % 1; this.seaT.offset.y = Math.sin(t * 0.3) * 0.03; this.riverT.offset.y = (-t * 0.25) % 1;
    for (const c of this.clouds) { c.position.x += 0.012; if (c.position.x > 130) c.position.x = -130; c.lookAt(this.cam.position); }
    this.rays.lookAt(this.cam.position); this.rays.children.forEach((r, i) => { r.material.opacity = 0.03 + 0.025 * Math.sin(t * 0.7 + i * 1.3); });
    // ánima legendaria: cruza cada 16 s
    const L = (t % 16) / 16;
    this.legend.visible = t > 5;
    this.legend.position.set(-70 + L * 150, 22 + Math.sin(L * Math.PI) * 10 + Math.sin(t * 2) * 0.6, -70); this.legend.lookAt(this.cam.position);
    this.legend.scale.x = 1;
    // bandada de pájaros
    this.birds.forEach((b, i) => { const q = ((t * 0.04 + i * 0.012) % 1); b.position.set(30 - q * 90 + (i % 3) * 1.5, 10 + Math.sin(q * 6 + i) * 1.5 + (i % 2), -40 + (i % 4)); b.lookAt(this.cam.position); b.material.map = this.birdT[Math.floor(t * 6 + i * 1.7) % 2]; });
    const p = this.motes.geometry.attributes.position, mb = this.moteBase;
    for (let i = 0; i < p.count; i++) { p.array[i * 3] = mb[i * 3] + Math.sin(t * 0.4 + i) * 0.8 - ((t * 0.3 + i) % 6) + 3; p.array[i * 3 + 1] = mb[i * 3 + 1] + Math.sin(t * 0.7 + i * 1.7) * 0.3; }
    p.needsUpdate = true;
    W3D.fitCanvas();
    if ((this.pixN = (this.pixN || 0) + 1) % 60 === 1) W3D.pixelize(this.scene); // mismo muestreo sin titileo que el mundo
    const post = W3D.post.uniforms; post.exposure.value = 0.95; post.night.value = 0.4; post.dof.value = 0;
    W3D.r.setRenderTarget(W3D.rt); W3D.renderScene(this.scene, this.cam);
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
    this.classic = Options.gfx3d === false || !Title3D.render(t);
    if (this.classic) return _draw.call(this, ctx);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, WIDE, H); ctx.restore();
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
    if (t > 4.5) { Font.drawRight(ctx, this.menu ? '' : 'Un juego original', W - 6, 229, '#ffe8d8'); }
  };
}

// ---------- aviso de sonido ----------
// Los navegadores no dejan sonar nada hasta el primer toque (salvo, normalmente, en la app instalada).
{
  const TS = TitleScreen.prototype, _draw = TS.draw;
  TS.draw = function (ctx) {
    _draw.call(this, ctx);
    if (!(Options.music > 0 || Options.sfx > 0) || (Sound.ctx && Sound.ctx.state === 'running')) return;
    if (!this.classic && this.t < 1) return;
    const s = '♪ Toca para activar el sonido', w = Font.width(s);
    ctx.globalAlpha = 0.65 + 0.35 * Math.sin(this.t * 3);
    Font.drawOutlined(ctx, s, W - w - 8, 6, '#fff4d8', '#3a1030');
    ctx.globalAlpha = 1;
  };
}
