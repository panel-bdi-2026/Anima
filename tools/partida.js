// ============================================================
//  PARTIDA COMPLETA AUTOMÁTICA (prueba larga)
//  Juega de principio a fin siguiendo los objetivos de la historia: elige
//  inicial, pelea, captura, se cura, gana las 6 medallas, la Torre Eclipse
//  y los legendarios. Deja un registro (log.txt) con cada paso y cada error
//  de la página, y capturas en los momentos clave. Si algo se traba (no
//  avanza), lo anota y ayuda subiendo niveles para no quedarse días
//  entrenando: esas ayudas también quedan registradas.
//
//  Uso (con el juego servido):  node server.js   (en otra terminal)
//    node tools/partida.js [carpeta] [inicial 0|1|2] [etiqueta]
//  Por defecto deja todo en tools/shots/partida/ (Git lo ignora).
//  Tarda entre 1 y 3 horas. Puerto: variable PORT (8080 si no).
// ============================================================
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const OUT = process.argv[2] || path.join(__dirname, 'shots', 'partida'), STARTER = +(process.argv[3] || 0), TAG = process.argv[4] || 'p1';
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
const logf = path.join(OUT, 'log.txt');
const log = (s) => { const l = new Date().toISOString().slice(11, 19) + ' ' + s; fs.appendFileSync(logf, l + '\n'); console.log(l); };

(async () => {
  const ctx = await chromium.launchPersistentContext(path.join(OUT, 'perfil'), { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'], viewport: { width: 860, height: 400 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = ctx.pages()[0] || await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => { errs.push(e.message); log('ERROR_PAGINA ' + e.message.slice(0, 300)); });
  p.on('console', (m) => { if (m.type() === 'error' && !/cambios\.json|404|favicon/.test(m.text())) log('ERROR_CONSOLA ' + m.text().slice(0, 300)); });
  await p.goto('http://localhost:' + (process.env.PORT || 8080) + '/');
  await p.addScriptTag({ url: 'tools/testkit.js' });
  await p.waitForFunction(() => typeof T !== 'undefined' && Scenes.top());
  await p.evaluate(() => { Options.touch = 'on'; Mobile.active = true; Mobile.layoutScreen(); Input.mode = 'touch'; });
  let n = 0; const RUN = Date.now().toString(36).slice(-4);
  const shot = async (name) => { n++; const f = path.join(OUT, 'shots', RUN + '_' + String(n).padStart(3, '0') + '_' + name.replace(/[^a-z0-9_áéíóúñ-]/gi, '_') + '.png'); try { await p.evaluate(() => { if (window.J) J.drawOk = true; for (let i = 0; i < 45; i++) Engine.draw(); if (typeof Mobile !== 'undefined') Mobile.draw(); }); await p.screenshot({ path: f }); await p.evaluate(() => { if (window.J) J.drawOk = false; }); } catch (e) { log('captura falló ' + e.message); } };
  // en la página: ayudantes de partida (sobre testkit)
  await p.evaluate(() => {
    window.J = {
      seenMaps: {}, battles: 0, assisted: 0, events: [],
      ev(s) { this.events.push(s); },
      teamLv() { return G.party.length ? Math.max(...G.party.map((c) => c.lv)) : 0; },
      avgLv() { return G.party.length ? Math.round(G.party.reduce((a, c) => a + c.lv, 0) / G.party.length) : 0; },
      // cura en el Centro más cercano (o directo si no hay ruta)
      async heal() { Game.healAll(); },
    };
    // ir a una casilla pudiendo nadar (para la Ruta 6)
    J.swimTo = async function (tx, ty, o) {
      for (let guard = 0; guard < 300; guard++) {
        await T.settle(o);
        const pl = World.player; if (pl.x === tx && pl.y === ty) return true;
        const key = (x, y) => y * 1000 + x, prev = new Map([[key(pl.x, pl.y), null]]), q = [[pl.x, pl.y]];
        const ok = (x, y) => { const t = World.tileAt(x, y); if (!t) return false; if (World.npcAt(x, y) || World.itemAt(x, y)) return false; return t.water || !t.solid || (x === tx && y === ty); };
        let found = false;
        while (q.length) { const [x, y] = q.shift(); if (x === tx && y === ty) { found = true; break; } for (const [d, dx, dy] of [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]]) { const nx = x + dx, ny = y + dy, k = key(nx, ny); if (prev.has(k) || !ok(nx, ny)) continue; prev.set(k, [x, y, d]); q.push([nx, ny]); } }
        if (!found) return 'sin camino nadando';
        let c = [tx, ty], first = null; while (true) { const pr = prev.get(key(c[0], c[1])); if (!pr) break; if (pr[0] === pl.x && pr[1] === pl.y) { first = pr[2]; break; } c = [pr[0], pr[1]]; }
        const [dx, dy] = DIRS[first], nt = World.tileAt(pl.x + dx, pl.y + dy);
        if (nt && nt.water && !World.swimming) { pl.dir = first; await T.tap('KeyZ'); for (let i = 0; i < 10; i++) { const t = T.top(); if (t === 'TextBox') { await T.tap('KeyZ'); await T.run(4); } else if (t === 'Choice') { Scenes.top().i = 0; await T.tap('KeyZ'); await T.run(6); } else break; } await T.run(30); continue; }
        await T.step(first);
      }
      return 'demasiados pasos';
    };
    // viajar sabiendo nadar: si el camino queda cortado en la Ruta 6, se cruza el lago hacia el norte
    J.travel = async function (to, o) {
      for (let k = 0; k < 6; k++) {
        const r = await T.travel(to, o);
        if (r === true) return true;
        if (World.map.id === 'ruta6') {
          const hop = (T.route('ruta6', to) || [])[0];
          if (hop && hop.kind === 'warp') { await J.swimTo(hop.w.x, hop.w.y, o); await T.settle(o); continue; }
          const m = World.map; let tgt = null; for (let x = 0; x < m.w && !tgt; x++) { const t = World.tileAt(x, 0); if (t && !t.solid) tgt = [x, 0]; } if (tgt) { await J.swimTo(tgt[0], tgt[1], o); await T.step('up'); await T.settle(o); continue; } }
        return r;
      }
      return World.map.id === to;
    };
    // capturas desde el juego (3D + 2D juntos): primer paso en cada mapa y combates contra entrenadores
    J.pending = []; J.lastMap = null; J.lastBattle = null; J.shotAt = null; J.wildShots = 0;
    J.grab = function (name) { try { const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2; const x = c.getContext('2d'); const g3 = typeof World3D !== 'undefined' && World3D.cv && World3D.cv.style.display !== 'none'; if (g3) x.drawImage(World3D.cv, 0, 0, W * 2, H * 2); x.imageSmoothingEnabled = false; x.drawImage(Engine.canvas, 0, 0, W * 2, H * 2); J.pending.push([name, c.toDataURL('image/jpeg', 0.85)]); } catch (e) { /* sin captura */ } };
    // dibujar solo para las capturas (el simulador de video es muy lento; la lógica del juego corre igual)
    const _draw = Engine.draw.bind(Engine); J.drawOk = false;
    Engine.draw = function () { if (J.drawOk) return _draw(); if (World.player) { const pl = World.player; World.cam = [pl.px + 8 - W / 2, pl.py + 8 - H / 2]; } };
    const _grab = J.grab; J.grab = function (name) { J.drawOk = true; try { for (let i = 0; i < 45; i++) _draw(); _grab(name); } finally { J.drawOk = false; } };
    const _run = T.run.bind(T);
    T.run = async function (k = 1) {
      await _run(k);
      const m = World.map && World.map.id;
      if (m && m !== J.lastMap && T.top() === 'World') { J.lastMap = m; if (!J.seenMaps[m]) { J.seenMaps[m] = 1; J.shotAt = [T.frames + 40, 'mapa_' + m]; } }
      const B = Battle.active;
      if (B && B !== J.lastBattle && B.state === 'fight') { J.lastBattle = B; if (!B.wild || J.wildShots++ < 6 || (B.foe && B.foe.sp && B.foe.sp.legendary)) J.shotAt = [T.frames + 70, 'combate_' + (B.wild ? 'salvaje_' + B.foe.c.sp : (B.opts.name || 'entrenador'))]; }
      if (J.shotAt && T.frames >= J.shotAt[0]) { J.grab(J.shotAt[1]); J.shotAt = null; }
    };
    // registrar cada combate y cada mapa nuevo
    const _start = Battle.start.bind(Battle);
    J.lost = 0;
    Battle.start = function (o) {
      J.battles++; const label = o.wild ? 'salvaje ' + o.wild.sp + ' nv' + o.wild.lv : (o.title || '') + ' ' + (o.name || '') + ' ' + JSON.stringify(o.party);
      const pre = G.party.map((c) => c.sp + c.lv + ':' + c.hp + '/' + calcStats(c).hp).join(' ');
      const r = _start(o);
      const tr = []; let B = null;
      const iv = setInterval(() => { const b = Battle.active; if (b) B = b; if (B) { const s = `${B.state}|cap:${!!B.capture}|a:${B.ally ? B.ally.c.sp + Math.round(B.ally.hp) : '-'}|f:${B.foe ? Math.round(B.foe.hp) : '-'}|ev:${B.event}|top:${T.top()}`; if (s !== tr[tr.length - 1]) tr.push(s); if (tr.length > 12) tr.shift(); } }, 30);
      Promise.resolve(r).then((res) => { clearInterval(iv); if (o.wild && SPECIES[o.wild.sp].legendary) J.lastLegendRes = res; if (res === 'lose') { J.lost++; J.ev('   antes: ' + pre + ' | últimos estados: ' + tr.join(' > ')); } if (!o.wild || res === 'lose' || res === 'caught') J.ev('COMBATE ' + label + ' => ' + res + ' | equipo ' + G.party.map((c) => c.sp + c.lv).join(' ')); });
      return r;
    };
  });
  const state = () => p.evaluate(() => ({ map: World.map && World.map.id, obj: Objectives.current(), badges: G ? G.badges.filter(Boolean).length : 0, party: G ? G.party.map((c) => c.sp + c.lv).join(' ') : '', top: T.top(), battles: J.battles, flags: G ? Object.keys(G.flags).length : 0 }));
  const flush = async () => {
    const ev = await p.evaluate(() => J.events.splice(0)); for (const e of ev) log('  ' + e);
    const ps = await p.evaluate(() => J.pending.splice(0));
    for (const [name, url] of ps) { n++; fs.writeFileSync(path.join(OUT, 'shots', RUN + '_' + String(n).padStart(3, '0') + '_' + name.replace(/[^a-z0-9_-]/gi, '_') + '.jpg'), Buffer.from(url.split(',')[1], 'base64')); }
  };
  // paso con vigilancia: corre una función de la página con límite de tiempo
  const run = async (label, fn, arg) => {
    const t0 = Date.now();
    let r; try { r = await p.evaluate(fn, arg); } catch (e) { r = 'EXCEPCIÓN ' + e.message.slice(0, 200); }
    await flush();
    log(`${label} -> ${JSON.stringify(r)} (${Math.round((Date.now() - t0) / 1000)} s) ${JSON.stringify(await state())}`);
    return r;
  };
  // capturas automáticas: primer paso en cada mapa y primeros cuadros de cada combate
  const watchShots = async () => {
    const s = await p.evaluate(() => ({ map: World.map && World.map.id, b: !!(Battle.active && Battle.active.state === 'fight'), seen: J.seenMaps[World.map && World.map.id] }));
    if (s.map && !s.seen) { await p.evaluate((m) => { J.seenMaps[m] = 1; }, s.map); await shot('mapa_' + s.map); }
  };

  // ---------- comienzo ----------
  const hasSave = await p.evaluate(() => Game.hasSave());
  if (!hasSave) {
    await shot('titulo');
    await run('partida nueva', async () => {
      await T.until(() => T.top() === 'TitleScreen', 600);
      Scenes.top().enter(); await T.tap('KeyZ'); await T.run(5); await T.tap('KeyZ'); await T.run(10);
      if (T.top() === 'SlotScreen') { await T.tap('KeyZ'); await T.run(10); }
      return T.top();
    });
    await shot('intro');
    await run('intro y nombre', async () => {
      for (let i = 0; i < 60; i++) { const t = await T.dialog([0, 0, 0]); if (t === 'World' && !World.busy) break; await T.run(20); }
      return World.map && World.map.id;
    });
    await shot('primer_mapa');
    // inicial
    await run('laboratorio', async () => { const o = { answers: [0, 0] }; await T.travel('lab', o); await T.settle(o); const r = await T.talkTo('prof', o); await T.settle(o); return r; });
    await shot('lab');
    await run('elegir inicial', async (k) => {
      const L = World.map.starters || MAPS.lab.starters; const s = L[k]; await T.goto(s[0], s[1] - 1); World.player.dir = 'down'; await T.talk();
      for (let i = 0; i < 40; i++) { const t = T.top(); if (t === 'World' && !World.busy && !Battle.active) break; if (Battle.active) { await T.autoBattle({ dodge: 0.5 }); continue; } await T.dialog([0, 0]); await T.run(5); }
      return G.party.map((c) => c.sp);
    }, STARTER);
    await shot('inicial_elegido');
    await p.evaluate(() => Game.save());
  } else {
    await run('continuar partida guardada', async () => { await T.until(() => T.top() === 'TitleScreen', 600); Scenes.top().enter(); await T.tap('KeyZ'); await T.run(5); await T.tap('KeyZ'); await T.run(30);
      for (let i = 0; i < 10 && T.top() === 'SlotScreen'; i++) { await T.tap('KeyZ'); await T.run(30); }
      for (let i = 0; i < 10; i++) { const t = await T.dialog([0]); if (t === 'World') break; await T.run(10); } return World.map && World.map.id; });
  }

  // ---------- bucle de objetivos ----------
  const opt = { battle: { catch: false, dodge: 0.5 }, answers: [0, 1] };
  const plan = [
    // [condición del objetivo (texto), acción, nivel sugerido para el líder]
    ['Medalla Raíz', 'gym:1', 16], ['Medalla Peña', 'gym:2', 22], ['Equipo Eclipse en la Cueva Eco', 'vesper', 24], ['Medalla Oleaje', 'gym:3', 28],
    ['final del muelle', 'muelle', 28], ['Medalla Ascua', 'gym:4', 34], ['Medalla Céfiro', 'gym:5', 38], ['Gruta Umbral', 'gruta', 40],
    ['Medalla Aurora', 'gym:6', 43], ['Torre Eclipse', 'torre', 46], ['tres guardianes', 'trio', 46], ['despertado en Pueblo Alba', 'albora', 46], ['Grieta Ánima', 'grieta', 46],
  ];
  const deadline = Date.now() + (+process.env.MINUTOS || 110) * 60000;
  let last = '', tries = 0;
  while (Date.now() < deadline) {
    const st = await state();
    if (st.obj === 'Completa el Códice Ánima.') { log('FIN: solo queda completar el Códice'); break; }
    if (st.obj.includes('Grieta') && last.includes('Grieta') && tries > 1) { log('Grieta: sin completar tras 2 intentos'); break; }
    if (st.obj === last) tries++; else { tries = 0; last = st.obj; log('=== OBJETIVO: ' + st.obj); await shot('objetivo'); }
    if (tries > 5) { log('ATASCADO en el objetivo: ' + st.obj); await shot('atascado'); break; }
    const step = plan.find(([k]) => st.obj.includes(k));
    if (!step) { log('objetivo sin plan: ' + st.obj); break; }
    const [, act, lv] = step;
    // nivel: primero entrenar de verdad en la hierba; si falta mucho, se registra la ayuda
    // equipo de 4: si faltan, se suman ánimas ya vistas en la región (ayuda registrada; capturar con el bot es lento)
    const added = await p.evaluate(() => {
      const out = []; const top = J.teamLv();
      const seen = SPECIES_LIST.filter((s) => G.seen[s.id] && !s.legendary && !G.party.some((c) => c.sp === s.key) && !STAGE2[s.key] === false ? false : true);
      const pool = SPECIES_LIST.filter((s) => G.seen[s.id] && !s.legendary && !G.party.some((c) => c.sp === s.key));
      pool.sort((a, b) => (b.base.reduce((x, y) => x + y, 0)) - (a.base.reduce((x, y) => x + y, 0)));
      while (G.party.length < 4 && pool.length) { const s = pool.shift(); const c = newCreature(s.key, Math.max(5, top - 4)); Game.addCreature(c); G.caught[s.id] = true; out.push(s.key + c.lv); }
      J.assisted += out.length * 10; return out; });
    if (added.length) log('EQUIPO ASISTIDO: se suman ' + added.join(', '));
    const avg = await p.evaluate(() => J.avgLv());
    const few = false;
    if (avg < lv - 2 || few) {
      await run('entrenar en la hierba (hasta nv ' + (lv - 2) + ')', async (target) => {
        Game.healAll();
        const b0 = J.battles, t0 = T.frames;
        // esferas: si quedan pocas, se compran (equivale a pasar por la tienda)
        if ((G.bag.esfera || 0) < 5 && G.money >= 1000) { G.bag.esfera = (G.bag.esfera || 0) + 5; G.money -= 1000; J.ev('compra: 5 esferas'); }
        else if ((G.bag.esfera || 0) < 3 && G.party.length < 4) { G.bag.esfera = (G.bag.esfera || 0) + 10; J.ev('ESFERAS ASISTIDAS +10 (sin dinero: dinero $' + G.money + ')'); }
        if (!World.map.encounters || World.map.encounters.cave) {
          let best = null, bd = 99;
          for (const id in MAPS) { const m = MAPS[id]; if (!m.encounters || m.encounters.cave) continue; const r = T.route(World.map.id, id); if (!r) continue; const lvMax = Math.max(...m.encounters.list.map((e) => e.max)); if (lvMax > target + 4) continue; if (r.length < bd) { bd = r.length; best = id; } }
          if (best) await T.travel(best, { battle: { dodge: 0.5, catch: G.party.length < 4, catchAt: 0.4 }, answers: [0, 1] });
        }
        const grass = []; for (let y = 0; y < World.map.h; y++) for (let x = 0; x < World.map.w; x++) { const t = World.tileAt(x, y); if (t && t.grass) grass.push([x, y]); }
        if (!grass.length) return 'sin hierba';
        while ((J.avgLv() < target || G.party.length < 4) && J.battles - b0 < 40 && T.frames - t0 < 60 * 60 * 25) {
          const g = grass[Math.floor(Math.random() * grass.length)];
          const bo = { battle: { dodge: 0.5, catch: false }, answers: [0, 1] };
          await T.goto(g[0], g[1], bo);
          for (let k = 0; k < 8 && !Battle.active; k++) await T.step(k % 2 ? 'left' : 'right');
          await T.settle(bo); Game.healAll();
        }
        return 'combates ' + (J.battles - b0) + ', promedio nv ' + J.avgLv() + ', equipo ' + G.party.map((c) => c.sp + c.lv).join(' ');
      }, lv - 2);
      // las recién capturadas llegan con nivel bajo: se igualan al nivel del as del equipo menos 5 (ayuda registrada)
      const up = await p.evaluate(() => { const top = J.teamLv(); let n = 0; for (const c of G.party) if (c.lv < top - 5) { const d = top - 5 - c.lv; const evs = gainExp(c, expFor(top - 5) - c.exp); for (const e of evs) if (e.learn && !c.moves.includes(e.learn)) learnMoveFlow; c.hp = calcStats(c).hp; n += d; } J.assisted += n; return n; });
      if (up) log('NIVEL ASISTIDO a capturadas +' + up);
      const avg2 = await p.evaluate(() => J.avgLv());
      if (avg2 < lv - 2) { const d = await p.evaluate((lv) => { const b = J.avgLv(); T.lvlTo(lv - 2); J.assisted += (lv - 2 - b); return (lv - 2 - b); }, lv); log(`NIVEL ASISTIDO +${d} (para no pasar horas entrenando)`); }
    }
    await p.evaluate(() => Game.healAll());
    if (act.startsWith('gym:')) {
      const g = +act.split(':')[1];
      const town = { 1: 'villa_musgo', 2: 'ciudad_roca', 3: 'puerto_marea', 4: 'ciudad_brasa', 5: 'pico_cefiro', 6: 'ciudad_aurora' }[g];
      await run('viajar a ' + town, async (a) => J.travel(a[0], a[1]), [town, opt]); await watchShots();
      await run('gimnasio ' + g, async (a) => { await T.gym(a[0], a[1]); return G.badges.filter(Boolean).length; }, [g, opt]); await watchShots();
    } else if (act === 'vesper') {
      await run('Cueva Eco', async (o) => { await T.travel('cueva', o); await T.goto(28, 12, o); await T.settle(o); return Game.flag('vesper_done'); }, opt); await watchShots();
    } else if (act === 'muelle') {
      await run('muelle', async (o) => { await T.travel('puerto_marea', o); await T.goto(26, 11, o); await T.step('right'); for (let i = 0; i < 40; i++) { await T.settle(o); if (Game.flag('chapter1_done') || !World.busy) break; } return Game.flag('chapter1_done'); }, opt);
    } else if (act === 'gruta') {
      await run('Ruta 6 (nadando) y Gruta Umbral', async (o) => {
        if (!G.party.some((c) => SPECIES[c.sp].types.includes('agua'))) { const s = SPECIES_LIST.find((x) => G.seen[x.id] && x.types.includes('agua') && !x.legendary) || SPECIES.marolo; const c = newCreature(s.key, J.teamLv() - 2); if (G.party.length >= 6) G.box.push(G.party.pop()); Game.addCreature(c); J.ev('EQUIPO ASISTIDO: ' + s.key + ' (para nadar hace falta un ánima de Agua)'); } await T.travel('ruta6', o); if (World.map.id === 'ruta6') { const w = World.map.warps.find((x) => x.to === 'gruta_umbral'); const sr = await J.swimTo(w.x, w.y, o); await T.settle(o); if (World.map.id !== 'gruta_umbral') return 'nado: ' + sr + ' @' + T.pos(); } const r = World.map.id === 'gruta_umbral' ? true : await J.travel('gruta_umbral', o); if (r !== true) return r; await T.talkTo('gu_vesper', o); await T.settle(o); return Game.flag('vesper2_done'); }, opt); await watchShots();
    } else if (act === 'torre') {
      await run('Torre Eclipse', async (o) => { const r = await J.travel('torre_eclipse', o); if (r !== true) return r; await T.talkTo('te_nyx', o); await T.settle(o); for (let i = 0; i < 30 && !Game.flag('chapter2_done'); i++) await T.settle(o); return Game.flag('chapter2_done'); }, opt); await watchShots();
    } else if (act === 'trio' || act === 'albora') {
      const L = act === 'trio' ? [['bosque', 'leg_silvaneo'], ['ruta3', 'leg_auroros'], ['puerto_marea', 'leg_marealis']] : [['pueblo_alba', 'leg_albora']];
      for (const [m, id] of L) {
        await run('legendario ' + id, async (a) => { if (Game.flag(a[1])) return 'ya'; const tr = await J.travel(a[0], a[2]); if (tr !== true) return 'viaje: ' + JSON.stringify(tr); await T.talkTo(a[1], a[2]); await T.settle(a[2]);
          if (!Game.flag(a[1]) && J.lastLegendRes === 'win') { const k = a[1].slice(4); Game.setFlag(a[1]); const c = newCreature(k, MAPS[a[0]].npcs.find((n) => n.id === a[1]).lv); Game.addCreature(c); G.caught[SPECIES[k].id] = true; J.ev('CAPTURA ASISTIDA de ' + k + ' (lo venció pero no logró lanzarle la esfera)');
            if (['silvaneo', 'auroros', 'marealis'].every((x) => Game.flag('leg_' + x))) Game.setFlag('trio_done'); World.refreshNpcs(); }
          return Game.flag(a[1]); }, [m, id, { battle: { catch: false, dodge: 0.6 }, answers: [0, 1] }]); await watchShots();
      }
    }
    if (await p.evaluate(() => { const l = J.lost; J.lost = 0; return l; })) { step[2] += 3; log('DERROTA: se entrena 3 niveles más para el próximo intento (meta nv ' + step[2] + ')'); }
    if (act === 'grieta') {
      await run('Grieta Ánima', async (o) => {
        const R = RIFTS[0]; await J.travel(R.map, o);
        const adj = [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']];
        for (const [dx, dy, face] of adj) { if (!T.passable(R.x + dx, R.y + dy, true)) continue; if ((await T.goto(R.x + dx, R.y + dy, o)) !== true) continue; World.player.dir = face; await T.talk(); break; }
        for (let i = 0; i < 12; i++) { const t = T.top(); if (t === 'TextBox') { await T.tap('KeyZ'); await T.run(4); } else if (t === 'Choice') { Scenes.top().i = 0; await T.tap('KeyZ'); await T.run(8); } else if (World.map.id !== 'dng') await T.run(10); else break; }
        if (World.map.id !== 'dng') return 'no entró a la grieta (' + World.map.id + ')';
        const pisos = [];
        for (let f = 0; f < 6 && World.map.id === 'dng'; f++) {
          await T.settle(o); pisos.push(World.map.name);
          const m = World.map; let st = null, ex = null;
          for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const ch = World.charAt(x, y); if (ch === 'Ω') st = [x, y]; if (ch === 'Θ') ex = [x, y]; }
          if (World.npc('dng_boss')) { await T.talkTo('dng_boss', o); await T.settle(o); continue; }
          if (st) { await T.goto(st[0], st[1], o); await T.settle(o); await T.run(30); continue; }
          if (ex) { await T.goto(ex[0], ex[1], o); await T.settle(o); await T.run(30); continue; }
          break;
        }
        return { pisos, salida: World.map.id, limpiadas: G.stats && G.stats.dng_clears };
      }, opt);
    }
    await shot('tras_' + act.replace(':', ''));
    await p.evaluate(() => Game.save());
  }
  const fin = await p.evaluate(() => ({ asistido: J.assisted, combates: J.battles, medallas: G.badges.filter(Boolean).length, capturadas: Object.keys(G.caught).length, tiempo: Math.round(G.playTime / 60), errores: T.errors.slice(0, 30) }));
  log('RESUMEN ' + JSON.stringify(fin));
  await shot('final');
  await ctx.close();
})().catch((e) => { log('FALLÓ EL SCRIPT ' + e.stack); process.exit(1); });
