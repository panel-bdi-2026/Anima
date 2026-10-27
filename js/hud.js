'use strict';
// ============================================================
//  Estilo visual de la interfaz, HUD del mundo y objetivos
// ============================================================

// paneles redondeados con degradado (sustituye a los básicos)
const _round = (ctx, x, y, w, h, c) => { P(ctx, x + 2, y, w - 4, h, c); P(ctx, x + 1, y + 1, w - 2, h - 2, c); P(ctx, x, y + 2, w, h - 4, c); };
UI.box = function (ctx, x, y, w, h, style = 'light') {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  if (style === 'light') {
    ctx.globalAlpha = 0.35; _round(ctx, x + 2, y + 3, w, h, '#100818'); ctx.globalAlpha = 1;
    _round(ctx, x, y, w, h, '#2a1f3e');
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#fffcf2'); g.addColorStop(1, '#f1e7d2');
    ctx.fillStyle = g; ctx.fillRect(x + 2, y + 1, w - 4, h - 2); ctx.fillRect(x + 1, y + 2, w - 2, h - 4);
    P(ctx, x + 3, y + 2, w - 6, 1, '#ffffff');
    P(ctx, x + 2, y + h - 3, w - 4, 1, '#d9c9a6');
    P(ctx, x + 2, y + 3, 1, h - 6, '#e8dcc0'); P(ctx, x + w - 3, y + 3, 1, h - 6, '#d9c9a6');
  } else if (style === 'dark') {
    ctx.globalAlpha = 0.88; _round(ctx, x, y, w, h, '#120e20'); ctx.globalAlpha = 1;
    P(ctx, x + 2, y, w - 4, 1, '#6a5a98'); P(ctx, x + 2, y + h - 1, w - 4, 1, '#3a3060');
    P(ctx, x, y + 2, 1, h - 4, '#4a3e78'); P(ctx, x + w - 1, y + 2, 1, h - 4, '#3a3060');
    P(ctx, x + 1, y + 1, 1, 1, '#6a5a98'); P(ctx, x + w - 2, y + 1, 1, 1, '#6a5a98');
    P(ctx, x + 2, y + 1, w - 4, 1, 'rgba(255,255,255,0.08)');
  } else if (style === 'panel') {
    _round(ctx, x, y, w, h, '#2a1f3e');
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#fbf6ea'); g.addColorStop(1, '#ede3cf');
    ctx.fillStyle = g; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    P(ctx, x + 1, y + 1, w - 2, 1, '#ffffff');
  } else if (style === 'title') {
    ctx.globalAlpha = 0.35; _round(ctx, x + 2, y + 3, w, h, '#100818'); ctx.globalAlpha = 1;
    _round(ctx, x, y, w, h, '#e8b840');
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#5a4aa8'); g.addColorStop(1, '#2e2462');
    ctx.fillStyle = g; ctx.fillRect(x + 2, y + 1, w - 4, h - 2); ctx.fillRect(x + 1, y + 2, w - 2, h - 4);
    P(ctx, x + 3, y + 2, w - 6, 1, '#7a6ac8');
  }
};
UI.cursor = function (ctx, x, y, color = '#c04830') {
  const o = Math.round(Math.sin(Engine.time * 8));
  P(ctx, x + o, y, 2, 7, color); P(ctx, x + 2 + o, y + 1, 1, 5, color); P(ctx, x + 3 + o, y + 2, 1, 3, color); P(ctx, x + 4 + o, y + 3, 1, 1, color);
  P(ctx, x + o, y, 1, 1, U.shade(color, 0.25));
};

// ---------- objetivos ----------
const Objectives = {
  list: [
    [() => !Game.flag('got_starter'), 'Ve al laboratorio de la Profesora Ceiba, al sur del pueblo.'],
    [() => !G.badges[0], 'Viaja al norte hasta Villa Musgo y gana la Medalla Raíz.'],
    [() => !G.badges[1], 'Cruza la Ruta 2 y el Bosque Susurro hasta Ciudad Roca. Gana la Medalla Peña.'],
    [() => !Game.flag('vesper_done'), 'Recorre la Ruta 3 y detén al Equipo Eclipse en la Cueva Eco.'],
    [() => !G.badges[2], 'Gana la Medalla Oleaje en el gimnasio de Puerto Marea.'],
    [() => !Game.flag('chapter1_done'), 'Alguien te espera al final del muelle de Puerto Marea.'],
    [() => !Game.flag('trio_done'), 'Busca a los tres guardianes legendarios de la región.'],
    [() => !Game.flag('leg_albora'), 'Algo ha despertado en Pueblo Alba...'],
    [() => true, 'Completa el Códice Ánima.'],
  ],
  current() { if (!G) return ''; for (const [c, t] of this.list) if (c()) return t; return ''; },
};

// ---------- HUD del mundo ----------
const HUD = {
  lastObj: null, objT: 0,
  drawWorld(ctx, world) {
    if (!G || Scenes.top() !== world) { this.objT = Math.max(this.objT, 0); }
    const obj = Objectives.current();
    if (obj !== this.lastObj) { if (this.lastObj !== null && Game.flag('got_starter')) { this.objT = 6; Sound.sfx('appear'); } this.lastObj = obj; }
    // reloj y clima (esquina superior derecha)
    const day = Clock.isDay();
    const w = Weather.at(world.map);
    const txt = Clock.str();
    const bw = 64;
    UI.box(ctx, W - bw - 4, 4, bw, 17, 'dark');
    this.sunMoon(ctx, W - bw + 2, 8, day);
    Font.draw(ctx, txt, W - bw + 15, 8, '#ffffff');
    if (world.map.outdoor) Font.draw(ctx, Weather.icon(w, day), W - 16, 8, Weather.isRain(w) ? '#a0c8ff' : w === 'despejado' ? '#ffd860' : '#d0d0e0');
    // nuevo objetivo
    if (this.objT > 0) {
      this.objT -= 1 / 60;
      const a = Math.min(1, this.objT * 2, (6 - this.objT) * 4);
      ctx.globalAlpha = U.clamp(a, 0, 1);
      const lines = Font.wrap(obj, 200);
      const h = 18 + lines.length * 11;
      UI.box(ctx, W - 222, 26, 218, h, 'dark');
      Font.draw(ctx, '★ Nuevo objetivo', W - 214, 30, '#ffd048');
      lines.forEach((ln, i) => Font.draw(ctx, ln, W - 214, 43 + i * 11, '#e8e0f8'));
      ctx.globalAlpha = 1;
    }
  },
  sunMoon(ctx, x, y, day) {
    if (day) { P(ctx, x + 1, y, 5, 7, '#ffcc40'); P(ctx, x, y + 1, 7, 5, '#ffcc40'); P(ctx, x + 2, y + 1, 2, 2, '#fff4b0'); }
    else { P(ctx, x + 1, y, 5, 7, '#e0e8ff'); P(ctx, x, y + 1, 7, 5, '#e0e8ff'); P(ctx, x + 3, y, 4, 5, '#120e20'); P(ctx, x + 2, y + 1, 1, 1, '#ffffff'); }
  },
};
