'use strict';
// Línea de Murcín: Murcín, Noctalar, Lunavela, Vampirax (dibujados a mano, por piezas)
const SMALL_BAT = ['.....4...', '....44.4.', '...4444..', '..44443.4', '.4444333.', '4444332.2', '44332.2..', '43.......'];
const BIG_BAT = ['........4.....', '.......44...4.', '......444..44.', '.....4444.443.', '....44444443..', '...444444433.4', '..44444443334.', '..4444443333..', '.444444333332.', '.44444333322.2', '4444333322..2.', '443332.22.....', '43.2..........'];
const batBody = (marks) => handStamp(['.....445554.....', '...4455555544...', '..445555555444..', '.44555555554443.', '.4we55555554433.', '44ee555555544333', '44ii455555444333',
  'c444445554443332', 'cck4444444433322', '.ccc444444333222', '..cccC3333322221', '...CCC22222211..', '.....C222211....'], marks);
const batEar = (n) => (n ? ['4....', '44...', '4p4..', '4pp4.', '4pp43', '44443', '.4433'] : ['2...', '22..', '2p2.', '2p22', '2222', '.222']);

HAND.murcin = {
  pal: { 1: '#2a2040', 2: '#3e3258', 3: '#5a4a7a', 4: '#7a6aa0', 5: '#9a8ac0', c: '#c8b8e0', C: '#a898c8', e: '#1a1028', w: '#ffffff', i: '#3a2050', k: '#1a1028', W: '#ffffff', p: '#e090c0' },
  outline: '#140c22', eyeFur: '4', flyer: true,
  parts: [
    { name: 'wingF', role: 'wing', far: true, at: [19, 21], piv: [0, 7], rows: handFar(SMALL_BAT) },
    { name: 'earF', role: 'ear', far: true, at: [19, 21], piv: [1, 4], rows: ['2..', '22.', '2p2', '222'] },
    { name: 'legF', role: 'leg', far: true, at: [18, 35], piv: [0, 0], rows: ['1', '1', '11'] },
    { name: 'body', role: 'body', at: [12, 26], rows: ['...45554....', '.445555544..', '.4555555443.', '4we55555443.', '4ee55554433.', 'cii44444333.', 'ckWk44443322', '.cc44443322.', '..CC33322...', '....222.....'] },
    { name: 'legN', role: 'leg', at: [15, 35], piv: [0, 0], rows: ['2', '2', '22'] },
    { name: 'earN', role: 'ear', at: [15, 20], piv: [1, 5], rows: ['4...', '44..', '4p4.', '4p44', '4p43', '4443'] },
    { name: 'wingN', role: 'wing', at: [17, 23], piv: [0, 7], rows: SMALL_BAT },
  ],
};

const bigBatSp = (pal, outline, ex, wp = [0, ex.wing.length - 1]) => ({
  pal, outline, eyeFur: '4', flyer: true,
  parts: [
    { name: 'wingF', role: 'wing', far: true, at: [19, 17 - wp[1]], piv: wp, rows: handFar(ex.wing) },
    { name: 'earF', role: 'ear', far: true, at: [19, 16], piv: [1, 5], rows: batEar(false) },
    { name: 'legF', role: 'leg', far: true, at: [19, 34], piv: [0, 0], rows: ['1', '1', '1', '11'] },
    { name: 'body', role: 'body', at: [8, 21], rows: batBody(ex.face) },
    { name: 'legN', role: 'leg', at: [15, 34], piv: [0, 0], rows: ['2', '2', '2', '22'] },
    { name: 'earN', role: 'ear', at: [14, 15], piv: [1, 6], rows: batEar(true) },
    ...(ex.extra || []),
    { name: 'wingN', role: 'wing', at: [17, 19 - wp[1]], piv: wp, rows: ex.wing },
  ],
});

HAND.noctalar = bigBatSp({ 1: '#221a38', 2: '#34284e', 3: '#4a3a6a', 4: '#6a5a90', 5: '#8a7ab0', c: '#c0b0d8', C: '#9a8ab8', e: '#140a20', w: '#ffffff', i: '#3a2050', k: '#140a20', W: '#ffffff', p: '#d080b0' }, '#100818',
  { wing: BIG_BAT.slice(2), face: [[8, 2, 'kWkW']] });

HAND.lunavela = bigBatSp({ 1: '#1a1a40', 2: '#26265a', 3: '#30306a', 4: '#3a3a78', 5: '#5a5aa0', c: '#e0e8ff', C: '#b0bce8', e: '#0a0a20', w: '#e8ffff', i: '#c0f0ff', k: '#0a0a20', W: '#ffffff', p: '#8a8ad0', g: '#c8d4ff', G: '#ffffff' }, '#08081a', {
  wing: BIG_BAT, face: [[4, 2, 'ww'], [5, 2, 'wi'], [6, 2, 'ii']],
  extra: [{ name: 'gem', role: 'crest', at: [11, 22], piv: [0, 0], outline: '#2a2a6a', rows: ['gG', 'gg'] }],
});

HAND.vampirax = bigBatSp({ 1: '#1a0e16', 2: '#2a1622', 3: '#3a2030', 4: '#5a3048', 5: '#7a4060', c: '#e05068', C: '#a83048', e: '#2a0008', w: '#ffb0b8', i: '#ff4060', k: '#100008', W: '#ffffff', p: '#e05068', s: '#e05068', S: '#802040' }, '#0a0408', {
  wing: BIG_BAT, face: [[3, 2, 'kk'], [4, 2, 'ww'], [5, 2, 'wi'], [6, 2, 'ii'], [8, 2, 'kWkW']],
  extra: [{ name: 'spikes', role: 'crest', at: [10, 17], piv: [2, 5], outline: '#3a0a18', rows: ['s...s.', 'Ss.sS.', '.SsSs.', '..SS..'] }],
});
