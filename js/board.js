'use strict';
// ============================================================
//  CONSTELACIÓN: tablero de crecimiento propio de cada línea
//  - Al subir de nivel ganas Esencia (4 puntos cada 5 niveles)
//  - Activas nodos vecinos a los que ya tienes:
//      A S D H V  +3% Ataque / Especial / Defensa / PS / Velocidad (1 pt)
//      f x u p c o v d r  talentos (Fuerza, Ferocidad, Furia, Puntería,
//                         Celeridad, Contraataque, Vitalidad, Piel Dura, Regeneración) (3 pts)
//      M  nuevo ataque (3 pts)     K  nodo clave de la línea (5 pts)
//      L  nodo sellado: +4% a todo, necesita una Llave Esencia (2 pts)
//  - Los anillos exteriores se abren al evolucionar
//  Formato: nodos en columnas/filas pares; '-' y '|' los unen.
// ============================================================
const BOARDS = {
  ignito: { name: 'Llama Danzante', rows: [
    '. . . K . . . .',
    '      |        ',
    'A-M . x . A-S .',
    '  |   |   |    ',
    '. V-A-f-A-L . .',
    '  |   |   |    ',
    '. u . S . c-D-H',
    '  |   |   |   |',
    '. H-A-@-V-S . V',
    '  |   |       |',
    '. o-D-H-D-r-A-M',
    '  |   |   |    ',
    '. p . M . v . .'],
  moves: ['sombra_furtiva', 'relampago', 'tornado'],
  key: { name: 'Corazón Ígneo', desc: 'Sus ataques de fuego queman un 25% de las veces y, con menos del 35% de PS, hace +25% de daño.', fx: { status: { type: 'fuego', s: 'burn', p: 0.25 }, lowHp: 0.25 } } },

  burbujo: { name: 'Marea Viva', rows: [
    '. . . A-S-M . .',
    '      |   |    ',
    '. . . H . p-c-K',
    '      |   |    ',
    '@-V-D-v-A-S-A .',
    '  |   |     |  ',
    '. o . S . . r .',
    '  |   |     |  ',
    '. H-D-M . . H .',
    '  |         |  ',
    '. A-d-V-x-S-L .',
    '        |      ',
    '. . . . M . . .'],
  moves: ['hoja_filo', 'tijera', 'onda_mental'],
  key: { name: 'Marea Viva', desc: 'Cada esquiva perfecta le cura un 6% de PS, y los golpes súper eficaces le hacen un 15% menos.', fx: { dodgeHeal: 0.06, resist: 0.15 } } },

  semillin: { name: 'Árbol Ancestral', rows: [
    '. S-c-K-p-S . .',
    '  |   |   |    ',
    'A-H . A . H-A .',
    '  |   |   |    ',
    '. M-v-r-d-M . .',
    '      |        ',
    '. . D-H-D . . .',
    '      |        ',
    '. . V-@-S . . .',
    '    |   |      ',
    '. A-D . D-H . .',
    '  |       |    ',
    '. M . . . L . .'],
  moves: ['lanzarrocas', 'garra_umbria', 'zumbido'],
  key: { name: 'Raíces Profundas', desc: 'Empieza cada combate con un escudo del 15% de sus PS, y sus ataques de planta envenenan un 20% de las veces.', fx: { shield: 0.15, status: { type: 'planta', s: 'poison', p: 0.2 } } } },

  rabin: { name: 'Huella Veloz', rows: [
    '. V . M . V . .',
    '  |   |   |    ',
    '. A . x . A . .',
    '  |   |   |    ',
    'M-c-V-u-V-o-S .',
    '    |   |      ',
    '. . A-@-A . . .',
    '    |   |      ',
    '. f-H-D-H-K . .',
    '  |            ',
    '. M-x-H-D-r . .',
    '      |        ',
    '. . . L . . . .'],
  moves: ['tijera', 'puno_voltio', 'sombra_furtiva'],
  key: { name: 'Instinto Veloz', desc: 'Se mueve un 12% más rápido, esquiva antes y recupera un 5% del daño que inflige.', fx: { swift: true, leech: 0.05 } } },

  pipio: { name: 'Ala del Alba', rows: [
    '. . . . . M-V-K',
    '          |    ',
    '. . . p-S-A . .',
    '      |   |    ',
    '. . V-A . c-V .',
    '    |       |  ',
    '. S-@ . . . M .',
    '    |       |  ',
    '. A-H-x-A-o-S .',
    '  |       |    ',
    '. M . D-H-L . .',
    '        |      ',
    '. . . . v-A . .'],
  moves: ['puno_voltio', 'hoja_filo', 'garra_umbria'],
  key: { name: 'Corriente Ascendente', desc: 'Sus ataques a distancia hacen +20% contra rivales lejanos, y es un 12% más veloz.', fx: { range: 0.2, swift: true } } },

  larvita: { name: 'Capullo Sellado', rows: [
    '. H-M-A-S-D . .',
    '  |   |   |    ',
    '. v . x . r . .',
    '  |   |   |    ',
    '. A-V-@-V-A-M .',
    '  |   |   |    ',
    '. d . o . c . .',
    '  |   |   |    ',
    '. H-M-D-S-H . .',
    '      |        ',
    '. . . L . . . .',
    '      |        ',
    '. . . K . . . .'],
  moves: ['lanzarrocas', 'psiquico', 'drenaje'],
  key: { name: 'Metamorfosis', desc: 'Empieza cada combate con un escudo del 15% de sus PS, y sus ataques de bicho envenenan un 25% de las veces.', fx: { shield: 0.15, status: { type: 'bicho', s: 'poison', p: 0.25 } } } },

  voltin: { name: 'Rayo Errante', rows: [
    '. . . . . K-A .',
    '          |    ',
    '. . . c-V-V-H .',
    '      |   |    ',
    '. . S-u . r-v .',
    '    |          ',
    'M-A-@-A-S-M . .',
    '          |    ',
    '. . . . o-p . .',
    '        |      ',
    '. . D-H-x . . .',
    '    |          ',
    'L-H-V-M . . . .'],
  moves: ['rafaga', 'lanzarrocas', 'garra_umbria'],
  key: { name: 'Sobrecarga', desc: 'Sus ataques eléctricos paralizan un 25% de las veces, y los ataques cargados hacen +20% de daño.', fx: { status: { type: 'electrico', s: 'para', p: 0.25 }, charged: 0.2 } } },

  guijin: { name: 'Cumbre Pétrea', rows: [
    '. . . K . . . .',
    '      |        ',
    '. . D-H-D . . .',
    '    |   |      ',
    '. A-d-r-d-S . .',
    '  |   |   |    ',
    'M-H . x . H-M .',
    '  |   |   |    ',
    'D-V-A-@-A-V-D .',
    '  |       |    ',
    '. f . . . v . .',
    '  |       |    ',
    'L-H-A-M . D-A .'],
  moves: ['ascua', 'psicorrayo', 'acometida'],
  key: { name: 'Núcleo Pétreo', desc: 'Recibe un 20% menos de los golpes súper eficaces, y sus golpes cuerpo a cuerpo aturden un 12% de las veces.', fx: { resist: 0.2, stun: 0.12 } } },

  umbrin: { name: 'Luna Creciente', rows: [
    '. . M-S-A-K . .',
    '    |          ',
    '. o-x . . . . .',
    '  |            ',
    '. V-A . . . . .',
    '  |            ',
    'H-@-S-c-p-M . .',
    '  |     |      ',
    '. A-H . u-S . .',
    '  |     |      ',
    '. v-D . H-L . .',
    '    |          ',
    '. . r-M-d . . .'],
  moves: ['lanzallamas', 'confusion', 'rafaga'],
  key: { name: 'Hora Bruja', desc: 'De noche (o en un eclipse) hace +20% de daño, y sus ataques de sombra confunden un 20% de las veces.', fx: { night: 0.2, status: { type: 'sombra', s: 'confuse', p: 0.2 } } } },

  escamin: { name: 'Contracorriente', rows: [
    'S-V-V-M . . . .',
    '      |        ',
    '. . . c-A-H . .',
    '          |    ',
    'D-A-@ . . V-K .',
    '    |     |    ',
    '. . x-u-o-S . .',
    '    |          ',
    '. M-H . . . . .',
    '  |            ',
    '. A-D-V-p-A-L .',
    '        |      ',
    '. . . . M . . .'],
  moves: ['tijera', 'colmillo_igneo', 'golpe_roca'],
  key: { name: 'Contracorriente', desc: 'Es un 12% más veloz y sus ataques cargados hacen +20% de daño.', fx: { swift: true, charged: 0.2 } } },

  psiqui: { name: 'Espiral Interior', rows: [
    'M-A-S-c-S-A-H .',
    '|           |  ',
    'V . S-x-D . A .',
    '|   |   |   |  ',
    '@-H-A . K . V .',
    '|   |   |   |  ',
    'H . o-M-p . S .',
    '|           |  ',
    'A-D-H-u-r-L-M .',
    '               ',
    '. . . . . . . .',
    '               ',
    '. . . . . . . .'],
  moves: ['garra_umbria', 'lanzarrocas', 'rocio'],
  key: { name: 'Mente Serena', desc: 'Su Sinergia se llena un 30% más rápido, y al empezar cada combate intimida al rival (−1 Ataque).', fx: { syn: 0.3, aura: true } } },

  hongui: { name: 'Red de Micelio', rows: [
    '. A . S . A . .',
    '  |   |   |    ',
    'D-r-H-M-H-d-D .',
    '  |   |   |    ',
    '. v . @ . c . .',
    '  |   |   |    ',
    'S-u-A-x-A-o-S .',
    '  |   |   |    ',
    '. M . K . M . .',
    '  |   |   |    ',
    '. H . L . H . .',
    '               ',
    '. . . . . . . .'],
  moves: ['aguijon', 'sombra_furtiva', 'golpe_roca'],
  key: { name: 'Micorriza', desc: 'Recupera un 6% del daño que inflige, y sus ataques de planta envenenan un 20% de las veces.', fx: { leech: 0.06, status: { type: 'planta', s: 'poison', p: 0.2 } } } },

  brisin: { name: 'Cúmulo', rows: [
    '. . V-S . A-V .',
    '      |   |    ',
    '. A-c-H-p-H-M .',
    '  |   |   |    ',
    'S-x . @ . o-K .',
    '      |        ',
    '. D-A-V-A-D . .',
    '  |       |    ',
    '. M . . . r . .',
    '          |    ',
    '. . . L-S-v . .',
    '      |        ',
    '. . . M . . . .'],
  moves: ['chispa', 'burbuja', 'golpe_roca'],
  key: { name: 'Ojo del Huracán', desc: 'Sus ataques a distancia hacen +20% contra rivales lejanos, y cada esquiva perfecta le cura un 5% de PS.', fx: { range: 0.2, dodgeHeal: 0.05 } } },

  murcin: { name: 'Vuelo Nocturno', rows: [
    'M . . K . . S .',
    '|     |     |  ',
    'V-A . x . A-V .',
    '  |   |   |    ',
    '. H-o-@-u-H . .',
    '  |   |   |    ',
    'S-D . H . D-A .',
    '|     |     |  ',
    'r . . L . . v .',
    '|     |     |  ',
    'M . . p . . M .',
    '               ',
    '. . . . . . . .'],
  moves: ['zumbido', 'confusion', 'garra_umbria'],
  key: { name: 'Eco Nocturno', desc: 'De noche (o en un eclipse) hace +15% de daño, y recupera un 8% del daño que inflige.', fx: { night: 0.15, leech: 0.08 } } },

  silvaneo: { name: 'Cornamenta del Bosque', rows: [
    'A . S . . S . A',
    '|   |     |   |',
    'H-M-V . . V-M-H',
    '    |     |    ',
    '. . x-r-d-o . .',
    '      |        ',
    '. D-H-A-H-D . .',
    '  |   |   |    ',
    '. v . @ . c . .',
    '  |       |    ',
    'M-L-f . p-K . .',
    '               ',
    '. . . . . . . .'],
  moves: ['golpe_roca', 'garra_umbria', 'vendaval'],
  key: { name: 'Guardián del Bosque', desc: 'Empieza cada combate con un escudo del 20% de sus PS, y recibe un 15% menos de los golpes súper eficaces.', fx: { shield: 0.2, resist: 0.15 } } },

  auroros: { name: 'Sol Naciente', rows: [
    '. . . K . . . .',
    '      |        ',
    '. . . L . . . .',
    '      |        ',
    '. S . f . S . .',
    '  |   |   |    ',
    'A-H-x-@-u-H-A .',
    '  |   |   |    ',
    '. M . c . M . .',
    '  |   |   |    ',
    'o-D-V-H-V-D-p .',
    '      |        ',
    '. . . M . . . .'],
  moves: ['onda_mental', 'carga_brutal', 'ala_corte'],
  key: { name: 'Amanecer Eterno', desc: 'Sus ataques de fuego queman un 30% de las veces, y su Sinergia se llena un 30% más rápido.', fx: { status: { type: 'fuego', s: 'burn', p: 0.3 }, syn: 0.3 } } },

  marealis: { name: 'Remolino Eterno', rows: [
    '. A-S-V-S-A . .',
    '  |       |    ',
    'H-M . . . M-H .',
    '  |       |    ',
    '. c . @-x-o . .',
    '  |     | |    ',
    '. D-p-H-r-D . .',
    '      |        ',
    '. . . L . . . .',
    '      |        ',
    '. M-v-K-d . . .',
    '               ',
    '. . . . . . . .'],
  moves: ['rafaga', 'psicorrayo', 'trueno'],
  key: { name: 'Pulso Oceánico', desc: 'Cada esquiva perfecta le cura un 8% de PS, y sus ataques a distancia hacen +15% contra rivales lejanos.', fx: { dodgeHeal: 0.08, range: 0.15 } } },

  albora: { name: 'Alas del Alba', rows: [
    'A-V . K . V-A .',
    '  |   |   |    ',
    'M-S . L . S-M .',
    '  |   |   |    ',
    '. H-c-@-o-H . .',
    '  |   |   |    ',
    'D-H . x . H-D .',
    '  |   |   |    ',
    'v-p . M . r-d .',
    '               ',
    '. . . . . . . .',
    '               ',
    '. . . . . . . .'],
  moves: ['llamarada', 'ola', 'tormenta_petalo'],
  key: { name: 'Primera Luz', desc: 'Al empezar cada combate intimida al rival (−1 Ataque), y recupera un 6% del daño que inflige.', fx: { aura: true, leech: 0.06 } } },
};

const NODE_INFO = {
  A: { t: 'stat', k: 'atk', name: 'Ataque +3%', cost: 1, color: '#f06048' },
  S: { t: 'stat', k: 'esp', name: 'Especial +3%', cost: 1, color: '#b070f0' },
  D: { t: 'stat', k: 'def', name: 'Defensa +3%', cost: 1, color: '#c09060' },
  H: { t: 'stat', k: 'hp', name: 'PS +3%', cost: 1, color: '#58c060' },
  V: { t: 'stat', k: 'vel', name: 'Velocidad +3%', cost: 1, color: '#f0d040' },
  f: { t: 'tal', k: 'fuerza', cost: 3 }, x: { t: 'tal', k: 'ferocidad', cost: 3 }, u: { t: 'tal', k: 'furia', cost: 3 },
  p: { t: 'tal', k: 'punteria', cost: 3 }, c: { t: 'tal', k: 'celeridad', cost: 3 }, o: { t: 'tal', k: 'contra', cost: 3 },
  v: { t: 'tal', k: 'vitalidad', cost: 3 }, d: { t: 'tal', k: 'piel', cost: 3 }, r: { t: 'tal', k: 'regen', cost: 3 },
  M: { t: 'move', name: 'Nuevo ataque', cost: 3, color: '#ffffff' },
  K: { t: 'key', name: 'Nodo clave', cost: 5, color: '#ffd048' },
  L: { t: 'lock', name: 'Nodo sellado: +4% a todo', cost: 2, color: '#a0e0ff' },
  '@': { t: 'start', name: 'Origen', cost: 0, color: '#ffffff' },
};
for (const [ch, n] of Object.entries(NODE_INFO)) if (n.t === 'tal') {
  for (const br of Object.values(TALENTS)) { const tl = br.list.find((x) => x.key === n.k); if (tl) { n.name = tl.name; n.desc = tl.desc.replace(' por rango', ''); n.color = br.color; } }
}

ITEMS.llave_esencia = { name: 'Llave Esencia', price: 0, desc: 'Abre un nodo sellado de la Constelación de un ánima. La sueltan los alfas y los jefes de las grietas.', icon: 'key' };

const Board = {
  cache: {},
  // ---------- líneas evolutivas ----------
  pre() {
    if (this._pre) return this._pre;
    const pre = {};
    for (const s of SPECIES_LIST) { const e = s.evo; if (!e) continue; for (const to of [e.to, e.branch && e.branch.a, e.branch && e.branch.b]) if (to) pre[to] = s.key; }
    return (this._pre = pre);
  },
  root(sp) { const pre = this.pre(); let k = sp, g = 0; while (pre[k] && g++ < 5) k = pre[k]; return k; },
  stageOf(sp) { if (SPECIES[sp].legendary) return 3; const pre = this.pre(); let k = sp, n = 1; while (pre[k]) { k = pre[k]; n++; } return n; },
  defOf(sp) { return BOARDS[sp] || BOARDS[this.root(sp)] || null; },
  // ---------- lectura del tablero ----------
  parse(def) {
    const key = def.name;
    if (this.cache[key]) return this.cache[key];
    const R = def.rows, nodes = [], at = {};
    for (let y = 0; y < R.length; y += 2) for (let x = 0; x < R[y].length; x += 2) {
      const ch = R[y][x]; if (!ch || ch === '.' || ch === ' ') continue;
      const n = { id: nodes.length, ch, cx: x / 2, cy: y / 2, info: NODE_INFO[ch], links: [] };
      nodes.push(n); at[x + ',' + y] = n;
    }
    const link = (a, b) => { if (a && b) { a.links.push(b.id); b.links.push(a.id); } };
    for (let y = 0; y < R.length; y++) for (let x = 0; x < R[y].length; x++) {
      if (R[y][x] === '-') link(at[(x - 1) + ',' + y], at[(x + 1) + ',' + y]);
      if (R[y][x] === '|') link(at[x + ',' + (y - 1)], at[x + ',' + (y + 1)]);
    }
    let mi = 0;
    for (const n of nodes) if (n.ch === 'M') n.move = def.moves[mi++];
    // anillos: distancia desde el origen
    const start = nodes.find((n) => n.ch === '@');
    const dist = { [start.id]: 0 }, q = [start];
    while (q.length) { const n = q.shift(); for (const l of n.links) if (dist[l] === undefined) { dist[l] = dist[n.id] + 1; q.push(nodes[l]); } }
    const maxD = Math.max(...Object.values(dist));
    for (const n of nodes) {
      n.dist = dist[n.id];
      n.stage = n.dist <= maxD * 0.34 ? 1 : n.dist <= maxD * 0.67 ? 2 : 3;
      if (n.ch === 'K') n.stage = 3; else if (n.ch === 'L') n.stage = Math.max(2, n.stage);
    }
    return (this.cache[key] = { def, nodes, start });
  },
  of(c) { const d = this.defOf(c.sp); return d ? this.parse(d) : null; },
  owned(c) {
    const B = this.of(c); if (!B) return null;
    if (!c.board) c.board = { n: [B.start.id] };
    return c.board.n;
  },
  spent(c) { const B = this.of(c); if (!B || !c.board) return 0; return c.board.n.reduce((a, id) => a + B.nodes[id].info.cost, 0); },
  // 4 puntos de Esencia cada 5 niveles: a nivel 70 da para completar el tablero
  points(c) { return Math.max(0, Math.floor((c.lv - 1) * 0.8) + (c.bonusPts || 0) - this.spent(c)); },
  canBuy(c, n) {
    const own = this.owned(c);
    if (own.includes(n.id)) return 'owned';
    if (n.stage > this.stageOf(c.sp)) return 'stage';
    if (!n.links.some((l) => own.includes(l))) return 'far';
    if (this.points(c) < n.info.cost) return 'pts';
    if (n.ch === 'L' && !G.bag.llave_esencia) return 'key';
    return 'ok';
  },
  buy(c, n) {
    if (this.canBuy(c, n) !== 'ok') return false;
    if (n.ch === 'L') Game.take('llave_esencia');
    c.board.n.push(n.id); this.sync(c);
    return true;
  },
  // talentos y efectos derivados del tablero
  sync(c) {
    const B = this.of(c); if (!B || !c.board) return;
    const t = {}, st = {}; let lock = 0, key = false;
    for (const id of c.board.n) {
      const n = B.nodes[id], inf = n.info;
      if (inf.t === 'tal') t[inf.k] = (t[inf.k] || 0) + 1;
      else if (inf.t === 'stat') st[inf.k] = (st[inf.k] || 0) + 1;
      else if (inf.t === 'lock') lock++;
      else if (inf.t === 'key') key = true;
    }
    c.talents = t; c.bstat = st; c.block = lock; c.bkey = key;
  },
  keyFx(c) { if (!c || !c.bkey) return null; const d = this.defOf(c.sp); return d && d.key.fx; },
  reset(c) { c.board = null; c.talents = {}; c.bstat = {}; c.block = 0; c.bkey = false; },
};

// antiguas partidas: los puntos de talentos se devuelven y pasan al tablero
talentPoints = function (c) { if (!c.board) Board.owned(c); return Board.points(c); };
{
  const _fix = fixCreature;
  fixCreature = function (c) {
    _fix(c);
    if (!c.board) { c.talents = {}; } else Board.sync(c);
  };
  const _calc = calcStats;
  calcStats = function (c) {
    const s = _calc(c);
    if (!c.bstat && !c.block) return s;
    const b = c.bstat || {}, L = (c.block || 0) * 0.04;
    for (const k of ['atk', 'esp', 'def', 'vel', 'hp']) { const m = 1 + 0.03 * (b[k] || 0) + L; if (m !== 1) s[k] = Math.floor(s[k] * m); }
    return s;
  };
  const _mods = fighterMods;
  fighterMods = function (c) {
    const m = _mods(c), fx = Board.keyFx(c);
    if (fx) { m.key = fx; if (fx.syn) m.syn *= 1 + fx.syn; if (fx.swift) m.speed *= 1.12; }
    return m;
  };
}
// Hierba Olvido: reinicia la Constelación
{
  const it = ITEMS.hierba_olvido; if (it) it.desc = 'Hierba amarga. Reinicia la Constelación de un ánima y le devuelve todos sus puntos.';
}

// ---------- efectos de los nodos clave en combate ----------
{
  const BP = BattleScene.prototype;
  const isNight = () => (typeof Clock !== 'undefined' && !Clock.isDay()) || (typeof Eclipse !== 'undefined' && Eclipse.active());
  const _hit = BP.hit;
  BP.hit = function (tgt, att, m, mult = 1, ang = 0) {
    const ka = att && att.mods && att.mods.key, kt = tgt && tgt.mods && tgt.mods.key;
    if (ka) {
      if (ka.lowHp && att.hp < att.maxHp * 0.35) mult *= 1 + ka.lowHp;
      if (ka.night && isNight()) mult *= 1 + ka.night;
      if (ka.range && RANGED[m.kind] && U.dist(att.x, att.y, tgt.x, tgt.y) > 90) mult *= 1 + ka.range;
      if (ka.charged && mult > 1.05) mult *= 1 + ka.charged;
    }
    if (kt && kt.resist && typeMult(m.type, tgt.types) > 1) mult *= 1 - kt.resist;
    const dodging = tgt.dodgeT > 0 && !tgt.perfectT;
    const hp0 = tgt.hp;
    const r = _hit.call(this, tgt, att, m, mult, ang);
    let dmg = hp0 - tgt.hp;
    if (kt && kt.dodgeHeal && dodging && tgt.perfectT) { tgt.hp = Math.min(tgt.maxHp, tgt.hp + tgt.maxHp * kt.dodgeHeal); this.addNum(tgt.x, tgt.y - 50, '+PS', '#80ff90'); }
    if (dmg > 0 && tgt.shield > 0) { const ab = Math.min(tgt.shield, dmg); tgt.shield -= ab; tgt.hp += ab; dmg -= ab; this.addNum(tgt.x, tgt.y - 50, tgt.shield > 0 ? 'Escudo' : '¡Escudo roto!', '#a0e8ff'); }
    if (dmg > 0 && ka) {
      if (ka.leech) att.hp = Math.min(att.maxHp, att.hp + dmg * ka.leech);
      if (ka.status && m.type === ka.status.type && !tgt.fainted && tgt.hp > 0 && Math.random() < ka.status.p) this.applyStatus(tgt, ka.status.s);
      if (ka.stun && ['melee', 'dash', 'stealth'].includes(m.kind) && tgt.hp > 0 && Math.random() < ka.stun) this.applyStatus(tgt, 'stun');
    }
    return r;
  };
  const _mk = BP.mkFighter;
  BP.mkFighter = function (c, side) {
    const f = _mk.call(this, c, side);
    if (f.mods.key && f.mods.key.shield) f.shield = Math.round(f.maxHp * f.mods.key.shield);
    return f;
  };
  const _upd = BP.update;
  BP.update = function (dt0) {
    const a = this.ally, cd0 = a ? a.dodgeCd : 0;
    _upd.call(this, dt0);
    if (!a || !a.mods.key) return;
    if (a.mods.key.swift && a.dodgeCd > cd0 + 0.3) a.dodgeCd *= 0.8;
    const f = this.foe;
    if (a.mods.key.aura && f && !f.inBall && !f.auraHit && this.state === 'fight') { f.auraHit = true; f.stages.atk = Math.max(-6, f.stages.atk - 1); this.addNum(f.x, f.y - 30, 'Ataque −1', '#ffb0b0'); }
  };
  // los alfas y los jefes pueden soltar Llaves Esencia
  const _faint = BP.onFoeFaint;
  BP.onFoeFaint = async function () {
    const f = this.foe;
    await _faint.call(this);
    if (this.opts.practice || !G || G.practice) return;
    const last = this.wild || this.foeQueue.every((c) => c === f.c || c.hp <= 0);
    const p = this.opts.boss && last ? 1 : f.c.alpha ? 0.25 : 0;
    if (Math.random() < p) { Game.give('llave_esencia', 1); Sound.jingle('item'); await this.banner('¡Obtienes una Llave Esencia!', 1.3, '#a0e0ff'); }
  };
  // escudo visible sobre la barra de PS
  const _hud = BP.drawHud;
  BP.drawHud = function (ctx) {
    _hud.call(this, ctx);
    const a = this.ally;
    if (a && a.shield > 0) { const w = Math.round(110 * Math.min(1, a.shield / a.maxHp)); P(ctx, HUD_L + 5, 17, w, 2, '#a0e8ff'); }
  };
}

