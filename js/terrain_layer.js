'use strict';
// ============================================================
//  Construcción de la capa del mapa con el terreno 2.0
//  (exteriores y cuevas; los interiores usan las casillas)
// ============================================================
{
  const _oldBuild = World.buildLayer, _oldSetTile = World.setTile, _oldAnim = World.drawAnimTiles;
  const objVariant = (t, tx, ty) => {
    if (t === 'bridge' || t === 'dock') {
      const l = World.tileAt(tx - 1, ty), r = World.tileAt(tx + 1, ty);
      const horiz = (l && !l.solid && !l.water) || (r && !r.solid && !r.water) || (l && (l.t === 'bridge' || l.t === 'dock')) || (r && (r.t === 'bridge' || r.t === 'dock'));
      return horiz ? 0 : 1;
    }
    return Math.floor(hash2(tx, ty) * 3);
  };
  // objetos fijos (no animados) de una casilla
  const drawObjects = (ctx, m, tx0, ty0, tx1, ty1) => {
    for (let ty = Math.max(0, ty0); ty <= Math.min(m.h - 1, ty1); ty++) for (let tx = Math.max(0, tx0); tx <= Math.min(m.w - 1, tx1); tx++) {
      const def = World.tileAt(tx, ty); if (!def) continue;
      const o = OBJ_OF[def.t];
      if (o) ctx.drawImage(Obj.get(o, 0, objVariant(def.t, tx, ty)), tx * 16, ty * 16);
    }
  };
  // sombras de árboles proyectadas en el suelo
  const drawTreeShadows = (ctx, m, tx0, ty0, tx1, ty1) => {
    ctx.globalAlpha = 0.22; ctx.fillStyle = '#0a1a0c';
    for (let ty = Math.max(0, ty0); ty <= Math.min(m.h - 1, ty1); ty++) for (let tx = Math.max(0, tx0); tx <= Math.min(m.w - 1, tx1); tx++) {
      const def = World.tileAt(tx, ty); if (!def || !def.canopy) continue;
      for (let y = -3; y <= 3; y++) { const ww = Math.round(11 * Math.sqrt(1 - (y * y) / 12)); ctx.fillRect(tx * 16 + 10 - ww, ty * 16 + 12 + y, ww * 2, 1); }
    }
    ctx.globalAlpha = 1;
  };
  const drawBuildings = (ctx, m, clip) => {
    for (const b of m.buildings) {
      if (clip && (b.x * 16 > clip[2] || (b.x + b.w) * 16 < clip[0] || b.y * 16 > clip[3] || (b.y + b.h) * 16 + 8 < clip[1])) continue;
      ctx.save();
      if (clip) { ctx.beginPath(); ctx.rect(clip[0], clip[1], clip[2] - clip[0], clip[3] - clip[1]); ctx.clip(); }
      ctx.globalAlpha = 0.26; ctx.fillStyle = '#0a1a10';
      ctx.fillRect(b.x * 16 + 6, b.y * 16 + b.h * 16 - 3, b.w * 16 - 2, 7); ctx.fillRect(b.x * 16 + b.w * 16 - 2, b.y * 16 + 8, 7, b.h * 16 - 6);
      ctx.globalAlpha = 1;
      ctx.drawImage(Buildings.get(b.style, b.w, b.h, b.door), b.x * 16, b.y * 16);
      ctx.restore();
    }
  };
  World.layerCache = {};
  World.buildLayer = function () {
    const m = this.map;
    if (!Terrain.usesNew(m)) { _oldBuild.call(this); return; }
    if (this.resetTerrain) this.resetTerrain();
    const [c, x] = U.makeCanvas(m.w * 16, m.h * 16);
    const cached = World.layerCache[m.id];
    if (cached) x.drawImage(cached, 0, 0);
    else {
      Terrain.render(m, x, 0, 0, m.w - 1, m.h - 1);
      drawTreeShadows(x, m, 0, 0, m.w - 1, m.h - 1);
      drawObjects(x, m, 0, 0, m.w - 1, m.h - 1);
      drawBuildings(x, m);
      const [cc, cx2] = U.makeCanvas(m.w * 16, m.h * 16); cx2.drawImage(c, 0, 0);
      World.layerCache[m.id] = cc;
    }
    this.windows = []; this.lamps = [];
    for (const b of m.buildings) { const img = Buildings.get(b.style, b.w, b.h, b.door); for (const w of img.windows || []) this.windows.push({ x: b.x * 16 + w.x, y: b.y * 16 + w.y, w: w.w, h: w.h, door: w.door }); }
    // copas de los árboles en una capa superior
    const [cc, cxx] = U.makeCanvas(m.w * 16, m.h * 16);
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const def = TILEDEF[m.rows[ty][tx]];
      if (def && def.canopy) cxx.drawImage(Canopy.get(Math.floor(hash2(tx * 7, ty * 3) * 7)), tx * 16 - 5, ty * 16 - 16);
      if (def && def.light) this.lamps.push({ x: tx * 16 + 8, y: ty * 16 + 3 });
    }
    this.canopy = cc;
    this.layer = c;
    this.inWindows = [];
    this.animTiles = []; this.lavaTiles = [];
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const ch = m.rows[ty][tx], def = TILEDEF[ch];
      if (ch === 'X') this.inWindows.push([tx, ty]);
      if (def && (LIVE_OBJ.has(def.t) || ANIM_TILES[def.t] !== undefined)) this.animTiles.push([tx, ty, def.t]);
      if (ch === 'A' && (tx + ty) % 2 === 0) this.lavaTiles.push([tx, ty]);
    }
  };
  // cambiar una casilla (fuego, rocas rotas, arbustos cortados): se repinta la zona
  World.setTile = function (x, y, ch) {
    const m = this.map;
    if (!Terrain.usesNew(m)) return _oldSetTile.call(this, x, y, ch);
    if (!this.mods) this.resetTerrain();
    this.mods.set(y * 1000 + x, ch);
    const ctx = this.layer.getContext('2d');
    Terrain.render(m, ctx, x - 1, y - 1, x + 1, y + 1);
    drawTreeShadows(ctx, m, x - 1, y - 1, x + 1, y + 1);
    drawObjects(ctx, m, x - 1, y - 1, x + 1, y + 1);
    drawBuildings(ctx, m, [(x - 1) * 16, (y - 1) * 16, (x + 2) * 16, (y + 2) * 16]);
    const def = TILEDEF[ch] || TILEDEF['.'];
    this.animTiles = this.animTiles.filter(([tx, ty]) => tx !== x || ty !== y);
    if (LIVE_OBJ.has(def.t) || ANIM_TILES[def.t] !== undefined) this.animTiles.push([x, y, def.t]);
  };
  // objetos vivos: agua y lava con brillos, flores al viento, hierba alta, farolas
  World.drawAnimTiles = function (ctx, cx, cy, L) {
    const m = this.map;
    if (!Terrain.usesNew(m)) return _oldAnim.call(this, ctx, cx, cy, L);
    const fr = Math.floor(Engine.time * 3);
    let movers = null;
    for (const [tx, ty, t] of this.animTiles) {
      const sx = tx * 16 - cx, sy = ty * 16 - cy;
      if (sx < -16 || sy < -16 || sx > W || sy > H) continue;
      const v = Math.floor(hash2(tx, ty) * 3);
      if (t === 'water' || t === 'cavewater') ctx.drawImage(Obj.get('waterfx', (fr + tx) % 4, v), sx, sy);
      else if (t === 'lava') ctx.drawImage(Obj.get('lavafx', (fr + ty) % 3, v), sx, sy);
      else if (t === 'flower') ctx.drawImage(Obj.get('flower', Math.floor(Engine.time * 1.5 + tx * 0.7) % 2, v), sx, sy);
      else if (t === 'tallgrass') {
        if (!movers) movers = this.entities().filter((e) => !e.hidden && !e.gone && e.moving);
        const rust = movers.some((e) => e.x === tx && e.y === ty);
        ctx.drawImage(Obj.get('tall', rust ? fr % 2 : 0, v + (m.volcanic ? 3 : 0)), sx, sy);
      } else if (t === 'lamp' || t === 'ashlamp') ctx.drawImage(Obj.get('lamp', L.a > 0.15 ? 1 : 0), sx, sy);
      else if (t === 'healer' || t === 'machine') ctx.drawImage(Tiles.get(t, 1 + (Math.floor(Engine.frame / 12) % 6)), sx, sy);
      else ctx.drawImage(Tiles.get(t, fr % (ANIM_TILES[t] || 1), v), sx, sy);
    }
  };
}
