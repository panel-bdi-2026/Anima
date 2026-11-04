'use strict';
// ============================================================
//  SPRITES DIBUJADOS PÍXEL A PÍXEL (con esqueleto por piezas)
//  Cada especie es un conjunto de piezas pequeñas (patas, cuerpo,
//  cabeza, orejas, cola...) dibujadas carácter a carácter. Cada
//  pieza tiene su punto de giro y un papel en la animación.
//  Lienzo de 40x40, mirando a la IZQUIERDA, pies en la fila 37.
//  El contorno se añade solo alrededor de cada pieza.
//  Los ojos (e/w/i) se separan solos para poder parpadear.
// ============================================================
const HAND = {};

// ---------- IGNITO: zorrito de fuego, de perfil ----------
HAND.ignito = {
  pal: {
    1: '#8a2a1c', 2: '#c04018', 3: '#e86a24', 4: '#ff9438', 5: '#ffc868',
    c: '#fbe6bc', C: '#e2b07a', e: '#1a1020', w: '#ffffff', i: '#6a2e14', n: '#2a0e10', p: '#ff9a8a',
    r: '#f04818', f: '#ffc838', F: '#fff4c4', R: '#a82010',
  },
  outline: '#3a1418',
  eyeFur: '4',
  // orden de dibujo: de atrás hacia delante
  parts: [
    { name: 'legBF', role: 'legB', far: true, at: [23, 31], piv: [1, 0], rows: ['21', '21', '21', '21', '11', '11', '221'] },
    { name: 'legFF', role: 'legF', far: true, at: [14, 31], piv: [1, 0], rows: ['21', '21', '21', '21', '11', '11', '221'] },
    { name: 'earF', role: 'ear', far: true, at: [11, 15], piv: [1, 3], rows: ['2..', '22.', '2p2', '222'] },
    { name: 'tail', role: 'tail', at: [22, 13], piv: [4, 13], outline: '#a82010', rows: [
      '...r.....', '..rr...r.', '..rfr..rr', '.rffr.rfr', '.rfFfrrfr', 'rfFFffFfr', 'rfFFFFFfr', 'rffFFFffr', '.rffFffr.', '.rrfffrr.', '..rrrrr..', '...334...', '...33....'] },
    { name: 'body', role: 'body', at: [10, 25], rows: [
      '....455544444..', '..4455544444433', '.c444444444333.', 'cc4444444333322', 'cc3333333332222', '.C3332222222221', '..2221111111...'] },
    { name: 'legBN', role: 'legB', at: [21, 31], piv: [1, 0], rows: ['43', '43', '43', '32', '32', '32', '443'] },
    { name: 'legFN', role: 'legF', at: [12, 31], piv: [1, 0], rows: ['43', '43', '43', '32', '32', '32', '443'] },
    { name: 'head', role: 'head', at: [3, 18], piv: [10, 8], rows: [
      '......5555...', '....455554443', '...4554444433', '...4we444433.', '...4ee444332.', '.cc4ii4p4332.', 'ncccc443332..', '.cccC33222...', '...CC221.....'] },
    { name: 'earN', role: 'ear', at: [8, 14], piv: [1, 4], rows: ['4..', '45.', '453', '4p3', '4p3'] },
  ],
};

const HandSprites = {
  cache: {},
  has(sp) { return !!(HAND[sp] && HAND[sp].parts); },
  // dibuja una pieza en su propio lienzo (con contorno) y separa sus ojos
  partCanvas(H0, p) {
    const w = Math.max(...p.rows.map((r) => r.length)), h = p.rows.length;
    const W2 = w + 2, H2 = h + 2;
    const grid = [];
    for (let y = 0; y < H2; y++) grid.push(new Array(W2).fill('.'));
    p.rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') grid[j + 1][i + 1] = row[i]; });
    const isEye = (ch) => 'ewi'.includes(ch);
    const [c, x] = U.makeCanvas(W2, H2), [ec, ex] = U.makeCanvas(W2, H2);
    let hasEyes = false; const eyeCells = [];
    const filled = (i, j) => j >= 0 && i >= 0 && j < H2 && i < W2 && grid[j][i] !== '.';
    for (let j = 0; j < H2; j++) for (let i = 0; i < W2; i++) {
      const ch = grid[j][i];
      if (ch === '.') {
        if (filled(i - 1, j) || filled(i + 1, j) || filled(i, j - 1) || filled(i, j + 1)) { x.fillStyle = p.outline || H0.outline; x.fillRect(i, j, 1, 1); }
        continue;
      }
      if (isEye(ch)) { hasEyes = true; eyeCells.push([i, j]); ex.fillStyle = H0.pal[ch]; ex.fillRect(i, j, 1, 1); x.fillStyle = H0.pal[H0.eyeFur || '3']; }
      else x.fillStyle = H0.pal[ch] || '#ff00ff';
      x.fillRect(i, j, 1, 1);
    }
    // ojos cerrados (parpadeo) y apretados (daño)
    let closed = null, hurt = null;
    if (hasEyes) {
      const bot = {}, top = {};
      for (const [i, j] of eyeCells) { bot[i] = Math.max(bot[i] === undefined ? -1 : bot[i], j); top[i] = Math.min(top[i] === undefined ? 99 : top[i], j); }
      const cols = Object.keys(bot).map(Number).sort((a, b) => a - b);
      [closed] = U.makeCanvas(W2, H2); [hurt] = U.makeCanvas(W2, H2);
      const cx = closed.getContext('2d'), hx = hurt.getContext('2d');
      cx.fillStyle = H0.outline; hx.fillStyle = H0.outline;
      cols.forEach((i, k) => { cx.fillRect(i, bot[i], 1, 1); const mid = Math.round((top[i] + bot[i]) / 2); hx.fillRect(i, mid + (k === 0 || k === cols.length - 1 ? -1 : 0), 1, 1); });
      if (cols.length) cx.fillRect(cols[0] - 1, bot[cols[0]] - 1, 1, 1);
    }
    return { canvas: c, eyes: hasEyes ? ec : null, closed, hurt, ox: p.at[0] - 1, oy: p.at[1] - 1, piv: p.piv ? [p.piv[0] + 1, p.piv[1] + 1] : [W2 / 2, H2 / 2] };
  },
  // variante variocolor: mismo dibujo con la paleta girada de tono (los ojos no cambian)
  shinyDef(sp) {
    const H0 = HAND[sp], sh = (c) => U.shade(c, 0.04, 0.42, 0.05), pal = {};
    for (const [ch, c] of Object.entries(H0.pal)) pal[ch] = 'ewi'.includes(ch) ? c : sh(c);
    return Object.assign({}, H0, { pal, outline: sh(H0.outline), parts: H0.parts.map((p) => (p.outline ? Object.assign({}, p, { outline: sh(p.outline) }) : p)) });
  },
  // las ánimas miran a la izquierda, pero muchas patas tenían el pie apuntando hacia atrás (a la derecha):
  // las filas del pie que sobresalen por la derecha se reflejan sobre el eje de la pata
  fixFeet(p) {
    if (!/^leg/.test(p.role) || p.rows.length < 3) return p;
    const span = (r) => { let a = -1, b = -1; for (let i = 0; i < r.length; i++) if (r[i] !== '.') { if (a < 0) a = i; b = i; } return [a, b]; };
    const [L0, R0] = span(p.rows[0]);
    if (L0 < 0) return p;
    let j = p.rows.length - 1, k = 0;
    const feet = [];
    for (; j > 0; j--) { const [a, b] = span(p.rows[j]); if (a < 0 || b <= R0 || a < L0) break; feet.push(j); k = Math.max(k, b - R0); }
    if (!feet.length) return p;
    const rows = p.rows.map((r, n) => {
      if (!feet.includes(n)) return '.'.repeat(k) + r;
      const out = new Array(r.length + k).fill('.');
      for (let i = 0; i < r.length; i++) if (r[i] !== '.') out[L0 + R0 - i + k] = r[i];
      return out.join('').replace(/\.+$/, '');
    });
    return Object.assign({}, p, { rows, at: [p.at[0] - k, p.at[1]], piv: p.piv ? [p.piv[0] + k, p.piv[1]] : p.piv });
  },
  // ---------- vistas de frente y de espaldas ----------
  // Se construyen a partir del perfil: la mitad delantera de la cabeza (y del cuerpo) se refleja sobre sí
  // misma, así el hocico y el pecho quedan en el centro y aparecen los dos ojos. De espaldas se usa la
  // mitad trasera, sin ojos. Las piezas pares (patas, brazos, alas, orejas) se duplican en espejo.
  turnDef(H0, view) {
    const CX = 20, front = view === 'front', fur = H0.eyeFur || '3';
    const rev = (r) => r.split('').reverse().join('');
    const W0 = (p) => Math.max(...p.rows.map((r) => r.length));
    const padded = (p) => { const w = W0(p); return p.rows.map((r) => r + '.'.repeat(w - r.length)); };
    const noEyes = (r) => r.replace(/[ewi]/g, fur);
    const hasEyes = (p) => p.rows.some((r) => /[ewi]/.test(r));
    const src = H0.parts.map((p) => this.fixFeet(p));
    const near = (role) => src.filter((p) => p.role === role && !p.far);
    const out = [];
    const add = (p, rows, x, extra = {}) => out.push(Object.assign({}, p, { rows, at: [Math.round(x), p.at[1]] }, extra));
    const mirPiv = (p) => (p.piv ? [W0(p) - 1 - p.piv[0], p.piv[1]] : p.piv);
    // cabeza y cuerpo: mitad delantera reflejada (frente) o mitad trasera reflejada (espalda)
    // silueta del cuerpo: la de la mitad reflejada al revés (redondeada hacia fuera); colores y cara: los del giro normal
    const merge = (A, Bm) => A.split('').map((ch, i) => (Bm[i] === '.' || !Bm[i] ? '.' : ch !== '.' ? ch : Bm[i])).join('');
    const turnBlock = (p, cutK, fill) => {
      const w = W0(p), rows = padded(p);
      if (front) {
        const c = Math.max(2, Math.ceil(w * cutK));
        return { rows: rows.map((r) => { const L = r.slice(0, c), A = rev(L) + L; return fill ? merge(A, noEyes(L + rev(L))) : A; }), half: c, map: (col) => col };
      }
      const st = Math.min(w - 2, Math.floor(w * (1 - cutK))), rw = w - st;
      return { rows: rows.map((r) => { const R = noEyes(r.slice(st)), A = R + rev(R); return fill ? merge(A, rev(R) + R) : A; }), half: rw, map: (col) => col - st };
    };
    const head = src.find((p) => p.role === 'head' && !p.far), body = src.find((p) => p.role === 'body');
    const B = body && turnBlock(body, hasEyes(body) ? 0.5 : 0.42, true);
    const Hd = head && turnBlock(head, 0.55);
    const hw = B ? B.half : 6;
    const anchor = head ? { p: head, T: Hd } : { p: body, T: B };
    const pairs = (list, place, extra = {}) => {
      for (const p of list) {
        const w = W0(p), rows = padded(p), [xl, xr] = place(p, w);
        add(p, rows.map(rev), xl, Object.assign({ mir: true, piv: mirPiv(p) }, extra)); add(p, rows, xr, extra);
      }
    };
    const bodyPart = () => { if (body) add(body, B.rows, CX - B.half, { piv: undefined }); };
    const headPart = () => { if (head) add(head, Hd.rows, CX - Hd.half, { piv: [Hd.half, head.piv ? head.piv[1] : 4] }); };
    const ears = () => {
      if (!anchor.p) return;
      const A = anchor.p, T = anchor.T, ax = CX - T.half;
      pairs(near('ear'), (p, w) => {
        const c = U.clamp(T.map(p.at[0] - A.at[0]), 0, Math.max(0, T.half - w));
        return front ? [ax + T.half - c - w, ax + T.half + c] : [ax + c, ax + 2 * T.half - c - w];
      });
    };
    const crests = () => { for (const p of near('crest')) { const w = W0(p), rows = padded(p); add(p, front ? rows : rows.map(noEyes), CX - w / 2); } };
    const legRole = H0.body === 'biped' || H0.body === 'bird' || !src.some((p) => p.role === 'legF') ? 'leg' : front ? 'legF' : 'legB';
    let legs = near(legRole); if (!legs.length) legs = near('legF').concat(near('legB'), near('leg'));
    const gap = Math.max(2, Math.round(hw * 0.5));
    const legsPart = () => pairs(legs.slice(0, 1), (p, w) => [CX - gap - Math.floor(w / 2), CX + gap - Math.ceil(w / 2)]);
    // las aletas anchas (crines, nubes sobre el lomo) no son pares: van centradas y reflejadas como el cuerpo
    const wide = (p) => p.role === 'fin' && W0(p) >= 10;
    const side = (role, inset) => pairs(near(role).filter((p) => !wide(p)), (p, w) => [CX - hw - w + inset, CX + hw - inset]);
    const wideFins = () => { for (const p of near('fin').filter(wide)) { const T = turnBlock(p, 0.4, true); add(p, T.rows, CX - T.half, { piv: [T.half, p.piv ? p.piv[1] : 0] }); } };
    const tail = () => { for (const p of near('tail')) add(p, padded(p), CX - W0(p) / 2); };
    const known = new Set(['head', 'body', 'ear', 'crest', 'leg', 'legF', 'legB', 'arm', 'wing', 'fin', 'tail']);
    const rest = () => { for (const p of src) if (!p.far && !known.has(p.role)) add(p, padded(p), CX - W0(p) / 2); };
    if (front) { tail(); side('wing', 3); side('fin', 2); wideFins(); bodyPart(); rest(); legsPart(); side('arm', 2); headPart(); ears(); crests(); }
    else { headPart(); ears(); crests(); legsPart(); bodyPart(); rest(); side('arm', 2); side('fin', 2); wideFins(); side('wing', 3); tail(); }
    return Object.assign({}, H0, { parts: out });
  },
  rig(sp, shiny, view = 'side') {
    const k = sp + ':rig' + (shiny ? ':s' : '') + (view !== 'side' ? ':' + view : '');
    if (this.cache[k]) return this.cache[k];
    let H0 = shiny ? this.shinyDef(sp) : HAND[sp];
    if (view !== 'side') H0 = this.turnDef(H0, view);
    const parts = H0.parts.map((p) => Object.assign({ name: p.name, role: p.role, far: !!p.far, onHead: !!p.onHead, mir: !!p.mir }, this.partCanvas(H0, view === 'side' ? this.fixFeet(p) : p)));
    return (this.cache[k] = { hand: true, parts, feet: [20, 37], flyer: !!H0.flyer, body: H0.body || 'quad', view });
  },
  // imagen fija (pose de reposo), escalada al tamaño pedido
  full(sp, S, shiny) {
    const k = sp + ':full:' + S + (shiny ? ':s' : '');
    if (this.cache[k]) return this.cache[k];
    const [c, x] = U.makeCanvas(40, 40);
    for (const p of this.rig(sp, shiny).parts) { x.drawImage(p.canvas, p.ox, p.oy); if (p.eyes) x.drawImage(p.eyes, p.ox, p.oy); }
    if (S === 40) return (this.cache[k] = c);
    if (S < 20 || S > 40) {
      // icono o vista grande: se recorta la figura y se encaja en el cuadro (en grande, a escala entera para no deformar los píxeles)
      const d = x.getImageData(0, 0, 40, 40).data; let x0 = 40, y0 = 40, x1 = -1, y1 = -1;
      for (let j = 0; j < 40; j++) for (let i = 0; i < 40; i++) if (d[(j * 40 + i) * 4 + 3]) { x0 = Math.min(x0, i); y0 = Math.min(y0, j); x1 = Math.max(x1, i); y1 = Math.max(y1, j); }
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1, f = S < 20 ? Math.min(1, S / Math.max(bw, bh)) : Math.max(1, Math.floor((S * 0.92) / Math.max(bw, bh))), dw = Math.max(1, Math.round(bw * f)), dh = Math.max(1, Math.round(bh * f));
      const [c3, x3] = U.makeCanvas(S, S); x3.imageSmoothingEnabled = false; x3.drawImage(c, x0, y0, bw, bh, Math.floor((S - dw) / 2), S < 20 ? S - dh : Math.floor((S - dh) * 0.75), dw, dh);
      return (this.cache[k] = c3);
    }
    const [c2, x2] = U.makeCanvas(S, S); x2.imageSmoothingEnabled = false; x2.drawImage(c, 0, 0, 40, 40, 0, 0, S, S);
    return (this.cache[k] = c2);
  },
};

// ---------- animación por piezas ----------
CreatureAnim.composeHand = function (e, o) {
  const rig = o.rig, P = o.P, A = this.state(e), S = o.S, B = S * 2, sc = S / 40;
  const buf = e.animBuf && e.animBuf.width === B ? e.animBuf : (e.animBuf = U.makeCanvas(B, B)[0]);
  const x = buf.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, B, B); x.imageSmoothingEnabled = false;
  const dt = o.dt || 0, t = o.t, sp = o.speed || 0;
  // muelles para el movimiento secundario (cola y orejas)
  const spring = (key, target, k = 60, damp = 9) => {
    const s = A[key] || (A[key] = { x: target, v: 0 });
    if (dt > 0) { s.v += ((target - s.x) * k - s.v * damp) * dt; s.x += s.v * dt; } else s.x = target;
    return s.x;
  };
  const walking = sp > 12 && o.faintT === undefined, ph = t * (9 + sp / 10);
  const legAmp = walking ? 0.55 : 0.05;
  const tuck = e.hopZ || (o.act && !o.act.fired && (o.act.m.kind === 'ring' || o.act.m.kind === 'area')) ? 1 : 0;
  const hurt = P.eyes === 'hurt';
  // cola: vaivén constante + empuje según el movimiento
  let tailT = P.trot * 1.4; // en reposo, la cola en tres posiciones fijas (ver pose)
  if (walking) tailT += Math.sin(ph * 0.5) * 0.35 - 0.15;
  if (o.act && !o.act.fired) tailT -= 0.45;
  if (hurt) tailT += 0.5;
  const tailA = spring('sTail', tailT, 55, 7);
  // orejas: tic ocasional, hacia atrás al recibir daño, erguidas al atacar
  A.earTic = (A.earTic || 0) - dt; if (A.earTic < -2.5 - Math.random() * 3) A.earTic = 0.18;
  let earT = A.earTic > 0 ? -0.35 : 0; if (hurt) earT = 0.7; if (o.act && !o.act.fired) earT = -0.2; if (walking) earT += Math.sin(ph) * 0.08;
  const earA = spring('sEar', earT, 90, 10);
  // transformación raíz (alrededor de los pies)
  const fx = S / 2 + rig.feet[0] * sc, fy = S / 2 + rig.feet[1] * sc;
  x.translate(Math.round(fx + P.rx), Math.round(fy + P.ry + P.hover));
  x.rotate(P.rot); x.scale(P.sx * sc, P.sy * sc);
  x.translate(-rig.feet[0], -rig.feet[1]);
  const draw = (p, img, ang = 0, dx = 0, dy = 0) => {
    if (!img) return;
    if (!ang) { x.drawImage(img, Math.round(p.ox + dx), Math.round(p.oy + dy)); return; }
    x.save(); x.translate(p.ox + p.piv[0] + dx, p.oy + p.piv[1] + dy); x.rotate(ang); x.drawImage(img, -p.piv[0], -p.piv[1]); x.restore();
  };
  const eyesImg = (p) => (P.eyes === 'closed' ? p.closed : hurt ? p.hurt : p.eyes);
  const head = rig.parts.find((q) => q.role === 'head');
  for (const p of rig.parts) {
    let ang = 0, dx = 0, dy = 0;
    if (rig.view && rig.view !== 'side' && /^leg/.test(p.role)) {
      // de frente o de espaldas las patas no giran: suben y bajan por turnos
      const phase = p.mir ? Math.PI : 0;
      if (walking) dy = Math.max(0, Math.sin(ph + phase)) * -1.6;
      if (tuck) dy -= 1;
    } else if (p.role === 'legF' || p.role === 'legB') {
      const phase = (p.role === 'legF') === !p.far ? 0 : Math.PI;
      ang = Math.sin(ph + phase) * legAmp;
      // en reposo las patas no se mueven: girar unos grados hace bailar sus píxeles
      if (tuck) ang += p.role === 'legF' ? -0.6 : 0.6;
      if (hurt) ang += p.role === 'legF' ? 0.25 : -0.25;
      if (walking) dy = Math.max(0, Math.sin(ph + phase)) * -1.2;
    } else if (p.role === 'leg') {
      // patas de bípedo: alternan
      const phase = p.far ? Math.PI : 0;
      ang = walking ? Math.sin(ph + phase) * 0.5 : 0;
      if (tuck) ang += p.far ? 0.5 : -0.5;
      if (walking) dy = Math.max(0, Math.sin(ph + phase)) * -1.5;
    } else if (p.role === 'arm') {
      const phase = p.far ? 0 : Math.PI;
      ang = walking ? Math.sin(ph + phase) * 0.6 : P.trot * 0.5;
      if (o.act && !o.act.fired && !p.far) ang += 0.9;
      if (A.atk && (A.atk.kind === 'melee' || A.atk.kind === 'stealth') && !p.far) ang -= 1.3 * (1 - A.atk.t / A.atk.dur);
      if (hurt) ang += 0.5;
      if (tuck) ang -= 0.7;
    } else if (p.role === 'wing') {
      const phase = p.far ? 0.35 : 0;
      if (rig.flyer) ang = Math.sin(t * (walking ? 22 : 13) + phase) * 0.55;
      else ang = walking ? Math.sin(ph * 2 + phase) * 0.18 : 0;
      if (o.act && !o.act.fired) ang -= 0.6;
      if (hurt) ang += 0.45;
      if (p.far) ang *= 0.9;
    } else if (p.role === 'fin') ang = [0, 0.18, 0, -0.18][Math.floor(t * 4 + (p.far ? 2 : 0)) % 4] + (walking ? Math.sin(ph) * 0.2 : 0);
    else if (p.role === 'tail') ang = rig.view && rig.view !== 'side' ? tailA * 0.5 : tailA;
    else if (p.role === 'head') { ang = P.hrot; dx = P.hx; dy = P.hy; }
    else if (p.role === 'body') {
      // respiración: el cuerpo se ensancha un poco desde abajo
      x.save(); const by = p.oy + p.canvas.height; x.translate(0, by); x.scale(1, 1 + (P.sy - 1) * 0.6); x.translate(0, -by);
      draw(p, p.canvas); if (p.eyes) draw(p, eyesImg(p)); x.restore(); continue;
    } else if (p.role === 'ear' || p.role === 'crest' || p.onHead) {
      // las orejas giran con la cabeza y además por su cuenta
      x.save();
      if (head && P.hrot) { const hx = head.ox + head.piv[0] + P.hx, hy = head.oy + head.piv[1] + P.hy; x.translate(hx, hy); x.rotate(P.hrot); x.translate(-hx, -hy); }
      const ea = (p.role === 'ear' ? earA * (p.far ? 0.8 : 1) : p.role === 'crest' ? earA * 0.9 : 0) * (p.mir ? -1 : 1);
      draw(p, p.canvas, ea, P.hx, P.hy); if (p.eyes) draw(p, eyesImg(p), ea, P.hx, P.hy); x.restore(); continue;
    }
    if (p.mir) ang = -ang;
    draw(p, p.canvas, ang, dx, dy);
    if (p.eyes) draw(p, eyesImg(p), ang, dx, dy);
  }
  x.setTransform(1, 0, 0, 1, 0, 0);
  return buf;
};
{
  const _compose = CreatureAnim.compose;
  CreatureAnim.compose = function (e, o) { return o.rig && o.rig.hand ? this.composeHand(e, o) : _compose.call(this, e, o); };
  const _rig = CreatureAnim.rig;
  CreatureAnim.rig = function (sp, S, shiny) { return HandSprites.has(sp) ? HandSprites.rig(sp, shiny, this.view || 'side') : _rig.call(this, sp, S, shiny); };
  // o.view = 'front' | 'back' | 'side' (de frente y de espaldas no se voltea)
  const _draw = CreatureAnim.draw;
  CreatureAnim.draw = function (ctx, e, o) {
    const v = o.view && o.view !== 'side' && HandSprites.has(o.sp) ? o.view : 'side';
    this.view = v; if (v !== 'side') o.flip = false;
    try { return _draw.call(this, ctx, e, o); } finally { this.view = 'side'; }
  };
  // vista según hacia dónde mira en el mapa (abajo = hacia la cámara), con histéresis para que no parpadee
  CreatureAnim.viewOf = function (e, ang, moving = true) {
    const s = Math.sin(ang), c = Math.abs(Math.cos(ang));
    let v = e.view3 || 'side';
    if (v === 'side') { if (moving && s > 0.82) v = 'front'; else if (moving && s < -0.82) v = 'back'; }
    else if (c > 0.72 || (v === 'front' && s < 0.3) || (v === 'back' && s > -0.3)) v = 'side';
    return (e.view3 = v);
  };
  const _get = CreatureGfx.get;
  CreatureGfx.get = function (sp, S, shiny) { return HandSprites.has(sp) ? HandSprites.full(sp, S, shiny) : _get.call(this, sp, S, shiny); };
}
