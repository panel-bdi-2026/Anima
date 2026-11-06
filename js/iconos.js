'use strict';
// ============================================================
//  ÍCONOS NUEVOS (dibujados con PixelLab): objetos, esferas y menú de inicio
//  Cada ícono es un PNG de 32×32 en assets/iconos/. Para los tamaños chicos
//  se reduce eligiendo el color que más se repite en cada bloque (sin manchas
//  grises) y, si hace falta, se tiñe (pociones, núcleos y amuletos por color).
//  Mientras cargan las imágenes se ve el ícono de antes.
// ============================================================
const Iconos = {
  img: {},
  get(name) {
    if (!this.img[name]) {
      const im = new Image();
      im.onload = () => { for (const k in Icons.cache) if (/^(it|sph):/.test(k)) delete Icons.cache[k]; Iconos.cache = {}; };
      im.src = 'assets/iconos/' + name + '.png';
      this.img[name] = im;
    }
    const im = this.img[name];
    return im.complete && im.naturalWidth ? im : null;
  },
  cache: {},
  // centro del dibujo (sin contar el fondo transparente), para centrarlo en un recuadro
  center(im) {
    if (im._ctr) return im._ctr;
    const [c, x] = U.makeCanvas(im.width, im.height); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, im.width, im.height).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let j = 0; j < im.height; j++) for (let i = 0; i < im.width; i++) if (d[(j * im.width + i) * 4 + 3] > 0) { x0 = Math.min(x0, i); y0 = Math.min(y0, j); x1 = Math.max(x1, i); y1 = Math.max(y1, j); }
    return (im._ctr = x1 < 0 ? [im.width / 2, im.height / 2] : [(x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2]);
  },
  // reduce un 32×32 a la mitad tomando, en cada bloque de 2×2, el color más repetido (y el más oscuro si empatan)
  half(src) {
    const [t, tx] = U.makeCanvas(32, 32); tx.drawImage(src, 0, 0);
    const d = tx.getImageData(0, 0, 32, 32).data, [c, x] = U.makeCanvas(16, 16), out = x.createImageData(16, 16), o = out.data;
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      const cnt = new Map(); let op = 0;
      for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) {
        const q = ((j * 2 + b) * 32 + i * 2 + a) * 4; if (d[q + 3] < 128) continue; op++;
        const key = (d[q] << 16) | (d[q + 1] << 8) | d[q + 2]; cnt.set(key, (cnt.get(key) || 0) + 1);
      }
      if (op < 2) continue;
      let best = 0, bc = -1, bl = 1e9;
      for (const [key, v] of cnt) { const l = (key >> 16) + ((key >> 8) & 255) + (key & 255); if (v > bc || (v === bc && l < bl)) { best = key; bc = v; bl = l; } }
      const q = (j * 16 + i) * 4; o[q] = best >> 16; o[q + 1] = (best >> 8) & 255; o[q + 2] = best & 255; o[q + 3] = 255;
    }
    x.putImageData(out, 0, 0);
    return c;
  },
  // cambia el tono de los colores con saturación al del color pedido (los grises y el contorno quedan igual)
  tint(src, color) {
    const [c, x] = U.makeCanvas(src.width, src.height); x.drawImage(src, 0, 0);
    if (!color) return c;
    const [tr, tg, tb] = U.hexToRgb(color), [th] = U.rgbToHsl(tr, tg, tb);
    const im = x.getImageData(0, 0, c.width, c.height), p = im.data;
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const [h, s, l] = U.rgbToHsl(p[i], p[i + 1], p[i + 2]);
      if (s < 0.18 || l < 0.1) continue;
      const [r, g, b] = U.hslToRgb(th, s, l); p[i] = r; p[i + 1] = g; p[i + 2] = b;
    }
    x.putImageData(im, 0, 0);
    return c;
  },
  // nombre del dibujo y color de teñido para cada objeto
  ITEM: { pocion: ['it_pocion'], superpocion: ['it_pocion', '#e05880'], hiperpocion: ['it_pocion', '#f0a030'], baya: ['it_baya'], revivir: ['it_revivir'], repelente: ['it_repelente'],
    cuerda: ['it_cuerda'], caramelo: ['it_caramelo'], hierba_olvido: ['it_hierba'], ficha_puerto: ['it_pase'] },
  SPHERE: { esfera: 'esf_esfera', super: 'esf_super', ultra: 'esf_ultra', master: 'esf_master', pesada: 'esf_pesada', rapida: 'esf_rapida', nocturna: 'esf_nocturna', red: 'esf_red' },
  forItem(id) {
    const it = ITEMS[id]; if (!it) return null;
    if (this.ITEM[id]) return this.ITEM[id];
    if (it.sphere && this.SPHERE[it.sphere]) return [this.SPHERE[it.sphere]];
    if (it.icon === 'core') return ['it_nucleo', it.color];
    if (it.icon === 'charm') return ['it_amuleto', it.color];
    return null;
  },
  // ícono de 32×32 (para recuadros grandes) o null si no hay dibujo nuevo
  big(id) {
    const f = this.forItem(id); if (!f) return null;
    const k = 'b:' + id; if (this.cache[k]) return this.cache[k];
    const im = this.get(f[0]); if (!im) return null;
    return (this.cache[k] = this.tint(im, f[1]));
  },
  small(id) {
    const k = 's:' + id; if (this.cache[k]) return this.cache[k];
    const b = this.big(id); if (!b) return null;
    return (this.cache[k] = this.half(b));
  },
};
{
  const _item = Icons.item.bind(Icons);
  Icons.item = function (id) { return Iconos.small(id) || _item(id); };
  // ícono grande (32×32) para los recuadros de detalle
  Icons.itemBig = function (id) { return Iconos.big(id) || null; };
  const _sphere = Icons.sphere.bind(Icons);
  Icons.sphere = function (kind = 'esfera', size = 12) {
    const name = Iconos.SPHERE[kind], im = name && Iconos.get(name);
    if (!im) return _sphere(kind, size);
    const k = 'sph:' + kind + ':' + size; if (Iconos.cache[k]) return Iconos.cache[k];
    const h = Iconos.half(im), [c, x] = U.makeCanvas(size, size);
    x.imageSmoothingEnabled = size !== 16; if (size !== 16) x.imageSmoothingQuality = 'high';
    x.drawImage(h, 0, 0, 16, 16, 0, 0, size, size);
    return (Iconos.cache[k] = c);
  };
  // precarga
  for (const n of ['it_pocion', 'it_baya', 'it_revivir', 'it_repelente', 'it_cuerda', 'it_caramelo', 'it_nucleo', 'it_hierba', 'it_amuleto', 'it_pase', ...Object.values(Iconos.SPHERE)]) Iconos.get(n);
}
// menú de inicio: ícono de 16×16 en vez del dibujo de 9×8
{
  const MENU = { dex: 'menu_codice', party: 'menu_equipo', map: 'menu_mapa', bag: 'menu_mochila', gear: 'menu_equipamiento', card: 'menu_ficha', save: 'menu_guardar', opt: 'menu_opciones', close: 'menu_cerrar' };
  for (const n of Object.values(MENU)) Iconos.get(n);
  Iconos.menu = function (k) {
    const name = MENU[k] || MENU.card, kk = 'm:' + name;
    if (this.cache[kk]) return this.cache[kk];
    const im = this.get(name); if (!im) return null;
    return (this.cache[kk] = this.half(im));
  };
}
// medallas: 32×32 en la ficha del entrenador y 16×16 en el resto
{
  const MED = ['med_raiz', 'med_pena', 'med_oleaje', 'med_ascua', 'med_cefiro', 'med_aurora'];
  for (const n of MED) Iconos.get(n);
  Iconos.medal = function (i) { return MED[i] ? this.get(MED[i]) : null; };
  // silueta oscura para las medallas que faltan
  Iconos.medalShadow = function (i) {
    const k = 'ms:' + i; if (this.cache[k]) return this.cache[k];
    const im = this.medal(i); if (!im) return null;
    const [c, x] = U.makeCanvas(32, 32); x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#b8b0c4'; x.fillRect(0, 0, 32, 32);
    return (this.cache[k] = c);
  };
  const _badge = Icons.badge;
  Icons.badge = function (i, size = 16) {
    const im = Iconos.medal(i);
    if (!im) return _badge.call(this, i, size);
    const k = 'mb:' + i + ':' + size; if (Iconos.cache[k]) return Iconos.cache[k];
    const h = Iconos.half(im);
    if (size === 16) return (Iconos.cache[k] = h);
    const [c, x] = U.makeCanvas(size, size); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(h, 0, 0, size, size);
    return (Iconos.cache[k] = c);
  };
}
