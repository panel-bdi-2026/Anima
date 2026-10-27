'use strict';
// ============================================================
//  CAPÍTULO 2: EL GRAN ECLIPSE
//  Ruta 4 → Ciudad Brasa (Fuego) → Ruta 5 volcánica → Pico Céfiro
//  (Viento) → Ruta 6 (lago) → Gruta Umbral → Ciudad Aurora (Mente)
//  → Torre Eclipse (Nyx). Eclipses reales tras la 5.ª medalla.
// ============================================================

// ---------- casillas volcánicas ----------
TILEDEF.A = { t: 'lava', solid: true, lava: true };
TILEDEF['%'] = { t: 'ash' };
ANIM_TILES.lava = 3;
TileDraw.lava = (x, f, v) => {
  P(x, 0, 0, 16, 16, '#b02810');
  const r = mulberry(31 + v * 7);
  for (let i = 0; i < 6; i++) { const px = Math.floor(r() * 14), py = (Math.floor(r() * 14) + f * 3) % 14; P(x, px, py, 3, 2, '#f06018'); P(x, px + 1, py, 1, 1, '#ffc040'); }
  for (let i = 0; i < 3; i++) { const px = (Math.floor(r() * 12) + f * 2) % 13; P(x, px, Math.floor(r() * 13), 4, 1, '#ffe080'); }
  P(x, 0, 0, 16, 1, '#701808');
};
TileDraw.ash = (x, f, v) => {
  P(x, 0, 0, 16, 16, '#6a6064');
  const r = mulberry(91 + v * 13);
  for (let i = 0; i < 12; i++) P(x, Math.floor(r() * 16), Math.floor(r() * 16), 1, 1, r() < 0.5 ? '#585054' : '#7e7478');
  if (v === 2) { P(x, 5, 9, 3, 2, '#4a4246'); P(x, 6, 8, 1, 1, '#8a8084'); }
};
Buildings.STYLES.tower = { roof: '#3a2458', wall: '#d8d0e8', trim: '#7a4ac0' };
Buildings.STYLES.forge = { roof: '#a04028', wall: '#e8dcc8', trim: '#5a3a28' };
Buildings.STYLES.chalet = { roof: '#e8eef8', wall: '#c8a878', trim: '#6a4a30' };
Object.assign(LOOKS, {
  ascua: { hair: '#e84020', hairStyle: 'spiky', shirt: '#f0a020', c2: '#802010', outfit: 'jacket', pants: '#402020', hat: '#f0d040', hatStyle: 'bandana' },
  brisa: { hair: '#a0e0f0', hairStyle: 'long', shirt: '#f0f8ff', c2: '#60a0d0', outfit: 'coat', pants: '#4a6a90' },
  selene: { hair: '#c080f0', hairStyle: 'bun', shirt: '#4a3a80', c2: '#e0c0ff', outfit: 'dress', pants: '#2a2050', acc: 'glasses' },
  nyx: { hair: '#f0f0ff', hairStyle: 'long', shirt: '#1a1028', c2: '#c040ff', outfit: 'coat', pants: '#100818', hat: '#3a1a58', hatStyle: 'beanie' },
  smith: { hair: '#3a2a20', hairStyle: 'bald', shirt: '#8a4a30', c2: '#e0c090', outfit: 'apron', pants: '#3a3030' },
  monk: { hair: '#202020', hairStyle: 'bald', shirt: '#e0a040', c2: '#a05020', outfit: 'coat', pants: '#a05020' },
});
BADGES.push(
  { name: 'Medalla Ascua', leader: 'Ascua', city: 'Ciudad Brasa' },
  { name: 'Medalla Céfiro', leader: 'Brisa', city: 'Pico Céfiro' },
  { name: 'Medalla Aurora', leader: 'Selene', city: 'Ciudad Aurora' },
);
Object.assign(SHOPS, {
  brasa: ['esfera', 'superesfera', 'ultraesfera', 'esfera_pesada', 'hiperpocion', 'revivir', 'repelente', 'cuerda', 'amuleto_fuego', 'amuleto_roca'],
  cefiro: ['superesfera', 'ultraesfera', 'esfera_rapida', 'esfera_nocturna', 'hiperpocion', 'revivir', 'repelente', 'amuleto_viento', 'cinta_veloz', 'garra_afilada'],
  aurora: ['ultraesfera', 'esfera_red', 'esfera_nocturna', 'hiperpocion', 'revivir', 'repelente', 'cuerda', 'amuleto_mente', 'amuleto_sombra', 'escama_dura', 'hierba_olvido'],
});
CLASS_PAY.Herrero = 30; CLASS_PAY.Alpinista = 30; CLASS_PAY.Monje = 35; CLASS_PAY.Vulcanóloga = 30; CLASS_PAY.Clarividente = 35; CLASS_PAY.Buceador = 30;

// ---------- Puerto Marea: salida sur (cerrada hasta acabar el capítulo 1) ----------
setCh(MAPS.puerto_marea, 12, 27, ':');
MAPS.puerto_marea.edges = Object.assign(MAPS.puerto_marea.edges || {}, { s: { to: 'ruta4', d: 0 } });
MAPS.puerto_marea.npcs.push({ id: 'pm_gate', x: 12, y: 26, look: 'guard', dir: 'down', hideIf: 'chapter1_done', say: ['La Ruta 4 está cerrada por desprendimientos.', 'Dicen que la abrirán cuando el puerto esté a salvo del Equipo Eclipse.'] });

// ---------- Ruta 4 ----------
defMap('ruta4', {
  name: 'Ruta 4', music: 'route', outdoor: true, bg: 'grass', w: 24, h: 32,
  build: [
    ['rect', 2, 1, 20, 30, '.'], ['rect', 12, 0, 1, 32, ':'],
    ['rect', 3, 3, 6, 5, ','], ['rect', 15, 5, 6, 4, ','], ['rect', 3, 13, 7, 4, ','], ['rect', 15, 16, 6, 5, ','], ['rect', 3, 24, 7, 4, ','],
    ['rect', 2, 10, 9, 1, '='], ['rect', 14, 26, 8, 1, '='],
    ['rect', 2, 19, 7, 3, '~'], ['set', 4, 20, 's'],
    ['pts', 'T', [[10, 7], [18, 12], [17, 13], [9, 22], [20, 23], [2, 30], [21, 1]]],
    ['pts', 'f', [[14, 3], [15, 3], [6, 9], [19, 29]]], ['set', 11, 2, 'S'],
  ],
  edges: { n: { to: 'puerto_marea', d: 0 }, s: { to: 'ciudad_brasa', d: 1 } },
  encounters: { rate: 0.12, list: [{ sp: 'conejal', min: 24, max: 27, w: 20 }, { sp: 'alondro', min: 24, max: 27, w: 20 }, { sp: 'fogarzo', min: 25, max: 27, w: 10 }, { sp: 'pedrusco', min: 25, max: 27, w: 15 }, { sp: 'dinamo', min: 25, max: 27, w: 12 }, { sp: 'setalon', min: 25, max: 27, w: 12 }, { sp: 'aleton', min: 25, max: 27, w: 10, weather: 'lluvia' }, { sp: 'penumbro', min: 26, max: 28, w: 8, time: 'noche' }] },
  signs: [{ x: 11, y: 2, text: 'RUTA 4\nNorte: Puerto Marea\nSur: Ciudad Brasa' }],
  items: [{ x: 20, y: 2, item: 'hiperpocion', qty: 1, flag: 'it_r4_a' }, { x: 3, y: 29, item: 'esfera_rapida', qty: 2, flag: 'it_r4_b' }, { x: 4, y: 20, item: 'amuleto_electrico', qty: 1, flag: 'it_r4_isle' }],
  npcs: [
    { id: 'r4_a', x: 7, y: 8, look: 'lass', dir: 'right', trainer: { cls: 'Exploradora', name: 'Marta', party: [['alondro', 25], ['conejal', 25]], sight: 4, intro: ['¡Al sur hace un calor de volcán!'], lose: ['¡Uf, qué sofoco!'], after: ['En Ciudad Brasa forjan amuletos de fuego.'] } },
    { id: 'r4_b', x: 17, y: 14, look: 'hiker', dir: 'left', trainer: { cls: 'Montañero', name: 'Bruno', party: [['pedrusco', 26], ['guijin', 25]], sight: 4, intro: ['¡Las rocas del sur arden!'], lose: ['¡Me he derretido!'], after: ['Los golpes fuertes rompen las rocas agrietadas.'] } },
    { id: 'r4_c', x: 8, y: 25, look: 'youngster', dir: 'right', trainer: { cls: 'Joven', name: 'Leo', party: [['dinamo', 26], ['fogarzo', 26]], sight: 3, intro: ['¡Mi equipo es eléctrico y ardiente!'], lose: ['¡Cortocircuito!'], after: ['Los ataques eléctricos sobre el agua dañan a quien la pise.'] } },
    { id: 'r4_walker', x: 13, y: 18, look: 'hiker', say: ['El volcán de Brasa lleva días rugiendo.'], routine: [R(6, 20, 'patrol', { path: [[13, 18], [13, 6], [13, 18]], pause: 2 })] },
  ],
});

// ---------- Ciudad Brasa ----------
defMap('ciudad_brasa', {
  name: 'Ciudad Brasa', music: 'volcano', outdoor: true, volcanic: true, bg: 'grass', w: 28, h: 24,
  build: [
    ['rect', 1, 1, 26, 22, '%'], ['rect', 13, 0, 1, 9, ':'], ['rect', 0, 8, 27, 1, ':'],
    ['bld', 3, 2, 5, 4, 'center', 2, 'centro_brasa'], ['bld', 19, 2, 5, 4, 'mart', 2, 'tienda_brasa'],
    ['bld', 10, 11, 8, 5, 'gym', 3, 'gym4'], ['rect', 13, 16, 1, 2, ':'], ['rect', 4, 18, 20, 1, ':'], ['rect', 8, 9, 1, 9, ':'],
    ['bld', 2, 13, 5, 4, 'forge', 2, 'casa_brasa_a'], ['bld', 21, 13, 5, 4, 'house', 2, 'casa_brasa_b'],
    ['rect', 2, 20, 4, 2, 'A'], ['rect', 21, 20, 5, 2, 'A'], ['rect', 25, 10, 1, 2, 'A'], ['rect', 1, 10, 1, 2, 'A'],
    ['pts', 'R', [[16, 21], [10, 21], [24, 6], [2, 7]]], ['pts', 'l', [[12, 9], [16, 9], [9, 17], [19, 17]]], ['set', 15, 6, 'S'],
  ],
  edges: { n: { to: 'ruta4', d: -1 }, w: { to: 'ruta5', d: 0 } },
  signs: [{ x: 15, y: 6, text: 'CIUDAD BRASA\nDonde el fuego forja el carácter.' }],
  npcs: [
    { id: 'cb_smith', x: 6, y: 18, look: 'smith', dir: 'up', say: ['¡Mi forja nunca se apaga!', 'El calor del volcán hace los mejores amuletos.'], routine: [R(7, 19, 'stay', { at: [6, 18], face: 'up', act: 'sweep' }), R(19, 7, 'home', { at: [4, 16] })] },
    { id: 'cb_girl', x: 18, y: 9, look: 'girl', say: ['La líder Ascua es muy impulsiva. ¡Le encanta el cuerpo a cuerpo!'], routine: [R(8, 20, 'wander', { area: [14, 9, 8, 3] }), R(20, 8, 'home', { at: [23, 16] })] },
    { id: 'cb_sci', x: 22, y: 10, look: 'scientist', dir: 'left', say: ['Estudio la lava. Si un ataque de fuego cae sobre hierba alta, ¡arde!', 'Y la hierba quemada tarda en volver a crecer... hasta que vuelves a entrar en la zona.'] },
    { id: 'cb_old', x: 4, y: 9, look: 'oldman', dir: 'right', say: ['Más allá del oeste está el Pico Céfiro, donde el viento nunca descansa.'] },
  ],
});
defMap('gym4', { name: 'Gimnasio Brasa', music: 'center', outdoor: false, bg: 'gym2', pad: 'Z', arena: { x: 1, y: 1, w: 13, h: 8 }, rows: [
  'ZZZZZZZZZZZZZZZ', 'ZjcccccccccccjZ', 'ZcccccccccccccZ', 'ZccAccccccAcccZ', 'ZcccccccccccccZ', 'ZccccccoccccccZ', 'ZcccccccccccccZ', 'ZccAccccccAcccZ', 'ZjcccccccccccjZ',
  'ZAAAAAAcAAAAAAZ', 'ZcccccccccccccZ', 'ZcoccccccccocZZ', 'ZcccccccccccccZ', 'ZccccAAAAAccccZ', 'ZcccccccccccccZ', 'ZcocccccccccocZ', 'ZcccccccccccccZ', 'ZjcccccccccccjZ', 'ZcccccccccccccZ', 'ZccccccmccccccZ'],
  npcs: [
    { id: 'g4_leader', x: 7, y: 2, look: 'ascua', dir: 'down', script: 'leader4' },
    { id: 'g4_t1', x: 2, y: 12, look: 'smith', dir: 'right', trainer: { cls: 'Herrero', name: 'Yunque', party: [['fogarzo', 28], ['pedrusco', 28]], sight: 5, intro: ['¡Te forjaré a martillazos!'], lose: ['¡Me has templado!'], after: ['Ascua carga con todo. Esquiva en el último momento y contraataca.'] } },
    { id: 'g4_t2', x: 11, y: 15, look: 'lass', dir: 'left', trainer: { cls: 'Vulcanóloga', name: 'Ceniza', party: [['basaltor', 29]], sight: 5, intro: ['¡Siente el calor del magma!'], lose: ['Me he enfriado...'], after: ['El Agua y la Roca apagan el fuego.'] } },
    { id: 'g4_guide', x: 5, y: 18, look: 'guide', dir: 'right', script: 'guide' },
  ] });

// ---------- Ruta 5 (volcánica) ----------
defMap('ruta5', {
  name: 'Ruta 5', music: 'volcano', outdoor: true, volcanic: true, bg: 'grass', w: 40, h: 18, fill: 'W',
  build: [
    ['rect', 1, 2, 38, 14, '%'], ['rect', 0, 8, 40, 1, ':'],
    ['rect', 8, 2, 2, 6, 'A'], ['rect', 8, 10, 2, 6, 'A'], ['rect', 8, 8, 2, 1, 'P'], ['rect', 8, 9, 2, 1, 'P'],
    ['rect', 20, 12, 6, 3, 'A'], ['rect', 27, 3, 5, 2, 'A'],
    ['rect', 1, 5, 7, 1, 'W'], ['rect', 7, 2, 1, 3, 'W'], ['set', 4, 5, 'V'],
    ['rect', 12, 3, 6, 4, ','], ['rect', 13, 10, 6, 4, ','], ['rect', 28, 10, 7, 4, ','], ['rect', 33, 3, 5, 3, ','],
    ['pts', 'R', [[22, 5], [24, 10], [36, 13], [3, 12], [17, 14]]], ['pts', 'U', [[19, 4], [19, 5]]], ['set', 37, 7, 'S'],
  ],
  edges: { e: { to: 'ciudad_brasa', d: 0 }, w: { to: 'pico_cefiro', d: 10 } },
  encounters: { rate: 0.12, list: [{ sp: 'fogarzo', min: 28, max: 30, w: 20 }, { sp: 'basaltor', min: 29, max: 31, w: 8 }, { sp: 'pedrusco', min: 28, max: 30, w: 20 }, { sp: 'dinamo', min: 28, max: 30, w: 15 }, { sp: 'noctalar', min: 28, max: 30, w: 15, time: 'noche' }, { sp: 'escarabron', min: 29, max: 31, w: 10 }, { sp: 'eclipsor', min: 31, max: 32, w: 3, time: 'noche' }] },
  signs: [{ x: 37, y: 7, text: 'RUTA 5\nEste: Ciudad Brasa\nOeste: Pico Céfiro\n¡No toques la lava!' }],
  items: [{ x: 4, y: 3, item: 'nucleo_hierro', qty: 1, flag: 'it_r5_sec' }, { x: 2, y: 2, item: 'caramelo', qty: 1, flag: 'it_r5_sec2' }, { x: 36, y: 15, item: 'ultraesfera', qty: 2, flag: 'it_r5_a' }, { x: 15, y: 15, item: 'revivir', qty: 1, flag: 'it_r5_b' }],
  npcs: [
    { id: 'r5_a', x: 15, y: 7, look: 'hiker', dir: 'down', trainer: { cls: 'Montañero', name: 'Magno', party: [['pedrusco', 29], ['basaltor', 30]], sight: 1, intro: ['¡Las rocas volcánicas son mis amigas!'], lose: ['¡Erupción fallida!'], after: ['Detrás de la roca agrietada del oeste hay algo escondido.'] } },
    { id: 'r5_b', x: 26, y: 9, look: 'smith', dir: 'up', trainer: { cls: 'Herrero', name: 'Fragua', party: [['fogarzo', 30], ['dinamo', 29], ['escarabron', 30]], sight: 1, intro: ['¡Vengo de forjar un amuleto nuevo!'], lose: ['Tendré que volver a la forja.'], after: ['Si quemas la hierba alta, las ánimas escondidas saldrán corriendo.'] } },
    { id: 'r5_c', x: 34, y: 7, look: 'lass', dir: 'down', trainer: { cls: 'Vulcanóloga', name: 'Lava', party: [['basaltor', 31]], sight: 1, intro: ['¡Mido la temperatura de tu equipo!'], lose: ['¡Termómetro roto!'], after: ['De noche, por aquí rondan ánimas sombrías.'] } },
  ],
});

// ---------- Pico Céfiro ----------
defMap('pico_cefiro', {
  name: 'Pico Céfiro', music: 'mountain', outdoor: true, bg: 'grass', w: 26, h: 26, fill: 'W',
  build: [
    ['rect', 1, 1, 24, 24, '.'], ['rect', 1, 12, 24, 1, '='], ['set', 12, 12, ':'],
    ['bld', 9, 3, 8, 5, 'gym', 3, 'gym5'], ['rect', 12, 8, 1, 11, ':'], ['rect', 12, 18, 14, 1, ':'], ['rect', 12, 19, 1, 7, ':'],
    ['bld', 3, 14, 5, 4, 'center', 2, 'centro_cefiro'], ['bld', 19, 13, 5, 4, 'mart', 2, 'tienda_cefiro'],
    ['bld', 3, 3, 5, 4, 'chalet', 2, 'casa_cefiro_a'], ['bld', 19, 3, 5, 4, 'chalet', 2, 'casa_cefiro_b'],
    ['pts', 'f', [[2, 9], [3, 9], [22, 9], [23, 10], [8, 22], [9, 22], [16, 23]]], ['pts', 'R', [[2, 23], [23, 23], [17, 21]]],
    ['rect', 3, 20, 6, 3, ','], ['set', 14, 10, 'S'], ['pts', 'l', [[11, 9], [13, 20], [6, 19]]],
  ],
  edges: { e: { to: 'ruta5', d: -10 }, s: { to: 'ruta6', d: 0 } },
  encounters: { rate: 0.08, list: [{ sp: 'nimbo', min: 31, max: 33, w: 30 }, { sp: 'alondro', min: 31, max: 33, w: 30 }, { sp: 'brisin', min: 30, max: 32, w: 30 }, { sp: 'granizor', min: 33, max: 34, w: 5 }] },
  signs: [{ x: 14, y: 10, text: 'PICO CÉFIRO\nAquí el viento canta a todas horas.' }],
  npcs: [
    { id: 'pc_monk', x: 15, y: 9, look: 'monk', dir: 'down', say: ['El viento enseña a no quedarse quieto.', 'Brisa, nuestra líder, nunca pelea dos veces igual.'] },
    { id: 'pc_kid', x: 7, y: 21, look: 'kid2', say: ['¡Cuando hay viento fuerte, las ánimas voladoras salen a jugar!'], routine: [R(8, 19, 'chase', { area: [3, 19, 8, 4], speed: 1.5 }), R(19, 8, 'home', { at: [5, 6] })] },
    { id: 'pc_old', x: 20, y: 20, look: 'oldwoman', dir: 'left', say: ['Últimamente el sol se oscurece a mediodía... Dicen que es cosa del Equipo Eclipse.'] },
  ],
});
defMap('gym5', { name: 'Gimnasio Céfiro', music: 'center', outdoor: false, bg: 'gym1', pad: 'Z', arena: { x: 1, y: 1, w: 13, h: 8 }, rows: [
  'ZZZZZZZZZZZZZZZ', 'ZjgggggggggggjZ', 'ZgggggggggggggZ', 'ZgggjgggggjgggZ', 'ZgggggggggggggZ', 'ZgggggggggggggZ', 'ZgggggggggggggZ', 'ZgggjgggggjgggZ', 'ZjgggggggggggjZ',
  'ZBBBBBBgBBBBBBZ', 'ZgggggggggggggZ', 'ZggjgggggggjggZ', 'ZgggggggggggggZ', 'ZgggggjggggggZZ', 'ZgggggggggggggZ', 'ZggjgggggggjggZ', 'ZgggggggggggggZ', 'ZjgggggggggggjZ', 'ZgggggggggggggZ', 'ZggggggmggggggZ'],
  npcs: [
    { id: 'g5_leader', x: 7, y: 2, look: 'brisa', dir: 'down', script: 'leader5' },
    { id: 'g5_t1', x: 2, y: 12, look: 'monk', dir: 'right', trainer: { cls: 'Monje', name: 'Aire', party: [['nimbo', 32], ['liebron', 32]], sight: 5, intro: ['Respira hondo... y lucha.'], lose: ['El viento cambia...'], after: ['Brisa se mueve sin parar. Los ataques de área la atrapan.'] } },
    { id: 'g5_t2', x: 12, y: 15, look: 'hiker', dir: 'left', trainer: { cls: 'Alpinista', name: 'Cumbre', party: [['granizor', 33]], sight: 5, intro: ['¡Desde la cumbre todo se ve claro!'], lose: ['¡Avalancha de derrotas!'], after: ['La Roca y el Eléctrico vencen al Viento.'] } },
    { id: 'g5_guide', x: 5, y: 18, look: 'guide', dir: 'right', script: 'guide' },
  ] });

// ---------- Ruta 6 (lago) ----------
defMap('ruta6', {
  name: 'Ruta 6', music: 'route', outdoor: true, bg: 'grass', w: 30, h: 30,
  build: [
    ['rect', 1, 1, 28, 28, '.'], ['rect', 12, 0, 1, 7, ':'],
    ['rect', 1, 8, 28, 10, '~'], ['rect', 12, 7, 1, 1, 'K'], ['rect', 12, 18, 1, 1, 'K'],
    ['rect', 18, 11, 3, 3, 's'],
    ['rect', 3, 2, 7, 4, ','], ['rect', 17, 2, 8, 3, ','], ['rect', 3, 19, 6, 3, ','], ['rect', 20, 19, 6, 3, ','],
    ['rect', 1, 24, 28, 5, 'W'], ['set', 14, 24, 'M'], ['rect', 12, 19, 1, 5, ':'], ['rect', 12, 23, 3, 1, ':'],
    ['pts', 'T', [[1, 1], [28, 1], [10, 21], [17, 21], [27, 22]]], ['pts', 'f', [[15, 4], [16, 5], [5, 22]]], ['set', 13, 2, 'S'],
  ],
  edges: { n: { to: 'pico_cefiro', d: 0 } },
  warps: [{ x: 14, y: 24, to: 'gruta_umbral', tx: 4, ty: 3, dir: 'right' }],
  encounters: { rate: 0.12, list: [{ sp: 'aleton', min: 32, max: 34, w: 25 }, { sp: 'marolo', min: 32, max: 34, w: 10 }, { sp: 'nimbo', min: 32, max: 34, w: 20 }, { sp: 'crisalix', min: 31, max: 33, w: 15 }, { sp: 'mentalis', min: 33, max: 34, w: 10 }, { sp: 'tifonar', min: 34, max: 35, w: 4, weather: 'lluvia' }, { sp: 'noctalar', min: 32, max: 34, w: 12, time: 'noche' }] },
  signs: [{ x: 13, y: 2, text: 'RUTA 6 · LAGO ESPEJO\nSolo los que saben nadar llegan a la otra orilla.' }],
  items: [{ x: 19, y: 12, item: 'piedra_sinergia', qty: 1, flag: 'it_r6_isle' }, { x: 26, y: 20, item: 'ultraesfera', qty: 3, flag: 'it_r6_a' }, { x: 2, y: 2, item: 'hiperpocion', qty: 2, flag: 'it_r6_b' }],
  triggers: [{ x: 10, y: 5, w: 5, h: 1, script: 'rival4', ifFlag: 'badge5', unlessFlag: 'rival4_done' }],
  npcs: [
    { id: 'r6_a', x: 6, y: 6, look: 'swimmer', dir: 'right', trainer: { cls: 'Buceador', name: 'Coral', party: [['aleton', 33], ['marolo', 33]], sight: 3, intro: ['¡El lago es mío!'], lose: ['¡Me ahogo en derrotas!'], after: ['En el islote del lago brilla algo.'] } },
    { id: 'r6_b', x: 22, y: 20, look: 'lass', dir: 'left', trainer: { cls: 'Clarividente', name: 'Iris', party: [['mentalis', 34], ['nubaria', 34]], sight: 3, intro: ['Vi tu derrota en mis sueños.'], lose: ['Mis sueños mentían...'], after: ['La Gruta Umbral es tan oscura que necesitarás luz.'] } },
  ],
});

// ---------- Gruta Umbral (muy oscura) ----------
defMap('gruta_umbral', {
  name: 'Gruta Umbral', music: 'cave', outdoor: false, cave: true, deep: true, bg: 'cave', w: 30, h: 22, fill: 'C', pad: 'C',
  build: [
    ['rect', 2, 2, 26, 4, 'c'], ['rect', 2, 6, 4, 10, 'c'], ['rect', 6, 16, 20, 4, 'c'], ['rect', 22, 6, 4, 10, 'c'], ['rect', 10, 8, 10, 5, 'c'], ['rect', 14, 6, 2, 2, 'c'],
    ['set', 3, 3, 'L'], ['set', 24, 18, 'L'], ['rect', 12, 18, 3, 1, 'w'],
    ['pts', 'o', [[8, 3], [18, 4], [4, 12], [20, 17], [11, 10]]], ['set', 15, 13, 'V'], ['rect', 14, 14, 3, 1, 'c'],
  ],
  warps: [{ x: 3, y: 3, to: 'ruta6', tx: 14, ty: 23, dir: 'down' }, { x: 24, y: 18, to: 'ciudad_aurora', tx: 3, ty: 3, dir: 'down' }],
  encounters: { rate: 0.1, cave: true, list: [{ sp: 'penumbro', min: 34, max: 36, w: 25 }, { sp: 'noctalar', min: 34, max: 36, w: 25 }, { sp: 'mentalis', min: 34, max: 36, w: 15 }, { sp: 'kinesio', min: 35, max: 37, w: 8 }, { sp: 'micelion', min: 35, max: 37, w: 8 }, { sp: 'lunargo', min: 36, max: 37, w: 4 }] },
  items: [{ x: 15, y: 14, item: 'maestra', qty: 1, flag: 'it_gu_sec' }, { x: 26, y: 3, item: 'revivir', qty: 2, flag: 'it_gu_a' }, { x: 3, y: 15, item: 'esfera_nocturna', qty: 3, flag: 'it_gu_b' }],
  triggers: [{ x: 22, y: 10, w: 4, h: 1, script: 'vesper2', unlessFlag: 'vesper2_done' }],
  npcs: [
    { id: 'gu_vesper', x: 23, y: 12, look: 'vesper', dir: 'up', hideIf: 'vesper2_done', say: ['...'] },
    { id: 'gu_gx1', x: 22, y: 12, look: 'grunt', dir: 'up', hideIf: 'vesper2_fight', say: ['¡No pasarás!'] },
    { id: 'gu_gx2', x: 24, y: 12, look: 'grunt', dir: 'up', hideIf: 'vesper2_fight', say: ['¡Órdenes de Nyx!'] },
    { id: 'gu_gx3', x: 25, y: 12, look: 'grunt', dir: 'up', hideIf: 'vesper2_fight', say: ['¡Atrás!'] },
    { id: 'gu_g1', x: 10, y: 4, look: 'grunt', dir: 'down', trainer: { cls: 'Recluta Eclipse', name: '', party: [['penumbro', 34], ['noctalar', 34]], sight: 3, intro: ['¡La oscuridad es nuestra aliada!'], lose: ['¡Me han deslumbrado!'], after: ['Nyx va a provocar el Gran Eclipse desde la torre.'] } },
    { id: 'gu_g2', x: 4, y: 14, look: 'grunt', dir: 'right', trainer: { cls: 'Recluta Eclipse', name: '', party: [['vampirax', 35]], sight: 2, intro: ['¡Shhh! ¡Aquí no se pasa!'], lose: ['¡Qué luz tan molesta!'], after: ['Sin Iluminar, en esta gruta no ves ni tus pies.'] } },
  ],
});

// ---------- Ciudad Aurora ----------
defMap('ciudad_aurora', {
  name: 'Ciudad Aurora', music: 'aurora', outdoor: true, bg: 'grass', w: 28, h: 26,
  build: [
    ['rect', 1, 1, 26, 24, '.'], ['rect', 1, 1, 6, 2, 'W'], ['set', 3, 2, 'M'],
    ['rect', 3, 3, 1, 9, ':'], ['rect', 3, 11, 22, 1, ':'], ['rect', 13, 6, 1, 6, ':'], ['rect', 13, 11, 1, 9, ':'], ['rect', 4, 19, 20, 1, ':'],
    ['bld', 10, 1, 7, 5, 'tower', 3, 'torre_eclipse'],
    ['bld', 4, 6, 5, 4, 'center', 2, 'centro_aurora'], ['bld', 19, 6, 5, 4, 'mart', 2, 'tienda_aurora'],
    ['bld', 10, 13, 8, 5, 'gym', 3, 'gym6'], ['rect', 13, 18, 1, 1, ':'],
    ['bld', 2, 20, 5, 4, 'house2', 2, 'casa_aurora_a'], ['bld', 21, 20, 5, 4, 'house', 2, 'casa_aurora_b'],
    ['pts', 'f', [[20, 3], [21, 3], [23, 4], [7, 15], [8, 16], [20, 15], [21, 16]]], ['pts', 'l', [[12, 10], [15, 10], [5, 18], [22, 18]]], ['set', 15, 12, 'S'],
  ],
  warps: [{ x: 3, y: 2, to: 'gruta_umbral', tx: 24, ty: 17, dir: 'up' }],
  signs: [{ x: 15, y: 12, text: 'CIUDAD AURORA\nLa ciudad donde amanecen las ideas.' }],
  npcs: [
    { id: 'ca_guard', x: 13, y: 6, look: 'guard', dir: 'down', hideIf: 'badge6', say: ['La Torre Eclipse está tomada por el Equipo Eclipse.', 'Solo dejaremos pasar a quien tenga la Medalla Aurora.'] },
    { id: 'ca_sci', x: 18, y: 11, look: 'scientist', say: ['Los eclipses de mediodía empezaron cuando Nyx ocupó la torre.', 'Durante un eclipse, las ánimas salvajes se vuelven más fuertes... ¡y dan más experiencia!'], routine: [R(8, 20, 'wander', { area: [15, 10, 8, 3] }), R(20, 8, 'home', { at: [21, 9] })] },
    { id: 'ca_girl', x: 7, y: 12, look: 'lass', dir: 'down', say: ['Selene, la líder, puede leer tus movimientos antes de que los hagas.'] },
  ],
});
defMap('gym6', { name: 'Gimnasio Aurora', music: 'center', outdoor: false, bg: 'gym3', pad: 'Z', arena: { x: 1, y: 1, w: 13, h: 8 }, rows: [
  'ZZZZZZZZZZZZZZZ', 'ZjtttttttttttjZ', 'ZtttttttttttttZ', 'ZttkttttttktttZ', 'ZtttttttttttttZ', 'ZttttttjttttttZ', 'ZtttttttttttttZ', 'ZttkttttttktttZ', 'ZjtttttttttttjZ',
  'ZkkkkkktkkkkkkZ', 'ZtttttttttttttZ', 'ZtjtttttttttjtZ', 'ZtttttttttttttZ', 'ZttttkkkkktttZZ', 'ZtttttttttttttZ', 'ZtjtttttttttjtZ', 'ZtttttttttttttZ', 'ZjtttttttttttjZ', 'ZtttttttttttttZ', 'ZttttttmttttttZ'],
  npcs: [
    { id: 'g6_leader', x: 7, y: 2, look: 'selene', dir: 'down', script: 'leader6' },
    { id: 'g6_t1', x: 2, y: 12, look: 'lass', dir: 'right', trainer: { cls: 'Clarividente', name: 'Visión', party: [['mentalis', 36], ['tesloria', 37]], sight: 5, intro: ['Ya sé qué vas a hacer.'], lose: ['Eso no lo vi venir...'], after: ['Selene tiene ataques que te persiguen. ¡Rómpeles la línea de visión!'] } },
    { id: 'g6_t2', x: 11, y: 15, look: 'scientist', dir: 'left', trainer: { cls: 'Clarividente', name: 'Psique', party: [['kinesio', 37], ['oniria', 37]], sight: 5, intro: ['Tu mente es un libro abierto.'], lose: ['Fin del capítulo...'], after: ['El Bicho y la Sombra son eficaces contra la Mente.'] } },
    { id: 'g6_guide', x: 5, y: 18, look: 'guide', dir: 'right', script: 'guide' },
  ] });
// ---------- Torre Eclipse ----------
defMap('torre_eclipse', { name: 'Torre Eclipse', music: 'tower', outdoor: false, bg: 'gym3', pad: 'Z', arena: { x: 1, y: 1, w: 13, h: 8 }, rows: [
  'ZZZZZZZZZZZZZZZ', 'ZjtttttttttttjZ', 'ZtttttttttttttZ', 'ZttttktttktttZZ', 'ZtttttttttttttZ', 'ZtttttttttttttZ', 'ZtttttttttttttZ', 'ZttttktttktttZZ', 'ZjtttttttttttjZ',
  'ZkkkkktttkkkkkZ', 'ZtttttttttttttZ', 'ZtkttttttttktZZ', 'ZtttttttttttttZ', 'ZttttkkkkktttZZ', 'ZtttttttttttttZ', 'ZtkttttttttktZZ', 'ZtttttttttttttZ', 'ZjtttttttttttjZ', 'ZtttttttttttttZ', 'ZttttttmttttttZ'],
  npcs: [
    { id: 'te_nyx', x: 7, y: 2, look: 'nyx', dir: 'down', script: 'nyx', hideIf: 'nyx_done' },
    { id: 'te_g1', x: 2, y: 16, look: 'grunt', dir: 'right', trainer: { cls: 'Recluta Eclipse', name: '', party: [['penumbro', 37], ['lunavela', 37]], sight: 5, intro: ['¡Nadie interrumpirá el Gran Eclipse!'], lose: ['¡Nyx se enfadará!'], after: ['Nyx está en lo alto. Su ánima cambia cuando se enfurece.'] } },
    { id: 'te_g2', x: 12, y: 14, look: 'grunt', dir: 'left', trainer: { cls: 'Recluta Eclipse', name: '', party: [['vampirax', 38], ['micelion', 37]], sight: 5, intro: ['¡La luz se acabó para ti!'], lose: ['¡Aaargh, qué brillo!'], after: ['El eclipse será eterno... o eso dice Nyx.'] } },
    { id: 'te_g3', x: 3, y: 12, look: 'grunt', dir: 'right', trainer: { cls: 'Comandante', name: 'Umbra', party: [['lunargo', 38], ['eclipsor', 38], ['noctalar', 37]], sight: 5, intro: ['Soy Umbra, mano derecha de Nyx.', '¡No subirás!'], lose: ['...Ve. Nyx te espera.'], after: ['Ni siquiera Vesper pudo contigo...'] } },
  ] });

// interiores
makeCenter('centro_brasa', 'Centro Ánima'); makeCenter('centro_cefiro', 'Centro Ánima'); makeCenter('centro_aurora', 'Centro Ánima');
makeMart('tienda_brasa', 'Tienda', 'brasa'); makeMart('tienda_cefiro', 'Tienda', 'cefiro'); makeMart('tienda_aurora', 'Tienda', 'aurora');
for (const id of ['centro_brasa', 'centro_cefiro', 'centro_aurora']) { setCh(MAPS[id], 9, 1, 'Y'); MAPS[id].npcs.push({ id: id + '_taller', x: 1, y: 2, look: 'worker', dir: 'right', script: 'taller' }); }
interior('casa_brasa_a', 'Forja', HOUSE_ROWS, { npcs: [{ id: 'cba_smith', x: 5, y: 3, look: 'smith', dir: 'down', script: 'gift_forge' }] });
interior('casa_brasa_b', 'Casa', HOUSE_ROWS2, { npcs: [{ id: 'cbb_w', x: 5, y: 3, look: 'oldwoman', dir: 'down', say: ['Mi marido trabajaba en el volcán. Dice que el Equipo Eclipse buscaba un cristal oscuro allí.'] }] });
interior('casa_cefiro_a', 'Casa', HOUSE_ROWS, { npcs: [{ id: 'cca_m', x: 5, y: 3, look: 'monk', dir: 'down', say: ['El estilo de un entrenador se nota en cómo se mueve su ánima.', 'Hay quien ataca de frente y quien prefiere la distancia. Los dos caminos son buenos.'] }] });
interior('casa_cefiro_b', 'Casa', HOUSE_ROWS2, { npcs: [{ id: 'ccb_k', x: 5, y: 3, look: 'kid2', dir: 'down', script: 'gift_wind' }] });
interior('casa_aurora_a', 'Casa', HOUSE_ROWS2, { npcs: [{ id: 'caa_s', x: 5, y: 3, look: 'scientist', dir: 'down', say: ['Albora, la ánima del alba, es la única luz capaz de romper un eclipse.', 'Pero nadie la ha visto desde hace siglos...'] }] });
interior('casa_aurora_b', 'Casa', HOUSE_ROWS, { npcs: [{ id: 'cab_o', x: 5, y: 3, look: 'oldman', dir: 'down', say: ['Antes la torre era un observatorio. Ahora solo se ve oscuridad.'] }] });

// enlaza las puertas de los mapas nuevos
for (const id of ['ciudad_brasa', 'pico_cefiro', 'ciudad_aurora']) {
  const m = MAPS[id];
  for (const b of m.buildings) {
    const inner = MAPS[b.to]; if (!inner) continue;
    const dx = b.x + b.door, dy = b.y + b.h - 1, mats = [];
    inner.rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === 'm') mats.push([x, y]); });
    m.warps.push({ x: dx, y: dy, to: b.to, tx: mats[0][0], ty: mats[0][1], dir: 'up', door: true });
    for (const [mx, my] of mats) inner.warps.push({ x: mx, y: my, to: id, tx: dx, ty: dy + 1, dir: 'down', mat: true });
    inner.parent = id;
  }
}
// recolección
Object.assign(NODES, {
  ruta4: [[20, 8, 'baya'], [2, 15, 'hongo']],
  ruta5: [[30, 6, 'mineral'], [23, 9, 'mineral'], [2, 10, 'mineral']],
  pico_cefiro: [[23, 21, 'baya']],
  ruta6: [[24, 6, 'baya'], [2, 21, 'hongo']],
  gruta_umbral: [[27, 4, 'mineral'], [7, 18, 'hongo'], [18, 9, 'mineral']],
});
// mapa de la región
Object.assign(REGION.nodes, {
  ruta4: { x: 262, y: 128, kind: 'route', ch: 2 },
  ciudad_brasa: { x: 262, y: 168, kind: 'town', ch: 2, desc: 'Ciudad volcánica de herreros. Gimnasio de Ascua (Fuego).' },
  ruta5: { x: 216, y: 168, kind: 'route', ch: 2 },
  pico_cefiro: { x: 170, y: 168, kind: 'town', ch: 2, desc: 'Pueblo de montaña azotado por el viento. Gimnasio de Brisa (Viento).' },
  ruta6: { x: 136, y: 168, kind: 'route', ch: 2 },
  gruta_umbral: { x: 112, y: 150, kind: 'cave', ch: 2, desc: 'Gruta oscurísima. Hace falta luz.' },
  ciudad_aurora: { x: 86, y: 158, kind: 'town', ch: 2, desc: 'Ciudad de sabios y astrónomos. Gimnasio de Selene (Mente).' },
  torre_eclipse: { x: 86, y: 132, kind: 'tower', ch: 2 },
});
REGION.links.push(['puerto_marea', 'ruta4'], ['ruta4', 'ciudad_brasa'], ['ciudad_brasa', 'ruta5'], ['ruta5', 'pico_cefiro'], ['pico_cefiro', 'ruta6'], ['ruta6', 'gruta_umbral'], ['gruta_umbral', 'ciudad_aurora'], ['ciudad_aurora', 'torre_eclipse']);
Object.assign(Quests, {});
// la Gruta Umbral solo se ve bien con Iluminar
{
  const _lights = World.collectLights;
  World.collectLights = function (cx, cy, L) {
    const out = _lights.call(this, cx, cy, L);
    if (this.map.deep && !Field2.can('iluminar')) for (const l of out) if (l.r === 110) l.r = 34;
    if (this.lavaTiles) for (const [x, y] of this.lavaTiles) { const sx = x * 16 + 8 - cx, sy = y * 16 + 8 - cy; if (sx > -40 && sy > -40 && sx < W + 40 && sy < H + 40) out.push({ x: sx, y: sy, r: 30, i: 0.7, glow: '#ff6020', gr: 16 }); }
    return out;
  };
  const _build = World.buildLayer;
  World.buildLayer = function () {
    _build.call(this);
    this.lavaTiles = [];
    const m = this.map;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.rows[y][x] === 'A' && (x + y) % 2 === 0) this.lavaTiles.push([x, y]);
  };
  const _at = Weather.at;
  Weather.at = function (map) { const w = _at.call(this, map); return map && map.volcanic && this.isRain(w) ? 'nublado' : w; };
}

// ---------- insignias nuevas ----------
{
  const _badge = Icons.badge;
  Icons.badge = function (i, size = 16) {
    if (i < 3) return _badge.call(this, i, size);
    const key = 'badge:' + i + ':' + size;
    if (this.cache[key]) return this.cache[key];
    const [c, x] = U.makeCanvas(16, 16), ink = '#1c1824';
    if (i === 3) { // Ascua: llama
      P(x, 6, 1, 3, 2, ink); P(x, 4, 3, 7, 3, ink); P(x, 3, 6, 10, 7, ink); P(x, 5, 13, 6, 2, ink);
      P(x, 7, 2, 1, 2, '#f8c040'); P(x, 5, 4, 5, 3, '#f06020'); P(x, 4, 7, 8, 5, '#f06020'); P(x, 6, 7, 4, 5, '#f8c040'); P(x, 7, 9, 2, 3, '#fff0a0'); P(x, 6, 12, 4, 1, '#c03010');
    } else if (i === 4) { // Céfiro: pluma
      P(x, 9, 1, 4, 3, ink); P(x, 6, 3, 6, 4, ink); P(x, 4, 6, 6, 4, ink); P(x, 2, 9, 5, 4, ink); P(x, 1, 13, 3, 2, ink);
      P(x, 10, 2, 2, 1, '#e0f8ff'); P(x, 7, 4, 4, 2, '#a0e0f8'); P(x, 5, 7, 4, 2, '#a0e0f8'); P(x, 3, 10, 3, 2, '#60b0e0'); P(x, 2, 13, 1, 1, '#ffffff');
    } else { // Aurora: ojo estrellado
      P(x, 4, 4, 8, 8, ink); P(x, 2, 6, 12, 4, ink); P(x, 3, 7, 10, 2, '#e0c0ff'); P(x, 5, 5, 6, 6, '#c080f0'); P(x, 6, 6, 4, 4, '#402070'); P(x, 7, 7, 2, 2, '#fff8c0'); P(x, 7, 1, 2, 3, ink); P(x, 7, 12, 2, 3, ink);
    }
    if (size !== 16) { const [c2, x2] = U.makeCanvas(size, size); x2.imageSmoothingEnabled = false; x2.drawImage(c, 0, 0, size, size); this.cache[key] = c2; return c2; }
    this.cache[key] = c; return c;
  };
  const _tc = TrainerCard.prototype.draw;
  TrainerCard.prototype.draw = function (ctx) {
    _tc.call(this, ctx);
    for (let i = 3; i < 6; i++) if (G.badges[i]) ctx.drawImage(Icons.badge(i), 36 + i * 30 + 3, 159);
  };
}

// ---------- historia del capítulo 2 ----------
const STAGE_OF = (k) => SPECIES[k].stage;
Object.assign(Story, {
  async leaderX(i, name, look, skill, team, intro, outro, gift, after) {
    const f = 'badge' + (i + 1), spk = 'Líder ' + name;
    if (Game.flag(f)) { await say(after, { speaker: spk }); return; }
    Sound.music('boss');
    await say(intro, { speaker: spk });
    const ar = MAPS[G.map].arena;
    if (ar) { await say('¡Colócate en tu lado de la arena!', { speaker: spk }); await World.walkTo(World.player, ar.x + Math.floor(ar.w / 2), ar.y + ar.h - 1); World.player.dir = 'up'; }
    const res = await Battle.trainer({ title: spk, cls: 'Líder', name, party: team, look, skill, boss: true, music: 'boss', gym: true });
    if (res !== 'win') return;
    Game.setFlag(f); G.badges[i] = true;
    await say(outro, { speaker: spk });
    await Sound.jingle('badge');
    await say(`¡${G.name} recibió la ${BADGES[i].name}!`);
    Game.give(gift, 1);
    await say([`Llévate también ${ITEMS[gift].name}.`, after], { speaker: spk });
    World.refreshNpcs();
  },
});
Object.assign(Story.scripts, {
  async leader4() {
    await Story.leaderX(3, 'Ascua', 'ascua', 0.82, [['fogarzo', 29], ['basaltor', 30], ['eclipsor', 30], ['solarix', 31], ['magmaurio', 33]],
      ['¡JA! ¡Por fin alguien con agallas! Soy Ascua.', '¡En mi gimnasio no hay sitio para la duda: se ataca y punto!', '¡Que arda la arena!'],
      ['¡Uf! ¡Me has apagado!', 'Te ganaste la MEDALLA ASCUA. ¡Con ella, Iluminar te alumbrará en las grutas!'], 'amuleto_fuego',
      'Si llevas un ánima de Fuego o Eléctrica, las cuevas oscuras dejarán de darte miedo. Sigue al oeste, al Pico Céfiro.');
  },
  async leader5() {
    await Story.leaderX(4, 'Brisa', 'brisa', 0.86, [['nimbo', 34], ['liebron', 34], ['tifonar', 35], ['tormentor', 35], ['cefireo', 37]],
      ['Bienvenido a la cima. Soy Brisa.', 'El viento no se puede atrapar... ¿podrás tocarme siquiera?'],
      ['El viento ha cambiado de dirección...', 'Toma la MEDALLA CÉFIRO.'], 'amuleto_viento',
      '¿Notas que el sol se apaga a mediodía? Son eclipses. El Equipo Eclipse está detrás. Cruza el lago de la Ruta 6, al sur.');
    if (Game.flag('badge5') && !Game.flag('eclipse_intro')) {
      Game.setFlag('eclipse_intro');
      await say(['Desde ahora, cada día a mediodía habrá un eclipse.', 'Durante un eclipse las ánimas salvajes se vuelven más fuertes, con un aura morada.', 'Detén al Equipo Eclipse en la torre de Ciudad Aurora.'], { speaker: 'Líder Brisa' });
    }
  },
  async leader6() {
    await Story.leaderX(5, 'Selene', 'selene', 0.9, [['mentalis', 37], ['tesloria', 38], ['nubaria', 38], ['kinesio', 39], ['oniria', 41]],
      ['Te esperaba. Soy Selene.', 'He visto mil combates en mi mente. En todos, tú pierdes.', 'Demuéstrame que el futuro puede cambiar.'],
      ['Ninguna de mis visiones era así...', 'La MEDALLA AURORA es tuya. Ahora podrás entrar en la Torre Eclipse.'], 'amuleto_mente',
      'Nyx está en lo alto de la torre. Ten cuidado: su ánima cambia cuando se enfurece.');
  },
  async gift_forge() {
    if (Game.flag('gift_forge')) { await say('¡Cuida ese amuleto! Lo forjé con lava del volcán.'); return; }
    Game.setFlag('gift_forge');
    await say(['¡Bienvenido a mi forja! Toma, un recuerdo de Brasa.']);
    Game.give('garra_afilada', 1); Game.give('mineral', 5); Sound.jingle('item');
    await say(`¡${G.name} recibió una Garra Afilada y 5 Minerales!`);
  },
  async gift_wind() {
    if (Game.flag('gift_wind')) { await say('¡Corre como el viento!'); return; }
    Game.setFlag('gift_wind');
    await say('¡He encontrado esto volando por el pueblo! ¡Para ti!');
    Game.give('esfera_rapida', 3); Sound.jingle('item');
    await say(`¡${G.name} recibió 3 Esferas Rápidas!`);
  },
  async rival4() {
    Sound.music('trainer');
    const p = World.player;
    const rv = World.spawnTemp('rival', p.x, p.y - 3, 'down');
    await say(`¡${G.name}! ¡Sabía que vendrías por aquí!`, { speaker: G.rival });
    await Story.safeWalk(rv, ['down', 'down']);
    p.dir = 'up';
    const st = Style.of();
    await say(Style.rivalLines(st), { speaker: G.rival });
    const res = await Battle.trainer({ title: G.rival, cls: 'Rival', name: G.rival, party: Style.rivalTeam(st), look: 'rival', skill: 0.86, boss: true, music: 'boss', npc: rv });
    if (res === 'win') {
      Game.setFlag('rival4_done');
      await say(['Has vuelto a ganar... pero esta vez he aprendido algo.', 'Al otro lado del lago está la Gruta Umbral. Sin luz no verás nada.', '¡Nos vemos en la torre!'], { speaker: G.rival });
      await Story.safeWalk(rv, ['up', 'up', 'up']);
    }
    World.removeTemp(rv);
    Sound.music(World.map.music);
  },
  async vesper2() {
    let v = World.npcs.find((n) => n.def.id === 'gu_vesper');
    Sound.music('eclipse');
    if (v) World.emote(v, '!');
    await say(['Vaya, vaya. El niño de la Cueva Eco.', 'Esta vez no estoy sola, y la oscuridad juega a mi favor.', '¡El Gran Eclipse no se detendrá!'], { speaker: 'Comandante Vesper' });
    if (!Game.flag('vesper2_fight')) { await say('¡Reclutas, apartaos! Este combate es mío.', { speaker: 'Comandante Vesper' }); Game.setFlag('vesper2_fight'); await Fade.out(0.3); World.refreshNpcs(); v = World.npcs.find((n) => n.def.id === 'gu_vesper'); await Fade.in(0.3); }
    const res = await Battle.trainer({ title: 'Comandante Vesper', cls: 'Comandante', name: 'Vesper', party: [['lunavela', 36], ['vampirax', 36], ['oniria', 37], ['penumbro', 37]], look: 'vesper', skill: 0.84, boss: true, music: 'eclipse', npc: v });
    if (res !== 'win') return;
    Game.setFlag('vesper2_done');
    await say(['...Otra vez.', 'Nyx no será tan amable. ¡Vámonos!'], { speaker: 'Comandante Vesper' });
    await Fade.out(0.4); World.refreshNpcs(); await Fade.in(0.4);
    Sound.music(World.map.music);
  },
  async nyx() {
    const n = World.npcs.find((x) => x.def.id === 'te_nyx');
    Sound.music('eclipse');
    await say([`Así que tú eres ${G.name}.`, 'Soy Nyx. Durante siglos, el sol ha decidido quién vive en la luz.', 'Con el Gran Eclipse, todas las ánimas serán iguales en la oscuridad.', 'No te dejaré estropearlo. ¡Contempla el poder de Eclipsor!'], { speaker: 'Nyx' });
    const ar = MAPS[G.map].arena;
    if (ar) { await World.walkTo(World.player, ar.x + Math.floor(ar.w / 2), ar.y + ar.h - 1); World.player.dir = 'up'; }
    const res = await Battle.trainer({ title: 'Nyx', cls: 'Comandante', name: 'Nyx', party: [['penumbro', 40], ['vampirax', 41], ['lunavela', 41], ['micelion', 41], ['eclipsor', 45]], look: 'nyx', skill: 0.93, boss: true, hpMul: 1.25, music: 'boss', npc: n });
    if (res !== 'win') return;
    Game.setFlag('nyx_done');
    await say(['No... la oscuridad... se disipa...', 'Quizá... la luz y la sombra deban convivir.'], { speaker: 'Nyx' });
    await Fade.out(0.6); World.refreshNpcs(); await Fade.in(0.6);
    await Story.ending2();
  },
  async ending2_talk() {},
});
Story.ending2 = async function () {
  Game.setFlag('chapter2_done');
  await say(['La luz vuelve a bañar la torre.', 'Los eclipses han terminado y la Región Alba respira tranquila.']);
  await Fade.out(1);
  Sound.music('ending');
  await runScene(new CreditsScene());
  World.refreshNpcs();
  Sound.music(World.map.music);
  await Fade.in(0.8);
  await say(['¡FIN DEL CAPÍTULO 2!', 'Has conseguido seis medallas y detenido el Gran Eclipse.', 'Más allá del norte espera la Liga Ánima... pero esa es otra historia. ¡No olvides guardar!']);
};
// la profesora anuncia la Ruta 4
{
  const _prof = Story.scripts.prof;
  Story.scripts.prof = async function (...a) {
    if (Game.flag('chapter1_done') && Game.flag('prof_legend_talk') && !Game.flag('prof_ch2_talk')) {
      Game.setFlag('prof_ch2_talk');
      await say(['¡Noticias! Han reabierto la Ruta 4, al sur de Puerto Marea.', 'Más allá hay tres gimnasios más: Brasa, Céfiro y Aurora.', 'Y algo raro pasa con el sol... Ten cuidado.'], { speaker: 'Profesora Ceiba' });
      return;
    }
    return _prof.apply(this, a);
  };
}
// objetivos
{
  const i = Objectives.list.findIndex((o) => String(o[0]).includes('chapter1_done'));
  Objectives.list.splice(i + 1, 0,
    [() => !G.badges[3], 'Viaja al sur desde Puerto Marea por la Ruta 4 y gana la Medalla Ascua en Ciudad Brasa.'],
    [() => !G.badges[4], 'Cruza la volcánica Ruta 5 hasta Pico Céfiro y gana la Medalla Céfiro.'],
    [() => !Game.flag('vesper2_done'), 'Cruza el lago de la Ruta 6 nadando y atraviesa la Gruta Umbral.'],
    [() => !G.badges[5], 'Gana la Medalla Aurora en Ciudad Aurora.'],
    [() => !Game.flag('nyx_done'), 'Sube a la Torre Eclipse y detén a Nyx.'],
  );
}

// ---------- estilo de combate: la región lo lee ----------
const Style = {
  totals() { let imp = 0, tem = 0; for (const c of G.party.concat(G.box)) if (c.style) { imp += c.style.imp; tem += c.style.tem; } return { imp, tem }; },
  of() { const { imp, tem } = this.totals(); if (imp + tem < 30) return 'novato'; if (imp > tem * 1.4) return 'impetu'; if (tem > imp * 1.4) return 'temple'; return 'equilibrio'; },
  title() { return { novato: 'Novato', impetu: 'Puño Ardiente', temple: 'Ojo de Halcón', equilibrio: 'Equilibrista' }[this.of()]; },
  desc() { return { novato: 'Aún buscas tu estilo.', impetu: 'Luchas cuerpo a cuerpo, de frente.', temple: 'Prefieres la distancia y las esquivas.', equilibrio: 'Combinas fuerza y distancia.' }[this.of()]; },
  rivalLines(st) {
    if (st === 'impetu') return ['Me he fijado en cómo luchas: siempre vas de frente.', '¡Esta vez he preparado un equipo que te frenará en seco y te atacará de lejos!'];
    if (st === 'temple') return ['Te pasas el combate esquivando y disparando desde lejos.', '¡Mi nuevo equipo es tan rápido que no te dará ni un respiro!'];
    return ['Luchas con equilibrio... difícil de leer.', '¡Pues yo voy con todo lo que tengo!'];
  },
  rivalTeam(st) {
    const rk = G.rivalStarter || 'burbujo', ace = STAGE3[rk] || STAGE2[rk];
    if (st === 'impetu') return [['robledor', 34], ['arrecifor', 34], ['tesloria', 35], ['nubaria', 35], [ace, 37]];
    if (st === 'temple') return [['liebron', 34], ['nocturo', 35], ['vampirax', 35], ['escarabron', 35], [ace, 37]];
    return [['tormentor', 35], ['kinesio', 34], ['abismar', 35], ['basaltor', 35], [ace, 37]];
  },
};
{
  // la ficha de entrenador muestra tu estilo
  const _tc = TrainerCard.prototype.draw;
  TrainerCard.prototype.draw = function (ctx) {
    _tc.call(this, ctx);
    Font.draw(ctx, 'Estilo', 36, 130, '#5a5068');
    Font.draw(ctx, Style.title(), 100, 130, '#7a3aa0');
  };
}

// ---------- eclipses ----------
const Eclipse = {
  active() {
    if (!G || !G.badges[4] || G.flags.nyx_done) return false;
    const h = Clock.hour();
    return h >= 12 && h < 14;
  },
};
{
  const _ll = World.lightLevel;
  World.lightLevel = function () {
    const L = _ll.call(this);
    if (this.map.outdoor && Eclipse.active()) return { a: Math.max(L.a, 0.6), color: '#100420', tint: '#6020a0', ta: 0.16 };
    return L;
  };
  const _upd = World.update;
  World.update = function (dt) {
    _upd.call(this, dt);
    const on = Eclipse.active();
    if (on && !this.eclipseOn && this.map.outdoor && Scenes.top() === this) { this.banner = { text: '¡Eclipse! El cielo se oscurece...', t: 0 }; Sound.sfx('shadow'); Shake.start(1, 0.5); }
    this.eclipseOn = on;
  };
  const _make = Wild.make;
  Wild.make = function (e, allowAlpha) {
    const c = _make.call(this, e, allowAlpha);
    if (Eclipse.active() && World.map && World.map.outdoor) { c.eclipsed = true; const lv = Math.min(100, c.lv + 3); if (lv !== c.lv) { const n = newCreature(c.sp, lv); n.alpha = c.alpha; n.shiny = c.shiny; n.eclipsed = true; return n; } }
    return c;
  };
  const _mk = BattleScene.prototype.mkFighter;
  BattleScene.prototype.mkFighter = function (c, side) {
    const f = _mk.call(this, c, side);
    if (c.eclipsed && side === 'foe') { f.stages.atk = Math.min(3, f.stages.atk + 1); f.stages.esp = Math.min(3, f.stages.esp + 1); }
    return f;
  };
  const _ground = BattleScene.prototype.drawGroundLayer;
  BattleScene.prototype.drawGroundLayer = function (ctx, cx, cy) {
    _ground.call(this, ctx, cx, cy);
    const f = this.foe;
    if (f && f.c.eclipsed && !f.inBall) { ctx.globalAlpha = 0.4 + 0.2 * Math.sin(this.t * 4); pixRing(ctx, f.x - cx, f.y - cy - 2, f.r + 7, '#a040ff', 2); ctx.globalAlpha = 1; }
  };
  const _exp = expYield;
  expYield = function (c, trainer) { return Math.floor(_exp(c, trainer) * (c.eclipsed ? 1.5 : 1)); };
  const _after = afterCatch;
  afterCatch = async function (c, where) { delete c.eclipsed; return _after(c, where); };
}

// ---------- música: nuevas piezas, variantes de noche, lluvia y eclipse ----------
Object.assign(SONGS, {
  volcano: { bpm: 120, chords: 'Dm Dm Bb C Dm Dm Gm A', style: { bass: 'drive', arp: 'fast', drums: 'pop', duty: 0.25 },
    mel: 'D5:2 F5:2 A5:4 G5:2 F5:2 E5:4 | D5:2 E5:2 F5:2 A5:2 D6:8 | Bb5:4 A5:2 G5:2 F5:4 D5:4 | C5:2 E5:2 G5:4 E5:2 C5:2 E5:4 | D5:2 F5:2 A5:2 D6:2 C6:4 A5:4 | F5:4 E5:2 D5:2 A4:8 | G5:4 Bb5:4 D6:4 Bb5:4 | A5:4 C#6:4 E6:8' },
  mountain: { bpm: 104, chords: 'G Em C D G Em Am D', style: { bass: 'soft', arp: 'fast', drums: 'soft', duty: 0.5 },
    mel: 'B4:2 D5:2 G5:4 A5:2 B5:2 D6:4 | E5:4 G5:2 B5:2 E6:8 | C6:2 B5:2 A5:2 G5:2 E5:4 C5:4 | D5:4 F#5:4 A5:8 | B5:2 A5:2 G5:2 D5:2 B4:4 G4:4 | E5:2 G5:2 B5:4 A5:2 G5:2 E5:4 | A5:4 C6:4 E6:4 C6:4 | D6:8 F#5:8' },
  aurora: { bpm: 88, chords: 'Em C G D Em C Am B', style: { bass: 'soft', arp: 'slow', drums: 'soft', duty: 0.125, lead: 'triangle' },
    mel: 'E5:4 G5:4 B5:6 A5:2 | G5:4 E5:4 C5:8 | D5:4 G5:4 B5:4 D6:4 | A5:8 F#5:8 | G5:2 A5:2 B5:4 E6:6 D6:2 | C6:4 B5:4 G5:8 | A5:4 C6:4 E5:4 A5:4 | B5:8 D#5:8' },
  tower: { bpm: 126, chords: 'Am Em F E Am Em Dm E', style: { bass: 'drive', arp: 'none', drums: 'battle', duty: 0.125, lead: 'triangle' },
    mel: 'A4:4 C5:2 E5:2 A5:4 G#5:4 | G5:4 E5:4 B4:8 | F5:2 E5:2 D5:2 C5:2 A4:4 C5:4 | B4:4 G#4:4 E4:8 | A5:4 E5:2 C5:2 A4:4 B4:4 | C5:2 D5:2 E5:4 B4:8 | D5:4 F5:4 A5:4 F5:4 | E5:4 G#5:4 B5:8' },
  festival: { bpm: 140, chords: 'C F G C Am F G C', style: { bass: 'walk', arp: 'fast', drums: 'pop', duty: 0.5 },
    mel: 'G5:2 E5:2 G5:2 C6:2 B5:2 G5:2 E5:4 | F5:2 A5:2 C6:4 A5:2 F5:2 C5:4 | D5:2 G5:2 B5:2 D6:2 C6:2 B5:2 G5:4 | E5:2 G5:2 C6:8 .:4 | A5:2 C6:2 E6:4 D6:2 C6:2 A5:4 | F5:2 A5:2 C6:4 B5:2 A5:2 F5:4 | G5:4 B5:4 D6:4 B5:4 | C6:8 C5:8' },
});
const Music2 = {
  WORLD: new Set(['town', 'route', 'city', 'forest', 'volcano', 'mountain', 'aurora']),
  variant(name, kind) {
    const key = name + '~' + kind;
    if (!SONGS[key]) {
      const b = SONGS[name], st = Object.assign({}, b.style);
      let bpm = b.bpm;
      if (kind === 'noche') { bpm = Math.round(bpm * 0.84); st.drums = st.drums === 'none' ? 'none' : 'soft'; st.arp = 'slow'; st.lead = 'triangle'; st.duty = 0.125; }
      if (kind === 'lluvia') { bpm = Math.round(bpm * 0.9); st.drums = 'none'; st.arp = 'slow'; st.duty = 0.25; }
      if (kind === 'eclipse') { bpm = Math.round(bpm * 0.72); st.drums = 'none'; st.arp = 'none'; st.lead = 'triangle'; st.bass = 'drive'; st.duty = 0.125; }
      SONGS[key] = Object.assign({}, b, { bpm, style: st });
    }
    return key;
  },
  pick(name) {
    if (!name || !this.WORLD.has(name) || !G || !World.map || Battle.active) return name;
    const m = World.map;
    if (typeof Events !== 'undefined' && Events.musicFor) { const e = Events.musicFor(m, name); if (e) return e; }
    if (m.outdoor && Eclipse.active()) return this.variant(name, 'eclipse');
    if (m.outdoor && Weather.isRain(Weather.at(m))) return this.variant(name, 'lluvia');
    if (!Clock.isDay()) return this.variant(name, 'noche');
    return name;
  },
};
{
  const _music = Sound.music;
  Sound.music = function (name, force) { return _music.call(this, Music2.pick(name), force); };
  // cambia de variante sin cortar al pasar del día a la noche, al llover o en un eclipse
  const _upd = World.update;
  World.update = function (dt) {
    _upd.call(this, dt);
    this.musicT = (this.musicT || 0) + dt;
    if (this.musicT < 1 || this.busy || Scenes.top() !== this) return;
    this.musicT = 0;
    const base = this.map.music, cur = Sound.currentName || '';
    if (!base || cur.split('~')[0] !== base && cur !== 'festival') return;
    const want = Music2.pick(base);
    if (want !== cur) Sound.music(base);
  };
}
// pasos según el terreno
{
  const _sfx = Sound.sfx;
  Sound.sfx = function (name, opt) {
    if (!name || !name.startsWith('step_')) return _sfx.call(this, name, opt);
    if (!this.ctx) return;
    const t = this.ctx.currentTime, d = this.sfxGain;
    if (name === 'step_hard') this.noise(t, 0.035, 0.07, d, 'highpass', 2500);
    else if (name === 'step_soft') this.noise(t, 0.05, 0.06, d, 'lowpass', 900);
    else if (name === 'step_sand') this.noise(t, 0.07, 0.07, d, 'bandpass', 3200);
    else if (name === 'step_wood') { this.osc('triangle', 180, t, 0.05, 0.08, d); this.noise(t, 0.03, 0.04, d, 'lowpass', 1200); }
    else if (name === 'step_water') this.noise(t, 0.12, 0.08, d, 'bandpass', 1400);
  };
  const _arr = World.arrived;
  World.arrived = function () {
    const p = this.player, t = this.tileAt(p.x, p.y);
    if (t && !t.grass) {
      const k = this.swimming ? 'step_water' : ({ path: 'step_hard', floor: 'step_wood', tilefloor: 'step_hard', cave: 'step_hard', gymfloor: 'step_hard', bridge: 'step_wood', dock: 'step_wood', sand: 'step_sand', ash: 'step_sand', rug: 'step_soft', mat: 'step_soft' })[t.t] || 'step_soft';
      if (G.steps % 2 === 0 || this.swimming) Sound.sfx(k);
    }
    return _arr.call(this);
  };
}

// carteles, farolas y rocas sobre ceniza (en vez de sobre hierba)
{
  const withAsh = (fn) => (x, f, v) => { const g = grassBase2; grassBase2 = (c, vv) => TileDraw.ash(c, 0, vv || 0); try { fn.call(TileDraw, x, f, v); } finally { grassBase2 = g; } };
  TileDraw.ashsign = withAsh(TileDraw.sign); TileDraw.ashlamp = withAsh(TileDraw.lamp); TileDraw.ashrock = withAsh(TileDraw.rock);
  TILEDEF['¦'] = Object.assign({}, TILEDEF.S, { t: 'ashsign' });
  TILEDEF['¬'] = Object.assign({}, TILEDEF.l, { t: 'ashlamp' });
  TILEDEF['®'] = Object.assign({}, TILEDEF.R, { t: 'ashrock' });
  ANIM_TILES.ashlamp = 1;
  for (const id of ['ciudad_brasa', 'ruta5']) { const m = MAPS[id]; m.rows = m.rows.map((r) => r.replace(/S/g, '¦').replace(/l/g, '¬').replace(/R/g, '®')); }
}
// roca agrietada sobre suelo de cueva
{
  const g0 = (x, f, v) => { const g = grassBase2; grassBase2 = (c, vv) => TileDraw.cave(c, 0, vv || 0); try { TileDraw.crackrock.call(TileDraw, x, f, v); } finally { grassBase2 = g; } };
  TileDraw.cavecrack = g0;
  TILEDEF['¥'] = { t: 'cavecrack', solid: true };
  for (const id of ['cueva', 'gruta_umbral']) { const m = MAPS[id]; m.rows = m.rows.map((r) => r.replace(/V/g, '¥')); }
}
