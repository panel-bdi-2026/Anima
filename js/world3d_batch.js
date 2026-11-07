'use strict';
// ============================================================
//  MUNDO 3D: juntar lo que no se mueve (rendimiento en el celular)
//  Al terminar de armar cada mapa, las piezas quietas que comparten material
//  (tapas de barriles, postes, cercas, piedras, ganchos, macetas…) se juntan en
//  una sola malla por material. Cada malla separada es un «dibujo» por cuadro
//  (y otro más si da sombra): un pueblo pasaba de 575 dibujos por cuadro.
//  No se toca nada de lo que el juego anima o cambia: todo lo que World3D guarda
//  en sus listas (edificios que se vuelven transparentes, agua, nubes, personajes,
//  objetos de puzles, botes, lava, recolección, luces…) queda como estaba.
// ============================================================
{
  const isObj = (v) => v && typeof v === 'object';
  // todo lo que World3D guarda (directo, en listas, mapas o fichas de hasta 3 niveles)
  const kept = (W3) => {
    const set = new Set();
    const walk = (v, d) => {
      if (!isObj(v) || d > 3) return;
      if (v.isObject3D) { set.add(v); return; }
      if (v.isMaterial || v.isTexture || v.isBufferGeometry || ArrayBuffer.isView(v)) return;
      if (Array.isArray(v)) { for (const x of v) walk(x, d + 1); return; }
      if (v instanceof Map) { for (const x of v.values()) walk(x, d + 1); for (const x of v.keys()) walk(x, d + 1); return; }
      if (v instanceof Set) { for (const x of v) walk(x, d + 1); return; }
      if (Object.getPrototypeOf(v) === Object.prototype) for (const k in v) walk(v[k], d + 1);
    };
    for (const k of Object.keys(W3)) if (k !== 'root' && k !== 'scene') walk(W3[k], 0);
    return set;
  };
  // materiales que el juego cambia (brillo de ventanas, transparencia de edificios, lava…): no se unifican
  const keptMats = (W3, keep) => {
    const set = new Set();
    const walk = (v, d) => {
      if (!isObj(v) || d > 3) return;
      if (v.isMaterial) { set.add(v); return; }
      if (v.isObject3D) { v.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => set.add(m)); }); return; }
      if (v.isTexture || v.isBufferGeometry || ArrayBuffer.isView(v)) return;
      if (Array.isArray(v)) { for (const x of v) walk(x, d + 1); return; }
      if (v instanceof Map) { for (const x of v.values()) walk(x, d + 1); return; }
      if (v instanceof Set) { for (const x of v) walk(x, d + 1); return; }
      if (Object.getPrototypeOf(v) === Object.prototype) for (const k in v) walk(v[k], d + 1);
    };
    for (const k of Object.keys(W3)) if (k !== 'root' && k !== 'scene') walk(W3[k], 0);
    return set;
  };
  // misma apariencia = mismo material (así las piezas de distintos objetos se pueden juntar)
  const matSig = (m) => [m.type, m.color && m.color.getHexString(), m.emissive && m.emissive.getHexString(), m.emissiveIntensity, m.map && m.map.uuid, m.emissiveMap && m.emissiveMap.uuid,
    m.transparent, m.opacity, m.side, m.alphaTest, m.vertexColors, m.depthWrite, m.flatShading, m.fog, m.toneMapped, m.blending].join('|');
  const sig = (g) => Object.keys(g.attributes).sort().map((k) => k + g.attributes[k].itemSize).join(',');
  World3D.batchStatic = function () {
    const root = this.root; if (!root) return 0;
    const keep = kept(this), groups = new Map(), km = keptMats(this, keep), canon = new Map();
    // los materiales con sombreador propio (viento, agua) quedan aparte
    const same = (m) => { if (km.has(m) || Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile')) return m; const k = matSig(m); if (!canon.has(k)) canon.set(k, m); return canon.get(k); };
    root.updateWorldMatrix(true, true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const visit = (o) => {
      if (keep.has(o) || o.userData.keep) return;
      for (const c of o.children.slice()) visit(c);
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.visible || Array.isArray(o.material)) return;
      const g = o.geometry; if (!g || !g.attributes.position || g.morphAttributes && Object.keys(g.morphAttributes).length) return;
      o.material = same(o.material);
      const key = o.material.uuid + '|' + o.castShadow + o.receiveShadow + '|' + o.renderOrder + '|' + sig(g);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(o);
    };
    for (const c of root.children.slice()) visit(c);
    let merged = 0;
    for (const list of groups.values()) {
      if (list.length < 2) { const o = list[0]; if (o.castShadow && o.geometry.boundingSphere === null) o.geometry.computeBoundingSphere(); if (o.castShadow && o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z) < 0.3) o.castShadow = false; continue; }
      const parts = list.map((o) => { const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); return g; });
      const names = Object.keys(parts[0].attributes);
      let n = 0; for (const p of parts) n += p.attributes.position.count;
      const out = new THREE.BufferGeometry();
      for (const a of names) {
        const sz = parts[0].attributes[a].itemSize, arr = new Float32Array(n * sz); let off = 0;
        for (const p of parts) { arr.set(p.attributes[a].array, off); off += p.attributes[a].array.length; }
        out.setAttribute(a, new THREE.BufferAttribute(arr, sz));
      }
      for (const p of parts) p.dispose();
      out.computeBoundingSphere();
      const first = list[0], mesh = new THREE.Mesh(out, first.material);
      mesh.castShadow = first.castShadow; mesh.receiveShadow = first.receiveShadow; mesh.renderOrder = first.renderOrder;
      // piezas chicas sueltas (macetas, ganchos, tapas…): su sombra casi no se ve y cuesta un dibujo más
      if (mesh.castShadow && out.boundingSphere.radius < 0.3) mesh.castShadow = false;
      for (const o of list) o.parent.remove(o);
      root.add(mesh);
      merged += list.length - 1;
    }
    return merged;
  };
  const _build = World3D.build;
  World3D.build = function (world) {
    const r = _build.apply(this, arguments);
    try { this.lastBatch = this.batchStatic(); } catch (e) { console.error(e); }
    return r;
  };
}
// sombras: en calidad media se recalculan cada 2 cuadros y en baja cada 3 (en alta, siempre).
// Lo quieto no cambia; lo que se mueve (personas, ánimas) apenas se nota con un cuadro de retraso.
{
  const _render = World3D.render;
  World3D.render = function (world) {
    const r = this.r;
    if (r && r.shadowMap.enabled) {
      const q = typeof Mobile !== 'undefined' && Mobile.quality ? Mobile.quality() : 'alta', every = q === 'baja' ? 3 : q === 'media' ? 2 : 1;
      this.shadowTick = (this.shadowTick || 0) + 1;
      r.shadowMap.autoUpdate = false;
      if (every === 1 || this.shadowTick % every === 0 || this.mapId !== this.shadowMap0) { r.shadowMap.needsUpdate = true; this.shadowMap0 = this.mapId; }
    }
    return _render.apply(this, arguments);
  };
}
