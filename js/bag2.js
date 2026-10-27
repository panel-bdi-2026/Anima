'use strict';
// ============================================================
//  MOCHILA 2.0: bolsillos, mochila ilustrada, lista con insignias
//  y panel de descripción con el objeto ampliado.
// ============================================================
{
  const POCKETS = [
    { name: 'Curación', icon: 'pocion', col: '#d85868', test: (it) => it.heal || it.revive },
    { name: 'Esferas', icon: 'esfera', col: '#4a88d8', test: (it) => it.sphere || it.bait },
    { name: 'Amuletos', icon: 'amuleto_mente', col: '#9a5ad0', test: (it) => it.held },
    { name: 'Objetos', icon: 'cuerda', col: '#4a9a58', test: (it) => !it.key },
    { name: 'Clave', icon: 'ficha_puerto', col: '#d8a030', test: (it) => it.key },
  ];
  const pocketOf = (it) => POCKETS.findIndex((p) => p.test(it));
  const sh = (c, k) => U.shade(c, k);
  let leather = null;
  const leatherBg = () => {
    if (leather) return leather;
    const [c, x] = U.makeCanvas(W, H);
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
      const n = hash2(i >> 1, y >> 1), v = 0.5 + Math.sin(i * 0.05 + y * 0.03) * 0.08;
      P(x, i, y, 1, 1, n < 0.08 ? '#5a3418' : n > 0.94 ? '#8e5a32' : v > 0.53 ? '#7a4826' : '#74442a');
    }
    x.globalAlpha = 0.5;
    for (let i = 3; i < W - 3; i += 4) { P(x, i, 2, 2, 1, '#f0d4a0'); P(x, i, H - 3, 2, 1, '#f0d4a0'); }
    for (let y = 3; y < H - 3; y += 4) { P(x, 2, y, 1, 2, '#f0d4a0'); P(x, W - 3, y, 1, 2, '#f0d4a0'); }
    x.globalAlpha = 1;
    leather = c; return c;
  };
  const packCache = {};
  const backpack = (pk) => {
    if (packCache[pk]) return packCache[pk];
    const [c, x] = U.makeCanvas(92, 100), flap = POCKETS[pk].col;
    const body = ['#5a3418', '#8a5428', '#b06c34', '#c8823e', '#dc9a52', '#ecb470'];
    // correas traseras
    P(x, 14, 6, 6, 70, '#4a2a14'); P(x, 72, 6, 6, 70, '#4a2a14');
    // cuerpo con volumen
    for (let y = 18; y < 96; y++) for (let i = 8; i < 84; i++) {
      const dx = (i - 46) / 38, dy = (y - 57) / 39;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || (Math.abs(dx) > 0.86 && Math.abs(dy) > 0.86)) continue;
      const l = -(dx * 0.6 + dy * 0.4) * 0.5 + 0.55 + BAYER[(y & 3) * 4 + (i & 3)] * 0.25;
      P(x, i, y, 1, 1, body[U.clamp(Math.floor(l * 6), 0, 5)]);
    }
    // bolsillo frontal y costuras
    P(x, 22, 58, 48, 30, '#8a5428'); P(x, 23, 59, 46, 28, '#c8823e'); P(x, 23, 59, 46, 2, '#ecb470');
    for (let i = 24; i < 68; i += 3) { P(x, i, 62, 1, 1, '#f0d4a0'); P(x, i, 84, 1, 1, '#f0d4a0'); }
    // solapa del color del bolsillo
    for (let y = 14; y < 46; y++) { const ww = 40 - Math.max(0, y - 36) * 2; for (let i = 46 - ww; i < 46 + ww; i++) P(x, i, y, 1, 1, y < 17 ? sh(flap, 0.3) : (i < 46 - ww + 3) ? sh(flap, 0.12) : (i > 46 + ww - 4) ? sh(flap, -0.2) : flap); }
    P(x, 6, 45, 80, 1, sh(flap, -0.4));
    // hebilla
    P(x, 40, 40, 12, 10, '#3a2a14'); P(x, 41, 41, 10, 8, '#f0c848'); P(x, 43, 43, 6, 4, '#3a2a14'); P(x, 41, 41, 10, 1, '#fff0a0');
    // asa
    for (let i = 0; i < 20; i++) { const a = Math.PI * (i / 19); P(x, Math.round(46 + Math.cos(a) * 12), Math.round(14 - Math.sin(a) * 10), 3, 3, '#4a2a14'); }
    packCache[pk] = c; return c;
  };
  Object.assign(BagScreen.prototype, {
    pockets() { return this.mode === 'battle' ? [0, 1] : [0, 1, 2, 3, 4]; },
    items() {
      const pk = this.pocket || 0;
      return Object.keys(G.bag).filter((k) => G.bag[k] > 0 && ITEMS[k] && (this.mode !== 'battle' || ITEMS[k].battle) && pocketOf(ITEMS[k]) === pk)
        .sort((a, b) => Object.keys(ITEMS).indexOf(a) - Object.keys(ITEMS).indexOf(b));
    },
    update() {
      if (this.busy) return;
      if (this.pocket === undefined) { this.pocket = 0; const first = this.pockets().find((p) => { this.pocket = p; return this.items().length; }); this.pocket = first !== undefined ? first : 0; }
      const pks = this.pockets(), M = Input.mouse;
      const switchTo = (p) => { if (p !== this.pocket) { this.pocket = p; this.i = 0; this.scroll = 0; Sound.sfx('blip'); } };
      if (Input.repeat('left')) switchTo(pks[(pks.indexOf(this.pocket) + pks.length - 1) % pks.length]);
      if (Input.repeat('right')) switchTo(pks[(pks.indexOf(this.pocket) + 1) % pks.length]);
      const list = this.items(), n = list.length + 1;
      if (Input.repeat('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
      if (Input.repeat('down')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
      // ratón: pestañas y filas
      let clickRow = false;
      if (M.inside && (M.moved || M.pressed[0])) {
        pks.forEach((p, k) => { if (M.x >= 104 + k * 42 && M.x < 144 + k * 42 && M.y >= 4 && M.y < 24 && M.pressed[0]) switchTo(p); });
        for (let k = 0; k < 7; k++) if (M.x >= 104 && M.x < 316 && M.y >= 30 + k * 16 && M.y < 46 + k * 16 && this.scroll + k < n) { this.i = this.scroll + k; if (M.pressed[0]) clickRow = true; }
      }
      if (M.wheel) { this.i = U.clamp(this.i + Math.sign(M.wheel), 0, n - 1); }
      this.i = Math.min(this.i, n - 1);
      if (this.i < this.scroll) this.scroll = this.i;
      if (this.i >= this.scroll + 7) this.scroll = this.i - 6;
      if (Input.pressed('a') || clickRow) {
        Sound.sfx('select');
        if (this.i === list.length) this.done(null); else this.select(list[this.i]);
      } else if (Input.pressed('b') || M.pressed[2]) { Sound.sfx('cancel'); this.done(null); }
    },
    draw(ctx) {
      ctx.drawImage(leatherBg(), 0, 0);
      const pks = this.pockets(), pk = this.pocket || 0, P0 = POCKETS[pk];
      // mochila ilustrada y dinero
      ctx.drawImage(backpack(pk), 6, 8 + Math.round(Math.sin(Engine.time * 2) * 1));
      UI.box(ctx, 6, 112, 92, 18, 'dark');
      P(ctx, 12, 117, 8, 8, '#a87810'); P(ctx, 13, 118, 6, 6, '#f8d048'); P(ctx, 14, 119, 2, 2, '#fff8c0');
      Font.drawRight(ctx, '$' + G.money, 92, 117, '#ffe8a0');
      Font.drawCenter(ctx, this.mode === 'battle' ? 'COMBATE' : 'MOCHILA', 52, 136, '#f8e0b0');
      // pestañas
      pks.forEach((p, k) => {
        const x0 = 104 + k * 42, sel = p === pk, c = POCKETS[p].col;
        P(ctx, x0, sel ? 4 : 7, 40, sel ? 22 : 18, '#1c1420');
        P(ctx, x0 + 1, sel ? 5 : 8, 38, sel ? 20 : 16, sel ? c : sh(c, -0.35));
        P(ctx, x0 + 1, sel ? 5 : 8, 38, 1, sh(c, sel ? 0.35 : -0.1));
        ctx.drawImage(Icons.item(POCKETS[p].icon), x0 + 12, sel ? 7 : 9);
      });
      // lista
      const list = this.items();
      P(ctx, 104, 26, 212, 116, '#1c1420'); P(ctx, 105, 27, 210, 114, '#f8f0e0');
      P(ctx, 105, 27, 210, 2, P0.col);
      Font.draw(ctx, P0.name.toUpperCase(), 110, 32, sh(P0.col, -0.35));
      Font.drawRight(ctx, list.length + ' objetos', 310, 32, '#8a7a6a');
      for (let k = 0; k < 7; k++) {
        const idx = this.scroll + k; if (idx > list.length) break;
        const y = 44 + k * 14, sel = idx === this.i;
        if (sel) { P(ctx, 106, y - 3, 208, 14, sh(P0.col, 0.55)); P(ctx, 106, y - 3, 3, 14, P0.col); }
        else if (k % 2) P(ctx, 106, y - 3, 208, 14, '#f0e6d2');
        if (idx === list.length) { Font.draw(ctx, 'CERRAR', 132, y, '#5a4a3a'); continue; }
        const id = list[idx], it = ITEMS[id];
        ctx.drawImage(Icons.item(id), 112, y - 5);
        Font.draw(ctx, it.name, 132, y, sel ? '#1c1420' : '#3a2e28');
        if (!it.key) { const q = '×' + G.bag[id], w = Font.width(q) + 6; P(ctx, 310 - w, y - 2, w, 10, sel ? P0.col : '#d8ccb4'); Font.draw(ctx, q, 313 - w, y, sel ? '#ffffff' : '#4a3a2e'); }
      }
      if (list.length + 1 > 7) { const h = Math.max(8, Math.round(100 * 7 / (list.length + 1))), y = 40 + Math.round((100 - h) * this.scroll / Math.max(1, list.length + 1 - 7)); P(ctx, 312, 40, 2, 100, '#d8ccb4'); P(ctx, 312, y, 2, h, P0.col); }
      if (!list.length) Font.drawCenter(ctx, 'Este bolsillo está vacío.', 210, 80, '#9a8a7a');
      // descripción
      UI.box(ctx, 4, 148, 312, 88);
      const id = list[this.i];
      P(ctx, 12, 158, 40, 40, '#1c1420'); P(ctx, 13, 159, 38, 38, sh(P0.col, 0.6)); P(ctx, 13, 159, 38, 1, '#ffffff');
      if (id) {
        const it = ITEMS[id];
        ctx.imageSmoothingEnabled = false; ctx.drawImage(Icons.item(id), 16, 162, 32, 32);
        Font.draw(ctx, it.name, 60, 158, sh(P0.col, -0.4));
        const tag = it.key ? 'Objeto clave' : it.held ? 'Amuleto · equípalo desde ÁNIMAS' : it.sphere ? 'Esfera · E en el mapa o en combate' : it.bait ? 'Cebo · lánzalo con E' : it.price ? `Valor: $${it.price}` : '';
        if (tag) Font.draw(ctx, tag, 60, 170, '#8a7a6a');
        Font.wrap(it.desc, 248).slice(0, 4).forEach((ln, k) => Font.draw(ctx, ln, 60, 184 + k * 12, '#2a2236'));
      } else Font.draw(ctx, 'Cerrar la mochila.', 60, 162, '#2a2236');
      Font.drawRight(ctx, '←→ bolsillos', 310, 226, '#9a8a7a');
    },
  });
}
