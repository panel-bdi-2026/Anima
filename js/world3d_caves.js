'use strict';
// ============================================================
//  MUNDO 3D: CUEVAS CON MÁS CARÁCTER
//  Sobre las paredes de roca que dan al camino: picos de piedra
//  (estalagmitas) y racimos de cristales que brillan en la oscuridad.
//  Todo va encima de la pared (no cambia por dónde se camina) y usa
//  el mismo agujero de visión que la roca, así nunca tapa al jugador.
// ============================================================
{
  const _build = World3D.build;
  World3D.build = function (world) {
    const r = _build.apply(this, arguments);
    if (this.mode === 'cave') { try { this.buildCaveDecor(world); } catch (e) { console.error(e); } }
    return r;
  };
  World3D.buildCaveDecor = function (world) {
    const m = world.map, HC = 1.35;
    const wall = (x, y) => { const d = world.tileAt(x, y); return !d || d.t === 'cavewall' || d.t === 'void'; };
    const cols = [['#8ae0f0', '#2aa0c0'], ['#c8a0ff', '#7a4ad0'], ['#a0f0c0', '#30a070']];
    const pal = cols[Math.floor(hash2(m.id.length, m.w) * cols.length)];
    const rockM = this.cutaway(new THREE.MeshLambertMaterial({ color: '#6a6276', flatShading: true }));
    const crysM = this.cutaway(new THREE.MeshLambertMaterial({ color: pal[0], emissive: pal[1], emissiveIntensity: 0.9, flatShading: true }));
    const spike = new THREE.ConeGeometry(0.13, 0.55, 5), gem = new THREE.OctahedronGeometry(0.1, 0);
    const spikes = [], gems = [];
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      if (!wall(tx, ty)) continue;
      // solo en el borde (junto al suelo): por dentro de la roca no se ven
      const edge = !wall(tx, ty + 1) || !wall(tx - 1, ty) || !wall(tx + 1, ty) || !wall(tx, ty - 1);
      if (!edge) continue;
      const h = hash2(tx * 7 + 3, ty * 11 + 5), y = HC + 0.1;
      if (h < 0.22) for (let i = 0; i < 2 + Math.floor(h * 10) % 2; i++) spikes.push([tx + 0.25 + hash2(tx + i, ty) * 0.5, y, ty + 0.25 + hash2(tx, ty + i) * 0.5, 0.7 + hash2(tx * i, ty) * 0.7]);
      else if (h > 0.86) for (let i = 0; i < 3; i++) gems.push([tx + 0.3 + i * 0.2, y + 0.02, ty + 0.65 + (i % 2) * 0.1, 0.8 + i * 0.35, (i - 1) * 0.35]);
    }
    const o = new THREE.Object3D();
    // una sola malla por material, con las piezas ya colocadas (el agujero de visión necesita la posición real)
    const place = (geo, mat, list, f) => {
      if (!list.length) return;
      const parts = list.map((p) => { f(p); o.updateMatrix(); const g = geo.toNonIndexed(); g.applyMatrix4(o.matrix); return g; });
      const mesh = new THREE.Mesh(HouseKit.merge(parts), mat); mesh.castShadow = true; mesh.userData.keep = true; this.root.add(mesh);
    };
    place(spike, rockM, spikes, ([x, y, z, s]) => { o.position.set(x, y + 0.27 * s - 0.1, z); o.rotation.set(0, x * 3, 0); o.scale.set(s, s, s); });
    place(gem, crysM, gems, ([x, y, z, s, lean]) => { o.position.set(x, y + 0.1 * s * 1.8, z); o.rotation.set(0, 0, lean); o.scale.set(s, s * 2.2, s); });
  };
}
