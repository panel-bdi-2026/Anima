'use strict';
// ============================================================
//  MUNDO 3D: paisaje lejano en los bordes del mapa
//  Donde el mapa termina en un muro de árboles o de roca, el bosque sigue
//  unas casillas más allá (cada vez más apagado por la bruma), en vez de
//  verse un llano vacío. Solo en exteriores y nunca delante de la cámara
//  (abajo), ni en el mar ni frente a los caminos que salen del mapa.
//  Son árboles planos instanciados: 1 dibujo por variante, sin sombra.
// ============================================================
{
  const _build = World3D.build;
  World3D.build = function (world) {
    const r = _build.apply(this, arguments);
    try { if (this.mode === 'out' && world.map && world.map.outdoor) this.buildFar(world); } catch (e) { console.error(e); }
    return r;
  };
  World3D.buildFar = function (world) {
    const m = world.map, wall = (tx, ty) => { const d = world.tileAt(U.clamp(tx, 0, m.w - 1), U.clamp(ty, 0, m.h - 1)); return !!(d && (d.canopy || (d.solid && !d.water))); };
    const spots = [], R = 7;
    for (let ty = -R; ty < m.h; ty++) for (let tx = -R; tx < m.w + R; tx++) {
      if (tx >= 0 && tx < m.w && ty >= 0) continue; // dentro del mapa
      // casilla del borde más cercana: si allí no hay muro (camino, agua…), aquí tampoco
      const ex = U.clamp(tx, 0, m.w - 1), ey = U.clamp(ty, 0, m.h - 1);
      if (!wall(ex, ey) || !wall(ex - 1, ey) || !wall(ex + 1, ey) || !wall(ex, ey - 1) || !wall(ex, ey + 1)) continue;
      const dist = Math.max(tx < 0 ? -tx : tx >= m.w ? tx - m.w + 1 : 0, ty < 0 ? -ty : 0);
      if (hash2(tx * 5 + 11, ty * 7 + 3) < 0.12 + dist * 0.03) continue; // claros sueltos
      spots.push([tx, ty, dist]);
    }
    if (!spots.length) return;
    const volc = !!m.volcanic, byV = {};
    for (const [tx, ty, dist] of spots) { const v = Math.floor(hash2(tx * 7, ty * 3) * 7); (byV[v] = byV[v] || []).push([tx, ty, dist]); }
    const o = new THREE.Object3D(), col = new THREE.Color();
    for (const v in byV) {
      const list = byV[v], tex = this.treeTex(parseInt(v, 10));
      const g = new THREE.PlaneGeometry(26 / 16, 34 / 16); g.translate(0, 17 / 16 - 2 / 16, 0);
      const mat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, color: '#ffffff' });
      const inst = new THREE.InstancedMesh(g, mat, list.length);
      list.forEach(([tx, ty, dist], i) => {
        const s = W3.TREE * (0.95 + hash2(tx, ty * 5) * 0.35 + dist * 0.04);
        o.position.set(tx + 0.5 + (hash2(tx * 3, ty) - 0.5) * 0.5, -0.02, ty + 0.85 + (hash2(tx, ty * 9) - 0.5) * 0.3);
        o.rotation.set(-W3.PITCH * 0.35, 0, 0); o.scale.set(s, s, s); o.updateMatrix(); inst.setMatrixAt(i, o.matrix);
        // más lejos, más oscuro y azulado (profundidad); en tierra volcánica, árboles secos y grises
        const k = Math.min(1, dist / R);
        col.set(volc ? '#9a8a80' : '#c8d8c0').lerp(new THREE.Color(volc ? '#4a3c38' : '#5a7a7a'), k * 0.6);
        inst.setColorAt(i, col);
      });
      inst.userData.keep = true;
      this.root.add(inst);
    }
  };
}
