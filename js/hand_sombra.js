'use strict';
// Línea de Umbrín: Umbrín, Penumbro, Eclipsor, Lunargo (dibujados a mano, por piezas)
const SHADE = { 1: '#2e2050', 2: '#4a3878', 3: '#7058a8', 4: '#8a70c8', 5: '#a890e0', c: '#c8b0f0', C: '#a080e0', e: '#1a1030', w: '#fffbb0', i: '#f8f070', k: '#1a1030' };

HAND.umbrin = {
  pal: Object.assign({}, SHADE), outline: '#140c28', eyeFur: '4', flyer: true,
  parts: [
    { name: 'armF', role: 'arm', far: true, at: [20, 25], piv: [0, 0], rows: ['22', '.2'] },
    { name: 'tail', role: 'tail', at: [15, 29], piv: [2, 0], rows: ['443322', '.43322', '..3322', '...3322', '....332', '.....22'] },
    { name: 'body', role: 'body', at: [11, 20], rows: ['....4554....', '..45555544..', '.4555555443.', '.4ww55554433', '44wi55554433', '44ii44444332', '4kkkk4444332', '.44444443322', '..444443322.', '...4443322..'] },
    { name: 'wisp', role: 'crest', at: [14, 15], piv: [1, 5], rows: ['...5', '..45', '.45.', '445.', '44..', '4...'] },
    { name: 'armN', role: 'arm', at: [9, 25], piv: [1, 0], rows: ['44', '4.'] },
  ],
};

HAND.penumbro = {
  pal: Object.assign({}, SHADE, { 1: '#241840', 2: '#3a2c68', 3: '#584090', 4: '#7458b0', 5: '#9478d0', c: '#b8a0e8' }), outline: '#100820', eyeFur: '4', flyer: true,
  parts: [
    { name: 'armF', role: 'arm', far: true, at: [23, 22], piv: [0, 0], rows: ['221', '22.', '2..'] },
    { name: 'tail', role: 'tail', at: [15, 26], piv: [2, 0], rows: ['4433322', '.4433322', '..443322', '...43322', '....3322', '.....322', '......22'] },
    { name: 'body', role: 'body', at: [9, 14], rows: ['.....455554.....', '...4455555544...', '..455555555544..', '.45555555555443.', '.4ww55555554433.', '44wi555555544333', '44ii555555444333', '4kkkkk5554443332', '.4kwkwk444433322', '.44444444433322.', '..444444433322..', '..44444433322...', '...444433322....'] },
    { name: 'spikes', role: 'crest', at: [11, 9], piv: [3, 5], rows: ['.......4..', '..4...44..', '.44..443..', '443.4433..', '4433433...', '.333333...'] },
    { name: 'armN', role: 'arm', at: [7, 22], piv: [2, 0], rows: ['445', '44.', '4..'] },
  ],
};

const ghostBody = ['......455554......', '....4455555544....', '...455555555544...', '..45555555555544..', '.4555555555555443.', '.4kkk555555554433.', '44ww55555555544333', '44wi55555555444333', '44ii55555554443332', '.44445555544443332', '.4444444444433322.', '..444444444433322.', '...4444444433322..', '....44444433322...'];
const ghostTail = ['444433322', '.44433322', '..4433322', '...433322', '....33322', '.....3322', '......322', '.......22'];

HAND.eclipsor = {
  pal: { 1: '#1a1028', 2: '#281a40', 3: '#382858', 4: '#4a3870', 5: '#6a5090', c: '#8a70c0', C: '#6a50a0', e: '#2a0a00', w: '#ffe080', i: '#ffb040', k: '#0c0818', r: '#f05818', f: '#ffb030', F: '#fff0b0' },
  outline: '#0a0612', eyeFur: '4', flyer: true,
  parts: [
    { name: 'flameB', role: 'fin', far: true, at: [23, 10], piv: [0, 6], outline: '#8a2008', rows: ['..r..', '.rfr.', 'rfFr.', 'rfFfr', '.rffr', '..rr.'] },
    { name: 'armF', role: 'arm', far: true, at: [24, 19], piv: [0, 0], rows: ['221', '22.', '2..'] },
    { name: 'tail', role: 'tail', at: [14, 25], piv: [2, 0], rows: ghostTail },
    { name: 'body', role: 'body', at: [8, 12], rows: ghostBody },
    { name: 'crown', role: 'crest', at: [10, 5], piv: [4, 7], outline: '#8a2008', rows: ['.r..r..r.', 'rfr.rfrrf', 'rfFrfFrfr', 'rffFffFfr', '.rffffffr', '..rrrrrr.', '...rrrr..'] },
    { name: 'armN', role: 'arm', at: [6, 19], piv: [2, 0], rows: ['445', '44.', '4..'] },
  ],
};

const batWing = ['.............44', '..........4443.', '.......4444433.', '....44444443333', '..4444444433333', '.44444443333332', '444444333333322', '44443333322.322', '4433.3322...22.', '43...32......2.'];

HAND.lunargo = {
  pal: { 1: '#141432', 2: '#22224a', 3: '#2e2e60', 4: '#3a3a7a', 5: '#5a5aa0', c: '#d0d8ff', C: '#a8b4f0', e: '#0a0a20', w: '#e8ffff', i: '#c0f0ff', g: '#c8d4ff', G: '#ffffff', k: '#0a0a20' },
  outline: '#06061a', eyeFur: '4', flyer: true,
  parts: [
    { name: 'wingF', role: 'wing', far: true, at: [19, 5], piv: [0, 7], rows: handFar(batWing) },
    { name: 'tail', role: 'tail', at: [14, 25], piv: [2, 0], rows: ghostTail },
    { name: 'body', role: 'body', at: [8, 12], rows: ghostBody },
    { name: 'gem', role: 'crest', at: [11, 14], piv: [0, 0], outline: '#3a3a7a', rows: ['gG', 'gg'] },
    { name: 'armN', role: 'arm', at: [6, 19], piv: [2, 0], rows: ['445', '44.', '4..'] },
    { name: 'wingN', role: 'wing', at: [17, 8], piv: [0, 7], rows: batWing },
  ],
};
