// Maquetas del menú del equipo (solo para capturas): window.MAQ = 'A' | 'B' | 'C'
(function () {
  const WD = 426;
  const icon = (c) => (c.shiny ? FrameSprites.iconShiny(c.sp) : FrameSprites.icon(c.sp));
  // ánima a tamaño real (1:1), animada en reposo, recortada al recuadro
  function grande(ctx, c, x, y, w, h, key) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const size = FrameSprites.DATA[c.sp][0];
    CreatureAnim.portrait(ctx, c.sp, size === 80 ? 80 : 80, c.shiny, x + w / 2 - 40, y + h - 84, key, { scale: 1 });
    ctx.restore();
  }
  function ps(ctx, c, x, y, w) {
    const st = calcStats(c), r = Math.max(0, c.hp) / st.hp;
    P(ctx, x, y, w, 4, '#2a2236'); P(ctx, x + 1, y + 1, Math.round((w - 2) * r), 2, UI.hpColor(r));
  }
  function fondo(ctx, a, b) {
    P(ctx, 0, 0, WD, H, a);
    ctx.fillStyle = b;
    for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < WD; x += 8) ctx.fillRect(x, y, 1, 1);
  }
  const _draw = PartyScreen.prototype.draw;
  PartyScreen.prototype.draw = function (ctx) {
    const M = window.MAQ;
    if (!M) return _draw.call(this, ctx);
    const party = G.party, cur = party[this.i];
    if (M === 'A') {
      // Vitrina: la elegida grande a la izquierda; la lista de íconos a tamaño real a la derecha
      fondo(ctx, '#231d33', '#2e2742');
      const tc = TYPES[SPECIES[cur.sp].types[0]].color;
      P(ctx, 8, 8, 170, 224, '#14101e'); P(ctx, 9, 9, 168, 222, U.mix(tc, '#231d33', 0.72));
      ctx.globalAlpha = 0.35; pixCircle(ctx, 93, 120, 52, U.mix(tc, '#ffffff', 0.3)); ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.4; P(ctx, 50, 142, 86, 4, '#0a0812'); ctx.globalAlpha = 1;
      grande(ctx, cur, 9, 54, 168, 96, 'maqA');
      Font.draw(ctx, cName(cur), 16, 14, '#ffffff');
      Font.drawRight(ctx, 'Nv ' + cur.lv, 170, 14, '#e0d8f0');
      SPECIES[cur.sp].types.forEach((t, k) => UI.typeBadge(ctx, t, 16 + k * 33, 28));
      const st = calcStats(cur);
      Font.draw(ctx, 'PS', 16, 160, '#ffd060'); ps(ctx, cur, 34, 162, 136);
      Font.drawRight(ctx, `${cur.hp}/${st.hp}`, 170, 170, '#ffffff');
      Font.draw(ctx, 'ATQ ' + st.atk + '   DEF ' + st.def, 16, 186, '#c8c0dc');
      Font.draw(ctx, 'ESP ' + st.esp + '   VEL ' + st.vel, 16, 198, '#c8c0dc');
      if (cur.held) { ctx.drawImage(Icons.item(cur.held), 16, 211); Font.draw(ctx, ITEMS[cur.held].name, 34, 214, '#e0d8f0'); }
      party.forEach((c, i) => {
        const y = 8 + i * 37, sel = i === this.i;
        P(ctx, 186, y, 232, 35, sel ? '#ffd060' : '#14101e'); P(ctx, 187, y + 1, 230, 33, sel ? '#3d3356' : '#2b2440');
        const ic = icon(c); if (ic) ctx.drawImage(ic, 190, y + 2 - (sel ? Math.floor(Engine.time * 4) % 2 : 0));
        Font.draw(ctx, cName(c), 228, y + 6, '#ffffff');
        Font.draw(ctx, 'Nv' + c.lv, 228, y + 19, '#b8b0cc');
        ps(ctx, c, 300, y + 10, 108);
        Font.drawRight(ctx, `${c.hp}/${calcStats(c).hp}`, 408, y + 19, '#e0d8f0');
      });
      return;
    }
    if (M === 'B') {
      // Dos columnas: tarjetas con el ícono al doble (píxeles nítidos)
      fondo(ctx, '#e9e2d0', '#ddd3bd');
      party.forEach((c, i) => {
        const col = i % 2, row = Math.floor(i / 2), x = 8 + col * 207, y = 8 + row * 74, w = 203, hh = 70, sel = i === this.i;
        const tc = TYPES[SPECIES[c.sp].types[0]].color;
        P(ctx, x, y, w, hh, sel ? '#e0a030' : '#5a4a3a'); P(ctx, x + 1, y + 1, w - 2, hh - 2, sel ? '#fffaf0' : '#f6f1e6');
        P(ctx, x + 4, y + 4, 62, 62, U.mix(tc, '#ffffff', 0.7));
        const ic = icon(c);
        if (ic) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(ic, x + 3, y + 3 - (sel ? Math.floor(Engine.time * 4) % 2 : 0), 64, 64); ctx.restore(); }
        Font.draw(ctx, cName(c), x + 72, y + 8, '#2a2236');
        Font.drawRight(ctx, 'Nv' + c.lv, x + w - 8, y + 8, '#5a5068');
        SPECIES[c.sp].types.forEach((t, k) => UI.typeBadge(ctx, t, x + 72 + k * 33, y + 22));
        Font.draw(ctx, 'PS', x + 72, y + 40, '#c07818'); ps(ctx, c, x + 88, y + 42, w - 96);
        Font.drawRight(ctx, `${c.hp}/${calcStats(c).hp}`, x + w - 8, y + 52, '#2a2236');
      });
      return;
    }
    if (M === 'C') {
      // Cuadrícula 3×2: cada ánima a tamaño real, como en un álbum
      fondo(ctx, '#1f2a24', '#27352d');
      party.forEach((c, i) => {
        const col = i % 3, row = Math.floor(i / 3), x = 6 + col * 139, y = 6 + row * 116, w = 135, hh = 112, sel = i === this.i;
        const tc = TYPES[SPECIES[c.sp].types[0]].color;
        P(ctx, x, y, w, hh, sel ? '#ffd060' : '#0e1410'); P(ctx, x + 1, y + 1, w - 2, hh - 2, U.mix(tc, '#1f2a24', 0.78));
        ctx.globalAlpha = 0.4; P(ctx, x + 40, y + 78, 56, 3, '#000'); ctx.globalAlpha = 1;
        grande(ctx, c, x + 1, y + 1, w - 2, 82, 'maqC' + i);
        P(ctx, x + 1, y + 84, w - 2, hh - 85, '#141c17');
        Font.draw(ctx, cName(c), x + 6, y + 88, '#ffffff');
        Font.drawRight(ctx, 'Nv' + c.lv, x + w - 6, y + 88, '#b8c8b8');
        ps(ctx, c, x + 6, y + 102, w - 12);
      });
    }
  };
  PartyScreen.prototype.wide = true;
})();
