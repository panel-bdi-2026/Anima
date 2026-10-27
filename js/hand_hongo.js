'use strict';
// Línea de Hongui: Hongui, Setalón, Esporal, Micelión (dibujados a mano, por piezas)
const CAP = ['......rrrrrr......', '....rrsrrrrrrr....', '...rrssrrrrsrrr...', '..rrrrrrrrrssrrR..', '.rrsrrrrrrrrrrRRR.', 'rrssrrrrsrrrrRRRRR', 'RrrrrrrrssrrRRRRRR', '.uuuuuuuuuuuuuuuu.'];
const CAP_BIG = ['.......rrrrrrr.......', '.....rrrsrrrrrrr.....', '...rrrssrrrrrsrrrr...', '..rrrrsrrrrrrssrrrR..', '.rrsrrrrrrsrrrrrrRRR.', 'rrsssrrrrrssrrrrRRRRR', 'rrrsrrrrrrrrrrRRRRRRR', 'RRrrrrrsrrrrRRRRRRRRR', '.uuuuuuuuuuuuuuuuuuu.'];
const keepParts = (sp, drop) => HAND[sp].parts.filter((p) => !drop.includes(p.name));

HAND.hongui = {
  pal: { 1: '#8a7050', 2: '#b09870', 3: '#d0b890', 4: '#f0e0c0', 5: '#fff8e8', c: '#fff8e8', C: '#e8dcc0', e: '#1a1008', w: '#ffffff', i: '#5a3a20', k: '#3a2a18', r: '#d84838', R: '#a82828', s: '#fff4e8', u: '#e8d4b0' },
  outline: '#2e2010', eyeFur: '4',
  parts: [
    ...keepParts('burbujo', ['gillF', 'gillN', 'tail']),
    { name: 'cap', role: 'crest', at: [6, 18], piv: [9, 7], outline: '#4a1010', rows: CAP },
  ],
};

HAND.setalon = {
  pal: { 1: '#7a6040', 2: '#a08860', 3: '#c0a880', 4: '#e8d4b0', 5: '#fff4e0', c: '#fff8ec', C: '#e8dcc0', e: '#1a1008', w: '#ffffff', i: '#5a3a20', k: '#3a2a18', r: '#c83c30', R: '#962424', s: '#fff4e8', u: '#e8d4b0' },
  outline: '#2e2010', eyeFur: '4', body: 'biped',
  parts: [
    ...keepParts('marolo', ['crest', 'tail']),
    { name: 'cap', role: 'crest', at: [0, 3], piv: [10, 8], outline: '#4a1010', rows: CAP },
  ],
};

HAND.esporal = {
  pal: { 1: '#6a5a30', 2: '#9a8850', 3: '#b8a868', 4: '#d8c890', 5: '#f0e4b0', c: '#fff8d8', C: '#e0d4a8', e: '#1a1008', w: '#ffffff', i: '#5a4010', k: '#3a2a10', r: '#e8a020', R: '#b87010', s: '#fff0a0', u: '#e8d4a0', a: '#e8f4ff', A: '#a8c8e8' },
  outline: '#2a2010', eyeFur: '4', body: 'biped',
  parts: [
    { name: 'wingF', role: 'wing', far: true, at: [18, 13], piv: [0, 6], outline: '#5a7a9a', rows: ['....AAA', '..AAAaA', '.AAaaA.', 'AAaaA..', 'AaA....', 'AA.....', 'A......'] },
    ...keepParts('marolo', ['crest', 'tail']).map((p) => p.name === 'body' ? Object.assign({}, p, { rows: handStamp(p.rows, [[6, 5, 'r'], [8, 7, 'r'], [5, 9, 'r']]) }) : p),
    { name: 'cap', role: 'crest', at: [0, 1], piv: [11, 9], outline: '#5a2a08', rows: CAP_BIG },
    { name: 'wingN', role: 'wing', at: [15, 15], piv: [0, 6], outline: '#5a7a9a', rows: ['....aaa', '..aaaAa', '.aaAAa.', 'aaAAa..', 'aAa....', 'aa.....', 'a......'] },
  ],
};

HAND.micelion = {
  pal: { 1: '#2a2034', 2: '#3e3250', 3: '#4a3e5e', 4: '#5a4a68', 5: '#7a6890', c: '#c8b8e0', C: '#9a88b8', e: '#a0ff90', w: '#e8ffe0', i: '#60c050', k: '#1a1024',
    r: '#7058c0', R: '#4a3890', s: '#a0ff90', u: '#5a4a80', g: '#a0ff90', G: '#e8ffe0', p: '#7058c0', P: '#4a3890', q: '#a0ff90' },
  outline: '#140c1c', eyeFur: '4', body: 'biped',
  parts: [
    { name: 'rootF', role: 'fin', far: true, at: [19, 30], piv: [0, 0], rows: ['22..', '.22.', '..21', '...1', '..11'] },
    ...keepParts('coralis', ['tail', 'crown', 'gem']),
    { name: 'cap', role: 'crest', at: [1, 0], piv: [12, 9], outline: '#1a1030', rows: CAP_BIG },
    { name: 'rootN', role: 'fin', at: [17, 31], piv: [0, 0], rows: ['33...', '.333.', '...33', '....3', '...33'] },
  ],
};
