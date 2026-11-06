'use strict';
// ============================================================
//  MENÚS CON DIBUJOS DE PIXELLAB
//  - Constelación: cada nodo lleva su ícono (espada = Ataque, corazón = PS, candado = sellado…)
//  - Equipamiento: las piezas y las ranuras vacías con su dibujo, teñido con el metal y la gema
//    de su rareza (cobre, plata, zafiro, amatista…)
//  - Mochila: la mochila grande de la izquierda
// ============================================================
const Menus2 = {
  img: {}, cache: {},
  get(path) {
    if (!this.img[path]) { const im = new Image(); im.src = 'assets/' + path + '.png'; this.img[path] = im; }
    const im = this.img[path];
    return im.complete && im.naturalWidth ? im : null;
  },
  // 32×32 -> 16×16 tomando el color más repetido de cada bloque de 2×2 (sin manchas grises)
  half(src) {
    const [t, tx] = U.makeCanvas(32, 32); tx.drawImage(src, 0, 0, 32, 32);
    const d = tx.getImageData(0, 0, 32, 32).data, [c, x] = U.makeCanvas(16, 16), out = x.createImageData(16, 16), o = out.data;
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      const cnt = new Map(); let op = 0;
      for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) {
        const q = ((j * 2 + b) * 32 + i * 2 + a) * 4; if (d[q + 3] < 128) continue; op++;
        const k = (d[q] << 16) | (d[q + 1] << 8) | d[q + 2]; cnt.set(k, (cnt.get(k) || 0) + 1);
      }
      if (op < 2) continue;
      let best = 0, bc = -1, bl = 1e9;
      for (const [k, v] of cnt) { const l = (k >> 16) + ((k >> 8) & 255) + (k & 255); if (v > bc || (v === bc && l < bl)) { best = k; bc = v; bl = l; } }
      const q = (j * 16 + i) * 4; o[q] = best >> 16; o[q + 1] = (best >> 8) & 255; o[q + 2] = best & 255; o[q + 3] = 255;
    }
    x.putImageData(out, 0, 0);
    return c;
  },
  small(path) {
    const k = 'h:' + path; if (this.cache[k]) return this.cache[k];
    const im = this.get(path); return im ? (this.cache[k] = this.half(im)) : null;
  },
  // tiñe un dibujo gris: los grises pasan a la rampa del metal; los colores (gema, tela) toman el color de la gema
  recolor(src, mat, gem) {
    const [c, x] = U.makeCanvas(src.width, src.height); x.drawImage(src, 0, 0);
    const im = x.getImageData(0, 0, c.width, c.height), p = im.data;
    const ramp = [mat[3], mat[2], mat[1], mat[1]].map((h) => U.hexToRgb(h)), [gh] = U.rgbToHsl(...U.hexToRgb(gem));
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const [h, s, l] = U.rgbToHsl(p[i], p[i + 1], p[i + 2]);
      if (l < 0.13) continue;                                   // contorno
      let r, g, b;
      if (s < 0.22) { const t = Math.min(0.999, l) * 3, k = Math.floor(t), f = t - k, A = ramp[k], B = ramp[Math.min(3, k + 1)]; r = A[0] + (B[0] - A[0]) * f; g = A[1] + (B[1] - A[1]) * f; b = A[2] + (B[2] - A[2]) * f; }
      else [r, g, b] = U.hslToRgb(gh, Math.max(s, 0.5), l);
      p[i] = r; p[i + 1] = g; p[i + 2] = b;
    }
    x.putImageData(im, 0, 0);
    return c;
  },
  gear(slotK, rar, mat) {
    const k = 'g:' + slotK + rar + mat[2]; if (this.cache[k]) return this.cache[k];
    const s = this.small('equipo/' + slotK); if (!s) return null;
    return (this.cache[k] = this.recolor(s, mat, rar === 0 ? '#9a94a8' : RARITY[rar].color));
  },
  gearEmpty(slotK) {
    const k = 'ge:' + slotK; if (this.cache[k]) return this.cache[k];
    const s = this.small('equipo/' + slotK); if (!s) return null;
    const [c, x] = U.makeCanvas(16, 16); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#3a3252'; x.fillRect(0, 0, 16, 16);
    return (this.cache[k] = c);
  },
  NODO: { stat: (inf) => inf.k, tal: (inf) => inf.k, move: () => 'move', lock: () => 'lock' },
};
for (const n of ['atk', 'esp', 'def', 'hp', 'vel', 'fuerza', 'ferocidad', 'furia', 'punteria', 'celeridad', 'contra', 'vitalidad', 'piel', 'regen', 'move', 'lock']) Menus2.get('nodos/' + n);
for (const n of ['brazalete', 'anillo', 'colgante', 'botas', 'emblema', 'talisman']) Menus2.get('equipo/' + n);
Menus2.get('mochila');

// ---------- constelación: ícono de cada nodo ----------
{
  const CP = ConstelScreen.prototype, _dn = CP.drawNode;
  CP.drawNode = function (ctx, n, own, stage) {
    const r = _dn.call(this, ctx, n, own, stage), inf = n.info, f = Menus2.NODO[inf.t];
    if (!f) return r;
    const ic = Menus2.small('nodos/' + f(inf)); if (!ic) return r;
    const [x, y] = this.pos(n), st = Board.canBuy(this.c, n), has = st === 'owned', locked = n.stage > stage;
    // el ícono va encima del círculo; los nodos sin activar se ven apagados
    // el ícono (16×16, píxeles nítidos) tapa el círculo y la letra de antes
    pixCircle(ctx, x, y, 7, '#0a0818');
    ctx.save();
    ctx.globalAlpha = has ? 1 : locked ? 0.28 : st === 'ok' ? 0.7 + 0.3 * Math.sin(this.t * 6) : 0.5;
    ctx.drawImage(ic, x - 8, y - 8);
    ctx.restore();
    return r;
  };
}

// ---------- equipamiento: piezas y ranuras con su dibujo ----------
{
  const _frame = GearIcons.frame;
  GearIcons.frame = function (ctx, it, x, y, s = 18, t = 0, sel = false, slotK = null) {
    const k = it ? it.slot : slotK;
    const nu = s >= 20 && k && (it ? Menus2.gear(k, it.rar, Gear.mat(it)) : Menus2.gearEmpty(k));
    if (!nu) return _frame.call(this, ctx, it, x, y, s, t, sel, slotK);
    // marco de antes, sin el ícono chico; encima el dibujo de 16×16
    const of = this.of, em = this.empty, blank = U.makeCanvas(12, 12)[0];
    this.of = () => blank; this.empty = () => blank;
    try { _frame.call(this, ctx, it, x, y, s, t, sel, slotK); } finally { this.of = of; this.empty = em; }
    ctx.drawImage(nu, x + Math.floor((s - 16) / 2), y + Math.floor((s - 16) / 2));
    if (it && it.rar >= 4) this.twinkle(ctx, x, y, s, t, it.rar === 5 ? '#ffd0d0' : '#fff4c0');
  };
}
