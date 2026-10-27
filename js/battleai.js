'use strict';
// ============================================================
//  INICIO DEL COMBATE Y TÁCTICA DE LAS ÁNIMAS
//  - Al empezar, si están demasiado cerca, ambas saltan hacia atrás
//  - La IA alterna entre PRESIONAR y REPOSICIONARSE: tras atacar
//    toma aire, rodea y mantiene la distancia; castiga cuando el
//    rival acaba de atacar o de esquivar; se retira con poca vida.
//    Cada especie tiene un temperamento (agresiva, paciente...).
// ============================================================
{
  const MIN_GAP = 96;
  // ---------- salto hacia atrás ----------
  Object.assign(BattleScene.prototype, {
    hopTarget(f, ax, ay, dist) {
      let best = [f.x, f.y];
      for (let d = 6; d <= dist; d += 4) {
        const x = f.x + ax * d, y = f.y + ay * d;
        if (this.solidAt(x, y - 3) || !this.inArena(x, y, f.r)) break;
        const pl = World.player; if (!this.hidePlayer && U.dist(x, y, pl.px + 8, pl.py + 12) < f.r + 14) break;
        best = [x, y];
      }
      return best;
    },
    async hopApart() {
      const a = this.ally, b = this.foe;
      if (!a || !b || a.inBall || b.inBall) return;
      const d = U.dist(a.x, a.y, b.x, b.y);
      if (d >= MIN_GAP) return;
      let ax = (a.x - b.x) / (d || 1), ay = (a.y - b.y) / (d || 1);
      if (d < 1) { ax = -1; ay = 0.3; }
      const need = (MIN_GAP - d) / 2 + 6;
      const ta = this.hopTarget(a, ax, ay, need * 1.4), tb = this.hopTarget(b, -ax, -ay, need * 1.4);
      for (const [f, t] of [[a, ta], [b, tb]]) {
        f.hop = { t: 0, dur: 0.42, x0: f.x, y0: f.y, x1: t[0], y1: t[1] };
        f.ang = Math.atan2((f === a ? b : a).y - f.y, (f === a ? b : a).x - f.x);
      }
      Sound.sfx('jump');
      await this.until(() => !a.hop && !b.hop);
    },
  });
  const _update = BattleScene.prototype.update;
  BattleScene.prototype.update = function (dt0) {
    _update.call(this, dt0);
    for (const f of this.fighters ? this.fighters() : [this.ally, this.foe]) {
      if (!f || !f.hop) continue;
      const h = f.hop; h.t += dt0;
      const k = Math.min(1, h.t / h.dur), e = 1 - (1 - k) * (1 - k);
      f.x = U.lerp(h.x0, h.x1, e); f.y = U.lerp(h.y0, h.y1, e); f.vx = 0; f.vy = 0;
      f.hopZ = Math.sin(k * Math.PI) * 14;
      if (k >= 1) { f.hop = null; f.hopZ = 0; for (let i = 0; i < 6; i++) this.parts.push({ x: f.x + U.rand(-6, 6), y: f.y, vx: U.rand(-30, 30), vy: U.rand(-25, -5), life: 0.35, max: 0.35, color: '#d8c8a0', size: 2 }); }
    }
  };
  for (const m of ['sendAlly', 'sendFoe']) {
    const _orig = BattleScene.prototype[m];
    BattleScene.prototype[m] = async function (...a) {
      const r = await _orig.apply(this, a);
      if (this.ally && this.foe && !this.ally.inBall && !this.foe.inBall && !this.foe.fainted && !this.ally.fainted) await this.hopApart();
      return r;
    };
  }
  // el salto se ve en la animación
  const _pose = CreatureAnim.pose;
  CreatureAnim.pose = function (e, o) {
    const P = _pose.call(this, e, o);
    if (e.hopZ) { P.ry -= e.hopZ; P.sy *= 1.06; P.sx *= 0.95; P.legA = P.legB = -1; }
    return P;
  };

  // ---------- temperamento ----------
  const temper = (f) => {
    if (f.temper) return f.temper;
    const t = f.types, st = f.st;
    let agg = 0.5;
    if (t.includes('fuego') || t.includes('sombra') || t.includes('roca') || t.includes('bicho')) agg += 0.18;
    if (t.includes('mente') || t.includes('planta') || t.includes('viento') || t.includes('agua')) agg -= 0.12;
    if (st.atk > st.esp * 1.15) agg += 0.1; else if (st.esp > st.atk * 1.15) agg -= 0.08;
    if (st.vel > 70) agg += 0.05;
    // ¿prefiere luchar de lejos?
    const ranged = f.c.moves.filter((mk) => ['proj', 'beam', 'area'].includes(MOVES[mk].kind)).length;
    const melee = f.c.moves.filter((mk) => ['melee', 'dash', 'stealth'].includes(MOVES[mk].kind)).length;
    return (f.temper = { agg: U.clamp(agg + U.rand(-0.08, 0.08), 0.2, 0.9), range: ranged > melee ? 112 : ranged === melee ? 90 : 68 });
  };

  // ---------- táctica ----------
  const _foeAI = BattleScene.prototype.foeAI;
  BattleScene.prototype.foeAI = function (f, dt) {
    const T = this.targetOf(f);
    if (!T || f.fainted || T.fainted || f.hop) { if (f.hop) return; return _foeAI.call(this, f, dt); }
    const ai = f.ai, tp = temper(f);
    const sk = f.aiSkill !== undefined ? f.aiSkill : this.opts.skill !== undefined ? this.opts.skill : this.wild ? 0.35 : 0.55;
    if (ai.mode === undefined) { ai.mode = 'reposition'; ai.modeT = U.rand(0.5, 1.2); ai.wasActing = false; }
    // acaba de atacar -> toma aire
    if (ai.wasActing && !f.act && !f.dash) {
      ai.mode = 'reposition';
      ai.modeT = U.rand(0.6, 1.6) * (1.35 - tp.agg) * (this.opts.boss ? 0.75 : 1);
    }
    ai.wasActing = !!(f.act || f.dash);
    if (f.act || f.dash || f.stun > 0) return _foeAI.call(this, f, dt);
    ai.modeT -= dt;
    const low = f.hp < f.maxHp * 0.3;
    // oportunidades de castigo: el rival se ha comprometido con un ataque, acaba de esquivar o está aturdido
    const opening = (T.act && T.act.fired) || T.stun > 0 || (T.dodgeCd > 0.35 && T.dodgeT <= 0) || T.dash === null && T.act === null && T.cds && T.cds.every((c) => c > 0.6);
    if (ai.mode === 'reposition' && opening && Math.random() < dt * 6 * sk) { ai.mode = 'engage'; ai.modeT = U.rand(0.8, 1.6); }
    if (ai.modeT <= 0) {
      if (ai.mode === 'engage') { ai.mode = 'reposition'; ai.modeT = U.rand(0.7, 1.5) * (low ? 1.6 : 1); }
      else { ai.mode = Math.random() < tp.agg + (this.opts.boss ? 0.15 : 0) - (low ? 0.2 : 0) ? 'engage' : 'reposition'; ai.modeT = ai.mode === 'engage' ? U.rand(1, 2.2) : U.rand(0.6, 1.4); }
    }
    // en modo presión o con poca vida y una curación lista, se usa la lógica de ataque
    if (ai.mode === 'engage') return _foeAI.call(this, f, dt);
    if (low && f.c.moves.some((mk, i) => MOVES[mk].kind === 'heal' && f.cds[i] <= 0) && Math.random() < dt * 2) return _foeAI.call(this, f, dt);
    // ---- reposicionarse: rodear manteniendo la distancia ----
    // seguir esquivando lo que venga
    ai.dodgeCd -= dt;
    if (ai.dodgeCd <= 0) {
      let threat = null;
      for (const p of this.projs) if (p.owner.side !== f.side && U.dist(p.x, p.y, f.x, f.y) < 46) threat = Math.atan2(p.vy, p.vx);
      if (threat === null && T.act && !T.act.fired && U.dist(f.x, f.y, T.x, T.y) < 50) threat = Math.atan2(f.y - T.y, f.x - T.x) + Math.PI;
      if (threat !== null && Math.random() < sk * 0.7) {
        ai.dodgeCd = U.lerp(2, 0.8, sk);
        const da = threat + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
        f.dodgeT = 0.22; f.invuln = 0.18; f.vx = Math.cos(da) * 220; f.vy = Math.sin(da) * 220;
        return;
      }
    }
    const d = U.dist(f.x, f.y, T.x, T.y), aTo = Math.atan2(T.y - f.y, T.x - f.x);
    const want = (low ? tp.range + 40 : tp.range) + Math.sin(this.t * 0.7 + (f.animSeed || 0)) * 14;
    // los salvajes a veces dudan y olfatean
    if (this.wild && !this.opts.boss && Math.random() < dt * 0.4) { ai.pause = U.rand(0.3, 0.8); }
    if (ai.pause > 0) { ai.pause -= dt; f.vx *= 0.8; f.vy *= 0.8; f.ang = U.lerp(f.ang, f.ang + U.angDiff(f.ang, aTo), dt * 4); return; }
    let mx = 0, my = 0;
    if (d > want + 14) { mx += Math.cos(aTo) * 0.8; my += Math.sin(aTo) * 0.8; }
    else if (d < want - 14) { mx -= Math.cos(aTo); my -= Math.sin(aTo); }
    const sa = aTo + (Math.PI / 2) * ai.strafe;
    mx += Math.cos(sa) * 0.7; my += Math.sin(sa) * 0.7;
    if (Math.random() < dt * 0.6) ai.strafe *= -1;
    // si choca con el borde o un obstáculo, cambia de sentido
    if (!this.inArena(f.x + mx * 14, f.y + my * 14, f.r) || this.solidAt(f.x + mx * 12, f.y + my * 12 - 3)) ai.strafe *= -1;
    const l = Math.hypot(mx, my) || 1, spd = this.speedOf(f) * (this.wild ? 0.6 : 0.75);
    f.vx = U.lerp(f.vx, (mx / l) * spd, Math.min(1, dt * 6)); f.vy = U.lerp(f.vy, (my / l) * spd, Math.min(1, dt * 6));
    f.ang = U.lerp(f.ang, f.ang + U.angDiff(f.ang, aTo), Math.min(1, dt * 6));
  };
}
