'use strict';
// ============================================================
//  MODO CAPTURA
//  Pulsa E (o "Capturar" en la pausa): pasas a controlar al
//  entrenador, que se mueve por el área y lanza esferas en arco.
//  La esfera solo captura si CAE sobre la criatura: hay que
//  apuntar bien y anticipar su movimiento. Se puede fallar.
// ============================================================

const TRAINER_SPEED = 72;

Object.assign(BattleScene.prototype, {
  enterCapture() {
    if (!this.wild) { if (this.noCatchMsg <= 0) { this.banner('¡No puedes capturar ánimas de otros entrenadores!', 1.2, '#ff9090'); this.noCatchMsg = 2; } return; }
    if (!this.ballList().length) { this.banner('¡No te quedan esferas!', 1.2, '#ff9090'); return; }
    if (!this.trainer) {
      const p = World.player;
      this.trainer = { x: p.px + 8, y: p.py + 14, vx: 0, vy: 0, r: 5, dir: p.dir, step: 0, stepT: 0, stun: 0, charge: -1, aimAng: 0 };
      const [dx, dy] = DIRS[p.dir]; this.trainer.aimAng = Math.atan2(dy, dx);
    }
    this.capture = true; this.hidePlayer = true;
    this.ally.vx *= 0.3; this.ally.vy *= 0.3;
    Sound.sfx('select');
    if (!this.capTip) { this.capTip = true; this.banner('Modo captura: mueve al entrenador, apunta y lanza', 1.8, '#fff0a0'); }
  },
  exitCapture() {
    this.capture = false;
    if (this.trainer) this.trainer.charge = -1;
    Sound.sfx('cancel');
  },
  trainerAim() {
    const T = this.trainer;
    if (Input.usingMouse()) { const [wx, wy] = this.mouseWorld(); return [wx, wy]; }
    const d = T.aimDist || 90;
    return [T.x + Math.cos(T.aimAng) * d, T.y + Math.sin(T.aimAng) * d];
  },
  // control del entrenador en modo captura
  controlTrainer(dt) {
    const T = this.trainer, M = Input.mouse;
    if (Input.pressed('ball') || M.pressed[1] || M.pressed[2]) { this.exitCapture(); return; }
    if (Input.pressed('cycle') || M.wheel) this.cycleBall();
    T.stun = Math.max(0, T.stun - dt);
    let [ax, ay] = Input.axis();
    const mouse = Input.usingMouse();
    const hold = !mouse && (Input.down('dodge') || Input.held.KeyZ) && T.stun <= 0 && this.throwCd <= 0 && !this.ball;
    // con teclado: mientras se mantiene ESPACIO, las flechas giran la puntería y ajustan la distancia
    if (hold) {
      if (T.charge < 0) { T.charge = 0; if (!T.aimDist) T.aimDist = 90; }
      T.charge += dt;
      T.aimAng += ax * 2.2 * dt;
      T.aimDist = U.clamp((T.aimDist || 90) - ay * 120 * dt, 30, 220);
      ax = 0; ay = 0;
    }
    if (T.stun > 0) { ax = 0; ay = 0; }
    const spd = TRAINER_SPEED * (T.charge >= 0 ? 0.6 : 1);
    if (ax || ay) {
      const l = Math.hypot(ax, ay);
      T.vx = (ax / l) * spd; T.vy = (ay / l) * spd;
      if (!mouse) T.aimAng = Math.atan2(ay, ax);
      T.dir = Math.abs(ax) >= Math.abs(ay) && ax ? (ax > 0 ? 'right' : 'left') : ay > 0 ? 'down' : 'up';
      T.stepT += dt; if (T.stepT > 0.16) { T.stepT = 0; T.step = (T.step + 1) % 4; }
    } else { T.vx *= 0.6; T.vy *= 0.6; T.step = 0; }
    if (Input.usingMouse()) {
      const [wx, wy] = this.mouseWorld();
      T.aimAng = Math.atan2(wy - T.y, wx - T.x);
      if (!(ax || ay)) { const c = Math.cos(T.aimAng), s = Math.sin(T.aimAng); T.dir = Math.abs(c) > Math.abs(s) ? (c > 0 ? 'right' : 'left') : s > 0 ? 'down' : 'up'; }
    }
    // movimiento con colisiones del terreno y límite del área
    for (let i = 0; i < 2; i++) { T.x += (T.vx * dt) / 2; T.y += (T.vy * dt) / 2; this.collideTiles(T); }
    if (!this.inArena(T.x, T.y, 6)) [T.x, T.y] = this.clampPoint(T.x, T.y, 6);
    const foe = this.foe;
    if (foe && !foe.inBall && !foe.fainted && T.stun <= 0 && U.dist(T.x, T.y, foe.x, foe.y) < foe.r + 12) { this.hitTrainer(foe); this.addNum(foe.x, foe.y - 24, '¡No te acerques tanto!', '#ffd0a0'); }
    // lanzar: ratón = clic izquierdo al cursor; teclado = mantener ESPACIO/Z para cargar y soltar
    if (T.stun > 0 || this.throwCd > 0 || this.ball) { if (T.stun > 0) T.charge = -1; return; }
    if (M.pressed[0] && mouse) { this.trainerThrow(); return; }
    if (!hold && T.charge >= 0) { this.trainerThrow(); T.charge = -1; }
  },
  trainerThrow() {
    const kind = this.currentBall();
    if (!kind) { this.banner('¡No te quedan esferas!', 1, '#ff9090'); return; }
    const T = this.trainer;
    let [gx, gy] = this.trainerAim();
    const d = U.dist(T.x, T.y, gx, gy);
    if (d > 230) { gx = T.x + ((gx - T.x) / d) * 230; gy = T.y + ((gy - T.y) / d) * 230; }
    Game.take(kind);
    Sound.sfx('throw');
    this.throwCd = 0.9;
    const dist = U.dist(T.x, T.y, gx, gy);
    this.ball = { kind, phase: 'arc', sx: T.x, sy: T.y - 10, gx, gy, x: T.x, y: T.y - 10, z: 0, t: 0, dur: 0.32 + dist / 330, h: 18 + dist * 0.14, shakes: 0, notes: [], ang: Math.atan2(gy - T.y, gx - T.x) };
    T.throwT = 0.25;
  },
  // la esfera cae en el punto apuntado; solo captura si la criatura está ahí
  updateArc(dt) {
    const b = this.ball, foe = this.foe;
    b.t += dt;
    const k = Math.min(1, b.t / b.dur);
    b.x = U.lerp(b.sx, b.gx, k); b.y = U.lerp(b.sy, b.gy, k);
    b.z = Math.sin(k * Math.PI) * b.h;
    if (Engine.frame % 2 === 0) this.parts.push({ x: b.x, y: b.y - b.z, vx: 0, vy: 0, life: 0.18, max: 0.18, color: '#ffffff', size: 1 });
    // choca con árboles o paredes al final de la trayectoria (cuando va bajo)
    if (k > 0.75 && b.z < 10 && this.blocksShotAt(b.x, b.y - 2)) { this.missBall(b, '¡La esfera chocó contra un obstáculo!'); return; }
    if (k < 1) return;
    const precise = ITEMS[b.kind].ball >= 255;
    const dd = U.dist(b.x, b.y, foe.x, foe.y - 2);
    if (foe.inBall || foe.fainted || (!precise && dd > foe.r + 5)) { this.missBall(b, '¡Fallaste!'); return; }
    if ((foe.dodgeT > 0 || foe.invuln > 0) && !precise) { this.missBall(b, '¡Esquivó la esfera!'); return; }
    // ¡impacto! bonificaciones
    b.bonus = 1;
    if (dd < foe.r * 0.45) { b.bonus *= 1.2; b.notes.push('¡Lanzamiento preciso!'); }
    if (foe.stun > 0) { b.bonus *= 2; b.notes.push('¡Aturdido!'); }
    else if (foe.status.para > 0 || foe.status.slow > 0 || foe.status.burn > 0 || foe.status.poison > 0 || foe.status.confuse > 0) { b.bonus *= 1.5; b.notes.push('Estado alterado'); }
    if (Math.abs(U.angDiff(foe.ang, b.ang)) < 1.0) { b.bonus *= 1.3; b.notes.push('¡Por la espalda!'); }
    if (foe.act && !foe.act.fired) { b.bonus *= 1.3; b.notes.push('¡Momento perfecto!'); }
    for (const [m, n] of this.sphereBonus(b.kind, foe)) { b.bonus *= m; b.notes.push(n); }
    b.notes.forEach((n, i) => this.addNum(foe.x, foe.y - 30 - i * 10, n, '#fff080'));
    foe.inBall = true; foe.act = null; foe.dash = null; foe.vx = 0; foe.vy = 0;
    b.phase = 'absorb'; b.t = 0; b.x = foe.x; b.y = foe.y; b.z = 10;
    this.sparkle(foe.x, foe.y - 8, '#ffffff', 20);
    Sound.sfx('poof');
    const ballMul = ITEMS[b.kind].ball, hpR = foe.hp / foe.maxHp;
    const a = ((3 - 2 * hpR) / 3) * foe.sp.catch * ballMul * b.bonus;
    b.p = ballMul >= 255 ? 1 : U.clamp(a / 255, 0.01, 1);
    b.shakeP = Math.pow(b.p, 1 / 3);
  },
  missBall(b, msg) {
    b.phase = 'bounce'; b.t = 0;
    const a = b.ang + U.rand(-0.6, 0.6);
    b.vx = Math.cos(a) * 40; b.vy = Math.sin(a) * 40; b.z = Math.max(4, b.z);
    this.addNum(b.x, b.y - 14, msg, '#ffd0d0');
    Sound.sfx('bump');
  },
  // el ánima protege al entrenador mientras este intenta capturar
  allyGuard(dt) {
    const f = this.ally, T = this.trainer, e = this.foe;
    if (f.stun > 0 || f.act || f.dash) return;
    if (f.dodgeT > 0) return;
    // esquiva si el rival prepara un ataque cerca
    if (e.act && !e.act.fired && U.dist(f.x, f.y, e.x, e.y) < 60 && f.dodgeCd <= 0 && Math.random() < 0.05) {
      const a = angTo(e, f) + (Math.random() < 0.5 ? 1.4 : -1.4);
      f.dodgeT = 0.24; f.dodgeCd = 1.2; f.invuln = 0.2; f.vx = Math.cos(a) * 220; f.vy = Math.sin(a) * 220; return;
    }
    const ang = Math.atan2(e.y - T.y, e.x - T.x), dd = Math.min(46, U.dist(T.x, T.y, e.x, e.y) * 0.5);
    const gx = T.x + Math.cos(ang) * dd + Math.cos(ang + Math.PI / 2) * 22, gy = T.y + Math.sin(ang) * dd + Math.sin(ang + Math.PI / 2) * 22;
    const dx = gx - f.x, dy = gy - f.y, l = Math.hypot(dx, dy);
    const spd = this.speedOf(f) * 0.8;
    if (l > 10) { f.vx = (dx / l) * spd; f.vy = (dy / l) * spd; } else { f.vx *= 0.7; f.vy *= 0.7; }
    f.ang = angTo(f, e);
  },
  hitTrainer(src) {
    const T = this.trainer;
    if (!T || T.stun > 0) return;
    T.stun = 1.2; T.charge = -1;
    const a = Math.atan2(T.y - src.y, T.x - src.x);
    T.vx = Math.cos(a) * 120; T.vy = Math.sin(a) * 120;
    this.addNum(T.x, T.y - 26, '¡Ay! Aturdido', '#ffb0b0');
    Sound.sfx('hurt'); Shake.start(2, 0.2);
  },
});

// --- ganchos sobre el combate ---
const _controlAlly = BattleScene.prototype.controlAlly;
BattleScene.prototype.controlAlly = function (dt) {
  if (this.capture) {
    if (this.foe.fainted || !this.ballList().length && !this.ball) { if (!this.ballList().length && !this.ball && this.capture) { this.banner('¡No te quedan esferas!', 1.2, '#ff9090'); } this.exitCapture(); }
    else { this.controlTrainer(dt); this.allyGuard(dt); return; }
  }
  if (this.trainer && !this.capture) this.trainer.stun = Math.max(0, this.trainer.stun - dt);
  return _controlAlly.call(this, dt);
};
const _updateBall = BattleScene.prototype.updateBall;
BattleScene.prototype.updateBall = function (dt) {
  if (this.ball && this.ball.phase === 'arc') return this.updateArc(dt);
  return _updateBall.call(this, dt);
};
const _updateProjs2 = BattleScene.prototype.updateProjs;
BattleScene.prototype.updateProjs = function (dt) {
  const T = this.trainer;
  if (T && this.capture) for (const p of this.projs) if (p.owner === this.foe && p.life > 0 && U.dist(p.x, p.y, T.x, T.y - 6) < p.r + 6) { this.hitTrainer(p); p.life = 0; this.burst(T.x, T.y - 8, p.m.type, 8, 50); }
  return _updateProjs2.call(this, dt);
};
const _updateAreas = BattleScene.prototype.updateAreas;
BattleScene.prototype.updateAreas = function (dt) {
  const T = this.trainer;
  if (T && this.capture) for (const a of this.areas) if (!a.done && a.owner === this.foe && a.t + dt >= a.delay && U.dist(a.x, a.y, T.x, T.y) <= a.r + 4) this.hitTrainer(a);
  return _updateAreas.call(this, dt);
};
const _camPoint = BattleScene.prototype.camPoint;
BattleScene.prototype.camPoint = function () {
  if (this.capture && this.trainer && this.foe) return [(this.trainer.x + this.foe.x) / 2, (this.trainer.y + this.foe.y) / 2 - 10];
  return _camPoint.call(this);
};
// dibujo del entrenador y de la trayectoria
// (el entrenador se ordena por profundidad con el resto; la puntería va en la capa aérea)
BattleScene.prototype.drawTrainer = function (ctx) {
  const T = this.trainer;
  if (!T) return;
  const spr = CharSprites.get(LOOKS.player);
  const frame = T.step % 2 === 1 ? (T.step === 1 ? 1 : 2) : 0;
  drawShadow(ctx, T.x, T.y + 1, 6, 2, 0.25);
  if (T.stun > 0 && Math.floor(this.t * 12) % 2) ctx.globalAlpha = 0.5;
  ctx.drawImage(spr, frame * 16, DIR_ROW[T.dir] * 24, 16, 24, Math.round(T.x - 8), Math.round(T.y - 23), 16, 24);
  ctx.globalAlpha = 1;
  if (T.stun > 0) for (let i = 0; i < 3; i++) { const a = this.t * 6 + i * 2.1; Font.draw(ctx, '★', Math.round(T.x + Math.cos(a) * 7) - 2, Math.round(T.y - 28 + Math.sin(a) * 2), '#ffe060'); }
};
BattleScene.prototype.drawCaptureAim = function (ctx) {
  const T = this.trainer;
  if (!T) return;
  if (this.capture) {
    // marcador del entrenador
    P(ctx, Math.round(T.x) - 2, Math.round(T.y + 3), 5, 1, '#ffe060');
    // trayectoria en arco y punto de caída
    if (!this.ball && T.stun <= 0 && (Input.usingMouse() || T.charge >= 0)) {
      let [gx, gy] = this.trainerAim();
      const d = U.dist(T.x, T.y, gx, gy);
      if (d > 230) { gx = T.x + ((gx - T.x) / d) * 230; gy = T.y + ((gy - T.y) / d) * 230; }
      const h = 18 + Math.min(230, d) * 0.14, n = Math.max(6, Math.floor(d / 10));
      for (let i = 1; i < n; i++) {
        const k = i / n, x = Math.round(U.lerp(T.x, gx, k)), y = Math.round(U.lerp(T.y - 10, gy, k) - Math.sin(k * Math.PI) * h);
        P(ctx, x - 2, y - 2, 4, 4, '#1c1622');
        P(ctx, x - 1, y - 1, 2, 2, Math.floor(this.t * 10 + i) % 2 ? '#ffffff' : '#ffe060');
      }
      const ok = this.foe && !this.foe.inBall && U.dist(gx, gy, this.foe.x, this.foe.y - 2) <= this.foe.r + 5;
      const rr = this.foe ? this.foe.r + 5 : 10, col = ok ? '#70ff80' : '#ffe060';
      ctx.globalAlpha = 0.22; pixCircle(ctx, gx, gy, rr, col); ctx.globalAlpha = 1;
      pixRing(ctx, gx, gy, rr, '#1c1622', 3); pixRing(ctx, gx, gy, rr, col, 2);
      P(ctx, Math.round(gx) - 4, Math.round(gy), 9, 1, col); P(ctx, Math.round(gx), Math.round(gy) - 4, 1, 9, col);
    }
  }
  // esfera en el aire
  const b = this.ball;
  if (b && b.phase === 'arc') {
    drawShadow(ctx, b.x, b.y + 2, 3, 1.2, 0.3);
    ctx.drawImage(Icons.sphere(ITEMS[b.kind].sphere, 10), Math.round(b.x - 5), Math.round(b.y - 5 - b.z));
  }
};
// barra inferior en modo captura
const _drawHud = BattleScene.prototype.drawHud;
BattleScene.prototype.drawHud = function (ctx) {
  _drawHud.call(this, ctx);
  if (!this.capture || !this.ally) return;
  P(ctx, 0, 199, W, 41, '#1c1430'); P(ctx, 0, 199, W, 1, '#f0c040');
  Font.draw(ctx, 'MODO CAPTURA', 6, 204, '#ffd048');
  const ball = this.currentBall();
  if (ball) {
    ctx.drawImage(Icons.sphere(ITEMS[ball].sphere, 12), 6, 217);
    Font.draw(ctx, `${ITEMS[ball].name} ×${G.bag[ball]}`, 22, 218, '#ffffff');
    if (this.ballList().length > 1) Font.draw(ctx, 'R / rueda: cambiar', 22, 229, '#a098c0');
  }
  const T = this.trainer;
  const mouse = Input.usingMouse();
  Font.drawRight(ctx, mouse ? 'Clic izq.: lanzar al cursor' : (T && T.charge >= 0 ? '←→ girar · ↑↓ distancia · suelta: lanzar' : 'Mantén ESPACIO para apuntar'), 314, 204, '#e8e0f8');
  Font.drawRight(ctx, 'WASD: mover · E / clic der.: volver', 314, 216, '#a098c0');
  if (!mouse && T && T.charge >= 0) {
    const k = (T.aimDist - 30) / 190;
    UI.bar(ctx, 150, 230, 160, 4, k, '#ffd048');
  } else if (this.throwCd > 0) UI.bar(ctx, 150, 230, 160, 4, 1 - this.throwCd / 0.9, '#8090c0');
};
// al terminar, el entrenador se queda donde estaba al final del combate
BattleScene.prototype.snapTrainer = function () {
  const T = this.trainer; if (!T) return;
  const p = World.player, tx = Math.floor(T.x / 16), ty = Math.floor((T.y - 4) / 16);
  const t = World.tileAt(tx, ty);
  if (t && !t.solid && !t.ledge && !World.npcAt(tx, ty) && !World.map.warps.some((w) => w.x === tx && w.y === ty)) {
    p.x = tx; p.y = ty; p.px = tx * 16; p.py = ty * 16; p.fx = tx; p.fy = ty; p.tx = tx; p.ty = ty;
  }
  p.dir = T.dir;
  World.syncPos();
};
