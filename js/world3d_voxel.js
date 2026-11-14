'use strict';
// ============================================================
//  MUNDO 3D: ÁRBOLES CON VOLUMEN
//  Antes cada árbol era un dibujo plano de pie (un recorte de papel). Ahora es un tronco y una copa
//  de bloques de hojas en 3D, con textura pixelada al mismo tamaño de píxel que el resto (un píxel
//  = medio píxel del mundo): reciben la luz del sol por cada cara, dan sombra de verdad y se mecen.
//  - Los árboles de la franja de abajo (los que taparían la vista) siguen planos y transparentes.
//  - Si un árbol tapa al jugador o a las ánimas, se vuelve translúcido.
//  - Todo va instanciado: 6 dibujos para todos los árboles del mapa (más sus versiones translúcidas).
// ============================================================
{
  // piezas de un árbol (centro x, y, z; ancho, alto, fondo), en casillas, antes de la escala del árbol
  const TRONCO = [0, 0.42, 0, 0.26, 0.84, 0.26];
  const COPA = [
    [0, 1.2, 0, 1.3, 0.85, 1.3],
    [-0.52, 1.08, 0.06, 0.62, 0.62, 0.86],
    [0.52, 1.12, -0.06, 0.62, 0.68, 0.86],
    [0.02, 1.12, 0.52, 0.9, 0.62, 0.52],
    [0, 1.78, 0, 0.82, 0.5, 0.82],
  ];
  const TEX = 0.5; // casillas que ocupa la textura (16 píxeles = medio píxel del mundo cada uno)

  // caja con las coordenadas de textura a escala real: la textura se repite según el tamaño de cada cara
  const caja = (w, h, d) => {
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0] / TEX, uv.getY(i) * dims[f][1] / TEX); }
    // sombreado propio de cada cara (como en los vóxeles): arriba clara, costados más oscuros, abajo en sombra;
    // y cada costado más oscuro hacia su base. Así cada árbol se distingue del de al lado.
    // caras de BoxGeometry: +x, -x, +y, -y, +z (hacia la cámara), -z
    const FACE = [0.74, 0.66, 1.0, 0.42, 0.84, 0.58], pos = g.attributes.position, col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const f = Math.floor(i / 4), side = f !== 2 && f !== 3, low = side && pos.getY(i) < 0 ? 0.78 : 1, k = FACE[f] * low;
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  };
  // textura de hojas: manchas de los tonos de la copa, con brillos y huecos oscuros (16×16, pixelada)
  const hojas = (tones, seed) => {
    const [c, x] = U.makeCanvas(16, 16), rr = mulberry(seed);
    x.fillStyle = tones[2]; x.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 70; i++) { x.fillStyle = tones[1 + Math.floor(rr() * 3)]; const px = Math.floor(rr() * 16), py = Math.floor(rr() * 16); x.fillRect(px, py, rr() < 0.5 ? 2 : 1, 1); }
    for (let i = 0; i < 18; i++) { x.fillStyle = tones[0]; x.fillRect(Math.floor(rr() * 16), Math.floor(rr() * 16), 1, 1); }
    for (let i = 0; i < 14; i++) { x.fillStyle = tones[4]; x.fillRect(Math.floor(rr() * 16), Math.floor(rr() * 16), 1, 1); }
    const t = World3D.tex(c, true); t.shared = true; return t;
  };
  const corteza = () => {
    const [c, x] = U.makeCanvas(16, 16), rr = mulberry(77);
    x.fillStyle = '#6a4428'; x.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 16; i += 3) { x.fillStyle = '#4e3020'; x.fillRect(i, 0, 1, 16); }
    for (let i = 0; i < 24; i++) { x.fillStyle = rr() < 0.5 ? '#86583a' : '#3e2618'; x.fillRect(Math.floor(rr() * 16), Math.floor(rr() * 16), 1, 2); }
    const t = World3D.tex(c, true); t.shared = true; return t;
  };
  // viento: la copa se mece más arriba; el tronco casi nada
  const viento = (mat, k) => {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = World3D.windU;
      sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
float wy = max((instanceMatrix * vec4(transformed, 1.0)).y, 0.0);
transformed.x += sin(uWind * 1.2 + instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 0.9) * ${k.toFixed(3)} * wy;
#endif`);
    };
    return mat;
  };

  // arma los árboles de bloques de una lista [{x, z, s}] (opts.far: lejanos, sin sombra ni versión translúcida)
  const voxel = (W3D, list, volc, opts = {}) => {
    W3D.windU = W3D.windU || { value: 0 };
    const TONES = volc ? [['#a89070', '#7a6650', '#5a4a3c', '#40342c', '#2a221e']] : [
      ['#a8e080', '#76c45c', '#4ea24a', '#2f7a3a', '#1c5430'],
      ['#b8e488', '#84cc60', '#58aa48', '#36843a', '#1e5a30'],
      ['#98d47a', '#66b45a', '#428e48', '#286a38', '#164a2c'],
    ];
    const C = W3D.voxMat || (W3D.voxMat = {});
    const key = volc ? 'v' : 'g';
    if (!C[key]) {
      const barkT = corteza();
      C[key] = {
        sets: TONES.map((tones, ti) => {
          const leafT = hojas(tones, 300 + ti * 17);
          return { solid: viento(new THREE.MeshLambertMaterial({ map: leafT, vertexColors: true }), 0.03), ghost: viento(new THREE.MeshLambertMaterial({ map: leafT, vertexColors: true, transparent: true, opacity: 0.32, depthWrite: false }), 0.03) };
        }),
        barkS: viento(new THREE.MeshLambertMaterial({ map: barkT, vertexColors: true }), 0.005),
        barkG: viento(new THREE.MeshLambertMaterial({ map: barkT, vertexColors: true, transparent: true, opacity: 0.32, depthWrite: false }), 0.005),
      };
    }
    const { sets, barkS, barkG } = C[key], piezas = [TRONCO, ...COPA];
    // mallas: por pieza y por tono, una sólida y una translúcida (los árboles tapados pasan a la translúcida)
    const byTone = TONES.map(() => []);
    list.forEach((T) => { T.tone = Math.floor(hash2(Math.floor(T.x) * 3, Math.floor(T.z) * 5) * TONES.length); byTone[T.tone].push(T); });
    const o = new THREE.Object3D(), part = new THREE.Object3D(), tint = new THREE.Color(), Z = new THREE.Matrix4().makeScale(0, 0, 0);
    byTone.forEach((trees, ti) => {
      if (!trees.length) return;
      piezas.forEach((p, pi) => {
        const g = caja(p[3], p[4], p[5]);
        const mk = (mat) => { const m = new THREE.InstancedMesh(g, mat, trees.length); m.castShadow = !opts.far; m.receiveShadow = true; m.userData.keep = true; W3D.root.add(m); return m; };
        const S = mk(pi === 0 ? barkS : sets[ti].solid), G = opts.far ? null : mk(pi === 0 ? barkG : sets[ti].ghost);
        if (G) G.castShadow = false;
        trees.forEach((T, i) => {
          const s = T.s * (0.86 + hash2(Math.floor(T.x) * 29, Math.floor(T.z) * 31) * 0.26), ry = hash2(Math.floor(T.x) * 13, Math.floor(T.z) * 7) * Math.PI * 2;
          o.position.set(T.x, 0, T.z - 0.25); o.rotation.set(0, ry, 0); o.scale.set(s, s, s); o.updateMatrix();
          part.position.set(p[0], p[1], p[2]); part.rotation.set(0, 0, 0); part.scale.set(1, 1, 1); part.updateMatrix();
          const M = new THREE.Matrix4().multiplyMatrices(o.matrix, part.matrix);
          S.setMatrixAt(i, M); if (G) G.setMatrixAt(i, Z);
          // cada árbol con su tono (más claro, más oscuro, más cálido o más frío); los lejanos, apagados por la bruma
          const tx = Math.floor(T.x), tz = Math.floor(T.z), l = 0.86 + hash2(tx * 13, tz * 7) * 0.22, w = (hash2(tx * 5, tz * 11) - 0.5) * 0.14;
          tint.setRGB(Math.min(1, l * (1 + w)), Math.min(1, l), Math.min(1, l * (1 - w)));
          if (pi === 0) tint.setRGB(1, 1, 1);
          if (T.fog) tint.lerp(new THREE.Color(volc ? '#4a3c38' : '#5a7a7a'), T.fog);
          S.setColorAt(i, tint); if (G) G.setColorAt(i, tint);
          (T.vox = T.vox || []).push({ S, G, i, M });
        });
      });
    });
  };

  const _bt = World3D.buildTrees;
  World3D.buildTrees = function (world) {
    _bt.call(this, world);
    this.voxTrees = null;
    if (this.mode !== 'out' || !this.trees.length || Options.voxelTrees === false) return;
    const list = this.trees, Z = new THREE.Matrix4().makeScale(0, 0, 0);
    voxel(this, list, !!world.map.volcanic);
    // el árbol plano de antes se oculta; para quitar un árbol (world3d_towns) se ocultan sus bloques
    for (const T of list) {
      T.inst.setMatrixAt(T.i, Z); T.inst.instanceMatrix.needsUpdate = true;
      const vox = T.vox;
      T.inst = { setMatrixAt: () => { for (const v of vox) { v.S.setMatrixAt(v.i, Z); v.G.setMatrixAt(v.i, Z); v.S.instanceMatrix.needsUpdate = v.G.instanceMatrix.needsUpdate = true; v.M = Z; } }, instanceMatrix: {} };
      T.i = 0; T.ghostOn = false;
    }
    this.voxTrees = list;
  };

  // los árboles lejanos (más allá del borde del mapa) también de bloques: el bosque entero con el mismo estilo
  const _far = World3D.buildFar;
  World3D.buildFar = function (world) {
    const n0 = this.root.children.length;
    _far.call(this, world);
    if (Options.voxelTrees === false) return;
    const added = this.root.children.slice(n0).filter((o) => o.isInstancedMesh), list = [], M = new THREE.Matrix4(), P = new THREE.Vector3(), Q = new THREE.Quaternion(), S = new THREE.Vector3();
    for (const inst of added) {
      for (let i = 0; i < inst.count; i++) {
        inst.getMatrixAt(i, M); M.decompose(P, Q, S);
        const m = world.map, dist = Math.max(P.x < 0 ? -P.x : P.x > m.w ? P.x - m.w : 0, P.z < 0 ? -P.z : 0);
        list.push({ x: P.x, z: P.z, s: S.x, fog: Math.min(0.6, dist / 7 * 0.6) });
      }
      this.root.remove(inst); inst.geometry.dispose(); inst.material.dispose();
    }
    if (list.length) voxel(this, list, !!world.map.volcanic, { far: true });
  };

  // árboles que tapan: pasan a la versión translúcida (y vuelven cuando ya no tapan)
  const _occ = World3D.occlusion;
  World3D.occlusion = function (world) {
    if (!this.voxTrees) return _occ.call(this, world);
    const keep = this.trees; this.trees = [];
    try { _occ.call(this, world); } finally { this.trees = keep; }
    const B = world.battle, who = [];
    if (!(B && B.hidePlayer)) who.push([(world.player.px + 8) / 16, (world.player.py + 14) / 16]);
    if (!world.follower.hidden && !B) who.push([(world.follower.px + 8) / 16, (world.follower.py + 14) / 16]);
    if (B) { for (const f of B.fighters()) if (!f.inBall) who.push([f.x / 16, (f.y + 4) / 16]); if (B.trainer) who.push([B.trainer.x / 16, B.trainer.y / 16]); }
    for (const T of this.voxTrees) {
      let hide = false;
      for (const [x, z] of who) if (T.z > z + 0.05 && T.z < z + 3.2 && Math.abs(T.x - x) < 1.7) { hide = true; break; }
      if (hide === T.ghostOn) continue;
      T.ghostOn = hide;
      const Z = new THREE.Matrix4().makeScale(0, 0, 0);
      for (const v of T.vox) {
        if (!v.G || v.M === Z || v.M.elements[0] === 0) continue;
        v.S.setMatrixAt(v.i, hide ? Z : v.M); v.G.setMatrixAt(v.i, hide ? v.M : Z);
        v.S.instanceMatrix.needsUpdate = v.G.instanceMatrix.needsUpdate = true;
      }
    }
  };
}
