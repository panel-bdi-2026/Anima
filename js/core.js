'use strict';
// ============================================================
//  ÁNIMA: Región Alba — núcleo del motor
//  Utilidades, entrada, fuente bitmap, escenas y bucle principal
// ============================================================

// pantalla panorámica 16:9: el mundo usa todo el ancho; los menús se diseñan a 320 y se centran
const WIDE = 426, UI_W = 320, UIX = (WIDE - UI_W) / 2;
let W = WIDE;
const H = 240, TILE = 16;

// ---------- utilidades ----------
const U = {
  rand: (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a)),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  chance: (p) => Math.random() < p,
  choice: (arr) => arr[Math.floor(Math.random() * arr.length)],
  weighted(list, key = 'w') {
    let tot = 0; for (const e of list) tot += e[key];
    let r = Math.random() * tot;
    for (const e of list) { r -= e[key]; if (r <= 0) return e; }
    return list[list.length - 1];
  },
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
  approach(v, target, step) { return v < target ? Math.min(v + step, target) : Math.max(v - step, target); },
  angDiff(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; },
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  pad: (s, n, c = ' ') => { s = String(s); while (s.length < n) s = c + s; return s; },
  hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((v) => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  },
  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  },
  hslToRgb(h, s, l) {
    if (s === 0) return [l * 255, l * 255, l * 255];
    const hue = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return [hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255];
  },
  // ajusta luminosidad (+/-) y desplaza el tono hacia frío/cálido para un sombreado más rico
  shade(hex, dl, hueShift = 0, ds = 0) {
    const [r, g, b] = U.hexToRgb(hex);
    let [h, s, l] = U.rgbToHsl(r, g, b);
    h = (h + hueShift + 1) % 1; l = U.clamp(l + dl, 0, 1); s = U.clamp(s + ds, 0, 1);
    return U.rgbToHex(...U.hslToRgb(h, s, l));
  },
  mix(a, b, t) {
    const A = U.hexToRgb(a), B = U.hexToRgb(b);
    return U.rgbToHex(U.lerp(A[0], B[0], t), U.lerp(A[1], B[1], t), U.lerp(A[2], B[2], t));
  },
  makeCanvas(w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    return [c, x];
  },
  clone: (o) => JSON.parse(JSON.stringify(o)),
};

// ---------- entrada ----------
const Input = {
  map: {
    up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
    a: ['KeyZ', 'Space', 'Enter'], b: ['KeyX', 'Escape', 'Backspace'], start: ['Enter', 'Escape'],
    run: ['ShiftLeft', 'ShiftRight'],
    m1: ['Digit1', 'KeyJ', 'Numpad1'], m2: ['Digit2', 'KeyK', 'Numpad2'], m3: ['Digit3', 'KeyL', 'Numpad3'], m4: ['Digit4', 'KeyI', 'Numpad4'],
    dodge: ['Space'], swap: ['KeyQ', 'Tab'], ball: ['KeyE'], ult: ['KeyF', 'Digit5'], cycle: ['KeyR'], duo: ['KeyG', 'Digit6'], sneak: ['KeyC'], map: ['KeyM'],
  },
  held: {}, pressedKeys: {}, holdTime: {}, typed: [],
  // ratón: posición en coordenadas del juego, botones y rueda
  mouse: { x: W / 2, y: H / 2, down: {}, pressed: {}, released: {}, wheel: 0, moved: false, last: -1e9, inside: false },
  mouseCapture: false, // el combate usa los clics como ataques
  usingMouse() { return performance.now() - this.mouse.last < 5000 && this.mouse.inside; },
  init() {
    const cv = document.getElementById('game');
    const pos = (e) => { const r = cv.getBoundingClientRect(); this.mouse.x = ((e.clientX - r.left) * WIDE) / r.width; this.mouse.y = ((e.clientY - r.top) * H) / r.height; this.mouse.inside = this.mouse.x >= 0 && this.mouse.y >= 0 && this.mouse.x < WIDE && this.mouse.y < H; };
    window.addEventListener('mousemove', (e) => { pos(e); this.mouse.moved = true; this.mouse.last = performance.now(); });
    cv.addEventListener('mousedown', (e) => { pos(e); e.preventDefault(); this.mouse.down[e.button] = true; this.mouse.pressed[e.button] = true; this.mouse.last = performance.now(); Sound.unlock(); });
    window.addEventListener('mouseup', (e) => { if (this.mouse.down[e.button]) this.mouse.released[e.button] = true; this.mouse.down[e.button] = false; });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('wheel', (e) => { e.preventDefault(); this.mouse.wheel += Math.sign(e.deltaY); this.mouse.last = performance.now(); }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Backspace'].includes(e.code)) e.preventDefault();
      if (!this.held[e.code]) this.pressedKeys[e.code] = true;
      this.held[e.code] = true;
      if (e.key && e.key.length === 1) this.typed.push(e.key);
      else if (e.key === 'Backspace') this.typed.push('\b');
      else if (e.key === 'Enter') this.typed.push('\n');
      Sound.unlock();
    });
    window.addEventListener('keyup', (e) => { this.held[e.code] = false; });
    window.addEventListener('blur', () => { this.held = {}; });
    window.addEventListener('mousedown', () => Sound.unlock());
  },
  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && pads[0];
    if (!p) return;
    const set = (code, on) => {
      if (on && !this.held[code]) this.pressedKeys[code] = true;
      this.held[code] = on;
    };
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    const b = (i) => !!(p.buttons[i] && p.buttons[i].pressed);
    set('GP_up', ay < -0.5 || b(12)); set('GP_down', ay > 0.5 || b(13));
    set('GP_left', ax < -0.5 || b(14)); set('GP_right', ax > 0.5 || b(15));
    set('GP_a', b(0)); set('GP_b', b(1)); set('GP_x', b(2)); set('GP_y', b(3));
    set('GP_start', b(9)); set('GP_lb', b(4)); set('GP_rb', b(5)); set('GP_lt', b(6)); set('GP_rt', b(7));
  },
  gpMap: { up: 'GP_up', down: 'GP_down', left: 'GP_left', right: 'GP_right', a: 'GP_a', b: 'GP_b', start: 'GP_start',
    m1: 'GP_x', m2: 'GP_y', m3: 'GP_lb', m4: 'GP_rb', dodge: 'GP_a', run: 'GP_b', swap: 'GP_lt', ball: 'GP_rt', ult: 'GP_start', cycle: 'GP_lt' },
  down(act) {
    for (const k of this.map[act]) if (this.held[k]) return true;
    const g = this.gpMap[act]; return !!(g && this.held[g]);
  },
  pressed(act) {
    for (const k of this.map[act]) if (this.pressedKeys[k]) return true;
    if (!this.mouseCapture) {
      if (act === 'a' && this.mouse.pressed[0]) return true;
      if (act === 'b' && this.mouse.pressed[2]) return true;
      if (act === 'up' && this.mouse.wheel < 0) return true;
      if (act === 'down' && this.mouse.wheel > 0) return true;
    }
    const g = this.gpMap[act]; return !!(g && this.pressedKeys[g]);
  },
  // pulsación con auto-repetición para menús
  repeat(act) {
    if (this.pressed(act)) return true;
    const t = this.holdTime[act] || 0;
    return t > 0.32 && Math.floor((t - 0.32) / 0.09) !== Math.floor((t - 0.32 - 1 / 60) / 0.09);
  },
  dir() {
    if (this.down('up')) return 'up';
    if (this.down('down')) return 'down';
    if (this.down('left')) return 'left';
    if (this.down('right')) return 'right';
    return null;
  },
  axis() {
    let x = 0, y = 0;
    if (this.down('left')) x -= 1; if (this.down('right')) x += 1;
    if (this.down('up')) y -= 1; if (this.down('down')) y += 1;
    return [x, y];
  },
  endFrame() {
    for (const act in this.map) this.holdTime[act] = this.down(act) ? (this.holdTime[act] || 0) + 1 / 60 : 0;
    this.pressedKeys = {};
    this.typed = [];
    this.mouse.pressed = {}; this.mouse.released = {}; this.mouse.wheel = 0; this.mouse.moved = false;
    this.mouseCapture = false;
  },
  consume() { this.pressedKeys = {}; this.typed = []; this.mouse.pressed = {}; },
};

// ---------- fuente bitmap (diseño propio, proporcional) ----------
const Font = (() => {
  const G = {};
  const def = (ch, rows) => { const rs = rows.split(','); const w = Math.max(...rs.map((r) => (r === '0' ? 0 : r.length)), 1); G[ch] = rs.map((r) => (r === '0' ? '0'.repeat(w) : r)); };
  // mayúsculas (filas 0-6)
  def('A', '01110,10001,10001,11111,10001,10001,10001'); def('B', '11110,10001,10001,11110,10001,10001,11110');
  def('C', '01110,10001,10000,10000,10000,10001,01110'); def('D', '11110,10001,10001,10001,10001,10001,11110');
  def('E', '11111,10000,10000,11110,10000,10000,11111'); def('F', '11111,10000,10000,11110,10000,10000,10000');
  def('G', '01110,10001,10000,10111,10001,10001,01111'); def('H', '10001,10001,10001,11111,10001,10001,10001');
  def('I', '111,010,010,010,010,010,111'); def('J', '00111,00010,00010,00010,00010,10010,01100');
  def('K', '10001,10010,10100,11000,10100,10010,10001'); def('L', '10000,10000,10000,10000,10000,10000,11111');
  def('M', '10001,11011,10101,10101,10001,10001,10001'); def('N', '10001,11001,10101,10011,10001,10001,10001');
  def('O', '01110,10001,10001,10001,10001,10001,01110'); def('P', '11110,10001,10001,11110,10000,10000,10000');
  def('Q', '01110,10001,10001,10001,10101,10010,01101'); def('R', '11110,10001,10001,11110,10100,10010,10001');
  def('S', '01111,10000,10000,01110,00001,00001,11110'); def('T', '11111,00100,00100,00100,00100,00100,00100');
  def('U', '10001,10001,10001,10001,10001,10001,01110'); def('V', '10001,10001,10001,10001,10001,01010,00100');
  def('W', '10001,10001,10001,10101,10101,10101,01010'); def('X', '10001,10001,01010,00100,01010,10001,10001');
  def('Y', '10001,10001,01010,00100,00100,00100,00100'); def('Z', '11111,00001,00010,00100,01000,10000,11111');
  // minúsculas (filas 0-8, 7-8 = descendentes)
  def('a', '0,0,01110,00001,01111,10001,01111'); def('b', '10000,10000,11110,10001,10001,10001,11110');
  def('c', '0,0,0111,1000,1000,1000,0111'); def('d', '00001,00001,01111,10001,10001,10001,01111');
  def('e', '0,0,01110,10001,11111,10000,01110'); def('f', '0011,0100,1110,0100,0100,0100,0100');
  def('g', '0,0,01111,10001,10001,10001,01111,00001,01110'); def('h', '10000,10000,10110,11001,10001,10001,10001');
  def('i', '1,0,1,1,1,1,1'); def('j', '001,000,001,001,001,001,001,101,010');
  def('k', '1000,1000,1001,1010,1100,1010,1001'); def('l', '10,10,10,10,10,10,01');
  def('m', '0,0,11010,10101,10101,10101,10101'); def('n', '0,0,10110,11001,10001,10001,10001');
  def('o', '0,0,01110,10001,10001,10001,01110'); def('p', '0,0,11110,10001,10001,10001,11110,10000,10000');
  def('q', '0,0,01111,10001,10001,10001,01111,00001,00001'); def('r', '0,0,1011,1100,1000,1000,1000');
  def('s', '0,0,0111,1000,0110,0001,1110'); def('t', '0100,0100,1110,0100,0100,0100,0011');
  def('u', '0,0,10001,10001,10001,10011,01101'); def('v', '0,0,10001,10001,10001,01010,00100');
  def('w', '0,0,10001,10001,10101,10101,01010'); def('x', '0,0,10001,01010,00100,01010,10001');
  def('y', '0,0,10001,10001,10001,10001,01111,00001,01110'); def('z', '0,0,11111,00010,00100,01000,11111');
  // dígitos
  def('0', '01110,10001,10011,10101,11001,10001,01110'); def('1', '010,110,010,010,010,010,111');
  def('2', '01110,10001,00001,00010,00100,01000,11111'); def('3', '11111,00010,00100,00010,00001,10001,01110');
  def('4', '00010,00110,01010,10010,11111,00010,00010'); def('5', '11111,10000,11110,00001,00001,10001,01110');
  def('6', '00110,01000,10000,11110,10001,10001,01110'); def('7', '11111,00001,00010,00100,01000,01000,01000');
  def('8', '01110,10001,10001,01110,10001,10001,01110'); def('9', '01110,10001,10001,01111,00001,00010,01100');
  // signos
  def('.', '0,0,0,0,0,0,1'); def(',', '00,00,00,00,00,00,01,10'); def('!', '1,1,1,1,1,0,1'); def('?', '01110,10001,00001,00010,00100,00000,00100');
  def('¡', '0,0,1,0,1,1,1,1,1'); def('¿', '00000,00000,00100,00000,00100,01000,10000,10001,01110'); def(':', '0,0,1,0,0,0,1');
  def(';', '00,00,01,00,00,00,01,10'); def("'", '1,1,0,0,0,0,0'); def('"', '101,101,0,0,0,0,0');
  def('-', '000,000,000,111,000,000,000'); def('+', '000,000,010,111,010,000,000'); def('/', '001,001,010,010,010,100,100');
  def('(', '01,10,10,10,10,10,01'); def(')', '10,01,01,01,01,01,10'); def('%', '11001,11010,00010,00100,01000,01011,10011');
  def('&', '01100,10010,10100,01000,10101,10010,01101'); def('*', '000,000,101,010,101,000,000'); def('=', '000,000,111,000,111,000,000');
  def('<', '001,010,100,010,001,000,000'); def('>', '100,010,001,010,100,000,000'); def('_', '0000,0000,0000,0000,0000,0000,1111');
  def('#', '01010,11111,01010,01010,11111,01010,00000'); def('×', '000,000,101,010,101,000,000'); def('·', '0,0,0,1,0,0,0');
  def('$', '00100,01111,10100,01110,00101,11110,00100'); def('…', '00000,00000,00000,00000,00000,00000,10101');
  def('♥', '00000,01010,11111,11111,01110,00100,00000'); def('★', '00100,00100,11111,01110,01010,10001,00000');
  def('↑', '010,111,010,010,010,0,0'); def('↓', '010,010,010,111,010,0,0');
  def('←', '00000,00100,01000,11111,01000,00100,00000'); def('→', '00000,00100,00010,11111,00010,00100,00000');
  def('º', '111,101,111,000,111,0,0');
  def('−', '000,000,000,111,000,000,000'); def('▲', '00000,00000,00100,01110,11111,00000,00000'); def('▼', '00000,00000,11111,01110,00100,00000,00000');
  def('✓', '00000,00001,00010,10100,01000,00000,00000'); def('✗', '00000,10001,01010,00100,01010,10001,00000'); def('◆', '000,010,111,010,000,0,0'); def('❄', '1010101,0111110,1101011,0011100,1101011,0111110,1010101'); def('☾', '00110,01100,11000,11000,11000,01100,00110');
  def('☼', '0010100,1001001,0011100,1111111,0011100,1001001,0010100'); def('☂', '0011100,0111110,1111111,0001000,0001000,0101000,0010000');
  def('☁', '0000000,0011000,0111110,1111111,1111111,0000000,0'); def('ϟ', '00010,00100,01000,11110,00100,01000,10000'); def('≈', '00000,01001,10110,00000,01001,10110,00000');
  def('♪', '00110,00101,00100,00100,11100,11100,0'); def('ª', '111,001,111,101,111,0,0'); def('⇄', '00010,11111,00010,01000,11111,01000,0');
  // acentos: filas -2,-1 (mayúsculas) o 0,1 (minúsculas)
  const accentL = ['00010', '00100'];
  const lowAcc = (base, out, acc, skip = 2) => {
    const b = G[base].map((r) => r);
    const w = b[0].length;
    const a = acc.map((r) => r.slice(Math.max(0, Math.floor((5 - w) / 2)), Math.max(0, Math.floor((5 - w) / 2)) + w).padEnd(w, '0'));
    G[out] = [a[0], a[1], ...b.slice(skip)];
  };
  lowAcc('a', 'á', accentL); lowAcc('e', 'é', accentL); lowAcc('o', 'ó', accentL); lowAcc('u', 'ú', accentL);
  G['í'] = ['01', '10', '00', '01', '01', '01', '01'];
  G['ñ'] = ['01101', '10110', '00000', '11110', '10001', '10001', '10001']; lowAcc('u', 'ü', ['01010', '00000']);
  const up = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U' };
  const UPPER_ACC = {};
  for (const k in up) UPPER_ACC[k] = { base: up[k], acc: accentL };
  UPPER_ACC['Ñ'] = { base: 'N', acc: ['01101', '10110'] };
  UPPER_ACC['Ü'] = { base: 'U', acc: ['01010', '00000'] };

  const CELL_H = 11, OFF = 2; // 2 filas por encima de la línea de mayúsculas
  const glyphs = {}; // ch -> {x, w}
  const chars = Object.keys(G).concat(Object.keys(UPPER_ACC));
  const atlasW = chars.length * 7;
  const [atlas, ax] = U.makeCanvas(atlasW, CELL_H);
  ax.fillStyle = '#fff';
  let cx = 0;
  const blit = (rows, rowOff) => {
    let w = 0; for (const r of rows) w = Math.max(w, r.length);
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '1') ax.fillRect(cx + x, y + rowOff, 1, 1); });
    return w;
  };
  for (const ch of Object.keys(G)) {
    const w = blit(G[ch], OFF);
    glyphs[ch] = { x: cx, w }; cx += 7;
  }
  for (const ch in UPPER_ACC) {
    const { base, acc } = UPPER_ACC[ch];
    const bw = G[base][0].length;
    const accRows = acc.map((r) => r.slice(Math.max(0, Math.floor((5 - bw) / 2)), Math.max(0, Math.floor((5 - bw) / 2)) + bw));
    blit(accRows, 0);
    const w = blit(G[base], OFF);
    glyphs[ch] = { x: cx, w }; cx += 7;
  }
  const tinted = {};
  const tint = (color) => {
    if (tinted[color]) return tinted[color];
    const [c, x] = U.makeCanvas(atlasW, CELL_H);
    x.drawImage(atlas, 0, 0); x.globalCompositeOperation = 'source-in';
    x.fillStyle = color; x.fillRect(0, 0, atlasW, CELL_H);
    tinted[color] = c; return c;
  };
  const SPACE = 4;
  const adv = (ch) => (ch === ' ' ? SPACE : glyphs[ch] ? glyphs[ch].w + 1 : SPACE);
  return {
    LINE: 12, CELL_H, OFF,
    width(str) { let w = 0; for (const ch of String(str)) w += adv(ch); return Math.max(0, w - 1); },
    draw(ctx, str, x, y, color = '#282030', shadow = null) {
      str = String(str);
      if (shadow) this.draw(ctx, str, x + 1, y + 1, shadow);
      const img = tint(color);
      let px = Math.round(x); y = Math.round(y) - OFF;
      for (const ch of str) {
        const g = glyphs[ch];
        if (g) ctx.drawImage(img, g.x, 0, g.w, CELL_H, px, y, g.w, CELL_H);
        px += adv(ch);
      }
      return px;
    },
    drawCenter(ctx, str, cx, y, color, shadow) { this.draw(ctx, str, cx - this.width(str) / 2, y, color, shadow); },
    drawRight(ctx, str, rx, y, color, shadow) { this.draw(ctx, str, rx - this.width(str), y, color, shadow); },
    // texto con contorno (para HUD sobre el mundo)
    drawOutlined(ctx, str, x, y, color, outline = '#000') {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) this.draw(ctx, str, x + dx, y + dy, outline);
      this.draw(ctx, str, x, y, color);
    },
    wrap(str, maxW) {
      const out = [];
      for (const para of String(str).split('\n')) {
        let line = '';
        for (const word of para.split(' ')) {
          const test = line ? line + ' ' + word : word;
          if (this.width(test) > maxW && line) { out.push(line); line = word; } else line = test;
        }
        out.push(line);
      }
      return out;
    },
  };
})();

// ---------- escenas y bucle ----------
const Scenes = {
  stack: [],
  push(s) { this.stack.push(s); if (s.enter) s.enter(); return s; },
  pop(s) {
    const i = s ? this.stack.lastIndexOf(s) : this.stack.length - 1;
    if (i < 0) return;
    const [r] = this.stack.splice(i, 1);
    if (r && r.exit) r.exit();
    return r;
  },
  top() { return this.stack[this.stack.length - 1]; },
  has(s) { return this.stack.includes(s); },
  clear() { while (this.stack.length) this.pop(); },
};

const Timers = {
  list: [],
  wait(sec) { return new Promise((res) => this.list.push({ t: sec, res })); },
  frames(n) { return this.wait(n / 60); },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const t = this.list[i]; t.t -= dt;
      if (t.t <= 0) { this.list.splice(i, 1); t.res(); }
    }
  },
};
const wait = (s) => Timers.wait(s);

// fundido de pantalla global
const Fade = {
  a: 0, target: 0, speed: 3, color: '#000', res: null,
  to(target, time = 0.3, color = '#000') {
    if (this.res) { const r = this.res; this.res = null; r(); } // no dejar promesas colgadas
    this.target = target; this.color = color; this.speed = 1 / Math.max(0.01, time);
    return new Promise((r) => { this.res = r; });
  },
  out(t, c) { return this.to(1, t, c); },
  in(t, c) { return this.to(0, t, c); },
  update(dt) {
    if (this.a !== this.target) {
      this.a = U.approach(this.a, this.target, this.speed * dt);
      if (this.a === this.target && this.res) { const r = this.res; this.res = null; r(); }
    } else if (this.res) { const r = this.res; this.res = null; r(); }
  },
  draw(ctx) {
    if (this.a <= 0) return;
    ctx.globalAlpha = this.a; ctx.fillStyle = this.color; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  },
};

// sacudida de pantalla
const Shake = {
  t: 0, mag: 0,
  start(mag, t) { if (mag >= this.mag || this.t <= 0) { this.mag = mag; this.t = t; } },
  update(dt) { this.t = Math.max(0, this.t - dt); if (this.t === 0) this.mag = 0; },
  offset() { return this.t > 0 ? [U.randi(-this.mag, this.mag), U.randi(-this.mag, this.mag)] : [0, 0]; },
};

const Engine = {
  canvas: null, ctx: null, scale: 1, time: 0, frame: 0,
  init() {
    this.canvas = document.getElementById('game');
    this.canvas.width = WIDE; this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    [this.uiBuf, this.uiCtx] = U.makeCanvas(UI_W, H);
    const resize = () => {
      const s = Math.max(1, Math.min(window.innerWidth / WIDE, window.innerHeight / H));
      const sc = s >= 2 ? Math.floor(s) : s;
      this.scale = sc;
      this.canvas.style.width = WIDE * sc + 'px';
      this.canvas.style.height = H * sc + 'px';
    };
    window.addEventListener('resize', resize); resize();
    Input.init();
  },
  start() {
    let last = performance.now(), acc = 0;
    const STEP = 1 / 60;
    // respaldo por si el navegador detiene requestAnimationFrame (pestañas o paneles en segundo plano)
    setInterval(() => { const now = performance.now(); if (now - last > 40) tick(now); }, 16);
    const loop = (now) => { tick(now); requestAnimationFrame(loop); };
    const tick = (now) => {
      if (this.manual) { last = now; return; } // modo de pruebas: el test avanza los fotogramas
      acc += Math.min(0.1, (now - last) / 1000); last = now;
      let steps = 0;
      while (acc >= STEP && steps < 4) {
        Input.pollGamepad();
        this.update(STEP);
        Input.endFrame();
        acc -= STEP; steps++;
      }
      if (steps === 4) acc = 0;
      this.draw();
    };
    requestAnimationFrame(loop);
  },
  update(dt) {
    this.time += dt; this.frame++;
    Timers.update(dt); Fade.update(dt); Shake.update(dt);
    const top = Scenes.top();
    const ui = top && !this.isWide(top), M = Input.mouse;
    if (ui) { W = UI_W; M.x -= UIX; }
    try { if (top && top.update) top.update(dt); }
    catch (e) { console.error(e); }
    finally { if (ui) { W = WIDE; M.x += UIX; } }
  },
  isWide(sc) { return sc === World || !!sc.wide; },
  draw() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const st = Scenes.stack;
    let first = 0;
    for (let i = st.length - 1; i >= 0; i--) if (st[i].opaque) { first = i; break; }
    const [sx, sy] = Shake.offset();
    ctx.setTransform(1, 0, 0, 1, sx, sy);
    for (let i = first; i < st.length; i++) {
      const sc = st[i];
      if (!sc.draw) continue;
      if (this.isWide(sc)) { try { sc.draw(ctx); } catch (e) { console.error(e); } continue; }
      // menú: se dibuja a 320 de ancho, se centra y se prolongan sus bordes a los lados
      const u = this.uiCtx; u.setTransform(1, 0, 0, 1, 0, 0); u.clearRect(0, 0, UI_W, H); u.imageSmoothingEnabled = false;
      W = UI_W;
      try { sc.draw(u); } catch (e) { console.error(e); } finally { W = WIDE; }
      ctx.drawImage(this.uiBuf, 0, 0, 1, H, 0, 0, UIX, H);
      ctx.drawImage(this.uiBuf, UI_W - 1, 0, 1, H, UIX + UI_W, 0, WIDE - UIX - UI_W, H);
      ctx.drawImage(this.uiBuf, UIX, 0);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    Fade.draw(ctx);
  },
};
