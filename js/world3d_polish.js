'use strict';
// ============================================================
//  MUNDO 3D: PULIDO DE TEXTURAS
//  - Ánimas y personajes: luz de borde del lado del sol, sombreado
//    suave de arriba abajo y oclusión en los pies, para que no
//    parezcan recortes planos sobre el escenario.
//  - Suelo: variación de color a gran escala (zonas más verdes,
//    más secas o más oscuras) que rompe la repetición de las
//    casillas, y bordes más suaves entre caminos y hierba.
// ============================================================
{
  // material de sprite con iluminación de volumen
  World3D.spriteMat = function (tex) {
    const m = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    this.rimU = this.rimU || { uRim: { value: new THREE.Color('#fff0d0') }, uRimK: { value: 1 } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.rimU);
      sh.uniforms.uTexel = { value: new THREE.Vector2(1 / tex.image.width, 1 / tex.image.height) };
      sh.fragmentShader = 'uniform vec3 uRim; uniform float uRimK; uniform vec2 uTexel;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        // borde: píxel opaco con vecino transparente arriba-izquierda (lado del sol)
        float aL = texture2D(map, vUv + vec2(-uTexel.x * 2., 0.)).a, aU = texture2D(map, vUv + vec2(0., uTexel.y * 2.)).a;
        float aR = texture2D(map, vUv + vec2(uTexel.x * 2., 0.)).a, aD = texture2D(map, vUv - vec2(0., uTexel.y * 2.)).a;
        float rim = (1. - min(aL, aU)) * step(0.5, diffuseColor.a);
        float back = (1. - min(aR, aD)) * step(0.5, diffuseColor.a);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.55 + uRim * 0.55, rim * 0.45 * uRimK);
        diffuseColor.rgb *= 1. - back * 0.18;
        // sombreado vertical suave y oclusión en la base
        diffuseColor.rgb *= mix(0.86, 1.04, smoothstep(0.08, 0.7, vUv.y));`);
    };
    return m;
  };
  const _sprite = World3D.sprite;
  World3D.sprite = function (key, w, h, footY, res = 1) {
    const had = this.sprites.has(key), s = _sprite.call(this, key, w, h, footY, res);
    if (!had) { s.mesh.material.dispose(); s.mesh.material = this.spriteMat(s.t); }
    return s;
  };
  // la luz de borde sigue el color del sol (cálida de día, fría de noche, apagada en cuevas)
  const _light = World3D.syncLight;
  World3D.syncLight = function (world) {
    const r = _light.call(this, world);
    if (this.rimU) {
      const L = world.lightLevel(), day = U.clamp(1 - L.a / 0.6, 0, 1);
      this.rimU.uRim.value.set('#a0b0ff').lerp(new THREE.Color(L.tint && L.ta ? '#ffb070' : '#fff0d0'), day);
      this.rimU.uRimK.value = this.mode === 'cave' ? 0.35 : this.mode === 'in' ? 0.6 : 0.5 + 0.5 * day;
    }
    return r;
  };
  // suelo: variación de color a gran escala
  const _build = World3D.build;
  World3D.build = function (world) {
    _build.call(this, world);
    if (this.mode !== 'out' || !this.gStatic) return;
    const g = this.gStatic, x = g.getContext('2d'), Wp = g.width, Hp = g.height;
    const [n, nx] = U.makeCanvas(Math.ceil(Wp / 16), Math.ceil(Hp / 16));
    const N = TerrainNoise, seed = N.seed; N.seed = 97;
    const im = nx.createImageData(n.width, n.height);
    for (let ty = 0; ty < n.height; ty++) for (let tx = 0; tx < n.width; tx++) {
      const v = N.smooth(tx / 7, ty / 7) * 0.65 + N.smooth(tx / 3 + 20, ty / 3) * 0.35, dry = N.smooth(tx / 11 + 50, ty / 11 + 9);
      const o = (ty * n.width + tx) * 4;
      // más claro y amarillento en zonas secas, más oscuro y azulado en zonas húmedas
      im.data[o] = 128 + (v - 0.5) * 40 + (dry - 0.5) * 30; im.data[o + 1] = 128 + (v - 0.5) * 34 + (dry - 0.5) * 12; im.data[o + 2] = 128 + (v - 0.5) * 30 - (dry - 0.5) * 30; im.data[o + 3] = 255;
    }
    N.seed = seed;
    nx.putImageData(im, 0, 0);
    x.save(); x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.5; x.imageSmoothingEnabled = true; x.drawImage(n, 0, 0, Wp, Hp); x.restore();
    this.gAnim.getContext('2d').drawImage(g, 0, 0); this.gTex.needsUpdate = true;
  };
}
