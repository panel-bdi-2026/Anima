'use strict';
// Línea de Brisín: Brisín, Nimbo, Granizor, Nubaria (dibujados a mano, por piezas)
const CLOUD_S = ['....555555....', '..5555455544..', '..5444444444..', '.544444444335.', '55443333333544', '44433333333444', '43344444444333', '33233333333322', '22332233332222', '...22222222...'];
const CLOUD_M = ['...555......555.....', '..55555....55555....', '.......555555.......', '....555555544555....', '...55555444445554...', '..5554444444444444..', '.544444444434444443.', '55544443333344433554', '44443333333333333444', '44433333333233334443', '33334444444444443333', '33324333433343333332', '22233333333333332222', '.222222222222222222.', '....222222222222....'];
const CLOUD_L = ['....5555......5555......', '..55555555..55555555....', '........55555555........', '......555555555554......', '....5555554455444455....', '..55555444444444445544..', '.5555444444444444444444.', '554444444443444334444445', '554444443333333344443354', '444443333333333343333444', '444433333333333333334444', '433333444244442444334333', '333334433344334443323333', '332233333333333333333322', '222233332333332333222222', '.22.2222222222222222.22.', '.....22222222222222.....'];
const PUFF = ['.55.', '5544', '4433', '.33.'];

HAND.brisin = {
  pal: { 1: '#6a8ab0', 2: '#a8c8e8', 3: '#cce0f4', 4: '#e8f4ff', 5: '#ffffff', e: '#1a2a40', w: '#ffffff', i: '#3a5a8a', k: '#2a3a5a', p: '#ffb0c8' },
  outline: '#4a6a90', eyeFur: '4', flyer: true,
  parts: [
    { name: 'tail', role: 'tail', at: [24, 27], piv: [0, 1], rows: ['.55', '5543', '.43'] },
    { name: 'body', role: 'body', at: [11, 24], rows: handStamp(CLOUD_S, [[4, 2, 'we'], [5, 2, 'ee'], [6, 2, 'ii'], [6, 5, 'p'], [7, 3, 'k']]) },
    { name: 'wisp', role: 'crest', at: [14, 20], piv: [1, 4], rows: ['..55', '.5..', '.45.', '..4.'] },
  ],
};

HAND.nimbo = {
  pal: { 1: '#5a7aa0', 2: '#8aa8d0', 3: '#b4cce4', 4: '#d4e4f4', 5: '#f4faff', e: '#1a2a40', w: '#ffffff', i: '#3a5a8a', k: '#2a3a5a' },
  outline: '#3a5a80', eyeFur: '4', flyer: true,
  parts: [
    { name: 'cloudB', role: 'fin', far: true, at: [22, 13], piv: [2, 8], rows: CLOUD_S.slice(0, 8).map((r) => r.slice(0, 12)) },
    { name: 'tail', role: 'tail', at: [27, 24], piv: [0, 2], rows: PUFF },
    { name: 'body', role: 'body', at: [9, 17], rows: handStamp(CLOUD_M, [[7, 2, 'kk'], [8, 2, 'we'], [9, 2, 'ee'], [10, 2, 'ii'], [11, 3, 'kkk']]) },
    { name: 'armN', role: 'arm', at: [8, 26], piv: [2, 0], rows: PUFF },
  ],
};

HAND.granizor = {
  pal: { 1: '#3a4458', 2: '#5a6880', 3: '#7a88a0', 4: '#8a98b0', 5: '#b0bcd0', g: '#a8e0ff', G: '#ffffff', e: '#0a1020', w: '#e0f8ff', i: '#60b0e0', k: '#1a2030' },
  outline: '#1a2030', eyeFur: '4', flyer: true,
  parts: [
    { name: 'iceB', role: 'fin', far: true, at: [20, 9], piv: [2, 7], outline: '#2a5a80', rows: ['..g..', '.gG..', '.gGg.', 'gGGg.', 'gGgg.', '.gg..', '.g...'] },
    { name: 'tail', role: 'tail', at: [29, 22], piv: [0, 2], rows: ['.44.', '4433', '3322', '.22.', '.g..', '..g.'] },
    { name: 'body', role: 'body', at: [7, 14], rows: handStamp(CLOUD_L, [[7, 2, 'kkk'], [8, 2, 'ww'], [9, 2, 'wi'], [10, 2, 'ii'], [12, 2, 'kgkgk'], [14, 6, 'g'], [14, 14, 'g'], [15, 10, 'g']]) },
    { name: 'spikes', role: 'crest', at: [10, 10], piv: [4, 6], outline: '#2a5a80', rows: ['g....g..', 'Gg..gG..', 'gGg.gGg.', '.gGggGg.', '.gGGGgg.', '..gggg..'] },
    { name: 'armN', role: 'arm', at: [5, 24], piv: [2, 0], rows: PUFF },
  ],
};

HAND.nubaria = {
  pal: { 1: '#b080b8', 2: '#d8a8d8', 3: '#f0c8ec', 4: '#f8e8ff', 5: '#ffffff', p: '#f0a8e0', P: '#c070b8', y: '#fff0a0', e: '#5a1a6a', w: '#ffe0ff', i: '#d080ff', k: '#7a3a80' },
  outline: '#8a5090', eyeFur: '4', flyer: true,
  parts: [
    { name: 'cloudB', role: 'fin', far: true, at: [20, 10], piv: [2, 9], rows: CLOUD_S.slice(0, 9) },
    { name: 'tail', role: 'tail', at: [29, 22], piv: [0, 2], rows: ['.55..', '55443', '.4332', '..2..'] },
    { name: 'body', role: 'body', at: [7, 14], rows: handStamp(CLOUD_L, [[8, 2, 'ee'], [9, 2, 'ii'], [9, 5, 'p'], [10, 3, 'kk']]) },
    { name: 'crown', role: 'crest', at: [11, 11], piv: [3, 5], outline: '#6a2a60', rows: ['p..y..p', 'pp.p.pp', 'pPpPpPp', 'PPPPPPP', '.PyPyP.'] },
    { name: 'armN', role: 'arm', at: [5, 24], piv: [2, 0], rows: PUFF },
  ],
};
