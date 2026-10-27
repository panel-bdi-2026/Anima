'use strict';
// ============================================================
//  Mundo: mapa, movimiento por casillas, NPCs, entrenadores,
//  encuentros, compañero que te sigue, scripts
// ============================================================

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
const DIR_ROW = { down: 0, up: 1, left: 2, right: 3 };

const World = {
  opaque: true,
  map: null, layer: null, player: null, follower: null, npcs: [], busy: 0, banner: null, emotes: [],
  bumpT: 0, stepCount: 0,

  start() {
    Scenes.clear();
    this.busy = 0; this.battle = null; this.blackingOut = false;
    Scenes.push(this);
    this.loadMap(G.map, G.x, G.y, G.dir);
    Fade.in(0.4);
  },
  syncPos() { if (this.player) { G.x = this.player.x; G.y = this.player.y; G.dir = this.player.dir; G.map = this.map.id; } },

  // ---------- carga de mapa ----------
  loadMap(id, x, y, dir) {
    const m = MAPS[id];
    const prev = this.map;
    this.map = m; G.map = id;
    this.player = { x, y, px: x * 16, py: y * 16, dir: dir || 'down', moving: false, t: 0, fx: x, fy: y, tx: x, ty: y, step: 0, jump: 0, speed: 1 };
    this.follower = { x, y, px: x * 16, py: y * 16, dir: this.player.dir, hidden: true, fx: x, fy: y, tx: x, ty: y, t: 1, moving: false, pending: true };
    this.refreshNpcs();
    // el compañero aparece detrás del jugador si hay sitio
    { const [dx, dy] = DIRS[this.player.dir]; const bx = x - dx, by = y - dy; const t = this.tileAt(bx, by);
      if (t && !t.solid && !t.ledge && !this.npcAt(bx, by) && !this.itemAt(bx, by) && !this.map.warps.some((w) => w.x === bx && w.y === by)) Object.assign(this.follower, { x: bx, y: by, px: bx * 16, py: by * 16, pending: false }); }
    this.buildLayer();
    if (m.music) Sound.music(m.music);
    if (!prev || prev.name !== m.name) this.banner = { text: m.name, t: 0 };
    this.emotes = [];
    Ambient.reset(); Critters.reset(this); this.camF = null;
    this.lastHour = Math.floor(Clock.hour());
  },
  refreshNpcs() {
    const old = {}; for (const n of this.npcs) old[n.def.id] = n;
    this.npcs = [];
    for (const d of this.map.npcs) {
      if (d.hideIf && Game.flag(d.hideIf)) continue;
      if (d.showIf && !Game.flag(d.showIf)) continue;
      if (d.hours && !inHours(Clock.hour(), d.hours)) continue;
      const o = old[d.id];
      if (o && o.mapId === this.map.id) { this.npcs.push(o); continue; }
      const n = { def: d, mapId: this.map.id, x: d.x, y: d.y, px: d.x * 16, py: d.y * 16, dir: d.dir || 'down', moving: false, t: 0, fx: d.x, fy: d.y, tx: d.x, ty: d.y, timer: U.rand(1, 3), step: 0, speed: 1, look: d.look };
      this.npcs.push(n);
    }
    for (const n of this.npcs) if (n.def.routine && !n.placed) { n.placed = true; Routines.place(n); }
  },
  npc(id) { return this.npcs.find((n) => n.def.id === id); },
  spawnTemp(look, x, y, dir) {
    const n = { def: { id: 'temp_' + Math.random(), look }, mapId: this.map.id, x, y, px: x * 16, py: y * 16, dir, moving: false, t: 0, fx: x, fy: y, tx: x, ty: y, timer: 99, step: 0, speed: 1, look, scripted: true, temp: true };
    this.npcs.push(n); return n;
  },
  removeTemp(n) { this.npcs = this.npcs.filter((o) => o !== n); },

  buildLayer() {
    const m = this.map;
    if (this.resetTerrain) this.resetTerrain();
    const [c, x] = U.makeCanvas(m.w * 16, m.h * 16);
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const ch = m.rows[ty][tx], def = TILEDEF[ch] || TILEDEF['.'];
      const v = Math.floor(hash2(tx, ty) * 3);
      x.drawImage(Tiles.get(def.t, 0, v), tx * 16, ty * 16);
      // bordes suaves de camino/arena sobre hierba
      if (def.t === 'path' || def.t === 'sand') {
        for (const [dx, dy, side] of [[0, -1, 'n'], [0, 1, 's'], [-1, 0, 'w'], [1, 0, 'e']]) {
          const n = this.tileAt(tx + dx, ty + dy);
          if (n && (n.t === 'grass' || n.t === 'flower' || n.t === 'tallgrass')) {
            x.fillStyle = PAL.g3;
            for (let i = 0; i < 16; i += 2) {
              const o = (hash2(tx * 16 + i, ty) * 2) | 0;
              if (side === 'n') x.fillRect(tx * 16 + i, ty * 16, 2, 1 + o);
              if (side === 's') x.fillRect(tx * 16 + i, ty * 16 + 15 - o, 2, 1 + o);
              if (side === 'w') x.fillRect(tx * 16, ty * 16 + i, 1 + o, 2);
              if (side === 'e') x.fillRect(tx * 16 + 15 - o, ty * 16 + i, 1 + o, 2);
            }
          }
        }
      }
      // espuma en la orilla
      if (def.water) {
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const n = this.tileAt(tx + dx, ty + dy);
          if (n && !n.water) {
            x.fillStyle = def.t === 'cavewater' ? '#6a8ab8' : PAL.w1;
            if (dy === -1) x.fillRect(tx * 16, ty * 16, 16, 1);
            if (dy === 1) x.fillRect(tx * 16, ty * 16 + 15, 16, 1);
            if (dx === -1) x.fillRect(tx * 16, ty * 16, 1, 16);
            if (dx === 1) x.fillRect(tx * 16 + 15, ty * 16, 1, 16);
          }
        }
      }
    }
    this.windows = []; this.lamps = [];
    for (const b of m.buildings) {
      x.globalAlpha = 0.22; x.fillStyle = '#0a1a10'; x.fillRect(b.x * 16 + 6, b.y * 16 + b.h * 16 - 3, b.w * 16 - 2, 7); x.fillRect(b.x * 16 + b.w * 16 - 2, b.y * 16 + 8, 6, b.h * 16 - 6); x.globalAlpha = 1;
      const img = Buildings.get(b.style, b.w, b.h, b.door);
      x.drawImage(img, b.x * 16, b.y * 16);
      for (const w of img.windows || []) this.windows.push({ x: b.x * 16 + w.x, y: b.y * 16 + w.y, w: w.w, h: w.h, door: w.door });
    }
    // copas de los árboles en una capa superior
    const [cc, cxx] = U.makeCanvas(m.w * 16, m.h * 16);
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const def = TILEDEF[m.rows[ty][tx]];
      if (def && def.canopy) cxx.drawImage(Canopy.get(Math.floor(hash2(tx * 7, ty * 3) * 7)), tx * 16 - 4, ty * 16 - 15);
      if (def && def.light) this.lamps.push({ x: tx * 16 + 8, y: ty * 16 + 3 });
    }
    this.canopy = cc;
    // marcas de la arena del gimnasio
    if (m.arena) {
      const a = m.arena, x0 = a.x * 16 + 4, y0 = a.y * 16 + 6, x1 = (a.x + a.w) * 16 - 4, y1 = (a.y + a.h) * 16 - 2;
      x.globalAlpha = 0.45; x.fillStyle = '#ffffff';
      x.fillRect(x0, y0, x1 - x0, 1); x.fillRect(x0, y1, x1 - x0, 1); x.fillRect(x0, y0, 1, y1 - y0); x.fillRect(x1, y0, 1, y1 - y0);
      x.fillRect(x0, Math.round((y0 + y1) / 2), x1 - x0, 1);
      pixRing(x, (x0 + x1) / 2, (y0 + y1) / 2, 22, '#ffffff', 1);
      x.globalAlpha = 1;
    }
    this.layer = c;
    this.inWindows = [];
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) if (m.rows[ty][tx] === 'X') this.inWindows.push([tx, ty]);
    this.animTiles = [];
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const def = TILEDEF[m.rows[ty][tx]];
      if (def && ANIM_TILES[def.t] !== undefined) this.animTiles.push([tx, ty, def.t]);
    }
  },
  tileAt(x, y) {
    const m = this.map;
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return null;
    const mc = this.mods && this.mods.size ? this.mods.get(y * 1000 + x) : undefined;
    return TILEDEF[mc !== undefined ? mc : m.rows[y][x]] || TILEDEF['.'];
  },
  charAt(x, y) {
    const m = this.map; if (x < 0 || y < 0 || x >= m.w || y >= m.h) return null;
    const mc = this.mods && this.mods.size ? this.mods.get(y * 1000 + x) : undefined;
    return mc !== undefined ? mc : m.rows[y][x];
  },
  itemAt(x, y) { return this.map.items.find((i) => i.x === x && i.y === y && !Game.flag(i.flag)); },
  starterAt(x, y) { return (this.map.starters || []).find(([sx, sy, k]) => sx === x && sy === y && !Game.flag('starter_taken_' + k)); },
  npcAt(x, y, except) {
    return this.npcs.find((n) => n !== except && !n.gone && ((n.x === x && n.y === y) || (n.moving && n.tx === x && n.ty === y)));
  },
  blocked(x, y, who) {
    const t = this.tileAt(x, y);
    if (!t || t.solid) return true;
    if (this.itemAt(x, y)) return true;
    if (this.npcAt(x, y, who)) return true;
    if (who !== this.player && this.player.x === x && this.player.y === y) return true;
    if (who !== this.player && this.player.moving && this.player.tx === x && this.player.ty === y) return true;
    return false;
  },

  // ---------- warps ----------
  async warpTo(id, x, y, dir, sfx = true) {
    this.busy++;
    if (sfx) Sound.sfx('door');
    await Fade.out(0.22);
    this.loadMap(id, x, y, dir);
    this.syncPos();
    await Fade.in(0.22);
    this.busy--;
    this.checkTrainers();
  },

  // ---------- bucle ----------
  update(dt) {
    G.playTime += dt;
    this.time = (this.time || 0) + dt;
    Clock.update(dt);
    const wx = Weather.at(this.map);
    Weather.update(dt, wx);
    Ambient.update(dt, this);
    Critters.update(dt, this);
    if (this.updateTerrain) this.updateTerrain(dt);
    // los habitantes con horario aparecen/desaparecen al cambiar la hora
    const hNow = Math.floor(Clock.hour());
    if (hNow !== this.lastHour) { this.lastHour = hNow; if (!this.busy) this.refreshHours(); }
    this.bumpT = Math.max(0, this.bumpT - dt);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > 2.6) this.banner = null; }
    for (const e of this.emotes) e.t += dt;
    this.emotes = this.emotes.filter((e) => e.t < e.dur);
    this.updateMover(this.player, dt);
    this.updateFollower(dt);
    for (const n of this.npcs) this.updateMover(n, dt);
    // vigilante anti-bloqueo: si un guion queda colgado sin nada en marcha, devuelve el control
    if (this.busy) {
      const idle = !this.player.moving && !this.npcs.some((n) => n.moving) && Fade.a === 0 && !Fade.res && !Timers.list.length && !Sound.jingleRes && !Battle.active;
      this.idleBusy = idle ? (this.idleBusy || 0) + dt : 0;
      if (this.idleBusy > 8) { console.warn('Vigilante: guion bloqueado, se restablece el control'); this.busy = 0; this.idleBusy = 0; }
      return;
    }
    this.updateNpcAI(dt);
    if (this.player.moving || this.player.jump > 0) return;
    // entrada
    if (Input.pressed('start')) { Sound.sfx('select'); this.openMenu(); return; }
    if (Input.pressed('a')) { this.interact(); return; }
    const d = Input.dir();
    if (d) this.tryMove(d);
  },
  async openMenu() { this.busy++; await runScene(new StartMenu()); this.busy--; },

  updateMover(e, dt) {
    if (e.jump > 0) {
      e.jump += dt / 0.42;
      const t = Math.min(1, e.jump);
      e.px = U.lerp(e.fx * 16, e.tx * 16, t); e.py = U.lerp(e.fy * 16, e.ty * 16, t);
      e.hop = Math.sin(t * Math.PI) * 10;
      if (t >= 1) { e.jump = 0; e.hop = 0; e.x = e.tx; e.y = e.ty; e.moving = false; if (e.onArrive) { const f = e.onArrive; e.onArrive = null; f(); } }
      return;
    }
    if (!e.moving) return;
    const dur = 0.24 / (e.speed || 1);
    e.t += dt / dur;
    const t = Math.min(1, e.t);
    e.px = U.lerp(e.fx * 16, e.tx * 16, t); e.py = U.lerp(e.fy * 16, e.ty * 16, t);
    if (t >= 1) {
      e.x = e.tx; e.y = e.ty; e.moving = false; e.step++;
      if (e.onArrive) { const f = e.onArrive; e.onArrive = null; f(); }
    }
  },
  startMove(e, dir, speed = 1) {
    const [dx, dy] = DIRS[dir];
    e.dir = dir; e.fx = e.x; e.fy = e.y; e.tx = e.x + dx; e.ty = e.y + dy; e.t = 0; e.moving = true; e.speed = speed;
  },
  updateFollower(dt) {
    const f = this.follower;
    f.hidden = !G.party.length || !Game.flag('got_starter') || f.pending;
    if (f.moving) {
      f.t += dt / (0.24 / (this.player.speed || 1));
      const t = Math.min(1, f.t);
      f.px = U.lerp(f.fx * 16, f.tx * 16, t); f.py = U.lerp(f.fy * 16, f.ty * 16, t);
      if (t >= 1) { f.moving = false; f.x = f.tx; f.y = f.ty; }
    }
  },
  followTo(x, y, speed) {
    const f = this.follower;
    if (f.pending) { f.pending = false; f.x = x; f.y = y; f.px = x * 16; f.py = y * 16; return; }
    if (f.x === x && f.y === y) return;
    if (Math.abs(f.x - x) + Math.abs(f.y - y) > 1) { f.x = x; f.y = y; f.px = x * 16; f.py = y * 16; f.moving = false; return; }
    f.dir = x > f.x ? 'right' : x < f.x ? 'left' : y > f.y ? 'down' : 'up';
    f.fx = f.x; f.fy = f.y; f.tx = x; f.ty = y; f.t = 0; f.moving = true;
  },

  tryMove(dir) {
    const p = this.player;
    const turning = p.dir !== dir;
    p.dir = dir;
    if (turning && !Input.down('run') && (Input.holdTime[dir] || 0) < 0.08) return; // giro rápido sin moverse
    const [dx, dy] = DIRS[dir];
    const nx = p.x + dx, ny = p.y + dy;
    const m = this.map;
    // salida por borde del mapa
    if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) {
      const key = nx < 0 ? 'w' : nx >= m.w ? 'e' : ny < 0 ? 'n' : 's';
      const ed = m.edges && m.edges[key];
      if (!ed) { this.bump(); return; }
      const T = MAPS[ed.to];
      let tx, ty;
      if (key === 'n') { tx = nx + ed.d; ty = T.h - 1; } else if (key === 's') { tx = nx + ed.d; ty = 0; }
      else if (key === 'w') { tx = T.w - 1; ty = ny + ed.d; } else { tx = 0; ty = ny + ed.d; }
      const tt = TILEDEF[T.rows[ty] && T.rows[ty][tx]];
      if (!tt || tt.solid) { this.bump(); return; }
      this.warpTo(ed.to, tx, ty, dir, false);
      return;
    }
    const t = this.tileAt(nx, ny);
    // saltar bordillo
    if (t && t.ledge) {
      if (dir !== 'down' || this.blocked(nx, ny + 1, p)) { this.bump(); return; }
      Sound.sfx('jump');
      const fx = p.x, fy = p.y;
      p.fx = p.x; p.fy = p.y; p.tx = nx; p.ty = ny + 1; p.jump = 0.001; p.moving = true;
      this.followTo(fx, fy);
      p.onArrive = () => { this.followTo(nx, ny); this.arrived(); };
      return;
    }
    if (this.blocked(nx, ny, p)) { this.bump(); return; }
    const fx = p.x, fy = p.y;
    const run = Input.down('run');
    this.startMove(p, dir, run ? 2 : 1);
    this.followTo(fx, fy);
    p.onArrive = () => this.arrived();
  },
  bump() { if (this.bumpT <= 0) { Sound.sfx('bump'); this.bumpT = 0.3; } },

  // al llegar a una casilla
  arrived() {
    const p = this.player, m = this.map;
    G.steps++; this.syncPos();
    if (G.repel > 0) { G.repel--; if (G.repel === 0) { this.runScript(async () => { await say('El efecto del Repelente se ha agotado.'); }); return; } }
    if (G.steps % 64 === 0) for (const c of G.party) c.bond = Math.min(255, c.bond + 1);
    // warps
    const w = m.warps.find((wp) => wp.x === p.x && wp.y === p.y);
    if (w) { this.warpTo(w.to, w.tx, w.ty, w.dir); return; }
    // disparadores
    for (const tr of m.triggers) {
      if (p.x >= tr.x && p.x < tr.x + tr.w && p.y >= tr.y && p.y < tr.y + tr.h) {
        if (tr.ifFlag && !Game.flag(tr.ifFlag)) continue;
        if (tr.unlessFlag && Game.flag(tr.unlessFlag)) continue;
        this.runScript(() => Story.run(tr.script, tr));
        return;
      }
    }
    if (this.checkTrainers()) return;
    // encuentros
    const t = this.tileAt(p.x, p.y);
    const enc = m.encounters;
    if (enc && G.party.length && ((t && t.grass) || (enc.cave && t && t.t === 'cave'))) {
      if (t.grass) Sound.sfx('grass');
      const wc = this.rollGrassEncounter();
      if (wc) {
        const lead = Game.firstAlive();
        if (G.repel > 0 && lead && wc.lv < lead.lv && !wc.alpha) return;
        this.runScript(async () => { await Battle.wild(wc); });
      }
    }
  },

  // ---------- NPCs ----------
  refreshHours() { this.refreshNpcs(); },
  // camina hasta una casilla buscando el camino
  async walkTo(e, tx, ty) { const path = findPath(this, e.x, e.y, tx, ty, e); if (path && path.length) await this.walk(e, path); },
  updateNpcAI(dt) {
    for (const n of this.npcs) {
      if (n.scripted) continue;
      if (n.def.routine) { Routines.update(n, dt); continue; }
      if (n.moving) continue;
      const d = n.def;
      n.timer -= dt;
      if (n.timer > 0) continue;
      n.timer = U.rand(1.5, 4);
      if (d.move === 'wander') {
        const dir = U.choice(['up', 'down', 'left', 'right']);
        const [dx, dy] = DIRS[dir];
        const nx = n.x + dx, ny = n.y + dy;
        n.dir = dir;
        if (Math.abs(nx - d.x) <= 2 && Math.abs(ny - d.y) <= 2 && !this.blocked(nx, ny, n) && !this.isWarpTile(nx, ny) && !(this.follower.x === nx && this.follower.y === ny && !this.follower.hidden)) this.startMove(n, dir);
      } else if (d.move === 'look') n.dir = U.choice(['up', 'down', 'left', 'right']);
    }
  },
  isWarpTile(x, y) { return this.map.warps.some((w) => w.x === x && w.y === y) || this.charAt(x, y) === 'D'; },

  checkTrainers() {
    const p = this.player;
    for (const n of this.npcs) {
      const tr = n.def.trainer;
      if (!tr || Game.flag('tr_' + n.def.id) || n.moving) continue;
      const [dx, dy] = DIRS[n.dir];
      for (let i = 1; i <= (tr.sight || 3); i++) {
        const x = n.x + dx * i, y = n.y + dy * i;
        if (p.x === x && p.y === y) { this.runScript(() => this.trainerEngage(n, i)); return true; }
        const t = this.tileAt(x, y);
        if (!t || t.solid || this.npcAt(x, y, n) || this.itemAt(x, y)) break;
      }
    }
    return false;
  },
  async trainerEngage(n, dist) {
    const tr = n.def.trainer;
    n.scripted = true;
    Sound.music(tr.boss ? 'eclipse' : 'trainer');
    Sound.sfx('alert');
    this.emote(n, '!');
    await wait(0.7);
    for (let i = 1; i < dist; i++) await this.walk(n, [n.dir]);
    this.player.dir = OPP[n.dir];
    await this.trainerBattle(n);
    n.scripted = false;
  },
  async trainerBattle(n) {
    const tr = n.def.trainer;
    const title = `${tr.cls}${tr.name ? ' ' + tr.name : ''}`;
    await say(tr.intro, { speaker: title });
    const res = await Battle.trainer({ title, cls: tr.cls, name: tr.name, party: tr.party, look: n.def.look, boss: tr.boss, music: tr.music, money: tr.money, ai: tr.ai, npc: n });
    if (res === 'win') {
      Game.setFlag('tr_' + n.def.id);
      if (tr.flagOnWin) Game.setFlag(tr.flagOnWin);
      if (tr.lose) await say(tr.lose, { speaker: title });
      if (tr.flagOnWin) { await Fade.out(0.3); this.refreshNpcs(); await Fade.in(0.3); }
      Sound.music(this.map.music);
    }
    return res;
  },
  async talk(n) {
    const d = n.def;
    const prevDir = n.dir;
    n.dir = OPP[this.player.dir];
    if (d.trainer && !Game.flag('tr_' + d.id)) { await this.trainerEngageTalk(n); return; }
    if (d.script) await Story.run(d.script, d, n);
    else if (d.trainer && d.trainer.after) await say(d.trainer.after, { speaker: d.trainer.cls + (d.trainer.name ? ' ' + d.trainer.name : '') });
    else { const l = Routines.lines(d, n); if (l) await say(l); }
    if (d.routine || (d.move && d.move !== 'stand')) n.dir = prevDir;
  },
  async trainerEngageTalk(n) {
    n.scripted = true;
    Sound.music(n.def.trainer.boss ? 'eclipse' : 'trainer');
    await this.trainerBattle(n);
    n.scripted = false;
  },

  // ---------- interacción ----------
  interact() {
    const p = this.player;
    const [dx, dy] = DIRS[p.dir];
    let x = p.x + dx, y = p.y + dy;
    // compañero
    const f = this.follower;
    if (!f.hidden && f.x === x && f.y === y) { this.runScript(() => Story.partnerTalk()); return; }
    let n = this.npcAt(x, y);
    const ch = this.charAt(x, y);
    if (!n && ch === 'n') n = this.npcAt(x + dx, y + dy); // a través del mostrador
    if (n && !n.moving) { this.runScript(() => this.talk(n)); return; }
    const it = this.itemAt(x, y);
    if (it) { this.runScript(() => this.pickItem(it)); return; }
    const st = this.starterAt(x, y);
    if (st) { this.runScript(() => Story.run('starter', { key: st[2] })); return; }
    const sign = this.map.signs.find((s) => s.x === x && s.y === y);
    if (sign) { this.runScript(() => say(sign.text)); return; }
    const flavor = { b: 'Libros y más libros sobre ánimas. ¡Qué interesante!', v: 'Están emitiendo un programa sobre un entrenador legendario.', k: 'Una máquina llena de luces que pitan.', q: 'Una planta bien cuidada.', j: 'Una estatua del gimnasio. Tiene grabados los nombres de los campeones.', e: 'Una cama mullida.', '~': 'El agua es azul y profunda.', a: 'Una mesa de madera.' };
    if (ch === 'p') { this.runScript(() => openPC()); return; }
    if (flavor[ch]) { this.runScript(() => say(flavor[ch])); return; }
  },
  async pickItem(it) {
    Game.setFlag(it.flag);
    Game.give(it.item, it.qty);
    Sound.jingle('item');
    await say(`¡${G.name} encontró ${it.qty > 1 ? it.qty + ' × ' : ''}${ITEMS[it.item].name}!`);
  },

  // ---------- utilidades de script ----------
  async runScript(fn) {
    this.busy++;
    try { await fn(); } catch (e) { console.error(e); }
    this.busy--;
    if (G.party.length && Game.aliveCount() === 0 && !this.blackingOut) await this.blackout();
  },
  walk(e, dirs, speed = 1) {
    return new Promise((res) => {
      const step = (i) => {
        if (i >= dirs.length) { res(); return; }
        const d = dirs[i];
        if (e === this.player) { const fx = e.x, fy = e.y; this.startMove(e, d, speed); this.followTo(fx, fy); }
        else this.startMove(e, d, speed);
        e.onArrive = () => step(i + 1);
      };
      step(0);
    });
  },
  emote(e, ch) { this.emotes.push({ e, ch, t: 0, dur: 1 }); },
  async blackout() {
    this.blackingOut = true;
    this.busy++;
    try { await this.blackout0(); } finally { this.busy--; this.blackingOut = false; }
  },
  async blackout0() {
    Sound.stopMusic();
    await say(['¡No te quedan ánimas en condiciones!', `¡${G.name} perdió el conocimiento!`]);
    G.money = Math.floor(G.money / 2);
    Game.healAll();
    await Fade.out(0.8);
    this.loadMap(G.lastHeal.map, G.lastHeal.x, G.lastHeal.y, 'up');
    await Fade.in(0.6);
    await say('Te despiertas descansado. Tus ánimas se han recuperado.');
    this.blackingOut = false;
  },

  // ---------- dibujo ----------
  draw(ctx) {
    const m = this.map, p = this.player;
    const mw = m.w * 16, mh = m.h * 16;
    // cámara con seguimiento suave
    let tx = p.px + 8 - W / 2, ty = p.py + 8 - H / 2;
    if (this.battle) { const [bx, by] = this.battle.camPoint(); tx = bx - W / 2; ty = by - H / 2 - 4; }
    tx = mw <= W ? -Math.floor((W - mw) / 2) : U.clamp(tx, 0, mw - W);
    // en combate se permite asomar fuera del mapa para que el HUD no tape el área
    ty = this.battle ? U.clamp(ty, Math.min(0, mh - H) - 36, Math.max(mh - H, 0) + 40) : mh <= H ? -Math.floor((H - mh) / 2) : U.clamp(ty, 0, mh - H);
    if (!this.camF || this.camMap !== m.id || (!this.battle && (Math.abs(this.camF[0] - tx) > 120 || Math.abs(this.camF[1] - ty) > 120))) { this.camF = [tx, ty]; this.camMap = m.id; }
    else { this.camF[0] += (tx - this.camF[0]) * 0.22; this.camF[1] += (ty - this.camF[1]) * 0.22; if (Math.abs(tx - this.camF[0]) < 0.3) this.camF[0] = tx; if (Math.abs(ty - this.camF[1]) < 0.3) this.camF[1] = ty; }
    const cx = Math.round(this.camF[0]), cy = Math.round(this.camF[1]);
    this.cam = [cx, cy];
    const L = this.lightLevel();
    P(ctx, 0, 0, W, H, m.outdoor ? '#2a5a30' : '#000');
    ctx.drawImage(this.layer, -cx, -cy);
    this.drawAnimTiles(ctx, cx, cy, L);
    // de noche, las ventanas de los interiores se ven oscuras
    if (!m.outdoor && !m.cave) {
      const na = Clock.light().a;
      if (na > 0.15) { ctx.globalAlpha = Math.min(0.85, na * 1.2); for (const [wx, wy] of this.inWindows) { const sx = wx * 16 - cx, sy = wy * 16 - cy; P(ctx, sx + 4, sy + 3, 8, 5, '#18204a'); P(ctx, sx + 5, sy + 4, 1, 1, '#f0f0ff'); } ctx.globalAlpha = 1; }
    }
    this.drawWorldRest(ctx, cx, cy, L, m);
  },
  // tiles animados
  drawAnimTiles(ctx, cx, cy, L) {
    const fr = Math.floor(Engine.time * 3);
    for (const [tx2, ty2, t] of this.animTiles) {
      const sx = tx2 * 16 - cx, sy = ty2 * 16 - cy;
      if (sx < -16 || sy < -16 || sx > W || sy > H) continue;
      const n = ANIM_TILES[t];
      if (t === 'tallgrass') {
        const rust = this.entities().some((e) => !e.hidden && !e.gone && e.x === tx2 && e.y === ty2 && e.moving);
        ctx.drawImage(Tiles.get(t, rust ? (fr % 2) : 0), sx, sy);
      } else if (t === 'healer' || t === 'machine') ctx.drawImage(Tiles.get(t, 1 + (Math.floor(Engine.frame / 12) % 6)), sx, sy);
      else if (t === 'lamp' || t === 'ashlamp') ctx.drawImage(Tiles.get(t, L.a > 0.15 ? 1 : 0, Math.floor(hash2(tx2, ty2) * 3)), sx, sy);
      else ctx.drawImage(Tiles.get(t, fr % n, Math.floor(hash2(tx2, ty2) * 3)), sx, sy);
    }
  },
  drawWorldRest(ctx, cx, cy, L, m) {
    // ventanas iluminadas de noche
    if (L.a > 0.12) {
      ctx.globalAlpha = Math.min(1, (L.a - 0.1) * 2.2);
      for (const w of this.windows) { const sx = w.x - cx, sy = w.y - cy; if (sx < -16 || sy < -16 || sx > W || sy > H) continue; P(ctx, sx, sy, w.w, w.h, w.door ? '#ffe8a0' : '#ffd070'); P(ctx, sx, sy, Math.ceil(w.w / 2), 2, '#fff4c0'); }
      ctx.globalAlpha = 1;
    }
    // objetos en el suelo
    for (const it of m.items) {
      if (Game.flag(it.flag)) continue;
      const sx = it.x * 16 - cx, sy = it.y * 16 - cy;
      const bob = Math.round(Math.sin(Engine.time * 3 + it.x) * 1);
      drawShadow(ctx, sx + 8, sy + 13, 5, 2, 0.25);
      ctx.drawImage(Icons.sphere('esfera', 12), sx + 2, sy + 1 + bob);
      if (Math.floor(Engine.time * 2 + it.x) % 5 === 0) P(ctx, sx + 11, sy + 1 + bob, 2, 2, '#ffffff');
    }
    for (const s of (m.starters || [])) {
      if (Game.flag('starter_taken_' + s[2])) continue;
      ctx.drawImage(Icons.sphere(['esfera', 'super', 'ultra'][['ignito', 'burbujo', 'semillin'].indexOf(s[2])] || 'esfera', 10), s[0] * 16 - cx + 3, s[1] * 16 - cy + 1);
    }
    Ambient.draw(ctx, cx, cy, 'ground');
    Critters.draw(ctx, cx, cy, this);
    // entidades ordenadas por profundidad
    if (this.drawTerrainFX) this.drawTerrainFX(ctx, cx, cy);
    const B = this.battle;
    if (B && B.drawGroundLayer) B.drawGroundLayer(ctx, cx, cy);
    const ents = this.entities().filter((e) => !e.hidden && !e.gone).map((e) => ({ y: e.py + 14, e }));
    if (B && B.depthItems) for (const it of B.depthItems()) ents.push(it);
    ents.sort((a, b) => a.y - b.y);
    for (const it of ents) {
      if (it.draw) { ctx.save(); ctx.translate(-cx, -cy); it.draw(ctx); ctx.restore(); continue; }
      const e = it.e;
      this.drawEntity(ctx, e, cx, cy);
      if (e.slot) Routines.drawExtras(ctx, e, Math.round(e.px - cx), Math.round(e.py - cy));
    }
    if (B) B.drawWorldLayer(ctx, cx, cy);
    // copas de los árboles por encima (profundidad)
    ctx.drawImage(this.canopy, -cx, -cy);
    Ambient.draw(ctx, cx, cy, 'air');
    // emociones
    for (const em of this.emotes) {
      const e = em.e, sx = Math.round(e.px - cx), sy = Math.round(e.py - cy) - 27 - Math.min(4, em.t * 30);
      UI.box(ctx, sx + 2, sy, 12, 13, 'panel');
      Font.drawCenter(ctx, em.ch, sx + 8, sy + 3, '#d03030');
    }
    // clima e iluminación
    const wx = Weather.at(m);
    Weather.draw(ctx, wx);
    Lighting.draw(ctx, L.a, L.color, this.collectLights(cx, cy, L), L.tint, L.ta);
    if (typeof HUD !== 'undefined' && !this.battle) HUD.drawWorld(ctx, this);
    // cartel del lugar
    if (this.banner && !this.battle) {
      const t = this.banner.t, a = t < 0.3 ? t / 0.3 : t > 2.2 ? (2.6 - t) / 0.4 : 1;
      const w = Font.width(this.banner.text) + 24;
      const y = Math.round(-26 + 32 * U.clamp(a, 0, 1));
      UI.box(ctx, 6, y, w, 22, 'title');
      Font.draw(ctx, this.banner.text, 18, y + 7, '#ffffff', '#1a1430');
    }
  },
  // nivel de luz según el mapa, la hora y el clima
  lightLevel() {
    const m = this.map;
    if (m.cave) return { a: 0.8, color: '#06020e', tint: null, ta: 0 };
    if (!m.outdoor) return { a: 0, color: '#000', tint: null, ta: 0 };
    const L = Clock.light();
    const w = Weather.at(m);
    if (Weather.isRain(w)) L.a = Math.min(0.75, L.a + (w === 'tormenta' ? 0.16 : 0.08));
    if (m.dark) L.a = Math.max(L.a, m.dark) + (L.a > 0.3 ? 0.06 : 0);
    return L;
  },
  collectLights(cx, cy, L) {
    const out = this.terrainLights ? this.terrainLights(cx, cy) : [];
    const m = this.map;
    if (L.a <= 0.01) return out;
    const p = this.player;
    if (m.cave) {
      out.push({ x: p.px - cx + 8, y: p.py - cy + 4, r: 110, i: 1 });
      if (this.battle) for (const l of this.battle.lights(cx, cy, true)) out.push(l);
      const lead = G.party[0];
      if (lead && SPECIES[lead.sp].types.includes('fuego') && !this.follower.hidden) out.push({ x: this.follower.px - cx + 8, y: this.follower.py - cy + 4, r: 70, i: 0.9, glow: '#ff9040', gr: 34 });
      return out;
    }
    out.push({ x: p.px - cx + 8, y: p.py - cy + 2, r: 46, i: 0.45 });
    const lead = G.party[0];
    if (lead && !this.follower.hidden) {
      const ty = SPECIES[lead.sp].types;
      if (ty.includes('fuego')) out.push({ x: this.follower.px - cx + 8, y: this.follower.py - cy + 4, r: 56, i: 0.9, glow: '#ff9040', gr: 26 });
      else if (ty.includes('electrico')) out.push({ x: this.follower.px - cx + 8, y: this.follower.py - cy + 4, r: 44, i: 0.7, glow: '#fff080', gr: 20 });
    }
    if (L.a > 0.12) {
      for (const l of this.lamps) out.push({ x: l.x - cx, y: l.y - cy + 4, r: 50, i: 0.95, glow: '#ffd890', gr: 30 });
      for (const w of this.windows) out.push({ x: w.x - cx + w.w / 2, y: w.y - cy + w.h, r: w.door ? 26 : 20, i: 0.75, glow: '#ffc860', gr: 12 });
    }
    for (const l of Ambient.lights(cx, cy)) out.push(l);
    if (this.battle) for (const l of this.battle.lights(cx, cy)) out.push(l);
    return out;
  },
  entities() {
    const list = [...(this.battle && this.battle.hidePlayer ? [] : [this.player]), ...this.npcs.filter((n) => !this.battle || n !== this.battle.hideNpc)];
    if (!this.follower.hidden && !this.battle) list.push(this.follower);
    return list;
  },
  drawEntity(ctx, e, cx, cy) {
    const sx = Math.round(e.px - cx), sy = Math.round(e.py - cy);
    const hop = e.hop || 0;
    if (e.def && e.def.creature) {
      const bob = Math.sin(Engine.time * 2.5) * 2;
      drawShadow(ctx, sx + 8, sy + 15, 11, 3, 0.3);
      if (e.animSeed === undefined) e.animSeed = Math.random() * 6;
      CreatureAnim.draw(ctx, e, { sp: e.def.creature, S: 32, px: sx + 8, py: sy + 14, flip: false, t: Engine.time, dt: 1 / 60 });
      if (Math.floor(Engine.time * 4) % 3 === 0) P(ctx, sx + U.randi(-6, 20), sy - U.randi(0, 20), 2, 2, '#fff8c0');
      return;
    }
    if (e === this.follower) {
      const c = G.party[0];
      const bob = e.moving ? Math.abs(Math.sin(e.t * Math.PI)) * 2 : Math.sin(Engine.time * 4) > 0.6 ? 1 : 0;
      drawShadow(ctx, sx + 8, sy + 14, 6, 2, 0.25);
      if (e.animSeed === undefined) e.animSeed = Math.random() * 6;
      if (e.animSp !== c.sp) { e.animSp = c.sp; e.anim = null; }
      CreatureAnim.draw(ctx, e, { sp: c.sp, S: 22, shiny: c.shiny, px: sx + 8, py: sy + 15, flip: e.dir === 'right', t: Engine.time, dt: 1 / 60, speed: e.moving ? 60 : 0 });
    } else {
      const look = e === this.player ? LOOKS.player : LOOKS[e.look] || LOOKS.boy;
      const spr = CharSprites.get(look);
      if (e.lying) { drawLyingNpc(ctx, e, sx, sy, spr); return; }
      let frame = 0;
      if (e.moving && e.jump <= 0) frame = e.t < 0.5 ? (e.step % 2 ? 1 : 2) : 0;
      drawShadow(ctx, sx + 8, sy + 15, 6, 2, 0.24);
      ctx.drawImage(spr, frame * 16, DIR_ROW[e.dir] * 24, 16, 24, sx, sy - 9 - hop - (frame ? 1 : 0), 16, 24);
    }
    // hierba alta cubre los pies
    const t = this.tileAt(e.moving ? (e.t > 0.5 ? e.tx : e.fx) : e.x, e.moving ? (e.t > 0.5 ? e.ty : e.fy) : e.y);
    if (t && t.grass && !hop) ctx.drawImage(Tiles.get('tallgrass_top', Math.floor(Engine.time * 3) % 2), sx, sy);
  },
};
