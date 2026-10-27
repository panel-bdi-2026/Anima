'use strict';
// Línea de Escamín: Escamín, Aletón, Tifonar, Arrecifor (dibujados a mano, por piezas)

HAND.escamin = {
  pal: { 1: '#8a3a18', 2: '#c05a28', 3: '#e07838', 4: '#f0a050', 5: '#ffd080', c: '#fff0d0', C: '#f0d0a0', e: '#1a0c08', w: '#ffffff', i: '#5a2a10', k: '#4a1a08', f: '#ff8a50', F: '#c84a20' },
  outline: '#3a1408', eyeFur: '4', flyer: true,
  parts: [
    { name: 'tail', role: 'tail', at: [24, 25], piv: [0, 3], rows: ['....ff', '..fff.', 'fffF..', 'fFF...', 'fffF..', '..fff.', '....ff'] },
    { name: 'dorsal', role: 'fin', at: [15, 21], piv: [1, 4], rows: ['..f', '.ff', 'fff', 'fF.'] },
    { name: 'body', role: 'body', at: [11, 24], rows: ['....45554.....', '..4455555444..', '.4555555554433', '4we55555554333', '4ee55555443332', 'kii44444433322', '.cc4444433322.', '..ccCC33222...', '....CC22......'] },
    { name: 'pectoral', role: 'fin', at: [15, 29], piv: [0, 0], rows: ['ff.', 'fFf', '.ff'] },
  ],
};

HAND.aleton = {
  pal: { 1: '#7a2a10', 2: '#b04a20', 3: '#c86030', 4: '#e08440', 5: '#f8b070', c: '#fff0d8', C: '#e8c8a0', e: '#1a0c08', w: '#ffffff', i: '#5a2010', k: '#3a1006', f: '#ff6a3a', F: '#b83a18' },
  outline: '#2a0e06', eyeFur: '4', flyer: true,
  parts: [
    { name: 'tail', role: 'tail', at: [26, 23], piv: [0, 3], rows: ['.....ff', '...fffF', '.ffFF..', 'fFFF...', '.ffFF..', '...fffF', '.....ff'] },
    { name: 'dorsal', role: 'fin', at: [14, 16], piv: [2, 6], rows: ['....f', '...ff', '..fff', '.ffF.', 'fffF.', 'ffFF.', 'fFF..'] },
    { name: 'body', role: 'body', at: [9, 22], rows: handStamp(
      ['.....55544444.....', '...555554444443...', '.4444444444443333.', '.4444444444443332.', '444444444443333322', '344444444333332222', '3ccccc333333322221', '.ccccc33332222211.', '.2cccc22222221111.', '...CCC222211111...', '.....11111111.....'],
      [[2, 2, 'kkk'], [3, 2, 'we'], [4, 1, 'ee'], [5, 0, 'kii'], [6, 0, 'k'], [3, 7, '2'], [4, 7, '2'], [5, 7, '2']]) },
    { name: 'pelvic', role: 'fin', far: true, at: [21, 31], piv: [0, 0], rows: ['ff', 'fF', '.f'] },
    { name: 'pectoral', role: 'fin', at: [14, 28], piv: [0, 0], rows: ['fff.', 'fFFf', '.fFF', '..f.'] },
  ],
};

HAND.arrecifor = {
  pal: { 1: '#1a3a5a', 2: '#2a5a80', 3: '#3a78a8', 4: '#5a98c8', 5: '#8ac0e8', c: '#d8eef8', C: '#a8c8e0', a: '#1e4a70', e: '#0a1420', w: '#ffffff', i: '#1e3a5a', k: '#0a1a2a',
    p: '#f088a0', P: '#c05070', q: '#ffc0d0', f: '#4a88b8', F: '#2a5a88' },
  outline: '#0a1a2a', eyeFur: '4', flyer: true,
  parts: [
    { name: 'coralB', role: 'fin', far: true, at: [19, 15], piv: [2, 6], outline: '#5a1a30', rows: ['p.p.', 'pPp.', '.Pp.', 'pP.p', '.PPp', '..P.', '..P.'] },
    { name: 'tail', role: 'tail', at: [27, 23], piv: [0, 3], rows: ['......ff', '....fffF', '..ffFF..', 'ffFFF...', '..ffFF..', '....fffF', '......ff'] },
    { name: 'body', role: 'body', at: [7, 21], rows: handStamp(
      ['......5555444444......', '...5555555444444433...', '..455555544444444333..', '.44444444444444433333.', '4444444444444443333322', '4444444444444433333222', '3444444444433333332222', 'ccccccc333333333222221', '3cccccc333333322222211', '.cccccc33222222222111.', '..CCCCC2222222211111..', '...2CCC222111111111...', '......1111111111......'],
      [[2, 3, 'kkk'], [3, 2, 'we'], [4, 1, 'ee'], [5, 1, 'ii'], [6, 0, 'k'], [7, 0, 'k'], [3, 8, 'a'], [4, 8, 'a'], [5, 8, 'a'], [6, 8, 'a'], [2, 12, 'a'], [3, 13, 'a'], [4, 14, 'a'], [5, 15, 'a'], [4, 11, '5'], [6, 13, '5']]) },
    { name: 'coral', role: 'fin', at: [12, 13], piv: [2, 8], outline: '#5a1a30', rows: ['p..p.p', 'pp.pPp', '.pPpP.', 'qpPP..', '.pP.p.', '.PPpP.', '..PP..', '..PP..', '..PP..'] },
    { name: 'pectoral', role: 'fin', at: [12, 28], piv: [0, 0], rows: ['ffff.', 'fFFFf', '.fFFF', '..fF.'] },
  ],
};

// Tifonar: serpiente marina (esqueleto de Abismar) con aletas-ala
{
  const base = HAND.abismar;
  const finWing = ['......ff', '....ffFf', '..ffFFf.', '.fFFFf..', 'fFFff...', 'fFf.....', 'ff......', 'f.......'];
  HAND.tifonar = {
    pal: { 1: '#1e4a6a', 2: '#2e6a98', 3: '#3e88c0', 4: '#56a6d8', 5: '#8ac8f0', c: '#e0f4ff', C: '#b8dcf0', f: '#f4f8ff', F: '#b0d0f0', g: '#ffffff', G: '#ffffff', e: '#0a1a2a', w: '#ffffff', i: '#2a6aa8', k: '#0a1a2a' },
    outline: '#0a1e32', eyeFur: '5',
    parts: [
      { name: 'wingF', role: 'wing', far: true, at: [23, 19], piv: [0, 7], outline: '#2a4a6a', rows: finWing.map((r) => r.replace(/f/g, 'F')) },
      ...base.parts.filter((p) => p.name !== 'finB').map((p) => Object.assign({}, p, { outline: p.outline ? '#2a4a6a' : undefined })),
      { name: 'wingN', role: 'wing', at: [20, 20], piv: [0, 7], outline: '#2a4a6a', rows: finWing },
    ],
  };
}
