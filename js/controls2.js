'use strict';
// ============================================================
//  CONTROLES DE COMBATE 2
//  - Ataque ARMADO: J / clic izquierdo lanzan el ataque que tengas
//    armado (al principio, el 1). Los demás siguen en 1-4 / K L I.
//  - SELECTOR TÁCTICO: mantén Mayús y el tiempo va al 25%; elige un
//    ataque con la dirección (o el ratón) y suelta: queda armado y
//    se lanza. La rueda del ratón también cambia el ataque armado.
//  - MOVIMIENTO ASISTIDO (opcional, tecla V u Opciones): tu ánima
//    se coloca sola a su distancia ideal; tú atacas y esquivas.
// ============================================================
Input.map.m1 = ['Digit1', 'Numpad1'];
Input.map.main = ['KeyJ'];
Input.map.tactic = ['ShiftLeft', 'ShiftRight'];
Input.map.assist = ['KeyV'];
Object.assign(Input.gpMap, { m1: undefined, main: 'GP_x', tactic: 'GP_b' });
if (Options.assist === undefined) Options.assist = false;
{
  const _save = Options.save;
  Options.save = function () {
    _save.call(this);
    try { const o = JSON.parse(localStorage.getItem(OPT_KEY) || '{}'); o.assist = !!this.assist; localStorage.setItem(OPT_KEY, JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ }
  };
}

// ranuras del selector: arriba, derecha, abajo, izquierda
const TAC_DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

Object.assign(BattleScene.prototype, {
  armedIdx() {
    const f = this.ally;
    if (this.armed === undefined || !f || !f.c.moves[this.armed]) this.armed = 0;
    return this.armed;
  },
  // devuelve true mientras el selector está abierto (bloquea el resto del control)
  tacticUpdate(f) {
    const open = Input.down('tactic') && !this.capture;
    if (open) {
      if (!this.tac) { this.tac = { pick: this.armedIdx(), t: 0 }; this.tacPrevScale = this.timeScale; Sound.sfx('blip'); }
      this.timeScale = 0.25;
      f.vx *= 0.85; f.vy *= 0.85;
      const [ax, ay] = Input.axis();
      let pick = -1;
      if (ax || ay) { let best = -2; TAC_DIRS.forEach(([dx, dy], k) => { const s = dx * ax + dy * ay; if (s > best && f.c.moves[k]) { best = s; pick = k; } }); }
      else if (Input.usingMouse() && Input.mouse.moved) {
        const [wx, wy] = this.mouseWorld(), mx = wx - f.x, my = wy - (f.y - 12);
        if (Math.hypot(mx, my) > 10) { let best = -2; TAC_DIRS.forEach(([dx, dy], k) => { const s = (dx * mx + dy * my) / Math.hypot(mx, my); if (s > best && f.c.moves[k]) { best = s; pick = k; } }); }
      }
      if (pick >= 0 && pick !== this.tac.pick) { this.tac.pick = pick; Sound.sfx('blip'); }
      const n = ['m1', 'm2', 'm3', 'm4'].findIndex((k, i) => Input.pressed(k) && f.c.moves[i]);
      if (n >= 0) this.tac.pick = n;
      // clic dentro del selector: confirma sin soltar Mayús
      if (Input.mouse.pressed[0]) { this.closeTactic(f, true); Input.mouse.pressed = {}; }
      return true;
    }
    if (this.tac) this.closeTactic(f, true);
    return false;
  },
  closeTactic(f, fire) {
    const k = this.tac.pick;
    this.tac = null;
    this.timeScale = this.slowT > 0 ? this.tacPrevScale || 1 : 1;
    if (k < 0 || !f.c.moves[k]) return;
    this.armed = k;
    if (!fire) return;
    if (f.cds[k] > 0 || f.act || f.dash || f.stun > 0) { Sound.sfx('bump'); return; }
    this.startMove(f, k);
  },
  // movimiento asistido: buscar la distancia ideal según sus ataques y rodear al rival
  assistMove(f, dt) {
    const T = this.foe; if (!T || T.inBall) return;
    if (!f.assist) {
      const ranged = f.c.moves.filter((mk) => ['proj', 'beam', 'area'].includes(MOVES[mk].kind)).length;
      f.assist = { want: ranged * 2 >= f.c.moves.length ? 100 : 52, strafe: Math.random() < 0.5 ? 1 : -1 };
    }
    const A = f.assist, d = U.dist(f.x, f.y, T.x, T.y), aTo = Math.atan2(T.y - f.y, T.x - f.x);
    // el ataque armado manda: si es cuerpo a cuerpo, se acerca
    const am = MOVES[f.c.moves[this.armedIdx()]];
    const want = am && ['melee', 'dash', 'stealth', 'ring'].includes(am.kind) && f.cds[this.armed] <= 0.3 ? 34 : A.want;
    let mx = 0, my = 0;
    if (d > want + 12) { mx += Math.cos(aTo); my += Math.sin(aTo); } else if (d < want - 12) { mx -= Math.cos(aTo); my -= Math.sin(aTo); }
    const sa = aTo + (Math.PI / 2) * A.strafe; mx += Math.cos(sa) * 0.55; my += Math.sin(sa) * 0.55;
    if (Math.random() < dt * 0.5) A.strafe *= -1;
    if (!this.inArena(f.x + mx * 14, f.y + my * 14, f.r) || this.solidAt(f.x + mx * 12, f.y + my * 12 - 3)) A.strafe *= -1;
    const l = Math.hypot(mx, my) || 1, spd = this.speedOf(f) * 0.85;
    f.vx = U.lerp(f.vx, (mx / l) * spd, Math.min(1, dt * 8)); f.vy = U.lerp(f.vy, (my / l) * spd, Math.min(1, dt * 8));
    // sin ratón, mira al rival (con ratón se sigue apuntando al cursor)
    if (!Input.usingMouse()) { f.ang = aTo; f.aimAng = aTo; }
  },
});

{
  const _ctrl = BattleScene.prototype.controlAlly;
  BattleScene.prototype.controlAlly = function (dt) {
    const f = this.ally, M = Input.mouse;
    this.armedIdx();
    if (Input.pressed('assist')) { Options.assist = !Options.assist; Options.save(); Sound.sfx('select'); this.banner('Movimiento asistido: ' + (Options.assist ? 'SÍ' : 'NO'), 0.9); }
    if (this.tacticUpdate(f, dt)) return;
    // rueda del ratón: cambia el ataque armado (las esferas se cambian con R)
    if (M.wheel) {
      const n = f.c.moves.length; if (n) { this.armed = (this.armed + Math.sign(M.wheel) + n) % n; Sound.sfx('blip'); }
      M.wheel = 0;
    }
    // clic en la barra inferior (la barra está centrada en la pantalla ancha)
    // clic en la barra inferior (a todo el ancho, ver battle_hud.js)
    if ((M.pressed[0] || M.pressed[2]) && M.y >= 202) {
      const i = this.moveBarHit(M.x, M.y);
      if (i >= 0) {
        if (f.c.moves[i]) {
          if (M.pressed[2]) { this.armed = i; Sound.sfx('blip'); }
          else if (!(f.stun > 0 || f.act || f.dash || f.dodgeT > 0)) { this.armed = i; this.startMove(f, i); }
        }
        M.pressed = {}; return;
      }
      if (M.x >= 334 && M.y >= 218) {
        if (M.x >= 380) this.invokeDuo('ally'); else if (f.syn >= 100) this.ultimate(f); else Sound.sfx('bump');
        M.pressed = {}; return;
      }
    }
    const [ax, ay] = Input.axis();
    _ctrl.call(this, dt);
    if (Options.assist && !ax && !ay && this.ally === f && !f.act && !f.dash && f.dodgeT <= 0 && f.stun <= 0 && !this.capture && !this.chg) this.assistMove(f, dt);
  };
  // ataque armado: J o clic izquierdo
  const _hai = BattleScene.prototype.handleAttackInput;
  BattleScene.prototype.handleAttackInput = function (f, dt) {
    const M = Input.mouse, k = this.armedIdx();
    const mainDown = Input.down('main') || (M.down[0] && M.y < 202);
    const mainPressed = Input.pressed('main') || (M.pressed[0] && M.y < 202);
    // el resto de la lógica de carga trabaja con las teclas de cada ranura
    const slotKey = ['m1', 'm2', 'm3', 'm4'][k];
    const held = Input.held, fake = '__main';
    Input.map[slotKey].push(fake);
    if (mainDown) held[fake] = true; if (mainPressed) Input.pressedKeys[fake] = true;
    const m0 = M.down[0], p0 = M.pressed[0];
    M.down[0] = false; M.pressed[0] = false; // el clic izquierdo ya cuenta como ataque armado
    try { return _hai.call(this, f, dt); }
    finally { Input.map[slotKey].pop(); delete held[fake]; delete Input.pressedKeys[fake]; M.down[0] = m0; M.pressed[0] = p0; }
  };
  // dibujo del selector táctico y del ataque armado
  const _draw = BattleScene.prototype.draw;
  BattleScene.prototype.draw = function (ctx) {
    _draw.call(this, ctx);
    const f = this.ally;
    if (!f || this.capture || this.state !== 'fight') return;
    if (Options.assist) { P(ctx, W - 52, 187, 48, 10, '#0c1a14'); P(ctx, W - 52, 187, 2, 10, '#80e0a0'); Font.draw(ctx, 'ASISTIDO', W - 47, 188, '#80e0a0'); }
    if (this.tac) this.drawTactic(ctx, f);
  };
}
