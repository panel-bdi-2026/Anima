'use strict';
// Legendarios: Silvaneo, Auroros, Marealis, Albora (dibujados a mano, por piezas)

HAND.silvaneo = {
  pal: { 1: '#1e4a2a', 2: '#2e6a3a', 3: '#3e7a44', 4: '#4a8a50', 5: '#6aaa68', c: '#e8dcb0', C: '#c0b088', a: '#d8c890', A: '#a89060', g: '#9ad860', G: '#c8f090',
    e: '#c0ff80', w: '#f0ffe0', i: '#90e050', k: '#102010', n: '#1a2a10' },
  outline: '#0e2414', eyeFur: '4',
  parts: [
    { name: 'legBF', role: 'legB', far: true, at: [27, 26], piv: [1, 0], rows: ['221', '211', '21', '21', '21', '11', '11', '11', '11', '11', 'AA'] },
    { name: 'legFF', role: 'legF', far: true, at: [17, 26], piv: [1, 0], rows: ['221', '211', '21', '21', '21', '11', '11', '11', '11', '11', 'AA'] },
    { name: 'tail', role: 'tail', at: [30, 17], piv: [0, 3], outline: '#1e4a18', rows: ['...gG', '.gGGg', 'gGgg.', 'g....'] },
    { name: 'body', role: 'body', at: [13, 19], rows: ['....gGggGgg.......', '..gg4555544gg4....', '.c44555555444433..', 'cc4444444444443333', 'cc4444444444433332', 'cC3333333333333222', '.CC32222222222222.', '..C22221111111111.', '....2211....111...'] },
    { name: 'legBN', role: 'legB', at: [25, 26], piv: [1, 0], rows: ['443', '443', '43', '43', '43', '32', '32', '32', '32', '32', 'aa'] },
    { name: 'legFN', role: 'legF', at: [15, 26], piv: [1, 0], rows: ['443', '433', '43', '43', '43', '32', '32', '32', '32', '32', 'aa'] },
    { name: 'head', role: 'head', at: [4, 7], piv: [9, 12], rows: [
      '.....5554....', '...45555544..', '..4555555443.', '.44we5555443.', '444ee555443..', 'n44ii54443...', 'cc44444433...', '.ccc44443....', '....c4443....', '....c44443...', '....cc44443..', '....cc444433.', '.....cc44443.', '.....cc444433', '......cc44443'] },
    { name: 'antlers', role: 'crest', at: [8, 1], piv: [3, 7], outline: '#3a2a10', rows: ['a...a..a', 'a.a.a.aa', '.aa.aaa.', '..aAa...', '..aA..g.', '...aAgG.', '...aA...', '....A...'] },
    { name: 'ear', role: 'ear', at: [12, 7], piv: [0, 3], outline: '#1e4a18', rows: ['..gG', '.gGg', 'gGg.', 'gg..'] },
  ],
};

// Auroros: león solar (esqueleto de Fogarzo) con gran melena de fuego y corona
HAND.auroros = {
  pal: { 1: '#8a4a10', 2: '#c07a20', 3: '#e0a030', 4: '#f8c050', 5: '#ffe090', c: '#fff4d0', C: '#f0d090', e: '#ffffff', w: '#ffffff', i: '#ffe0a0', n: '#5a2a08', p: '#ff9a6a', k: '#5a2a08',
    r: '#ff6a30', f: '#ffc838', F: '#fff4c4', y: '#fff0a0', Y: '#ffffff' },
  outline: '#4a2008', eyeFur: '4',
  parts: [
    ...HAND.fogarzo.parts.filter((p) => !['mane', 'earN', 'earF'].includes(p.name)).map((p) => p.name === 'tail' ? Object.assign({}, p, { outline: '#c03a10' }) : p),
    { name: 'mane', role: 'fin', at: [3, 9], piv: [8, 9], outline: '#c03a10', rows: ['.....r..r..r....', '...rrfrrfrrfr...', '..rfFffFFffFfr..', '.rfFFFFFFFFFFfr.', 'rfFFFFFFFFFFFFfr', 'rfFFFFFFFFFFFFFr', 'rfFFFFFFFFFFFFfr', 'rfFFFFFFFFFFFFfr', 'rfFFFFFFFFFFFFfr', '.rfFFFFFFFFFFfr.', '.rffFFFFFFFFffr.', '..rffFFFFFFffr..', '...rrffffffrr...', '.....rrrrrr.....'] },
    { name: 'crown', role: 'crest', at: [7, 7], piv: [3, 5], outline: '#8a4a08', rows: ['y.y.y', 'yYyYy', 'yyyyy'] },
  ],
};
{
  // orden: cuerpo y patas, melena, cabeza, corona
  const P = HAND.auroros.parts, take = (n) => P.splice(P.findIndex((p) => p.name === n), 1)[0];
  const mane = take('mane'), head = take('head'), crown = take('crown');
  P.push(mane, head, crown);
}

HAND.marealis = {
  pal: { 1: '#1a4a6a', 2: '#2a6a98', 3: '#3aa0d0', 4: '#5ac0e8', 5: '#9ae0f8', c: '#e8faff', C: '#b8e4f4', f: '#a0f0ff', F: '#60c8f0', e: '#c0f8ff', w: '#ffffff', i: '#80e0ff', k: '#0a2a40' },
  outline: '#0a2238', eyeFur: '4', flyer: true,
  parts: [
    { name: 'wingF', role: 'wing', far: true, at: [16, 14], piv: [0, 7], outline: '#2a5a80', rows: ['......FF', '....FFFF', '..FFFFF.', '.FFFFF..', 'FFFFF...', 'FFF.....', 'FF......', 'F.......'] },
    { name: 'tail', role: 'tail', at: [35, 23], piv: [0, 2], outline: '#2a5a80', rows: ['..ff', '.fFf', 'fFF.', '.fFf', '..ff'] },
    { name: 'body', role: 'body', at: [7, 20], rows: ['555...........................', '4445............55............', '44445.........5544455.........', '3334455......544333445........', '23334445....54433223344.......', 'c23334445..544332cCc2344....5.', 'cc22333445544332c...c2344.5433', '..cc23334443332c.....c2344332.', '...Cc223333322c........c222c..', '.....cc22222cC................', '......CccccC..................'] },
    { name: 'dorsal', role: 'fin', at: [20, 17], piv: [1, 3], outline: '#2a5a80', rows: ['..f.', '.fF.', 'fFFf', 'FFF.'] },
    { name: 'head', role: 'head', at: [1, 12], piv: [9, 9], rows: ['....5555....', '..45555554..', '.45555555544', '44we55555443', '44ee5555443.', 'ccii4444433.', 'ccc44444333.', '.cccc44433..', '.....c4443..', '......44433.', '.......4433.'] },
    { name: 'crest', role: 'crest', at: [7, 8], piv: [1, 4], outline: '#2a5a80', rows: ['..f.f', '.fFfF', 'fFFF.', 'FF...', 'F....'] },
    { name: 'wingN', role: 'wing', at: [13, 16], piv: [0, 7], outline: '#2a5a80', rows: ['......ff', '....ffFf', '..ffFFf.', '.fFFFf..', 'fFFff...', 'fFf.....', 'ff......', 'f.......'] },
  ],
};

// Albora: espíritu del alba (esqueleto esbelto de Coralis) con grandes alas
{
  const wing = ['..........uuuu', '........uu554.', '......u55544u.', '.....5554433..', '....5544433...', '...554443332..', '..5544433322..', '.55444333222..', '.5444333222...', '544433322211..', '44433322211...', '.443322111....', '..3322111.....'];
  const tint = (rows) => rows.map((r) => r.replace(/[1-5]/g, (d) => ({ 5: 'u', 4: 'U', 3: 'v', 2: 'V', 1: 'V' })[d]));
  HAND.albora = {
    pal: { 1: '#c8a070', 2: '#e8c898', 3: '#f8e0c0', 4: '#fff4e0', 5: '#ffffff', c: '#ffffff', C: '#ffe8f4', u: '#ffffff', U: '#ffd8f0', v: '#f4a8d8', V: '#c878b0', p: '#ffb0e0', P: '#e080c0', q: '#ffd0f0',
      g: '#ffe080', G: '#fff8c0', e: '#ff80c0', w: '#ffffff', i: '#ff60b0', k: '#8a5a40' },
    outline: '#8a5a60', eyeFur: '4', flyer: true, body: 'biped',
    parts: [
      { name: 'wingF', role: 'wing', far: true, at: [17, 3], piv: [3, 12], rows: tint(wing).map((r) => r.replace(/u/g, 'U')) },
      { name: 'wingN', role: 'wing', at: [14, 5], piv: [3, 12], rows: tint(wing) },
      ...HAND.coralis.parts.filter((p) => !['crown', 'gem'].includes(p.name)).map((p) => p.name === 'tail' ? Object.assign({}, p, { rows: ['.........UU', '........UuU', '.......5uu.', '......554..', '.....5544..', '....55443..', '...554433..', '..5544333..', '.55443322..', '554433221..', '.4433221...', '..33221....'] }) : p),
      { name: 'crown', role: 'crest', at: [9, 1], piv: [3, 5], outline: '#8a6a20', rows: ['g..g..g', 'gG.g.Gg', '.gGgGg.', '.ggggg.'] },
    ],
  };
}
