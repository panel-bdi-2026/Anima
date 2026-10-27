'use strict';
// Línea de Psiqui: Psiqui, Mentalis, Kinesio, Oniria (dibujados a mano, por piezas)
const PSY = { 1: '#7a3a6a', 2: '#b05a98', 3: '#d47ab4', 4: '#f0a6cc', 5: '#ffd0e8', c: '#fff0f8', C: '#f0c8e0', g: '#9a70e8', G: '#e0d0ff', e: '#2a1030', w: '#ffffff', i: '#6a3aa0', k: '#3a1030', p: '#c870b0' };
const SWIRL = ['.4444.', '4....4', '...4.4', '.44..4', '4..44.', '4.....', '.44...'];

HAND.psiqui = {
  pal: Object.assign({}, PSY), outline: '#3a1030', eyeFur: '5', flyer: true,
  parts: [
    { name: 'earF', role: 'ear', far: true, at: [19, 18], piv: [1, 4], rows: ['2...', '22..', '2p2.', '2222'] },
    { name: 'tail', role: 'tail', at: [22, 22], piv: [0, 5], rows: SWIRL },
    { name: 'body', role: 'body', at: [8, 23], rows: [
      '.....445554.....', '...4455555544...', '..445555555444..', '.44555555554443.', '.4we55555554433.', '44ee555555544333', '44ii455555444333',
      'c444445554443332', 'cck4444444433322', '.ccc444444333222', '..cccC3333322221', '...CCC22222211..', '.....C222211....'] },
    { name: 'earN', role: 'ear', at: [15, 18], piv: [1, 5], rows: ['5...', '45..', '453.', '4p53', '4p33', '4433'] },
    { name: 'gem', role: 'crest', at: [12, 24], piv: [0, 0], outline: '#3a1a6a', rows: ['gG', 'gg'] },
  ],
};

{
  const keep = (sp, drop) => HAND[sp].parts.filter((p) => !drop.includes(p.name));
  HAND.mentalis = {
    pal: Object.assign({}, PSY, { 4: '#e690c0', 5: '#ffc0e0' }), outline: '#3a1030', eyeFur: '5', body: 'biped',
    parts: [
      { name: 'earF', role: 'ear', far: true, at: [13, 3], piv: [1, 5], rows: ['2...', '22..', '2p2.', '2p22', '2222', '.222'] },
      { name: 'tail', role: 'tail', at: [19, 20], piv: [0, 6], rows: SWIRL.concat(['.4....', '..4...']) },
      ...keep('marolo', ['crest', 'tail']),
      { name: 'earN', role: 'ear', at: [10, 3], piv: [1, 6], rows: ['5...', '45..', '453.', '4p53', '4p53', '4p33', '4433'] },
      { name: 'gem', role: 'crest', at: [7, 11], piv: [0, 0], outline: '#3a1a6a', rows: ['gG', 'gg'] },
    ],
  };
  // Kinesio: cuerpo esbelto con armadura de piedra que flota a su alrededor
  HAND.kinesio = {
    pal: { 1: '#6a3a5a', 2: '#9a5a88', 3: '#c880b0', 4: '#e0a0c8', 5: '#f8c8e0', c: '#e8d8c8', C: '#c8b4a0', r: '#8a7868', R: '#b8a898', D: '#5a4a40', g: '#a070f0', G: '#e0c8ff', e: '#1a0a20', w: '#ffffff', i: '#6a3aa0', k: '#2a1020', p: '#c870b0', P: '#8a3a80', q: '#e0a0c8' },
    outline: '#2a1020', eyeFur: '5', body: 'biped',
    parts: [
      { name: 'stoneB', role: 'fin', far: true, at: [25, 9], piv: [-6, 8], outline: '#2a2018', rows: ['.RRr.', 'RRrrD', 'rrrDD', '.DDD.'] },
      ...keep('coralis', ['tail', 'crown', 'gem']).map((p) => p.name === 'body' ? Object.assign({}, p, { rows: handStamp(p.rows, [[3, 4, 'RRr'], [4, 4, 'Rrr'], [5, 4, 'rrD'], [7, 4, 'RRr'], [8, 4, 'rrD']]) }) : p),
      { name: 'helmet', role: 'crest', at: [8, 3], piv: [4, 4], outline: '#2a2018', rows: ['...RRR...', '.RRRrrrD.', 'RRrrgrrDD', 'Rr.....DD'] },
      { name: 'stoneA', role: 'fin', at: [2, 21], piv: [8, 2], outline: '#2a2018', rows: ['.RR.', 'RRrr', 'rrrD', '.DD.'] },
      { name: 'stoneC', role: 'fin', at: [26, 24], piv: [-8, -2], outline: '#2a2018', rows: ['RR.', 'rrD', '.D.'] },
    ],
  };
}

HAND.oniria = {
  pal: { 1: '#3a2050', 2: '#5a3a80', 3: '#7a58a8', 4: '#9a70d0', 5: '#c0a0f0', c: '#f0d8ff', C: '#d0b0f0', e: '#200a20', w: '#ffe0f0', i: '#ffb0e0', k: '#1a0a28', p: '#f0a6cc', P: '#c070a0', y: '#fff0a0' },
  outline: '#140820', eyeFur: '4', flyer: true,
  parts: [
    { name: 'wingF', role: 'wing', far: true, at: [20, 9], piv: [0, 5], rows: handFar(batWing.slice(2)) },
    { name: 'ribbon', role: 'fin', far: true, at: [18, 26], piv: [0, 0], rows: ['4433', '.4433', '..4433', '...443', '....44', '.....4'] },
    { name: 'tail', role: 'tail', at: [14, 25], piv: [2, 0], rows: ghostTail },
    { name: 'body', role: 'body', at: [8, 12], rows: ghostBody },
    { name: 'crown', role: 'crest', at: [10, 8], piv: [2, 4], outline: '#5a1a40', rows: ['p.y.p', 'pPpPp', 'PPPPP', '.PpP.'] },
    { name: 'armN', role: 'arm', at: [6, 19], piv: [2, 0], rows: ['445', '44.', '4..'] },
    { name: 'wingN', role: 'wing', at: [18, 11], piv: [0, 5], rows: batWing.slice(2) },
  ],
};
