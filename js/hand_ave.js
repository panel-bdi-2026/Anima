'use strict';
// Línea de Pipío: Pipío, Alondro, Tormentor, Céfireo (dibujados a mano, por piezas)
// versión en sombra de una pieza (para el ala o la pata del lado lejano)
const handFar = (rows) => rows.map((r) => r.replace(/[2-5]/g, (d) => String(Math.max(1, d - 2))));
// estampa trozos de texto sobre una figura base: [[fila, columna, 'texto'], ...]
const handStamp = (rows, marks) => rows.map((r, j) => { let s = r; for (const [y, x, t] of marks) if (y === j) s = s.slice(0, x) + t + s.slice(x + t.length); return s; });
const BIRD = { 1: '#5a3a20', 2: '#8a6040', 3: '#9a7048', 4: '#b08860', 5: '#d0b088', c: '#f8e8d0', C: '#e0c8a8', b: '#f0a030', B: '#c87818', e: '#1a1008', w: '#ffffff', i: '#3a2010', l: '#e09040', L: '#a86020', k: '#2a1a0c' };

HAND.pipio = {
  pal: Object.assign({}, BIRD), outline: '#2a1a0c', eyeFur: '4', flyer: true, body: 'bird',
  parts: [
    { name: 'legF', role: 'leg', far: true, at: [17, 34], piv: [0, 0], rows: ['L', 'L', 'L', 'LL'] },
    { name: 'wingF', role: 'wing', far: true, at: [16, 22], piv: [1, 5], rows: ['....11', '..1211', '.12211', '12221.', '1221..', '.11...'] },
    { name: 'tail', role: 'tail', at: [21, 27], piv: [0, 3], rows: ['....33', '..3322', '33322.', '2221..', '.21...'] },
    { name: 'body', role: 'body', at: [11, 24], rows: ['...45554...', '..4555554..', '.455555544.', '.4we555544.', '44ee5554433', 'c4ii4444333', 'cc444444332', 'ccc44443322', '.cccC33222.', '..CCC222...'] },
    { name: 'beak', role: 'crest', at: [8, 28], piv: [3, 1], outline: '#5a2a08', rows: ['.bbb', 'bbbB', '..BB'] },
    { name: 'legN', role: 'leg', at: [14, 34], piv: [0, 0], rows: ['l', 'l', 'l', 'll'] },
    { name: 'wingN', role: 'wing', at: [14, 24], piv: [1, 4], rows: ['.....55', '...5544', '.554443', '5444332', '.443322', '..3322.', '...22..'] },
  ],
};

HAND.alondro = {
  pal: Object.assign({}, BIRD, { 2: '#704a28', 3: '#8a6040', 4: '#a07850', 5: '#c8a070', c: '#f4e2c8', C: '#d8c0a0' }), outline: '#24160a', eyeFur: '4', flyer: true, body: 'bird',
  parts: [
    { name: 'legF', role: 'leg', far: true, at: [19, 31], piv: [0, 0], rows: ['L', 'L', 'L', 'L', 'L', 'LLL'] },
    { name: 'wingF', role: 'wing', far: true, at: [17, 14], piv: [2, 10], rows: handFar(['.......555', '.....55544', '...5554443', '..55444332', '.554443322', '5544433221', '544433221.', '44433221..', '.433221...', '..3221....', '...21.....']) },
    { name: 'tail', role: 'tail', at: [24, 25], piv: [0, 2], rows: ['......4433', '...44433322', '444333222..', '3332221....', '.221.......'] },
    { name: 'body', role: 'body', at: [12, 23], rows: ['....455544....', '..44555555443.', '.c445555544433', 'cc444444444333', 'cc444444443332', 'Cc444444433322', '.CC444433322..', '..CCC22222....'] },
    { name: 'legN', role: 'leg', at: [16, 31], piv: [0, 0], rows: ['l', 'l', 'l', 'l', 'l', 'lll'] },
    { name: 'head', role: 'head', at: [5, 16], piv: [9, 8], rows: ['....5555...', '..45555544.', '.4555555443', '.4kkk55443.', '.4we555443.', '44ee554433.', 'c4ii444332.', '.cc4443322.', '..ccC322...'] },
    { name: 'crest', role: 'crest', at: [10, 11], piv: [1, 5], rows: ['....44', '..4433', '.4433.', '4433..', '433...', '33....'] },
    { name: 'beak', role: 'crest', at: [2, 20], piv: [4, 1], outline: '#5a2a08', rows: ['.bbbb', 'bbbbB', '..BBB'] },
    { name: 'wingN', role: 'wing', at: [15, 15], piv: [2, 10], rows: ['.......555', '.....55544', '...5554443', '..55444332', '.554443322', '5544433221', '544433221.', '44433221..', '.433221...', '..3221....', '...21.....'] },
  ],
};

// ave grande: cuerpo horizontal, alas abiertas hacia arriba, garras
const bigBird = (pal, outline, ex) => {
  const wing = ex.wing || ['..........5555', '........55544.', '......5554443.', '.....5544433..', '....5544433...', '...554443332..', '..5544433322..', '.55444333222..', '.5444333222...', '544433322211..', '44433322211...', '.443322111....', '..3322111.....'];
  return {
    pal, outline, eyeFur: '4', flyer: true, body: 'bird',
    parts: [
      { name: 'legF', role: 'leg', far: true, at: [20, 29], piv: [1, 0], rows: ['11', '1L', '.L', '.L', '.L', '.L', '.L', 'LL.', 'LLLL'] },
      { name: 'wingF', role: 'wing', far: true, at: [18, 6], piv: [3, 12], rows: handFar(wing) },
      { name: 'tail', role: 'tail', at: [27, 18], piv: [0, 4], outline: ex.tailOutline, rows: ex.tail },
      { name: 'body', role: 'body', at: [12, 20], rows: [
        '....4555544......', '..445555555444...', '.c44555555544433.', 'cc444444444443333', 'cc444444444433322', 'cc444444444333222', '.Cc4444443332221.', '..CC33333222211..', '....CC22211......'] },
      { name: 'legN', role: 'leg', at: [16, 29], piv: [1, 0], rows: ['33', '3l', '.l', '.l', '.l', '.l', '.l', 'll.', 'lLlL'] },
      { name: 'head', role: 'head', at: [4, 12], piv: [10, 9], rows: [
        '....5555....', '..45555554..', '.4555555544.', '.4kkk555443.', '.4we5555443.', '44ee5554433.', 'c4ii444433..', '.cc4444332..', '..cccC3322..', '...CCC2.....'] },
      ...(ex.head || []),
      { name: 'beak', role: 'crest', at: [1, 16], piv: [4, 1], outline: '#4a2a08', rows: ['bbbb.', '.bbbB', '..bBB', '...B.'] },
      { name: 'wingN', role: 'wing', at: [15, 8], piv: [3, 12], rows: ex.wingMark ? ex.wingMark(wing) : wing },
    ],
  };
};

HAND.tormentor = bigBird({ 1: '#1e2438', 2: '#2e3650', 3: '#3a4660', 4: '#4a5878', 5: '#6a7a9a', c: '#f0e070', C: '#c8b850', y: '#f8d048', Y: '#fff8a0',
  b: '#f0c040', B: '#b08820', l: '#f0c040', L: '#a08020', k: '#10141e', e: '#100c08', w: '#ffe040', i: '#f0a020' }, '#0c1018', {
  head: [{ name: 'spikes', role: 'crest', at: [11, 7], piv: [1, 6], outline: '#5a4810', rows: ['y...y.', 'yy..yy', '.yy.yY', '.yyyY.', '..yY..', '..Y...'] }],
  tail: ['......yy', '....yyY.', '..33yY..', '3333yy..', '3322.yy.', '.221..Y.'], tailOutline: '#0c1018',
  wingMark: (w) => w.map((r, j) => (j >= 4 && j <= 8 ? r.replace(/4(?=4)/, 'y') : r)),
});

HAND.cefireo = bigBird({ 1: '#3a6a8a', 2: '#5a8eb0', 3: '#6ab0d8', 4: '#86c6e8', 5: '#c0e6f8', c: '#ffffff', C: '#e0f4ff', u: '#ffffff', U: '#d0ecff',
  b: '#f0b040', B: '#c08020', l: '#f0b040', L: '#c08020', k: '#4a7a9a', e: '#14203a', w: '#ffffff', i: '#2a5a9a' }, '#1e3a5a', {
  head: [{ name: 'plume', role: 'crest', at: [10, 4], piv: [1, 9], rows: ['.......uu', '.....uuU.', '...uuU...', '..uU.....', '.uU......', 'uU.......', 'u5.......', '45.......', '44.......', '4........'] }],
  tail: ['.........uu', '.......uuU.', '.....55U...', '...5544....', '.554433....', '5443322uu..', '.33221..uU.', '..221....uu'], tailOutline: '#1e3a5a',
  wing: ['..........uuuu', '........uu554.', '......u55544u.', '.....5554433..', '....5544433...', '...554443332..', '..5544433322..', '.55444333222..', '.5444333222...', '544433322211..', '44433322211...', '.443322111....', '..3322111.....'],
});
