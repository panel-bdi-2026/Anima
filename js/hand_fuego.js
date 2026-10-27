'use strict';
// Línea de Ignito: Fogarzo, Magmaurio, Solarix (dibujados a mano, por piezas)
const FLAME = { r: '#f04818', f: '#ffc838', F: '#fff4c4' };

HAND.fogarzo = {
  pal: Object.assign({ 1: '#7a2016', 2: '#b03818', 3: '#e05a20', 4: '#ff8030', 5: '#ffb050', c: '#f8dcb0', C: '#d8a070', e: '#1a1020', w: '#ffffff', i: '#6a2410', n: '#2a0e10', p: '#ff8a7a', k: '#3a1418' }, FLAME),
  outline: '#3a1418', eyeFur: '4',
  parts: [
    { name: 'legBF', role: 'legB', far: true, at: [26, 29], piv: [1, 0], rows: ['221', '211', '211', '211', '111', '111', '111', '111', '2211'] },
    { name: 'legFF', role: 'legF', far: true, at: [15, 29], piv: [1, 0], rows: ['221', '221', '211', '211', '211', '111', '111', '111', '2211'] },
    { name: 'earF', role: 'ear', far: true, at: [11, 9], piv: [1, 4], rows: ['2..', '22.', '2p2', '2p2', '222'] },
    { name: 'tail', role: 'tail', at: [24, 9], piv: [5, 14], outline: '#a82010', rows: [
      '.....r.....', '....rr...r.', '...rfr..rr.', '..rffr.rfr.', '..rfFfrrffr', '.rfFFffFffr', 'rfFFFFFFffr', 'rffFFFFFffr', 'rffFFFFfffr', '.rffFFffrr.', '.rrffffrr..', '..rrrfrr...', '...r3344...', '....334....', '....33.....'] },
    { name: 'body', role: 'body', at: [11, 22], rows: [
      '......45555444....', '...4455555444443..', '.cc444444444444333', 'ccc444444444443333', 'cc4444444443333332', 'cc3333333333332222', '.C333332222222222.', '..C222222211111...', '....2211111.......'] },
    { name: 'mane', role: 'fin', at: [15, 13], piv: [3, 7], outline: '#a82010', rows: ['..r....', '.rfr.r.', '.rfFrfr', 'rfFFffr', 'rfFFFfr', '.rffFr.', '..rrr..'] },
    { name: 'legBN', role: 'legB', at: [24, 29], piv: [1, 0], rows: ['4443', '4433', '332', '332', '332', '322', '322', '322', '4432'] },
    { name: 'legFN', role: 'legF', at: [13, 29], piv: [1, 0], rows: ['443', '443', '433', '332', '332', '322', '322', '322', '4432'] },
    { name: 'head', role: 'head', at: [2, 14], piv: [11, 9], rows: [
      '......5555....', '....455555444.', '...45554444443', '..455444444433', '..44kwe4444332', '..44ee44444332', 'cc44ii4p443322', 'ncccc44433322.', '.cccC3332222..', '...CC2221.....'] },
    { name: 'earN', role: 'ear', at: [8, 8], piv: [1, 5], rows: ['4...', '45..', '453.', '4p3.', '4p33', '4p33'] },
  ],
};

HAND.magmaurio = {
  pal: Object.assign({ 1: '#4a1a14', 2: '#7a2a18', 3: '#a83c1c', 4: '#d0582a', 5: '#f08040', a: '#3a3438', b: '#5a5254', d: '#7a7072', g: '#a09496', l: '#ff7a20', L: '#ffd050',
    c: '#e8c898', C: '#c09060', e: '#1a1020', w: '#ffe080', i: '#ff7a20', n: '#2a0e10', k: '#2a1010', W: '#fff8e8' }, FLAME),
  outline: '#1e0c0c', eyeFur: '4',
  parts: [
    { name: 'legBF', role: 'legB', far: true, at: [27, 29], piv: [2, 0], rows: ['2221', '2211', '2211', '2111', '1111', '1111', '1111', '1111', '22111'] },
    { name: 'legFF', role: 'legF', far: true, at: [13, 29], piv: [2, 0], rows: ['2221', '2211', '2211', '2211', '2111', '2111', '1111', '1111', '22111'] },
    { name: 'tail', role: 'tail', at: [29, 5], piv: [4, 14], outline: '#7a1808', rows: [
      '....r.....', '...rr..r..', '..rfr.rr..', '..rffrrfr.', '.rfFfffFr.', '.rfFFFFFfr', 'rffFFFFffr', 'rffFFFfffr', '.rfffffrr.', '.rrfffrr..', '..rrrrr...', '...bdb....', '...bdd....', '..gddb....', '..gdb.....'] },
    { name: 'body', role: 'body', at: [8, 18], rows: [
      '........gdg...dgg.......', '......gddbdg.gdbbdg.....', '....4gdbbLbbdgbbLbdg4...', '..44455bbabbbabbab55443.', '.cc44444555444444443333.', 'ccc444444444444444333322', 'ccc44l44444l444443333222', 'cc3333l3333333l333322222', '.C33333333333333322222..', '..C22222222222222221111..'.slice(0, 24), '....22221111111111......'] },
    { name: 'legBN', role: 'legB', at: [24, 29], piv: [2, 0], rows: ['44443', '44433', '4433', '3332', '3332', '3322', '3222', '3222', '43322'] },
    { name: 'legFN', role: 'legF', at: [9, 29], piv: [2, 0], rows: ['4443', '4443', '4433', '4433', '3332', '3332', '3322', '3222', '43322'] },
    { name: 'hornF', role: 'crest', far: true, at: [8, 4], piv: [0, 5], rows: ['.....d', '....db', '...dba', '..dba.', '.dba..', 'dba...'] },
    { name: 'head', role: 'head', at: [0, 10], piv: [13, 12], rows: [
      '.....ggdg........', '...4gdbbbdg4.....', '..445555555544...', '.44555555554444..', '.4kkkkk444444443.', '.4LLwe4444444433.', '.44eei444444433..', 'cc44444444443332.', 'nccc444444433322.', '.kkkkkkC33322222.', '.cWcWcWC2222111..', '..CCCCC222111....', '....CC1111.......'] },
    { name: 'hornN', role: 'crest', at: [5, 5], piv: [0, 6], rows: ['.....g', '....gd', '...gdb', '..gdb.', '.gdb..', 'gdb...', 'db....'] },
  ],
};

HAND.solarix = {
  pal: Object.assign({ 1: '#7a1e10', 2: '#b83a18', 3: '#e05e20', 4: '#ff8a2c', 5: '#ffc060', c: '#fff2d0', C: '#f0c890', e: '#1a1020', w: '#ffffff', i: '#7a3a10', n: '#3a1408', p: '#ff9a7a', y: '#fffbe6', o: '#ff5a18', g: '#ffd860', h: '#f8a840', j: '#d83818' }, FLAME),
  outline: '#4a1a0c', eyeFur: '4',
  parts: [
    { name: 'wingF', role: 'wing', far: true, at: [16, 15], piv: [2, 4], outline: '#6a1e0c', rows: ['...ggggg......', '.gghhhhhgg....', 'ghhhhhhhhhhg..', 'ghhjjjjjjjhhgg', '.hjjjjjjjjjjjh', '..j1j1j1j1j11.', '...1.1.1.1.1..'] },
    { name: 'legBF', role: 'legB', far: true, at: [26, 29], piv: [1, 0], rows: ['21', '21', '21', '21', '11', '11', '11', '11', '221'] },
    { name: 'legFF', role: 'legF', far: true, at: [16, 29], piv: [1, 0], rows: ['21', '21', '21', '21', '11', '11', '11', '11', '221'] },
    { name: 'earF', role: 'ear', far: true, at: [12, 7], piv: [1, 4], rows: ['3..', '33.', '3p3', '3p3', '333'] },
    { name: 'tail', role: 'tail', at: [26, 11], piv: [4, 12], outline: '#9a3a0c', rows: ['...o.....', '..oo...o.', '..o5o..oo', '.o55o.o5o', '.o5y5oo5o', 'o5yy55y5o', 'o5yyyyy5o', 'o55yyy55o', '.o55y55o.', '.oo555oo.', '..ooooo..', '...434...', '...44....'] },
    { name: 'body', role: 'body', at: [12, 22], rows: [
      '.....4555444.....', '...445555444443..', '.cc4444444444333.', 'ccc44444444433332', '.cC33333333332222', '..C222222222222..', '....222111111....'] },
    { name: 'legBN', role: 'legB', at: [24, 28], piv: [1, 0], rows: ['443', '443', '43', '43', '32', '32', '32', '32', '32', '443'] },
    { name: 'legFN', role: 'legF', at: [14, 29], piv: [1, 0], rows: ['43', '43', '43', '43', '32', '32', '32', '32', '443'] },
    { name: 'wingN', role: 'wing', at: [14, 17], piv: [2, 4], outline: '#6a1e0c', rows: ['...yyyyy......', '.yyggggggyy...', 'yggggggggggy..', 'ygghhhhhhhggyy', '.ghhhhhhhhhhhg', '..hjhjhjhjhjj.', '...j.j.j.j.j..'] },
    { name: 'head', role: 'head', at: [3, 13], piv: [10, 8], rows: [
      '.....5555....', '...45555544..', '..4555544443.', '..44we444433.', '..44ee444332.', 'cc44ii4p4332.', 'nccc4443332..', '.cccC33222...', '...CC221.....'] },
    { name: 'earN', role: 'ear', at: [9, 6], piv: [1, 6], rows: ['5...', '45..', '453.', '4553', '4p53', '4p33', '.433'] },
  ],
};
