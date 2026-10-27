'use strict';
// Línea de Semillín: Semillín, Hojardo, Robledor, Floraxia (dibujados a mano, por piezas)
const LEAF = { 1: '#1e5a2a', 2: '#2e8a40', 3: '#4aa850', 4: '#78c860', 5: '#a8e888', c: '#f0f8d0', C: '#c8dca0', e: '#14261a', w: '#ffffff', i: '#2a6a3a', k: '#1a3a20', p: '#ff9a9a', g: '#58c048', G: '#a8f080', s: '#3a7a2a' };
const SPROUT = ['.gg.gg.', 'gGg.gGg', '.ggsgg.', '...s...', '...s...', '...s...'];

HAND.semillin = {
  pal: Object.assign({}, LEAF), outline: '#163a1c', eyeFur: '5', body: 'biped',
  parts: [
    { name: 'armF', role: 'arm', far: true, at: [17, 27], piv: [0, 0], rows: ['21', '21', '11', '221'] },
    { name: 'legF', role: 'leg', far: true, at: [16, 34], piv: [1, 0], rows: ['22', '21', '21', '221'] },
    { name: 'tail', role: 'tail', at: [19, 27], piv: [0, 3], outline: '#1e4a18', rows: ['...gG', '..gGg', '.gGg.', 'sgg..', '.s...'] },
    { name: 'body', role: 'body', at: [11, 25], rows: ['...4554...', '..455544..', '.c4555443.', 'cc4444433.', 'cc4444433.', 'Cc4444332.', 'CC3333322.', '.C333222..', '..2222....'] },
    { name: 'legN', role: 'leg', at: [12, 34], piv: [1, 0], rows: ['44', '43', '43', '443'] },
    { name: 'head', role: 'head', at: [6, 17], piv: [8, 8], rows: ['....5555....', '..45555554..', '.4555555544.', '.4we5555443.', '44ee55554433', 'c4ii4p54433.', 'cck444443 3.'.replace(' ', '3'), '.cccC3332...', '...CC22.....'] },
    { name: 'sprout', role: 'crest', at: [8, 11], piv: [3, 5], outline: '#1e4a18', rows: SPROUT },
    { name: 'armN', role: 'arm', at: [12, 27], piv: [1, 0], rows: ['43', '43', '33', '443'] },
  ],
};

HAND.hojardo = {
  pal: Object.assign({}, LEAF, { 3: '#3e9a48', 4: '#5ab050', 5: '#8ad878', c: '#eaf6c8', C: '#c0d898', g: '#2e8a2a', G: '#b8e860' }), outline: '#163a1c', eyeFur: '5', body: 'biped',
  parts: [
    { name: 'leafB', role: 'fin', far: true, at: [19, 14], piv: [0, 6], outline: '#1e4a18', rows: ['.....gg', '...ggGg', '..gGGg.', '.gGGg..', 'gGgg...', 'gg.....', 's......'] },
    { name: 'armF', role: 'arm', far: true, at: [18, 21], piv: [1, 0], rows: ['21', '211', '211', '111', '111', '2211'] },
    { name: 'legF', role: 'leg', far: true, at: [15, 30], piv: [2, 0], rows: ['2221', '2211', '.211', '.211', '.111', '.111', '22111'] },
    { name: 'tail', role: 'tail', at: [19, 24], piv: [1, 4], outline: '#1e4a18', rows: ['.....gGg', '...ggGGg', '..gGGgg.', '.gGgg...', 'sgg.....', 's.......'] },
    { name: 'body', role: 'body', at: [8, 19], rows: [
      '....44554....', '..445555443..', '.c4455554433.', 'cc44455443332', 'ccc4444443332', 'ccc4444443322', 'Ccc4444433322', 'CCc4444333222', 'CCC4443333222', '.CC3333332221', '..C3333222211', '...222222211.'] },
    { name: 'leafN', role: 'fin', at: [17, 16], piv: [0, 7], outline: '#1e4a18', rows: ['......gG', '....ggGg', '...gGGg.', '..gGGg..', '.gGgg...', 'gGg.....', 'gg......', 's.......'] },
    { name: 'legN', role: 'leg', at: [10, 30], piv: [2, 0], rows: ['4443', '4433', '.433', '.332', '.332', '.322', '44322'] },
    { name: 'head', role: 'head', at: [3, 9], piv: [9, 10], rows: [
      '.....5555.....', '...45555554...', '..4555555544..', '.455555555443.', '.44we55555443.', '444ee555544333', 'c44ii4p544433.', 'cck444444333..', '.ccc4444333...', '..cccC3332....', '....CC22......'] },
    { name: 'ear', role: 'ear', at: [12, 5], piv: [0, 5], outline: '#1e4a18', rows: ['....gG', '...gGg', '..gGg.', '.gGg..', 'ggg...', 's.....'] },
    { name: 'leaf', role: 'crest', at: [6, 4], piv: [2, 5], outline: '#1e4a18', rows: ['.gG.', 'gGGg', 'gGgg', '.gg.', '.s..', '.s..'] },
    { name: 'armN', role: 'arm', at: [10, 21], piv: [1, 0], rows: ['443', '433', '433', '332', '332', '4432', '.33'] },
  ],
};

HAND.robledor = {
  pal: { 1: '#3a2a1a', 2: '#5a4028', 3: '#7a5a38', 4: '#a07a50', 5: '#c8a878', b: '#5a3c24', c: '#e0c8a0', C: '#b89868', m: '#3e7a32', M: '#6a9a48', N: '#9ad070',
    g: '#58b048', G: '#9ae070', s: '#3a6a2a', r: '#6a6a74', R: '#a0a0aa', e: '#140c08', w: '#ffe890', i: '#c08a20', k: '#2a1a10' },
  outline: '#20140c', eyeFur: '4', body: 'biped',
  parts: [
    { name: 'leaves', role: 'fin', far: true, at: [21, 5], piv: [0, 7], outline: '#1e4a18', rows: ['...gg.gg', '..gGggGg', '.gGGgGG.', 'gGGgGg..', 'gGgg....', '.g......', '.s......', '.s......'] },
    { name: 'armF', role: 'arm', far: true, at: [22, 14], piv: [3, 1], rows: ['.2332', '233321', '223321', '222211', '.22211', '.22111', '.2211.', '.2211.', '.2111.', '.1111.', 'rrrr..', 'rrrrr.', 'rrrrr.', '.rrr..'] },
    { name: 'legF', role: 'leg', far: true, at: [19, 29], piv: [2, 0], rows: ['22221', '22211', '22211', '21111', '21111', '11111', '111111', '2211111', '2221111'] },
    { name: 'body', role: 'body', at: [11, 12], rows: [
      '...MNNNNNM....', '.MMNNNNNNNMMm.', 'mMMMNNMMMMMMmm', 'mMm4555554mMmm', '.4455555544433', 'c4455455544333', 'cc445444544332', 'cc44b444b44332', 'Cc4b44444b4322',
      'Cc44b4b44b4322', 'CC444b444b3322', 'CC44b444b43222', 'CC3333b333b222', '.C333333333222', '.CC33333332221', '..C2222222221.', '...221111111..'] },
    { name: 'legN', role: 'leg', at: [12, 29], piv: [2, 0], rows: ['44443', '44433', '44433', '43332', '43332', '33322', '333322', '4433322', '4443322'] },
    { name: 'head', role: 'head', at: [5, 7], piv: [10, 7], rows: ['....MNNM....', '..M455554M..', '.4555555544.', '.44kkk54443.', '444we5544433', 'c44ee4444332', 'ccc44444332.', '.kkkk43322..', '..CC222.....'] },
    { name: 'sprout', role: 'crest', at: [7, 1], piv: [3, 5], outline: '#1e4a18', rows: SPROUT },
    { name: 'leavesN', role: 'fin', at: [19, 8], piv: [0, 6], outline: '#1e4a18', rows: ['....gg.', '..ggGg.', '.gGGGgg', 'gGGggG.', 'gGg....', '.s.....', '.s.....'] },
    { name: 'armN', role: 'arm', at: [8, 14], piv: [3, 1], rows: ['.MNNM.', 'MNNNMm', '455543', '455433', '445433', '44443.', '44433.', '.4433.', '.4433.', '.4333.', 'RRrrr.', 'RRRrrr', 'RRrrrr', '.rrrr.'] },
  ],
};

HAND.floraxia = {
  pal: { 1: '#1e5a2a', 2: '#2e8a40', 3: '#4a9a50', 4: '#66c06e', 5: '#9ae0a0', c: '#fff0f8', C: '#f0c8e0', p: '#f472b4', P: '#c84890', q: '#ffb0d8', y: '#ffe070', Y: '#fff8c0',
    g: '#58c048', G: '#a8f080', s: '#3a7a2a', e: '#2a1430', w: '#ffffff', i: '#8a3a8a', k: '#1a3a20' },
  outline: '#1a3a1c', eyeFur: '5', body: 'biped',
  parts: [
    { name: 'armF', role: 'arm', far: true, at: [17, 20], piv: [0, 0], rows: ['21', '211', '211', '111', '11', '11', 'gg', '.g'] },
    { name: 'legF', role: 'leg', far: true, at: [16, 30], piv: [1, 0], rows: ['21', '21', '21', '11', '11', '11', '11', '221'] },
    { name: 'legN', role: 'leg', at: [13, 30], piv: [1, 0], rows: ['43', '43', '43', '32', '32', '32', '32', '443'] },
    { name: 'body', role: 'body', at: [9, 18], rows: [
      '....4554...', '...c45544..', '...cc4544..', '...cc4443..', '...Cc4433..', '....C433...', '...qppppq..', '..qpppPppq.', '.qppPpppPpq', '.pPpppPpppP', 'PpPpPpPpPpP', '.P.P.P.P.P.'] },
    { name: 'head', role: 'head', at: [6, 9], piv: [8, 9], rows: ['....5555....', '..45555554..', '.4555555544.', '.4we5555443.', '44ee55554433', 'c4ii4p54433.', 'cc444443333.', '.cccC3332...', '...CC22.....'] },
    { name: 'flower', role: 'crest', at: [10, 2], piv: [3, 7], outline: '#6a1a48', rows: ['..qq.qq..', '.qppqppq.', '.pPpppPp.', 'qppyyyppq', 'pPpyYypPp', '.ppyyypp.', '..pPpPp..'] },
    { name: 'ear', role: 'ear', at: [13, 9], piv: [0, 4], outline: '#1e4a18', rows: ['...gG', '..gGg', '.gGg.', 'ggg..', 's....'] },
    { name: 'armN', role: 'arm', at: [11, 20], piv: [1, 0], rows: ['43', '433', '433', '332', '32', '32', 'gGg', '.g.'] },
  ],
};
