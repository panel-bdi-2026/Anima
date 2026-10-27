'use strict';
// ============================================================
//  Reloj del juego, iluminación dinámica, clima y partículas ambientales
// ============================================================

const Clock = {
  // minutos del día (0-1440)
  get t() { return G && G.time !== undefined ? G.time : 9 * 60; },
  update(dt) {
    if (!G) return;
    if (G.time === undefined) G.time = 9 * 60;
    if (Options.dayLen === 0) {
      const d = new Date();
      const nt = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
      if (nt < G.time - 600) this.newDay();
      G.time = nt;
      return;
    }
    G.time += (dt * 1440) / (Options.dayLen * 60);
    if (G.time >= 1440) { G.time -= 1440; this.newDay(); }
    // el clima cambia al amanecer y al atardecer
    const h = Math.floor(G.time / 60);
    if (h !== this.lastH) { if ((h === 6 || h === 14 || h === 20) && this.lastH !== undefined) Weather.roll(); this.lastH = h; }
  },
  newDay() { G.day = (G.day || 1) + 1; Weather.roll(); },
  hour() { return this.t / 60; },
  isDay() { const h = this.hour(); return h >= 6 && h < 18; },
  phase() { const h = this.hour(); return h >= 5 && h < 7 ? 'amanecer' : h >= 7 && h < 17 ? 'día' : h >= 17 && h < 20 ? 'atardecer' : 'noche'; },
  str() { const m = Math.floor(this.t); return U.pad(Math.floor(m / 60), 2, '0') + ':' + U.pad(m % 60, 2, '0'); },
  // oscuridad (0-1), color de la noche y tinte cálido/frío
  light() {
    const h = this.hour();
    const NIGHT = 0.72;
    let a = 0, tint = null, ta = 0;
    if (h >= 21 || h < 4.5) a = NIGHT;
    else if (h < 7) { const k = (h - 4.5) / 2.5; a = NIGHT * (1 - U.easeInOut(k)); tint = '#a070d0'; ta = 0.25 * Math.sin(k * Math.PI); }
    else if (h < 16.5) a = 0;
    else if (h < 19) { const k = (h - 16.5) / 2.5; a = 0.22 * k; tint = '#ff8040'; ta = 0.3 * Math.sin(Math.min(1, k * 1.2) * Math.PI * 0.8); }
    else { const k = (h - 19) / 2; a = 0.22 + (NIGHT - 0.22) * U.easeInOut(k); tint = '#ff6040'; ta = 0.2 * (1 - k); }
    return { a, color: '#08102c', tint, ta };
  },
};

// ---------- iluminación ----------
const Lighting = {
  c: null, x: null,
  // lights: {x, y, r, i (intensidad 0-1), glow (color opcional)}
  draw(ctx, a, color, lights, tint, ta) {
    if (tint && ta > 0.01) {
      ctx.globalAlpha = ta; ctx.globalCompositeOperation = 'overlay';
      P(ctx, 0, 0, W, H, tint);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    if (a <= 0.01) return;
    if (!this.c) { [this.c, this.x] = U.makeCanvas(W, H); }
    const x = this.x;
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, W, H);
    x.globalAlpha = a; x.fillStyle = color; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
    x.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      if (l.x < -l.r || l.y < -l.r || l.x > W + l.r || l.y > H + l.r) continue;
      const g = x.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, `rgba(0,0,0,${l.i === undefined ? 1 : l.i})`);
      g.addColorStop(0.55, `rgba(0,0,0,${(l.i === undefined ? 1 : l.i) * 0.6})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    x.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.c, 0, 0);
    // brillo cálido aditivo
    ctx.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      if (!l.glow || l.x < -l.r || l.y < -l.r || l.x > W + l.r || l.y > H + l.r) continue;
      const rr = l.gr || l.r * 0.6;
      const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, rr);
      const [r0, g0, b0] = U.hexToRgb(l.glow);
      const al = Math.min(0.5, a * 0.6) * (l.gi || 1);
      g.addColorStop(0, `rgba(${r0},${g0},${b0},${al})`); g.addColorStop(1, `rgba(${r0},${g0},${b0},0)`);
      ctx.fillStyle = g; ctx.fillRect(l.x - rr, l.y - rr, rr * 2, rr * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  },
};

// ---------- clima ----------
const Weather = {
  drops: [], splashes: [], fogT: 0,
  roll() {
    if (!G) return;
    const r = Math.random();
    G.weather = r < 0.62 ? 'despejado' : r < 0.82 ? 'lluvia' : r < 0.94 ? 'nublado' : 'tormenta';
  },
  // clima efectivo en un mapa
  at(map) {
    if (!map || !map.outdoor || !G) return 'despejado';
    const w = G.weather || 'despejado';
    if (map.id === 'bosque' && w === 'nublado') return 'niebla';
    return w;
  },
  icon(w, day = true) { return { despejado: day ? '☼' : '★', lluvia: '☂', nublado: '☁', tormenta: 'ϟ', niebla: '≈' }[w] || '☼'; },
  isRain(w) { return w === 'lluvia' || w === 'tormenta'; },
  update(dt, w) {
    const rain = this.isRain(w);
    const target = rain ? (w === 'tormenta' ? 150 : 90) : 0;
    while (this.drops.length < target) this.drops.push({ x: U.rand(-20, W + 40), y: U.rand(-H, H), s: U.rand(260, 360), l: U.randi(5, 9) });
    if (this.drops.length > target) this.drops.length = target;
    for (const d of this.drops) {
      d.x -= d.s * 0.25 * dt; d.y += d.s * dt;
      if (d.y > H) { if (Math.random() < 0.5) this.splashes.push({ x: d.x, y: U.rand(20, H), t: 0 }); d.y = U.rand(-40, -5); d.x = U.rand(-10, W + 60); }
    }
    for (const s of this.splashes) s.t += dt;
    this.splashes = this.splashes.filter((s) => s.t < 0.25);
    this.fogT += dt;
    if (w === 'tormenta') { this.flash = Math.max(0, (this.flash || 0) - dt); if (Math.random() < dt * 0.08) { this.flash = 0.35; Sound.sfx('rock'); } }
    else this.flash = 0;
    Sound.ambient(rain ? 'rain' : null);
  },
  draw(ctx, w) {
    if (w === 'nublado' || this.isRain(w)) { ctx.globalAlpha = w === 'tormenta' ? 0.3 : 0.16; P(ctx, 0, 0, W, H, '#405068'); ctx.globalAlpha = 1; }
    if (w === 'niebla') {
      for (let i = 0; i < 6; i++) {
        const y = (i * 47 + this.fogT * 6) % (H + 60) - 30, x = Math.sin(this.fogT * 0.3 + i) * 40 - 20;
        ctx.globalAlpha = 0.12; P(ctx, x, y, W + 80, 26, '#e8f0f0'); P(ctx, x + 20, y + 6, W, 14, '#ffffff'); ctx.globalAlpha = 1;
      }
    }
    if (this.drops.length) {
      ctx.fillStyle = '#c0d8ff'; ctx.globalAlpha = 0.55;
      for (const d of this.drops) for (let k = 0; k < d.l; k += 2) ctx.fillRect(Math.round(d.x - k * 0.25), Math.round(d.y - k), 1, 2);
      ctx.globalAlpha = 0.6;
      for (const s of this.splashes) { const r = 1 + s.t * 10; ctx.fillRect(Math.round(s.x - r), Math.round(s.y), 1, 1); ctx.fillRect(Math.round(s.x + r), Math.round(s.y), 1, 1); ctx.fillRect(Math.round(s.x), Math.round(s.y - r * 0.5), 1, 1); }
      ctx.globalAlpha = 1;
    }
    if (this.flash > 0) { ctx.globalAlpha = this.flash; P(ctx, 0, 0, W, H, '#ffffff'); ctx.globalAlpha = 1; }
  },
};

// ---------- partículas ambientales del mundo (coordenadas de mapa) ----------
const Ambient = {
  list: [], t: 0,
  reset() { this.list = []; },
  update(dt, world) {
    this.t += dt;
    const m = world.map, [cx, cy] = world.cam || [0, 0];
    const day = Clock.isDay(), w = Weather.at(m), rain = Weather.isRain(w);
    const rnd = (a, b) => U.rand(a, b);
    const spawnIn = () => [cx + rnd(0, W), cy + rnd(0, H)];
    const count = (k) => { let n = 0; for (const p of this.list) if (p.k === k) n++; return n; };
    if (m.outdoor) {
      if (day && !rain && count('mariposa') < 5 && Math.random() < dt * 0.8) {
        const [x, y] = spawnIn(); const t = world.tileAt(Math.floor(x / 16), Math.floor(y / 16));
        if (t && (t.t === 'flower' || t.t === 'grass')) this.list.push({ k: 'mariposa', x, y, ph: rnd(0, 6), c: U.choice(['#ffffff', '#f8e060', '#f8a0c0', '#a0d0ff']), life: rnd(8, 16) });
      }
      if (!day && !rain && count('luciernaga') < 14 && Math.random() < dt * 2) {
        const [x, y] = spawnIn(); const t = world.tileAt(Math.floor(x / 16), Math.floor(y / 16));
        if (t && (t.t === 'grass' || t.t === 'tallgrass' || t.t === 'tree' || t.t === 'flower')) this.list.push({ k: 'luciernaga', x, y, ph: rnd(0, 6), life: rnd(5, 10) });
      }
      if (m.id === 'bosque' && count('hoja') < 10 && Math.random() < dt * 1.5) this.list.push({ k: 'hoja', x: cx + rnd(0, W), y: cy - 4, ph: rnd(0, 6), life: 9, c: U.choice([PAL.tr1, PAL.tr2, '#c8a040']) });
      if (day && !rain && count('pajaro') < 1 && Math.random() < dt * 0.05) this.list.push({ k: 'pajaro', x: cx - 20, y: cy + rnd(20, H - 20), vx: rnd(60, 90), life: 9 });
      // humo de chimeneas
      for (const b of m.buildings) if (b.style.startsWith('house') && Math.random() < dt * 1.2) this.list.push({ k: 'humo', x: b.x * 16 + b.w * 16 - 11 + rnd(-1, 1), y: b.y * 16 - 1, y0: b.y * 16 - 1, b, life: 2.2, max: 2.2, vx: rnd(4, 9) });
    } else if (m.cave) {
      if (count('polvo') < 18 && Math.random() < dt * 4) { const [x, y] = spawnIn(); this.list.push({ k: 'polvo', x, y, ph: rnd(0, 6), life: rnd(4, 8) }); }
    }
    for (const p of this.list) {
      p.life -= dt; p.ph = (p.ph || 0) + dt;
      if (p.k === 'mariposa') { p.x += Math.sin(p.ph * 1.3) * 18 * dt + 6 * dt; p.y += Math.cos(p.ph * 2.1) * 14 * dt; }
      else if (p.k === 'luciernaga') { p.x += Math.sin(p.ph * 0.9) * 8 * dt; p.y += Math.cos(p.ph * 1.3) * 6 * dt; }
      else if (p.k === 'hoja') { p.y += 14 * dt; p.x += Math.sin(p.ph * 2) * 16 * dt; }
      else if (p.k === 'pajaro') { p.x += p.vx * dt; p.y += Math.sin(p.ph * 2) * 4 * dt; }
      else if (p.k === 'humo') { p.y -= 9 * dt; p.x += p.vx * dt; }
      else if (p.k === 'polvo') { p.y += Math.sin(p.ph) * 2 * dt + 1.5 * dt; p.x += Math.cos(p.ph * 0.7) * 3 * dt; }
    }
    this.list = this.list.filter((p) => p.life > 0 && p.x > cx - 60 && p.x < cx + W + 60 && p.y > cy - 60 && p.y < cy + H + 60);
  },
  draw(ctx, cx, cy, layer) {
    for (const p of this.list) {
      const x = Math.round(p.x - cx), y = Math.round(p.y - cy);
      const fade = Math.min(1, p.life);
      if (layer === 'ground') {
        if (p.k === 'pajaro') { ctx.globalAlpha = 0.2; P(ctx, x, y + 30, 6, 2, '#000'); P(ctx, x + 2, y + 29, 2, 1, '#000'); ctx.globalAlpha = 1; }
        continue;
      }
      ctx.globalAlpha = fade;
      if (p.k === 'mariposa') { const f = Math.sin(p.ph * 18) > 0; P(ctx, x - (f ? 2 : 1), y, f ? 2 : 1, 2, p.c); P(ctx, x + 1, y, f ? 2 : 1, 2, p.c); P(ctx, x, y, 1, 2, '#3a2a20'); }
      else if (p.k === 'luciernaga') { const on = 0.5 + 0.5 * Math.sin(p.ph * 3); ctx.globalAlpha = fade * on; P(ctx, x, y, 1, 1, '#f8ffa0'); ctx.globalAlpha = fade * on * 0.4; P(ctx, x - 1, y, 3, 1, '#c8ff60'); P(ctx, x, y - 1, 1, 3, '#c8ff60'); }
      else if (p.k === 'hoja') { const s = Math.sin(p.ph * 3) > 0; P(ctx, x, y, s ? 2 : 1, s ? 1 : 2, p.c); }
      else if (p.k === 'pajaro') { const up = Math.sin(p.ph * 12) > 0; P(ctx, x, y, 1, 1, '#2a2a3a'); P(ctx, x - 2, y + (up ? -1 : 1), 2, 1, '#2a2a3a'); P(ctx, x + 1, y + (up ? -1 : 1), 2, 1, '#2a2a3a'); }
      else if (p.k === 'humo') { const k = 1 - p.life / p.max; ctx.globalAlpha = 0.35 * (1 - k); const r = 1 + k * 4; P(ctx, x - r, y - r * 0.6, r * 2, r * 1.4, '#e8e4e0'); }
      else if (p.k === 'polvo') { ctx.globalAlpha = 0.35 * fade; P(ctx, x, y, 1, 1, '#d8c8b0'); }
      ctx.globalAlpha = 1;
    }
  },
  lights(cx, cy) {
    const out = [];
    for (const p of this.list) if (p.k === 'luciernaga') { const on = 0.5 + 0.5 * Math.sin(p.ph * 3); out.push({ x: p.x - cx, y: p.y - cy, r: 10, i: 0.5 * on, glow: '#d0ff80', gr: 6, gi: on }); }
    return out;
  },
};
