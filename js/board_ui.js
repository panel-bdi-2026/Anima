'use strict';
// ============================================================
//  PANTALLA DE LA CONSTELACIÓN (pantalla ancha)
//  - Izquierda: retrato, Esencia, Llaves y resumen de bonus
//  - Centro: el tablero sobre una nebulosa del color del ánima
//  - Abajo: detalle del nodo seleccionado
// ============================================================
const NODE_ICON = {
  move: ['o.o.o', '.ooo.', 'ooooo', '.ooo.', 'o.o.o'],
  lock: ['.ooo.', 'o...o', 'ooooo', 'oo.oo', 'ooooo'],
  start: ['.ooo.', 'o...o', 'o.o.o', 'o...o', '.ooo.'],
};
function drawMini(ctx, rows, x, y, col) {
  ctx.fillStyle = col;
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === 'o') ctx.fillRect(x + i, y + j, 1, 1); });
}
// estrella de 4 puntas (nodo clave)
function drawKeyStar(ctx, x, y, r, col, core) {
  for (let i = -r; i <= r; i++) { const w = Math.max(0, Math.round((r - Math.abs(i)) / 3)); P(ctx, x - w, y + i, w * 2 + 1, 1, col); P(ctx, x + i, y - w, 1, w * 2 + 1, col); }
  P(ctx, x - 1, y - 1, 3, 3, core);
}
const Nebula = {
  cache: {},
  get(sp) {
    if (this.cache[sp]) return this.cache[sp];
    const [c, x] = U.makeCanvas(WIDE, H);
    const t1 = TYPES[SPECIES[sp].types[0]].color, t2 = TYPES[SPECIES[sp].types[1] || SPECIES[sp].types[0]].color;
    x.fillStyle = '#080614'; x.fillRect(0, 0, WIDE, H);
    let s = 0; for (const ch of sp) s = (s * 31 + ch.charCodeAt(0)) % 9973;
    const rnd = () => { s = (s * 16807) % 2147483647 || 1; return (s % 10000) / 10000; };
    for (let i = 0; i < 14; i++) {
      const cx = 120 + rnd() * 300, cy = 20 + rnd() * 170, r = 20 + rnd() * 50, col = U.mix(i % 3 ? t1 : t2, '#1a1040', 0.45 + rnd() * 0.3);
      for (let k = 0; k < 4; k++) { x.globalAlpha = 0.07; pixCircle(x, Math.round(cx + rnd() * 8), Math.round(cy + rnd() * 8), Math.round(r * (1 - k * 0.22)), col); }
    }
    x.globalAlpha = 1;
    for (let i = 0; i < 160; i++) { const b = rnd(); x.fillStyle = b > 0.9 ? '#c8c0ff' : b > 0.6 ? '#5a5490' : '#2e2a50'; x.fillRect(Math.floor(rnd() * WIDE), Math.floor(rnd() * H), 1, 1); }
    return (this.cache[sp] = c);
  },
};

class ConstelScreen {
  constructor(c) {
    this.c = c; this.opaque = true; this.wide = true; this.t = 0; this.busy = false; this.parts = []; this.rings = [];
    this.B = Board.of(c); Board.owned(c); Board.sync(c);
    this.sel = this.B.start.id;
    const N = this.B.nodes, xs = N.map((n) => n.cx), ys = N.map((n) => n.cy);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    this.dx = 36; this.dy = 22;
    this.ox = Math.round(270 - ((minX + maxX) / 2) * this.dx); this.oy = Math.round(102 - ((minY + maxY) / 2) * this.dy);
    this.cam = [0, 0];
  }
  pos(n) { return [this.ox + n.cx * this.dx, this.oy + n.cy * this.dy]; }
  colOf(n) {
    if (n.info.t === 'move') return TYPES[MOVES[n.move].type].color;
    return n.info.color || '#ffffff';
  }
  nodeText(n) {
    const inf = n.info, d = this.B.def;
    if (inf.t === 'move') { const m = MOVES[n.move]; return [`Ataque: ${m.name}`, `Aprende ${m.name} (${TYPES[m.type].name}, potencia ${m.pow || '-'}). ${m.desc || ''}`]; }
    if (inf.t === 'key') return [`Clave: ${d.key.name}`, d.key.desc];
    if (inf.t === 'tal') return [`Talento: ${inf.name}`, inf.desc];
    if (inf.t === 'lock') return ['Nodo sellado', '+4% a todas sus estadísticas. Se abre con una Llave Esencia.'];
    if (inf.t === 'start') return ['Origen', `El corazón de la constelación ${d.name}.`];
    return [inf.name, 'Mejora permanente de esta estadística.'];
  }
  async activate() {
    const c = this.c, n = this.B.nodes[this.sel], st = Board.canBuy(c, n);
    if (st === 'owned') {
      if (n.info.t === 'move' && !c.moves.includes(n.move)) { this.busy = true; await learnMoveFlow(c, n.move); this.busy = false; }
      else Sound.sfx('bump');
      return;
    }
    if (st !== 'ok') { Sound.sfx('bump'); this.shake = 0.25; return; }
    const before = calcStats(c).hp;
    Board.buy(c, n);
    const after = calcStats(c).hp; if (c.hp > 0) c.hp = Math.max(1, c.hp + after - before);
    Sound.sfx(n.info.t === 'key' ? 'super' : 'buff');
    const [x, y] = this.pos(n), col = this.colOf(n), big = n.info.t === 'key';
    this.rings.push({ x, y, t: 0, col, big });
    for (let i = 0; i < (big ? 40 : 16); i++) { const a = U.rand(Math.PI * 2), s = U.rand(20, big ? 90 : 55); this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(0.4, 0.9), col: i % 2 ? col : '#ffffff' }); }
    this.lit = { id: n.id, t: 0 };
    if (n.info.t === 'move') { this.busy = true; await learnMoveFlow(c, n.move); this.busy = false; }
  }
  move(dx, dy) {
    const N = this.B.nodes, cur = N[this.sel];
    let best = null, bs = 1e9;
    for (const n of N) {
      if (n === cur) continue;
      const vx = n.cx - cur.cx, vy = n.cy - cur.cy, along = vx * dx + vy * dy;
      if (along <= 0) continue;
      const side = Math.abs(vx * dy - vy * dx), score = along + side * 2.2;
      if (score < bs) { bs = score; best = n; }
    }
    if (best) { this.sel = best.id; Sound.sfx('blip'); }
  }
  update(dt) {
    this.t += dt;
    if (this.shake) this.shake = Math.max(0, this.shake - dt);
    if (this.lit) this.lit.t += dt;
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const r of this.rings) r.t += dt;
    this.rings = this.rings.filter((r) => r.t < 0.7);
    if (this.busy) return;
    const M = Input.mouse;
    if (Input.repeat('left')) this.move(-1, 0);
    if (Input.repeat('right')) this.move(1, 0);
    if (Input.repeat('up')) this.move(0, -1);
    if (Input.repeat('down')) this.move(0, 1);
    let over = null;
    if (M.inside) for (const n of this.B.nodes) { const [x, y] = this.pos(n); if (Math.abs(M.x - x) <= 8 && Math.abs(M.y - y) <= 8) over = n; }
    if (over && (M.moved || M.pressed[0])) this.sel = over.id;
    if (Input.pressed('a') || (M.pressed[0] && over)) { this.activate(); return; }
    if (Input.pressed('b') || M.pressed[2]) { Sound.sfx('cancel'); this.done(); }
  }
  // ---------- dibujo ----------
  drawLinks(ctx, own) {
    const B = this.B, t = this.t;
    for (const n of B.nodes) for (const l of n.links) {
      if (l < n.id) continue;
      const m = B.nodes[l], [x1, y1] = this.pos(n), [x2, y2] = this.pos(m);
      const a = own.includes(n.id), b = own.includes(m.id), hor = y1 === y2;
      const len = hor ? Math.abs(x2 - x1) : Math.abs(y2 - y1), sx = Math.min(x1, x2), sy = Math.min(y1, y2);
      const seg = (o, w, col) => (hor ? P(ctx, sx + o, y1, w, 1, col) : P(ctx, x1, sy + o, 1, w, col));
      const glow = (col) => { ctx.globalAlpha = 0.3; if (hor) { P(ctx, sx, y1 - 1, len, 1, col); P(ctx, sx, y1 + 1, len, 1, col); } else { P(ctx, x1 - 1, sy, 1, len, col); P(ctx, x1 + 1, sy, 1, len, col); } ctx.globalAlpha = 1; };
      if (a && b) {
        glow('#ffc860'); seg(0, len, '#fff0b0');
        // pulso de energía que recorre la unión
        const ph = ((t * 0.9 + (n.id * 0.37 + l * 0.11)) % 1) * len;
        ctx.globalAlpha = 0.9; seg(Math.max(0, Math.round(ph) - 2), 4, '#ffffff'); ctx.globalAlpha = 1;
      } else if (a || b) {
        for (let o = 0; o < len; o += 3) seg(o, 2, '#6a60a0');
      } else for (let o = 0; o < len; o += 4) seg(o, 1, '#2e2a4c');
    }
  }
  drawNode(ctx, n, own, stage) {
    const c = this.c, [x, y] = this.pos(n), inf = n.info, st = Board.canBuy(c, n), has = st === 'owned', t = this.t;
    const locked = n.stage > stage, col = this.colOf(n), bg = '#0a0818';
    const r = inf.t === 'key' ? 7 : inf.t === 'start' ? 6 : inf.t === 'stat' ? 4 : 5;
    if (inf.t === 'key') {
      // estrella grande
      if (has) { ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 3); pixCircle(ctx, x, y, 11, col); ctx.globalAlpha = 1; }
      const ready = st === 'ok';
      drawKeyStar(ctx, x, y, 10, bg, bg);
      drawKeyStar(ctx, x, y, 9, has ? '#ffe070' : locked ? '#3a3450' : ready ? U.mix('#ffd048', '#ffffff', 0.3 + 0.3 * Math.sin(t * 6)) : '#8a7030', has ? '#ffffff' : locked ? '#2a2440' : '#ffe8a0');
      if (has) { ctx.save(); ctx.translate(x, y); ctx.rotate(t); ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff8d0'; ctx.fillRect(-7, 0, 14, 1); ctx.fillRect(0, -7, 1, 14); ctx.restore(); ctx.globalAlpha = 1; }
      return r;
    }
    if (has) { ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 2 + n.id); pixCircle(ctx, x, y, r + 4, col); ctx.globalAlpha = 1; }
    pixCircle(ctx, x, y, r + 1, bg);
    if (has) {
      pixCircle(ctx, x, y, r, col); pixCircle(ctx, x - 1, y - 1, Math.max(1, r - 2), U.shade(col, 0.25));
      P(ctx, x - Math.round(r / 2), y - Math.round(r / 2), 1, 1, '#ffffff');
    } else pixCircle(ctx, x, y, r, U.mix(col, bg, locked ? 0.88 : st === 'ok' ? 0.5 : 0.72));
    if (inf.t === 'tal') pixRing(ctx, x, y, r + 1, has ? '#ffffff' : U.mix(col, bg, locked ? 0.8 : 0.4), 1);
    if (!has && !locked && (st === 'ok' || st === 'key' || st === 'pts')) { ctx.globalAlpha = st === 'ok' ? 0.55 + 0.45 * Math.sin(t * 6) : 0.4; pixRing(ctx, x, y, r + 2, col, 1); ctx.globalAlpha = 1; }
    const ic = has ? U.shade(col, -0.55) : locked ? '#3a3450' : U.mix(col, '#ffffff', 0.5);
    if (inf.t === 'stat') drawStatIcon(ctx, inf.k, x - 2, y - 2, has ? '#ffffff' : ic);
    else if (inf.t === 'tal') Font.drawCenter(ctx, n.ch.toUpperCase(), x + 1, y - 4, has ? '#1a1430' : ic);
    else if (NODE_ICON[inf.t]) drawMini(ctx, NODE_ICON[inf.t], x - 2, y - 2, inf.t === 'start' ? '#ffffff' : has ? '#1a1430' : ic);
    return r;
  }
  drawSide(ctx) {
    const c = this.c, sp = SPECIES[c.sp], stage = Board.stageOf(c.sp), B = this.B, own = c.board.n, t = this.t;
    P(ctx, 0, 0, 114, H, '#0c0a1a'); P(ctx, 114, 0, 1, H, '#2e2850'); P(ctx, 115, 0, 1, H, '#05040c');
    // retrato sobre un disco del color del tipo
    const tc = TYPES[sp.types[0]].color;
    P(ctx, 6, 24, 102, 64, U.mix(tc, '#0c0a1a', 0.75)); P(ctx, 6, 24, 102, 1, U.mix(tc, '#ffffff', 0.2));
    ctx.globalAlpha = 0.3; pixCircle(ctx, 57, 60, 26, tc); ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) { const a = t * 0.8 + i * 1.05; P(ctx, Math.round(57 + Math.cos(a) * 34), Math.round(58 + Math.sin(a) * 18), 1, 1, '#ffffff'); }
    drawShadow(ctx, 57, 82, 16, 3, 0.35);
    ctx.drawImage(CreatureGfx.get(c.sp, 48, c.shiny), 33, 30 + Math.round(Math.sin(t * 2.2)));
    Font.draw(ctx, cName(c), 8, 92, '#ffffff', '#05040c');
    Font.drawRight(ctx, 'Nv ' + c.lv, 106, 92, '#c8c0e0');
    // etapa
    Font.draw(ctx, 'Etapa', 8, 104, '#7a72a0');
    for (let i = 0; i < 3; i++) { const x = 40 + i * 10; pixCircle(ctx, x, 108, 3, '#0a0818'); pixCircle(ctx, x, 108, 2, i < stage ? '#a0e0ff' : '#2a2448'); }
    // Esencia
    const pts = Board.points(c);
    P(ctx, 6, 118, 102, 26, '#14102a'); P(ctx, 6, 118, 102, 1, '#3a3264');
    drawKeyStar(ctx, 18, 131, 6, pts ? '#ffe060' : '#5a5070', '#ffffff');
    Font.draw(ctx, 'Esencia', 28, 121, '#a098c0');
    Font.draw(ctx, String(pts), 28, 131, pts ? '#ffe060' : '#a098c0', '#05040c');
    let nl = c.lv + 1; while (nl < 101 && Math.floor((nl - 1) * 0.8) === Math.floor((c.lv - 1) * 0.8)) nl++;
    if (nl <= 100) Font.drawRight(ctx, `+1 Nv${nl}`, 104, 131, '#6a6290');
    // llaves
    const keys = G.bag.llave_esencia || 0;
    drawMini(ctx, NODE_ICON.lock, 13, 150, keys ? '#a0e0ff' : '#3a3450');
    Font.draw(ctx, `Llaves: ${keys}`, 22, 148, keys ? '#a0e0ff' : '#5a5278');
    // bonus del tablero
    Font.draw(ctx, 'Bonus', 8, 159, '#ffd048');
    const b = c.bstat || {}, L = (c.block || 0) * 4;
    const rows = ['atk', 'esp', 'def', 'hp', 'vel'].map((k) => [k, (b[k] || 0) * 3 + L]);
    rows.forEach(([k, v], i) => {
      const x = 8 + (i % 2) * 52, y = 169 + Math.floor(i / 2) * 9;
      drawStatIcon(ctx, k, x, y + 2, v ? null : '#3a3450');
      Font.draw(ctx, `${GEAR_STATS[k].s} +${v}%`, x + 8, y, v ? '#e8e0f8' : '#4a4468');
    });
    const tal = Object.values(c.talents || {}).reduce((a, v) => a + v, 0);
    Font.draw(ctx, `Talentos: ${tal}`, 8, 199, tal ? '#e8e0f8' : '#4a4468');
    Font.draw(ctx, c.bkey ? `★ ${B.def.key.name}` : '★ Clave sin activar', 8, 209, c.bkey ? '#ffd048' : '#4a4468');
    // progreso
    const tot = B.nodes.length - 1, k = (own.length - 1) / tot;
    UI.bar(ctx, 8, 232, 98, 3, k, '#ffe080', '#1a1630'); Font.draw(ctx, 'Nodos', 8, 220, '#6a6290');
    Font.drawRight(ctx, `${own.length - 1}/${tot}`, 106, 220, '#a098c0');
  }
  drawDetail(ctx) {
    const c = this.c, B = this.B, n = B.nodes[this.sel], st = Board.canBuy(c, n), [title, desc] = this.nodeText(n), col = this.colOf(n);
    const x = 120, y = 186, w = 302, h = 50, sh = this.shake ? Math.round(Math.sin(this.shake * 80) * 2) : 0;
    P(ctx, x + sh, y, w, h, '#05040c'); P(ctx, x + 1 + sh, y + 1, w - 2, h - 2, '#141028'); P(ctx, x + 1 + sh, y + 1, w - 2, 1, U.mix(col, '#141028', 0.3));
    const tx = x + 8 + sh;
    Font.draw(ctx, title, tx, y + 5, n.info.t === 'key' ? '#ffd048' : U.mix(col, '#ffffff', 0.45), '#05040c');
    if (n.info.cost) {
      for (let i = 0; i < n.info.cost; i++) { const gx = x + w - 10 - i * 7 + sh; pixCircle(ctx, gx, y + 9, 2, '#05040c'); pixCircle(ctx, gx, y + 9, 2, i < Board.points(c) || st === 'owned' ? '#ffe060' : '#3a3458'); }
    }
    Font.wrap(desc, w - 16).slice(0, 2).forEach((ln, k) => Font.draw(ctx, ln, tx, y + 16 + k * 10, '#b8b0d0'));
    const msg = { owned: n.info.t === 'move' && !c.moves.includes(n.move) ? '✓ Activado · Z: volver a aprenderlo' : '✓ Activado', ok: '◆ Z / clic: activar', far: '✗ Debe estar unido a un nodo activado', pts: '✗ Falta Esencia (sube de nivel)', key: '✗ Necesitas una Llave Esencia', stage: `✗ Se abre en la etapa ${n.stage} (al evolucionar)` }[st];
    Font.draw(ctx, msg, tx, y + 37, st === 'ok' ? (Math.floor(this.t * 3) % 2 ? '#80ff90' : '#50d070') : st === 'owned' ? '#ffe080' : '#ff8a70');
  }
  draw(ctx) {
    const c = this.c, B = this.B, own = c.board.n, stage = Board.stageOf(c.sp), t = this.t;
    ctx.drawImage(Nebula.get(c.sp), 0, 0);
    // estrellas que titilan y se desplazan despacio
    for (let i = 0; i < 40; i++) { const x = Math.round((i * 97 + 13 + t * (2 + (i % 3))) % 310) + 116, y = 20 + ((i * 53 + 7) % 164); if (Math.sin(t * 2 + i * 1.7) > 0.5) P(ctx, x, y, 1, 1, '#d8d0ff'); }
    this.drawLinks(ctx, own);
    for (const n of B.nodes) {
      const r = this.drawNode(ctx, n, own, stage), [x, y] = this.pos(n);
      if (n.id === this.sel) {
        const k = 2 + Math.round(Math.sin(t * 8));
        const rr = r + 3 + k;
        P(ctx, x - rr, y - rr, 3, 1, '#ffffff'); P(ctx, x - rr, y - rr, 1, 3, '#ffffff');
        P(ctx, x + rr - 2, y - rr, 3, 1, '#ffffff'); P(ctx, x + rr, y - rr, 1, 3, '#ffffff');
        P(ctx, x - rr, y + rr, 3, 1, '#ffffff'); P(ctx, x - rr, y + rr - 2, 1, 3, '#ffffff');
        P(ctx, x + rr - 2, y + rr, 3, 1, '#ffffff'); P(ctx, x + rr, y + rr - 2, 1, 3, '#ffffff');
      }
    }
    if (this.lit && this.lit.t < 0.4) { const n = B.nodes[this.lit.id], [x, y] = this.pos(n); ctx.globalAlpha = 1 - this.lit.t / 0.4; pixCircle(ctx, x, y, 6 + this.lit.t * 10, '#ffffff'); ctx.globalAlpha = 1; }
    for (const r of this.rings) { ctx.globalAlpha = 1 - r.t / 0.7; pixRing(ctx, r.x, r.y, 4 + r.t * (r.big ? 90 : 40), r.col, 1); ctx.globalAlpha = 1; }
    for (const p of this.parts) { ctx.globalAlpha = Math.min(1, p.life * 2); P(ctx, Math.round(p.x), Math.round(p.y), 1, 1, p.col); }
    ctx.globalAlpha = 1;
    // cabecera
    P(ctx, 116, 0, W - 116, 18, '#0a0816'); P(ctx, 116, 18, W - 116, 1, '#2e2850');
    Font.draw(ctx, 'CONSTELACIÓN', 122, 5, '#a0a0ff', '#05040c');
    Font.draw(ctx, B.def.name, 196, 5, '#ffffff', '#05040c');
    Font.drawRight(ctx, 'X / clic der.: salir', W - 6, 5, '#5a5278');
    this.drawSide(ctx);
    P(ctx, 0, 0, 114, 18, '#0a0816'); P(ctx, 0, 18, 114, 1, '#2e2850');
    Font.draw(ctx, 'Z: activar nodo', 8, 5, '#5a5278');
    this.drawDetail(ctx);
  }
}
TalentScreen = ConstelScreen;
