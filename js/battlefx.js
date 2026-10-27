'use strict';
// ============================================================
//  Mejoras visuales del combate: arenas detalladas, iluminación
//  según la hora, clima y efectos de luz.
// ============================================================

BattleBg.get = function (kind) {
  const key = kind;
  if (this.cache[key]) return this.cache[key];
  const [c, x] = U.makeCanvas(W, H);
  const r = mulberry(kind.length * 131);
  const fill = (t, alt, altP = 0.12) => { for (let ty = 0; ty < 15; ty++) for (let tx = 0; tx < 20; tx++) x.drawImage(Tiles.get(alt && hash2(tx, ty) < altP ? alt : t, 0, Math.floor(hash2(tx, ty) * 3)), tx * 16, ty * 16); };
  const treeRow = (y, step = 18) => { for (let i = -1; i < 20; i++) { const tx = i * step + (y % 2 ? 9 : 0); x.drawImage(Canopy.get(Math.floor(r() * 7)), tx, y); } };
  const outdoor = ['grass', 'forest', 'legend', 'beach', 'city'].includes(kind);
  if (kind === 'grass' || kind === 'forest' || kind === 'legend') fill('grass', 'flower', 0.035);
  else if (kind === 'cave' || kind === 'gym2') fill('cave');
  else if (kind === 'city') fill('path');
  else if (kind === 'beach') fill('sand');
  else if (kind === 'gym1' || kind === 'gym3') fill('gymfloor');
  else fill('tilefloor');
  // zona central desgastada
  x.globalAlpha = kind === 'cave' || kind === 'gym2' ? 0.18 : 0.22;
  const cx = 160, cy = 118;
  for (let y = -60; y <= 60; y++) { const w = Math.round(130 * Math.sqrt(1 - (y * y) / 3600)); x.fillStyle = kind === 'grass' || kind === 'forest' || kind === 'legend' ? '#d8c890' : '#ffffff'; x.fillRect(cx - w, cy + y, w * 2, 1); }
  x.globalAlpha = 1;
  // decoración del borde
  if (kind === 'grass' || kind === 'forest' || kind === 'legend') {
    for (let i = 0; i < 14; i++) { const px = r() * W, py = 40 + r() * 150; if (Math.abs(px - 160) < 140 && Math.abs(py - 118) < 66) continue; x.drawImage(Tiles.get('tallgrass', 0), Math.round(px), Math.round(py)); }
    treeRow(-12); treeRow(0); treeRow(196); treeRow(212);
    for (let y = 10; y < 210; y += 16) { x.drawImage(Canopy.get(Math.floor(r() * 7)), -14, y); x.drawImage(Canopy.get(Math.floor(r() * 7)), W - 10, y); }
  } else if (kind === 'beach') {
    for (let tx = 0; tx < 20; tx++) for (let ty = 12; ty < 15; ty++) x.drawImage(Tiles.get('water', ty % 3), tx * 16, ty * 16);
    for (let tx = 0; tx < 20; tx++) { x.fillStyle = PAL.w1; x.fillRect(tx * 16, 192, 16, 1); }
    treeRow(-12); treeRow(0);
    for (let i = 0; i < 8; i++) { x.fillStyle = r() < 0.5 ? '#f8e0e8' : '#fff8e8'; x.fillRect(Math.round(20 + r() * 280), Math.round(50 + r() * 130), 2, 1); }
  } else if (kind === 'cave' || kind === 'gym2') {
    for (let tx = 0; tx < 20; tx++) { x.drawImage(Tiles.get('cavewall', 0, tx % 3), tx * 16, 16); x.drawImage(Tiles.get('cavewall', 0, tx % 3), tx * 16, 0); x.drawImage(Tiles.get('cavewall', 0, (tx + 1) % 3), tx * 16, 200); x.drawImage(Tiles.get('cavewall', 0, (tx + 1) % 3), tx * 16, 216); }
    for (let i = 0; i < 6; i++) { const px = 20 + r() * 280, py = 44 + r() * 140; if (Math.abs(px - 160) < 120 && Math.abs(py - 118) < 56) continue; x.drawImage(Tiles.get('caverock', 0), Math.round(px), Math.round(py)); }
    if (kind === 'cave') for (let i = 0; i < 6; i++) { const px = Math.round(10 + r() * 300), py = Math.round(r() < 0.5 ? 30 + r() * 6 : 196 + r() * 4); x.fillStyle = '#80d0f0'; x.fillRect(px, py, 2, 4); x.fillStyle = '#c8f0ff'; x.fillRect(px, py, 1, 2); }
  } else if (kind === 'city') {
    for (let tx = 0; tx < 20; tx++) { x.drawImage(Tiles.get('cliff', 0, tx % 3), tx * 16, 16); x.drawImage(Tiles.get('cliff', 0, tx % 3), tx * 16, 0); }
    for (let i = 0; i < 5; i++) x.drawImage(Tiles.get('rock', 0), Math.round(r() * 300), Math.round(196 + r() * 20));
  } else if (kind === 'gym1') {
    for (let tx = 0; tx < 20; tx++) { x.drawImage(Tiles.get('hedge', 0), tx * 16, 16); x.drawImage(Tiles.get('hedge', 0), tx * 16, 0); x.drawImage(Tiles.get('hedge', 0), tx * 16, 200); x.drawImage(Tiles.get('planter', 0, tx % 3), tx * 16, 216); }
  } else if (kind === 'gym3') {
    for (let tx = 0; tx < 20; tx++) { x.drawImage(Tiles.get('cavewater', tx % 3), tx * 16, 196); x.drawImage(Tiles.get('cavewater', (tx + 1) % 3), tx * 16, 212); x.drawImage(Tiles.get('gymwall', 0), tx * 16, 16); x.drawImage(Tiles.get('gymwall', 0), tx * 16, 0); }
  }
  // líneas de la arena
  x.globalAlpha = 0.3;
  pixRing(x, 160, 118, 26, '#ffffff', 1);
  x.fillStyle = '#ffffff'; x.fillRect(160, ARENA.y0 + 6, 1, ARENA.y1 - ARENA.y0 - 12);
  x.globalAlpha = 1;
  // viñeta
  const g = x.createRadialGradient(160, 120, 90, 160, 120, 230);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, outdoor ? 'rgba(8,16,8,0.45)' : 'rgba(0,0,8,0.6)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (kind === 'legend') { x.globalAlpha = 0.25; x.fillStyle = '#5a2a8a'; x.fillRect(0, 0, W, H); x.globalAlpha = 1; }
  if (kind === 'forest') { x.globalAlpha = 0.15; x.fillStyle = '#103020'; x.fillRect(0, 0, W, H); x.globalAlpha = 1; }
  this.cache[key] = c;
  return c;
};

const BattleFX = {
  // clima y luz sobre la arena (antes del HUD)
  overlay(ctx, b) {
    const m = MAPS[G.map];
    const w = Weather.at(m);
    if (m && m.outdoor) { Weather.update(1 / 60, w); Weather.draw(ctx, w); }
    let L = { a: 0, color: '#000', tint: null, ta: 0 };
    if (m && (m.outdoor || m.cave)) L = World.lightLevel ? World.lightLevel.call({ map: m }) : L;
    const a = m && m.cave ? 0.45 : L.a * 0.8;
    if (a <= 0.02 && !(L.ta > 0.01)) return;
    const lights = [{ x: 160, y: 120, r: 190, i: 0.65 }];
    for (const f of [b.ally, b.foe]) if (f && !f.inBall) {
      lights.push({ x: f.x, y: f.y - 12, r: 44, i: 0.5 });
      if (f.types.includes('fuego')) lights.push({ x: f.x, y: f.y - 14, r: 60, i: 0.8, glow: '#ff9040', gr: 30 });
      if (f.types.includes('electrico')) lights.push({ x: f.x, y: f.y - 14, r: 44, i: 0.6, glow: '#fff070', gr: 20 });
    }
    for (const p of b.projs) { const t = p.m.type; if (t === 'fuego' || t === 'electrico' || t === 'mente' || t === 'sombra') lights.push({ x: p.x, y: p.y - 6, r: 26, i: 0.9, glow: TYPES[t].color, gr: 14 }); }
    for (const e of b.fx) if (e.k === 'beam') for (let d = 20; d < e.len; d += 40) lights.push({ x: e.x + Math.cos(e.ang) * d, y: e.y + Math.sin(e.ang) * d, r: 30, i: 0.8, glow: e.color, gr: 16 });
    Lighting.draw(ctx, a, L.color, lights, L.tint, L.ta * 0.8);
  },
  weatherMul(type) {
    const w = Weather.at(MAPS[G.map]);
    if (!Weather.isRain(w)) return 1;
    return type === 'agua' ? 1.25 : type === 'fuego' ? 0.75 : type === 'electrico' && w === 'tormenta' ? 1.2 : 1;
  },
};
