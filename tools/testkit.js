// Kit de pruebas automatizadas (solo para desarrollo; no lo carga index.html)
// Avanza el juego fotograma a fotograma, sin depender de los temporizadores del navegador.
(function () {
  const ch = new MessageChannel(); const q = [];
  ch.port1.onmessage = () => { const r = q.shift(); if (r) r(); };
  const yieldMC = () => new Promise((r) => { q.push(r); ch.port2.postMessage(0); });
  const CODES = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  window.T = {
    errors: [], frames: 0,
    async run(n = 1) {
      Engine.manual = true;
      for (let i = 0; i < n; i++) {
        Engine.update(1 / 60); Input.endFrame(); this.frames++;
        if (this.frames % 4 === 0) Engine.draw();
        for (let k = 0; k < 3; k++) await null;
        if (i % 2 === 0) await yieldMC();
      }
    },
    async sec(s) { await this.run(Math.round(s * 60)); },
    async tap(code, hold = 2) { Input.pressedKeys[code] = true; Input.held[code] = true; await this.run(hold); Input.held[code] = false; await this.run(2); },
    async holdKey(code, frames) { Input.pressedKeys[code] = true; Input.held[code] = true; await this.run(frames); Input.held[code] = false; await this.run(1); },
    top() { const s = Scenes.top(); return s === World ? 'World' : s && s.constructor ? s.constructor.name : String(s); },
    stack() { return Scenes.stack.map((s) => (s === World ? 'World' : s.constructor.name)); },
    async until(cond, maxFrames = 3000) { for (let i = 0; i < maxFrames; i++) { if (cond()) return true; await this.run(1); } return false; },
    // texto + elecciones automáticas: answers = lista de índices a elegir en los Choice que aparezcan
    async dialog(answers = [], max = 300) {
      const ans = answers.slice();
      for (let i = 0; i < max; i++) {
        const t = this.top();
        if (t === 'TextBox') { await this.tap('KeyZ'); await this.run(3); continue; }
        if (t === 'Choice') {
          const a = ans.length ? ans.shift() : 0;
          const c = Scenes.top();
          let guard = 0;
          while (c.i !== a && guard++ < 10) { await this.tap('ArrowDown'); }
          await this.tap('KeyZ'); await this.run(4); continue;
        }
        if (t === 'NameEntry') { const ne = Scenes.top(); ne.name = ne.name || 'Test'; ne.finish(); await this.run(3); continue; }
        if (t === 'EvolutionScene' || t === 'BattleTransition' || t === 'CreditsScene') { await this.run(30); continue; }
        if (t === 'IntroScene' || t === 'StarterPeek') { await this.run(5); continue; }
        return t;
      }
      return this.top();
    },
    async step(dir, n = 1) {
      const code = CODES[dir];
      for (let i = 0; i < n; i++) {
        await this.until(() => !World.player.moving && !World.busy && Scenes.top() === World, 2000);
        const p = World.player, x = p.x, y = p.y, map = World.map.id;
        p.dir = dir;
        Input.held[code] = true; Input.pressedKeys[code] = true; Input.holdTime[dir] = 0.2;
        await this.until(() => World.player.moving || World.player.x !== x || World.player.y !== y || World.map.id !== map || World.busy || Scenes.top() !== World, 20);
        Input.held[code] = false;
        await this.until(() => !World.player.moving, 120);
        await this.run(2);
        if (World.busy || Scenes.top() !== World) return 'interrupted';
        if (World.player.x === x && World.player.y === y && World.map.id === map) return 'blocked';
      }
      return 'ok';
    },
    async walk(path) {
      for (const tok of path.split(' ')) {
        const d = { u: 'up', d: 'down', l: 'left', r: 'right' }[tok[0]], n = parseInt(tok.slice(1) || '1', 10);
        const r = await this.step(d, n);
        if (r !== 'ok') return [r, ...this.pos(), this.top()];
      }
      return this.pos();
    },
    face(dir) { World.player.dir = dir; },
    async talk() { await this.tap('KeyZ'); await this.run(4); },
    pos() { const p = World.player; return [World.map.id, p.x, p.y, p.dir]; },
    async shot(name = 'shot', sc = 2) { Engine.draw(); const c = document.createElement('canvas'); c.width = W * sc; c.height = H * sc; const x = c.getContext('2d'); x.imageSmoothingEnabled = true; const g3 = typeof World3D !== 'undefined' && World3D.cv && World3D.cv.style.display !== 'none'; if (g3) x.drawImage(World3D.cv, 0, 0, W * sc, H * sc); x.imageSmoothingEnabled = false; x.drawImage(Engine.canvas, 0, 0, W * sc, H * sc); const url = c.toDataURL('image/png'); await fetch('/__shot?name=' + name, { method: 'POST', body: url }); return name; },
    async newGame() {
      await this.until(() => this.top() === 'TitleScreen', 600);
      Scenes.top().enter();
      await this.tap('KeyZ'); await this.run(5);
      if (Game.hasSave()) await this.tap('ArrowDown');
      await this.tap('KeyZ'); await this.run(10);
      if (this.top() === 'SlotScreen') { Scenes.top().i = 2; await this.tap('KeyZ'); await this.run(10); for (let k = 0; k < 20; k++) { const t = this.top(); if (t === 'TextBox') { await this.tap('KeyZ'); await this.run(3); } else if (t === 'Choice') { await this.tap('KeyZ'); await this.run(5); break; } else break; } }
      if (this.top() === 'Choice') { await this.tap('KeyZ'); await this.run(5); }
      await this.run(60);
      for (let i = 0; i < 20; i++) {
        const t = await this.dialog([1, 1]);
        if (t === 'World' && !World.busy) break;
        await this.run(20);
      }
      await this.run(60); await this.dialog();
      return this.pos();
    },
    // combate automático: el aliado persigue y usa ataques; opcionalmente captura
    async autoBattle(opts = {}) {
      const maxF = opts.maxFrames || 60 * 300;
      let f = 0;
      while (f < maxF) {
        const t = this.top();
        if (t === 'World' && !Battle.active) { for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE']) Input.held[k] = false; return 'world'; }
        const b = Battle.active;
        if (t === 'TextBox' || t === 'Choice' || t === 'NameEntry' || t === 'EvolutionScene') { for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE']) Input.held[k] = false; await this.dialog(opts.answers || [1, 1, 1]); continue; }
        if (t === 'PartyScreen') { const ps = Scenes.top(); const k = this.bestSwitch(b); ps.done(k < 0 ? 0 : k); await this.run(2); continue; }
        if (b && b.showTut) { await this.tap('KeyZ'); continue; }
        if (!b || t !== 'BattleScene' || b.state !== 'fight') { await this.run(2); f += 2; continue; }
        const a = b.ally, e = b.foe;
        if (b.swapCd <= 0 && !e.inBall && b.lastSwapFoe !== e) { b.lastSwapFoe = e; const k = this.bestSwitch(b); if (k >= 0 && G.party[k] !== a.c && this.matchScore(G.party[k], e) > this.matchScore(a.c, e) + 0.6) { Input.pressedKeys.KeyQ = true; await this.run(3); continue; } }
        const d = U.dist(a.x, a.y, e.x, e.y);
        for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) Input.held[k] = false;
        const want = opts.keepDist || 26;
        let gx = e.x, gy = e.y;
        if (b.losClear && !b.losClear(a, e)) { const v = b.navVec(a, e); if (v) { gx = a.x + v[0] * 20; gy = a.y + v[1] * 20; } }
        if (d > want || (gx !== e.x)) { if (gx > a.x + 4) Input.held.ArrowRight = true; if (gx < a.x - 4) Input.held.ArrowLeft = true; if (gy > a.y + 4) Input.held.ArrowDown = true; if (gy < a.y - 4) Input.held.ArrowUp = true; }
        if (opts.catch && b.wild && !e.inBall && e.hp / e.maxHp < (opts.catchAt || 0.5) && !b.ball && b.ballList().length) {
          if (!b.capture) { Input.pressedKeys.KeyE = true; await this.run(2); f += 2; continue; }
          const T = b.trainer;
          for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) Input.held[k] = false;
          const dd = U.dist(T.x, T.y, e.x, e.y);
          if (dd > 150) { if (e.x > T.x + 4) Input.held.ArrowRight = true; if (e.x < T.x - 4) Input.held.ArrowLeft = true; if (e.y > T.y + 4) Input.held.ArrowDown = true; if (e.y < T.y - 4) Input.held.ArrowUp = true; await this.run(2); f += 2; continue; }
          if (b.throwCd <= 0 && T.stun <= 0) {
            const dur = 0.32 + dd / 330, lead = opts.lead === undefined ? 1 : opts.lead;
            const [cx, cy] = World.cam; const m = Input.mouse;
            m.inside = true; m.last = performance.now(); m.x = e.x + e.vx * dur * lead - cx + U.rand(-(opts.aimErr || 0), opts.aimErr || 0); m.y = e.y - 2 + e.vy * dur * lead - cy;
            m.pressed[0] = true; this.throws = (this.throws || 0) + 1;
          }
          await this.run(2); f += 2; continue;
        }
        if (b.capture) { Input.pressedKeys.KeyE = true; }
        if (!e.inBall && !(opts.catch && b.wild && e.hp / e.maxHp < (opts.catchAt || 0.5) && b.ballList().length)) {
          const i = a.cds.findIndex((cd, k) => cd <= 0 && a.c.moves[k] && MOVES[a.c.moves[k]].pow > 0);
          if (i >= 0 && Math.random() < 0.5) Input.pressedKeys['Digit' + (i + 1)] = true;
          if (a.syn >= 100) { if (b.canDuo && b.canDuo('ally') && Math.random() < 0.5) Input.pressedKeys.KeyG = true; else Input.pressedKeys.KeyF = true; }
        }
        if (e.act && !e.act.fired && Math.random() < (opts.dodge || 0.3)) Input.pressedKeys.Space = true;
        await this.run(2); f += 2;
      }
      for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) Input.held[k] = false;
      return 'timeout';
    },
  };
  T.matchScore = function (c, foeF) { const sp = SPECIES[c.sp]; let off = 0; for (const mk of c.moves) { const m = MOVES[mk]; if (m.pow) off = Math.max(off, typeMult(m.type, foeF.types) * (sp.types.includes(m.type) ? 1.5 : 1)); } let def = 0; for (const mk of foeF.c.moves) { const m = MOVES[mk]; if (m.pow) def = Math.max(def, typeMult(m.type, sp.types)); } return off - def + c.hp / calcStats(c).hp; };
  T.bestSwitch = function (b) { let best = -1, bs = -99; G.party.forEach((c, i) => { if (c.hp <= 0 || (b && b.ally && c === b.ally.c && !b.ally.fainted)) return; const s = b && b.foe ? this.matchScore(c, b.foe) : 0; if (s > bs) { bs = s; best = i; } }); return best; };
  window.addEventListener('error', (e) => T.errors.length < 40 && T.errors.push(String(e.message) + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  window.addEventListener('unhandledrejection', (e) => T.errors.push('Promise: ' + ((e.reason && e.reason.stack) || e.reason)));
  const _ce = console.error; console.error = function (...a) { if (T.errors.length < 40) T.errors.push(a.map((x) => (x && x.stack) || String(x)).join(' ')); _ce.apply(console, a); };
  const _cw = console.warn; console.warn = function (...a) { T.errors.push('WARN ' + a.map(String).join(' ')); _cw.apply(console, a); };
})();
T.quick = async function (opts = {}) {
  for (let i = 0; i < 200 && !(Scenes.top() && Scenes.top().constructor.name === 'TitleScreen') && !G; i++) await new Promise((r) => setTimeout(r, 20));
  Engine.manual = true;
  G = newGameState();
  G.name = 'Test'; G.rival = 'Rival';
  for (const [k, lv] of (opts.party || [['burbujo', 5]])) Game.addCreature(newCreature(k, lv));
  for (const f of (opts.flags || ['met_prof', 'got_starter', 'got_dex', 'rival1_left', 'tut_battle', 'mom_talk', 'starter_taken_buppa', 'starter_taken_parker'])) G.flags[f] = true;
  G.rivalStarter = 'semillin';
  Object.assign(G.bag, opts.bag || { esfera: 10, pocion: 5 });
  G.map = opts.map || 'pueblo_alba'; G.x = opts.x !== undefined ? opts.x : 12; G.y = opts.y !== undefined ? opts.y : 10;
  Scenes.clear(); World.map = null; World.start(); Fade.a = 0;
  await this.run(30);
  return this.pos();
};
T.wildTest = async function (sp, lv) { World.runScript(async () => { await Battle.wild(newCreature(sp, lv)); }); await this.run(150); return this.top(); };
// ---------- bot de navegación ----------
T.passable = function (x, y, goal) {
  const t = World.tileAt(x, y);
  if (!t || t.solid) return false;
  if (World.itemAt(x, y) || World.starterAt(x, y)) return false;
  if (World.npcAt(x, y) || (typeof Gather !== 'undefined' && Gather.at(x, y))) return false;
  if (!goal && World.map.warps.some((w) => w.x === x && w.y === y)) return false;
  return true;
};
T.path = function (tx, ty, opts = {}) {
  const m = World.map, sx = World.player.x, sy = World.player.y;
  const key = (x, y) => y * 1000 + x;
  const prev = new Map(); prev.set(key(sx, sy), null);
  const qq = [[sx, sy]];
  const dirs = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
  while (qq.length) {
    const [x, y] = qq.shift();
    if (x === tx && y === ty) {
      const out = []; let k = key(x, y);
      while (prev.get(k)) { const p = prev.get(k); out.unshift(p.d); k = p.from; }
      return out;
    }
    for (const [d, dx, dy] of dirs) {
      let nx = x + dx, ny = y + dy;
      const t = World.tileAt(nx, ny);
      if (t && t.ledge) { if (d !== 'down') continue; ny += 1; }
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
      const goal = nx === tx && ny === ty;
      if (!this.passable(nx, ny, goal) && !(goal && opts.adjacentOk)) continue;
      if (t && !t.ledge && !goal && opts.avoidGrass && t.grass) continue;
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      prev.set(k, { from: key(x, y), d });
      qq.push([nx, ny]);
    }
  }
  return null;
};
T.settle = async function (opts = {}) {
  for (let i = 0; i < 400; i++) {
    const t = this.top();
    if (t === 'World' && !World.busy && !Battle.active) return true;
    if (t === 'BattleScene' || Battle.active) { const r = await this.autoBattle(opts.battle || {}); continue; }
    if (t === 'TextBox' || t === 'Choice' || t === 'NameEntry' || t === 'EvolutionScene' || t === 'CreditsScene' || t === 'BattleTransition') { await this.dialog(opts.answers || [0, 1]); continue; }
    if (t === 'PartyScreen' || t === 'BagScreen') { Scenes.top().done(-1); await this.run(2); continue; }
    await this.run(5);
  }
  return false;
};
T.goto = async function (tx, ty, opts = {}) {
  const startMap = World.map.id;
  for (let attempt = 0; attempt < 400; attempt++) {
    await this.settle(opts);
    if (World.map.id !== startMap) return 'warped';
    const p = World.player;
    if (p.x === tx && p.y === ty) return true;
    const path = this.path(tx, ty, opts);
    if (!path) { await this.run(30); continue; }
    if (!path.length) return true;
    const mapId = World.map.id;
    await this.step(path[0]);
    await this.settle(opts);
    if (World.map.id !== mapId) return 'warped';
  }
  return false;
};
T.graph = function () {
  const g = {};
  for (const id in MAPS) {
    const m = MAPS[id]; g[id] = [];
    for (const w of m.warps) g[id].push({ to: w.to, kind: 'warp', w });
    if (m.edges) for (const k in m.edges) g[id].push({ to: m.edges[k].to, kind: 'edge', k, e: m.edges[k] });
  }
  return g;
};
T.route = function (from, to) {
  const g = this.graph(), prev = { [from]: null }, qq = [from];
  while (qq.length) { const c = qq.shift(); if (c === to) break; for (const e of g[c]) if (!(e.to in prev)) { prev[e.to] = { c, e }; qq.push(e.to); } }
  if (!(to in prev)) return null;
  const hops = []; let c = to; while (prev[c]) { hops.unshift(prev[c].e); c = prev[c].c; } return hops;
};
T.exitVia = async function (hop, opts = {}) {
  const m = World.map;
  if (hop.kind === 'warp') {
    const w = hop.w;
    const r = await this.goto(w.x, w.y, opts);
    if (r === 'warped' || World.map.id === hop.to) return true;
    // ya encima (tapete): pulsar hacia abajo
    if (w.mat) { await this.step('down'); }
    return World.map.id === hop.to;
  }
  // borde: buscar casilla de salida transitable
  const k = hop.k, T2 = MAPS[hop.to], cands = [];
  for (let i = 0; i < (k === 'n' || k === 's' ? m.w : m.h); i++) {
    const x = k === 'n' || k === 's' ? i : k === 'w' ? 0 : m.w - 1;
    const y = k === 'n' || k === 's' ? (k === 'n' ? 0 : m.h - 1) : i;
    if (!this.passable(x, y, true)) continue;
    let dx, dy;
    if (k === 'n') { dx = x + hop.e.d; dy = T2.h - 1; } else if (k === 's') { dx = x + hop.e.d; dy = 0; } else if (k === 'w') { dx = T2.w - 1; dy = y + hop.e.d; } else { dx = 0; dy = y + hop.e.d; }
    const tt = TILEDEF[T2.rows[dy] && T2.rows[dy][dx]];
    if (tt && !tt.solid) cands.push([x, y]);
  }
  for (const [x, y] of cands) {
    const r = await this.goto(x, y, opts);
    if (r === true) { await this.step({ n: 'up', s: 'down', w: 'left', e: 'right' }[k]); await this.settle(opts); if (World.map.id === hop.to) return true; }
  }
  return false;
};
T.travel = async function (to, opts = {}) {
  for (let i = 0; i < 20 && World.map.id !== to; i++) {
    await this.settle(opts);
    const hops = this.route(World.map.id, to);
    if (!hops) return 'noroute';
    const ok = await this.exitVia(hops[0], opts);
    if (!ok) return ['stuck', ...this.pos()];
    await this.settle(opts);
  }
  return World.map.id === to ? true : ['fail', ...this.pos()];
};
T.talkTo = async function (id, opts = {}) {
  const n = World.npc(id); if (!n) return 'nonpc';
  const adj = [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']];
  for (const [dx, dy, face] of adj) {
    let x = n.x + dx, y = n.y + dy;
    if (World.charAt(n.x + dx, n.y + dy) === 'n') { x += dx; y += dy; } // detrás del mostrador
    if (!this.passable(x, y, true) && !(World.player.x === x && World.player.y === y)) continue;
    const r = await this.goto(x, y, opts);
    if (r !== true) continue;
    World.player.dir = face;
    await this.talk();
    return true;
  }
  return 'unreachable';
};
T.heal = function () { Game.healAll(); };
T.sim = async function (party, foe, opts = {}) {
  await this.quick({ party, map: 'ruta1', x: 10, y: 8 });
  let res = null; const f0 = this.frames;
  World.runScript(async () => {
    res = foe.wild ? await Battle.wild(newCreature(foe.wild[0], foe.wild[1])) : await Battle.trainer({ title: 'Sim', cls: 'Joven', name: 'Sim', party: foe.party, skill: opts.skill });
  });
  await this.run(5);
  await this.autoBattle({ dodge: opts.dodge || 0.5, keepDist: opts.keepDist, maxFrames: 60 * 200 });
  await this.settle({ answers: [1, 1] });
  const hp = G.party.map((c) => Math.round((100 * c.hp) / calcStats(c).hp));
  return { res, secs: Math.round((this.frames - f0) / 60), hp };
};
// ---------- partida completa automatizada ----------
T.lvlTo = function (lv) { for (const c of G.party) if (c.lv < lv) { const evs = gainExp(c, expFor(lv) - c.exp); for (const e of evs) if (e.learn && !c.moves.includes(e.learn)) { if (c.moves.length < 4) c.moves.push(e.learn); else c.moves[U.randi(0, 3)] = e.learn; } const to = evoTarget(c, { map: G.map }); if (to) evolve(c, to); c.hp = calcStats(c).hp; } };
T.gym = async function (n, opt) { await this.travel('gym' + n); await this.goto(6, 4, opt); await this.settle(opt); await this.talkTo('g' + n + '_guide', opt); await this.settle(opt); await this.talkTo('g' + n + '_leader', opt); await this.settle(opt); };
T.fullRun = async function (starterX, plan, log = []) {
  const L = (m) => { log.push(m + ' @' + this.pos().join(',')); };
  const opt = { battle: { catch: true, catchAt: 0.45, dodge: 0.5 }, answers: [0, 1] };
  await this.newGame(); L('newgame');
  await this.travel('lab'); await this.talkTo('prof'); await this.settle(opt);
  await this.goto(starterX, 4); this.face('down'); await this.talk(); await this.settle({ answers: [0, 1] }); L('starter ' + G.party.map((c) => c.sp));
  const add = (k, lv) => { if (G.party.length < 6) { const c = newCreature(k, lv); Game.addCreature(c); } };
  add('pipio', 6); add('larvita', 5);
  const seg = async (lv, fn, name) => { this.lvlTo(lv); Game.healAll(); await fn(); L(name + ' badges=' + G.badges.filter(Boolean).length + ' party=' + G.party.map((c) => c.sp + c.lv).join('/')); };
  await seg(plan[0], async () => { await this.gym(1, opt); }, 'gym1');
  if (!G.badges[0]) { this.lvlTo(plan[0] + 4); Game.healAll(); await this.gym(1, opt); L('gym1 retry ' + G.badges[0]); }
  add('hongui', 10);
  await seg(plan[1], async () => { await this.gym(2, opt); }, 'gym2');
  if (!G.badges[1]) { this.lvlTo(plan[1] + 4); Game.healAll(); await this.gym(2, opt); L('gym2 retry ' + G.badges[1]); }
  await seg(plan[2], async () => { await this.travel('ciudad_roca'); for (let k = 0; k < 3 && !Game.flag('rival2_done'); k++) { Game.healAll(); await this.travel('ruta3'); await this.settle(opt); } }, 'rival2=' + Game.flag('rival2_done'));
  await seg(plan[3], async () => { await this.travel('cueva'); for (let k = 0; k < 3 && !Game.flag('vesper_done'); k++) { Game.healAll(); await this.travel('cueva'); await this.goto(28, 12); await this.settle(opt); } }, 'vesper');
  add('voltin', 18);
  await seg(plan[4], async () => { await this.travel('puerto_marea'); await this.gym(3, opt); }, 'gym3');
  if (!G.badges[2]) { this.lvlTo(plan[4] + 4); Game.healAll(); await this.gym(3, opt); L('gym3 retry ' + G.badges[2]); }
  await seg(plan[5], async () => { for (let k = 0; k < 3 && !Game.flag('chapter1_done'); k++) { Game.healAll(); await this.travel('puerto_marea'); await this.goto(26, 11); await this.step('right'); for (let i = 0; i < 40; i++) { await this.settle(opt); if (Game.flag('chapter1_done') || !World.busy) break; } } }, 'ending=' + Game.flag('chapter1_done'));
  return { log, errors: this.errors.slice(), caught: Object.keys(G.caught).length, box: G.box.length, flags: Object.keys(G.flags).length, money: G.money };
};
T.duel = async function (a, f, skill = 0.6, boss = true) {
  await T.quick({ party: [a], map: 'ruta1', x: 10, y: 8 }); let res = null; const f0 = T.frames;
  let dealt = 0, taken = 0, hitsT = 0, hitsD = 0;
  World.runScript(async () => { res = await Battle.trainer({ title: 'Sim', cls: 'Líder', name: 'Sim', party: [f], skill, boss }); });
  await T.run(5);
  await T.until(() => Battle.active && Battle.active.state === 'fight', 600);
  const b = Battle.active; const oh = b.hit.bind(b);
  b.hit = function (tgt, att, m, mult, ang) { const h0 = tgt.hp; oh(tgt, att, m, mult, ang); const d = h0 - tgt.hp; if (d > 0) { if (tgt.side === 'foe') { dealt += d; hitsD++; } else { taken += d; hitsT++; } } };
  const allyMax = b.ally.maxHp, foeMax = b.foe.maxHp;
  await T.autoBattle({ dodge: 0.6, maxFrames: 60 * 120 }); await T.settle({ answers: [1, 1] });
  return { res, secs: Math.round((T.frames - f0) / 60), allyMax, foeMax, dealt, hitsD, taken, hitsT };
};
// ---------- prueba de estrés con entradas aleatorias ----------
T.fuzz = async function (frames = 6000, opts = {}) {
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyZ', 'KeyX', 'Enter', 'Escape', 'Space', 'KeyE', 'KeyQ', 'KeyR', 'KeyF', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'ShiftLeft', 'KeyG', 'KeyC', 'KeyM', 'Digit6'];
  const weights = opts.weights || {};
  const m = Input.mouse;
  const stacks = {};
  let last = '', same = 0, maxSame = 0;
  for (let f = 0; f < frames; f += 6) {
    for (const k of keys) if (Input.held[k] && Math.random() < 0.3) Input.held[k] = false;
    const r = Math.random();
    if (r < 0.55) {
      const k = Math.random() < 0.5 ? keys[U.randi(0, 3)] : U.choice(keys);
      if ((weights[k] || 1) >= Math.random()) { Input.pressedKeys[k] = true; Input.held[k] = true; }
    } else if (r < 0.8) {
      m.inside = true; m.moved = true; m.last = performance.now(); m.x = U.rand(0, W); m.y = U.rand(0, H);
      if (Math.random() < 0.4) m.pressed[U.choice([0, 0, 0, 2, 1])] = true;
      if (Math.random() < 0.1) m.wheel = U.choice([-1, 1]);
    }
    if (opts.noEscape) { Input.pressedKeys.Escape = false; }
    await this.run(6);
    const st = this.stack().join('>') + '|' + (World.map ? World.map.id : '') + '|' + (Battle.active ? Battle.active.state : '');
    stacks[st] = (stacks[st] || 0) + 1;
    if (st === last) { same++; maxSame = Math.max(maxSame, same); } else { same = 0; last = st; }
    if (opts.stop && opts.stop()) break;
  }
  for (const k of keys) Input.held[k] = false;
  return { states: Object.keys(stacks).length, top: Object.entries(stacks).sort((a, b) => b[1] - a[1]).slice(0, 6), maxSame };
};
