'use strict';
// ============================================================
//  MODO PRÁCTICA (desde la pantalla de título)
//  Combates libres con las especies que has capturado en
//  cualquiera de tus partidas (o los iniciales si aún no tienes
//  ninguna). No afecta a ninguna partida guardada.
// ============================================================

defMap('arena_practica', {
  name: 'Campo de Práctica', music: 'battle', outdoor: true, bg: 'grass', w: 22, h: 16,
  build: [
    ['rect', 1, 1, 20, 14, '.'], ['rect', 0, 0, 22, 1, 'F'], ['rect', 0, 15, 22, 1, 'F'], ['rect', 0, 0, 1, 16, 'F'], ['rect', 21, 0, 1, 16, 'F'],
    ['rect', 3, 3, 4, 3, ','], ['rect', 15, 10, 4, 3, ','], ['rect', 9, 7, 4, 1, ':'], ['rect', 10, 6, 2, 3, ':'],
    ['pts', 'R', [[6, 10], [16, 4], [11, 12]]], ['pts', 'f', [[2, 13], [19, 2], [8, 2]]], ['rect', 14, 6, 2, 2, '~'],
  ],
});

const Practice = {
  speciesPool() {
    const ids = new Set();
    for (let i = 0; i < 3; i++) { const d = Game.slotData(i); if (d && d.caught) for (const k of Object.keys(d.caught)) ids.add(Number(k)); }
    const list = SPECIES_LIST.filter((s) => ids.has(s.id)).map((s) => s.key);
    return list.length ? { list, starters: false } : { list: ['ignito', 'burbujo', 'semillin'], starters: true };
  },
  async run(cfg) {
    const prevG = G;
    G = newGameState();
    G.name = 'Práctica'; G.rival = 'Rival'; G.practice = true;
    G.flags.tut_battle = true; G.time = 11 * 60; G.weather = 'despejado';
    Object.assign(G.bag, { pocion: 3, superpocion: 1 });
    const mine = newCreature(cfg.mine, cfg.lv);
    Game.addCreature(mine);
    G.map = 'arena_practica'; G.x = 6; G.y = 8; G.dir = 'right';
    Scenes.clear(); World.map = null; World.start();
    await Fade.in(0.4);
    World.busy++;
    let res = 'lose';
    try {
      res = await Battle.trainer({ title: 'Rival de práctica', cls: 'Práctica', name: '', party: [[cfg.foe, cfg.lv]], skill: [0.35, 0.65, 0.92][cfg.diff], practice: true, boss: cfg.diff === 2 });
    } catch (e) { console.error(e); }
    World.busy = 0;
    await say(res === 'win' ? '¡Victoria! Buen entrenamiento.' : 'Derrota... ¡La práctica hace al maestro!');
    await Fade.out(0.4);
    G = prevG;
    Scenes.clear(); World.map = null; World.battle = null;
    const ts = new TitleScreen(); ts.menu = true;
    Scenes.push(ts);
    await Fade.in(0.4);
  },
};
// la práctica nunca guarda nada
{
  const _save = Game.save, _auto = Game.autosave;
  Game.save = function (...a) { if (G && G.practice) return false; return _save.apply(this, a); };
  Game.autosave = function (...a) { if (G && G.practice) return; return _auto.apply(this, a); };
}

class PracticeSetup {
  constructor() {
    const P0 = Practice.speciesPool();
    this.list = P0.list; this.starters = P0.starters;
    this.mine = this.list[0]; this.foe = this.list.length > 1 ? this.list[1] : this.list[0];
    this.lv = 20; this.diff = 1; this.row = 0; this.opaque = true; this.t = 0;
  }
  rows() { return ['Tu ánima', 'Rival', 'Nivel', 'Dificultad', '¡A combatir!']; }
  cycle(key, d) { const i = this.list.indexOf(this[key]); this[key] = this.list[(i + d + this.list.length) % this.list.length]; Sound.sfx('blip'); }
  update(dt) {
    this.t += dt;
    const M = Input.mouse;
    if (Input.repeat('up')) { this.row = (this.row + 4) % 5; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.row = (this.row + 1) % 5; Sound.sfx('blip'); }
    if (M.inside && (M.moved || M.pressed[0])) for (let k = 0; k < 5; k++) if (M.y >= 128 + k * 18 && M.y < 146 + k * 18 && M.x > 20 && M.x < 300) this.row = k;
    const d = Input.repeat('left') ? -1 : Input.repeat('right') ? 1 : M.pressed[0] && this.row < 4 ? (M.x > 160 ? 1 : -1) : 0;
    if (d) {
      if (this.row === 0) this.cycle('mine', d);
      if (this.row === 1) this.cycle('foe', d);
      if (this.row === 2) { this.lv = U.clamp(this.lv + d * 5, 5, 60); Sound.sfx('blip'); }
      if (this.row === 3) { this.diff = (this.diff + d + 3) % 3; Sound.sfx('blip'); }
    }
    if ((Input.pressed('a') && this.row === 4) || (M.pressed[0] && this.row === 4)) { Sound.sfx('select'); this.done({ mine: this.mine, foe: this.foe, lv: this.lv, diff: this.diff }); }
    else if (Input.pressed('a') && this.row < 4) { this.row++; Sound.sfx('blip'); }
    if (Input.pressed('b') || M.pressed[2]) { Sound.sfx('cancel'); this.done(null); }
  }
  draw(ctx) {
    screenBg(ctx, '#2a3a5a', '#24334f');
    UI.box(ctx, 60, 6, 200, 20, 'title');
    Font.drawCenter(ctx, 'MODO PRÁCTICA', 160, 12, '#ffffff');
    // retratos animados
    const card = (x, key, label, flip) => {
      UI.box(ctx, x, 30, 120, 92, 'light');
      P(ctx, x + 8, 38, 104, 60, '#cfe8b8'); P(ctx, x + 8, 82, 104, 16, '#9cc884');
      drawShadow(ctx, x + 60, 92, 16, 3, 0.25);
      CreatureAnim.portrait(ctx, key, 56, false, x + 32, 38, 'prac' + label, { flip });
      Font.drawCenter(ctx, label, x + 60, 102, '#5a5070');
      Font.drawCenter(ctx, SPECIES[key].name, x + 60, 111, '#2a2236');
    };
    card(20, this.mine, 'Tú', true); card(180, this.foe, 'Rival', false);
    Font.drawCenter(ctx, 'VS', 160, 70, Math.floor(this.t * 4) % 2 ? '#ffe060' : '#ff9030');
    const vals = [SPECIES[this.mine].name, SPECIES[this.foe].name, 'Nv ' + this.lv, ['Fácil', 'Normal', 'Difícil'][this.diff], ''];
    this.rows().forEach((r, k) => {
      const y = 130 + k * 18, sel = k === this.row;
      UI.box(ctx, 20, y - 3, 280, 17, sel ? 'light' : 'dark');
      Font.draw(ctx, r, 30, y + 1, sel ? '#2a2236' : '#d8d0e8');
      if (k < 4) { Font.drawCenter(ctx, vals[k], 220, y + 1, sel ? '#2a2236' : '#ffffff'); if (sel) { Font.draw(ctx, '<', 160, y + 1, '#c04830'); Font.draw(ctx, '>', 284, y + 1, '#c04830'); } }
    });
    Font.drawCenter(ctx, this.starters ? 'Aún no has capturado ánimas: practica con los iniciales.' : `${this.list.length} especies capturadas disponibles`, 160, 224, '#b8c8e8');
  }
}
// opción en la pantalla de título
{
  const _opts = TitleScreen.prototype.options;
  TitleScreen.prototype.options = function () { const o = _opts.call(this); o.splice(o.indexOf('OPCIONES'), 0, 'PRÁCTICA'); return o; };
  const _pick = TitleScreen.prototype.pick;
  TitleScreen.prototype.pick = async function () {
    if (this.options()[this.i] !== 'PRÁCTICA') return _pick.call(this);
    this.busy = true;
    const cfg = await runScene(new PracticeSetup());
    if (!cfg) { this.busy = false; return; }
    await Fade.out(0.4);
    Scenes.pop(this);
    await Practice.run(cfg);
  };
}
