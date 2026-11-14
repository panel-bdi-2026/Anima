'use strict';
// ============================================================
//  CÓDICE: LIBRETA DE CAMPO
//  El Códice usa todo el ancho de la pantalla: a la izquierda, el ánima a tamaño real
//  (cada píxel del dibujo es un píxel de la pantalla) sobre un fondo pintado de su hábitat
//  (hecho con PixelLab); a la derecha, la lista con su ícono. Las que todavía no viste
//  aparecen como una silueta oscura sobre su hábitat.
// ============================================================
const Codice = {
  // hábitat de cada ánima: por su primer tipo, con algunas excepciones (los hongos viven en el pantano)
  POR_TIPO: { planta: 'bosque', bicho: 'bosque', normal: 'pradera', agua: 'agua', roca: 'cueva', fuego: 'volcan', viento: 'cielo', sombra: 'noche', mente: 'mistico', electrico: 'tormenta' },
  ESPECIE: { hongui: 'pantano', setalon: 'pantano', esporal: 'pantano', micelion: 'pantano', abismar: 'noche', leviaton: 'noche', lunargo: 'noche', lunavela: 'noche' },
  NOMBRE: { bosque: 'Bosque', pradera: 'Pradera', agua: 'Orilla', cueva: 'Cueva', volcan: 'Volcán', cielo: 'Cielo', noche: 'Noche', mistico: 'Santuario', pantano: 'Pantano', tormenta: 'Tormenta' },
  img: {},
  habitat(sp) { return this.ESPECIE[sp.key] || this.POR_TIPO[sp.types[0]] || 'pradera'; },
  fondo(h) {
    if (!this.img[h]) { const im = new Image(); im.src = 'assets/habitats/' + h + '.png'; this.img[h] = im; }
    const im = this.img[h];
    return im.complete && im.naturalWidth ? im : null;
  },
  // escala del ánima respecto de una de primera etapa (igual que en el mapa y en el combate)
  escala(sp) {
    const leg = sp.legendary ? 28 / 20 : 1;
    return leg * (typeof FrameSprites !== 'undefined' && FrameSprites.has(sp.key) ? FrameSprites.stageScale(sp.key) : 1);
  },
  // silueta chica, del color c, de un cuadro del dibujo (sx, sy, w, h) a la escala f
  mini(im, w, h, f, c) {
    const [o, x] = U.makeCanvas(Math.max(1, Math.round(w * f)), Math.max(1, Math.round(h * f)));
    x.imageSmoothingEnabled = false; x.drawImage(im, 0, 0, w, h, 0, 0, o.width, o.height);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = c; x.fillRect(0, 0, o.width, o.height);
    return o;
  },
  // comparación de tamaño: el protagonista y el ánima, con las mismas proporciones que en el juego
  // (un píxel del dibujo, del protagonista o del ánima, es medio píxel del mundo)
  tamano(sp, F) {
    const k = 'tam:' + sp.key; if (this[k]) return this[k];
    if (typeof CharFrames === 'undefined' || typeof FrameSprites === 'undefined' || !FrameSprites.has(sp.key)) return null;
    const pj = CharFrames.strip('player', 'reposo', 'lado'), an = FrameSprites.base(sp.key, 'reposo', 'lado');
    if (!pj || !an) return null;
    const [S, feet] = FrameSprites.DATA[sp.key], pf = CharFrames.SET.player.feet + 1;
    return (this[k] = { pj: this.mini(pj, 64, pf, F, '#9a8e7c'), an: this.mini(an, S, feet + 1, F * this.escala(sp), '#2b2638') });
  },
  // silueta (sombra) del dibujo grande del ánima
  silueta(sp) {
    const k = 'sil:' + sp.key;
    if (this[k]) return this[k];
    const src = CreatureGfx.get(sp.key, 96);
    if (typeof FrameSprites !== 'undefined' && FrameSprites.has(sp.key) && !FrameSprites.still(sp.key, 96)) return null;
    const [c, x] = U.makeCanvas(src.width, src.height); x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = '#2a2438'; x.fillRect(0, 0, c.width, c.height);
    return (this[k] = c);
  },
};
DexScreen.prototype.wide = true;
DexScreen.prototype.draw = function (ctx) {
  const INK = '#2b2638', PAPER = '#ece5d2', PAPER2 = '#e2d9c2', MUTED = '#7a6f62', ACC = '#b8682a';
  P(ctx, 0, 0, W, H, PAPER);
  ctx.fillStyle = PAPER2;
  for (let y = 26; y < H; y += 8) for (let x = 4; x < W; x += 8) ctx.fillRect(x, y, 1, 1);
  // encabezado
  P(ctx, 0, 0, W, 20, INK); P(ctx, 0, 20, W, 1, ACC);
  Font.draw(ctx, 'CÓDICE DE REGIÓN ALBA', 10, 6, '#f4ecd8');
  Font.drawRight(ctx, `Vistas ${Object.keys(G.seen).length}   Capturadas ${Object.keys(G.caught).length}   de ${SPECIES_LIST.length}`, W - 10, 6, '#d8c8a8');
  const sp = SPECIES_LIST[this.i], seen = !!G.seen[sp.id], caught = !!G.caught[sp.id];
  const hab = Codice.habitat(sp);
  // ---- lámina del hábitat con el ánima ----
  const lam = (x, y) => {
    P(ctx, x - 2, y - 2, 148, 148, INK);
    const f = Codice.fondo(hab);
    if (f) ctx.drawImage(f, x, y, 144, 144); else P(ctx, x, y, 144, 144, '#c8d0b8');
    if (!seen) { ctx.globalAlpha = 0.35; P(ctx, x, y, 144, 144, '#1a1626'); ctx.globalAlpha = 1; }
    ctx.globalAlpha = 0.35; P(ctx, x + 44, y + 128, 56, 4, '#0c0a14'); ctx.globalAlpha = 1;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, 144, 144); ctx.clip();
    if (seen) CreatureAnim.portrait(ctx, sp.key, 80, false, x + 72 - 40, y + 130 - 80, 'codice', { scale: 1 });
    else { const s = Codice.silueta(sp); if (s) ctx.drawImage(s, x + 72 - s.width / 2, y + 132 - s.height); }
    ctx.restore();
    // pestaña con el nombre del hábitat
    const hn = Codice.NOMBRE[hab], w = Font.width(hn) + 10;
    P(ctx, x + 144 - w, y + 144 - 12, w, 12, 'rgba(20,16,30,0.6)'); Font.draw(ctx, hn, x + 144 - w + 5, y + 144 - 10, '#f4ecd8');
  };
  if (this.detail) {
    lam(12, 30);
    const X = 168;
    Font.draw(ctx, `Nº${U.pad(sp.id, 3, '0')}`, X, 30, MUTED);
    Font.draw(ctx, sp.name, X + 34, 30, INK);
    sp.types.forEach((t, k) => UI.typeBadge(ctx, t, X + k * 33, 44));
    Font.draw(ctx, caught ? 'Capturada' : 'Vista', X + 72, 45, caught ? '#2a7a40' : MUTED);
    Font.wrap(sp.desc, W - X - 14).forEach((ln, k) => Font.draw(ctx, ln, X, 62 + k * 12, '#4a4250'));
    let y = 62 + Font.wrap(sp.desc, W - X - 14).length * 12 + 8;
    if (caught) {
      const s = sp.stats;
      [['PS', s.hp], ['Ataque', s.atk], ['Defensa', s.def], ['Especial', s.esp], ['Velocidad', s.vel]].forEach(([n, v], k) => {
        Font.draw(ctx, n, X, y + k * 11, MUTED);
        P(ctx, X + 62, y + 2 + k * 11, 100, 5, '#d4c9b0'); P(ctx, X + 62, y + 2 + k * 11, Math.round(100 * Math.min(1, v / 130)), 5, TYPES[sp.types[0]].color);
        Font.draw(ctx, String(v), X + 168, y + k * 11, INK);
      });
      y += 60;
    }
    Font.draw(ctx, 'Evolución', X, y, ACC);
    Font.wrap(evoText(sp), W - X - 14).forEach((ln, k) => Font.draw(ctx, ln, X, y + 13 + k * 12, '#4a4250'));
    // tamaño comparado con el protagonista, chico, debajo de la lámina
    const tm = Codice.tamano(sp, 0.42);
    if (tm) {
      const base = 207, cx = 112;
      Font.draw(ctx, 'Tamaño', 14, 186, MUTED);
      P(ctx, 62, base, 92, 1, '#c8bca2');
      ctx.drawImage(tm.pj, cx - 22 - Math.round(tm.pj.width / 2), base - tm.pj.height);
      ctx.drawImage(tm.an, cx + 14 - Math.round(tm.an.width / 2), base - tm.an.height);
    }
    Font.drawCenter(ctx, 'Z / X: volver   ↑↓: otra ánima', 84, 214, MUTED);
    return;
  }
  lam(12, 30);
  if (seen) {
    Font.drawCenter(ctx, sp.name, 84, 182, INK);
    sp.types.forEach((t, k) => UI.typeBadge(ctx, t, 84 - sp.types.length * 16 + k * 33, 196));
  } else Font.drawCenter(ctx, 'Sin registrar', 84, 186, MUTED);
  Font.drawCenter(ctx, 'Z: detalles   ←→: saltar', 84, 222, MUTED);
  // ---- lista ----
  const LX = 168, LW = W - LX - 8;
  P(ctx, LX - 1, 27, LW + 2, 206, INK); P(ctx, LX, 28, LW, 204, '#f6f1e3');
  for (let k = 0; k < 14; k++) {
    const idx = this.scroll + k; if (idx >= SPECIES_LIST.length) break;
    const s = SPECIES_LIST[idx], y = Math.round(30 + k * 14.5), sel = idx === this.i, sn = !!G.seen[s.id];
    if (sel) { P(ctx, LX + 1, y, LW - 2, 14, '#f3d9a8'); P(ctx, LX + 1, y, 2, 14, ACC); } else if (k % 2) P(ctx, LX + 1, y, LW - 2, 14, '#efe7d4');
    if (sn) ctx.drawImage(CreatureGfx.get(s.key, 16, false), LX + 6, y - 1);
    Font.draw(ctx, U.pad(s.id, 3, '0'), LX + 26, y + 3, sn ? MUTED : '#bdb3a0');
    Font.draw(ctx, sn ? s.name : '- - - - -', LX + 50, y + 3, sn ? INK : '#bdb3a0');
    if (sn) Font.drawRight(ctx, Codice.NOMBRE[Codice.habitat(s)], LX + LW - 22, y + 3, '#a89a84');
    if (G.caught[s.id]) ctx.drawImage(Icons.sphere('esfera', 10), LX + LW - 16, y + 2);
  }
  // barra de posición
  const n = SPECIES_LIST.length, bh = Math.max(10, Math.round(200 * 14 / n));
  P(ctx, W - 7, 30 + Math.round((200 - bh) * this.scroll / Math.max(1, n - 14)), 2, bh, ACC);
};
// las fotos de los hábitats se cargan al abrir el Códice
{
  const _u = DexScreen.prototype.update;
  DexScreen.prototype.update = function (dt) {
    if (!this._pre) { this._pre = true; for (const h of Object.keys(Codice.NOMBRE)) Codice.fondo(h); }
    return _u.call(this, dt);
  };
}
