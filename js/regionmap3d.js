'use strict';
// ============================================================
//  MAPA DE LA REGIÓN EN 3D
//  - Maqueta en relieve: montañas nevadas, volcán humeante, bosques,
//    lago y mar con oleaje; caminos pintados sobre el terreno.
//  - Pueblos en miniatura con tejados de su color, cuevas, torre y
//    bosques; nubes que flotan y proyectan sombra.
//  - La cámara se acerca un poco al lugar seleccionado.
//  1 unidad = 10 píxeles del mapa ilustrado (320x240).
// ============================================================
const RegionMap3D = {
  U: 10,
  ok() { return Options.gfx3d !== false && typeof World3D !== 'undefined' && World3D.init() && REGION.geo; },
  // altura del terreno en un punto del mapa (en píxeles)
  height(px, py, ch2) {
    const geo = REGION.geo, N = TerrainNoise;
    N.seed = 4242;
    const land = geo.inPoly(geo.LAND, px + (N.smooth(px / 9, py / 9) - 0.5) * 12, py + (N.smooth(px / 9 + 30, py / 9 + 30) - 0.5) * 12);
    if (!land) return -0.32;
    let h = 0.14 + N.smooth(px / 14, py / 14) * 0.14;
    for (const B of geo.BIOMES) {
      if (B.k === 'volcano' && !ch2 && B.y > 160) continue;
      const w = 1 - (Math.hypot(px - B.x, py - B.y) / B.r + (N.smooth(px / 8 + B.x, py / 8) - 0.5) * 0.5);
      if (w <= 0) continue;
      if (B.k === 'mount') h += Math.pow(w, 1.4) * (1.6 + B.r / 30) + N.smooth(px / 4, py / 4) * w * 0.4;
      else if (B.k === 'volcano') h += (w > 0.85 ? 2.3 - (w - 0.85) * 6 : Math.pow(w, 1.2) * 2.7);
      else if (B.k === 'forest') h += w * 0.18;
      else if (B.k === 'lake') h -= w * 0.6;
      else if (B.k === 'dusk') h += w * 0.1;
    }
    return h;
  },
  build(screen) {
    const ch2 = !!G.flags.chapter1_done, V = G.visited || {}, U3 = this.U;
    if (this.key === (ch2 ? 2 : 1) + JSON.stringify(V)) return;
    this.key = (ch2 ? 2 : 1) + JSON.stringify(V);
    if (this.scene) this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { if (m.map && !m.map.shared) m.map.dispose(); m.dispose(); }); });
    const S = (this.scene = new THREE.Scene());
    S.background = new THREE.Color('#2a5aa0');
    S.fog = new THREE.Fog('#2a5aa0', 38, 80);
    // textura: el mapa ilustrado sin marco ni rosa, con los caminos pintados
    const oldW = W; W = UI_W;
    let bg; try { bg = REGION.geo.background(ch2); } finally { W = oldW; }
    const [c, x] = U.makeCanvas(320, 240); x.drawImage(bg, 0, 0);
    x.drawImage(bg, 4, 4, 6, 232, 0, 4, 6, 232); x.drawImage(bg, 310, 4, 6, 232, 314, 4, 6, 232); x.drawImage(bg, 4, 4, 312, 6, 4, 0, 312, 6); x.drawImage(bg, 4, 230, 312, 6, 4, 234, 312, 6);
    x.drawImage(bg, 260, 70, 40, 2, 270, 30, 40, 40); // tapa la rosa de los vientos
    for (const [a, b] of REGION.links) {
      const A = REGION.nodes[a], B = REGION.nodes[b];
      if (!A || !B || ((A.ch || B.ch) && !ch2)) continue;
      const seen = V[a] || V[b];
      x.lineCap = 'round'; x.strokeStyle = '#3a2a18'; x.lineWidth = 4; x.setLineDash([]); x.beginPath(); x.moveTo(A.x, A.y); x.lineTo(B.x, B.y); x.stroke();
      x.strokeStyle = seen ? '#f0dcae' : '#a89878'; x.lineWidth = 2; x.setLineDash(seen ? [] : [3, 3]); x.beginPath(); x.moveTo(A.x, A.y); x.lineTo(B.x, B.y); x.stroke(); x.setLineDash([]);
    }
    const tex = new THREE.CanvasTexture(c); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.encoding = THREE.sRGBEncoding;
    // malla del terreno
    const NX = 160, NY = 120, pos = [], uv = [], idx = [];
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      const px = (i / NX) * 320, py = (j / NY) * 240;
      pos.push(px / U3, this.height(px, py, ch2), py / U3); uv.push(i / NX, 1 - j / NY);
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, d = a + NX + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const land = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tex })); land.receiveShadow = true; land.castShadow = true; S.add(land);
    // base de la maqueta (lados de tierra)
    const base = new THREE.Mesh(new THREE.BoxGeometry(32.4, 1, 24.4), new THREE.MeshLambertMaterial({ color: '#3a2a20' })); base.position.set(16, -0.85, 12); S.add(base);
    // agua con oleaje y destellos
    const [wc, wx] = U.makeCanvas(64, 64); wx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) { wx.globalAlpha = 0.3 + Math.random() * 0.7; wx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 2 + Math.floor(Math.random() * 3), 1); }
    this.waterT = new THREE.CanvasTexture(wc); this.waterT.wrapS = this.waterT.wrapT = THREE.RepeatWrapping; this.waterT.repeat.set(28, 25);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(220, 200, 4, 4), new THREE.MeshLambertMaterial({ color: '#4a8ad8', map: this.waterT, transparent: true, opacity: 0.55 }));
    water.rotation.x = -Math.PI / 2; water.position.set(16, -0.02, 12); S.add(water); this.water = water;
    // luces
    const sun = new THREE.DirectionalLight('#fff0d8', 2.2); sun.position.set(6, 18, -6); sun.target.position.set(16, 0, 12); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 60 }); sun.shadow.bias = -0.001;
    S.add(sun, sun.target); S.add(new THREE.HemisphereLight('#c8dcff', '#5a4a3a', 0.9));
    // lugares
    const M = (col) => new THREE.MeshLambertMaterial({ color: col, flatShading: true });
    this.nodes = {};
    for (const [id, nd] of Object.entries(REGION.nodes)) {
      if (nd.ch && !ch2) continue;
      const seen = !!V[id], gx = nd.x / U3, gz = nd.y / U3, gy = Math.max(0.05, this.height(nd.x, nd.y, ch2));
      const grp = new THREE.Group(); grp.position.set(gx, gy, gz); S.add(grp);
      const roof = seen ? REGION.geo.ROOFS[id] || '#d86048' : '#9a90a0';
      if (nd.kind === 'town') {
        for (const [ox, oz, s] of [[-0.32, 0.05, 1], [0.3, -0.22, 0.9], [0.05, 0.36, 0.8], [0.42, 0.3, 0.7]]) {
          const w = new THREE.Mesh(new THREE.BoxGeometry(0.36 * s, 0.28 * s, 0.3 * s), M(seen ? '#f4ead8' : '#c8c0c8')); w.position.set(ox, 0.14 * s, oz); w.castShadow = true; grp.add(w);
          const r = new THREE.Mesh(new THREE.ConeGeometry(0.3 * s, 0.24 * s, 4), M(roof)); r.position.set(ox, 0.28 * s + 0.12 * s, oz); r.rotation.y = Math.PI / 4; r.scale.z = 0.8; r.castShadow = true; grp.add(r);
        }
      } else if (nd.kind === 'cave') {
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), M('#6a5a48')); r.scale.y = 0.7; r.position.y = 0.2; r.castShadow = true; grp.add(r);
        const m = new THREE.Mesh(new THREE.CircleGeometry(0.18, 10, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#100808' })); m.position.set(0, 0.06, 0.42); grp.add(m);
      } else if (nd.kind === 'tower') {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.3, 8), M(seen ? '#7a4ab0' : '#8a8098')); t.position.y = 0.65; t.castShadow = true; grp.add(t);
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 8), M('#3a2458')); sp.position.y = 1.5; grp.add(sp);
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: '#e0a0ff' })); orb.position.y = 1.78; grp.add(orb); this.orb = orb;
      } else if (nd.kind === 'forest') {
        for (let k = 0; k < 6; k++) { const a = k * 1.1, r = 0.15 + (k % 3) * 0.15; const tr = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), M(seen ? '#2e7a34' : '#6a7a6a')); tr.position.set(Math.cos(a) * r, 0.25, Math.sin(a) * r); tr.castShadow = true; grp.add(tr); }
      } else {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.16, 6), M(seen ? '#f4d060' : '#b0a890')); st.position.y = 0.08; grp.add(st);
      }
      this.nodes[id] = { grp, gx, gy, gz, nd };
    }
    // humo del volcán
    this.smoke = [];
    if (ch2) { const vx = 246 / U3, vz = 184 / U3, vy = this.height(246, 184, ch2); for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.3, 7, 5), new THREE.MeshLambertMaterial({ color: '#8a8088', transparent: true, opacity: 0.5 })); s.position.set(vx, vy, vz); S.add(s); this.smoke.push({ s, ph: i / 8, base: [vx, vy, vz] }); } }
    // nubes
    const [cc, cx] = U.makeCanvas(64, 32);
    for (let i = 0; i < 7; i++) { const gr = cx.createRadialGradient(10 + i * 7, 18 - (i % 3) * 3, 0, 10 + i * 7, 18 - (i % 3) * 3, 12); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, 64, 32); }
    const ct = new THREE.CanvasTexture(cc);
    this.clouds = [];
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.5), new THREE.MeshLambertMaterial({ map: ct, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
      m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: ct, alphaTest: 0.45 }); m.castShadow = true;
      m.rotation.x = -Math.PI / 2; m.position.set((i * 9.3) % 34, 6 + (i % 3) * 0.6, (i * 7.1) % 24); S.add(m); this.clouds.push(m);
    }
    // marcador del jugador y anillo de selección
    const pc = HiChar.get(LOOKS.player), [pcv, px] = U.makeCanvas(32, 48); px.drawImage(pc, 0, 0, 32, 48, 0, 0, 32, 48);
    const pt = new THREE.CanvasTexture(pcv); pt.magFilter = THREE.NearestFilter; pt.minFilter = THREE.NearestFilter; pt.encoding = THREE.sRGBEncoding;
    const pg = new THREE.PlaneGeometry(0.8, 1.2); pg.translate(0, 0.6, 0);
    this.player = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ map: pt, alphaTest: 0.5, side: THREE.DoubleSide })); S.add(this.player);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    this.ring.rotation.x = -Math.PI / 2; S.add(this.ring);
    this.pin = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), new THREE.MeshLambertMaterial({ color: '#ffd048', emissive: '#a06010', emissiveIntensity: 0.6 })); S.add(this.pin);
    this.cam = new THREE.PerspectiveCamera(34, WIDE / H, 0.1, 200);
    this.camT = null;
  },
  render(screen) {
    this.build(screen);
    const t = screen.t, sel = screen.towns[screen.i], here = screen.here;
    // cámara: se desliza hacia el lugar seleccionado
    const n = this.nodes[sel], tx = 16 + (n ? (n.gx - 16) * 0.12 : 0), tz = 13.2 + (n ? (n.gz - 12) * 0.1 : 0);
    if (!this.camT) this.camT = [tx, tz]; else { this.camT[0] += (tx - this.camT[0]) * 0.08; this.camT[1] += (tz - this.camT[1]) * 0.08; }
    const [cx, cz] = this.camT;
    this.cam.position.set(cx, 26.5, cz + 17); this.cam.lookAt(cx, 0, cz - 0.2);
    // animaciones
    this.waterT.offset.x = (t * 0.01) % 1; this.waterT.offset.y = (t * 0.006) % 1;
    for (const c of this.clouds) { c.position.x += 0.012; if (c.position.x > 38) c.position.x = -6; }
    for (const s of this.smoke) { const k = (s.ph + t * 0.18) % 1; s.s.position.set(s.base[0] + k * 1.2, s.base[1] + 0.2 + k * 2.2, s.base[2] - k * 0.4); s.s.scale.setScalar(0.6 + k * 1.4); s.s.material.opacity = 0.55 * (1 - k); }
    if (this.orb) this.orb.material.color.setHSL(0.8, 0.8, 0.7 + 0.2 * Math.sin(t * 4));
    if (n) { this.ring.position.set(n.gx, n.gy + 0.04, n.gz); const k = 1 + 0.12 * Math.sin(t * 6); this.ring.scale.set(k, k, k); this.pin.position.set(n.gx, n.gy + 1.4 + Math.sin(t * 3) * 0.12, n.gz); this.pin.rotation.y = t * 2; }
    const h = this.nodes[here];
    this.player.visible = !!h;
    if (h) { this.player.position.set(h.gx - 0.45, h.gy + Math.abs(Math.sin(t * 5)) * 0.12, h.gz + 0.35); this.player.rotation.x = -0.5; }
    const W3D = World3D, post = W3D.post.uniforms;
    W3D.fitCanvas();
    post.exposure.value = 1.0; post.night.value = 0; post.dof.value = 0.35; post.focus.value = 0.45;
    W3D.r.setRenderTarget(W3D.rt); W3D.r.render(this.scene, this.cam);
    post.tDiffuse.value = W3D.rt.texture;
    W3D.r.setRenderTarget(null); W3D.r.render(W3D.postScene, W3D.postCam);
    post.dof.value = 1; post.focus.value = 0.42;
    W3D.used = true;
  },
  screen(id, lift = 0) {
    const n = this.nodes[id]; if (!n) return null;
    const v = new THREE.Vector3(n.gx, n.gy + lift, n.gz).project(this.cam);
    return [(v.x + 1) / 2 * WIDE, (1 - v.y) / 2 * H];
  },
};

// ---------- integración con la pantalla del mapa ----------
{
  const RP = RegionMapScreen.prototype, _draw = RP.draw, _upd = RP.update;
  Object.defineProperty(RP, 'wide', { get() { return !!RegionMap3D.ok(); }, configurable: true });
  RP.update = function (dt) {
    if (!RegionMap3D.ok() || !RegionMap3D.cam) return _upd.call(this, dt);
    const M = Input.mouse, mv = M.moved, p0 = M.pressed[0];
    let over = -1;
    if (M.inside) this.towns.forEach((id, k) => { const s = RegionMap3D.screen(id, 0.3); if (s && Math.abs(M.x - s[0]) < 14 && Math.abs(M.y - s[1]) < 14) over = k; });
    if (over >= 0 && (mv || p0)) { if (over !== this.i) Sound.sfx('blip'); else if (p0) { M.pressed[0] = false; this.travel(); return; } this.i = over; }
    M.moved = false; M.pressed[0] = false;
    try { return _upd.call(this, dt); } finally { M.moved = mv; }
  };
  RP.draw = function (ctx) {
    if (!RegionMap3D.ok()) return _draw.call(this, ctx);
    RegionMap3D.render(this);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, WIDE, H); ctx.restore();
    const ch2 = !!G.flags.chapter1_done, V = G.visited || {}, sel = this.towns[this.i];
    // rótulos de los lugares
    for (const [id, nd] of Object.entries(REGION.nodes)) {
      if (nd.ch && !ch2) continue;
      const seen = !!V[id];
      if (!(nd.kind === 'town' || (seen && nd.kind !== 'route'))) continue;
      const s = RegionMap3D.screen(id); if (!s) continue;
      const label = seen ? MAPS[id].name : '???', lw = Font.width(label), isSel = id === sel;
      const lx = Math.round(s[0] - lw / 2), ly = Math.round(s[1] + 8);
      ctx.globalAlpha = isSel ? 0.9 : 0.6; P(ctx, lx - 3, ly - 2, lw + 6, 12, '#120c1c'); ctx.globalAlpha = 1;
      Font.draw(ctx, label, lx, ly, isSel ? '#ffe080' : nd.kind === 'town' ? '#ffffff' : '#e8e0c8');
    }
    // cabecera
    P(ctx, 6, 6, 190, 18, '#120c1c'); P(ctx, 6, 6, 3, 18, '#ffd048');
    Font.draw(ctx, 'MAPA DE LA REGIÓN ALBA', 14, 11, '#ffffff');
    const med = G.badges.filter(Boolean).length;
    P(ctx, W - 70, 6, 64, 18, '#120c1c'); Font.drawRight(ctx, `★ ${med}/${BADGES.length}`, W - 12, 11, '#ffd048');
    // panel inferior
    const nd = REGION.nodes[sel], seen = !!V[sel], bx = Math.round((W - 320) / 2);
    UI.box(ctx, bx + 4, 196, 312, 40);
    REGION.geo.icon(ctx, nd.kind, bx + 20, 214, seen, false, REGION.geo.ROOFS[sel] || '#d86048');
    Font.draw(ctx, seen ? MAPS[sel].name : '???', bx + 36, 202, '#2a2236');
    const gi = REGION.geo.gi0(sel);
    let desc = seen ? nd.desc || '' : 'Aún no has estado aquí.'; while (Font.width(desc) > (gi >= 0 ? 248 : 268)) desc = desc.slice(0, -2) + '…';
    Font.draw(ctx, desc, bx + 36, 214, '#5a5070');
    if (gi >= 0 && seen) { if (G.badges[gi]) ctx.drawImage(Icons.badge(gi), bx + 292, 200); else { P(ctx, bx + 292, 200, 16, 16, '#d8d0e0'); Font.drawCenter(ctx, '?', bx + 300, 204, '#8a8098'); } }
    const hint = seen && sel !== this.here ? (RegionMap.canTravel() ? 'Z: viajar en carruaje' : 'Carruaje: 1.ª medalla') : this.here === sel ? 'Estás aquí' : '';
    Font.drawRight(ctx, hint + '   X/M: cerrar', bx + 308, 226, '#3060c0');
  };
}
