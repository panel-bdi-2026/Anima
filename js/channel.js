'use strict';
// ============================================================
//  Versión publicada y versiones de prueba
//  - La publicada vive en la carpeta del juego (…/Anima/).
//  - Cada Pull Request abierto se publica en …/Anima/prueba/pr-N/
//    (.github/workflows/pages.yml). La lista está en prueba/cambios.json y los
//    datos de cada uno (título, escenario…) en prueba/pr-N/canal.json.
//    Al estar dentro de la carpeta del juego, la app instalada los abre en su
//    propia ventana, sin navegador ni links.
//  - En una prueba, partidas y opciones se guardan aparte: cada clave de
//    localStorage lleva el prefijo de esa prueba. Se cubren getItem/setItem/
//    removeItem/key/length/clear (lo único que usa el juego); el acceso como
//    propiedad (localStorage.algo) no.
//  - Escenario: el Pull Request puede indicar a qué parte del juego llevar
//    directamente (un combate, una pantalla, un mapa) con una partida armada
//    al vuelo. Ver «Escenario de prueba» en CLAUDE.md.
//  - Revisión: Aceptar (une el cambio), Rechazar (cierra el Pull Request),
//    Reintentar y Revisar con Claude (deja una nota). Aceptar, Rechazar y la
//    nota usan una llave de GitHub que se pega una vez en la app.
//  - Este archivo se carga antes que todo lo demás. El flujo de publicación lo
//    inyecta también en las pruebas que no lo tengan.
// ============================================================
(() => {
  if (window.AnimaCanal) return; // ya cargado (inyectado y también en index.html)
  const path = location.pathname;
  const at = path.indexOf('/prueba/');
  const isPreview = at >= 0;
  const prMatch = isPreview ? path.slice(at).match(/^\/prueba\/pr-(\d+)\//) : null;
  const PR = prMatch ? +prMatch[1] : null;
  const PFX = PR ? `anima_prueba_${PR}__` : 'anima_prueba__';
  // carpeta de la versión publicada, con barra final (p. ej. /Anima/)
  const BASE = isPreview ? path.slice(0, at + 1) : path.slice(0, path.lastIndexOf('/') + 1);
  const TOKEN_KEY = 'anima_github_llave';
  // cambios aceptados o rechazados desde este aparato: se ocultan de la lista mientras GitHub
  // vuelve a publicar (tarda un par de minutos en sacarlos de prueba/cambios.json)
  const DONE_KEY = 'anima_prueba_resueltos';
  // cambio aceptado que GitHub todavía está publicando: { pr, sha, t }
  const PUB_KEY = 'anima_publicando';
  let LS = null;
  try { LS = window.localStorage; } catch (e) { /* sin almacenamiento */ }

  // ---------- almacenamiento separado en la prueba ----------
  const P = Storage.prototype, oGet = P.getItem, oSet = P.setItem, oRem = P.removeItem, oKey = P.key, oClear = P.clear;
  const lenDesc = Object.getOwnPropertyDescriptor(P, 'length');
  const rawKeys = () => { const out = []; if (!LS) return out; const n = lenDesc.get.call(LS); for (let i = 0; i < n; i++) { const k = oKey.call(LS, i); if (k !== null) out.push(k); } return out; };
  const previewKeys = () => rawKeys().filter((k) => k.startsWith(PFX)).map((k) => k.slice(PFX.length));
  const isPreviewKey = (k) => k.startsWith('anima_prueba_');
  if (isPreview && LS) {
    P.getItem = function (k) { return oGet.call(this, this === LS ? PFX + k : k); };
    P.setItem = function (k, v) { return oSet.call(this, this === LS ? PFX + k : k, v); };
    P.removeItem = function (k) { return oRem.call(this, this === LS ? PFX + k : k); };
    P.key = function (i) { if (this !== LS) return oKey.call(this, i); const ks = previewKeys(); return i >= 0 && i < ks.length ? ks[i] : null; };
    P.clear = function () { if (this !== LS) return oClear.call(this); for (const k of previewKeys()) oRem.call(this, PFX + k); };
    Object.defineProperty(P, 'length', { configurable: true, enumerable: true, get() { return this === LS ? previewKeys().length : lenDesc.get.call(this); } });
  }
  const rawGet = (k) => (LS ? oGet.call(LS, k) : null);
  const rawSet = (k, v) => { if (LS) { if (v === null) oRem.call(LS, k); else oSet.call(LS, k, v); } };

  // partidas = ranuras de guardado y la última ranura usada (las opciones no se copian)
  const isSaveKey = (k) => k.startsWith('anima_region_alba_save') || k === 'anima_region_alba_last_slot';

  const getJSON = (url) => fetch(url, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const Canal = {
    isPreview, pr: PR, BASE, info: null, list: [], status: 'loading', scenarioActive: false,
    // ---------- partidas ----------
    copyPublished() {
      if (!isPreview || !LS) return 0;
      for (const k of previewKeys()) if (isSaveKey(k)) oRem.call(LS, PFX + k);
      let n = 0;
      for (const k of rawKeys()) if (!isPreviewKey(k) && isSaveKey(k)) { oSet.call(LS, PFX + k, oGet.call(LS, k)); if (k !== 'anima_region_alba_last_slot') n++; }
      return n;
    },
    publishedSaveCount() { return rawKeys().filter((k) => !isPreviewKey(k) && isSaveKey(k) && k !== 'anima_region_alba_last_slot').length; },
    // ---------- navegación ----------
    goPreview(n) { location.replace(BASE + 'prueba/pr-' + n + '/#probar'); },
    goPublished() { location.replace(BASE); },
    // publicada: lista de pruebas; prueba: sus propios datos
    refresh() {
      const p = isPreview
        ? getJSON('canal.json').then((j) => { this.info = j && j.pr ? j : null; this.status = this.info ? 'ok' : 'none'; })
        : getJSON('prueba/cambios.json').then((j) => { const done = this.resolved(); this.list = (j && Array.isArray(j.cambios) ? j.cambios : []).filter((c) => !done[c.pr]); this.status = this.list.length ? 'ok' : 'none'; });
      return p.then(() => { if (this.onInfo) this.onInfo(); return isPreview ? this.info : this.list; });
    },
    // ---------- GitHub (Aceptar, Rechazar, nota) ----------
    token() { return rawGet(TOKEN_KEY) || ''; },
    setToken(t) { rawSet(TOKEN_KEY, t ? t.trim() : null); },
    async gh(method, url, body) {
      const repo = (this.info && this.info.repo) || 'panel-bdi-2026/Anima';
      const r = await fetch(`https://api.github.com/repos/${repo}${url}`, {
        method, headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + this.token(), 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      let j = null; try { j = await r.json(); } catch (e) { /* sin cuerpo */ }
      if (!r.ok) {
        const why = r.status === 401 ? 'la llave no es válida o venció' : r.status === 403 || r.status === 404 ? 'la llave no tiene permiso para esto' : r.status === 405 || r.status === 409 ? 'GitHub no permite unirlo ahora (puede que choque con otro cambio)' : 'error ' + r.status;
        throw new Error(why + (j && j.message ? ` (${j.message})` : ''));
      }
      return j;
    },
    resolved() {
      let d = {};
      try { d = JSON.parse(rawGet(DONE_KEY) || '{}') || {}; } catch (e) { /* dato dañado */ }
      for (const k of Object.keys(d)) if (Date.now() - d[k] > 30 * 60000) delete d[k]; // a los 30 minutos ya no hace falta
      return d;
    },
    // ¿hay un cambio aceptado que todavía no está en vivo? Se sabe porque la versión publicada
    // (js/version.js, campo build) pasa a ser el código del cambio unido. Como mucho 15 minutos.
    async publishing() {
      let p = null;
      try { p = JSON.parse(rawGet(PUB_KEY) || 'null'); } catch (e) { /* dato dañado */ }
      if (!p || !p.sha) return null;
      if (Date.now() - p.t > 15 * 60000) { rawSet(PUB_KEY, null); return null; }
      try {
        const txt = await fetch(BASE + 'js/version.js', { cache: 'no-store' }).then((r) => (r.ok ? r.text() : ''));
        const b = (txt.match(/\bbuild:\s*'([^']*)'/) || [])[1];
        if (b && b !== 'dev' && p.sha.startsWith(b)) { rawSet(PUB_KEY, null); return Object.assign(p, { done: true }); }
      } catch (e) { /* sin conexión: se sigue esperando */ }
      return p;
    },
    markResolved() { const d = this.resolved(); d[PR] = Date.now(); rawSet(DONE_KEY, JSON.stringify(d)); },
    note(text) { return this.gh('POST', `/issues/${PR}/comments`, { body: text }); },
    async accept() {
      const r = await this.gh('PUT', `/pulls/${PR}/merge`, { merge_method: 'squash', sha: this.info && this.info.sha });
      this.markResolved();
      if (r && r.sha) rawSet(PUB_KEY, JSON.stringify({ pr: PR, sha: r.sha, t: Date.now() }));
      try { await this.note('✅ Cambio aceptado desde la app.'); } catch (e) { /* la unión ya se hizo */ }
    },
    async reject() {
      try { await this.note('❌ Cambio rechazado desde la app.'); } catch (e) { /* seguir y cerrar igual */ }
      await this.gh('PATCH', `/pulls/${PR}`, { state: 'closed' });
      this.markResolved();
    },
    // ---------- escenario de prueba ----------
    escenarios: {}, // escenarios con código propio: AnimaCanal.escenarios.nombre = async (cfg) => { … }
    async runScenario(cfg) {
      // sin escenario: se muestra la pantalla de título (su entrada) y luego la revisión
      cfg = cfg || (this.info && this.info.escenario) || { tipo: 'titulo' };
      const tipo = cfg.tipo || 'mapa';
      const until = (f) => new Promise((res) => { const k = () => (f() ? res() : setTimeout(k, 200)); k(); });
      this.scenarioActive = true;
      if (tipo === 'titulo') {
        // la entrada del título se ve completa; mientras tanto el menú no responde
        let ts = Scenes.stack.find((x) => x instanceof TitleScreen);
        if (!ts) { Scenes.clear(); ts = Scenes.push(new TitleScreen()); }
        ts.menu = false; ts.t = 0; ts.busy = true; Fade.a = 0;
        await until(() => ts.t >= (cfg.segundos || 7));
        ts.busy = false;
        if (this.openPanel) this.openPanel('fin');
        return true;
      }
      // la partida del escenario es de mentira: no se guarda
      if (!Game._canalSave) { const s = Game.save; Game._canalSave = s; Game.save = function () { return Canal.scenarioActive ? true : s.apply(this, arguments); }; }
      G = newGameState(); // eslint-disable-line no-global-assign
      G.name = cfg.nombre || 'Prueba'; G.rival = 'Rival'; G.rivalStarter = 'semillin';
      for (const f of ['met_prof', 'got_starter', 'got_dex', 'rival1_left', 'tut_battle', 'mom_talk', 'starter_taken_burbujo', 'starter_taken_semillin'].concat(cfg.flags || [])) G.flags[f] = true;
      for (const [k, lv] of (cfg.equipo || [['ignito', 15]])) Game.addCreature(newCreature(k, lv));
      Object.assign(G.bag, { esfera: 10, pocion: 5 }, cfg.mochila || {});
      if (cfg.dinero !== undefined) G.money = cfg.dinero;
      for (let i = 0; i < (cfg.medallas || 0); i++) G.badges[i] = true;
      if (cfg.hora !== undefined) G.time = cfg.hora * 60; // hora del día (0-24), p. ej. 20 para ver la noche
      G.map = cfg.mapa || 'ruta1'; G.x = cfg.x !== undefined ? cfg.x : 10; G.y = cfg.y !== undefined ? cfg.y : 8;
      Scenes.clear(); World.map = null; World.start(); Fade.a = 0;
      await wait(0.4);
      const arg = (a) => (typeof a === 'string' && /^\$equipo\d+$/.test(a) ? G.party[+a.slice(7)] : a);
      try {
        if (tipo === 'combate') {
          const rival = cfg.rival || [['burbujo', 12]];
          await World.runScript(async () => {
            if (cfg.salvaje) await Battle.wild(newCreature(rival[0][0], rival[0][1]));
            else await Battle.trainer({ title: 'Prueba', cls: 'Entrenador', name: 'Rival', party: rival, skill: cfg.dificultad !== undefined ? cfg.dificultad : 0.5, boss: !!cfg.jefe });
          });
        } else if (tipo === 'pantalla') {
          if (!/^[A-Za-z_$][\w$]*$/.test(cfg.pantalla || '')) throw new Error('pantalla no válida: ' + cfg.pantalla);
          const Cls = Function('return ' + cfg.pantalla)();
          await World.runScript(async () => { await runScene(new Cls(...(cfg.args || []).map(arg))); });
        } else if (this.escenarios[tipo]) {
          await World.runScript(() => this.escenarios[tipo](cfg));
        } else if (cfg.segundos) {
          await wait(cfg.segundos); // 'mapa' con «segundos»: se recorre un rato y luego la revisión
        } else return true; // 'mapa' sin «segundos»: se juega libre; la revisión se abre con la etiqueta de la esquina
      } catch (e) { console.error(e); }
      if (this.openPanel) this.openPanel('fin');
      return true;
    },
  };
  window.AnimaCanal = Canal;
  if (location.protocol.startsWith('http')) Canal.refresh(); else Canal.status = 'none';
  if (!isPreview) return;

  // al abrir la prueba desde el menú VERSIÓN (#probar), se va directo al escenario
  window.addEventListener('load', () => {
    if (!/probar/.test(location.hash)) return;
    history.replaceState(null, '', location.pathname); // al recargar a mano, no se repite solo
    const start = () => Canal.runScenario();
    Canal.refresh().then(() => setTimeout(start, 300));
  });

  // ---------- etiqueta «versión de prueba» y panel de revisión ----------
  // El panel es una ventana centrada sobre el juego oscurecido, con solo 4 botones.
  const css = `
#canal-prueba{position:fixed;left:calc(env(safe-area-inset-left,0px) + 6px);top:calc(env(safe-area-inset-top,0px) + 6px);z-index:20;
  font:bold 11px/1 system-ui,sans-serif;color:#fff;background:rgba(200,70,20,.9);border:1px solid #ffd0a0;border-radius:8px;padding:6px 9px;
  box-shadow:0 1px 5px rgba(0,0,0,.5);cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none;letter-spacing:.5px}
#canal-panel{position:fixed;inset:0;z-index:21;display:none;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;background:rgba(5,3,10,.6)}
#canal-panel.open{display:flex}
#canal-panel .box{display:flex;flex-direction:column;gap:8px;padding:14px;background:#2a1638;color:#fff;font:14px/1.35 system-ui,sans-serif;
  border:2px solid #ffb060;border-radius:12px;width:min(380px,100%);max-height:100%;overflow:auto;box-sizing:border-box;touch-action:pan-y}
#canal-panel .row{display:flex;gap:8px}
#canal-panel .row button{flex:1}
#canal-panel button{font:bold 14px system-ui,sans-serif;border:0;border-radius:9px;padding:11px 8px;cursor:pointer;color:#2a1638;background:#c8b0e0;touch-action:manipulation}
#canal-panel button:disabled{opacity:.5}
#canal-panel button.ok{background:#7ad070}
#canal-panel button.no{background:#f08070}
#canal-panel button.main{background:#ffd048}
#canal-panel textarea,#canal-panel input{font:14px system-ui,sans-serif;border-radius:6px;border:1px solid #9a6ac0;padding:7px;background:#1a0c24;color:#fff;width:100%;box-sizing:border-box;margin-bottom:6px}
#canal-panel textarea{min-height:64px;resize:vertical}
#canal-panel .msg{color:#ffe2a8}
#canal-panel .msg:empty{display:none}
#canal-panel .t{font-weight:bold;color:#ffd048}
#canal-panel .hide{display:none}`;
  const build = () => {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const el = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt) x.textContent = txt; return x; };
    const btn = (txt, cls, fn) => { const x = el('button', cls, txt); x.type = 'button'; x.addEventListener('click', fn); return x; };
    const row = (...k) => { const r = el('div', 'row'); r.append(...k); return r; };
    // etiqueta pequeña en la esquina superior izquierda; al tocarla se abre el panel
    const bar = el('button', '', 'VERSIÓN DE PRUEBA'); bar.type = 'button'; bar.id = 'canal-prueba';
    const panel = el('div'); panel.id = 'canal-panel';
    const box = el('div', 'box'), title = el('div', 't'), msg = el('div', 'msg');
    // nota para Claude (aparece al tocar «Revisar con Claude»)
    const noteBox = el('div', 'hide'), noteTxt = el('textarea');
    noteTxt.placeholder = 'Qué viste o qué cambiarías (opcional)';
    // llave de GitHub (solo se pide la primera vez)
    const keyBox = el('div', 'hide'), keyIn = el('input');
    keyIn.type = 'password'; keyIn.placeholder = 'Pega aquí la llave de GitHub'; keyIn.autocomplete = 'off';
    let pending = null, atEnd = false; // acción que espera la llave; panel abierto al terminar la prueba
    const say = (t) => { msg.textContent = t; };
    const needKey = (fn) => { if (Canal.token()) return fn(); pending = fn; keyBox.classList.remove('hide'); say('La primera vez, la app necesita la llave de GitHub.'); keyIn.focus(); };
    const busy = (on) => { for (const b of box.querySelectorAll('button')) b.disabled = on; };
    const act = async (fn, okMsg) => {
      busy(true); say('Enviando a GitHub…');
      try { await fn(); say(okMsg); setTimeout(() => Canal.goPublished(), 1800); }
      catch (e) {
        say('No se pudo: ' + e.message); busy(false);
        if (/llave/.test(e.message)) { Canal.setToken(''); } // si la llave falló, se vuelve a pedir la próxima vez
      }
    };
    keyBox.append(keyIn, row(
      btn('Guardar llave', 'main', () => { if (!keyIn.value.trim()) return; Canal.setToken(keyIn.value); keyIn.value = ''; keyBox.classList.add('hide'); say(''); const f = pending; pending = null; if (f) f(); }),
      btn('Cancelar', '', () => { keyBox.classList.add('hide'); pending = null; say(''); }),
    ));
    const accept = btn('Aceptar', 'ok', () => {
      if (!confirm('¿Aceptar este cambio? Pasa a la versión publicada en un par de minutos.')) return;
      needKey(() => act(() => Canal.accept(), '¡Aceptado! La versión publicada se actualiza en un par de minutos.'));
    });
    const reject = btn('Rechazar', 'no', () => {
      if (!confirm('¿Rechazar este cambio? Se descarta y la versión publicada no cambia.')) return;
      needKey(() => act(() => Canal.reject(), 'Rechazado. Volviendo a la versión publicada…'));
    });
    const retry = btn('Ver de nuevo', '', () => { location.replace(location.pathname + '#probar'); location.reload(); });
    const sendNote = () => {
      const t = noteTxt.value.trim();
      if (!t) { Canal.goPublished(); return; }
      needKey(() => act(() => Canal.note('📝 Nota de Alejandro desde la app:\n\n' + t), 'Nota enviada. Volviendo a la versión publicada…'));
    };
    const claude = btn('Revisar con Claude', '', () => { noteBox.classList.remove('hide'); noteTxt.focus(); say('Si quieres, deja una nota para Claude. Luego vuelves a la versión publicada.'); });
    noteBox.append(noteTxt, row(btn('Enviar y volver', 'main', sendNote), btn('Volver sin nota', '', () => Canal.goPublished())));
    const back = btn('Volver a la versión publicada', 'main', () => Canal.goPublished()); // solo sin Pull Request (pruebas locales)
    const review = [row(accept, reject), row(retry, claude)];
    box.append(title, msg, ...review, noteBox, keyBox, back);
    panel.append(box);
    const showInfo = () => {
      const i = Canal.info;
      title.textContent = i ? `Cambio #${i.pr}: ${i.title}` : 'Versión de prueba';
      for (const r of review) r.classList.toggle('hide', !PR);
      back.classList.toggle('hide', !!PR);
    };
    Canal.openPanel = (why) => {
      atEnd = why === 'fin'; showInfo(); noteBox.classList.add('hide'); keyBox.classList.add('hide');
      say(atEnd ? '¿Qué hacemos con este cambio?' : ''); panel.classList.add('open');
    };
    showInfo(); Canal.onInfo = showInfo;
    bar.addEventListener('click', () => Canal.openPanel());
    // tocar fuera de la ventana la cierra, salvo al terminar la prueba (ahí hay que elegir)
    panel.addEventListener('click', (e) => { if (e.target === panel && !atEnd) panel.classList.remove('open'); });
    // que el juego no reciba los toques, clics ni teclas del panel
    for (const x of [bar, panel]) for (const ev of ['mousedown', 'pointerdown', 'touchstart', 'keydown', 'keyup']) x.addEventListener(ev, (e) => e.stopPropagation());
    document.body.append(bar, panel);
  };
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
