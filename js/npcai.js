'use strict';
// ============================================================
//  Vida en el mundo: rutinas de NPCs según la hora, actividades,
//  fauna ambiental y decoración de los pueblos.
// ============================================================

const inHours = (h, [a, b]) => (a <= b ? h >= a && h < b : h >= a || h < b);

// búsqueda de camino (BFS) sobre casillas
function findPath(world, sx, sy, tx, ty, who, maxNodes = 1500) {
  if (sx === tx && sy === ty) return [];
  const m = world.map, key = (x, y) => y * 1000 + x;
  const prev = new Map([[key(sx, sy), null]]);
  const q = [[sx, sy]]; let n = 0;
  const dirs = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
  while (q.length && n++ < maxNodes) {
    const [x, y] = q.shift();
    for (const [d, dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      const goal = nx === tx && ny === ty;
      const t = world.tileAt(nx, ny);
      if (!t || (t.solid && !(goal && t.building)) || t.ledge || t.water) continue;
      if (!goal && (world.itemAt(nx, ny) || world.npcAt(nx, ny, who))) continue;
      const pl = world.player, fo = world.follower;
      if (pl && pl.x === nx && pl.y === ny) continue;
      if (fo && !fo.hidden && fo.x === nx && fo.y === ny) continue;
      prev.set(k, { from: key(x, y), d });
      if (goal) {
        const out = []; let kk = k;
        while (prev.get(kk)) { const p = prev.get(kk); out.unshift(p.d); kk = p.from; }
        return out;
      }
      q.push([nx, ny]);
    }
  }
  return null;
}

const Routines = {
  slot(def) {
    if (!def.routine) return null;
    const h = Clock.hour();
    return def.routine.find((r) => inHours(h, [r.from, r.to])) || null;
  },
  // coloca al NPC directamente donde debería estar (al entrar en el mapa)
  place(n) {
    const s = this.slot(n.def);
    n.slot = s; n.path = null; n.gone = false; n.wait = U.rand(0.2, 1.5);
    if (!s) return;
    const pos = s.at || (s.path && s.path[0]) || (s.area && [s.area[0] + U.randi(0, s.area[2] - 1), s.area[1] + U.randi(0, s.area[3] - 1)]);
    if (s.do === 'home') { n.gone = true; if (pos) this.setPos(n, pos[0], pos[1]); return; }
    if (pos && this.free(n, pos[0], pos[1])) this.setPos(n, pos[0], pos[1]);
    if (s.face) n.dir = s.face;
    n.pi = 0;
  },
  setPos(n, x, y) { n.x = x; n.y = y; n.px = x * 16; n.py = y * 16; n.fx = x; n.fy = y; n.tx = x; n.ty = y; n.moving = false; },
  free(n, x, y) { const t = World.tileAt(x, y); return t && !t.solid && !World.npcAt(x, y, n) && !(World.player && World.player.x === x && World.player.y === y); },
  target(n, s) {
    if (s.do === 'stay' || s.do === 'home') return s.at;
    if (s.do === 'patrol') return s.path[(n.pi || 0) % s.path.length];
    if (s.do === 'wander' || s.do === 'chase') {
      if (!n.wt || (n.x === n.wt[0] && n.y === n.wt[1])) {
        for (let i = 0; i < 8; i++) { const c = [s.area[0] + U.randi(0, s.area[2] - 1), s.area[1] + U.randi(0, s.area[3] - 1)]; const t = World.tileAt(c[0], c[1]); if (t && !t.solid) { n.wt = c; break; } }
      }
      return n.wt;
    }
    return null;
  },
  update(n, dt) {
    const s = this.slot(n.def);
    if (s !== n.slot) {
      // cambio de actividad: si estaba en casa, sale por la puerta
      if (n.gone) { n.gone = false; if (World.npcAt(n.x, n.y, n) || (World.player.x === n.x && World.player.y === n.y)) { n.gone = true; return; } if (this.near(n)) Sound.sfx('door'); }
      n.slot = s; n.path = null; n.pi = 0; n.wt = null; n.wait = 0;
    }
    if (!s || n.gone || n.moving) return;
    n.actT = (n.actT || 0) + dt;
    if (n.wait > 0) { n.wait -= dt; return; }
    const tgt = this.target(n, s);
    if (!tgt) return;
    if (n.x === tgt[0] && n.y === tgt[1]) {
      n.path = null;
      if (s.do === 'home') { n.gone = true; if (this.near(n)) Sound.sfx('door'); return; }
      if (s.do === 'patrol') { n.pi = ((n.pi || 0) + 1) % s.path.length; n.wait = s.pause !== undefined ? s.pause : U.rand(0.5, 2); return; }
      if (s.do === 'wander') { n.wait = U.rand(1, 3.5); n.wt = null; if (Math.random() < 0.4) n.dir = U.choice(['up', 'down', 'left', 'right']); return; }
      if (s.do === 'chase') { n.wait = U.rand(0, 0.3); n.wt = null; return; }
      if (s.face) n.dir = s.face;
      return;
    }
    if (!n.path || !n.path.length) {
      n.path = findPath(World, n.x, n.y, tgt[0], tgt[1], n);
      if (!n.path) { n.wait = 1; n.wt = null; return; }
    }
    const d = n.path[0], [dx, dy] = DIRS[d];
    const nx = n.x + dx, ny = n.y + dy;
    const t = World.tileAt(nx, ny);
    const goalDoor = s.do === 'home' && nx === tgt[0] && ny === tgt[1];
    if (World.blocked(nx, ny, n) && !goalDoor || (!World.follower.hidden && World.follower.x === nx && World.follower.y === ny)) {
      n.dir = d; n.path = null; n.wait = 0.6; return;
    }
    if (!t) { n.path = null; return; }
    n.path.shift();
    World.startMove(n, d, s.speed || 1);
  },
  near(n) { const p = World.player; return Math.abs(p.x - n.x) < 11 && Math.abs(p.y - n.y) < 9; },
  // diálogo según la actividad / la hora
  lines(def, n) {
    const s = n && n.slot;
    if (s && s.say) return s.say;
    if (def.night && !Clock.isDay()) return def.night;
    return def.say;
  },
  // efectos visuales de cada actividad
  drawExtras(ctx, n, sx, sy) {
    const s = n.slot; if (!s || n.moving || n.gone || !s.act) return;
    const t = n.actT || 0;
    const [fx, fy] = DIRS[n.dir];
    const ox = sx + 8 + fx * 12, oy = sy + 6 + fy * 10;
    if (s.act === 'water') { for (let i = 0; i < 3; i++) { const k = ((t * 2 + i / 3) % 1); P(ctx, Math.round(ox + fx * k * 4 + (i - 1)), Math.round(oy - 6 + k * 10), 1, 2, '#78c0ff'); } P(ctx, sx + 8 + fx * 6, sy - 1, 4, 3, '#5a8ad8'); }
    else if (s.act === 'sweep') { if (Math.floor(t * 3) % 2) n.dir = n.dir === 'left' ? 'right' : n.dir === 'right' ? 'left' : n.dir; const k = (t * 3) % 1; ctx.globalAlpha = 0.5 * (1 - k); P(ctx, Math.round(ox - 3 + k * 6), Math.round(sy + 13 - k * 3), 3, 2, '#d8c8a8'); ctx.globalAlpha = 1; P(ctx, sx + 12, sy - 2, 1, 14, '#9a6a3c'); P(ctx, sx + 11, sy + 11, 3, 3, '#d8b860'); }
    else if (s.act === 'fish') {
      const bx = sx + 8 + fx * 30, by = sy + 8 + fy * 26 + Math.round(Math.sin(t * 3) * 1);
      ctx.strokeStyle = 'rgba(240,240,240,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx + 8 + fx * 10, sy - 4); ctx.lineTo(bx, by); ctx.stroke();
      P(ctx, sx + 8 + fx * 4, sy - 4 + fy * 2, 2 + Math.abs(fx) * 6, 1 + Math.abs(fy) * 6, '#7a5a3a');
      P(ctx, bx - 1, by - 1, 3, 3, (Math.floor(t * 2) % 7 === 0) ? '#ffffff' : '#e83838');
    }
    else if (s.act === 'paint') { P(ctx, sx + 16, sy - 6, 9, 11, '#7a5030'); P(ctx, sx + 17, sy - 5, 7, 7, '#f8f4e8'); P(ctx, sx + 18, sy - 4, 2, 2, '#58a8e0'); P(ctx, sx + 20, sy - 2, 3, 2, '#f06070'); P(ctx, sx + 18, sy + 1, 1, 4, '#7a5030'); P(ctx, sx + 23, sy + 1, 1, 4, '#7a5030'); }
    else if (s.act === 'read') { P(ctx, sx + 4, sy + 4, 8, 4, '#c04848'); P(ctx, sx + 5, sy + 4, 6, 1, '#f8f0e0'); }
    else if (s.act === 'sleep') { const k = (t * 0.6) % 1; ctx.globalAlpha = 1 - k; Font.drawOutlined(ctx, 'z', sx + 10 + k * 6, sy - 14 - k * 10, '#ffffff', '#3a3060'); ctx.globalAlpha = 1; }
    else if (s.act === 'sing' || s.act === 'talk') { const k = (t * 0.7) % 1; if (k < 0.75) { ctx.globalAlpha = Math.min(1, (0.75 - k) * 3); Font.drawOutlined(ctx, s.act === 'sing' ? '♪' : '…', sx + 9 + Math.sin(t * 4) * 2, sy - 16 - k * 8, s.act === 'sing' ? '#ffe080' : '#ffffff', '#3a3060'); ctx.globalAlpha = 1; } }
    else if (s.act === 'stretch') { if (Math.floor(t * 1.5) % 2) n.dir = 'up'; else n.dir = 'down'; }
  },
};

// ---------- fauna ambiental (decorativa) ----------
const Critters = {
  list: [], t: 0,
  reset(world) {
    this.list = [];
    const m = world.map;
    if (!m.outdoor || !m.encounters) return;
    const spots = [];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const t = world.tileAt(x, y); if (t && (t.grass || t.t === 'flower')) spots.push([x, y]); }
    const n = Math.min(6, Math.floor(spots.length / 18));
    const day = Clock.isDay();
    const pool = m.encounters.list.filter((e) => !e.time || (e.time === 'noche' ? !day : day));
    for (let i = 0; i < n && pool.length; i++) {
      const [x, y] = U.choice(spots);
      this.list.push({ sp: U.weighted(pool).sp, x: x * 16 + 8, y: y * 16 + 10, tx: x * 16 + 8, ty: y * 16 + 10, wait: U.rand(0, 3), hop: 0, dir: 1, fleeing: false, alpha: 1 });
    }
  },
  update(dt, world) {
    const p = world.player;
    const px = p.px + 8, py = p.py + 10;
    for (const c of this.list) {
      const d = Math.hypot(c.x - px, c.y - py);
      if (d < 26 && !c.fleeing) { c.fleeing = true; const a = Math.atan2(c.y - py, c.x - px); c.tx = c.x + Math.cos(a) * 60; c.ty = c.y + Math.sin(a) * 60; c.wait = 0; }
      if (c.fleeing) c.alpha -= dt * 0.9;
      if (c.wait > 0) { c.wait -= dt; c.hop = 0; continue; }
      const dx = c.tx - c.x, dy = c.ty - c.y, l = Math.hypot(dx, dy);
      const sp = c.fleeing ? 70 : 22;
      if (l < 1) {
        c.wait = U.rand(1, 4);
        for (let k = 0; k < 5; k++) {
          const nx = c.x + U.rand(-28, 28), ny = c.y + U.rand(-20, 20);
          const t = world.tileAt(Math.floor(nx / 16), Math.floor(ny / 16));
          if (t && (t.grass || t.t === 'grass' || t.t === 'flower')) { c.tx = nx; c.ty = ny; break; }
        }
        continue;
      }
      c.x += (dx / l) * Math.min(l, sp * dt); c.y += (dy / l) * Math.min(l, sp * dt);
      if (Math.abs(dx) > 0.5) c.dir = dx > 0 ? -1 : 1;
      c.hop = Math.abs(Math.sin(world.time * 14 + c.x)) * 3;
    }
    this.list = this.list.filter((c) => c.alpha > 0);
  },
  draw(ctx, cx, cy, world) {
    for (const c of this.list) {
      const x = Math.round(c.x - cx), y = Math.round(c.y - cy);
      if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
      const t = world.tileAt(Math.floor(c.x / 16), Math.floor(c.y / 16));
      ctx.globalAlpha = Math.max(0, c.alpha);
      drawShadow(ctx, x, y, 5, 1.5, 0.22);
      const img = CreatureGfx.get(c.sp, 16);
      ctx.save();
      if (c.dir < 0) { ctx.translate(x + 8, 0); ctx.scale(-1, 1); ctx.drawImage(img, 0, y - 15 - c.hop); }
      else ctx.drawImage(img, x - 8, y - 15 - c.hop);
      ctx.restore();
      if (t && t.grass) ctx.drawImage(Tiles.get('tallgrass_top', 0), Math.floor(c.x / 16) * 16 - cx, Math.floor(c.y / 16) * 16 - cy);
      ctx.globalAlpha = 1;
    }
  },
};

// ---------- decoración y nuevos habitantes ----------
function decorate(id, list) {
  const m = MAPS[id];
  for (const [ch, x, y] of list) {
    if (y < 0 || y >= m.h || x < 0 || x >= m.w) continue;
    const cur = m.rows[y][x];
    if (!'.f,:s'.includes(cur)) { console.warn('Decoración sobre casilla ocupada', id, ch, x, y, cur); continue; }
    m.rows[y] = m.rows[y].slice(0, x) + ch + m.rows[y].slice(x + 1);
  }
}
const R = (from, to, d, extra = {}) => Object.assign({ from, to, do: d }, extra);

decorate('pueblo_alba', [['l', 10, 8], ['l', 13, 8], ['l', 8, 16], ['l', 16, 16], ['y', 9, 17], ['Q', 7, 8], ['Q', 16, 8], ['E', 2, 9], ['E', 21, 9]]);
decorate('villa_musgo', [['l', 10, 7], ['l', 18, 12], ['l', 10, 20], ['l', 19, 20], ['y', 12, 20], ['O', 25, 11], ['O', 26, 11], ['E', 3, 12], ['E', 9, 12], ['y', 20, 4], ['Q', 5, 20]]);
decorate('ciudad_roca', [['l', 12, 12], ['l', 19, 12], ['l', 14, 22], ['l', 18, 22], ['y', 17, 22], ['O', 28, 10], ['O', 28, 11], ['E', 8, 11], ['y', 9, 15]]);
decorate('puerto_marea', [['l', 4, 11], ['l', 10, 11], ['l', 20, 11], ['l', 21, 20], ['O', 21, 9], ['O', 21, 10], ['y', 8, 17], ['E', 2, 16]]);

MAPS.pueblo_alba.npcs.push(
  { id: 'alba_farmer', x: 17, y: 2, look: 'farmer', dir: 'down', say: ['¡Mis flores son las más bonitas del pueblo!'], night: ['Zzz... ¿eh? ¿Qué haces despierto tan tarde?'],
    routine: [R(6, 11, 'stay', { at: [18, 2], face: 'down', act: 'water', say: ['Riego las flores cada mañana. ¡Les encanta el agua fresca!'] }), R(11, 18, 'wander', { area: [14, 2, 7, 2] }), R(18, 6, 'home', { at: [18, 7] })] },
  { id: 'alba_kid1', x: 6, y: 13, look: 'kid2', say: ['¡Me pillas si puedes!'], routine: [R(8, 19, 'chase', { area: [3, 12, 5, 4], speed: 1.6 }), R(19, 8, 'home', { at: [18, 7] })] },
  { id: 'alba_kid2', x: 7, y: 14, look: 'boy', say: ['¡Estamos jugando a ser ánimas salvajes!'], routine: [R(8, 19, 'chase', { area: [3, 12, 5, 4], speed: 1.5 }), R(19, 8, 'home', { at: [18, 7] })] },
  { id: 'alba_jogger', x: 12, y: 3, look: 'jogger', say: ['¡Uf, uf! ¡Correr por la mañana es lo mejor!'],
    routine: [R(6, 9, 'patrol', { path: [[11, 3], [20, 9], [20, 16], [4, 16], [3, 9]], speed: 1.8, pause: 0 }), R(17, 20, 'patrol', { path: [[4, 16], [20, 16], [20, 9], [3, 9]], speed: 1.8, pause: 0 }), R(9, 17, 'home', { at: [12, 0] }), R(20, 6, 'home', { at: [12, 0] })] },
);
MAPS.pueblo_alba.npcs.find((n) => n.id === 'alba_man').routine = [R(7, 19, 'stay', { at: [10, 17], face: 'down', act: 'read', say: ['Leo un libro sobre las ánimas de otras regiones. ¡Fascinante!'] }), R(19, 7, 'home', { at: [5, 7] })];

MAPS.villa_musgo.npcs.push(
  { id: 'vm_baker', x: 12, y: 14, look: 'baker', say: ['¡Pan recién hecho! Bueno, aún no tengo panadería... ¡pero algún día!'],
    routine: [R(6, 10, 'stay', { at: [12, 14], face: 'down', act: 'sweep', say: ['Mantener la plaza limpia es mi pequeña contribución.'] }), R(10, 18, 'wander', { area: [9, 13, 10, 3] }), R(18, 6, 'home', { at: [24, 19] })] },
  { id: 'vm_mail', x: 6, y: 13, look: 'mailman', say: ['¡Correo! ¡Correo para todos!'],
    routine: [R(7, 17, 'patrol', { path: [[6, 13], [22, 13], [24, 20], [16, 20], [4, 20], [6, 13]], pause: 1.2, say: ['Reparto el correo por toda la villa. ¡Mis piernas son de acero!'] }), R(17, 7, 'home', { at: [4, 19] })] },
  { id: 'vm_artist', x: 19, y: 15, look: 'artist', say: ['El gimnasio de Hiedra es precioso al atardecer.'],
    routine: [R(9, 17, 'stay', { at: [19, 15], face: 'up', act: 'paint', say: ['Estoy pintando el gimnasio. ¿Qué te parece?', 'El arte, como los combates, necesita estilo propio.'] }), R(17, 21, 'stay', { at: [13, 20], face: 'down', act: 'sing', say: ['Me gusta cantar mirando las estrellas.'] }), R(21, 9, 'home', { at: [24, 19] })] },
  { id: 'vm_kid3', x: 8, y: 21, look: 'kid2', say: ['¡Cuando sea mayor tendré un Fogarzo!'], routine: [R(8, 19, 'chase', { area: [5, 20, 8, 2], speed: 1.6 }), R(19, 8, 'home', { at: [4, 19] })] },
);
MAPS.ruta1.npcs.push(
  { id: 'r1_jogger', x: 10, y: 30, look: 'jogger', say: ['¡Entreno para la maratón de Puerto Marea!'],
    routine: [R(6, 11, 'patrol', { path: [[10, 31], [11, 6], [10, 31]], speed: 1.8, pause: 0 }), R(16, 20, 'patrol', { path: [[11, 6], [10, 31]], speed: 1.8, pause: 0 }), R(11, 16, 'home', { at: [10, 35] }), R(20, 6, 'home', { at: [10, 35] })] },
  { id: 'r1_watcher', x: 16, y: 16, look: 'artist', say: ['Observo a las ánimas salvajes. ¡Cada una tiene su rutina!'], night: ['De noche salen ánimas distintas. ¡Mira la hierba alta!'],
    routine: [R(7, 21, 'stay', { at: [16, 16], face: 'left', act: 'read' }), R(21, 7, 'stay', { at: [16, 16], face: 'left', act: 'sleep', say: ['Zzz... (Está durmiendo al aire libre.)'] })] },
);
MAPS.ciudad_roca.npcs.push(
  { id: 'cr_miner1', x: 9, y: 21, look: 'worker', say: ['¡Picar piedra da mucha hambre!'],
    routine: [R(7, 17, 'patrol', { path: [[9, 21], [21, 20], [27, 14], [9, 21]], pause: 2, say: ['Llevo minerales de la montaña a la tienda. ¡Pesan una barbaridad!'] }), R(17, 7, 'home', { at: [5, 19] })] },
  { id: 'cr_miner2', x: 13, y: 22, look: 'hiker', say: ['Dicen que en la Cueva Eco hay un Núcleo Hierro escondido.'],
    routine: [R(8, 18, 'stay', { at: [13, 22], face: 'right', act: 'talk' }), R(18, 22, 'stay', { at: [16, 22], face: 'right', act: 'sing', say: ['¡Canciones de minero para despedir el día!'] }), R(22, 8, 'home', { at: [24, 19] })] },
  { id: 'cr_jogger', x: 20, y: 14, look: 'jogger', say: ['¡Correr entre montañas fortalece las piernas!'],
    routine: [R(6, 10, 'patrol', { path: [[3, 14], [28, 14], [28, 23], [3, 23]], speed: 1.8, pause: 0 }), R(10, 6, 'home', { at: [25, 11] })] },
);
MAPS.puerto_marea.npcs.push(
  { id: 'pm_fisher2', x: 25, y: 5, look: 'fisher', say: ['Shhh... vas a espantar a los peces.'],
    routine: [R(5, 12, 'stay', { at: [25, 5], face: 'right', act: 'fish', say: ['Los Escamín pican mejor al amanecer.'] }), R(12, 19, 'wander', { area: [22, 2, 4, 8] }), R(19, 5, 'home', { at: [17, 24] })] },
  { id: 'pm_vendor', x: 9, y: 12, look: 'baker', say: ['¡Pescado fresco! ¡Recién traído del mar!'],
    routine: [R(8, 18, 'stay', { at: [9, 13], face: 'down', act: 'sing', say: ['¡Pescado fresco! Bueno, solo vendo charla, pero es gratis.'] }), R(18, 8, 'home', { at: [5, 23] })] },
  { id: 'pm_kids', x: 23, y: 15, look: 'kid2', say: ['¡Estoy buscando conchas en la playa!'], routine: [R(9, 18, 'chase', { area: [22, 13, 4, 10], speed: 1.4 }), R(18, 9, 'home', { at: [5, 23] })] },
  { id: 'pm_sailor3', x: 14, y: 12, look: 'sailor', say: ['¡Ahoy! El capitán Nerón entrena a sus marineros cada mañana.'],
    routine: [R(6, 10, 'stay', { at: [14, 12], face: 'up', act: 'stretch' }), R(10, 20, 'patrol', { path: [[3, 12], [21, 12]], pause: 3 }), R(20, 6, 'home', { at: [17, 24] })] },
);
// habitantes en casa de noche
MAPS.casa_musgo_b.npcs.push({ id: 'cmb_baker', x: 7, y: 5, look: 'baker', hours: [18, 6], dir: 'left', say: ['¡Hola! Mañana madrugo para barrer la plaza.'], routine: [R(22, 6, 'stay', { at: [1, 1], bed: [0, 1], face: 'down', act: 'sleep', say: ['Zzz... cinco minutitos más...'] })] });
MAPS.casa_musgo_b.npcs.push({ id: 'cmb_artist', x: 3, y: 2, look: 'artist', hours: [21, 9], dir: 'down', say: ['Mañana terminaré mi cuadro del gimnasio.'] });
MAPS.casa_musgo_a.npcs.push({ id: 'cma_mail', x: 6, y: 5, look: 'mailman', hours: [17, 7], dir: 'left', say: ['Hoy he repartido cuarenta cartas. ¡Récord personal!'], routine: [R(22, 6, 'stay', { at: [8, 1], bed: [9, 1], face: 'down', act: 'sleep', say: ['Zzz... una carta... para... zzz...'] })] });
MAPS.casa_roca_a.npcs.push({ id: 'cra_miner', x: 3, y: 5, look: 'worker', hours: [17, 7], dir: 'right', say: ['Por fin en casa. La mina agota a cualquiera.'], routine: [R(21, 6, 'stay', { at: [8, 1], bed: [9, 1], face: 'down', act: 'sleep', say: ['(Ronca como un derrumbe.)'] })] });
MAPS.casa_marea_b.npcs.push({ id: 'cmab_fisher', x: 3, y: 5, look: 'fisher', hours: [19, 5], dir: 'right', say: ['Hoy he pescado tres Escamín... y los he soltado todos.'], routine: [R(22, 4, 'stay', { at: [1, 1], bed: [0, 1], face: 'down', act: 'sleep', say: ['Zzz... el grande... se escapó... zzz...'] })] });
MAPS.casa_rival.npcs.push({ id: 'cr_farmer', x: 7, y: 5, look: 'farmer', hours: [18, 6], dir: 'left', say: ['Mis flores descansan de noche, igual que yo.'] });

// ánimas que solo aparecen de noche (o de día)
MAPS.ruta1.encounters.list.push({ sp: 'umbrin', min: 3, max: 5, w: 12, time: 'noche' }, { sp: 'murcin', min: 3, max: 5, w: 10, time: 'noche' });
MAPS.ruta1.encounters.list.forEach((e) => { if (e.sp === 'pipio') e.time = 'dia'; });
MAPS.ruta2.encounters.list.push({ sp: 'murcin', min: 6, max: 8, w: 18, time: 'noche' }, { sp: 'umbrin', min: 6, max: 8, w: 10, time: 'noche' });
MAPS.bosque.encounters.list.push({ sp: 'umbrin', min: 9, max: 11, w: 25, time: 'noche' }, { sp: 'murcin', min: 9, max: 11, w: 15, time: 'noche' });
MAPS.ruta3.encounters.list.push({ sp: 'nocturo', min: 18, max: 20, w: 4, time: 'noche' }, { sp: 'penumbro', min: 17, max: 18, w: 8, time: 'noche' });
MAPS.puerto_marea.encounters.list.push({ sp: 'murcin', min: 18, max: 20, w: 20, time: 'noche' });
MAPS.puerto_marea.encounters.list.forEach((e) => { if (e.sp === 'alondro') e.time = 'dia'; });

// ---------- dormir tumbado: en su cama (bed) o en un saco al aire libre ----------
{
  const _update = Routines.update, _place = Routines.place;
  const lieIfThere = (R, n) => {
    const s = n.slot;
    if (!s || s.act !== 'sleep' || n.lying || n.moving || n.gone || !s.at || n.x !== s.at[0] || n.y !== s.at[1]) return;
    n.wakeAt = s.at; n.lying = s.bed ? 'bed' : 'bag'; n.dir = 'down';
    if (s.bed) R.setPos(n, s.bed[0], s.bed[1]);
  };
  Routines.update = function (n, dt) {
    if (n.lying) {
      if (this.slot(n.def) === n.slot) { n.actT = (n.actT || 0) + dt; return; }
      // se levanta: vuelve junto a la cama (si el hueco está libre)
      const [x, y] = n.wakeAt || [n.x, n.y];
      if (n.lying === 'bed' && !this.free(n, x, y)) return;
      n.lying = false; this.setPos(n, x, y);
    }
    _update.call(this, n, dt);
    lieIfThere(this, n);
  };
  Routines.place = function (n) { n.lying = false; _place.call(this, n); lieIfThere(this, n); };
}
const BLANKETS = ['#5a78c8', '#c85a6a', '#6aa858', '#c8a048', '#8a64c0'];
function drawLyingNpc(ctx, e, sx, sy, spr) {
  const col = BLANKETS[Math.floor(hash2(e.x * 7 + (e.id || '').length, e.y) * BLANKETS.length)];
  if (e.lying === 'bag') {
    drawShadow(ctx, sx + 8, sy + 14, 8, 2, 0.24);
    P(ctx, sx + 1, sy + 4, 14, 11, '#3a5a38'); P(ctx, sx + 2, sy + 5, 12, 9, '#5a8a50'); P(ctx, sx + 2, sy + 5, 12, 1, '#7aaa68');
    ctx.drawImage(spr, 0, DIR_ROW.down * 24, 16, 10, sx, sy - 4, 16, 10);
    P(ctx, sx + 2, sy + 5, 12, 2, '#6a9a5e');
  } else {
    ctx.drawImage(spr, 0, DIR_ROW.down * 24, 16, 10, sx, sy - 3, 16, 10);
    P(ctx, sx + 1, sy + 6, 14, 9, U.shade(col, -0.25)); P(ctx, sx + 1, sy + 6, 14, 8, col);
    P(ctx, sx + 1, sy + 6, 14, 2, '#f4f0e8'); P(ctx, sx + 3, sy + 10, 10, 1, U.shade(col, 0.2));
  }
}
