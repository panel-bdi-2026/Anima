'use strict';
// ============================================================
//  MAPA DE LA REGIÓN 2.0 (ilustrado)
//  Mar con oleaje, costa con playa, biomas pintados (praderas,
//  bosques, montañas nevadas, volcán, lago), caminos con borde,
//  iconos de pueblos/cuevas/torre, rótulos, rosa de los vientos.
// ============================================================
{
  const BIOMES = [
    { x: 140, y: 100, r: 30, k: 'forest' }, { x: 92, y: 100, r: 16, k: 'forest' }, { x: 30, y: 130, r: 14, k: 'forest' },
    { x: 150, y: 52, r: 30, k: 'mount' }, { x: 205, y: 46, r: 26, k: 'mount' }, { x: 110, y: 44, r: 20, k: 'mount' },
    { x: 238, y: 176, r: 34, k: 'volcano' }, { x: 196, y: 176, r: 18, k: 'volcano' },
    { x: 170, y: 172, r: 16, k: 'mount' },
    { x: 136, y: 146, r: 13, k: 'lake' },
    { x: 84, y: 150, r: 18, k: 'dusk' },
  ];
  const LAND = [[14, 190], [14, 30], [262, 30], [262, 84], [300, 84], [300, 196], [150, 200]];
  const inPoly = (pts, x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; };
  const N = TerrainNoise;
  const bgCache = {};
  const background = (ch2) => {
    const key = ch2 ? 'b2' : 'b1';
    if (bgCache[key]) return bgCache[key];
    N.seed = 4242;
    const [c, x] = U.makeCanvas(W, H), img = x.createImageData(W, H), d = img.data;
    const landAt = (px, py) => inPoly(LAND, px + (N.smooth(px / 9, py / 9) - 0.5) * 12, py + (N.smooth(px / 9 + 30, py / 9 + 30) - 0.5) * 12);
    const coastDist = new Float32Array(W * H).fill(99);
    const land = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) land[y * W + i] = landAt(i, y) ? 1 : 0;
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
      const L0 = land[y * W + i]; let best = 99;
      for (let r = 1; r <= 6 && best === 99; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r], [r, -r], [-r, r]]) { const X = i + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && land[Y * W + X] !== L0) { best = r; break; } }
      coastDist[y * W + i] = best;
    }
    const put = (i, y, rgb) => { const o = (y * W + i) * 4; d[o] = rgb[0]; d[o + 1] = rgb[1]; d[o + 2] = rgb[2]; d[o + 3] = 255; };
    const C = (h) => hexRGB(h);
    const sea = ['#1e3a78', '#244a90', '#2c5ca8', '#3a74c0', '#5a9ad8', '#86c0ea'].map(C);
    const meadow = ['#4a8a3c', '#5a9c44', '#6cae50', '#82c060', '#9ad074'].map(C);
    const forest = ['#245a2c', '#2e6c34', '#3a7e3c', '#4a9046'].map(C);
    const mount = ['#6a5a48', '#80705a', '#988670', '#b0a08a', '#e8eef4', '#ffffff'].map(C);
    const volc = ['#3a3034', '#4a4044', '#5c5254', '#c84a20', '#f08a30'].map(C);
    const dusk = ['#4a6a58', '#5a7c62', '#6e8e6c', '#8aa080'].map(C);
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
      const b = BAYER[(y & 3) * 4 + (i & 3)], n = N.smooth(i / 14, y / 14) * 0.7 + N.smooth(i / 4, y / 4) * 0.3, cd = coastDist[y * W + i];
      if (!land[y * W + i]) {
        let k = cd <= 1 ? 5 : cd <= 3 ? 4 : 2 + n * 1.6 + b * 0.6;
        if (cd > 3 && Math.sin(i * 0.5 + y * 0.18 + N.smooth(i / 20, y / 20) * 8) > 0.93) k = 4;
        put(i, y, sea[U.clamp(Math.floor(k), 0, 5)]); continue;
      }
      if (cd <= 2) { put(i, y, cd <= 1 ? C('#f4e2b0') : C('#e6cc90')); continue; }
      // bioma dominante
      let kind = 'meadow', wgt = 0;
      for (const B of BIOMES) { if (B.k === 'volcano' && !ch2 && B.y > 160) continue; const dd = Math.hypot(i - B.x, y - B.y) / B.r + (N.smooth(i / 8 + B.x, y / 8) - 0.5) * 0.5; if (dd < 1 && 1 - dd > wgt) { wgt = 1 - dd; kind = B.k; } }
      let rgb;
      if (kind === 'forest') rgb = forest[U.clamp(Math.floor(n * 3.4 + b), 0, 3)];
      else if (kind === 'mount') { const peak = wgt > 0.62 ? (wgt > 0.8 ? 5 : 4) : Math.floor(n * 3 + b); rgb = mount[U.clamp(peak, 0, 5)]; }
      else if (kind === 'volcano') { const lava = wgt > 0.82 || (N.smooth(i / 5, y / 5) > 0.72 && wgt > 0.3); rgb = lava ? volc[(i + y) % 3 ? 3 : 4] : volc[U.clamp(Math.floor(n * 3 + b), 0, 2)]; }
      else if (kind === 'lake') rgb = wgt > 0.25 ? sea[U.clamp(Math.floor(2 + wgt * 3 + b), 0, 5)] : C('#e6cc90');
      else if (kind === 'dusk') rgb = dusk[U.clamp(Math.floor(n * 3 + b), 0, 3)];
      else rgb = meadow[U.clamp(Math.floor(n * 4.2 + b * 0.8), 0, 4)];
      put(i, y, rgb);
    }
    x.putImageData(img, 0, 0);
    // árboles, picos y olas dibujados
    const r = mulberry(77);
    for (let k = 0; k < 220; k++) {
      const px = Math.floor(r() * W), py = Math.floor(r() * H);
      if (!land[py * W + px] || coastDist[py * W + px] <= 3) continue;
      let kind = null, best = 1;
      for (const B of BIOMES) { if (B.k === 'volcano' && !ch2 && B.y > 160) continue; const dd = Math.hypot(px - B.x, py - B.y) / B.r; if (dd < best) { best = dd; kind = B.k; } }
      if (kind === 'forest' || (!kind && r() < 0.12)) { P(x, px - 2, py - 3, 5, 4, '#1a4a22'); P(x, px - 1, py - 4, 3, 1, '#2e7a34'); P(x, px - 1, py - 3, 2, 2, '#58a848'); P(x, px, py + 1, 1, 2, '#5a3a20'); }
      else if (kind === 'mount' && best < 0.8 && r() < 0.5) { for (let j = 0; j < 6; j++) P(x, px - j, py + j, j * 2 + 1, 1, j < 2 ? '#f4f8fc' : j < 4 ? '#a8987e' : '#7a6a56'); P(x, px, py + 1, 1, 4, '#5a4a3a'); }
    }
    for (let k = 0; k < 40; k++) { const px = Math.floor(r() * W), py = Math.floor(r() * H); if (land[py * W + px] || coastDist[py * W + px] < 6) continue; P(x, px, py, 3, 1, '#9cd0f0'); P(x, px + 1, py - 1, 2, 1, '#cfe8f8'); }
    // volcán humeante
    if (ch2) { const vx = 246, vy = 184; for (let j = 0; j < 9; j++) P(x, vx - j, vy + j, j * 2 + 1, 1, j < 2 ? '#f08a30' : '#3a3034'); x.globalAlpha = 0.5; P(x, vx - 2, vy - 6, 4, 4, '#888'); P(x, vx, vy - 10, 4, 3, '#999'); x.globalAlpha = 1; }
    // marco
    P(x, 0, 0, W, 2, '#3a2a18'); P(x, 0, H - 2, W, 2, '#3a2a18'); P(x, 0, 0, 2, H, '#3a2a18'); P(x, W - 2, 0, 2, H, '#3a2a18');
    // rosa de los vientos
    const cx = 290, cy = 52;
    x.globalAlpha = 0.9; pixCircle(x, cx, cy, 10, '#f4e8c8'); pixRing(x, cx, cy, 10, '#5a4428', 1); x.globalAlpha = 1;
    for (const [dx, dy, c2] of [[0, -9, '#c83838'], [0, 9, '#5a4428'], [-9, 0, '#5a4428'], [9, 0, '#5a4428']]) { for (let t = 0; t < 8; t++) P(x, Math.round(cx + dx * t / 8), Math.round(cy + dy * t / 8), 2, 2, c2); }
    Font.draw(x, 'N', cx - 2, cy - 21, '#f4e8c8');
    bgCache[key] = c;
    return c;
  };
  const icon = (ctx, kind, x, y, seen, sel, roof) => {
    if (kind === 'town') {
      const r1 = seen ? roof : '#9a90a0', r2 = seen ? U.shade(roof, -0.3) : '#7a7080';
      ctx.globalAlpha = 0.35; P(ctx, x - 6, y + 4, 14, 3, '#000'); ctx.globalAlpha = 1;
      for (const [ox, oy, w] of [[-7, -2, 7], [1, -4, 7], [-2, 1, 6]]) { P(ctx, x + ox, y + oy + 3, w, 4, seen ? '#f4ead8' : '#c8c0c8'); P(ctx, x + ox - 1, y + oy, w + 2, 3, r2); P(ctx, x + ox, y + oy, w, 2, r1); P(ctx, x + ox + 2, y + oy + 4, 2, 3, '#6a4428'); }
    } else if (kind === 'cave') { P(ctx, x - 6, y - 4, 12, 9, '#5a4a3a'); P(ctx, x - 5, y - 5, 10, 2, '#7a6a56'); P(ctx, x - 3, y - 1, 6, 6, '#120c10'); }
    else if (kind === 'tower') { P(ctx, x - 3, y - 9, 7, 15, '#3a2458'); P(ctx, x - 2, y - 8, 5, 13, '#7a4ab0'); P(ctx, x - 1, y - 12, 3, 4, '#c080ff'); P(ctx, x, y - 4, 1, 2, '#ffe060'); }
    else if (kind === 'forest') { for (const [ox, oy] of [[-4, 0], [3, -2], [0, 3]]) { P(ctx, x + ox - 3, y + oy - 3, 7, 6, '#163e1e'); P(ctx, x + ox - 2, y + oy - 3, 5, 4, seen ? '#3c8a3a' : '#6a7a6a'); } }
    else { P(ctx, x - 2, y - 2, 5, 5, '#2a1c10'); P(ctx, x - 1, y - 1, 3, 3, seen ? '#f4d060' : '#b0a890'); }
    if (sel) { const r = 11 + Math.sin(Engine.time * 6); pixRing(ctx, x, y, r, '#2a1c10', 3); pixRing(ctx, x, y, r, '#ffffff', 1); }
  };
  const gi0 = (sel) => BADGES.findIndex((b) => MAPS[sel] && b.city === MAPS[sel].name);
  const ROOFS = { pueblo_alba: '#d86048', villa_musgo: '#6aa850', ciudad_roca: '#b07a48', puerto_marea: '#4a78d8', ciudad_brasa: '#c84a28', pico_cefiro: '#e8eef8', ciudad_aurora: '#9a6ac0' };
  RegionMapScreen.prototype.draw = function (ctx) {
    const ch2 = !!G.flags.chapter1_done, V = G.visited || {};
    ctx.drawImage(background(ch2), 0, 0);
    // caminos
    for (const [a, b] of REGION.links) {
      const A = REGION.nodes[a], B = REGION.nodes[b];
      if (!A || !B || ((A.ch || B.ch) && !ch2)) continue;
      const seen = V[a] || V[b];
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 5; ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      ctx.strokeStyle = seen ? '#f0dcae' : '#a89878'; ctx.lineWidth = 3; ctx.setLineDash(seen ? [] : [3, 3]); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      ctx.setLineDash([]);
    }
    // lugares y rótulos
    const sel = this.towns[this.i];
    for (const [id, nd] of Object.entries(REGION.nodes)) {
      if (nd.ch && !ch2) continue;
      const seen = !!V[id];
      icon(ctx, nd.kind, nd.x, nd.y, seen, id === sel, ROOFS[id] || '#d86048');
      if (nd.kind === 'town' || (seen && nd.kind !== 'route')) {
        const label = seen ? MAPS[id].name : '???';
        const lw = Font.width(label);
        Font.drawOutlined(ctx, label, Math.round(U.clamp(nd.x - lw / 2, 4, W - lw - 4)), nd.y + 9, nd.kind === 'town' ? '#ffffff' : '#e8e0c8', '#1a1208');
      }
    }
    // jugador
    const h = REGION.nodes[this.here];
    if (h) {
      const by = Math.round(Math.sin(Engine.time * 5) * 2);
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Engine.time * 6); pixCircle(ctx, h.x, h.y, 8, '#ff4060'); ctx.globalAlpha = 1;
      ctx.drawImage(CharSprites.get(LOOKS.player), 0, 0, 16, 24, h.x - 8, h.y - 28 + by, 16, 24);
    }
    // cabecera
    UI.box(ctx, 4, 4, 196, 20, 'title');
    Font.draw(ctx, 'MAPA DE LA REGIÓN ALBA', 12, 10, '#ffffff');
    // panel inferior
    const nd = REGION.nodes[sel], seen = !!V[sel];
    UI.box(ctx, 4, 196, 312, 40);
    icon(ctx, nd.kind, 20, 214, seen, false, ROOFS[sel] || '#d86048');
    Font.draw(ctx, seen ? MAPS[sel].name : '???', 36, 202, '#2a2236');
    let desc = seen ? (nd.desc || '') : 'Aún no has estado aquí.'; while (Font.width(desc) > (gi0(sel) >= 0 ? 248 : 268)) desc = desc.slice(0, -2) + '…';
    Font.draw(ctx, desc, 36, 214, '#5a5070');
    const gi = BADGES.findIndex((b) => MAPS[sel] && b.city === MAPS[sel].name);
    if (gi >= 0 && seen) { if (G.badges[gi]) ctx.drawImage(Icons.badge(gi), 292, 200); else { P(ctx, 292, 200, 16, 16, '#d8d0e0'); Font.drawCenter(ctx, '?', 300, 204, '#8a8098'); } }
    const hint = seen && sel !== this.here ? (RegionMap.canTravel() ? 'Z: viajar en carruaje' : 'Carruaje: 1.ª medalla') : this.here === sel ? 'Estás aquí' : '';
    Font.drawRight(ctx, hint + '   X/M: cerrar', 308, 226, '#3060c0');
  };
  REGION.geo = { BIOMES, LAND, inPoly, background, icon, ROOFS, gi0 };
}
