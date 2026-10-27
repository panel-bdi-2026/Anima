'use strict';
// Línea de Voltín: Voltín, Dínamo, Tesloria, Ferrovolt (dibujados a mano, por piezas)
const SPARK = { 1: '#8a6a10', 2: '#c09820', 3: '#e0b830', 4: '#f8dc68', 5: '#fff4a8', c: '#fffbe0', C: '#e8dca0', b: '#58c8f0', B: '#2a88c0', e: '#1a1408', w: '#ffffff', i: '#3a2a08', k: '#2a1e08' };

HAND.voltin = {
  pal: Object.assign({}, SPARK), outline: '#3a2a08', eyeFur: '5',
  parts: [
    { name: 'legBF', role: 'legB', far: true, at: [21, 34], piv: [1, 0], rows: ['22', '21', '21', '221'] },
    { name: 'legFF', role: 'legF', far: true, at: [13, 34], piv: [1, 0], rows: ['22', '21', '21', '221'] },
    { name: 'tail', role: 'tail', at: [23, 19], piv: [0, 8], outline: '#103a5a', rows: ['...bbb', '..bbb.', '.bbb..', 'bbbbbb', '..bbb.', '.bbb..', '.bb...', 'bb....', '2.....'] },
    { name: 'body', role: 'body', at: [8, 23], rows: [
      '.....445554.....', '...4455555544...', '..445555555444..', '.44555555554443.', '.4we55555554433.', '44ee555555544333', '44iib55555444333',
      'c444445554443332', 'cck4444444433322', '.ccc444444333222', '..cccC3333322221', '...CCC22222211..', '.....C222211....'] },
    { name: 'antenna', role: 'crest', at: [12, 17], piv: [2, 6], outline: '#103a5a', rows: ['b...b', 'B..B.', '.2.2.', '.22..', '..2..', '..2..'] },
    { name: 'legBN', role: 'legB', at: [19, 34], piv: [1, 0], rows: ['44', '43', '43', '443'] },
    { name: 'legFN', role: 'legF', at: [11, 34], piv: [1, 0], rows: ['44', '43', '43', '443'] },
  ],
};

HAND.dinamo = {
  pal: Object.assign({}, SPARK, { 3: '#d8b028', 4: '#f0c840', 5: '#fff0a0', c: '#fff4c0', b: '#4a90e0', B: '#2a5aa8' }), outline: '#3a2a08', eyeFur: '5', body: 'biped',
  parts: [
    { name: 'hornF', role: 'ear', far: true, at: [17, 12], piv: [1, 5], outline: '#102a5a', rows: ['...B', '..BB', '.BB.', 'BB..', 'B...', '22..'] },
    { name: 'legF', role: 'leg', far: true, at: [20, 34], piv: [1, 0], rows: ['221', '211', '211', '2211'] },
    { name: 'tail', role: 'tail', at: [26, 17], piv: [0, 10], outline: '#102a5a', rows: ['....bbb', '...bbb.', '..bbb..', '.bbb...', 'bbbbbbb', '...bbb.', '..bbb..', '.bbb...', '.bb....', 'bb.....', '2......'] },
    { name: 'body', role: 'body', at: [8, 20], rows: [
      '.......45555544.....', '....4455555555544...', '...455555555555443..', '..45555555555554433.', '.4kkk555555555544333', '.4we5555555555444333', '44ee5555555554443332', 'c4iib45555544443332.',
      'cck44444444444433322', '.ccc4444444444333222', '..cccC44444443333222', '...CCC3333333332221.', '....CC2222222221....', '......22111111......'] },
    { name: 'legN', role: 'leg', at: [12, 34], piv: [1, 0], rows: ['443', '443', '433', '4433'] },
    { name: 'arm', role: 'arm', at: [11, 27], piv: [1, 0], rows: ['44', '443', '433', '.43'] },
    { name: 'hornN', role: 'ear', at: [11, 13], piv: [2, 6], outline: '#102a5a', rows: ['b...', 'bb..', '.bB.', '.bBB', '..bB', '..44', '..44'] },
  ],
};

HAND.tesloria = {
  pal: { 1: '#7a6020', 2: '#b09030', 3: '#d8c048', 4: '#f8e070', 5: '#fff4b0', c: '#fff8d0', C: '#e8dca0', v: '#a070f0', V: '#6a40c0', e: '#101020', w: '#e0ffff', i: '#a0f0ff', k: '#2a2010' },
  outline: '#3a2a10', eyeFur: '5', flyer: true,
  parts: [
    { name: 'armF', role: 'arm', far: true, at: [20, 25], piv: [0, 0], rows: ['22', '221', '.21'] },
    { name: 'tail', role: 'tail', at: [21, 30], piv: [0, 2], outline: '#2a1060', rows: ['...vv', '..vv.', '.vvvv', '...v.', '..v..', '.v...'] },
    { name: 'body', role: 'body', at: [8, 16], rows: [
      '.....455554.....', '...4455555544...', '..455555555544..', '.45555555555443.', '.4ee55555554433.', '44ew555555544333', 'c4ii455555444333', 'cc44445554443332', 'ccc4444444443322', '.ccc444444433322',
      '..cc44444443322.', '...c4444443322..', '....444443322...', '.....44433322...', '......443322....', '.......43322....', '........3322....', '.........322....', '..........22....', '...........2....'] },
    { name: 'crown', role: 'crest', at: [10, 11], piv: [2, 4], outline: '#2a1060', rows: ['v.v.v', 'vVvVv', 'VVVVV', '.vVv.'] },
    { name: 'armN', role: 'arm', at: [7, 25], piv: [1, 0], rows: ['44', '443', '.43'] },
  ],
};

// Ferrovolt: coloso de hierro (esqueleto de gólem) con antena y púas
HAND.ferrovolt = {
  pal: { 1: '#2a2e38', 2: '#4a505e', 3: '#646a7a', 4: '#8890a2', 5: '#b0b8c8', b: '#3a3e48', c: '#f8d848', C: '#c8a830', m: '#c8a830', M: '#f8d848', N: '#fff4a0',
    y: '#f8d848', Y: '#fff8b0', r: '#4a4e5a', R: '#7a8090', e: '#100c08', w: '#a0f0ff', i: '#40a8e0', k: '#14161c' },
  outline: '#101218', eyeFur: '4', body: 'biped',
  parts: [
    { name: 'spikesF', role: 'fin', far: true, at: [21, 6], piv: [0, 7], outline: '#3a3008', rows: ['..y...', '..yy..y', '.yyY.yY', 'yyY.yY.', 'yY..Y..', 'Y......', '22.....', '22.....'] },
    { name: 'armF', role: 'arm', far: true, at: [22, 14], piv: [3, 1], rows: ['.2332', '233321', '223321', '222211', '.22211', '.22111', '.2211.', '.2211.', '.2111.', '.1111.', 'rrrr..', 'rrrrr.', 'rrrrr.', '.rrr..'] },
    { name: 'legF', role: 'leg', far: true, at: [19, 29], piv: [2, 0], rows: ['22221', '22211', '22211', '21111', '21111', '11111', '111111', '2211111', '2221111'] },
    { name: 'body', role: 'body', at: [11, 12], rows: [
      '...MNNNNNM....', '.MMNNNNNNNMMm.', 'mMMMNNMMMMMMmm', 'mMm4555554mMmm', '.4455555544433', 'c4455b55544333', 'cc445444544332', 'cc444444444332', 'Cc4b444yy4b322',
      'Cc4444yy444322', 'CC444yy4443322', 'CC4444y444b222', 'CC333333333222', '.C333333333222', '.CC33333332221', '..C2222222221.', '...221111111..'] },
    { name: 'legN', role: 'leg', at: [12, 29], piv: [2, 0], rows: ['44443', '44433', '44433', '43332', '43332', '33322', '333322', '4433322', '4443322'] },
    { name: 'head', role: 'head', at: [5, 6], piv: [10, 8], rows: ['.4444444444.', '455555555543', '45555555544 3'.replace(' ', '3'), '4kkkk5554433', '4wwe55544433', '4wwi55544433', '4iii44444332', '.bbbbb44332.', '.444444333..', '..3332222...'] },
    { name: 'antenna', role: 'crest', at: [8, 0], piv: [2, 6], outline: '#3a3008', rows: ['.yY', 'yY.', '.yY', '..y', '.4.', '.4.', '.4.'] },
    { name: 'spikesN', role: 'fin', at: [18, 7], piv: [0, 6], outline: '#3a3008', rows: ['..y....', '.yY..y.', 'yyY.yY.', 'yY.yY..', 'Y..Y...', '33.....', '33.....'] },
    { name: 'armN', role: 'arm', at: [8, 14], piv: [3, 1], rows: ['.MNNM.', 'MNNNMm', '455543', '455433', '445433', '44443.', '44433.', '.4433.', '.4433.', '.4333.', 'RRrrr.', 'RRRrrr', 'RRrrrr', '.rrrr.'] },
  ],
};
