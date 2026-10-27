'use strict';
// Línea de Larvita: Larvita, Crisálix, Polillux, Escarabrón (dibujados a mano, por piezas)

HAND.larvita = {
  pal: { 1: '#3a5a18', 2: '#5a8a20', 3: '#7ab030', 4: '#a8d848', 5: '#d0f080', c: '#f8f0a0', C: '#d8c870', o: '#f08830', O: '#c05a18', e: '#1a2008', w: '#ffffff', i: '#3a4a10', k: '#1e2a0a' },
  outline: '#1e3010', eyeFur: '4',
  parts: [
    { name: 'body', role: 'body', at: [12, 31], rows: ['.455..455..455..', '4555445554455543', '4o44444o44444o43', '4444444444444433', '3333333333333332', 'cCcCcCcCcCcCc222', '.c.c.c.c.c.c.c..'] },
    { name: 'tail', role: 'tail', at: [26, 31], piv: [0, 3], rows: ['.45.', '4553', '4o33', '3332', 'C22.', '.c..'] },
    { name: 'head', role: 'head', at: [5, 25], piv: [8, 7], rows: ['...4555...', '.4555555..', '4555555544', '4we5555443', '4ee5554433', 'cii4o44433', 'cck4444332', '.cc444332.', '..cC3322..'] },
    { name: 'antenna', role: 'crest', at: [8, 19], piv: [2, 5], outline: '#5a2a08', rows: ['o..o', 'O..O', '.2.2', '.22.', '..2.', '..2.'] },
  ],
};

HAND.crisalix = {
  pal: { 1: '#4a5a28', 2: '#6a7e3a', 3: '#94ac5a', 4: '#b0c878', 5: '#d8e098', c: '#d8c070', C: '#a89040', e: '#1a1408', w: '#fff8c0', i: '#6a4a10', k: '#2a2a10', h: '#e8d080', H: '#b09040' },
  outline: '#1e2410', eyeFur: '4',
  parts: [
    { name: 'body', role: 'body', at: [13, 24], rows: ['.4455554433.', '445555544433', '444444443332', 'cccccCCCCC22', '444444433322', '444444433322', 'cccccCCCCC22', '.44444333222', '.44443332221', '.cccCCCCC22.', '..443332221.', '..44332221..', '...332221...', '....2221....'] },
    { name: 'head', role: 'head', at: [12, 11], piv: [7, 13], rows: ['.....55.....', '....5554....', '...455544...', '..45555443..', '.4555554433.', '.4kkk544433.', '.4we5544433.', '.4ee5444332.', '.4ii4444332.', '.cccccCCC22.', '.44444433322', '.44444433322', '.45555444332.', '.44444443332.'] },
    { name: 'horn', role: 'crest', at: [14, 7], piv: [4, 4], outline: '#4a3a10', rows: ['h....', 'hh...', '.hH..', '.hHH.', '..hHH'] },
  ],
};

HAND.polillux = {
  pal: { 1: '#8a7aa0', 2: '#b0a0c8', 3: '#d0c0e0', 4: '#ece0f4', 5: '#fffaff', a: '#a8d4f8', A: '#70a8e0', q: '#f2a6dc', Q: '#c870b0', y: '#fff0a0', e: '#2a1440', w: '#ffffff', i: '#6a3a9a', f: '#f8f0ff' },
  outline: '#3a2a5a', eyeFur: '4', flyer: true,
  parts: [
    { name: 'wingF', role: 'wing', far: true, at: [17, 16], piv: [1, 10], rows: ['.......AAAAAA...', '.....AAaaaaaaAA.', '....Aaaa5aaaaaaA', '...AaaaqqqaaaaaA', '..AaaaqyyqaaaaaA', '..AaaaqyQyqaaaA.', '.AaaaaqyyqaaaA..', '.AaaaaaqqaaaA...', 'AaaaaaaaaaaA....', 'AaaaaaaaAAA.....', 'QqqqqqqQQ.......', 'Qqq5qqqqqQ......', 'QqqqqyqqqQ......', '.QqqqqqqQ.......', '..QQqqQQ........', '....QQ..........'].map((r) => r.replace(/a/g, 'A').replace(/5/g, 'a').replace(/q/g, 'Q')) },
    { name: 'legF', role: 'leg', far: true, at: [19, 35], piv: [0, 0], rows: ['2', '2', '22'] },
    { name: 'body', role: 'body', at: [14, 28], rows: ['.ff44.....', 'ff44443...', 'f4444433..', '4443434333', '.443434332', '..3333322.', '...22221..'] },
    { name: 'legN', role: 'leg', at: [16, 35], piv: [0, 0], rows: ['3', '3', '33'] },
    { name: 'head', role: 'head', at: [8, 24], piv: [7, 6], rows: ['...555...', '.4555554.', '4we555443', '4ee555443', '4ii54443.', 'f444443..', '.ff443...', '..ff.....'] },
    { name: 'antenna', role: 'crest', at: [10, 17], piv: [1, 7], outline: '#6a2a5a', rows: ['....qq', '...qQq', '..qQq.', '.qq...', '.q....', 'q.....', 'q.....'] },
    { name: 'wingN', role: 'wing', at: [14, 18], piv: [1, 10], rows: ['.......AAAAAA...', '.....AAaaaaaaAA.', '....Aaaa5aaaaaaA', '...AaaaqqqaaaaaA', '..AaaaqyyqaaaaaA', '..AaaaqyQyqaaaA.', '.AaaaaqyyqaaaA..', '.AaaaaaqqaaaA...', 'AaaaaaaaaaaA....', 'AaaaaaaaAAA.....', 'QqqqqqqQQ.......', 'Qqq5qqqqqQ......', 'QqqqqyqqqQ......', '.QqqqqqqQ.......', '..QQqqQQ........', '....QQ..........'] },
  ],
};

HAND.escarabron = {
  pal: { 1: '#1e2e1a', 2: '#2e4428', 3: '#3e5a34', 4: '#4a6a40', 5: '#6a8a5a', s: '#a8c8a0', h: '#e0c860', H: '#9a8430', c: '#d8c098', C: '#a89068', e: '#100c08', w: '#f0e060', i: '#c8a020', k: '#0c140a' },
  outline: '#0c140a', eyeFur: '3',
  parts: [
    { name: 'legBF', role: 'legB', far: true, at: [27, 31], piv: [0, 0], rows: ['11', '.1', '.11', '..1', '..1', '..11'] },
    { name: 'legFF', role: 'legF', far: true, at: [18, 31], piv: [0, 0], rows: ['11', '.1', '.11', '..1', '..1', '..11'] },
    { name: 'body', role: 'body', at: [11, 20], rows: [
      '......45555544......', '....4455s5555443....', '..44555ss555544433..', '.4455555s5555444333.', '44555555555554443333', '44455555555544443332', '44444555554444433322', '.4444444444443333222', '.C333333333333332221', '..CCCCcccccccCCCC21.', '...CCCCCCCCCCCCC....'] },
    { name: 'legFN', role: 'legF', at: [12, 31], piv: [1, 0], rows: ['33', '33', '.33', '..3', '..33', '.333'] },
    { name: 'legMN', role: 'legB', at: [19, 31], piv: [1, 0], rows: ['33', '33', '.33', '..3', '..33', '.333'] },
    { name: 'legBN', role: 'legF', at: [25, 31], piv: [1, 0], rows: ['33', '33', '.33', '..3', '..33', '..333'] },
    { name: 'head', role: 'head', at: [4, 22], piv: [9, 4], rows: ['...3443...', '.3444443..', '3444444432', '3we4444322', '3ee4443322', '3ii4433221', '.k3333221.', '..CCC221..'] },
    { name: 'horn', role: 'crest', at: [0, 12], piv: [8, 11], outline: '#3a300c', rows: ['h........', 'hh.......', 'hhh......', '.hhH.....', '.hhH.....', '..hhH....', '..hhH....', '...hhH...', '...hhHH..', '....hhHH.', '.....hHHH', '......HHH'] },
  ],
};
