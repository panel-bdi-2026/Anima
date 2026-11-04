'use strict';
// ============================================================
//  NUEVOS INICIALES: Tofu (mente), Buppa (roca) y Parker (sombra)
//  - Tres líneas de 3 etapas, dibujadas por piezas (como HAND) con un
//    generador de cuadrúpedos: felino o caniche, con tamaño, orejas,
//    cola, pelaje y adornos propios de cada etapa.
//  - Ataques propios, Constelación y una quimera para cada línea.
//  - Se cargan DESPUÉS de las quimeras originales: las especies se
//    agregan al final de la lista, así no cambia el número (id) de
//    ninguna especie que ya esté guardada en una partida.
// ============================================================

// ---------- generador de piezas ----------
const IniKit = {
  grid(w = 40, h = 40) { return Array.from({ length: h }, () => new Array(w).fill('.')); },
  // recorta una rejilla a lo dibujado y la vuelve una pieza (at = esquina en el lienzo de 40×40)
  part(name, role, g, extra = {}) {
    let x0 = 99, y0 = 99, x1 = -1, y1 = -1;
    g.forEach((r, y) => r.forEach((ch, x) => { if (ch !== '.') { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } }));
    if (x1 < 0) return null;
    const rows = g.slice(y0, y1 + 1).map((r) => r.slice(x0, x1 + 1).join('').replace(/\.+$/, '') || '.');
    const p = Object.assign({ name, role, at: [x0, y0], rows }, extra);
    if (extra.pivAbs) { p.piv = [extra.pivAbs[0] - x0, extra.pivAbs[1] - y0]; delete p.pivAbs; }
    return p;
  },
  set(g, x, y, ch) { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = ch; },
  // elipse rellena; fn(dx, dy, x, y) devuelve el carácter (o null para dejar vacío)
  ell(g, cx, cy, rx, ry, fn, wob) {
    for (let y = Math.floor(cy - ry - 2); y <= Math.ceil(cy + ry + 2); y++) for (let x = Math.floor(cx - rx - 2); x <= Math.ceil(cx + rx + 2); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, a = Math.atan2(dy, dx), k = wob ? wob(a) : 1;
      if (dx * dx + dy * dy <= k * k) { const ch = fn(dx, dy, x, y); if (ch) this.set(g, x, y, ch); }
    }
  },
  // pelaje: claro arriba, oscuro abajo y hacia atrás (la luz viene de arriba a la izquierda)
  fur(dx, dy, back = 0.25) { const v = dy * 0.85 + dx * back; return v < -0.55 ? '5' : v < -0.12 ? '4' : v < 0.35 ? '3' : v < 0.72 ? '2' : '1'; },
  curl(dx, dy, x, y) { const v = dy * 0.85 + dx * 0.2 + (hash2(x * 3, y * 5) - 0.5) * 0.5; const r = v < -0.5 ? '5' : v < -0.05 ? '4' : v < 0.4 ? '3' : v < 0.75 ? '2' : '1'; return (x + y) % 3 === 0 && r !== '1' ? String(Math.max(1, +r - 1)) : r; },
  // ---------- cuadrúpedo ----------
  // o: { kind: 'cat' | 'poodle', k (escala), long (largo del cuerpo), fem, fierce, tails, … }
  quad(o) {
    const K = this, k = o.k, poodle = o.kind === 'poodle';
    const lh = Math.round((poodle ? 5 : 4.2) * k) + 1, bw = (o.long || (poodle ? 7.5 : 7.5)) * k, bh = (poodle ? 5 : 4.4) * k;
    const ground = 37, by = ground - lh - bh * 0.55, bx = 21;
    const hrx = (poodle ? 5.4 : 6) * k + 0.6, hry = (poodle ? 5 : 5.2) * k + 0.5;
    const hx = bx - bw + hrx * 0.55, hy = by - bh - hry * 0.45 + (o.fierce ? 1 : 0);
    const parts = [];
    const add = (p) => { if (p) parts.push(p); };
    // patas (las lejanas, más oscuras, detrás)
    const leg = (name, role, far, x, w) => {
      const g = K.grid(), top = Math.round(by + bh * 0.2);
      for (let y = top; y <= ground; y++) for (let i = 0; i < w; i++) K.set(g, x + i, y, far ? (i ? '1' : '2') : (i === 0 ? '4' : i === w - 1 ? '2' : '3'));
      if (poodle) { K.ell(g, x + w / 2 - 0.5, ground - 1, w / 2 + 1, 1.8, (dx, dy, xx, yy) => (far ? '2' : K.curl(dx, dy, xx, yy))); }
      else { K.set(g, x - 1, ground, far ? '2' : '4'); for (let i = 0; i < w; i++) K.set(g, x + i, ground, far ? '1' : '3'); }
      if (o.cuff && !far) for (let i = -1; i <= w; i++) { K.set(g, x + i, top + 2, 'r'); K.set(g, x + i, top + 3, 'R'); }
      if (o.socks) for (let i = 0; i < w; i++) { K.set(g, x + i, ground - 1, 'h'); K.set(g, x + i, ground, 'H'); }
      return K.part(name, role, g, { far, pivAbs: [x + 1, top] });
    };
    const lw = k >= 1 ? 3 : 2, fx = Math.round(bx - bw * 0.62), rx = Math.round(bx + bw * 0.45);
    // cola
    const tail = (name, far, bend) => {
      const g = K.grid(), x0 = bx + bw * 0.9, y0 = by - bh * 0.35, L = (o.tailLen || 13) * k;
      const n = 22, th = (o.tailTh || (poodle ? 1 : 1.2)) * Math.max(0.8, k);
      let tx = x0, ty = y0;
      for (let i = 0; i <= n; i++) {
        const t = i / n; tx = x0 + Math.sin(t * 2.6 + bend) * 3.2 * k + t * 5 * k; ty = y0 - Math.sin(t * 1.35) * L;
        const tip = t > 1 - (o.tipK || 0.3);
        if (poodle) { if (t < 0.55) K.ell(g, tx, ty, 0.9, 0.9, () => (far ? '2' : '3')); continue; }
        const r = th * (0.75 + 0.45 * t);
        K.ell(g, tx, ty, r, r, (dx, dy) => (far ? (dy < 0 ? '2' : '1') : tip && o.tip ? o.tip(dx, dy, t) : dx < -0.2 ? '4' : dx < 0.4 ? '3' : '2'));
      }
      if (poodle) { const px = x0 + Math.sin(0.55 * 1.7 + bend) * 5 * k + 1.1, py = y0 - 0.55 * L; K.ell(g, px, py - 1.5 * k, 2.6 * k + 0.6, 2.4 * k + 0.6, (dx, dy, xx, yy) => (dy > 0.3 ? 'h' : dy > -0.1 ? 'H' : K.curl(dx, dy, xx, yy))); }
      return K.part(name, 'tail', g, { far, pivAbs: [Math.round(x0), Math.round(y0)], outline: o.tailOutline });
    };
    if (o.tails > 1) add(tail('tail2', true, 0.9));
    add(leg('legBF', 'legB', true, rx + 2, lw)); add(leg('legFF', 'legF', true, fx + 2, lw));
    // oreja lejana
    const ear = (name, far, ex) => {
      const g = K.grid();
      if (poodle) {
        // oreja caída y peluda, de color chocolate
        const ox = ex, oy = hy - hry * 0.2;
        K.ell(g, ox, oy + 2.6 * k, 1.5 * k + 0.4, 3.4 * k + 0.5, (dx, dy, xx, yy) => (far ? 'h' : (hash2(xx * 7, yy) < 0.3 ? 'H' : dy > 0.4 ? 'h' : 'H')), (a) => 1 + 0.12 * Math.sin(a * 6));
        return K.part(name, 'ear', g, { far, pivAbs: [Math.round(ox), Math.round(oy - 1)] });
      }
      const h = (o.earH || 5) * k + (o.fierce ? 1 : 0), w = 2.4 * k + 0.6, base = hy - hry * 0.55;
      for (let y = 0; y <= h; y++) { const half = w * (y / h); for (let x = Math.floor(ex - half); x <= Math.ceil(ex + half - (o.fierce ? 1 : 0)); x++) K.set(g, x, base - h + y, far ? '2' : x > ex - half + 0.8 && x < ex + half - 1.2 && y > 1.5 ? 'p' : y < h * 0.4 ? '5' : '4'); }
      if (o.notch && !far) K.set(g, ex, base - h + 1, '.');
      if (o.bow && !far) { const bx2 = ex + w * 0.6, by2 = base - h * 0.35; for (const [dx, dy, ch] of [[-1, -1, 'm'], [-1, 0, 'm'], [-1, 1, 'm'], [0, 0, 'M'], [1, -1, 'm'], [1, 0, 'm'], [1, 1, 'm']]) K.set(g, bx2 + dx, by2 + dy, ch); }
      return K.part(name, 'ear', g, { far, pivAbs: [Math.round(ex), Math.round(base)] });
    };
    if (!poodle) add(ear('earF', true, hx + hrx * 0.35));
    else add(ear('earF', true, hx + hrx * 0.7));
    if (!o.tails || o.tails === 1 || o.tails > 1) add(tail('tail', false, 0));
    // cuerpo
    {
      const g = K.grid(), wob = poodle ? (a) => 1 + 0.1 * Math.sin(a * 9) : null;
      K.ell(g, bx, by, bw, bh, (dx, dy, x, y) => {
        if (!poodle && dy > 0.25 && dx < 0.1) return dy > 0.7 ? 'C' : 'c';
        return poodle ? K.curl(dx, dy, x, y) : K.fur(dx, dy);
      }, wob);
      if (o.patch) K.ell(g, bx + bw * 0.25, by - bh * 0.25, bw * 0.3, bh * 0.45, (dx, dy) => (dy > 0.2 ? 'h' : 'H'), (a) => 1 + 0.15 * Math.sin(a * 5));
      if (o.stripes) for (let s = 0; s < 3; s++) { const sx = Math.round(bx + bw * (0.05 + s * 0.28)); for (let y = Math.round(by - bh); y < by - bh * 0.2; y++) K.set(g, sx - (y % 2), y, '1'); }
      if (o.collar) for (let x = Math.round(bx - bw); x < bx - bw + 4 * k; x++) { K.set(g, x, by - bh * 0.5, 'r'); K.set(g, x, by - bh * 0.5 + 1, 'R'); }
      add(K.part('body', 'body', g));
    }
    // melena / gorguera / placas en el lomo
    if (o.mane) {
      const g = K.grid(), mx = hx + hrx * 0.4, my = hy + hry * 0.65;
      K.ell(g, mx, my, 3.4 * k, 3.6 * k, (dx, dy, x, y) => o.mane(dx, dy, x, y), (a) => 1 + 0.18 * Math.sin(a * 7));
      add(K.part('mane', 'fin', g, { wide: true, pivAbs: [Math.round(mx), Math.round(my)], outline: o.maneOutline }));
    }
    if (o.plates) {
      const g = K.grid();
      for (let s = 0; s < o.plates; s++) {
        const px = bx - bw * 0.35 + s * (bw * 1.1 / o.plates), base = by - bh * 0.85, h = (2.5 + (s % 2) * 1.5) * k;
        for (let y = 0; y <= h; y++) { const half = 1.6 * k * (y / h) + 0.5; for (let x = Math.floor(px - half); x <= Math.ceil(px + half); x++) K.set(g, x, base - h + y, y < 1 ? 'g' : x < px ? 'G' : 'd'); }
      }
      add(K.part('plates', 'crest', g, { pivAbs: [Math.round(bx), Math.round(by - bh)] }));
    }
    add(leg('legBN', 'legB', false, rx, lw + (k >= 1.05 ? 1 : 0))); add(leg('legFN', 'legF', false, fx, lw + (k >= 1.05 ? 1 : 0)));
    // cabeza
    {
      const g = K.grid(), wob = poodle ? (a) => 1 + 0.08 * Math.sin(a * 8) : null;
      K.ell(g, hx, hy, hrx, hry, (dx, dy, x, y) => (poodle ? K.curl(dx, dy, x, y) : K.fur(dx, dy, 0.2)), wob);
      // hocico (más largo en el perro) y nariz
      const mx = hx - hrx * (poodle ? 0.78 : 0.62), my = hy + hry * (poodle ? 0.32 : 0.42), mrx = (poodle ? 2.6 : 1.9) * k + 0.4, mry = (poodle ? 1.8 : 1.4) * k + 0.3;
      K.ell(g, mx, my, mrx, mry, (dx, dy) => (dy > 0.45 ? 'C' : 'c'));
      K.set(g, mx - mrx + 0.3, my - mry * 0.4, 'n'); if (poodle || k >= 1) K.set(g, mx - mrx + 1.3, my - mry * 0.4, 'n');
      if (o.fang) K.set(g, mx - mrx * 0.2, my + mry + 0.2, 'W');
      // ojo (de perfil, mirando a la izquierda)
      const ex = Math.round(hx - hrx * 0.32), ey = Math.round(hy - hry * 0.12);
      if (o.fierce) { K.set(g, ex - 1, ey - 1, 'k'); K.set(g, ex, ey - 1, 'k'); K.set(g, ex + 1, ey - 1, 'k'); K.set(g, ex - 1, ey, 'w'); K.set(g, ex, ey, 'e'); K.set(g, ex + 1, ey, 'i'); }
      else {
        K.set(g, ex - 1, ey - 1, 'w'); K.set(g, ex, ey - 1, 'e'); K.set(g, ex - 1, ey, 'e'); K.set(g, ex, ey, 'e'); K.set(g, ex - 1, ey + 1, 'i'); K.set(g, ex, ey + 1, 'i');
        if (o.fem) { K.set(g, ex - 2, ey - 2, 'k'); K.set(g, ex + 1, ey - 2, 'k'); K.set(g, ex + 1, ey - 1, 'k'); }
      }
      if (!o.fierce) K.set(g, ex + 1, ey + 2, 'p');
      if (o.eyePatch) K.ell(g, ex, ey, 2.2, 2.2, (dx, dy, x, y) => (g[y] && 'ewik'.includes(g[y][x]) ? null : 'H'));
      if (o.scar) { K.set(g, ex + 2, ey - 2, 'x'); K.set(g, ex + 3, ey - 1, 'x'); K.set(g, ex + 2, ey + 1, 'x'); }
      if (o.gem) { const gx = Math.round(hx - hrx * 0.05), gy = Math.round(hy - hry * 0.72); K.set(g, gx, gy, 'g'); K.set(g, gx + 1, gy, 'G'); if (k >= 1) { K.set(g, gx, gy - 1, 'G'); K.set(g, gx + 1, gy + 1, 'g'); } }
      add(K.part('head', 'head', g, { pivAbs: [Math.round(hx + hrx * 0.5), Math.round(hy + hry * 0.6)] }));
    }
    // copete del caniche
    if (poodle) {
      const g = K.grid(), tx = hx + hrx * 0.1, ty = hy - hry * 0.95;
      K.ell(g, tx, ty, 2.6 * k + 0.6, 2.2 * k + 0.5, (dx, dy, x, y) => K.curl(dx, dy, x, y), (a) => 1 + 0.15 * Math.sin(a * 7));
      if (o.crestRock) K.ell(g, tx, ty - 1.5 * k, 1.4 * k, 1.8 * k, (dx, dy) => (dy < -0.3 ? 'g' : dx < 0 ? 'G' : 'd'));
      add(K.part('topknot', 'crest', g, { pivAbs: [Math.round(tx), Math.round(ty + 2)] }));
      add(ear('earN', false, hx + hrx * 0.42));
    } else add(ear('earN', false, hx - hrx * 0.15));
    return parts;
  },
};

// ---------- ataques propios ----------
Object.assign(MOVES, {
  chispa_estelar: { name: 'Chispa Estelar', type: 'mente', kind: 'proj', cat: 'esp', pow: 40, cd: 1.0, speed: 170, size: 4, desc: 'Lanza una chispa de luz que brilla como una estrella.' },
  rizo_piedra: { name: 'Rizo Pétreo', type: 'roca', kind: 'melee', cat: 'fis', pow: 40, cd: 0.9, range: 22, desc: 'Golpea con su pelaje rizado, duro como la piedra.' },
  zarpa_nocturna: { name: 'Zarpa Nocturna', type: 'sombra', kind: 'melee', cat: 'fis', pow: 40, cd: 0.9, range: 22, desc: 'Un zarpazo veloz que sale de la oscuridad.' },
  maullido_lunar: { name: 'Maullido Lunar', type: 'mente', kind: 'ring', cat: 'esp', pow: 70, cd: 4.5, radius: 56, status: 'confuse', chance: 0.25, desc: 'Un maullido que hace temblar el aire. Puede confundir.' },
  alud_rizado: { name: 'Alud Rizado', type: 'roca', kind: 'dash', cat: 'fis', pow: 75, cd: 3.5, speed: 260, range: 90, desc: 'Rueda hecho una bola de rizos y piedras.' },
  eclipse_felino: { name: 'Eclipse Felino', type: 'sombra', kind: 'stealth', cat: 'fis', pow: 85, cd: 4, range: 28, desc: 'Desaparece en la sombra y ataca por la espalda.' },
});

// ---------- especies ----------
{
  const LT = L([[1, 'zarpazo'], [1, 'barrera'], [5, 'chispa_estelar'], [9, 'confusion'], [13, 'lenguetazo'], [16, 'teletransporte'], [20, 'psicorrayo'], [25, 'maullido_lunar'], [31, 'onda_mental'], [37, 'psiquico'], [44, 'destello_alba']]);
  const LB = L([[1, 'embestida'], [1, 'coraza'], [5, 'rizo_piedra'], [9, 'pedrisco'], [13, 'acometida'], [16, 'golpe_roca'], [20, 'lanzarrocas'], [25, 'alud_rizado'], [31, 'avalancha'], [37, 'terremoto'], [44, 'carga_brutal']]);
  const LP = L([[1, 'zarpazo'], [1, 'rugido'], [5, 'zarpa_nocturna'], [9, 'lenguetazo'], [13, 'sombra_furtiva'], [16, 'garra_umbria'], [20, 'bola_sombra'], [25, 'velo'], [31, 'eclipse_felino'], [37, 'pesadilla'], [44, 'carga_brutal']]);
  const NEW = [
    { key: 'tofu', name: 'Tofu', types: ['mente'], base: [42, 45, 45, 65, 62], catch: 45, exp: 62, learn: LT, evo: { lv: 16, to: 'mistofa' },
      desc: 'Una gatita blanca y curiosa. Cuando ronronea, a su alrededor brillan chispitas de luz.' },
    { key: 'mistofa', name: 'Mistofa', types: ['mente'], base: [60, 55, 60, 85, 80], catch: 45, exp: 142, learn: LT, evo: { lv: 34, to: 'arcanya' }, stage: 2,
      desc: 'La gema de su frente guarda sus sueños. Dicen que puede ver unos segundos del futuro.' },
    { key: 'arcanya', name: 'Arcanya', types: ['mente'], base: [80, 70, 80, 115, 100], catch: 45, exp: 236, learn: LT, stage: 3,
      desc: 'Una gata señorial de dos colas. Su mirada calma a las ánimas salvajes y confunde a sus rivales.' },
    { key: 'buppa', name: 'Buppa', types: ['roca'], base: [50, 58, 58, 40, 50], catch: 45, exp: 62, learn: LB, evo: { lv: 16, to: 'buclon' },
      desc: 'Un perrito de pelo rizado, blanco y chocolate. Entre sus rizos se le quedan piedritas que usa para defenderse.' },
    { key: 'buclon', name: 'Buclón', types: ['roca'], base: [68, 78, 80, 50, 62], catch: 45, exp: 142, learn: LB, evo: { lv: 34, to: 'monteriz' }, stage: 2,
      desc: 'Sus rizos se endurecieron como piedra pómez. Es leal hasta el final y nunca se rinde.' },
    { key: 'monteriz', name: 'Monteriz', types: ['roca', 'normal'], base: [95, 105, 110, 60, 75], catch: 45, exp: 236, learn: LB, stage: 3,
      desc: 'Un gran perro con placas de roca en el lomo. Rueda montaña abajo para proteger a su entrenador.' },
    { key: 'parker', name: 'Parker', types: ['sombra'], base: [42, 62, 40, 50, 66], catch: 45, exp: 62, learn: LP, evo: { lv: 16, to: 'gatumbra' },
      desc: 'Un gatito gris oscuro de mirada desafiante. Se esconde en las sombras y salta cuando menos te lo esperas.' },
    { key: 'gatumbra', name: 'Gatumbra', types: ['sombra'], base: [58, 84, 55, 62, 86], catch: 45, exp: 142, learn: LP, evo: { lv: 34, to: 'umbrapanter' }, stage: 2,
      desc: 'De su cola salen volutas de sombra. Pelea solo y no le tiene miedo a nada.' },
    { key: 'umbrapanter', name: 'Umbrapánter', types: ['sombra'], base: [78, 115, 70, 80, 112], catch: 45, exp: 236, learn: LP, stage: 3,
      desc: 'Una pantera de la noche. Su melena de sombra se agita como una llama negra cuando caza.' },
  ];
  for (const s of NEW) {
    s.stage = s.stage || 1;
    s.look = s.look || { body: 'quad', c1: '#ffffff', c2: '#ffffff', c3: '#ffffff', size: 1 };
    SPECIES_LIST.push(s); s.id = SPECIES_LIST.length;
    const [hp, atk, def, esp, vel] = s.base; s.stats = { hp, atk, def, esp, vel };
    SPECIES[s.id] = s; SPECIES[s.key] = s; s.prev = null;
  }
  for (const s of NEW) if (s.evo) SPECIES[s.evo.to].prev = s.key;
}

// ---------- dibujos ----------
{
  const K = IniKit;
  const EYE = { e: '#1a1020', w: '#ffffff', k: '#2a1a2a' };
  // Tofu: gatita blanca, ojos violeta, lazo rosa
  const tofuPal = Object.assign({ 1: '#8a80a8', 2: '#b4aed0', 3: '#dcd8ec', 4: '#f2f0f8', 5: '#ffffff', c: '#ffffff', C: '#d8d4e8', n: '#e07aa0', p: '#ffb0cc', i: '#a070e0', m: '#ff70a8', M: '#ffd0e4', g: '#c890ff', G: '#ffffff', d: '#8a5ad0' }, EYE);
  const sparkle = (dx, dy, t) => (t > 0.92 ? 'G' : dy < 0 ? '5' : '4');
  HAND.tofu = { pal: tofuPal, outline: '#4a3a6a', eyeFur: '4', parts: K.quad({ kind: 'cat', k: 0.78, fem: true, bow: true, tailLen: 12, tip: sparkle }) };
  HAND.mistofa = { pal: tofuPal, outline: '#4a3a6a', eyeFur: '4', parts: K.quad({ kind: 'cat', k: 0.95, fem: true, bow: true, gem: true, earH: 6, tailLen: 15, tip: (dx, dy, t) => (t > 0.85 ? (dy < 0 ? 'g' : 'G') : '5') }) };
  HAND.arcanya = { pal: tofuPal, outline: '#3a2a5a', eyeFur: '4', parts: K.quad({ kind: 'cat', k: 1.12, long: 9, fem: true, gem: true, earH: 6.5, tails: 2, tailLen: 16, tip: (dx, dy, t) => (t > 0.8 ? (dy < 0 ? 'g' : 'd') : '5'),
    mane: (dx, dy, x, y) => (hash2(x, y * 3) < 0.25 ? 'C' : dy < 0 ? 'G' : 'c'), maneOutline: '#7a6a9a' }) };
  // Buppa: caniche blanco con orejas, copete y pompón chocolate
  const buppaPal = Object.assign({ 1: '#9a8a7e', 2: '#c8bcb0', 3: '#e6ded4', 4: '#f6f2ec', 5: '#ffffff', c: '#f4e8dc', C: '#c8a888', n: '#3a2014', p: '#ff9a9a', i: '#5a3a24', h: '#6a3e22', H: '#9a6038', r: '#7a7480', R: '#a8a2ac', g: '#c8c0b8', G: '#9a9088', d: '#6a645e', W: '#ffffff' }, EYE);
  HAND.buppa = { pal: buppaPal, outline: '#3a2a20', eyeFur: '4', parts: K.quad({ kind: 'poodle', k: 0.8, eyePatch: false, tailLen: 10 }) };
  HAND.buclon = { pal: buppaPal, outline: '#3a2a20', eyeFur: '4', parts: K.quad({ kind: 'poodle', k: 0.98, patch: true, cuff: true, collar: true, tailLen: 12 }) };
  HAND.monteriz = { pal: buppaPal, outline: '#2a1e18', eyeFur: '4', parts: K.quad({ kind: 'poodle', k: 1.15, long: 9.5, patch: true, cuff: true, plates: 4, crestRock: true, eyePatch: true, tailLen: 13 }) };
  // Parker: gato gris oscuro, ojos amarillos y mirada agresiva
  const parkerPal = Object.assign({ 1: '#1e1e28', 2: '#30303c', 3: '#464654', 4: '#5e5e6c', 5: '#7c7c8a', c: '#8a8a96', C: '#62626e', n: '#14141a', p: '#a06a80', i: '#ffd040', w: '#fff4b0', x: '#9a6a7a', W: '#ffffff', v: '#8a5ad0', V: '#c8a0ff' }, { e: '#1a1020', k: '#0e0e14' });
  const wisp = (dx, dy, t) => (t > 0.9 ? 'V' : 'v');
  HAND.parker = { pal: parkerPal, outline: '#0a0a10', eyeFur: '4', parts: K.quad({ kind: 'cat', k: 0.8, fierce: true, fang: true, tailLen: 12, stripes: true }) };
  HAND.gatumbra = { pal: parkerPal, outline: '#0a0a10', eyeFur: '4', parts: K.quad({ kind: 'cat', k: 0.98, fierce: true, fang: true, notch: true, scar: true, earH: 6, tailLen: 15, stripes: true, tip: wisp, tipK: 0.35 }) };
  HAND.umbrapanter = { pal: parkerPal, outline: '#06060a', eyeFur: '4', parts: K.quad({ kind: 'cat', k: 1.15, long: 10, fierce: true, fang: true, notch: true, scar: true, earH: 5.5, tailLen: 17, tailTh: 1.5, stripes: true, tip: wisp, tipK: 0.45,
    mane: (dx, dy, x, y) => (hash2(x * 5, y) < 0.3 ? 'V' : dy < 0.2 ? 'v' : '1'), maneOutline: '#2a1a40' }) };
}

// ---------- Constelaciones ----------
Object.assign(BOARDS, {
  tofu: { name: 'Sueño Estelar', rows: [
    '. M-S . S-M . .',
    '  |   |   |    ',
    '. p . K . c . .',
    '  |   |   |    ',
    'H-S-V-@-V-S-H .',
    '  |   |   |    ',
    '. o . x . v . .',
    '  |   |   |    ',
    '. D-H-L-H-D . .',
    '      |        ',
    '. . . M . . . .'],
    moves: ['bola_sombra', 'rafaga', 'meditar'],
    key: { name: 'Mirada Estelar', desc: 'Sus ataques de mente confunden un 20% de las veces, y cada esquiva perfecta le cura un 5% de PS.', fx: { status: { type: 'mente', s: 'confuse', p: 0.2 }, dodgeHeal: 0.05 } } },
  buppa: { name: 'Corazón de Piedra', rows: [
    '. M-A . A-M . .',
    '  |   |   |    ',
    '. f . K . d . .',
    '  |   |   |    ',
    'D-H-D-@-D-H-D .',
    '  |   |   |    ',
    '. u . r . o . .',
    '  |   |   |    ',
    '. A-H-L-H-A . .',
    '      |        ',
    '. . . M . . . .'],
    moves: ['garra_umbria', 'colmillo_igneo', 'puno_voltio'],
    key: { name: 'Guardián Leal', desc: 'Empieza cada combate con un escudo del 15% de sus PS, y sus golpes cuerpo a cuerpo aturden un 10% de las veces.', fx: { shield: 0.15, stun: 0.1 } } },
  parker: { name: 'Caza Nocturna', rows: [
    '. M-V . V-M . .',
    '  |   |   |    ',
    '. x . K . c . .',
    '  |   |   |    ',
    'A-V-A-@-A-V-A .',
    '  |   |   |    ',
    '. f . u . o . .',
    '  |   |   |    ',
    '. H-D-L-D-H . .',
    '      |        ',
    '. . . M . . . .'],
    moves: ['colmillo_igneo', 'psicorrayo', 'lanzarrocas'],
    key: { name: 'Depredador', desc: 'De noche hace +20% de daño, y se mueve un 12% más rápido.', fx: { night: 0.2, swift: true } } },
});

// ---------- quimeras de los nuevos iniciales ----------
{
  const NEWC = [
    { key: 'aurelina', name: 'Aurelina', types: ['mente', 'viento'], base: [85, 70, 82, 115, 110], learn: L([[1, 'chispa_estelar'], [1, 'rafaga'], [1, 'barrera'], [30, 'maullido_lunar'], [36, 'tornado'], [44, 'psiquico'], [50, 'destello_alba']]),
      desc: 'Una gata alada que nació de una gema y una nube. Flota sobre el viento sin hacer ruido.', a: 'tofu', b: 'brisin', lv: 28, item: 'pluma_estelar', time: 'night', hint: 'La gatita y la nube, bajo las estrellas, aprenden a volar juntas.', cat: ['Pluma Estelar', '#e0c8ff'] },
    { key: 'florizo', name: 'Florizo', types: ['roca', 'planta'], base: [100, 100, 105, 75, 70], learn: L([[1, 'rizo_piedra'], [1, 'latigo'], [1, 'coraza'], [30, 'alud_rizado'], [36, 'tormenta_petalo'], [44, 'terremoto'], [50, 'rayo_solar']]),
      desc: 'Entre sus rizos de piedra crecen flores y musgo. Por donde pasa, el suelo reverdece.', a: 'buppa', b: 'semillin', lv: 28, item: 'semilla_rizo', time: 'day', hint: 'El rizo de piedra y el brote, a plena luz, echan raíces juntos.', cat: ['Semilla Rizada', '#a0d870'] },
    { key: 'trueno_umbrio', name: 'Truenumbra', types: ['sombra', 'electrico'], base: [80, 118, 72, 90, 118], learn: L([[1, 'zarpa_nocturna'], [1, 'chispa'], [1, 'velo'], [30, 'eclipse_felino'], [36, 'rayo'], [44, 'bola_sombra'], [50, 'trueno']]),
      desc: 'Una pantera de tormenta. En la oscuridad solo se ven los relámpagos que corren por su lomo.', a: 'parker', b: 'voltin', lv: 30, item: 'garra_tormenta', hint: 'La sombra y la chispa, golpeadas juntas, se vuelven tormenta negra.', cat: ['Garra Tormenta', '#ffe060'] },
  ];
  for (const s of NEWC) {
    if (!MOVES.trueno && s.learn.some((x) => x.m === 'trueno')) s.learn = s.learn.filter((x) => x.m !== 'trueno');
    Object.assign(s, { catch: 0, exp: 250, chimera: true, stage: 3, prev: null, look: { body: 'quad', c1: '#ffffff', c2: '#ffffff', c3: '#ffffff', size: 1 } });
    SPECIES_LIST.push(s); s.id = SPECIES_LIST.length;
    const [hp, atk, def, esp, vel] = s.base; s.stats = { hp, atk, def, esp, vel };
    SPECIES[s.id] = s; SPECIES[s.key] = s; CHIMERAS.push(s);
    FUSIONS.push({ to: s.key, a: s.a, b: s.b, lv: s.lv, item: s.item, time: s.time, hint: s.hint });
    ITEMS[s.item] = { name: s.cat[0], price: 0, desc: `Catalizador de fusión. Permite crear a ${s.name} en el Altar de Quimeras de Ciudad Roca.`, icon: 'core', color: s.cat[1] };
    CATALYSTS[s.item] = s.cat;
  }
  const K = IniKit;
  HAND.aurelina = { pal: Object.assign({}, HAND.mistofa.pal, { 1: '#7a90b8', 2: '#a8c0e0', 3: '#d4e4f8', 4: '#eef4ff', u: '#ffffff', U: '#c8dcf8' }), outline: '#3a4a7a', eyeFur: '4', flyer: true,
    parts: K.quad({ kind: 'cat', k: 1.05, fem: true, gem: true, earH: 6, tailLen: 15, tip: (dx, dy, t) => (t > 0.85 ? 'g' : '5'),
      mane: (dx, dy) => (dy < -0.2 ? 'u' : 'U'), maneOutline: '#6a8ab8' }) };
  {
    const wing = ['.......uu', '.....uuU.', '...uuUU..', '.uuUUU...', 'uUUU.....', 'UU.......'];
    HAND.aurelina.parts.splice(0, 0, { name: 'wingF', role: 'wing', far: true, at: [22, 14], piv: [0, 5], outline: '#6a8ab8', rows: wing.map((r) => r.replace(/u/g, 'U')) });
    HAND.aurelina.parts.splice(HAND.aurelina.parts.length - 2, 0, { name: 'wingN', role: 'wing', at: [20, 16], piv: [0, 5], outline: '#6a8ab8', rows: wing });
  }
  HAND.florizo = { pal: Object.assign({}, HAND.monteriz.pal, { 1: '#4a6a3a', 2: '#6a8a4a', 3: '#8ab060', 4: '#b0d080', 5: '#d8f0a8', g: '#ff7aa0', G: '#ffd0e0', d: '#d04870' }), outline: '#1e2a14', eyeFur: '4',
    parts: K.quad({ kind: 'poodle', k: 1.1, long: 9.5, patch: true, plates: 4, crestRock: true, tailLen: 13 }) };
  HAND.trueno_umbrio = { pal: Object.assign({}, HAND.umbrapanter.pal, { v: '#f0c020', V: '#fff4a0', i: '#60e0ff', w: '#e0ffff' }), outline: '#06060a', eyeFur: '4',
    parts: K.quad({ kind: 'cat', k: 1.12, long: 10, fierce: true, fang: true, notch: true, earH: 5.5, tailLen: 17, tailTh: 1.4, stripes: true, tip: (dx, dy, t) => (t > 0.85 ? 'V' : 'v'), tipK: 0.5,
      mane: (dx, dy, x, y) => (hash2(x * 5, y) < 0.35 ? 'V' : dy < 0.2 ? 'v' : '1'), maneOutline: '#3a2a08' }) };
  // Constelaciones de las quimeras nuevas (reusa la forma de otras)
  BOARDS.aurelina = Object.assign({}, BOARDS.celestia, { name: 'Vuelo Estelar', moves: ['bola_sombra', 'burbuja', 'lanzarrocas'] });
  BOARDS.florizo = Object.assign({}, BOARDS.umbrarbol, { name: 'Jardín de Piedra', moves: ['garra_umbria', 'chispa', 'confusion'] });
  BOARDS.trueno_umbrio = Object.assign({}, BOARDS.tempestron, { name: 'Tormenta Negra', moves: ['colmillo_igneo', 'psicorrayo', 'lanzarrocas'] });
}

// ---------- los nuevos iniciales en el laboratorio ----------
{
  if (MAPS.lab && MAPS.lab.starters) MAPS.lab.starters = [[5, 5, 'tofu'], [6, 5, 'buppa'], [7, 5, 'parker']];
  for (const k of Object.keys(RIVAL_PICK)) delete RIVAL_PICK[k];
  Object.assign(RIVAL_PICK, { tofu: 'parker', parker: 'buppa', buppa: 'tofu' });
  Object.assign(STAGE2, { tofu: 'mistofa', buppa: 'buclon', parker: 'gatumbra' });
  Object.assign(STAGE3, { tofu: 'arcanya', buppa: 'monteriz', parker: 'umbrapanter' });
}

// ---------- los antiguos iniciales, ahora salvajes ----------
{
  const wild = (map, sp, min, max, w) => { const m = MAPS[map]; if (m && m.encounters) m.encounters.list.push({ sp, min, max, w }); };
  wild('bosque', 'semillin', 7, 9, 6);     // entre los árboles del bosque
  wild('ruta3', 'ignito', 12, 15, 6);      // en la ruta rocosa hacia Ciudad Roca
  wild('puerto_marea', 'burbujo', 18, 21, 8); // en la costa
}
