'use strict';
// ============================================================
//  Mapas de la Región Alba (diseño original)
// ============================================================

TILEDEF['M'] = { t: 'cavemouth', solid: false };
TileDraw.cavemouth = (x) => {
  TileDraw.cliff(x, 0, 0);
  P(x, 2, 3, 12, 13, '#1a1410'); P(x, 3, 2, 10, 2, '#1a1410'); P(x, 4, 4, 8, 12, '#000');
  P(x, 2, 3, 1, 13, PAL.cliff4); P(x, 13, 3, 1, 13, PAL.cliff4);
};

const MAPS = {};

// constructor por comandos para mapas exteriores
function buildRows(w, h, fillCh, ops) {
  const g = Array.from({ length: h }, () => Array(w).fill(fillCh));
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c; };
  const blds = [];
  for (const op of ops) {
    const [k, ...a] = op;
    if (k === 'rect') { const [x, y, rw, rh, c] = a; for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) set(xx, yy, c); }
    else if (k === 'set') { const [x, y, c] = a; set(x, y, c); }
    else if (k === 'pts') { const [c, list] = a; for (const [x, y] of list) set(x, y, c); }
    else if (k === 'bld') {
      const [x, y, bw, bh, style, door, to] = a;
      for (let yy = y; yy < y + bh; yy++) for (let xx = x; xx < x + bw; xx++) set(xx, yy, 'H');
      set(x + door, y + bh - 1, 'D');
      blds.push({ x, y, w: bw, h: bh, style, door, to });
    }
  }
  return { rows: g.map((r) => r.join('')), buildings: blds };
}

function defMap(id, def) {
  def.id = id;
  if (def.build) {
    const r = buildRows(def.w, def.h, def.fill || 'T', def.build);
    def.rows = r.rows; def.buildings = (def.buildings || []).concat(r.buildings);
  }
  def.h = def.rows.length;
  def.w = def.w || Math.max(...def.rows.map((r) => r.length));
  def.rows = def.rows.map((r, i) => {
    if (r.length !== def.w) console.warn(`Mapa ${id} fila ${i} ancho ${r.length} != ${def.w}`);
    return r.padEnd(def.w, def.pad || 'T').slice(0, def.w);
  });
  def.npcs = def.npcs || []; def.signs = def.signs || []; def.items = def.items || [];
  def.warps = def.warps || []; def.buildings = def.buildings || []; def.triggers = def.triggers || [];
  MAPS[id] = def;
  return def;
}

// enlaza puertas de edificios con interiores (y crea las salidas)
function linkDoors() {
  for (const id in MAPS) {
    const m = MAPS[id];
    for (const b of m.buildings) {
      if (!b.to) continue;
      const inner = MAPS[b.to];
      if (!inner) { console.warn('Interior no definido', b.to); continue; }
      const dx = b.x + b.door, dy = b.y + b.h - 1;
      const mats = [];
      inner.rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === 'm') mats.push([x, y]); });
      m.warps.push({ x: dx, y: dy, to: b.to, tx: mats[0][0], ty: mats[0][1], dir: 'up', door: true });
      for (const [mx, my] of mats) inner.warps.push({ x: mx, y: my, to: id, tx: dx, ty: dy + 1, dir: 'down', mat: true });
      inner.parent = id;
    }
  }
}

// ---------- presets de aspecto de NPCs ----------
const LOOKS = {
  player: { hair: '#4a3020', hairStyle: 'short', shirt: '#2f8a9a', c2: '#f4f4f4', outfit: 'jacket', pants: '#2c3048', hat: '#f4f4f4', hatStyle: 'cap', shoes: '#c04040', acc: 'backpack', accC: '#f0b840' },
  rival: { hair: '#c86030', hairStyle: 'spiky', shirt: '#6a50b0', c2: '#2a2238', outfit: 'jacket', pants: '#383040' },
  prof: { hair: '#d8d8e0', hairStyle: 'bun', shirt: '#f8f8f8', c2: '#58a0a8', outfit: 'coat', pants: '#606878', acc: 'glasses' },
  mom: { hair: '#6a3a28', hairStyle: 'long', shirt: '#e88080', c2: '#fff4e8', outfit: 'apron', pants: '#5a4a70' },
  sister: { hair: '#e8a040', hairStyle: 'pony', shirt: '#80c060', outfit: 'dress', pants: '#4a5070' },
  boy: { hair: '#302820', hairStyle: 'short', shirt: '#4a88e0', pants: '#4a4060' },
  girl: { hair: '#a04040', hairStyle: 'pony', shirt: '#f0b040', outfit: 'dress', pants: '#5068a0' },
  oldman: { hair: '#c8c8c8', hairStyle: 'bald', shirt: '#8a7050', c2: '#e8d8b8', outfit: 'jacket', pants: '#504840', acc: 'glasses' },
  oldwoman: { hair: '#e0e0e8', hairStyle: 'bun', shirt: '#9070a8', outfit: 'dress', pants: '#504860' },
  nurse: { hair: '#f090a8', hairStyle: 'long', shirt: '#ffffff', c2: '#f490b0', outfit: 'apron', pants: '#f0b0c0', hat: '#ffffff', hatStyle: 'sailor' },
  clerk: { hair: '#383028', hairStyle: 'short', shirt: '#4a78d8', c2: '#e8eef8', outfit: 'apron', pants: '#404050' },
  worker: { hair: '#5a4030', hairStyle: 'short', shirt: '#e8a030', c2: '#3a5a90', outfit: 'overalls', pants: '#4a5a80', hat: '#f0d040', hatStyle: 'hardhat' },
  bug: { hair: '#5a4020', hairStyle: 'short', shirt: '#90c040', pants: '#c8b080', hat: '#d8c060', hatStyle: 'sun', acc: 'backpack', accC: '#6a9a40' },
  hiker: { hair: '#4a3020', hairStyle: 'curly', shirt: '#a06030', c2: '#d8c098', outfit: 'jacket', pants: '#6a5a40', hat: '#806040', hatStyle: 'beanie', acc: 'backpack', accC: '#c06030' },
  lass: { hair: '#f0d070', hairStyle: 'long', shirt: '#f080b0', outfit: 'dress', pants: '#6070c0' },
  youngster: { hair: '#2a2020', hairStyle: 'short', shirt: '#e85050', pants: '#405090', hat: '#4060c0', hatStyle: 'cap' },
  sailor: { hair: '#302820', hairStyle: 'short', shirt: '#f0f0f8', c2: '#304080', outfit: 'jacket', pants: '#304080', hat: '#304080', hatStyle: 'sailor' },
  fisher: { hair: '#6a5040', hairStyle: 'short', shirt: '#609060', c2: '#d8c090', outfit: 'overalls', pants: '#5a5040', hat: '#d0b060', hatStyle: 'sun' },
  grunt: { hair: '#202020', hairStyle: 'short', shirt: '#2a2438', c2: '#7a40c0', outfit: 'jacket', pants: '#2a2438', hat: '#7a40c0', hatStyle: 'beanie' },
  vesper: { hair: '#c0c8f0', hairStyle: 'long', shirt: '#382858', c2: '#a070e0', outfit: 'coat', pants: '#201a30' },
  hiedra: { hair: '#3a8a40', hairStyle: 'long', shirt: '#a0d070', outfit: 'dress', pants: '#4a6a38', hat: '#e8d090', hatStyle: 'sun' },
  bruna: { hair: '#8a5030', hairStyle: 'pony', shirt: '#c08850', c2: '#6a4a30', outfit: 'overalls', pants: '#5a4a3a', hat: '#e8a030', hatStyle: 'bandana' },
  neron: { hair: '#f0f0f0', hairStyle: 'short', shirt: '#2a5aa8', c2: '#f0f0f0', outfit: 'coat', pants: '#1a2a50', hat: '#203060', hatStyle: 'sailor' },
  guide: { hair: '#202020', hairStyle: 'short', shirt: '#e8e8e8', c2: '#c04040', outfit: 'jacket', pants: '#3a3a4a', acc: 'glasses' },
  scientist: { hair: '#504838', hairStyle: 'curly', shirt: '#f0f0f0', c2: '#5a7aa0', outfit: 'coat', pants: '#4a5a6a', acc: 'glasses' },
  guard: { hair: '#302820', hairStyle: 'short', shirt: '#3a5a8a', c2: '#e0c060', outfit: 'jacket', pants: '#2a3a5a', hat: '#2a3a5a', hatStyle: 'cap' },
  swimmer: { hair: '#202020', hairStyle: 'short', shirt: '#f8c8a0', pants: '#3070d0' },
  farmer: { hair: '#7a5030', hairStyle: 'short', shirt: '#d05040', c2: '#5878b0', outfit: 'overalls', pants: '#5878b0', hat: '#e8c870', hatStyle: 'sun' },
  baker: { hair: '#e0c080', hairStyle: 'bun', shirt: '#f8f0e0', c2: '#f8f8f8', outfit: 'apron', pants: '#8a7060' },
  jogger: { hair: '#202838', hairStyle: 'pony', shirt: '#40c0a0', pants: '#303848', hat: '#f0f0f0', hatStyle: 'bandana' },
  artist: { hair: '#5a3a6a', hairStyle: 'curly', shirt: '#e8d040', c2: '#6a4aa0', outfit: 'jacket', pants: '#3a3050', hat: '#c04050', hatStyle: 'beanie' },
  kid2: { hair: '#e0a040', hairStyle: 'spiky', shirt: '#60b0f0', pants: '#304060' },
  mailman: { hair: '#3a2a20', hairStyle: 'short', shirt: '#4060a0', c2: '#f0d040', outfit: 'jacket', pants: '#2a3050', hat: '#4060a0', hatStyle: 'cap', acc: 'backpack', accC: '#a06030' },
};

// ---------- Pueblo Alba ----------
defMap('pueblo_alba', {
  name: 'Pueblo Alba', music: 'town', outdoor: true, bg: 'grass', w: 24,
  rows: [
    'TTTTTTTTTTT::TTTTTTTTTTT',
    'TTTTTTTTTTT::TTTTTTTTTTT',
    'TT.........::.........TT',
    'TT.ffff....::....ffff.TT',
    'TT.HHHHH...::...HHHHH.TT',
    'TT.HHHHH...::...HHHHH.TT',
    'TT.HHHHH...::...HHHHH.TT',
    'TT.HHDHH...::...HHDHH.TT',
    'TT...:.....::.....:...TT',
    'TT...::::::::::::::...TT',
    'TT.S........::........TT',
    'TT.......HHHHHHH......TT',
    'TT.ff....HHHHHHH...ff.TT',
    'TT.......HHHHHHH......TT',
    'TT.......HHHHHHH......TT',
    'TT.......HHHDHHH....S.TT',
    'TT..........:.........TT',
    'TT.~~~~~...:....fff...TT',
    'TT.~~~~~..........ff..TT',
    'TTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  buildings: [
    { x: 3, y: 4, w: 5, h: 4, style: 'house', door: 2, to: 'casa_jugador' },
    { x: 16, y: 4, w: 5, h: 4, style: 'house2', door: 2, to: 'casa_rival' },
    { x: 9, y: 11, w: 7, h: 5, style: 'lab', door: 3, to: 'lab' },
  ],
  edges: { n: { to: 'ruta1', d: -2 } },
  signs: [
    { x: 3, y: 10, text: 'PUEBLO ALBA\nDonde amanecen las aventuras.' },
    { x: 20, y: 15, text: 'LABORATORIO DE LA PROFESORA CEIBA\nInvestigación de ánimas.' },
  ],
  npcs: [
    { id: 'alba_girl', x: 8, y: 12, look: 'girl', move: 'wander', say: ['¡Hola! Dicen que la Profesora Ceiba busca a alguien que la ayude a completar el Códice.'] },
    { id: 'alba_man', x: 14, y: 17, look: 'oldman', move: 'look', say: ['En la hierba alta viven ánimas salvajes.', 'Sin una ánima propia, ¡es peligroso adentrarse!'] },
    { id: 'alba_block', x: 10, y: 2, look: 'scientist', dir: 'right', hideIf: 'got_starter', script: 'alba_block' },
    { id: 'leg_albora', x: 12, y: 4, look: 'boy', creature: 'albora', lv: 42, dir: 'down', script: 'legend', showIf: 'trio_done', hideIf: 'leg_albora' },
  ],
  triggers: [{ x: 11, y: 2, w: 2, h: 1, script: 'alba_block', unlessFlag: 'got_starter' }],
});

// ---------- Ruta 1 ----------
defMap('ruta1', {
  name: 'Ruta 1', music: 'route', outdoor: true, bg: 'grass', w: 20,
  rows: [
    'TTTTTTTTT::TTTTTTTTT',
    'TTTTTTTTT::TTTTTTTTT',
    'TT.......::.,,,,,.TT',
    'TT.,,,,..::.,,,,,.TT',
    'TT.,,,,..::.......TT',
    'TT.,,,,...::......TT',
    'TT.........::.....TT',
    'TT=====....::==...TT',
    'TT.........::.....TT',
    'TTTT.......::...TTTT',
    'TTTT..,,,,.::.....TT',
    'TT....,,,,.::..R..TT',
    'TT....,,,,.::.....TT',
    'TT.S.......::.ff..TT',
    'TT.........::.....TT',
    'TT=========::=====TT',
    'TT.........::.....TT',
    'TT.,,,,,,..::.....TT',
    'TT.,,,,,,..::.,,,.TT',
    'TT.,,,,,,..::.,,,.TT',
    'TT.........::.,,,.TT',
    'TTTTT......::.....TT',
    'TTTTT.....::......TT',
    'TT........::...f..TT',
    'TT..,,,,..::......TT',
    'TT..,,,,..::..,,,.TT',
    'TT..,,,,..::..,,,.TT',
    'TT........::..,,,.TT',
    'TT.ff.....::......TT',
    'TT=====...::..====TT',
    'TT........::......TT',
    'TT..,,,...::...,,.TT',
    'TT..,,,...::...,,.TT',
    'TT........::......TT',
    'TTTTTTTTT::TTTTTTTTT',
    'TTTTTTTTT::TTTTTTTTT',
  ],
  edges: { s: { to: 'pueblo_alba', d: 2 }, n: { to: 'villa_musgo', d: 5 } },
  encounters: { rate: 0.1, list: [{ sp: 'rabin', min: 2, max: 5, w: 40 }, { sp: 'pipio', min: 2, max: 5, w: 35 }, { sp: 'larvita', min: 3, max: 4, w: 20 }, { sp: 'psiqui', min: 3, max: 4, w: 5 }] },
  signs: [{ x: 3, y: 13, text: 'RUTA 1\nNorte: Villa Musgo\nSur: Pueblo Alba' }],
  items: [{ x: 3, y: 2, item: 'esfera', qty: 2, flag: 'it_r1_a' }, { x: 16, y: 30, item: 'pocion', qty: 1, flag: 'it_r1_b' }],
  npcs: [
    { id: 'r1_leo', x: 7, y: 23, look: 'youngster', dir: 'right', trainer: { cls: 'Joven', name: 'Leo', party: [['rabin', 4], ['pipio', 4]], sight: 4,
      intro: ['¡Eh, tú! ¡Mis ánimas están listas para luchar!'], lose: ['¡Vaya! Eres muy bueno moviéndote.'], after: ['Esquivar en el momento justo es clave. ¡Pulsa ESPACIO!'] } },
    { id: 'r1_sara', x: 14, y: 10, look: 'lass', dir: 'left', trainer: { cls: 'Chica', name: 'Sara', party: [['pipio', 5], ['larvita', 4]], sight: 4,
      intro: ['¡Te he visto venir! ¿Combatimos?'], lose: ['¡Ay! Mis pobres ánimas...'], after: ['Si te alejas del rival, los ataques a distancia son muy útiles.'] } },
    { id: 'r1_man', x: 13, y: 33, look: 'boy', move: 'wander', say: ['Si un ánima salvaje está debilitada, ¡es más fácil capturarla!', 'Abre la mochila en combate y lanza una Esfera.'] },
  ],
});

// ---------- Villa Musgo ----------
defMap('villa_musgo', {
  name: 'Villa Musgo', music: 'city', outdoor: true, bg: 'grass', w: 30,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT..........................TT',
    'TT..fff....HHHHHHH....fff...TT',
    'TT.........HHHHHHH..........TT',
    'TT.........HHHHHHH..........TT',
    'TT.........HHHHHHH..........TT',
    'TT.........HHHDHHH..........TT',
    'TT............:..S..........TT',
    'TT...::::::::::::::::::::...TT',
    'TT..HHHHH.....:.....HHHHH...TT',
    'TT..HHHHH.....:.....HHHHH...TT',
    'TT..HHHHH.....:.....HHHHH...TT',
    'TT..HHDHH.....:.....HHDHH:::::',
    'TT....::::::::::::::::::::::TT',
    'TT............:.............TT',
    'TT.ff.........:........ff...TT',
    'TT.HHHH.......:......HHHHH..TT',
    'TT.HHHH.......:......HHHHH..TT',
    'TT.HHHH.......:......HHHHH..TT',
    'TT.HDHH.......:......HHHDH..TT',
    'TT............:..S..........TT',
    'TT............::............TT',
    'TTTTTTTTTTTTTT::TTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTT::TTTTTTTTTTTTTT',
  ],
  buildings: [
    { x: 11, y: 2, w: 7, h: 5, style: 'gym', door: 3, to: 'gym1' },
    { x: 4, y: 9, w: 5, h: 4, style: 'center', door: 2, to: 'centro_musgo' },
    { x: 20, y: 9, w: 5, h: 4, style: 'mart', door: 2, to: 'tienda_musgo' },
    { x: 3, y: 16, w: 4, h: 4, style: 'house3', door: 1, to: 'casa_musgo_a' },
    { x: 21, y: 16, w: 5, h: 4, style: 'house', door: 3, to: 'casa_musgo_b' },
  ],
  edges: { s: { to: 'ruta1', d: -5 }, e: { to: 'ruta2', d: -4 } },
  signs: [
    { x: 17, y: 7, text: 'GIMNASIO DE VILLA MUSGO\nLíder: Hiedra\n"La paciencia de las raíces."' },
    { x: 17, y: 20, text: 'VILLA MUSGO\nUn rincón verde y tranquilo.' },
  ],
  npcs: [
    { id: 'vm_worker', x: 27, y: 12, look: 'worker', dir: 'left', hideIf: 'badge1', say: ['Un árbol caído bloquea la Ruta 2.', 'La líder Hiedra sabe cómo moverlo... Pero solo ayuda a quien gana su medalla.'] },
    { id: 'vm_old', x: 9, y: 15, look: 'oldwoman', move: 'look', say: ['Las ánimas de tipo Fuego derriten a las de Planta.', 'Hiedra, la líder del gimnasio, usa ánimas de Planta.'] },
    { id: 'vm_kid', x: 18, y: 4, look: 'boy', move: 'wander', say: ['¡Cuando sea mayor quiero ser líder de gimnasio!'] },
    { id: 'vm_girl', x: 24, y: 14, look: 'lass', move: 'wander', say: ['Cada ánima tiene su propio estilo. Algunos dicen que las formas finales cambian según cómo luches.'] },
  ],
});

// ---------- Ruta 2 ----------
defMap('ruta2', {
  name: 'Ruta 2', music: 'route', outdoor: true, bg: 'grass', w: 40, h: 18,
  build: [
    ['rect', 1, 2, 38, 14, '.'],
    ['rect', 8, 2, 3, 4, 'T'], ['rect', 20, 11, 4, 5, 'T'], ['rect', 28, 2, 2, 4, 'T'],
    ['rect', 3, 2, 5, 4, ','], ['rect', 12, 11, 7, 4, ','], ['rect', 23, 3, 4, 4, ','], ['rect', 30, 11, 7, 4, ','],
    ['rect', 32, 2, 4, 3, '~'], ['rect', 13, 4, 6, 1, '='],
    ['rect', 0, 8, 40, 1, ':'],
    ['pts', 'f', [[11, 12], [10, 13], [25, 10], [26, 10], [2, 14]]],
    ['pts', 'R', [[17, 6], [27, 13]]], ['set', 3, 9, 'S'],
  ],
  edges: { w: { to: 'villa_musgo', d: 4 }, e: { to: 'bosque', d: 14 } },
  encounters: { rate: 0.1, list: [{ sp: 'rabin', min: 5, max: 8, w: 25 }, { sp: 'pipio', min: 5, max: 8, w: 25 }, { sp: 'voltin', min: 6, max: 8, w: 15 }, { sp: 'larvita', min: 5, max: 7, w: 15 }, { sp: 'guijin', min: 6, max: 8, w: 15 }, { sp: 'conejal', min: 9, max: 10, w: 5 }, { sp: 'hongui', min: 6, max: 8, w: 12 }, { sp: 'brisin', min: 6, max: 8, w: 6 }] },
  signs: [{ x: 3, y: 9, text: 'RUTA 2\nEste: Bosque Susurro\nOeste: Villa Musgo' }],
  items: [{ x: 5, y: 14, item: 'pocion', qty: 2, flag: 'it_r2_a' }, { x: 37, y: 3, item: 'esfera', qty: 3, flag: 'it_r2_b' }, { x: 16, y: 3, item: 'repelente', qty: 1, flag: 'it_r2_c' }],
  npcs: [
    { id: 'r2_tomas', x: 14, y: 6, look: 'bug', dir: 'down', trainer: { cls: 'Cazabichos', name: 'Tomás', party: [['larvita', 7], ['crisalix', 8]], sight: 3,
      intro: ['¡Mis bichos son los mejores!'], lose: ['¡Noooo! ¡Mi colección!'], after: ['Un Crisálix muy querido se convierte en algo precioso...'] } },
    { id: 'r2_raul', x: 27, y: 10, look: 'youngster', dir: 'up', trainer: { cls: 'Joven', name: 'Raúl', party: [['rabin', 8], ['pipio', 9]], sight: 3,
      intro: ['¡Entrené toda la mañana! ¡Mira!'], lose: ['¡Necesito entrenar toda la tarde también!'], after: ['¿Sabías que Conejal cambia según la hora del día en que evoluciona?'] } },
  ],
});

// ---------- Bosque Susurro ----------
defMap('bosque', {
  name: 'Bosque Susurro', music: 'forest', outdoor: true, dark: 0.18, bg: 'forest', w: 36, h: 30,
  build: [
    ['rect', 0, 22, 3, 1, ':'], ['rect', 3, 17, 9, 9, '.'], ['rect', 4, 22, 5, 3, ','],
    ['rect', 6, 9, 5, 9, ','], ['rect', 4, 4, 10, 6, '.'], ['rect', 5, 5, 4, 3, ','],
    ['rect', 13, 5, 8, 5, '.'], ['rect', 14, 1, 4, 5, '.'], ['rect', 15, 0, 2, 1, ':'],
    ['rect', 14, 12, 10, 8, '.'], ['rect', 16, 14, 4, 3, ','], ['rect', 11, 18, 4, 4, '.'],
    ['rect', 17, 9, 4, 4, ','], ['rect', 20, 5, 6, 4, '.'], ['rect', 25, 4, 9, 9, ','], ['rect', 27, 6, 4, 3, '.'],
    ['rect', 24, 20, 10, 7, '.'], ['rect', 22, 18, 5, 4, ','], ['rect', 28, 12, 5, 9, '.'],
    ['pts', 'f', [[5, 19], [9, 18], [22, 13], [26, 25], [32, 22], [12, 6]]],
  ],
  edges: { w: { to: 'ruta2', d: -14 }, n: { to: 'ciudad_roca', d: 0 } },
  encounters: { rate: 0.12, list: [{ sp: 'larvita', min: 7, max: 9, w: 25 }, { sp: 'crisalix', min: 8, max: 10, w: 15 }, { sp: 'pipio', min: 7, max: 9, w: 15 }, { sp: 'voltin', min: 8, max: 10, w: 15 }, { sp: 'umbrin', min: 8, max: 10, w: 10 }, { sp: 'alondro', min: 11, max: 12, w: 10 }, { sp: 'conejal', min: 10, max: 11, w: 10 }, { sp: 'hongui', min: 8, max: 10, w: 15 }, { sp: 'murcin', min: 9, max: 10, w: 8 }, { sp: 'psiqui', min: 9, max: 10, w: 6 }] },
  items: [{ x: 31, y: 25, item: 'nucleo_mente', qty: 1, flag: 'it_bq_a' }, { x: 5, y: 5, item: 'esfera', qty: 3, flag: 'it_bq_b' }, { x: 32, y: 5, item: 'superpocion', qty: 1, flag: 'it_bq_c' }, { x: 4, y: 18, item: 'baya', qty: 3, flag: 'it_bq_d' }, { x: 8, y: 10, item: 'amuleto_bicho', qty: 1, flag: 'it_bq_e' }],
  npcs: [
    { id: 'leg_silvaneo', x: 18, y: 15, look: 'boy', creature: 'silvaneo', lv: 36, dir: 'down', script: 'legend', showIf: 'chapter1_done', hideIf: 'leg_silvaneo' },
    { id: 'bq_ruben', x: 21, y: 7, look: 'bug', dir: 'left', trainer: { cls: 'Cazabichos', name: 'Rubén', party: [['crisalix', 10], ['polillux', 12]], sight: 4,
      intro: ['¡Shh! Estoy observando ánimas... ¡Pero un combate también vale!'], lose: ['Mi Polillux evolucionó porque lo cuidé mucho...'], after: ['El vínculo crece al ganar combates juntos y al pasear con tu ánima en el equipo.'] } },
    { id: 'bq_ada', x: 29, y: 8, look: 'lass', dir: 'down', trainer: { cls: 'Exploradora', name: 'Ada', party: [['voltin', 11], ['pipio', 11]], sight: 4,
      intro: ['¡Este bosque es enorme! ¿Luchamos mientras?'], lose: ['Bueno, al menos encontré a alguien.'], after: ['La salida hacia Ciudad Roca está al norte.'] } },
    { id: 'bq_sam', x: 27, y: 23, look: 'bug', dir: 'left', trainer: { cls: 'Cazabichos', name: 'Sam', party: [['larvita', 10], ['larvita', 10], ['crisalix', 11]], sight: 3,
      intro: ['¡Tres bichos contra ti!'], lose: ['¡Eres una plaga para mis bichos!'], after: ['Dicen que hay un núcleo mineral escondido al sureste del bosque.'] } },
  ],
});

// ---------- Ciudad Roca ----------
defMap('ciudad_roca', {
  name: 'Ciudad Roca', music: 'city', outdoor: true, bg: 'city', w: 32, h: 26,
  build: [
    ['rect', 1, 1, 30, 24, '.'], ['rect', 1, 1, 30, 1, 'W'],
    ['rect', 3, 13, 27, 1, ':'], ['rect', 29, 13, 3, 1, ':'], ['rect', 15, 13, 2, 13, ':'], ['rect', 15, 8, 1, 5, ':'],
    ['set', 5, 12, ':'], ['set', 25, 12, ':'], ['rect', 5, 14, 1, 2, ':'], ['rect', 24, 14, 1, 2, ':'],
    ['bld', 12, 3, 8, 5, 'gym', 3, 'gym2'], ['bld', 3, 8, 5, 4, 'center', 2, 'centro_roca'], ['bld', 23, 8, 5, 4, 'mart', 2, 'tienda_roca'],
    ['bld', 3, 16, 5, 4, 'house2', 2, 'casa_roca_a'], ['bld', 22, 16, 5, 4, 'house', 2, 'casa_roca_b'],
    ['pts', 'R', [[10, 20], [11, 21], [20, 21], [28, 22], [2, 3], [28, 4]]],
    ['pts', 'f', [[9, 9], [10, 9], [21, 9], [9, 23], [21, 23], [22, 23]]],
    ['set', 18, 14, 'S'], ['set', 18, 8, 'S'],
  ],
  edges: { s: { to: 'bosque', d: 0 }, e: { to: 'ruta3', d: -6 } },
  signs: [
    { x: 18, y: 14, text: 'CIUDAD ROCA\nFirme como la montaña.' },
    { x: 18, y: 8, text: 'GIMNASIO DE CIUDAD ROCA\nLíder: Bruna\n"Duro como el granito."' },
  ],
  triggers: [{ x: 29, y: 13, w: 1, h: 1, script: 'rival2', ifFlag: 'badge2', unlessFlag: 'rival2_done' }],
  npcs: [
    { id: 'cr_guard', x: 30, y: 13, look: 'guard', dir: 'left', hideIf: 'badge2', say: ['La Ruta 3 está cerrada por desprendimientos.', 'Solo dejamos pasar a quien tenga la Medalla Peña de Bruna.'] },
    { id: 'cr_hiker', x: 8, y: 15, look: 'hiker', move: 'wander', say: ['Las ánimas de Roca resisten los ataques normales.', '¡Pero el Agua y la Planta las hacen pedazos!'] },
    { id: 'cr_girl', x: 21, y: 19, look: 'girl', move: 'wander', say: ['Mi Pedrusco evolucionó en Basaltor porque era más fuerte que resistente.'] },
    { id: 'cr_sci', x: 11, y: 12, look: 'scientist', move: 'look', say: ['He oído que el Equipo Eclipse merodea por la Cueva Eco...', 'Roban ánimas para extraer su energía. ¡Qué horror!'] },
  ],
});

// ---------- Ruta 3 ----------
defMap('ruta3', {
  name: 'Ruta 3', music: 'route', outdoor: true, bg: 'grass', w: 40, h: 16,
  build: [
    ['rect', 1, 2, 38, 12, '.'], ['rect', 1, 2, 30, 2, 'W'], ['rect', 31, 2, 8, 4, 'W'], ['set', 35, 5, 'M'], ['rect', 34, 6, 3, 1, ':'],
    ['rect', 0, 7, 36, 1, ':'], ['rect', 35, 6, 1, 2, ':'],
    ['rect', 5, 9, 8, 4, ','], ['rect', 18, 4, 6, 2, ','], ['rect', 24, 9, 9, 4, ','],
    ['rect', 2, 5, 10, 1, '='],
    ['pts', 'R', [[14, 10], [15, 11], [22, 8], [33, 9], [36, 11], [2, 12]]],
    ['pts', 'f', [[16, 12], [17, 12], [19, 10]]], ['set', 2, 8, 'S'],
  ],
  edges: { w: { to: 'ciudad_roca', d: 6 } },
  warps: [{ x: 35, y: 5, to: 'cueva', tx: 5, ty: 22, dir: 'up' }],
  encounters: { rate: 0.1, list: [{ sp: 'guijin', min: 12, max: 15, w: 25 }, { sp: 'conejal', min: 13, max: 15, w: 20 }, { sp: 'alondro', min: 13, max: 15, w: 20 }, { sp: 'voltin', min: 12, max: 14, w: 20 }, { sp: 'escamin', min: 12, max: 14, w: 15 }, { sp: 'brisin', min: 13, max: 15, w: 15 }, { sp: 'psiqui', min: 13, max: 14, w: 8 }, { sp: 'setalon', min: 15, max: 16, w: 5 }] },
  signs: [{ x: 2, y: 8, text: 'RUTA 3\nEste: Cueva Eco\n¡Cuidado con los desprendimientos!' }],
  items: [{ x: 3, y: 12, item: 'superesfera', qty: 2, flag: 'it_r3_a' }, { x: 37, y: 12, item: 'repelente', qty: 2, flag: 'it_r3_b' }, { x: 20, y: 4, item: 'superpocion', qty: 1, flag: 'it_r3_c' }, { x: 37, y: 9, item: 'amuleto_normal', qty: 1, flag: 'it_r3_d' }],
  npcs: [
    { id: 'leg_auroros', x: 20, y: 5, look: 'boy', creature: 'auroros', lv: 37, dir: 'down', script: 'legend', showIf: 'chapter1_done', hideIf: 'leg_auroros' },
    { id: 'r3_gil', x: 12, y: 8, look: 'hiker', dir: 'up', trainer: { cls: 'Montañero', name: 'Gil', party: [['guijin', 15], ['guijin', 16]], sight: 1,
      intro: ['¡Las montañas forjan ánimas duras!'], lose: ['¡Me has hecho polvo!'], after: ['La Cueva Eco conecta con Puerto Marea.'] } },
    { id: 'r3_ivan', x: 28, y: 6, look: 'youngster', dir: 'down', trainer: { cls: 'Joven', name: 'Iván', party: [['conejal', 17]], sight: 1,
      intro: ['¡Mi Conejal es el más rápido de la región!'], lose: ['¡Ni con su velocidad!'], after: ['Si evoluciona de noche, Conejal se convierte en Nocturo.'] } },
    { id: 'r3_lia', x: 34, y: 8, look: 'lass', dir: 'left', trainer: { cls: 'Chica', name: 'Lía', party: [['alondro', 17], ['voltin', 16]], sight: 3,
      intro: ['¿Vas a la cueva? ¡Primero, conmigo!'], lose: ['¡Increíble! Buena suerte en la cueva.'], after: ['Dentro de la cueva vi gente vestida de negro y morado...'] } },
  ],
});

// ---------- Cueva Eco ----------
defMap('cueva', {
  name: 'Cueva Eco', music: 'cave', outdoor: false, cave: true, dark: 0.25, bg: 'cave', w: 36, h: 28, fill: 'C', pad: 'C',
  build: [
    ['rect', 2, 19, 9, 7, 'c'], ['rect', 10, 20, 11, 5, 'c'], ['rect', 16, 9, 5, 12, 'c'], ['rect', 4, 9, 13, 5, 'c'],
    ['rect', 4, 2, 5, 8, 'c'], ['rect', 4, 2, 27, 5, 'c'], ['rect', 26, 2, 5, 18, 'c'], ['rect', 22, 18, 12, 7, 'c'],
    ['rect', 9, 14, 8, 5, 'c'], ['rect', 10, 15, 5, 2, 'w'],
    ['set', 5, 25, 'L'], ['set', 32, 21, 'L'],
    ['pts', 'o', [[18, 14], [6, 6], [28, 11], [3, 21], [25, 22], [13, 4], [12, 22], [24, 3], [19, 18]]],
  ],
  warps: [{ x: 5, y: 25, to: 'ruta3', tx: 35, ty: 6, dir: 'down' }, { x: 32, y: 21, to: 'puerto_marea', tx: 5, ty: 4, dir: 'down' }],
  encounters: { rate: 0.1, cave: true, list: [{ sp: 'umbrin', min: 15, max: 18, w: 30 }, { sp: 'guijin', min: 15, max: 17, w: 25 }, { sp: 'pedrusco', min: 18, max: 19, w: 10 }, { sp: 'voltin', min: 15, max: 17, w: 15 }, { sp: 'escamin', min: 15, max: 17, w: 10 }, { sp: 'dinamo', min: 18, max: 19, w: 5 }, { sp: 'penumbro', min: 19, max: 20, w: 5 }, { sp: 'murcin', min: 15, max: 18, w: 25 }, { sp: 'noctalar', min: 19, max: 20, w: 4 }] },
  items: [{ x: 12, y: 18, item: 'nucleo_hierro', qty: 1, flag: 'it_cv_a' }, { x: 2, y: 19, item: 'cuerda', qty: 1, flag: 'it_cv_b' }, { x: 20, y: 3, item: 'caramelo', qty: 1, flag: 'it_cv_c' }, { x: 33, y: 19, item: 'hiperpocion', qty: 1, flag: 'it_cv_d' }, { x: 9, y: 14, item: 'amuleto_sombra', qty: 1, flag: 'it_cv_e' }, { x: 29, y: 4, item: 'escama_dura', qty: 1, flag: 'it_cv_f' }],
  npcs: [
    { id: 'cv_g1', x: 14, y: 22, look: 'grunt', dir: 'left', trainer: { cls: 'Recluta Eclipse', name: '', party: [['umbrin', 17], ['rabin', 18]], sight: 4,
      intro: ['¡Alto! El Equipo Eclipse está trabajando aquí.', '¡Lárgate o te quitaremos tus ánimas!'], lose: ['¡Grr! ¡El comandante se enterará de esto!'], after: ['La energía de las ánimas nos hará poderosos...'] } },
    { id: 'cv_g2', x: 6, y: 8, look: 'grunt', dir: 'down', trainer: { cls: 'Recluta Eclipse', name: '', party: [['conejal', 18]], sight: 3,
      intro: ['¿Un niño con ánimas? ¡Perfecto para nuestra colección!'], lose: ['¿Cómo es posible?'], after: ['El Comandante Vesper está al fondo de la cueva.'] } },
    { id: 'cv_g3', x: 22, y: 4, look: 'grunt', dir: 'left', trainer: { cls: 'Recluta Eclipse', name: '', party: [['voltin', 17], ['guijin', 18]], sight: 5,
      intro: ['¡Intruso! ¡Intruso!'], lose: ['Me han ganado... ¡Comandante!'], after: ['No podrás detener el eclipse.'] } },
    { id: 'cv_vesper', x: 28, y: 16, look: 'vesper', dir: 'up', hideIf: 'vesper_done', trainer: { cls: 'Comandante', name: 'Vesper', party: [['penumbro', 20], ['nocturo', 21], ['dinamo', 22]], sight: 4, boss: true, music: 'eclipse',
      intro: ['Vaya, vaya. Así que tú eres quien está molestando a mis reclutas.', 'El Equipo Eclipse necesita la energía de las ánimas para cubrir el sol de esta región.', 'No permitiré que un crío se interponga.'],
      lose: ['Imposible... Tu vínculo con tus ánimas es... fuerte.', 'Nos retiramos por ahora. Pero el eclipse llegará.'], flagOnWin: 'vesper_done' } },
    { id: 'cv_gx1', x: 26, y: 16, look: 'grunt', dir: 'up', hideIf: 'vesper_done', say: ['¡El comandante te aplastará!'] },
    { id: 'cv_gx2', x: 27, y: 16, look: 'grunt', dir: 'up', hideIf: 'vesper_done', say: ['No pasarás de aquí.'] },
    { id: 'cv_gx3', x: 29, y: 16, look: 'grunt', dir: 'up', hideIf: 'vesper_done', say: ['¡Atrás, mocoso!'] },
    { id: 'cv_gx4', x: 30, y: 16, look: 'grunt', dir: 'up', hideIf: 'vesper_done', say: ['El eclipse se acerca...'] },
  ],
});

// ---------- Puerto Marea ----------
defMap('puerto_marea', {
  name: 'Puerto Marea', music: 'city', outdoor: true, bg: 'beach', w: 36, h: 28,
  build: [
    ['rect', 1, 1, 34, 26, '.'], ['rect', 1, 1, 10, 3, 'W'], ['set', 5, 3, 'M'],
    ['rect', 22, 1, 4, 26, 's'], ['rect', 26, 1, 10, 27, '~'], ['rect', 26, 11, 8, 1, 'K'], ['rect', 26, 20, 4, 1, 'K'],
    ['rect', 5, 4, 1, 8, ':'], ['rect', 2, 12, 24, 1, ':'], ['rect', 13, 11, 1, 4, ':'], ['rect', 5, 17, 1, 3, ':'], ['rect', 17, 12, 1, 9, ':'],
    ['bld', 10, 6, 8, 5, 'gym', 3, 'gym3'], ['bld', 3, 13, 5, 4, 'center', 2, 'centro_marea'], ['bld', 11, 15, 5, 4, 'mart', 2, 'tienda_marea'],
    ['bld', 3, 20, 5, 4, 'house3', 2, 'casa_marea_a'], ['bld', 15, 21, 5, 4, 'dock', 2, 'casa_marea_b'],
    ['rect', 19, 2, 3, 4, ','], ['rect', 1, 25, 6, 2, ','],
    ['pts', 'f', [[8, 18], [9, 18], [20, 14], [21, 14], [9, 25], [10, 25]]],
    ['rect', 1, 4, 3, 1, 'F'], ['set', 7, 12, 'S'], ['set', 18, 10, 'S'],
  ],
  warps: [{ x: 5, y: 3, to: 'cueva', tx: 31, ty: 21, dir: 'left' }],
  encounters: { rate: 0.12, list: [{ sp: 'escamin', min: 18, max: 21, w: 40 }, { sp: 'alondro', min: 18, max: 20, w: 25 }, { sp: 'aleton', min: 21, max: 22, w: 10 }, { sp: 'conejal', min: 18, max: 20, w: 15 }, { sp: 'nimbo', min: 19, max: 21, w: 10 }, { sp: 'mentalis', min: 19, max: 21, w: 6 }] },
  signs: [
    { x: 7, y: 12, text: 'PUERTO MAREA\nDonde la tierra abraza al mar.' },
    { x: 18, y: 10, text: 'GIMNASIO DE PUERTO MAREA\nLíder: Capitán Nerón\n"Tormenta en alta mar."' },
  ],
  items: [{ x: 20, y: 2, item: 'ultraesfera', qty: 2, flag: 'it_pm_a' }, { x: 1, y: 26, item: 'caramelo', qty: 1, flag: 'it_pm_b' }],
  triggers: [{ x: 25, y: 11, w: 1, h: 1, script: 'rival3', ifFlag: 'badge3', unlessFlag: 'rival3_done' }],
  npcs: [
    { id: 'pm_sailor', x: 26, y: 11, look: 'sailor', dir: 'left', hideIf: 'badge3', say: ['El muelle está reservado para la tripulación del Capitán Nerón.', 'Gana su medalla y podrás pasar.'] },
    { id: 'leg_marealis', x: 33, y: 11, look: 'boy', creature: 'marealis', lv: 38, dir: 'left', script: 'legend', showIf: 'chapter1_done', hideIf: 'leg_marealis' },
    { id: 'pm_fisher', x: 29, y: 20, look: 'fisher', dir: 'right', trainer: { cls: 'Pescador', name: 'Marcos', party: [['escamin', 20], ['escamin', 20], ['aleton', 22]], sight: 2,
      intro: ['¡Pica, pica! ¡Ah, eres tú! Luchemos.'], lose: ['Se me escapó el combate como un pez...'], after: ['Un Aletón que evoluciona en una cueva se vuelve un arrecife viviente.'] } },
    { id: 'pm_old', x: 9, y: 14, look: 'oldman', move: 'look', say: ['Nerón fue marinero durante cuarenta años.', 'Sus ánimas de Agua y Eléctrico son temibles. ¡Usa Planta o Roca!'] },
    { id: 'pm_girl', x: 20, y: 18, look: 'swimmer', move: 'wander', say: ['¡El agua está buenísima hoy!', 'Bueno... todavía no sé nadar.'] },
    { id: 'pm_sci', x: 8, y: 9, look: 'scientist', move: 'wander', say: ['El Equipo Eclipse huyó de la cueva gracias a ti. ¡Toda la ciudad habla de ello!'], showIf: 'vesper_done' },
  ],
});

// ---------- interiores ----------
const HOUSE_ROWS = [
  'xxXxxxxXxx',
  'bb_v___q_e',
  '__________',
  '___aa_____',
  '___aa_____',
  '__________',
  'q________q',
  '____m_____',
];
const HOUSE_ROWS2 = [
  'xXxxxxxxXx',
  'e_____v_qb',
  '__________',
  '__aa___rr_',
  '__aa___rr_',
  '__________',
  'q________q',
  '_____m____',
];
const CENTER_ROWS = [
  'xxxxxXxXxxxxx',
  'qttttthttttpq',
  'ttttttttttttt',
  'ttttnnnnntttt',
  'ttttttttttttt',
  'ttrrtttttrrtt',
  'ttrrtttttrrtt',
  'qtttttttttttq',
  'ttttttmtttttt',
];
const MART_ROWS = [
  'xxxxxXxxxxx',
  'tttttttbbbb',
  'ttttttttttt',
  'tntttttbbtt',
  'tnttttttttt',
  'tntttttbbtt',
  'qtttttttttq',
  'tttttmttttt',
];
function interior(id, name, rows, extra = {}) {
  return defMap(id, Object.assign({ name, rows: rows.slice(), music: extra.music || 'town', outdoor: false, bg: 'lab', pad: 'x' }, extra));
}
function makeCenter(id, name) {
  interior(id, name, CENTER_ROWS, { music: 'center', npcs: [
    { id: id + '_nurse', x: 6, y: 2, look: 'nurse', dir: 'down', script: 'nurse' },
    { id: id + '_visitor', x: 10, y: 6, look: ['boy', 'girl', 'oldman', 'lass'][id.length % 4], move: 'wander',
      say: id.length % 2 ? ['En el PC puedes guardar las ánimas que no lleves contigo.'] : ['Puedes llevar hasta seis ánimas en tu equipo.', 'Las demás se envían al PC automáticamente.'] },
  ], pcs: [[11, 1]] });
}
function makeMart(id, name, shop) {
  interior(id, name, MART_ROWS, { music: 'center', npcs: [
    { id: id + '_clerk', x: 0, y: 4, look: 'clerk', dir: 'right', script: 'shop', shop },
    { id: id + '_buyer', x: 6, y: 4, look: U.choice(['boy', 'lass', 'oldwoman']), move: 'wander', say: ['Las Superesferas capturan mejor que las Esferas normales.'] },
  ] });
}

interior('casa_jugador', 'Tu casa', HOUSE_ROWS, { npcs: [{ id: 'mom', x: 6, y: 3, look: 'mom', dir: 'left', script: 'mom' }] });
interior('casa_rival', 'Casa del rival', HOUSE_ROWS2, { npcs: [{ id: 'sister', x: 5, y: 3, look: 'sister', dir: 'down', script: 'sister' }] });
interior('lab', 'Laboratorio', [
  'xxxxXxxxXxxxx',
  'bbbkk_t_kkbbb',
  'ttttttttttttt',
  'ttttttttttttt',
  'ttttttttttttt',
  'tttttaaattttt',
  'bbtttttttttbb',
  'ttttttttttttt',
  'qtttttttttttq',
  'ttttttttttttt',
  'ttttttttttttt',
  'ttttttmtttttt',
], { music: 'town', npcs: [
  { id: 'prof', x: 6, y: 2, look: 'prof', dir: 'down', script: 'prof' },
  { id: 'lab_rival', x: 9, y: 4, look: 'rival', dir: 'left', hideIf: 'rival1_left', showIf: 'met_prof' },
  { id: 'lab_aide', x: 2, y: 8, look: 'scientist', move: 'wander', say: ['La Profesora Ceiba estudia cómo el estilo de combate cambia la evolución de las ánimas.', '¡Es un descubrimiento revolucionario!'] },
], starters: [[5, 5, 'ignito'], [6, 5, 'burbujo'], [7, 5, 'semillin']] });

makeCenter('centro_musgo', 'Centro Ánima'); makeCenter('centro_roca', 'Centro Ánima'); makeCenter('centro_marea', 'Centro Ánima');
makeMart('tienda_musgo', 'Tienda', 'musgo'); makeMart('tienda_roca', 'Tienda', 'roca'); makeMart('tienda_marea', 'Tienda', 'marea');

interior('casa_musgo_a', 'Casa', HOUSE_ROWS, { npcs: [
  { id: 'cma_old', x: 5, y: 2, look: 'oldman', dir: 'down', say: ['Cuando era joven, entrené un Fogarzo que solo luchaba cuerpo a cuerpo.', 'Se convirtió en un Magmaurio imponente. ¡El estilo lo es todo!'] },
] });
interior('casa_musgo_b', 'Casa', HOUSE_ROWS2, { npcs: [
  { id: 'cmb_girl', x: 4, y: 5, look: 'girl', dir: 'up', script: 'gift_berries' },
] });
interior('casa_roca_a', 'Casa', HOUSE_ROWS, { npcs: [
  { id: 'cra_sage', x: 6, y: 2, look: 'oldwoman', dir: 'down', script: 'sage' },
] });
interior('casa_roca_b', 'Casa', HOUSE_ROWS2, { npcs: [
  { id: 'crb_boy', x: 5, y: 4, look: 'boy', dir: 'left', script: 'gift_candy' },
] });
interior('casa_marea_a', 'Casa', HOUSE_ROWS, { npcs: [
  { id: 'cmaa_w', x: 5, y: 3, look: 'oldwoman', dir: 'down', say: ['Mi nieto se fue a la Liga Ánima del norte.', 'Dicen que solo pueden entrar quienes tienen ocho medallas...', 'Pero esa es otra historia.'] },
] });
interior('casa_marea_b', 'Casa del muelle', HOUSE_ROWS2, { npcs: [
  { id: 'cmab_s', x: 6, y: 3, look: 'sailor', dir: 'left', script: 'gift_ultra' },
] });

// ---------- gimnasios (con arena para el combate del líder) ----------
defMap('gym1', { name: 'Gimnasio Musgo', music: 'center', outdoor: false, bg: 'gym1', pad: 'Z', arena: { x: 1, y: 1, w: 13, h: 8 }, rows: [
  'ZZZZZZZZZZZZZZZ', 'ZjgggggggggggjZ', 'ZgggggggggggggZ', 'ZgggggggggggggZ', 'ZggggBgggBggggZ', 'ZgggggggggggggZ', 'ZggggBgggBggggZ', 'ZgggggggggggggZ', 'ZjgggggggggggjZ',
  'ZBBBBBBgBBBBBBZ', 'ZgggggggggggggZ', 'ZgggEgggggEgggZ', 'ZgggggggggggggZ', 'ZgggggggggggggZ', 'ZgggEgggggEgggZ', 'ZgggggggggggggZ', 'ZgggggggggggggZ', 'ZjgggggggggggjZ', 'ZgggggggggggggZ', 'ZggggggmggggggZ'],
  npcs: [
    { id: 'g1_leader', x: 7, y: 2, look: 'hiedra', dir: 'down', script: 'leader1' },
    { id: 'g1_t1', x: 2, y: 12, look: 'lass', dir: 'right', trainer: { cls: 'Jardinera', name: 'Flor', party: [['larvita', 9], ['crisalix', 10]], sight: 5,
      intro: ['¡Las plantas de este gimnasio crecen fuertes!'], lose: ['¡Me has podado!'], after: ['Hiedra usa Esporas para adormecer a sus rivales. ¡Muévete sin parar!'] } },
    { id: 'g1_t2', x: 12, y: 15, look: 'boy', dir: 'left', trainer: { cls: 'Jardinero', name: 'Olmo', party: [['rabin', 9], ['larvita', 10]], sight: 5,
      intro: ['¡No llegarás hasta Hiedra!'], lose: ['Arrancado de raíz...'], after: ['El Fuego y el Viento son eficaces contra la Planta.'] } },
    { id: 'g1_guide', x: 5, y: 18, look: 'guide', dir: 'right', script: 'guide' },
  ] });
defMap('gym2', { name: 'Gimnasio Roca', music: 'center', outdoor: false, bg: 'gym2', pad: 'Z', arena: { x: 1, y: 1, w: 13, h: 8 }, rows: [
  'ZZZZZZZZZZZZZZZ', 'ZjcccccccccccjZ', 'ZcccccccccccccZ', 'ZcccoccccccoccZ', 'ZcccccccccccccZ', 'ZccccccoccccccZ', 'ZcccccccccccccZ', 'ZcccoccccccoccZ', 'ZjcccccccccccjZ',
  'ZoooooocooooooZ', 'ZcccccccccccccZ', 'ZccoccccccccocZ', 'ZcccccccccccccZ', 'ZccccccoccccccZ', 'ZcccccccccccccZ', 'ZccoccccccccocZ', 'ZcccccccccccccZ', 'ZjcccccccccccjZ', 'ZcccccccccccccZ', 'ZccccccmccccccZ'],
  npcs: [
    { id: 'g2_leader', x: 7, y: 2, look: 'bruna', dir: 'down', script: 'leader2' },
    { id: 'g2_t1', x: 12, y: 12, look: 'hiker', dir: 'left', trainer: { cls: 'Montañero', name: 'Pico', party: [['guijin', 14], ['guijin', 15]], sight: 5,
      intro: ['¡Las rocas no se rinden!'], lose: ['¡Me has desmoronado!'], after: ['El Agua y la Planta rompen las rocas.'] } },
    { id: 'g2_t2', x: 2, y: 14, look: 'hiker', dir: 'right', trainer: { cls: 'Montañero', name: 'Risco', party: [['pedrusco', 16]], sight: 5,
      intro: ['¡Mi Pedrusco es una muralla!'], lose: ['¡Una muralla con grietas!'], after: ['Bruna ataca con Avalanchas. Mira las sombras en el suelo y apártate.'] } },
    { id: 'g2_t3', x: 12, y: 16, look: 'boy', dir: 'left', trainer: { cls: 'Minero', name: 'Tito', party: [['voltin', 15], ['guijin', 16]], sight: 4,
      intro: ['¡He picado piedra todo el día!'], lose: ['Voy a seguir picando...'], after: ['Las rocas del gimnasio sirven de cobertura. ¡Úsalas!'] } },
    { id: 'g2_guide', x: 5, y: 18, look: 'guide', dir: 'right', script: 'guide' },
  ] });
defMap('gym3', { name: 'Gimnasio Marea', music: 'center', outdoor: false, bg: 'gym3', pad: 'Z', arena: { x: 1, y: 1, w: 13, h: 8 }, rows: [
  'ZZZZZZZZZZZZZZZ', 'ZjgggggggggggjZ', 'ZgggggggggggggZ', 'ZggwwgggggwwggZ', 'ZgggggggggggggZ', 'ZggggggwggggggZ', 'ZgggggggggggggZ', 'ZggwwgggggwwggZ', 'ZjgggggggggggjZ',
  'ZwwwwwwgwwwwwwZ', 'ZgggggggggggggZ', 'ZgwwgggggggwwgZ', 'ZgggggggggggggZ', 'ZggggwwwwwggggZ', 'ZgggggggggggggZ', 'ZgwwgggggggwwgZ', 'ZgggggggggggggZ', 'ZjgggggggggggjZ', 'ZgggggggggggggZ', 'ZggggggmggggggZ'],
  npcs: [
    { id: 'g3_leader', x: 7, y: 2, look: 'neron', dir: 'down', script: 'leader3' },
    { id: 'g3_t1', x: 2, y: 12, look: 'swimmer', dir: 'right', trainer: { cls: 'Nadador', name: 'Delfín', party: [['escamin', 20], ['aleton', 22]], sight: 5,
      intro: ['¡Sumérgete en la batalla!'], lose: ['¡Glub, glub!'], after: ['El capitán tiene un Dínamo que paraliza con facilidad.'] } },
    { id: 'g3_t2', x: 12, y: 14, look: 'sailor', dir: 'left', trainer: { cls: 'Marinero', name: 'Ancla', party: [['burbujo', 20], ['voltin', 21]], sight: 5,
      intro: ['¡Todos a cubierta!'], lose: ['¡Hombre al agua!'], after: ['La Planta resiste tanto el Agua como el Eléctrico. ¡Úsala!'] } },
    { id: 'g3_t3', x: 2, y: 16, look: 'sailor', dir: 'right', trainer: { cls: 'Marinero', name: 'Boya', party: [['dinamo', 22]], sight: 5,
      intro: ['¡Olas eléctricas!'], lose: ['Me he quedado sin carga...'], after: ['Los charcos no paran los disparos, pero sí el paso.'] } },
    { id: 'g3_guide', x: 5, y: 18, look: 'guide', dir: 'right', script: 'guide' },
  ] });

linkDoors();
