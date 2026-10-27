'use strict';
// ============================================================
//  ALTAR DE QUIMERAS: pantalla de recetas y cinemática de fusión
// ============================================================
// círculo rúnico en perspectiva (suelo del altar)
function drawRuneCircle(ctx, cx, cy, rx, ry, t, col, alpha = 1) {
  ctx.globalAlpha = 0.25 * alpha;
  for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry))); P(ctx, cx - w, cy + y, w * 2, 1, col); }
  ctx.globalAlpha = alpha;
  for (const [k, n, sp] of [[1, 48, 0.4], [0.72, 32, -0.6]]) {
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + t * sp; P(ctx, Math.round(cx + Math.cos(a) * rx * k), Math.round(cy + Math.sin(a) * ry * k), 1, 1, i % 4 ? col : '#ffffff'); }
  }
  // runas (pequeñas marcas) en el anillo intermedio
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - t * 0.25, x = Math.round(cx + Math.cos(a) * rx * 0.86), y = Math.round(cy + Math.sin(a) * ry * 0.86);
    P(ctx, x - 1, y - 1, 3, 1, col); P(ctx, x, y - 1, 1, 3, col);
  }
  ctx.globalAlpha = 1;
}
function chimeraFrame(ctx, x, y, w, h, col = '#6a4aa0') {
  P(ctx, x, y, w, h, '#06040c'); P(ctx, x + 1, y + 1, w - 2, h - 2, '#170f28');
  P(ctx, x + 1, y + 1, w - 2, 1, col); P(ctx, x + 1, y + h - 2, w - 2, 1, '#0c0818');
  P(ctx, x, y, 3, 1, '#ffd080'); P(ctx, x, y, 1, 3, '#ffd080'); P(ctx, x + w - 3, y, 3, 1, '#ffd080'); P(ctx, x + w - 1, y, 1, 3, '#ffd080');
}

// ---------- cinemática ----------
class FusionScene {
  constructor(a, b, to) { this.a = a; this.b = b; this.to = to; this.t = 0; this.opaque = true; this.wide = true; this.trail = []; this.parts = []; this.rings = []; this.boomed = false; }
  update(dt) {
    this.t += dt;
    const t = this.t, cx = W / 2;
    if (t < 3.4) {
      const k = Math.min(1, t / 3.3), r = (1 - k * k) * 92, spin = t * t * 1.2;
      this.pa = [cx + Math.cos(spin) * r, 96 + Math.sin(spin) * r * 0.35];
      this.pb = [cx - Math.cos(spin) * r, 96 - Math.sin(spin) * r * 0.35];
      this.trail.push({ a: this.pa.slice(), b: this.pb.slice(), life: 0.5 });
    }
    for (const p of this.trail) p.life -= dt;
    this.trail = this.trail.filter((p) => p.life > 0);
    if (Math.random() < dt * 30) this.parts.push({ x: cx + U.rand(-70, 70), y: 160 + U.rand(-8, 8), vy: -U.rand(15, 45), life: 1.4, c: Math.random() < 0.5 ? TYPES[SPECIES[this.a].types[0]].color : TYPES[SPECIES[this.b].types[0]].color });
    if (t > 3.4 && !this.boomed) {
      this.boomed = true; Sound.sfx('super'); Shake.start(3, 0.4);
      for (let i = 0; i < 3; i++) this.rings.push({ t: -i * 0.12 });
      for (let i = 0; i < 50; i++) { const a = U.rand(Math.PI * 2), s = U.rand(40, 160); this.parts.push({ x: cx, y: 96, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(0.5, 1.2), c: i % 2 ? '#ffffff' : '#ffd8ff' }); }
    }
    for (const p of this.parts) { p.x += (p.vx || 0) * dt; p.y += p.vy * dt; if (p.vx) { p.vx *= 0.95; p.vy *= 0.95; } p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const r of this.rings) r.t += dt;
    if (this.t >= 7 || (this.t > 4.5 && (Input.pressed('a') || Input.mouse.pressed[0]))) this.done(true);
  }
  draw(ctx) {
    const t = this.t, cx = Math.round(W / 2);
    P(ctx, 0, 0, W, H, '#0a0614');
    // haces de luz desde arriba
    for (let i = 0; i < 5; i++) { ctx.globalAlpha = 0.05 + 0.03 * Math.sin(t * 1.5 + i); P(ctx, cx - 110 + i * 50 + Math.round(Math.sin(t * 0.5 + i) * 6), 0, 18, 170, '#a080ff'); }
    ctx.globalAlpha = 1;
    drawRuneCircle(ctx, cx, 160, Math.min(1, t / 0.6) * 110, Math.min(1, t / 0.6) * 22, t, '#c0a0ff');
    for (const p of this.parts) { ctx.globalAlpha = Math.min(1, p.life); P(ctx, Math.round(p.x), Math.round(p.y), 1, p.vx ? 1 : 2, p.c); }
    ctx.globalAlpha = 1;
    if (t < 3.45) {
      const ca = TYPES[SPECIES[this.a].types[0]].color, cb = TYPES[SPECIES[this.b].types[0]].color;
      for (const p of this.trail) { const al = p.life / 0.5; ctx.globalAlpha = al * 0.7; pixCircle(ctx, Math.round(p.a[0]), Math.round(p.a[1]), Math.max(1, Math.round(al * 5)), ca); pixCircle(ctx, Math.round(p.b[0]), Math.round(p.b[1]), Math.max(1, Math.round(al * 5)), cb); }
      ctx.globalAlpha = 1;
      const fl = t > 1.8 && Math.sin(t * t * 5) > 0, S = Math.round(64 - Math.max(0, t - 2) * 18);
      const draw = (sp, [x, y]) => ctx.drawImage(fl ? CreatureGfx.flash(sp, S, '#ffffff') : CreatureGfx.get(sp, S), Math.round(x - S / 2), Math.round(y - S / 2));
      // el que está detrás se dibuja primero
      if (this.pa[1] < this.pb[1]) { draw(this.a, this.pa); draw(this.b, this.pb); } else { draw(this.b, this.pb); draw(this.a, this.pa); }
      if (t > 2.6) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (t - 2.6) / 0.8 * 0.8; pixCircle(ctx, cx, 96, Math.round((t - 2.6) * 30), '#ffd8ff'); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    } else {
      // rayos giratorios y aparición
      const k = Math.min(1, (t - 3.4) / 0.8);
      ctx.save(); ctx.translate(cx, 92); ctx.rotate(t * 0.4); ctx.globalAlpha = 0.13 * k; ctx.fillStyle = '#ffe8ff';
      for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -150); ctx.lineTo(8, -150); ctx.fill(); }
      ctx.restore(); ctx.globalAlpha = 1;
      drawShadow(ctx, cx, 146, 34, 6, 0.4);
      const bob = Math.round(Math.sin(t * 2) * 2), img = t < 4.4 ? CreatureGfx.flash(this.to, 96, '#ffffff') : CreatureGfx.get(this.to, 96);
      ctx.drawImage(img, cx - 48, 46 + bob);
      if (t > 4.2 && t < 4.6) { ctx.globalAlpha = 1 - (t - 4.2) / 0.4; ctx.drawImage(CreatureGfx.flash(this.to, 96, '#ffffff'), cx - 48, 46 + bob); ctx.globalAlpha = 1; }
    }
    for (const r of this.rings) if (r.t > 0 && r.t < 0.9) { ctx.globalAlpha = 1 - r.t / 0.9; pixRing(ctx, cx, 96, 6 + r.t * 220, '#ffffff', 1); ctx.globalAlpha = 1; }
    if (t > 3.35 && t < 4.1) { ctx.globalAlpha = Math.max(0, 1 - Math.abs(t - 3.5) / 0.6); P(ctx, 0, 0, W, H, '#ffffff'); ctx.globalAlpha = 1; }
    // texto
    const sp = SPECIES[this.to];
    if (t < 3.4) {
      chimeraFrame(ctx, cx - 140, 196, 280, 30);
      Font.drawCenter(ctx, 'Las dos ánimas se funden en la luz del altar...', cx, 206, '#e8d8ff');
    } else if (t > 4.4) {
      const k = Math.min(1, (t - 4.4) / 0.3), y = Math.round(186 + (1 - k) * 20);
      ctx.globalAlpha = k;
      chimeraFrame(ctx, cx - 120, y, 240, 44, '#ffd080');
      Font.drawCenter(ctx, `¡Ha nacido ${sp.name}!`, cx, y + 7, '#ffe8a0', '#06040c');
      const bw = sp.types.length * 32 - 2; sp.types.forEach((ty, i) => UI.typeBadge(ctx, ty, cx - bw / 2 + i * 32, y + 20));
      Font.drawCenter(ctx, 'QUIMERA', cx, y + 32, '#b090e0');
      ctx.globalAlpha = 1;
    }
  }
}

// ---------- pantalla del altar ----------
class AltarScreen {
  constructor(speaker) { this.speaker = speaker; this.opaque = true; this.wide = true; this.i = 0; this.t = 0; this.busy = false; }
  recipe() { return FUSIONS[this.i]; }
  // sprite de cada progenitora: la del equipo si la hay, si no la forma de 2.ª etapa de la línea
  parentSp(line, list) {
    if (list && list.length) return list[0].sp;
    const e = SPECIES[line].evo; return e ? e.to || (e.branch && e.branch.a) || line : line;
  }
  async fuseFlow() {
    const f = this.recipe(), ck = Fusion.check(f);
    if (!ck.ready) { Sound.sfx('bump'); return; }
    this.busy = true;
    try {
      if ((await ask(`¿Realizar la fusión? Las dos ánimas se convertirán en ${SPECIES[f.to].name}.`)) !== 0) return;
      const a = await Fusion.pick(ck.A); if (!a) return;
      const b = await Fusion.pick(ck.Bc.filter((c) => c !== a)); if (!b) return;
      await Fusion.fuse(f, a, b);
      this.fused = true; this.done(true);
    } finally { this.busy = false; }
  }
  update(dt) {
    this.t += dt;
    if (this.busy) return;
    const M = Input.mouse, n = FUSIONS.length;
    if (Input.repeat('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
    let over = -1;
    if (M.inside && M.x >= 6 && M.x < 140) for (let k = 0; k < n; k++) if (M.y >= 26 + k * 26 && M.y < 50 + k * 26) over = k;
    if (over >= 0 && (M.moved || M.pressed[0]) && over !== this.i) { this.i = over; Sound.sfx('blip'); }
    const onBtn = M.inside && M.x >= 330 && M.x < 416 && M.y >= 212 && M.y < 232;
    if (Input.pressed('a') || (M.pressed[0] && onBtn)) { this.fuseFlow(); return; }
    if (Input.pressed('b') || M.pressed[2]) { Sound.sfx('cancel'); this.done(false); }
  }
  drawBg(ctx) {
    const t = this.t;
    P(ctx, 0, 0, W, H, '#0e0818');
    for (let y = 0; y < H; y += 4) { ctx.globalAlpha = 0.04 + 0.03 * Math.sin(y * 0.05 + t); P(ctx, 0, y, W, 2, '#6040a0'); }
    ctx.globalAlpha = 1;
    // columnas
    for (const x of [148, 404]) { P(ctx, x, 20, 14, 200, '#1a1230'); P(ctx, x + 2, 20, 2, 200, '#2a2048'); P(ctx, x + 11, 20, 2, 200, '#120c22'); P(ctx, x - 2, 20, 18, 4, '#2a2048'); }
  }
  drawList(ctx) {
    P(ctx, 0, 20, 144, H - 20, '#0a0612'); P(ctx, 144, 20, 1, H - 20, '#3a2a60');
    FUSIONS.forEach((f, k) => {
      const y = 26 + k * 26, sel = k === this.i, known = Fusion.known(f), ck = known ? Fusion.check(f) : null, done = G.caught[SPECIES[f.to].id];
      if (sel) { P(ctx, 4, y - 1, 136, 25, '#2a1c48'); P(ctx, 4, y - 1, 2, 25, '#ffd080'); }
      P(ctx, 10, y, 24, 24, '#140c24');
      ctx.drawImage(known ? CreatureGfx.get(f.to, 24) : CreatureGfx.flash(f.to, 24, '#2e2448'), 10, y);
      Font.draw(ctx, known ? SPECIES[f.to].name : '???', 40, y + 3, known ? (sel ? '#ffffff' : '#d8c8f0') : '#5a4a78');
      const st = !known ? 'Receta oculta' : ck.ready ? '¡Lista!' : done ? 'Creada' : `Nv ${f.lv}+`;
      Font.draw(ctx, st, 40, y + 13, ck && ck.ready ? (Math.floor(this.t * 3) % 2 ? '#80ff90' : '#50d070') : '#7a6a98');
      if (done) Font.drawRight(ctx, '★', 136, y + 3, '#ffd048');
      if (f.time) Font.drawRight(ctx, f.time === 'day' ? '☼' : '☾', 136, y + 13, f.time === 'day' ? '#ffd060' : '#a0b0ff');
    });
  }
  drawRecipe(ctx) {
    const f = this.recipe(), known = Fusion.known(f), t = this.t, cx = 283;
    drawRuneCircle(ctx, cx, 96, 108, 18, t, known ? '#b090ff' : '#4a3a70', known ? 1 : 0.6);
    const ck = known ? Fusion.check(f) : null;
    const spA = this.parentSp(f.a, ck && ck.A.length ? ck.A : Fusion.candidates(f, f.a)), spB = this.parentSp(f.b, ck && ck.Bc.length ? ck.Bc : Fusion.candidates(f, f.b));
    const bob = (o) => Math.round(Math.sin(t * 2 + o) * 1.5);
    const sil = (sp, S) => (known ? CreatureGfx.get(sp, S) : CreatureGfx.flash(sp, S, '#2a2042'));
    drawShadow(ctx, 196, 98, 14, 3, 0.4); drawShadow(ctx, 270, 98, 14, 3, 0.4); drawShadow(ctx, 360, 104, 22, 4, 0.4);
    ctx.drawImage(sil(spA, 40), 176, 58 + bob(0));
    ctx.drawImage(sil(spB, 40), 250, 58 + bob(1));
    Font.drawCenter(ctx, '+', 233, 74, '#ffd080', '#06040c');
    // flecha animada
    const ax = 306 + Math.round((t * 12) % 6);
    P(ctx, 300, 78, 14, 1, '#ffd080'); P(ctx, ax + 8, 76, 1, 5, '#ffd080'); P(ctx, ax + 9, 77, 1, 3, '#ffd080'); P(ctx, ax + 10, 78, 1, 1, '#ffd080');
    // resultado con halo
    ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 2); pixCircle(ctx, 360, 76, 30, known ? '#c0a0ff' : '#3a2a5a'); ctx.globalAlpha = 1;
    ctx.drawImage(known ? CreatureGfx.get(f.to, 56) : CreatureGfx.flash(f.to, 56, '#1a1430'), 332, 46 + bob(2));
    if (!known) Font.drawCenter(ctx, '?', 360, 70, '#8a70c0');
    Font.drawCenter(ctx, known ? SPECIES[spA].name : '???', 196, 104, '#c8b8e8');
    Font.drawCenter(ctx, known ? SPECIES[spB].name : '???', 270, 104, '#c8b8e8');
    // ficha inferior
    chimeraFrame(ctx, 166, 116, 236, 92, known ? '#8a6ac0' : '#3a2a60');
    if (!known) {
      Font.draw(ctx, 'Inscripción antigua', 174, 122, '#a088d0');
      Font.wrap(`"${f.hint}"`, 220).forEach((ln, k) => Font.draw(ctx, ln, 174, 136 + k * 11, '#e8dcc0'));
      Font.draw(ctx, 'Consigue su catalizador para revelarla.', 174, 192, '#6a5a90');
      return;
    }
    const sp = SPECIES[f.to];
    Font.draw(ctx, sp.name, 174, 122, '#ffe8a0', '#06040c');
    sp.types.forEach((ty, i) => UI.typeBadge(ctx, ty, 396 - (sp.types.length - i) * 32, 122));
    ck.lines.forEach(([ok, txt], k) => {
      const y = 136 + k * 13;
      P(ctx, 174, y, 9, 9, ok ? '#1e4a2a' : '#4a1e24');
      Font.draw(ctx, ok ? '✓' : '✗', 176, y + 0, ok ? '#80ff90' : '#ff8070');
      let s = txt; while (Font.width(s) > 206) s = s.slice(0, -2) + '…';
      Font.draw(ctx, s, 188, y + 1, ok ? '#e8e0f8' : '#a898c0');
    });
    // catalizador
    ctx.drawImage(Icons.item(f.item), 172, 210);
    Font.draw(ctx, `${ITEMS[f.item].name} ×${G.bag[f.item] || 0}`, 190, 214, G.bag[f.item] ? '#e8d8ff' : '#6a5a90');
    // botón
    const ready = ck.ready, x = 330, y = 212;
    P(ctx, x, y, 86, 20, ready ? '#ffd080' : '#2a2040'); P(ctx, x + 1, y + 1, 84, 18, ready ? (Math.floor(t * 3) % 2 ? '#8a40d0' : '#7030b8') : '#1a1430');
    Font.drawCenter(ctx, ready ? 'FUSIONAR (Z)' : 'Faltan requisitos', x + 43, y + 6, ready ? '#ffffff' : '#5a4a78');
  }
  draw(ctx) {
    this.drawBg(ctx);
    this.drawRecipe(ctx);
    this.drawList(ctx);
    P(ctx, 0, 0, W, 20, '#06040c'); P(ctx, 0, 20, W, 1, '#3a2a60');
    Font.draw(ctx, 'ALTAR DE QUIMERAS', 8, 6, '#e0c8ff', '#2a1a48');
    const known = FUSIONS.filter((f) => Fusion.known(f)).length, day = Clock.isDay();
    Font.drawRight(ctx, `Recetas ${known}/${FUSIONS.length}`, W - 30, 6, '#a088d0');
    Font.drawRight(ctx, day ? '☼' : '☾', W - 8, 6, day ? '#ffd060' : '#a0b0ff');
  }
}

Story.scripts.altar_quimeras = async function () {
  const sp = 'Ilse';
  if (!G.flags.altar_intro) {
    G.flags.altar_intro = true;
    await say(['Bienvenido al Altar de Quimeras. Soy Ilse, su guardiana.', 'Aquí, dos ánimas que confían plenamente en ti pueden fundirse en una criatura nueva.', 'Solo ciertas parejas son compatibles, y cada fusión necesita un catalizador.', 'Los alfas a veces los sueltan, y los jefes de las grietas siempre guardan alguno.', 'Cuando consigas uno, su receta se revelará aquí.'], { speaker: sp });
  }
  const fused = await runScene(new AltarScreen(sp));
  if (!fused) await say('Que el vínculo con tus ánimas siga creciendo.', { speaker: sp });
};
