'use strict';
// ============================================================
//  PUZZLES
//  - Rocas que se empujan sobre placas de presión.
//  - Cristales encadenados: tocar uno cambia también a sus vecinos;
//    hay que encenderlos todos.
//  - Al resolverlos, una compuerta se hunde y abre una cámara con
//    tesoro. Una piedra rúnica junto a cada puzzle da la pista y
//    permite reiniciarlo.
//  Lugares: Cueva Eco (rocas), Gruta Umbral (cristales) y, a veces,
//  un sello en los pisos de las Grietas Ánima.
// ============================================================
const PZ_SOLID = {
  boulder: { t: 'pz_boulder', solid: true },
  gate: { t: 'pz_gate', solid: true },
  crystal: { t: 'pz_crystal', solid: true },
  tablet: { t: 'pz_tablet', solid: true },
};

// ---------- definición de los puzzles fijos ----------
{
  const carve = (m, cells, ch) => { for (const [x, y] of cells) m.rows[y] = m.rows[y].slice(0, x) + ch + m.rows[y].slice(x + 1); };
  // Cueva Eco: la Cámara del Eco
  const cv = MAPS.cueva;
  carve(cv, [[22, 10], [23, 10], [24, 10], [22, 11], [23, 11], [24, 11], [22, 12], [23, 12], [24, 12], [21, 11]], 'c');
  carve(cv, [[10, 10], [16, 12], [13, 9]], 'o');
  cv.items.push({ x: 24, y: 10, item: 'llave_esencia', qty: 2, flag: 'it_cv_pz1' }, { x: 24, y: 12, item: 'ultraesfera', qty: 3, flag: 'it_cv_pz2' });
  cv.puzzle = {
    id: 'cueva_eco', kind: 'boulders', name: 'Cámara del Eco',
    boulders: [[8, 11], [14, 11], [18, 10]], plates: [[12, 9], [6, 12], [19, 12]], gate: [[21, 11]], tablet: [20, 9],
    hint: ['Una piedra rúnica con grabados antiguos:', '"Tres piedras despiertan el eco. Llévalas a su lugar y la cámara se abrirá."', '(Empuja las rocas caminando contra ellas.)'],
  };
  // Gruta Umbral: el Santuario de Cristal
  const gu = MAPS.gruta_umbral;
  carve(gu, [[7, 9], [8, 9], [7, 10], [8, 10], [7, 11], [8, 11], [9, 10]], 'c');
  gu.items.push({ x: 7, y: 9, item: 'llave_esencia', qty: 2, flag: 'it_gu_pz1' }, { x: 7, y: 11, item: 'semilla_umbria', qty: 1, flag: 'it_gu_pz2' });
  gu.puzzle = {
    id: 'gruta_umbral', kind: 'crystals', name: 'Santuario de Cristal',
    crystals: [[11, 9], [13, 9], [15, 9], [17, 9], [19, 9]], start: [1, 3], gate: [[9, 10]], tablet: [10, 8],
    hint: ['Una piedra rúnica con grabados antiguos:', '"Cuando los cinco cristales brillen a la vez, el santuario despertará."', '(Al tocar un cristal también cambian sus vecinos.)'],
  };
}

const Puzzles = {
  cur: null, idx: new Map(), objs: [], anim: 0,
  // estado de la sala actual
  setup(world) {
    const m = world.map, P = m.puzzle;
    this.cur = P || null; this.idx = new Map(); this.objs = [];
    if (!P) return;
    const solved = this.solved(P);
    const add = (k, x, y, extra) => { const o = Object.assign({ k, x, y, px: x * 16, py: y * 16 }, extra || {}); this.objs.push(o); return o; };
    if (P.kind === 'boulders') {
      P.boulders.forEach(([x, y], i) => { const [bx, by] = solved ? P.plates[i] : [x, y]; add('boulder', bx, by); });
      for (const [x, y] of P.plates) add('plate', x, y);
    } else {
      const lit = P.crystals.map(() => true);
      if (!solved) for (const i of P.start) this.toggle(lit, i);
      P.crystals.forEach(([x, y], i) => add('crystal', x, y, { i, lit: lit[i], glow: lit[i] ? 1 : 0 }));
    }
    for (const [x, y] of P.gate) add('gate', x, y, { open: solved ? 1 : 0 });
    if (P.tablet) add('tablet', P.tablet[0], P.tablet[1]);
    this.reindex();
  },
  solved(P) { return !!(G && G.flags['pz_' + P.id]); },
  reindex() {
    this.idx = new Map();
    for (const o of this.objs) {
      if (o.k === 'plate') continue;
      if (o.k === 'gate' && this.solved(this.cur)) continue;
      this.idx.set(o.y * 1000 + o.x, o);
    }
  },
  at(x, y) { const o = this.idx.get(y * 1000 + x); return o ? PZ_SOLID[o.k] : null; },
  objAt(x, y) { return this.idx.get(y * 1000 + x) || null; },
  toggle(lit, i) { for (const j of [i - 1, i, i + 1]) if (j >= 0 && j < lit.length) lit[j] = !lit[j]; },
  // ---------- rocas ----------
  tryPush(world, dir) {
    const P = this.cur; if (!P || P.kind !== 'boulders' || this.solved(P)) return false;
    if (this.anim > 0) return this.objAt(world.player.x + DIRS[dir][0], world.player.y + DIRS[dir][1]) ? 'blocked' : false;
    const p = world.player, [dx, dy] = DIRS[dir], o = this.objAt(p.x + dx, p.y + dy);
    if (!o || o.k !== 'boulder') return false;
    const nx = o.x + dx, ny = o.y + dy;
    const t = world.tileAt(nx, ny), m = world.map;
    const bad = !t || t.solid || t.water || t.ledge || world.npcAt(nx, ny) || world.itemAt(nx, ny) || m.warps.some((w) => w.x === nx && w.y === ny) || (world.follower.x === nx && world.follower.y === ny && !world.follower.hidden);
    if (bad) { world.bump(); return 'blocked'; }
    o.x = nx; o.y = ny; this.anim = 0.22;
    Sound.sfx('rock'); Shake.start(1, 0.1);
    this.reindex();
    // ¿todas las placas cubiertas?
    const onPlate = P.plates.filter(([x, y]) => this.objs.some((b) => b.k === 'boulder' && b.x === x && b.y === y)).length;
    if (onPlate > (this.lastOn || 0)) Sound.sfx('select');
    this.lastOn = onPlate;
    if (onPlate === P.plates.length) this.solve(world);
    return 'pushed';
  },
  // ---------- cristales y piedra rúnica ----------
  async interact(world, o) {
    const P = this.cur;
    if (o.k === 'tablet') {
      await say(P.hint);
      if (this.solved(P)) { await say('La cámara ya está abierta.'); return; }
      if ((await ask('¿Reiniciar el puzzle?', ['Sí', 'No'])) === 0) { this.setup(world); if (typeof World3D !== 'undefined') World3D.mapId = null; Sound.sfx('shadow'); }
      return;
    }
    if (o.k === 'crystal') {
      if (this.solved(P)) { await say('El cristal brilla con una luz serena.'); return; }
      const lit = this.objs.filter((c) => c.k === 'crystal').sort((a, b) => a.i - b.i);
      const st = lit.map((c) => c.lit); this.toggle(st, o.i);
      lit.forEach((c, k) => { c.lit = st[k]; });
      Sound.sfx(st[o.i] ? 'buff' : 'blip');
      if (st.every(Boolean)) this.solve(world);
    }
  },
  solve(world) {
    const P = this.cur;
    Game.setFlag('pz_' + P.id);
    this.reindex();
    world.runScript(async () => {
      await wait(0.35);
      Sound.sfx('rock'); Shake.start(3, 0.6);
      for (const g of this.objs) if (g.k === 'gate') g.opening = true;
      await wait(0.7);
      Sound.jingle('item');
      await say(`¡Se ha abierto ${P.name}!`);
    });
  },
  update(dt) {
    this.anim = Math.max(0, this.anim - dt);
    for (const o of this.objs) {
      o.px += (o.x * 16 - o.px) * Math.min(1, dt * 14); o.py += (o.y * 16 - o.py) * Math.min(1, dt * 14);
      if (o.k === 'gate' && o.opening) o.open = Math.min(1, (o.open || 0) + dt * 1.2);
      if (o.k === 'crystal') o.glow += ((o.lit ? 1 : 0) - o.glow) * Math.min(1, dt * 8);
    }
  },
  // ---------- dibujo clásico (2D) ----------
  draw2d(ctx, cx, cy) {
    const t = Engine.time;
    for (const o of this.objs) {
      const x = Math.round(o.px - cx), y = Math.round(o.py - cy);
      if (x < -16 || y < -24 || x > W || y > H) continue;
      if (o.k === 'plate') {
        const on = this.objs.some((b) => b.k === 'boulder' && b.x === o.x && b.y === o.y);
        P(ctx, x + 2, y + 2, 12, 12, '#2a2430'); P(ctx, x + 3, y + 3, 10, 10, on ? '#60e0ff' : '#6a6478');
        P(ctx, x + 6, y + 5, 4, 6, on ? '#e0ffff' : '#4a4458'); P(ctx, x + 5, y + 7, 6, 2, on ? '#e0ffff' : '#4a4458');
      } else if (o.k === 'boulder') {
        drawShadow(ctx, x + 8, y + 14, 7, 2, 0.35);
        pixCircle(ctx, x + 8, y + 7, 7, '#2a2430'); pixCircle(ctx, x + 8, y + 7, 6, '#8a8094'); pixCircle(ctx, x + 6, y + 5, 3, '#aaa0b4');
        P(ctx, x + 7, y + 6, 3, 1, '#5a5468'); P(ctx, x + 8, y + 5, 1, 3, '#5a5468');
      } else if (o.k === 'gate') {
        const k = o.open || 0; if (k >= 1) continue;
        const h = Math.round(16 * (1 - k));
        P(ctx, x, y + 16 - h, 16, h, '#3a3440'); for (let i = 2; i < 16; i += 4) P(ctx, x + i, y + 16 - h, 2, h, '#8a8098');
        P(ctx, x, y + 16 - h, 16, 2, '#5a5468');
      } else if (o.k === 'crystal') {
        const col = o.glow > 0.5 ? '#80f0ff' : '#5a3a8a';
        if (o.glow > 0.05) { ctx.globalAlpha = 0.35 * o.glow; pixCircle(ctx, x + 8, y + 4, 9, '#80f0ff'); ctx.globalAlpha = 1; }
        drawShadow(ctx, x + 8, y + 14, 5, 2, 0.3);
        for (let i = 0; i < 8; i++) { const w = i < 4 ? i * 2 + 1 : (8 - i) * 2 - 1; P(ctx, x + 8 - (w >> 1), y - 2 + i * 2, w, 2, i < 4 ? U.shade(col, 0.2) : col); }
        if (o.glow > 0.5 && Math.floor(t * 4 + o.i) % 5 === 0) P(ctx, x + 6, y, 2, 2, '#ffffff');
      } else if (o.k === 'tablet') {
        drawShadow(ctx, x + 8, y + 14, 6, 2, 0.3);
        P(ctx, x + 3, y - 4, 10, 18, '#2a2430'); P(ctx, x + 4, y - 3, 8, 16, '#7a7488');
        for (let i = 0; i < 3; i++) P(ctx, x + 5, y + i * 4, 6, 1, '#c0e8ff');
      }
    }
  },
};

// ---------- integración con el mundo ----------
{
  const _ta = World.tileAt;
  World.tileAt = function (x, y) {
    if (Puzzles.idx.size && this.map === Puzzles.map) { const o = Puzzles.at(x, y); if (o) return o; }
    return _ta.call(this, x, y);
  };
  const _load = World.loadMap;
  World.loadMap = function (id, ...rest) {
    Puzzles.idx = new Map(); Puzzles.map = null;
    const r = _load.call(this, id, ...rest);
    Puzzles.map = this.map; Puzzles.setup(this);
    return r;
  };
  const _try = World.tryMove;
  World.tryMove = function (dir) {
    const p = this.player;
    const r = p.dir === dir ? Puzzles.tryPush(this, dir) : false;
    if (r === 'blocked') return;
    // al empujar, el jugador avanza a la casilla que deja libre la roca
    return _try.call(this, dir);
  };
  const _int = World.interact;
  World.interact = function () {
    const p = this.player, [dx, dy] = DIRS[p.dir], o = Puzzles.objAt(p.x + dx, p.y + dy);
    if (o && (o.k === 'crystal' || o.k === 'tablet')) { this.runScript(() => Puzzles.interact(this, o)); return; }
    return _int.call(this);
  };
  const _upd = World.update;
  World.update = function (dt) {
    Puzzles.update(dt);
    // seguridad: si las rocas encierran al jugador, el puzzle se reinicia solo
    const P = Puzzles.cur, p = this.player;
    if (P && P.kind === 'boulders' && Puzzles.map === this.map && !Puzzles.solved(P) && !p.moving && !this.busy && Scenes.top() === this) {
      const stuck = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => { const o = Puzzles.objAt(p.x + dx, p.y + dy); if (o && o.k === 'boulder') { const t = this.tileAt(o.x + dx, o.y + dy); return !t || t.solid; } return this.blocked(p.x + dx, p.y + dy, p); });
      Puzzles.stuckT = stuck ? (Puzzles.stuckT || 0) + dt : 0;
      if (Puzzles.stuckT > 1.2) { Puzzles.stuckT = 0; this.runScript(async () => { await say('Las rocas tiemblan y vuelven a su sitio...'); Puzzles.setup(this); if (typeof World3D !== 'undefined') World3D.mapId = null; Sound.sfx('shadow'); }); }
    }
    return _upd.call(this, dt);
  };
  const _fx = World.drawTerrainFX;
  World.drawTerrainFX = function (ctx, cx, cy) { if (_fx) _fx.call(this, ctx, cx, cy); if (Puzzles.map === this.map && !(typeof World3D !== 'undefined' && World3D.usable(this))) Puzzles.draw2d(ctx, cx, cy); };
}

// ---------- sello de las Grietas: cristales que abren un tesoro ----------
{
  const _gen = Dungeon.generate;
  Dungeon.generate = function (theme, floor, seed) {
    const m = _gen.call(this, theme, floor, seed);
    if (floor >= 3) return m;
    const r = this.rng(seed * 17 + 11);
    if (r() > 0.55) return m;
    const W = m.w, H = m.h, rows = m.rows.map((row) => row.split(''));
    const T = DNG_THEMES[theme], free = (x, y) => x > 1 && y > 1 && x < W - 2 && y < H - 2 && rows[y][x] === T.floor;
    // se puede pisar (suelo, hierba alta…); 'free' además exige suelo liso para colocar cosas
    const walk = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !(TILEDEF[rows[y][x]] || {}).solid;
    const reach = () => { const g = rows.map((row) => row.map((ch) => ((TILEDEF[ch] || {}).solid ? 1 : 0))); return this.bfs(g, m.start[0], m.start[1]); };
    const busy = (x, y) => m.items.some((i) => i.x === x && i.y === y) || (x === m.far[0] && y === m.far[1]) || (x === m.start[0] && y === m.start[1]);
    // callejón de dos casillas: D (fondo) y N (entrada); N con una sola salida además de D
    let spot = null;
    const cand = [];
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      if (!free(x, y) || busy(x, y)) continue;
      const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => walk(x + dx, y + dy));
      if (open.length !== 1) continue;
      const [ox, oy] = open[0], nx = x + ox, ny = y + oy;
      if (busy(nx, ny)) continue;
      const open2 = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => walk(nx + dx, ny + dy) && !(nx + dx === x && ny + dy === y));
      if (open2.length !== 1) continue;
      cand.push([x, y, nx, ny, nx + open2[0][0], ny + open2[0][1]]);
    }
    if (!cand.length) return m;
    spot = cand[Math.floor(r() * cand.length)];
    const [dx0, dy0, gx, gy, ex, ey] = spot;
    // cerrar la entrada no debe cortar el camino hasta la salida
    const save = rows[gy][gx]; rows[gy][gx] = T.wall;
    const d = reach(); rows[gy][gx] = save;
    if (d[m.far[1] * W + m.far[0]] < 0 || d[dy0 * W + dx0] >= 0) return m;
    // tres cristales en casillas abiertas cerca de la entrada
    const crystals = [];
    for (let rad = 2; rad < 9 && crystals.length < 3; rad++) for (let y = ey - rad; y <= ey + rad && crystals.length < 3; y++) for (let x = ex - rad; x <= ex + rad && crystals.length < 3; x++) {
      if (!free(x, y) || busy(x, y) || (x === gx && y === gy) || (x === dx0 && y === dy0)) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !walk(x + dx, y + dy))) continue;
      if (crystals.some(([cx, cy]) => Math.abs(cx - x) + Math.abs(cy - y) < 2)) continue;
      rows[y][x] = T.wall; const dd = reach(); rows[y][x] = T.floor;
      if (dd[m.far[1] * W + m.far[0]] < 0 || dd[ey * W + ex] < 0) continue;
      crystals.push([x, y]);
    }
    if (crystals.length < 3) return m;
    // comprobación final con todo cerrado: la salida sigue accesible y el tesoro no
    for (const [x, y] of crystals) rows[y][x] = T.wall; rows[gy][gx] = T.wall;
    const dz = reach();
    if (dz[m.far[1] * W + m.far[0]] < 0 || dz[ey * W + ex] < 0 || dz[dy0 * W + dx0] >= 0 || crystals.some(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => dz[(y + dy) * W + x + dx] < 0))) return m;
    const lv = this.partyLevel(), loot = lv >= 25 ? [['ultraesfera', 3], ['caramelo', 1], ['llave_esencia', 1]] : [['superesfera', 3], ['hiperpocion', 2], ['llave_esencia', 1]];
    const [item, qty] = loot[Math.floor(r() * loot.length)];
    m.items.push({ x: dx0, y: dy0, item, qty, flag: 'dng_' + seed + '_' + floor + '_pz' });
    m.puzzle = { id: 'dng_' + seed + '_' + floor, kind: 'crystals', name: 'el sello de la grieta', crystals, start: [Math.floor(r() * 3)], gate: [[gx, gy]], tablet: null };
    return m;
  };
}

// ---------- 3D ----------
if (typeof World3D !== 'undefined') {
  const _build = World3D.build;
  World3D.build = function (world) {
    _build.call(this, world);
    this.pz = new Map();
    if (Puzzles.map !== world.map) return;
    const M = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
    for (const o of Puzzles.objs) {
      const g = new THREE.Group(); g.position.set(o.x + 0.5, 0, o.y + 0.5); this.root.add(g);
      if (o.k === 'plate') {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.06, 0.86), M('#5a5468')); base.position.y = 0.03; base.receiveShadow = true; g.add(base);
        const glyphM = M('#3a3448', { emissive: '#60e0ff', emissiveIntensity: 0 }); o.glyphM = glyphM;
        const gl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.12), glyphM); gl.position.y = 0.07; g.add(gl);
        const gl2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.5), glyphM); gl2.position.y = 0.07; g.add(gl2);
      } else if (o.k === 'boulder') {
        const geo = new THREE.IcosahedronGeometry(0.45, 1), p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) { const k = 0.88 + hash2(Math.round(p.getX(i) * 40), Math.round(p.getZ(i) * 40) + o.x) * 0.2; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
        geo.computeVertexNormals();
        const b = new THREE.Mesh(geo, M('#9aa4c0', { flatShading: true })); b.position.y = 0.42; b.castShadow = b.receiveShadow = true; g.add(b);
        // anillo rúnico brillante: distingue las rocas que se pueden empujar
        const rm = M('#80f0ff', { emissive: '#40d0ff', emissiveIntensity: 1.2 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 4, 16), rm); ring.rotation.x = Math.PI / 2; ring.position.y = 0.42; g.add(ring);
        const rune = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.04), rm); rune.position.set(0, 0.55, 0.42); g.add(rune);
        const rune2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.04), rm); rune2.position.set(0, 0.55, 0.42); g.add(rune2);
      } else if (o.k === 'gate') {
        const frame = M('#3a3440'), bar = M('#9a92a8');
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 0.3), frame); top.position.y = 1.4; top.castShadow = true; g.add(top);
        for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.5, 0.3), frame); post.position.set(s * 0.48, 0.75, 0); post.castShadow = true; g.add(post); }
        const bars = new THREE.Group(); g.add(bars); o.bars = bars;
        for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 6), bar); b.position.set(-0.32 + i * 0.16, 0.65, 0); b.castShadow = true; bars.add(b); }
        const cross = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.06), bar); cross.position.y = 0.9; bars.add(cross);
        const cross2 = cross.clone(); cross2.position.y = 0.35; bars.add(cross2);
      } else if (o.k === 'crystal') {
        const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.24, 6), M('#4a4458', { flatShading: true })); ped.position.y = 0.12; ped.castShadow = true; g.add(ped);
        const cm = M('#5a3a8a', { emissive: '#60f0ff', emissiveIntensity: 0, transparent: true, opacity: 0.92, flatShading: true }); o.cm = cm;
        const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), cm); c.scale.y = 1.8; c.position.y = 0.78; c.castShadow = true; g.add(c); o.cmesh = c;
        const light = new THREE.PointLight('#60e0ff', 0, 3.2, 1.6); light.position.y = 0.9; g.add(light); o.light = light;
      } else if (o.k === 'tablet') {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.05, 0.2), M('#7a7488', { flatShading: true })); s.position.y = 0.52; s.castShadow = s.receiveShadow = true; g.add(s);
        const capT = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.26), M('#5a5468')); capT.position.y = 1.08; g.add(capT);
        const gm = M('#a0e0ff', { emissive: '#60c0ff', emissiveIntensity: 0.7 });
        for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.36 - (i % 2) * 0.1, 0.04, 0.02), gm); l.position.set(0, 0.75 - i * 0.18, 0.11); g.add(l); }
      }
      this.pz.set(o, g);
    }
  };
  const _render = World3D.render;
  World3D.render = function (world) {
    if (this.pz && Puzzles.map === world.map) {
      const t = Engine.time;
      for (const [o, g] of this.pz) {
        g.position.x = o.px / 16 + 0.5; g.position.z = o.py / 16 + 0.5;
        if (o.k === 'plate' && o.glyphM) { const on = Puzzles.objs.some((b) => b.k === 'boulder' && b.x === o.x && b.y === o.y); o.glyphM.emissiveIntensity += ((on ? 1.6 : 0) - o.glyphM.emissiveIntensity) * 0.15; }
        if (o.k === 'gate' && o.bars) { const k = o.open || 0; o.bars.position.y = -1.35 * k; g.visible = true; }
        if (o.k === 'crystal' && o.cm) { o.cm.color.set(o.glow > 0.5 ? '#a0f8ff' : '#5a3a8a'); o.cm.emissiveIntensity = o.glow * 1.4; o.light.intensity = o.glow * 3; o.cmesh.rotation.y = t * (0.5 + o.glow); o.cmesh.position.y = 0.78 + Math.sin(t * 2 + o.i) * 0.04 * (0.3 + o.glow); }
      }
    }
    return _render.call(this, world);
  };
}

// los puntos de recolección no pueden estar dentro de la zona de un puzzle
{
  const zones = { cueva: [4, 9, 24, 13], gruta_umbral: [7, 8, 19, 12] };
  for (const id in zones) {
    const [x0, y0, x1, y1] = zones[id], l = NODES[id]; if (!l) continue;
    for (const n of l) if (n[0] >= x0 && n[0] <= x1 && n[1] >= y0 && n[1] <= y1) {
      // se mueve a la casilla libre más cercana fuera de la zona
      const m = MAPS[id]; let best = null, bd = 1e9;
      for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
        if (x >= x0 && x <= x1 && y >= y0 && y <= y1) continue;
        const d = TILEDEF[m.rows[y][x]]; if (!d || d.solid || d.water) continue;
        if (m.items.some((i) => i.x === x && i.y === y) || m.npcs.some((q) => q.x === x && q.y === y) || m.warps.some((w) => w.x === x && w.y === y) || l.some((o) => o !== n && o[0] === x && o[1] === y)) continue;
        const dd = Math.abs(x - n[0]) + Math.abs(y - n[1]); if (dd < bd) { bd = dd; best = [x, y]; }
      }
      if (best) { n[0] = best[0]; n[1] = best[1]; }
    }
  }
}
