// Maqueta de "2.5D falso" (solo desarrollo): sombras proyectadas, perspectiva,
// luz cálida, bruma y desenfoque de profundidad sobre el render actual.
window.Mock25 = {
  // añade sombras largas (sol de la tarde, desde la izquierda) a la capa del mapa
  shadowLayer() {
    const m = World.map, base = World.layer;
    const [c, x] = U.makeCanvas(base.width, base.height);
    x.drawImage(base, 0, 0);
    x.fillStyle = '#10183a';
    // edificios: fachada ~45% de su altura, sombra hacia la derecha y abajo
    for (const b of m.buildings) {
      const x0 = b.x * 16, x1 = (b.x + b.w) * 16, y0 = b.y * 16, y1 = (b.y + b.h) * 16, hg = b.h * 16 * 0.9;
      const dx = hg * 0.85, dy = hg * 0.28;
      x.globalAlpha = 0.45;
      x.beginPath(); x.moveTo(x1, y0 + 6); x.lineTo(x1 + dx, y0 + 6 + dy); x.lineTo(x1 + dx, y1 + dy); x.lineTo(x0 + dx * 0.4, y1 + dy); x.lineTo(x0, y1); x.closePath(); x.fill();
    }
    // árboles y farolas
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const d = World.tileAt(tx, ty); if (!d) continue;
      if (d.canopy) { x.globalAlpha = 0.38; x.beginPath(); x.ellipse(tx * 16 + 22, ty * 16 + 15, 15, 5, 0.25, 0, Math.PI * 2); x.fill(); }
      if (d.light) { x.globalAlpha = 0.25; x.fillRect(tx * 16 + 8, ty * 16 + 13, 14, 2); }
    }
    x.globalAlpha = 1;
    // los edificios se vuelven a pintar encima de su propia sombra
    for (const b of m.buildings) x.drawImage(Buildings.get(b.style, b.w, b.h, b.door), b.x * 16, b.y * 16);
    return c;
  },
  // render del mundo más ancho y más alto (para la perspectiva)
  wideRender(SW, SH, extraTop) {
    const [c, x] = U.makeCanvas(SW, SH);
    const oldW = W, oldHud = HUD.drawWorld, oldLayer = World.layer, oldDE = World.drawEntity;
    World.layer = this.shadowLayer();
    // sombra larga bajo cada personaje
    World.drawEntity = function (ctx, e, cx, cy) {
      ctx.globalAlpha = 0.42; ctx.fillStyle = '#10183a'; ctx.beginPath(); ctx.ellipse(e.px - cx + 15, e.py - cy + 14, 10, 3, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      return oldDE.call(this, ctx, e, cx, cy);
    };
    HUD.drawWorld = () => {};
    W = SW;
    try { x.translate(0, extraTop); World.draw(x); } finally { W = oldW; HUD.drawWorld = oldHud; World.layer = oldLayer; World.drawEntity = oldDE; }
    return c;
  },
  render() {
    const SW = 560, SH = 330, top = 90; World.banner = null;
    const src = this.wideRender(SW, SH, top);
    const [out, o] = U.makeCanvas(WIDE, H);
    o.imageSmoothingEnabled = false;
    // perspectiva: arriba se ve más lejos (más estrecho y comprimido)
    for (let y = 0; y < H; y++) {
      const t = y / (H - 1), k = 1 - t;
      const sy = SH - (k * 240) * (1 + 0.375 * k);
      const sw = WIDE * (1 + 0.31 * k);
      o.drawImage(src, SW / 2 - sw / 2, Math.max(0, Math.floor(sy)), sw, 1, 0, y, WIDE, 1);
    }
    // luz cálida y sombras frías
    o.globalCompositeOperation = 'soft-light'; o.globalAlpha = 0.32;
    const g = o.createLinearGradient(0, 0, WIDE, H); g.addColorStop(0, '#ffd890'); g.addColorStop(1, '#3a4a90');
    o.fillStyle = g; o.fillRect(0, 0, WIDE, H);
    o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1;
    // bruma del horizonte
    const hz = o.createLinearGradient(0, 0, 0, 90); hz.addColorStop(0, 'rgba(210,225,255,0.55)'); hz.addColorStop(1, 'rgba(210,225,255,0)');
    o.fillStyle = hz; o.fillRect(0, 0, WIDE, 90);
    // resplandor (bloom)
    const [bl, b] = U.makeCanvas(WIDE, H);
    b.filter = 'brightness(1.6) contrast(1.4) blur(4px)'; b.drawImage(out, 0, 0); b.filter = 'none';
    o.globalCompositeOperation = 'screen'; o.globalAlpha = 0.22; o.drawImage(bl, 0, 0); o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1;
    // desenfoque de profundidad (arriba y abajo)
    const [bt, bx] = U.makeCanvas(WIDE, H);
    for (const [y0, y1, r] of [[0, 30, 2.2], [30, 60, 1.2], [60, 80, 0.6], [215, 240, 1]]) {
      bx.clearRect(0, 0, WIDE, H); bx.filter = `blur(${r}px)`; bx.drawImage(out, 0, 0); bx.filter = 'none';
      o.drawImage(bt, 0, y0, WIDE, y1 - y0, 0, y0, WIDE, y1 - y0);
    }
    // viñeta
    const v = o.createRadialGradient(WIDE / 2, H * 0.6, 80, WIDE / 2, H * 0.6, 280); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,8,30,0.45)');
    o.fillStyle = v; o.fillRect(0, 0, WIDE, H);
    return out;
  },
  async shot(name, canvas, sc = 2) {
    const c = document.createElement('canvas'); c.width = canvas.width * sc; c.height = canvas.height * sc;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(canvas, 0, 0, c.width, c.height);
    await fetch('/__shot?name=' + name, { method: 'POST', body: c.toDataURL('image/png') });
  },
};
