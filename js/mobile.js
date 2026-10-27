'use strict';
// ============================================================
//  MÓVIL, TABLET Y MANDOS
//  - Controles táctiles: joystick flotante a la izquierda y botones a
//    la derecha que cambian según dónde estás (mundo, combate,
//    captura, lanzar esferas, menús). Tocar la pantalla del juego
//    funciona como un clic (en combate: atacar hacia ese punto;
//    mantener = cargar).
//  - Pantalla: aprovecha todo el espacio, respeta la muesca, pone los
//    controles en los márgenes o en la franja inferior (tablets) y
//    pide girar el móvil si está en vertical.
//  - Calidad 3D automática (alta / media / baja) que baja sola si el
//    aparato no llega; pausa y autoguardado al cambiar de app.
//  - Mandos (Xbox, PlayStation, Backbone, Switch Pro…): dos sticks,
//    gatillos y botones con una distribución pensada para el combate.
//  - Vibración opcional al recibir golpes y al capturar.
// ============================================================
for (const k of ['quality', 'touch', 'vibrate']) if (Options[k] === undefined) Options[k] = { quality: 'auto', touch: 'auto', vibrate: true }[k];
{
  const _save = Options.save;
  Options.save = function () {
    _save.call(this);
    try { const o = JSON.parse(localStorage.getItem(OPT_KEY) || '{}'); o.quality = this.quality; o.touch = this.touch; o.vibrate = this.vibrate; localStorage.setItem(OPT_KEY, JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ }
  };
  try { const o = JSON.parse(localStorage.getItem(OPT_KEY) || '{}'); for (const k of ['quality', 'touch', 'vibrate']) if (o[k] !== undefined) Options[k] = o[k]; } catch (e) { /* sin almacenamiento */ }
}

// ---------- origen de la última entrada: teclado, ratón, mando o tacto ----------
Input.mode = 'kb';
Input.setMode = function (m) {
  if (this.mode === m) return;
  const relayout = m === 'pad' || this.mode === 'pad';
  this.mode = m; Mobile.dirty = true;
  if (relayout && Mobile.cv) { Mobile.releaseAll(); Mobile.layoutScreen(); }
};
window.addEventListener('gamepadconnected', () => Input.setMode('pad'));
window.addEventListener('keydown', () => Input.setMode('kb'), true);
window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') Input.setMode('mouse'); }, true);
window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') Input.setMode('mouse'); }, true);

const Mobile = {
  active: false, paused: false, portrait: false, dirty: true,
  touches: new Map(), btnHeld: new Map(), joy: null, aimT: 0,
  isPhone() { return Math.min(window.innerWidth, window.innerHeight) < 600; },
  isTouchDevice() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; },
  // con un mando en uso, los controles táctiles se ocultan (y el juego vuelve a centrarse)
  wanted() { if (Options.touch === 'off' || Input.mode === 'pad') return false; return Options.touch === 'on' || this.active; },
  vib(p) { if (Options.vibrate && navigator.vibrate && Input.mode === 'touch') try { navigator.vibrate(p); } catch (e) { /* no disponible */ } },
  // ---------- capa de dibujo ----------
  init() {
    const cv = document.createElement('canvas');
    cv.id = 'touchui';
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:5';
    document.body.appendChild(cv);
    this.cv = cv; this.ctx = cv.getContext('2d');
    // márgenes seguros (muesca, barras del sistema)
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;inset:0;pointer-events:none;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(probe); this.probe = probe;
    const opt = { passive: false, capture: true };
    window.addEventListener('touchstart', (e) => this.onTouch(e, 'start'), opt);
    window.addEventListener('touchmove', (e) => this.onTouch(e, 'move'), opt);
    window.addEventListener('touchend', (e) => this.onTouch(e, 'end'), opt);
    window.addEventListener('touchcancel', (e) => this.onTouch(e, 'end'), opt);
    window.addEventListener('resize', () => this.layoutScreen());
    window.addEventListener('orientationchange', () => setTimeout(() => this.layoutScreen(), 200));
    document.addEventListener('visibilitychange', () => this.onVisibility());
    this.layoutScreen();
  },
  insets() {
    const s = getComputedStyle(this.probe), n = (v) => parseFloat(v) || 0;
    return { t: n(s.paddingTop), r: n(s.paddingRight), b: n(s.paddingBottom), l: n(s.paddingLeft) };
  },
  // ---------- colocación del lienzo del juego ----------
  layoutScreen() {
    const g = Engine.canvas; if (!g) return;
    const vw = window.innerWidth, vh = window.innerHeight, ins = this.insets();
    this.portrait = this.active && this.isPhone() && vh > vw;
    const aw = vw - ins.l - ins.r, ah = vh - ins.t - ins.b;
    if (!this.wanted()) {
      g.style.position = ''; g.style.left = ''; g.style.top = '';
      document.body.style.display = '';
    } else {
      let s = Math.min(aw / WIDE, ah / H);
      // pantallas altas (tablets, móvil en vertical): el juego arriba y los controles debajo
      const band = ah - H * s > ah * 0.22;
      const gw = WIDE * s, gh = H * s;
      g.style.position = 'absolute'; g.style.width = gw + 'px'; g.style.height = gh + 'px';
      g.style.left = Math.round(ins.l + (aw - gw) / 2) + 'px';
      g.style.top = Math.round(band ? ins.t : ins.t + (ah - gh) / 2) + 'px';
      this.band = band;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.round(vw * dpr); this.cv.height = Math.round(vh * dpr); this.dpr = dpr;
    this.vw = vw; this.vh = vh; this.ins = ins; this.u = Math.max(46, Math.min(96, Math.min(vw, vh) * 0.15));
    this.dirty = true;
  },
  // ---------- botones según el contexto ----------
  context() {
    const top = Scenes.top();
    if (!top) return 'menu';
    if (top === World) return World.busy ? 'menu' : 'world';
    if (top instanceof BattleScene) return top.state !== 'fight' || top.showTut ? 'menu' : top.capture ? 'capture' : 'battle';
    if (typeof FieldThrow !== 'undefined' && top instanceof FieldThrow) return 'throw';
    if (top instanceof TitleScreen) return 'title';
    return 'menu';
  },
  buttons(ctxName) {
    const u = this.u, ax = this.vw - this.ins.r - u * 1.45, ay = this.vh - this.ins.b - u * 1.45, gr = this.gameRect(), mr = this.vw - this.ins.r - gr.right;
    const B = (id, label, keys, x, y, r, opt = {}) => Object.assign({ id, label, keys, x, y, r }, opt);
    // botones pequeños: en columna dentro del margen derecho si cabe; si no, en la esquina superior
    const corner = (id, label, keys, k) => (this.band
      ? B(id, label, keys, this.vw - this.ins.r - u * (0.6 + k * 1.05), gr.bottom + u * 0.75, u * 0.42, { small: true })
      : mr >= u * 0.95
      ? B(id, label, keys, gr.right + mr / 2, this.ins.t + u * (0.62 + k * 1.0), Math.min(u * 0.42, mr / 2 - 4), { small: true })
      : B(id, label, keys, this.vw - this.ins.r - u * (0.6 + k * 1.05), this.ins.t + u * 1.05, u * 0.42, { small: true }));
    if (ctxName === 'world') return [
      B('a', 'A', ['KeyZ'], ax, ay, u * 0.62, { col: '#58c060' }),
      B('b', 'B', ['KeyX', 'ShiftLeft'], ax - u * 1.45, ay + u * 0.45, u * 0.5, { col: '#e06060', hint: 'correr' }),
      B('ball', 'Esfera', ['KeyE'], ax - u * 0.25, ay - u * 1.4, u * 0.46, { col: '#f0c040' }),
      corner('menu', 'Menú', ['Enter'], 0), corner('map', 'Mapa', ['KeyM'], 1),
    ];
    // en combate, los botones quedan por encima de la barra de ataques (que se toca directamente)
    const by = this.band ? ay : Math.min(ay, gr.top + (202 / H) * gr.height - u * 0.72);
    if (ctxName === 'battle') return [
      B('dodge', 'Esquivar', ['Space'], ax, by, u * 0.62, { col: '#60c0f0' }),
      B('tactic', 'Táctico', ['ShiftLeft'], ax - u * 1.5, by + u * 0.05, u * 0.48, { col: '#c080ff' }),
      B('ult', 'Arte', ['KeyF'], ax - u * 1.1, by - u * 1.2, u * 0.44, { col: '#ffb040' }),
      B('duo', 'Dúo', ['KeyG'], ax + u * 0.12, by - u * 1.5, u * 0.42, { col: '#80d0ff' }),
      B('cap', 'Captura', ['KeyE'], ax - u * 2.45, by - u * 0.85, u * 0.4, { col: '#f0c040', show: () => Battle.active && Battle.active.wild }),
      corner('pause', 'Pausa', ['Enter'], 0), corner('swap', 'Cambiar', ['KeyQ'], 1),
    ].filter((b) => !b.show || b.show());
    if (ctxName === 'capture') return [B('back', 'Volver', ['KeyE'], ax, ay, u * 0.56, { col: '#f0c040' }), B('cyc', 'Esfera', ['KeyR'], ax - u * 1.35, ay + u * 0.3, u * 0.44, { col: '#c0c0d0' }), corner('pause', 'Pausa', ['Enter'], 0)];
    if (ctxName === 'throw') return [B('back', 'Salir', ['KeyX'], ax, ay, u * 0.54, { col: '#e06060' }), B('cyc', 'Cambiar', ['KeyR'], ax - u * 1.35, ay + u * 0.3, u * 0.44, { col: '#c0c0d0' })];
    if (ctxName === 'title') return [];
    // menús: un B pequeño, en el margen derecho si cabe (para no tapar las opciones)
    if (this.band) return [B('b', 'B', ['KeyX'], ax, ay, u * 0.5, { col: '#e06060', faint: true })];
    if (mr >= u * 0.95) return [B('b', 'B', ['KeyX'], gr.right + mr / 2, this.vh - this.ins.b - u * 0.7, Math.min(u * 0.42, mr / 2 - 4), { col: '#e06060', faint: true })];
    return [B('b', 'B', ['KeyX'], this.ins.l + u * 0.6, this.vh - this.ins.b - u * 0.6, u * 0.4, { col: '#e06060', faint: true })];
  },
  usesJoy(c) { return c === 'world' || c === 'battle' || c === 'capture'; },
  // ---------- toques ----------
  gameRect() { return Engine.canvas.getBoundingClientRect(); },
  toGame(cx, cy) { const r = this.gameRect(); return [((cx - r.left) * WIDE) / r.width, ((cy - r.top) * H) / r.height, cx >= r.left && cy >= r.top && cx < r.right && cy < r.bottom]; },
  onTouch(e, phase) {
    if (e.target && e.target.closest && e.target.closest('a,input,button,textarea')) return;
    e.preventDefault();
    Input.setMode('touch');
    if (!this.active) { this.active = true; this.layoutScreen(); this.firstTouch(); }
    Sound.unlock();
    if (this.portrait) return;
    const ctxName = this.context(), btns = this.buttons(ctxName);
    for (const t of e.changedTouches) {
      const id = t.identifier, x = t.clientX, y = t.clientY;
      if (phase === 'start') {
        const b = btns.find((q) => Math.hypot(x - q.x, y - q.y) < q.r * 1.25);
        if (b) { this.press(b); this.touches.set(id, { kind: 'btn', b }); continue; }
        const [gx, gy, inside] = this.toGame(x, y);
        const onBar = (ctxName === 'battle') && inside && gy >= 202;
        if (this.usesJoy(ctxName) && !onBar && x < this.vw * 0.42 && !this.joy) {
          this.joy = { id, ox: x, oy: y, x, y };
          this.touches.set(id, { kind: 'joy' }); continue;
        }
        if (!inside) { this.touches.set(id, { kind: 'none' }); continue; }
        this.touches.set(id, { kind: 'game', sx: x, sy: y, drag: 0, ctxName });
        this.mouseAt(gx, gy);
        const M = Input.mouse;
        if (ctxName === 'battle' || ctxName === 'capture') { M.down[0] = true; M.pressed[0] = true; this.aimT = 1e9; }
        else if (ctxName === 'throw') { this.aimT = 1e9; }
        // en menús: el toque selecciona; se confirma al levantar el dedo (si no se arrastró)
      } else {
        const T = this.touches.get(id); if (!T) continue;
        if (T.kind === 'joy' && this.joy && this.joy.id === id) { if (phase === 'move') { this.joy.x = x; this.joy.y = y; } else { this.joy = null; } }
        else if (T.kind === 'btn') { if (phase === 'end') this.release(T.b); }
        else if (T.kind === 'game') {
          const [gx, gy] = this.toGame(x, y), M = Input.mouse;
          if (phase === 'move') {
            const dy = y - T.sy; T.drag = Math.max(T.drag, Math.hypot(x - T.sx, dy));
            if (T.ctxName === 'menu' || T.ctxName === 'title') {
              // arrastrar en vertical desplaza las listas
              const step = Math.max(12, this.u * 0.35), n = Math.trunc(dy / step);
              if (n) { M.wheel -= n; T.sy += n * step; M.last = performance.now(); }
            } else this.mouseAt(gx, gy);
          } else {
            if (T.ctxName === 'battle' || T.ctxName === 'capture') { if (M.down[0]) M.released[0] = true; M.down[0] = false; this.aimT = 0.3; }
            else if (T.ctxName === 'throw') { this.mouseAt(gx, gy); M.pressed[0] = true; this.aimT = 0.3; }
            else if (T.drag < 14) { this.mouseAt(gx, gy); M.pressed[0] = true; }
          }
        }
        if (phase === 'end') this.touches.delete(id);
      }
    }
    this.dirty = true;
  },
  mouseAt(gx, gy) { const M = Input.mouse; M.x = gx; M.y = gy; M.inside = true; M.moved = true; M.last = performance.now(); },
  press(b) {
    for (const k of b.keys) { if (!Input.held[k]) Input.pressedKeys[k] = true; Input.held[k] = true; }
    this.btnHeld.set(b.id, b); this.vib(8);
  },
  release(b) { for (const k of b.keys) Input.held[k] = false; this.btnHeld.delete(b.id); },
  releaseAll() {
    for (const b of this.btnHeld.values()) this.release(b);
    this.joy = null; for (const k of ['T_up', 'T_down', 'T_left', 'T_right']) Input.held[k] = false;
    const M = Input.mouse; if (M.down[0]) { M.down[0] = false; M.released[0] = true; }
    this.touches.clear();
  },
  firstTouch() {
    // en móviles: pantalla completa y horizontal (si el sistema lo permite)
    if (!this.isPhone() || window.matchMedia('(display-mode: standalone)').matches || document.fullscreenElement) return;
    try { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen({ navigationUI: 'hide' }); if (p && p.then) p.then(() => { try { const q = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (q && q.catch) q.catch(() => {}); } catch (e) { /* no disponible */ } }).catch(() => {}); } catch (e) { /* no disponible */ }
  },
  // joystick -> direcciones
  update() {
    const c = this.context();
    if (!this.usesJoy(c) && this.joy) this.joy = null;
    // los botones que ya no están en pantalla se sueltan
    for (const [id, b] of this.btnHeld) if (!this.buttons(c).some((q) => q.id === id)) this.release(b);
    const J = this.joy; let ux = 0, uy = 0;
    if (J) {
      const R = this.u * 0.85; let dx = J.x - J.ox, dy = J.y - J.oy; const l = Math.hypot(dx, dy);
      if (l > R) { J.ox += (dx / l) * (l - R); J.oy += (dy / l) * (l - R); dx = J.x - J.ox; dy = J.y - J.oy; } // la base sigue al dedo
      ux = dx / R; uy = dy / R;
    }
    let up = false, down = false, left = false, right = false;
    if (Math.hypot(ux, uy) > 0.28) {
      if (c === 'world') { if (Math.abs(ux) > Math.abs(uy)) { left = ux < 0; right = ux > 0; } else { up = uy < 0; down = uy > 0; } }
      else { left = ux < -0.38; right = ux > 0.38; up = uy < -0.38; down = uy > 0.38; }
    }
    const set = (k, on) => { if (on && !Input.held[k]) Input.pressedKeys[k] = true; Input.held[k] = on; };
    set('T_up', up); set('T_down', down); set('T_left', left); set('T_right', right);
    this.aimT = Math.max(0, this.aimT - 1 / 60);
  },
  // ---------- dibujo de los controles ----------
  label(text, col = '#ffffff') {
    this.lbl = this.lbl || {};
    const k = text + col; if (this.lbl[k]) return this.lbl[k];
    const w = Font.width(text) + 2, [c, x] = U.makeCanvas(w, 12);
    Font.draw(x, text, 1, 1, '#000000'); Font.draw(x, text, 0, 0, col);
    return (this.lbl[k] = c);
  },
  draw() {
    const x = this.ctx, d = this.dpr;
    const show = this.wanted();
    if (!show) { if (this.drawn) { x.clearRect(0, 0, this.cv.width, this.cv.height); this.drawn = false; } return; }
    this.drawn = true;
    this.u = Math.max(46, Math.min(96, Math.min(this.vw, this.vh) * 0.15));
    x.setTransform(d, 0, 0, d, 0, 0);
    x.clearRect(0, 0, this.vw, this.vh);
    x.imageSmoothingEnabled = false;
    if (this.portrait) {
      x.fillStyle = '#0d0b14'; x.fillRect(0, 0, this.vw, this.vh);
      const t = performance.now() / 1000, cx = this.vw / 2, cy = this.vh / 2 - 30;
      x.save(); x.translate(cx, cy); x.rotate(-Math.min(1, (t % 2.4) / 1.2) * Math.PI / 2);
      x.strokeStyle = '#ffd048'; x.lineWidth = 4; x.strokeRect(-22, -38, 44, 76); x.fillStyle = '#ffd048'; x.fillRect(-6, 30, 12, 3);
      x.restore();
      const L = this.label('Gira el dispositivo para jugar', '#ffffff'), s = Math.max(2, Math.floor(this.vw / 200));
      x.drawImage(L, cx - (L.width * s) / 2, cy + 70, L.width * s, L.height * s);
      return;
    }
    if (Input.mode === 'pad' || (Input.mode !== 'touch' && Options.touch !== 'on')) return;
    const c = this.context(), alpha = 0.55;
    // joystick
    if (this.usesJoy(c)) {
      const J = this.joy, bx = J ? J.ox : this.ins.l + this.u * 1.5, by = J ? J.oy : this.vh - this.ins.b - this.u * 1.5, R = this.u * 0.85;
      x.globalAlpha = J ? 0.5 : 0.28;
      x.fillStyle = '#0c0818'; x.beginPath(); x.arc(bx, by, R, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#ffffff'; x.lineWidth = 2; x.beginPath(); x.arc(bx, by, R, 0, Math.PI * 2); x.stroke();
      const kx = J ? J.x : bx, ky = J ? J.y : by;
      x.globalAlpha = J ? 0.85 : 0.45; x.fillStyle = '#e8e0ff'; x.beginPath(); x.arc(kx, ky, R * 0.42, 0, Math.PI * 2); x.fill();
      x.globalAlpha = 1;
    }
    for (const b of this.buttons(c)) {
      const held = this.btnHeld.has(b.id);
      x.globalAlpha = (b.faint ? 0.35 : alpha) + (held ? 0.3 : 0);
      x.fillStyle = '#0c0818'; x.beginPath(); x.arc(b.x, b.y, b.r, 0, Math.PI * 2); x.fill();
      x.strokeStyle = b.col || '#ffffff'; x.lineWidth = held ? 4 : 2.5; x.beginPath(); x.arc(b.x, b.y, b.r - 1, 0, Math.PI * 2); x.stroke();
      if (held) { x.globalAlpha = 0.3; x.fillStyle = b.col || '#ffffff'; x.beginPath(); x.arc(b.x, b.y, b.r, 0, Math.PI * 2); x.fill(); }
      x.globalAlpha = 0.95;
      const L = this.label(b.label), s = Math.max(1, Math.min(3, (b.r * 1.55) / Math.max(L.width, 14)));
      x.drawImage(L, Math.round(b.x - (L.width * s) / 2), Math.round(b.y - (L.height * s) / 2 + s), L.width * s, L.height * s);
      x.globalAlpha = 1;
    }
  },
  // ---------- pausa al cambiar de app ----------
  onVisibility() {
    if (document.hidden) {
      this.releaseAll(); this.paused = true;
      try { if (Sound.ctx && Sound.ctx.state === 'running') Sound.ctx.suspend(); } catch (e) { /* sin audio */ }
      try {
        if (G && Scenes.top() === World && !World.busy) Game.autosave();
        const B = Battle.active;
        if (B && B.state === 'fight' && Scenes.top() === B && B.pauseMenu) B.pauseMenu();
      } catch (e) { /* nada que guardar */ }
    } else {
      this.paused = false;
      try { if (Sound.ctx && Sound.ctx.state === 'suspended') Sound.ctx.resume(); } catch (e) { /* sin audio */ }
    }
  },
};

// direcciones del joystick táctil
for (const [act, k] of [['up', 'T_up'], ['down', 'T_down'], ['left', 'T_left'], ['right', 'T_right']]) Input.map[act].push(k);

// el ratón "apunta" con el dedo solo mientras se toca (o justo después)
{
  const _um = Input.usingMouse.bind(Input);
  Input.usingMouse = function () {
    if (this.mode === 'touch') return Mobile.aimT > 0 || Mobile.context() === 'menu' || Mobile.context() === 'title';
    if (this.mode === 'pad') return false;
    return _um();
  };
}

// ---------- integración con el motor ----------
{
  const _upd = Engine.update;
  Engine.update = function (dt) {
    if (Mobile.paused || Mobile.portrait) return;
    if (Mobile.cv) Mobile.update();
    return _upd.call(this, dt);
  };
  const _draw = Engine.draw;
  Engine.draw = function () {
    _draw.call(this);
    if (Mobile.cv) Mobile.draw();
    Mobile.frameStat();
  };
  const _init = Engine.init;
  Engine.init = function () { _init.call(this); Mobile.init(); };
}

// ---------- mandos ----------
// Distribución (botones "estándar" del navegador; vale para Xbox, PlayStation,
// Backbone, Switch Pro y la mayoría de mandos bluetooth):
//  Mundo:   stick/cruceta mover · A hablar · B volver (mantener: correr) · Y lanzar esfera
//           LB sigilo · Select mapa · Start menú
//  Combate: stick izq. mover · stick der. apuntar · A/RT ataque armado (mantener: cargar)
//           B esquivar · X selector táctico · Y Arte · L3 Dúo · LB/RB elegir ataque
//           LT captura · Select cambiar ánima · R3 mov. asistido · Start pausa
Object.assign(Input.gpMap, {
  up: 'GP_up', down: 'GP_down', left: 'GP_left', right: 'GP_right', a: 'GP_a', b: 'GP_b', start: 'GP_start',
  run: 'GP_b', main: ['GP_a', 'GP_rt'], dodge: 'GP_b', tactic: 'GP_x', ult: 'GP_y', duo: 'GP_l3', ball: ['GP_y', 'GP_lt'],
  swap: 'GP_select', map: 'GP_select', sneak: 'GP_lb', cycle: 'GP_rb', assist: 'GP_r3',
  m1: undefined, m2: undefined, m3: undefined, m4: undefined,
});
Input.down = function (act) {
  for (const k of this.map[act] || []) if (this.held[k]) return true;
  const g = this.gpMap[act]; if (!g) return false;
  return Array.isArray(g) ? g.some((q) => this.held[q]) : !!this.held[g];
};
Input.pressed = function (act) {
  for (const k of this.map[act] || []) if (this.pressedKeys[k]) return true;
  if (!this.mouseCapture) {
    if (act === 'a' && this.mouse.pressed[0]) return true;
    if (act === 'b' && this.mouse.pressed[2]) return true;
    if (act === 'up' && this.mouse.wheel < 0) return true;
    if (act === 'down' && this.mouse.wheel > 0) return true;
  }
  const g = this.gpMap[act]; if (!g) return false;
  return Array.isArray(g) ? g.some((q) => this.pressedKeys[q]) : !!this.pressedKeys[g];
};
Input.padAim = null;
Input.pollGamepad = function () {
  const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
  // el mando que se esté usando (el último con actividad)
  let p = pads.find((q) => q.index === this.padIdx);
  for (const q of pads) if (q.buttons.some((b) => b.pressed) || q.axes.some((a) => Math.abs(a) > 0.5)) { p = q; this.padIdx = q.index; break; }
  if (!p) return;
  const set = (code, on) => { if (on && !this.held[code]) { this.pressedKeys[code] = true; this.setMode('pad'); } this.held[code] = on; };
  const dz = (v) => (Math.abs(v) < 0.22 ? 0 : v);
  const ax = dz(p.axes[0] || 0), ay = dz(p.axes[1] || 0), rx = dz(p.axes[2] || 0), ry = dz(p.axes[3] || 0);
  const b = (i) => !!(p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5));
  if (Math.abs(ax) + Math.abs(ay) + Math.abs(rx) + Math.abs(ry) > 0.6) this.setMode('pad');
  set('GP_up', ay < -0.5 || b(12)); set('GP_down', ay > 0.5 || b(13));
  set('GP_left', ax < -0.5 || b(14)); set('GP_right', ax > 0.5 || b(15));
  const B = Battle.active, fight = B && B.state === 'fight' && Scenes.top() === B, capture = fight && B.capture;
  set('GP_a', b(0)); set('GP_b', b(1)); set('GP_x', b(2)); set('GP_y', b(3));
  set('GP_select', b(8)); set('GP_start', b(9)); set('GP_l3', b(10)); set('GP_r3', b(11));
  set('GP_lt', b(6)); set('GP_rt', b(7)); set('GP_lb', b(4)); set('GP_rb', b(5));
  // en combate, LB/RB cambian el ataque armado (como la rueda del ratón)
  if (fight && !capture) {
    if (this.pressedKeys.GP_lb) this.mouse.wheel -= 1;
    if (this.pressedKeys.GP_rb) { this.mouse.wheel += 1; delete this.pressedKeys.GP_rb; }
  }
  // en modo captura: A mantiene la puntería (como Z)
  if (capture) { if (b(0)) { if (!this.held.KeyZ) this.pressedKeys.KeyZ = true; this.held.KeyZ = true; this.padZ = true; } else if (this.padZ) { this.held.KeyZ = false; this.padZ = false; } }
  else if (this.padZ) { this.held.KeyZ = false; this.padZ = false; }
  this.padAim = Math.hypot(rx, ry) > 0.45 ? Math.atan2(ry, rx) : null;
};
// stick derecho: apuntar en combate
{
  const BP = BattleScene.prototype, _hai = BP.handleAttackInput;
  BP.handleAttackInput = function (f, dt) {
    if (Input.padAim !== null && f === this.ally) { f.ang = Input.padAim; f.aimAng = Input.padAim; }
    return _hai.call(this, f, dt);
  };
  // vibración al recibir golpes
  const _hit = BP.hit;
  BP.hit = function (tgt, att, m, mult, ang) {
    const h0 = tgt && tgt.hp, r = _hit.call(this, tgt, att, m, mult, ang);
    if (tgt && tgt.side === 'ally' && tgt.hp < h0) Mobile.vib(tgt.hp <= 0 ? [40, 30, 60] : 22);
    if (tgt && tgt.side === 'ally' && tgt.hp < h0 && Input.mode === 'pad') Mobile.rumble(tgt.hp <= 0 ? 0.8 : 0.35, 120);
    return r;
  };
}
Mobile.rumble = function (power, ms) {
  if (!Options.vibrate) return;
  try {
    const p = navigator.getGamepads && navigator.getGamepads()[Input.padIdx];
    const a = p && p.vibrationActuator;
    if (a && a.playEffect) a.playEffect('dual-rumble', { duration: ms, strongMagnitude: power, weakMagnitude: power * 0.6 }).catch(() => {});
  } catch (e) { /* sin vibración */ }
};
{
  const _jingle = Sound.jingle.bind(Sound);
  Sound.jingle = function (name) { if (name === 'catch') { Mobile.vib([30, 40, 30, 40, 80]); Mobile.rumble(0.5, 300); } return _jingle(name); };
}

// ---------- calidad 3D ----------
Mobile.autoQ = (() => {
  const mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
  if ((mem <= 3 || cores <= 4) && Mobile.isTouchDevice()) return 'baja';
  if (Mobile.isTouchDevice() && Mobile.isPhone()) return 'media';
  return 'alta';
})();
Mobile.quality = function () { return Options.quality === 'auto' ? this.autoQ : Options.quality; };
// si los fotogramas tardan demasiado durante unos segundos, baja la calidad automática
Mobile.frameStat = function () {
  const now = performance.now(), dt = now - (this.lastF || now); this.lastF = now;
  if (Engine.manual || document.hidden || dt > 200 || !(typeof World3D !== 'undefined' && World3D.used)) { this.slowT = 0; return; }
  this.ema = this.ema ? this.ema * 0.95 + dt * 0.05 : dt;
  this.slowT = this.ema > 27 ? (this.slowT || 0) + dt : 0;
  if (this.slowT > 4000 && Options.quality === 'auto' && this.autoQ !== 'baja') { this.autoQ = this.autoQ === 'alta' ? 'media' : 'baja'; this.slowT = 0; this.ema = 0; }
};
if (typeof World3D !== 'undefined') {
  const Q = { alta: { dpr: 1.5, max: 1700, shadow: 2048, dof: 1 }, media: { dpr: 1, max: 1000, shadow: 1024, dof: 1 }, baja: { dpr: 0.85, max: 680, shadow: 512, dof: 0 } };
  World3D.fitCanvas = function () {
    const q = Q[Mobile.quality()] || Q.alta;
    const r = Engine.canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, q.dpr);
    const w = Math.max(426, Math.min(q.max, Math.round(r.width * dpr))), h = Math.round(w * H / WIDE);
    const st = this.cv.style;
    st.left = r.left + 'px'; st.top = r.top + 'px'; st.width = r.width + 'px'; st.height = r.height + 'px'; st.display = 'block';
    if (this.cv.width !== w || this.cv.height !== h) { this.r.setSize(w, h, false); this.rt.setSize(w, h); this.post.uniforms.res.value.set(w, h); }
    this.dofBase = q.dof;
    if (this.sun && this.sun.shadow.mapSize.x !== q.shadow) { this.sun.shadow.mapSize.set(q.shadow, q.shadow); if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; } }
    if (this.post.uniforms.dof.value === 1 || this.post.uniforms.dof.value === 0) this.post.uniforms.dof.value = q.dof;
  };
}

// ---------- pistas de controles según el mando que uses ----------
{
  const _bar = BattleScene.prototype.drawMoveBar;
  BattleScene.prototype.drawMoveBar = function (ctx) {
    const keys = MOVE_KEYS.slice();
    if (Input.mode === 'pad' || Input.mode === 'touch') MOVE_KEYS.fill('');
    try { _bar.call(this, ctx); } finally { for (let i = 0; i < 4; i++) MOVE_KEYS[i] = keys[i]; }
    if (Input.mode === 'pad' || Input.mode === 'touch') {
      P(ctx, 0, 228, 332, 12, '#0e0a18');
      Font.draw(ctx, Input.mode === 'pad' ? 'A: atacar · B: esquivar · X: táctico · Y: arte · LB/RB: elegir' : 'Toca el campo: atacar · Mantén: cargar · Toca un ataque: usarlo', 6, 230, '#6a6288');
    }
  };
  const _tut = BattleScene.prototype.drawTutorial;
  BattleScene.prototype.drawTutorial = function (ctx) {
    if (Input.mode !== 'pad' && Input.mode !== 'touch') return _tut.call(this, ctx);
    UI.box(ctx, 20, 30, 280, 180);
    Font.drawCenter(ctx, 'COMBATE EN TIEMPO REAL', 160, 38, '#2a2236');
    const lines = Input.mode === 'pad' ? [
      ['Stick izquierdo', 'Mover a tu ánima'], ['Stick derecho', 'Apuntar'], ['A / RT', 'Ataque armado (mantén = cargar)'], ['LB / RB', 'Elegir el ataque armado'],
      ['X (mantener)', 'Selector táctico (cámara lenta)'], ['B', 'Esquivar (invulnerable)'], ['LT', 'Modo captura'], ['Y · L3', 'Arte Ánima · Dúo'], ['Select · Start', 'Cambiar ánima · Pausa'],
    ] : [
      ['Joystick (izquierda)', 'Mover a tu ánima'], ['Tocar el campo', 'Atacar hacia ese punto'], ['Mantener el dedo', 'Cargar el ataque'], ['Tocar un ataque', 'Usar ese ataque'],
      ['Táctico (mantener)', 'Elegir ataque a cámara lenta'], ['Esquivar', 'Invulnerable un instante'], ['Captura', 'Lanzar esferas'], ['Arte · Dúo', 'Ataques especiales'], ['Pausa · Cambiar', 'Mochila, huir, cambiar'],
    ];
    lines.forEach(([k, d], i) => { Font.draw(ctx, k, 28, 52 + i * 13, '#c04830'); Font.draw(ctx, d, 128, 52 + i * 13, '#2a2236'); });
    Font.drawCenter(ctx, 'Los ataques enemigos se marcan en ROJO: ¡esquívalos!', 160, 172, '#5a5068');
    if (Math.floor(this.t * 2) % 2) Font.drawCenter(ctx, Input.mode === 'pad' ? 'Pulsa A para empezar' : 'Toca para empezar', 160, 194, '#2a8a40');
  };
}

// ---------- opciones (lista nueva con calidad, controles táctiles y vibración) ----------
{
  const OS = OptionsScreen.prototype;
  const ROWS = () => [
    { n: 'Velocidad del texto', v: () => ['Lenta', 'Normal', 'Rápida'][Options.textSpeed], ch: (d) => { Options.textSpeed = U.clamp(Options.textSpeed + d, 0, 2); } },
    { n: 'Música', bar: () => Options.music, ch: (d) => { Options.music = U.clamp(Math.round((Options.music + d * 0.1) * 10) / 10, 0, 1); } },
    { n: 'Efectos', bar: () => Options.sfx, ch: (d) => { Options.sfx = U.clamp(Math.round((Options.sfx + d * 0.1) * 10) / 10, 0, 1); } },
    { n: 'Duración del día', v: () => (Options.dayLen === 0 ? 'Reloj real' : Options.dayLen + ' min'), ch: (d) => { const L = [15, 24, 48, 0]; Options.dayLen = L[(L.indexOf(Options.dayLen) + d + L.length) % L.length]; } },
    { n: 'Pantalla completa', v: () => (document.fullscreenElement ? 'Sí' : 'No'), ch: function () { this.toggleFull(); } },
    { n: 'Autoguardado', v: () => (Options.autosave ? 'Sí' : 'No'), ch: () => { Options.autosave = !Options.autosave; } },
    { n: 'Mov. asistido', v: () => (Options.assist ? 'Sí' : 'No'), ch: () => { Options.assist = !Options.assist; } },
    { n: 'Gráficos', v: () => (Options.gfx3d === false ? 'Clásico' : '3D'), ch: () => { Options.gfx3d = Options.gfx3d === false; if (Options.gfx3d && typeof World3D !== 'undefined' && !World3D.init()) Options.gfx3d = false; } },
    { n: 'Calidad 3D', v: () => ({ auto: 'Auto (' + Mobile.quality() + ')', alta: 'Alta', media: 'Media', baja: 'Baja' })[Options.quality], ch: (d) => { const L = ['auto', 'alta', 'media', 'baja']; Options.quality = L[(L.indexOf(Options.quality) + d + 4) % 4]; } },
    { n: 'Controles táctiles', v: () => ({ auto: 'Auto', on: 'Siempre', off: 'No' })[Options.touch], ch: (d) => { const L = ['auto', 'on', 'off']; Options.touch = L[(L.indexOf(Options.touch) + d + 3) % 3]; Mobile.layoutScreen(); } },
    { n: 'Vibración', v: () => (Options.vibrate ? 'Sí' : 'No'), ch: () => { Options.vibrate = !Options.vibrate; } },
    { n: 'Volver', back: true },
  ];
  const Y0 = 40, STEP = 15;
  OS.rows = function () { return ROWS().length; };
  OS.update = function (dt) {
    this.t += dt;
    const R = ROWS(), n = R.length, M = Input.mouse;
    if (Input.repeat('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('blip'); }
    if (Input.repeat('down')) { this.i = (this.i + 1) % n; Sound.sfx('blip'); }
    // ratón / tacto: pasar por encima selecciona; clic a la izquierda o derecha del valor cambia
    let d = Input.repeat('left') ? -1 : Input.repeat('right') ? 1 : 0, click = false;
    if (M.inside && (M.moved || M.pressed[0])) for (let k = 0; k < n; k++) { const y = Y0 + k * STEP + (R[k].back ? 4 : 0); if (M.x >= 30 && M.x < 290 && M.y >= y - 4 && M.y < y + 11) { if (this.i !== k && M.moved) Sound.sfx('blip'); this.i = k; if (M.pressed[0]) { click = true; d = M.x < 214 && !R[k].back ? -1 : 1; } } }
    if (M.pressed[0] && !click) M.pressed[0] = false;
    const row = R[this.i];
    if (row.back && (Input.pressed('a') || click)) { Sound.sfx('cancel'); Options.save(); this.done(); return; }
    if (d && !row.back) { row.ch.call(this, d); Options.save(); Sound.sfx('blip'); return; }
    if (Input.pressed('a') && !row.back && !row.bar) { row.ch.call(this, 1); Options.save(); Sound.sfx('select'); return; }
    if (Input.pressed('b')) { Sound.sfx('cancel'); Options.save(); this.done(); }
  };
  OS.draw = function (ctx) {
    ctx.globalAlpha = 0.5; P(ctx, 0, 0, W, H, '#0a0614'); ctx.globalAlpha = 1;
    const R = ROWS();
    UI.box(ctx, 30, 22, 260, 214);
    UI.box(ctx, 110, 14, 100, 18, 'title');
    Font.drawCenter(ctx, 'OPCIONES', 160, 20, '#ffffff', '#1a1430');
    R.forEach((r, k) => {
      const y = Y0 + k * STEP + (r.back ? 4 : 0), sel = k === this.i;
      if (sel) { ctx.globalAlpha = 0.18; P(ctx, 36, y - 3, 248, 14, '#6c8cd8'); ctx.globalAlpha = 1; UI.cursor(ctx, 40, y + 1); }
      Font.draw(ctx, r.n, 52, y, '#2a2236');
      if (r.bar) { const v = r.bar(); UI.bar(ctx, 160, y + 3, 90, 4, v, '#58a8f0'); Font.draw(ctx, String(Math.round(v * 10)), 258, y, '#2a2236'); }
      else if (r.v) { Font.drawCenter(ctx, r.v(), 214, y, '#2a2236'); if (sel) { Font.draw(ctx, '<', 160, y, '#c04830'); Font.draw(ctx, '>', 264, y, '#c04830'); } }
    });
  };
}

// con el dedo no se dibuja el cursor del ratón
{ const _cd = Cursor.draw; Cursor.draw = function (ctx) { if (Input.mode === 'touch') return; return _cd.call(this, ctx); }; }

// ---------- textos de ayuda: las teclas se traducen al mando o al tacto ----------
{
  const RULES = {
    pad: [[/Z o Intro/g, 'A'], [/Z \/ clic/g, 'A'], [/X \/ clic der\./g, 'B'], [/Z \/ X/g, 'A / B'], [/X\/M/g, 'B'], [/X \/ M/g, 'B'], [/\bIntro\b/g, 'Start'], [/\bZ\b/g, 'A'], [/\bX\b/g, 'B'], [/←→/g, 'Cruceta']],
    touch: [[/Pulsa Z o Intro/g, 'Toca la pantalla'], [/Z o Intro/g, 'tocar'], [/Z \/ clic/g, 'Toca'], [/X \/ clic der\./g, 'B'], [/Z \/ X/g, 'Toca / B'], [/X\/M/g, 'B'], [/X \/ M/g, 'B'], [/\bZ\b/g, 'Toca'], [/\bX\b/g, 'B'], [/←→ o clic/g, 'Toca'], [/←→/g, 'Desliza']],
  };
  const cache = { pad: new Map(), touch: new Map() };
  const tr = (str) => {
    const m = Input.mode; if ((m !== 'pad' && m !== 'touch') || typeof str !== 'string' || str.length < 2 || !/[ZX←]|Intro/.test(str)) return str;
    const C = cache[m]; let out = C.get(str);
    if (out === undefined) { out = str; for (const [re, rep] of RULES[m]) out = out.replace(re, rep); if (C.size > 2000) C.clear(); C.set(str, out); }
    return out;
  };
  for (const fn of ['draw', 'drawCenter', 'drawRight', 'drawOutlined']) {
    const orig = Font[fn];
    Font[fn] = function (ctx, str, ...rest) { return orig.call(this, ctx, tr(str), ...rest); };
  }
  const _w = Font.width; Font.width = function (str) { return _w.call(this, tr(str)); };
}
