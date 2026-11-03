'use strict';
// ============================================================
//  Versión publicada y versión de prueba
//  - La publicada vive en la carpeta del juego (…/Anima/).
//  - La de prueba vive en la subcarpeta prueba/ (…/Anima/prueba/), la publica
//    .github/workflows/pages.yml con el Pull Request abierto que cambió más
//    recientemente. Al estar dentro de la carpeta del juego, la app instalada
//    la abre en su propia ventana, sin navegador ni links.
//  - En la de prueba, las partidas y opciones se guardan aparte: cada clave de
//    localStorage lleva el prefijo PFX. Así lo que haga la prueba nunca toca lo
//    publicado. Se cubren getItem/setItem/removeItem/key/length/clear (lo único
//    que usa el juego); el acceso como propiedad (localStorage.algo) no.
//  - Este archivo se carga antes que todo lo demás. El flujo de publicación lo
//    inyecta también en la prueba si el Pull Request es anterior a él, para que
//    la separación y el aviso funcionen siempre.
// ============================================================
(() => {
  if (window.AnimaCanal) return; // ya cargado (inyectado y también en index.html)
  const DIR = 'prueba/', PFX = 'anima_prueba__';
  const path = location.pathname;
  const at = path.indexOf('/' + DIR);
  const isPreview = at >= 0;
  // carpeta de la versión publicada, con barra final (p. ej. /Anima/)
  const BASE = isPreview ? path.slice(0, at + 1) : path.slice(0, path.lastIndexOf('/') + 1);
  let LS = null;
  try { LS = window.localStorage; } catch (e) { /* sin almacenamiento */ }

  // ---------- almacenamiento separado en la prueba ----------
  const P = Storage.prototype, oGet = P.getItem, oSet = P.setItem, oRem = P.removeItem, oKey = P.key, oClear = P.clear;
  const lenDesc = Object.getOwnPropertyDescriptor(P, 'length');
  const rawKeys = () => { const out = []; if (!LS) return out; const n = lenDesc.get.call(LS); for (let i = 0; i < n; i++) { const k = oKey.call(LS, i); if (k !== null) out.push(k); } return out; };
  const previewKeys = () => rawKeys().filter((k) => k.startsWith(PFX)).map((k) => k.slice(PFX.length));
  if (isPreview && LS) {
    P.getItem = function (k) { return oGet.call(this, this === LS ? PFX + k : k); };
    P.setItem = function (k, v) { return oSet.call(this, this === LS ? PFX + k : k, v); };
    P.removeItem = function (k) { return oRem.call(this, this === LS ? PFX + k : k); };
    P.key = function (i) { if (this !== LS) return oKey.call(this, i); const ks = previewKeys(); return i >= 0 && i < ks.length ? ks[i] : null; };
    P.clear = function () { if (this !== LS) return oClear.call(this); for (const k of previewKeys()) oRem.call(this, PFX + k); };
    Object.defineProperty(P, 'length', { configurable: true, enumerable: true, get() { return this === LS ? previewKeys().length : lenDesc.get.call(this); } });
  }

  // partidas = ranuras de guardado y la última ranura usada (las opciones no se copian)
  const isSaveKey = (k) => k.startsWith('anima_region_alba_save') || k === 'anima_region_alba_last_slot';

  const Canal = {
    isPreview, BASE, info: null, status: 'loading',
    // copia las partidas publicadas a la prueba; las publicadas no se modifican
    copyPublished() {
      if (!isPreview || !LS) return 0;
      for (const k of previewKeys()) if (isSaveKey(k)) oRem.call(LS, PFX + k);
      let n = 0;
      for (const k of rawKeys()) if (!k.startsWith(PFX) && isSaveKey(k)) { oSet.call(LS, PFX + k, oGet.call(LS, k)); if (k !== 'anima_region_alba_last_slot') n++; }
      return n;
    },
    publishedSaveCount() { return rawKeys().filter((k) => !k.startsWith(PFX) && isSaveKey(k) && k !== 'anima_region_alba_last_slot').length; },
    goPreview() { location.replace(BASE + DIR); },
    goPublished() { location.replace(BASE); },
    // texto corto que describe la prueba (p. ej. «#12 · Nuevo pueblo»)
    label() { const i = this.info; return i && i.pr ? `#${i.pr} · ${i.title || ''}` : ''; },
    // datos de la prueba publicada (número y título del Pull Request); null si no hay
    refresh() {
      return fetch((isPreview ? '' : DIR) + 'canal.json', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => { this.info = j && j.pr ? j : null; this.status = this.info ? 'ok' : 'none'; })
        .catch(() => { this.info = null; this.status = 'none'; })
        .then(() => { if (this.onInfo) this.onInfo(); return this.info; });
    },
  };
  window.AnimaCanal = Canal;
  if (location.protocol.startsWith('http')) Canal.refresh(); else Canal.status = 'none';
  if (!isPreview) return;

  // ---------- aviso fijo «versión de prueba» ----------
  const css = `
#canal-prueba{position:fixed;left:calc(env(safe-area-inset-left,0px) + 6px);top:calc(env(safe-area-inset-top,0px) + 6px);z-index:20;
  font:bold 11px/1 system-ui,sans-serif;color:#fff;background:rgba(200,70,20,.9);border:1px solid #ffd0a0;border-radius:8px;padding:6px 9px;
  box-shadow:0 1px 5px rgba(0,0,0,.5);cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none;letter-spacing:.5px}
#canal-panel{position:fixed;left:calc(env(safe-area-inset-left,0px) + 6px);top:calc(env(safe-area-inset-top,0px) + 36px);z-index:21;display:none;flex-direction:column;gap:8px;
  padding:12px;background:#2a1638;color:#fff;font:13px/1.35 system-ui,sans-serif;border:2px solid #ffb060;border-radius:10px;width:min(320px,calc(100vw - 24px));box-sizing:border-box}
#canal-panel.open{display:flex}
#canal-panel button{font:bold 13px system-ui,sans-serif;border:0;border-radius:8px;padding:9px;cursor:pointer;color:#2a1638;background:#ffd048;touch-action:manipulation}
#canal-panel button.sec{background:#c8b0e0}
#canal-panel .msg{color:#ffe2a8}`;
  const build = () => {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    // etiqueta pequeña en la esquina superior izquierda; al tocarla se abre el panel
    const bar = document.createElement('button'); bar.type = 'button'; bar.id = 'canal-prueba'; bar.textContent = 'VERSIÓN DE PRUEBA';
    const panel = document.createElement('div'); panel.id = 'canal-panel';
    const info = document.createElement('div');
    const msg = document.createElement('div'); msg.className = 'msg';
    const mk = (txt, cls, fn) => { const x = document.createElement('button'); x.type = 'button'; x.textContent = txt; if (cls) x.className = cls; x.addEventListener('click', fn); return x; };
    const back = mk('Volver a la versión publicada', '', () => Canal.goPublished());
    const copy = mk('Copiar aquí las partidas publicadas', 'sec', () => {
      if (!confirm('Las partidas de prueba se reemplazarán por una copia de las publicadas. Las publicadas no cambian. El juego se reiniciará: lo no guardado en la prueba se pierde. ¿Seguir?')) return;
      const n = Canal.copyPublished();
      msg.textContent = n ? `Copiadas ${n} partida(s). Reiniciando…` : 'No hay partidas publicadas para copiar.';
      if (n) setTimeout(() => location.reload(), 700);
    });
    const close = mk('Cerrar', 'sec', () => panel.classList.remove('open'));
    panel.append(info, back, copy, close, msg);
    const showInfo = () => {
      const l = Canal.label();
      info.textContent = (l ? `Estás en la versión de prueba (Pull Request ${l}). ` : 'Estás en la versión de prueba. ') + 'Sus partidas y opciones están separadas de la versión publicada.';
    };
    showInfo(); Canal.onInfo = showInfo;
    bar.addEventListener('click', () => { msg.textContent = ''; panel.classList.toggle('open'); });
    // que el juego no reciba los toques ni clics del aviso
    for (const el of [bar, panel]) for (const ev of ['mousedown', 'pointerdown', 'touchstart']) el.addEventListener(ev, (e) => e.stopPropagation());
    document.body.append(bar, panel);
  };
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
