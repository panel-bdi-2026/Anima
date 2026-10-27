'use strict';
// ============================================================
//  FUSIONES: el Altar de Quimeras (Ciudad Roca)
//  - 8 recetas fijas: dos líneas concretas (en 2.ª etapa o más),
//    nivel mínimo, vínculo alto, un catalizador y a veces una hora
//  - Las dos ánimas se consumen y nace una especie nueva
//  - Hereda nivel medio, los mejores valores de cada una y un
//    ataque elegido de cada progenitora
//  - Los catalizadores los sueltan los alfas (a veces) y los
//    jefes de las grietas; al conseguir uno se revela su receta
// ============================================================
const CHIMERAS = [
  { key: 'geiseron', name: 'Géiseron', types: ['fuego', 'agua'], base: [88, 90, 85, 110, 82], learn: L([[1, 'chorro'], [1, 'ascua'], [1, 'burbuja'], [30, 'lanzallamas'], [35, 'hidrobomba'], [42, 'llamarada'], [50, 'maremoto']]),
    desc: 'Nació de la unión de una llama y una escama de río. De su lomo brotan columnas de vapor hirviente.',
    look: { body: 'quad', c1: '#3a78a8', c2: '#d8eef8', c3: '#ff7a20', size: 1 } },
  { key: 'tempestron', name: 'Tempestrón', types: ['electrico', 'viento'], base: [80, 92, 75, 108, 105], learn: L([[1, 'chispa'], [1, 'rafaga'], [1, 'relampago'], [30, 'rayo'], [36, 'tornado'], [44, 'trueno'], [50, 'vendaval']]),
    desc: 'Un ave hecha de tormenta. Cuando bate las alas, el cielo se llena de relámpagos.',
    look: { body: 'bird', c1: '#3a6a7a', c2: '#f0f070', c3: '#f8f048', size: 1 } },
  { key: 'umbrarbol', name: 'Umbrárbol', types: ['planta', 'sombra'], base: [100, 100, 95, 90, 65], learn: L([[1, 'latigo'], [1, 'lenguetazo'], [1, 'drenaje'], [30, 'garra_umbria'], [36, 'tormenta_petalo'], [44, 'bola_sombra'], [50, 'rayo_solar']]),
    desc: 'Un árbol que creció en la oscuridad. Sus raíces beben la energía de quien se acerca de noche.',
    look: { body: 'golem', c1: '#4a3a5a', c2: '#8a7aa0', c3: '#b090ff', size: 1 } },
  { key: 'lunafalena', name: 'Lunafalena', types: ['bicho', 'mente'], base: [78, 70, 80, 112, 108], learn: L([[1, 'hilo'], [1, 'confusion'], [1, 'zumbido'], [30, 'psicorrayo'], [36, 'polvo_toxico'], [44, 'onda_mental'], [50, 'psiquico']]),
    desc: 'Sus alas guardan el brillo de la luna. El polvo que suelta provoca sueños que parecen reales.',
    look: { body: 'flyer', c1: '#3a4a8a', c2: '#e0e8ff', c3: '#c0d0ff', size: 1 } },
  { key: 'forjador', name: 'Forjador', types: ['roca', 'electrico'], base: [100, 112, 115, 70, 58], learn: L([[1, 'golpe_roca'], [1, 'puno_voltio'], [1, 'chispa'], [30, 'lanzarrocas'], [36, 'rayo'], [44, 'avalancha'], [50, 'terremoto']]),
    desc: 'Un coloso de hierro al rojo. Cada golpe suyo suena como un martillo sobre el yunque.',
    look: { body: 'golem', c1: '#4a4446', c2: '#ff8030', c3: '#ffd060', size: 1 } },
  { key: 'leviaton', name: 'Leviatón', types: ['agua', 'sombra'], base: [105, 108, 88, 96, 73], learn: L([[1, 'cola_marea'], [1, 'lenguetazo'], [1, 'chorro'], [30, 'garra_umbria'], [36, 'remolino'], [44, 'bola_sombra'], [50, 'hidrobomba']]),
    desc: 'Vive en las fosas donde no llega la luz. Los marineros temen ver brillar sus ojos bajo el agua.',
    look: { body: 'serpent', c1: '#2a2a5a', c2: '#8a90c0', c3: '#40f0d0', size: 1 } },
  { key: 'celestia', name: 'Celestia', types: ['planta', 'viento'], base: [90, 70, 85, 112, 98], learn: L([[1, 'hoja_filo'], [1, 'rafaga'], [1, 'esporas'], [30, 'tormenta_petalo'], [36, 'tornado'], [44, 'vendaval'], [50, 'rayo_solar']]),
    desc: 'Un jardín que flota entre las nubes. Por donde pasa, la hierba vuelve a crecer.',
    look: { body: 'biped', c1: '#66c06e', c2: '#e0f4ff', c3: '#a8d8ff', size: 1 } },
  { key: 'galerno', name: 'Galerno', types: ['normal', 'viento'], base: [80, 105, 72, 72, 126], learn: L([[1, 'embestida'], [1, 'picotazo'], [1, 'acometida'], [30, 'ala_corte'], [36, 'carga_brutal'], [44, 'vendaval'], [50, 'tornado']]),
    desc: 'La criatura más rápida de la región. Corre sobre el viento sin tocar el suelo.',
    look: { body: 'quad', c1: '#c0e0dc', c2: '#ffffff', c3: '#80b8d0', size: 1 } },
];
for (const s of CHIMERAS) {
  Object.assign(s, { catch: 0, exp: 250, chimera: true, stage: 3, prev: null });
  SPECIES_LIST.push(s);
  s.id = SPECIES_LIST.length;
  const [hp, atk, def, esp, vel] = s.base; s.stats = { hp, atk, def, esp, vel };
  SPECIES[s.id] = s; SPECIES[s.key] = s;
}

const FUSIONS = [
  { to: 'geiseron', a: 'ignito', b: 'escamin', lv: 28, item: 'piedra_vapor', hint: 'Cuando la llama del zorro abraza la escama del río, la tierra escupe vapor.' },
  { to: 'tempestron', a: 'voltin', b: 'pipio', lv: 30, item: 'nucleo_tormenta', time: 'night', hint: 'El ave del cielo y la chispa inquieta, bajo las estrellas, se vuelven tormenta.' },
  { to: 'umbrarbol', a: 'semillin', b: 'umbrin', lv: 30, item: 'semilla_umbria', time: 'night', hint: 'Brote y sombra, unidos en la noche, echan raíces en la oscuridad.' },
  { to: 'lunafalena', a: 'larvita', b: 'psiqui', lv: 26, item: 'polvo_lunar', time: 'night', hint: 'El capullo y la mente sueñan juntos cuando sale la luna.' },
  { to: 'forjador', a: 'guijin', b: 'voltin', lv: 32, item: 'yunque_ardiente', hint: 'Piedra y rayo, golpeados juntos, forjan un corazón de hierro.' },
  { to: 'leviaton', a: 'burbujo', b: 'umbrin', lv: 34, item: 'escama_abismo', hint: 'La burbuja y la sombra descienden juntas al abismo.' },
  { to: 'celestia', a: 'hongui', b: 'brisin', lv: 28, item: 'rocio_celeste', time: 'day', hint: 'La seta y la nube florecen juntas bajo el sol.' },
  { to: 'galerno', a: 'rabin', b: 'pipio', lv: 24, item: 'pluma_galerna', time: 'day', hint: 'El conejo y el pájaro, a plena luz, corren más que el viento.' },
];
const FUSION_BOND = 120;
const CATALYSTS = {
  piedra_vapor: ['Piedra Vapor', '#8ac8f0'], nucleo_tormenta: ['Núcleo Tormenta', '#f0e048'], semilla_umbria: ['Semilla Umbría', '#9a70e0'], polvo_lunar: ['Polvo Lunar', '#c8d4ff'],
  yunque_ardiente: ['Yunque Ardiente', '#ff8030'], escama_abismo: ['Escama Abismal', '#40c0b0'], rocio_celeste: ['Rocío Celeste', '#a8e8a0'], pluma_galerna: ['Pluma Galerna', '#e0f8ff'],
};
for (const [k, [name, color]] of Object.entries(CATALYSTS)) {
  const f = FUSIONS.find((x) => x.item === k);
  ITEMS[k] = { name, price: 0, desc: `Catalizador de fusión. Permite crear a ${SPECIES[f.to].name} en el Altar de Quimeras de Ciudad Roca.`, icon: 'core', color };
}
// etapa de las quimeras para la Constelación
{
  const _stage = Board.stageOf.bind(Board);
  Board.stageOf = (sp) => (SPECIES[sp].chimera ? 3 : _stage(sp));
}

// ---------- dibujos (a partir de sus progenitoras) ----------
const remix = (base, pal, o = {}) => {
  const B = HAND[base];
  const parts = B.parts.filter((p) => !(o.drop || []).includes(p.name)).map((p) => {
    const q = Object.assign({}, p);
    if (q.outline && o.partOutline) q.outline = o.partOutline;
    if (o.edit && o.edit[p.name]) Object.assign(q, o.edit[p.name]);
    return q;
  });
  for (const [idx, part] of o.add || []) parts.splice(idx < 0 ? parts.length + idx + 1 : idx, 0, part);
  return { pal, outline: o.outline || B.outline, eyeFur: B.eyeFur, flyer: o.flyer !== undefined ? o.flyer : B.flyer, body: B.body, parts };
};
HAND.geiseron = remix('magmaurio', { 1: '#1a3a5a', 2: '#2a5a80', 3: '#3a78a8', 4: '#5a98c8', 5: '#8ac0e8', a: '#3a3a48', b: '#5a5a6a', d: '#7a7a8a', g: '#a0a0b0', l: '#ff7a20', L: '#ffd050',
  c: '#d8eef8', C: '#a8c8e0', e: '#1a1020', w: '#ffe080', i: '#ff7a20', n: '#0a1a2a', k: '#0a1a2a', W: '#ffffff', r: '#8ac8f0', f: '#d8f0ff', F: '#ffffff' }, { outline: '#0a1a2a', partOutline: '#3a6a90' });
HAND.tempestron = bigBird({ 1: '#1a2a3a', 2: '#2a4a5a', 3: '#3a6a7a', 4: '#4a8a9a', 5: '#7ab8c8', c: '#f0f070', C: '#c8c040', y: '#f8f048', Y: '#ffffff', u: '#e8f0f8', U: '#a8b8c8',
  b: '#f0c040', B: '#b08820', l: '#f0c040', L: '#a08020', k: '#0e1820', e: '#100c08', w: '#fff060', i: '#f0c020' }, '#0a1418', {
  head: [{ name: 'cloud', role: 'crest', at: [9, 6], piv: [2, 6], outline: '#4a5a6a', rows: ['..uu..y', '.uUuu.y', 'uUUuuy.', '.UUU.y.', '..y.y..', '...y...'] }],
  tail: ['.....y.', '....yy.', '..33yY.', '3333yy.', '3322.y.', '.221.Y.'], tailOutline: '#0a1418',
  wing: ['..........uuuu', '........uuUu4.', '......uUu5443.', '.....5544433..', '....5544433...', '...554y43332..', '..5544y33322..', '.55444y33222..', '.5444333222...', '544433322211..', '44433322211...', '.443322111....', '..3322111.....'],
});
HAND.umbrarbol = remix('robledor', { 1: '#1a1222', 2: '#2a1e34', 3: '#3a2a48', 4: '#4a3a5a', 5: '#6a5878', b: '#2a1a30', c: '#8a7aa0', C: '#6a5a80', m: '#3a2a58', M: '#5a4080', N: '#a080e0',
  g: '#5a3a80', G: '#b090ff', s: '#2a1a40', r: '#3a3040', R: '#5a5068', e: '#2a0a30', w: '#f0c0ff', i: '#c070ff', k: '#0e0814' }, { outline: '#0a0610', partOutline: '#1a0e28' });
HAND.lunafalena = remix('polillux', { 1: '#2a3060', 2: '#3a4a8a', 3: '#5a6ab0', 4: '#8a9ad8', 5: '#c0ccf8', a: '#2a3a7a', A: '#1a2450', q: '#e0e8ff', Q: '#a0b0e0', y: '#fff0a0', e: '#ffffff', w: '#ffffff', i: '#80c0ff', f: '#d0d8ff' },
  { outline: '#10183a', partOutline: '#0e1430', add: [[-1, { name: 'moon', role: 'crest', at: [11, 23], piv: [0, 0], outline: '#3a3a10', rows: ['.yy', 'y..', 'y..', '.yy'] }]] });
HAND.forjador = remix('ferrovolt', { 1: '#1a1618', 2: '#2e2a2c', 3: '#4a4446', 4: '#6a6264', 5: '#8a8284', b: '#2a2224', c: '#ff8030', C: '#c05010', m: '#c05010', M: '#ff8030', N: '#ffd060',
  y: '#ff6020', Y: '#ffd060', r: '#3a3234', R: '#5a5254', e: '#200800', w: '#ffe080', i: '#ff9030', k: '#0e0a0a' }, { outline: '#0a0606', partOutline: '#5a1a08' });
HAND.leviaton = remix('marealis', { 1: '#0e1028', 2: '#1a1c40', 3: '#2a2a5a', 4: '#3a3a78', 5: '#5a5aa0', c: '#8a90c0', C: '#6a70a0', f: '#7a4ab8', F: '#a87ae0', e: '#40f0d0', w: '#c0fff0', i: '#40f0d0', k: '#06061a' },
  { outline: '#06061a', partOutline: '#2a1450' });
{
  const wing = ['..........uuuu', '........uu554.', '......u55544u.', '.....5554433..', '....5544433...', '...554443332..', '..5544433322..', '.55444333222..', '.5444333222...', '544433322211..', '44433322211...', '.443322111....', '..3322111.....']
    .map((r) => r.replace(/[1-5]/g, (d) => ({ 5: 'u', 4: 'U', 3: 'z', 2: 'Z', 1: 'Z' })[d]));
  HAND.celestia = remix('floraxia', Object.assign({}, HAND.floraxia.pal, { p: '#a8d8ff', P: '#6aa8e0', q: '#e0f4ff', u: '#ffffff', U: '#e0f4ff', z: '#b8dcf0', Z: '#88b8d8' }),
    { flyer: true, add: [[0, { name: 'wingF', role: 'wing', far: true, at: [16, 2], piv: [3, 12], outline: '#5a7a9a', rows: wing.map((r) => r.replace(/u/g, 'U')) }], [1, { name: 'wingN', role: 'wing', at: [13, 4], piv: [3, 12], outline: '#5a7a9a', rows: wing }]] });
  const wing2 = ['.......uu', '.....uuU.', '...uuUU..', '.uuUUU...', 'uUUUV....', 'UUVV.....', 'VV.......'];
  HAND.galerno = remix('liebron', { 1: '#3a6a6a', 2: '#5a8a8a', 3: '#8ab8b8', 4: '#c0e0dc', 5: '#f0fffc', c: '#ffffff', C: '#d8eae8', q: '#a0e0d8', u: '#ffffff', U: '#c8f0ff', V: '#80b8d0',
    n: '#1a3030', e: '#102020', w: '#ffffff', i: '#2a6a6a', p: '#a0e0d8', t: '#ffffff', T: '#c8e8e4' }, { outline: '#0e2424', drop: ['cloud'],
    add: [[0, { name: 'wingF', role: 'wing', far: true, at: [20, 12], piv: [0, 6], outline: '#3a6a7a', rows: wing2.map((r) => r.replace(/u/g, 'U')) }], [5, { name: 'wingN', role: 'wing', at: [17, 14], piv: [0, 6], outline: '#3a6a7a', rows: wing2 }]] });
}

// ---------- constelaciones de las quimeras ----------
Object.assign(BOARDS, {
  geiseron: { name: 'Géiser', rows: [
    '. . . K . . . .', '      |        ', '. M-S-L-A-M . .', '  |   |   |    ', '. p . v . f . .', '  |   |   |    ', 'H-S-D-@-D-A-H .', '      |        ', '. . . H . . . .', '      |        ', '. . r-M-c . . .', '               ', '. . . . . . . .'],
    moves: ['terremoto', 'psicorrayo', 'vendaval'],
    key: { name: 'Vapor Hirviente', desc: 'Sus ataques de fuego queman un 25% de las veces, y recibe un 15% menos de los golpes súper eficaces.', fx: { status: { type: 'fuego', s: 'burn', p: 0.25 }, resist: 0.15 } } },
  tempestron: { name: 'Ojo de la Tormenta', rows: [
    'K-V-c . . . . .', '    |          ', '. . A-S . M . .', '      |   |    ', '. H-D-@-V-x-A .', '  |   |        ', '. M . p-S-L . .', '  |       |    ', '. v-H . . o-M .', '               ', '. . . . . . . .', '               ', '. . . . . . . .'],
    moves: ['ala_corte', 'psicorrayo', 'lanzarrocas'],
    key: { name: 'Ojo de la Tormenta', desc: 'Sus ataques eléctricos paralizan un 25% de las veces, y sus ataques a distancia hacen +20% contra rivales lejanos.', fx: { status: { type: 'electrico', s: 'para', p: 0.25 }, range: 0.2 } } },
  umbrarbol: { name: 'Raíz Umbría', rows: [
    '. . . K . . . .', '      |        ', '. A-H-D-H-S . .', '  |       |    ', '. d . . . u . .', '  |       |    ', '. D-r-@-x-M . .', '      |        ', '. . . L . . . .', '      |        ', '. M-v-H-o-M . .', '               ', '. . . . . . . .'],
    moves: ['terremoto', 'pesadilla', 'golpe_roca'],
    key: { name: 'Savia Oscura', desc: 'De noche (o en un eclipse) hace +20% de daño, y recupera un 6% del daño que inflige.', fx: { night: 0.2, leech: 0.06 } } },
  lunafalena: { name: 'Polvo de Luna', rows: [
    '. . M-S . . . .', '    |          ', '. . p . K . . .', '    |   |      ', '. A-S-@-L-c . .', '      |        ', '. . . V-x-S . .', '      |   |    ', '. H-v-D . M . .', '  |            ', '. M . . . . . .', '               ', '. . . . . . . .'],
    moves: ['bola_sombra', 'rafaga', 'drenaje'],
    key: { name: 'Polvo Lunar', desc: 'Sus ataques de mente confunden un 25% de las veces, y cada esquiva perfecta le cura un 6% de PS.', fx: { status: { type: 'mente', s: 'confuse', p: 0.25 }, dodgeHeal: 0.06 } } },
  forjador: { name: 'Yunque', rows: [
    'A-D-A-D-A . . .', '|       |      ', 'H . . . M . . .', '|       |      ', 'D-u-f-@-S-K . .', '      |        ', '. . . H . . . .', '      |        ', '. M-d-L-x-M . .', '               ', '. . . . . . . .', '               ', '. . . . . . . .'],
    moves: ['ascua', 'carga_brutal', 'relampago'],
    key: { name: 'Martillo de Forja', desc: 'Sus ataques cargados hacen +25% de daño, y sus golpes cuerpo a cuerpo aturden un 12% de las veces.', fx: { charged: 0.25, stun: 0.12 } } },
  leviaton: { name: 'Abismo', rows: [
    '. . . . . . M .', '            |  ', '. . K-d-x-H-A .', '          |    ', '@-H-S-A-D-L . .', '  |     |      ', '. v . . o . . .', '  |     |      ', '. M-r-S-H-p-M .', '               ', '. . . . . . . .', '               ', '. . . . . . . .'],
    moves: ['psicorrayo', 'terremoto', 'vendaval'],
    key: { name: 'Hambre Abisal', desc: 'Con menos del 35% de PS hace +30% de daño, y recupera un 6% del daño que inflige.', fx: { lowHp: 0.3, leech: 0.06 } } },
  celestia: { name: 'Jardín Celeste', rows: [
    '. S . S . S . .', '  |   |   |    ', '. c-H-K-H-p . .', '      |        ', '. . . L . . . .', '      |        ', '. M-V-@-V-M . .', '  |   |   |    ', '. A . r . o . .', '  |   |   |    ', '. D-v-M-d-D . .', '               ', '. . . . . . . .'],
    moves: ['confusion', 'burbuja', 'ala_corte'],
    key: { name: 'Bendición Celeste', desc: 'Empieza cada combate con un escudo del 20% de sus PS, y su Sinergia se llena un 30% más rápido.', fx: { shield: 0.2, syn: 0.3 } } },
  galerno: { name: 'Viento Veloz', rows: [
    '. . . . . . . .', '               ', 'V-V-V-V-V-K . .', '|              ', '@ . M-x-u . . .', '|   |   |      ', 'A-c-S . A-M . .', '        |      ', '. H-o-D-L . . .', '  |            ', '. M . . . . . .', '               ', '. . . . . . . .'],
    moves: ['sombra_furtiva', 'tijera', 'puno_voltio'],
    key: { name: 'Viento Veloz', desc: 'Es un 12% más veloz, y sus ataques de viento ralentizan un 30% de las veces.', fx: { swift: true, status: { type: 'viento', s: 'slow', p: 0.3 } } } },
});

// ---------- catalizadores como botín ----------
const Fusion = {
  known(f) { return !!(G.flags['fus_' + f.to] || G.bag[f.item] || G.caught[SPECIES[f.to].id]); },
  dropCatalyst(foe) {
    const root = Board.root(foe.sp);
    const pool = FUSIONS.filter((f) => f.a === root || f.b === root);
    return U.choice(pool.length ? pool : FUSIONS).item;
  },
  candidates(f, line) { return G.party.filter((c) => Board.root(c.sp) === line && Board.stageOf(c.sp) >= 2 && !SPECIES[c.sp].chimera); },
  timeOk(f) { if (!f.time) return true; const day = Clock.isDay(); return f.time === 'day' ? day : !day; },
  // comprobación detallada de una receta
  check(f) {
    const ca = this.candidates(f, f.a), cb = this.candidates(f, f.b);
    const ok = (l) => l.filter((c) => c.lv >= f.lv && c.bond >= FUSION_BOND);
    const lines = [
      [ca.length > 0, `Línea de ${SPECIES[f.a].name} en 2.ª etapa o más`],
      [cb.length > 0, `Línea de ${SPECIES[f.b].name} en 2.ª etapa o más`],
      [ok(ca).length > 0 && ok(cb).length > 0, `Ambas a Nv ${f.lv}+ y con vínculo alto`],
      [!!G.bag[f.item], `Catalizador: ${ITEMS[f.item].name}`],
    ];
    if (f.time) lines.push([this.timeOk(f), f.time === 'night' ? 'Debe ser de noche' : 'Debe ser de día']);
    return { lines, ready: lines.every((l) => l[0]), A: ok(ca), Bc: ok(cb) };
  },
  async pick(list, label) {
    if (list.length === 1) return list[0];
    const r = await choose(list.map((c) => `${cName(c)} Nv${c.lv}`).concat(['Cancelar']), { x: 150, y: 40, w: 160 });
    return list[r] || null;
  },
  async fuse(f, a, b) {
    const pa = cName(a), pb = cName(b);
    await say(`Elige el ataque que heredará de ${pa}.`);
    const ma = await choose(a.moves.map((m) => MOVES[m].name), { x: 150, y: 50, w: 150 });
    await say(`Elige el ataque que heredará de ${pb}.`);
    const mb = await choose(b.moves.map((m) => MOVES[m].name), { x: 150, y: 50, w: 150 });
    const keepA = a.moves[Math.max(0, ma)], keepB = b.moves[Math.max(0, mb)];
    const lv = Math.max(f.lv, Math.round((a.lv + b.lv) / 2));
    Sound.music('ending');
    await runScene(new FusionScene(a.sp, b.sp, f.to));
    const c = newCreature(f.to, lv);
    for (const k in c.ivs) c.ivs[k] = Math.max(a.ivs[k] || 0, b.ivs[k] || 0);
    const own = SPECIES[f.to].learn.filter((e) => e.lv <= lv).map((e) => e.m).filter((m) => m !== keepA && m !== keepB);
    c.moves = [keepA, keepB].concat(own.slice(-2)).filter((m, i, arr) => MOVES[m] && arr.indexOf(m) === i).slice(0, 4);
    c.bond = Math.round((a.bond + b.bond) / 2);
    c.shiny = !!(a.shiny || b.shiny);
    c.hp = calcStats(c).hp;
    const ia = G.party.indexOf(a);
    G.party.splice(ia, 1, c);
    G.party.splice(G.party.indexOf(b), 1);
    Game.take(f.item);
    G.seen[SPECIES[f.to].id] = true; G.caught[SPECIES[f.to].id] = true;
    G.flags['fus_' + f.to] = true;
    Sound.jingle('evolve');
    await say([`¡${pa} y ${pb} se han fundido en uno!`, `¡Ha nacido ${SPECIES[f.to].name}! (Nv ${lv})`]);
    Sound.music(World.map.music);
  },
};

// ---------- el altar ----------
MAPS.ciudad_roca.npcs.push({ id: 'cr_altar', x: 11, y: 17, look: 'monk', dir: 'down', script: 'altar_quimeras' });
// botín: catalizadores
{
  const BP = BattleScene.prototype, _faint = BP.onFoeFaint;
  BP.onFoeFaint = async function () {
    const f = this.foe;
    await _faint.call(this);
    if (this.opts.practice || !G || G.practice || !this.wild) return;
    const p = this.opts.boss ? 0 : f.c.alpha ? 0.12 : 0;
    if (Math.random() < p) { const k = Fusion.dropCatalyst(f.c); Game.give(k, 1); Sound.jingle('item'); await this.banner(`¡Obtienes ${ITEMS[k].name}! (catalizador)`, 1.6, '#f0a0ff'); }
  };
  const _boss = Story.scripts.dng_boss;
  Story.scripts.dng_boss = async function (def, npc) {
    const had = Game.flag('dng_boss_' + G.dng.seed);
    await _boss.call(this, def, npc);
    if (had || !Game.flag('dng_boss_' + G.dng.seed)) return;
    const k = U.choice(FUSIONS).item; Game.give(k, 1); Sound.jingle('item');
    await say(`¡Entre el botín hay un catalizador: ${ITEMS[k].name}! (Altar de Quimeras, Ciudad Roca)`);
  };
}
