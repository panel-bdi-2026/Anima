'use strict';
// Línea de Rabín: Rabín, Conejal, Liebrón, Nocturo (dibujados a mano, por piezas)
const BUNNY = { 1: '#6a4a30', 2: '#906848', 3: '#a07850', 4: '#c8a078', 5: '#e8c8a0', c: '#f8ecd8', C: '#dcc8a8', e: '#1e1410', w: '#ffffff', i: '#4a2a18', n: '#3a2018', p: '#ffa0a0', t: '#ffffff', T: '#e0d8cc' };

HAND.rabin = {
  pal: Object.assign({}, BUNNY), outline: '#2e2018', eyeFur: '4',
  parts: [
    { name: 'legBF', role: 'legB', far: true, at: [22, 32], piv: [1, 0], rows: ['221', '211', '.21', '221'] },
    { name: 'legFF', role: 'legF', far: true, at: [15, 33], piv: [1, 0], rows: ['21', '21', '21', '221'] },
    { name: 'earF', role: 'ear', far: true, at: [14, 12], piv: [1, 8], rows: ['.2.', '222', '2p2', '2p2', '2p2', '2p2', '222', '.22', '.22'] },
    { name: 'tail', role: 'tail', at: [24, 25], piv: [0, 2], outline: '#8a8070', rows: ['.TtT.', 'TtttT', 'tttTt', '.TtT.'] },
    { name: 'body', role: 'body', at: [12, 26], rows: ['.......45554..', '....445555544.', '..445555544433', '.c444444444433', 'cc444444443332', 'cc433333333322', '.C332222222221', '..C221111111..'] },
    { name: 'legBN', role: 'legB', at: [20, 31], piv: [2, 0], rows: ['44433', '44333', '.4332', '..332', '..322', '.3322', '44332'] },
    { name: 'legFN', role: 'legF', at: [13, 33], piv: [1, 0], rows: ['43', '43', '43', '443'] },
    { name: 'head', role: 'head', at: [5, 19], piv: [8, 7], rows: ['....5554...', '..4555554..', '.455555443.', '.4we555443.', '.4ee554433.', 'n4ii4p4332.', '.cc4444332.', '..ccC3322..', '....CC2....'] },
    { name: 'earN', role: 'ear', at: [10, 9], piv: [1, 9], rows: ['.4.', '454', '4p4', '4p4', '4p4', '4p4', '4p3', '443', '.43', '.43'] },
  ],
};

HAND.conejal = {
  pal: Object.assign({}, BUNNY, { 2: '#805838', 3: '#906840', 4: '#b88a60', 5: '#dab088', c: '#f8e8d0' }), outline: '#2a1c12', eyeFur: '4',
  parts: [
    { name: 'legBF', role: 'legB', far: true, at: [24, 29], piv: [2, 0], rows: ['2221', '2211', '.211', '..21', '..21', '..21', '..21', '.221', '2211'] },
    { name: 'legFF', role: 'legF', far: true, at: [17, 31], piv: [1, 0], rows: ['221', '211', '211', '111', '111', '2211', '2211'] },
    { name: 'earF', role: 'ear', far: true, at: [13, 4], piv: [2, 11], rows: ['.22.', '2222', '2p22', '2p22', '2p22', '2p22', '2p21', '2p21', '2221', '.221', '.221', '.221'] },
    { name: 'tail', role: 'tail', at: [27, 21], piv: [0, 3], outline: '#8a8070', rows: ['..TtT.', '.TtttT', 'TttttT', 'TtttTt', '.TtTT.'] },
    { name: 'body', role: 'body', at: [11, 23], rows: [
      '........455544...', '.....44555555443.', '...4455555544433.', '..c44444444444333', '.cc44444444443332', '.cc44444444433322', '.Cc33333333333222', '..CC2222222222221', '....C2111111111..'] },
    { name: 'legBN', role: 'legB', at: [21, 28], piv: [2, 0], rows: ['444433', '4443333', '.44332', '..4332', '..3322', '..3322', '..3322', '..3322', '.43322', '443322'] },
    { name: 'legFN', role: 'legF', at: [13, 31], piv: [1, 0], rows: ['443', '433', '433', '332', '332', '4432', '4432'] },
    { name: 'head', role: 'head', at: [3, 15], piv: [10, 8], rows: ['.....55554...', '...455555544.', '..45555555443', '.44we5555443.', '.44ee5554433.', 'n44ii4p44332.', '.cc444444332.', '..cccC33322..', '....CCC22....'] },
    { name: 'earN', role: 'ear', at: [9, 3], piv: [2, 12], rows: ['.44.', '4554', '4p54', '4p54', '4p54', '4p54', '4p53', '4p53', '4p53', '4443', '.443', '.443', '.443'] },
  ],
};

// liebre adulta: mismo esqueleto, más alta y estilizada
const hare = (pal, outline, extra, eye) => ({
  pal, outline, eyeFur: '4',
  parts: [
    { name: 'legBF', role: 'legB', far: true, at: [26, 29], piv: [2, 0], rows: ['22221', '22211', '.2211', '..211', '..21', '..21', '.221', '2211', '2211'] },
    { name: 'legFF', role: 'legF', far: true, at: [17, 31], piv: [1, 0], rows: ['221', '211', '211', '111', '111', '2211', '2211'] },
    { name: 'earF', role: 'ear', far: true, at: [12, 4], piv: [2, 10], rows: ['.22.', '2222', '2q22', '2q22', '2q22', '2q21', '2q21', '2q21', '2221', '.221', '.221'] },
    ...(extra.back || []),
    { name: 'tail', role: 'tail', at: [29, 20], piv: [0, 4], outline: extra.tailOutline || '#8a8070', rows: extra.tail || ['...TtT.', '.TtttTt', 'TttttTt', 'TtttttT', '.TttTT.', '..TT...'] },
    { name: 'body', role: 'body', at: [10, 22], rows: [
      '.........4555544....', '......445555555443..', '....44555555554443..', '..c444444444444433..', '.cc44444444444443332', '.cc44444444444433322', 'cc444444444444333322', '.Cc33333333333332222', '..CC222222222222221.', '....CC21111111111...'] },
    ...(extra.mid || []),
    { name: 'legBN', role: 'legB', at: [22, 27], piv: [3, 0], rows: ['.4444433', '444443333', '4444433322', '.44443322', '..443322', '...4332', '...332', '..4332', '.44332', '443322', '44332'] },
    { name: 'legFN', role: 'legF', at: [13, 31], piv: [1, 0], rows: ['443', '433', '433', '332', '332', '4432', '4432'] },
    { name: 'head', role: 'head', at: [2, 14], piv: [11, 9], rows: [
      '......55554...', '....4555555544.', '...455555555443', '..44' + eye[0] + '5555544 3'.replace(' ', '3'), '..44' + eye[1] + '555544433', '.n44' + eye[2] + '4p4443322', '..cc4444444332.', '...cccC333322..', '.....CCC222....'] },
    { name: 'earN', role: 'ear', at: [8, 3], piv: [2, 11], rows: ['.44.', '4554', '4q54', '4q54', '4q54', '4q54', '4q53', '4q53', '4q53', '4443', '.443', '.443'] },
    ...(extra.front || []),
  ],
});

HAND.liebron = hare(Object.assign({}, BUNNY, { 1: '#7a5a38', 2: '#a07a50', 3: '#c09868', 4: '#e0c08e', 5: '#f8e0b8', c: '#fffaf0', C: '#e8dcc8', q: '#ffb8b0', u: '#ffffff', U: '#d8e8f8', V: '#a8c4e0' }), '#3a2a18', {
  back: [{ name: 'cloud', role: 'fin', at: [15, 17], piv: [6, 6], outline: '#6a84a8', rows: ['...uuu...uu..', '.uuuuuuuuuuu.', 'uuUuuuuUuuuuu', 'UUuUUuuUUuUUU', '.VUUVVUUUVVU.', '..VV..VVV....'] }],
  tail: ['...uuu.', '.uuuuUu', 'uuuUuuU', 'UuuuUUV', '.VUUVV.'], tailOutline: '#6a84a8',
}, ['we', 'ee', 'ii']);

HAND.nocturo = hare({ 1: '#1a1628', 2: '#2e2840', 3: '#3e3656', 4: '#585070', 5: '#7a7096', c: '#c8c0e0', C: '#9a90b8', e: '#3a2a08', w: '#fff8b0', i: '#f0d050', n: '#100c18', p: '#8a5a9a', q: '#a070c0', t: '#c8c0e0', T: '#8a80a8', m: '#f8e890', M: '#f0d050' }, '#0c0a14', {
  front: [{ name: 'moon', role: 'crest', at: [12, 16], piv: [0, 0], outline: '#2a2410', rows: ['.mm', 'm..', 'M..', '.MM'] }],
  tail: ['...T44.', '.T44443', 'T444333', '.433322', '..3222.'], tailOutline: '#0c0a14',
}, ['ww', 'wi', 'ii']);
