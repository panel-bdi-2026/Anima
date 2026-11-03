'use strict';
// ============================================================
//  Versión del juego y búsqueda de actualizaciones
//  - ANIMA_VERSION.v: súbela (0.01, 0.02…) cada vez que se entrega un cambio.
//  - ANIMA_VERSION.build: la reemplaza .github/workflows/pages.yml al publicar
//    (código del commit); en local queda 'dev'.
//  - En la pantalla de título se compara con el archivo publicado: si hay una
//    versión más nueva, la app se recarga sola; si no, dice «Versión más reciente».
// ============================================================
const ANIMA_VERSION = { v: '0.01', build: 'dev' };

const Updater = {
  state: 'idle', t: 0, shownT: 0, newV: null,
  label() { return (window.AnimaCanal && AnimaCanal.isPreview ? 'PRUEBA' : 'BETA') + ' v' + ANIMA_VERSION.v; },
  check() {
    if (this.state === 'checking' || this.state === 'updating') return;
    if (!location.protocol.startsWith('http')) { this.state = 'ok'; this.shownT = 0; return; }
    this.state = 'checking'; this.t = 0; this.result = null;
    fetch('js/version.js', { cache: 'no-store' })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
      .then((txt) => {
        const v = (txt.match(/\bv:\s*'([^']*)'/) || [])[1], b = (txt.match(/\bbuild:\s*'([^']*)'/) || [])[1];
        if (v && (v !== ANIMA_VERSION.v || b !== ANIMA_VERSION.build)) {
          // como mucho una recarga por minuto, por si el servidor tarda en dar los archivos nuevos
          let last = 0;
          try { last = +sessionStorage.getItem('anima_recarga') || 0; } catch (e) { /* sin almacenamiento */ }
          if (Date.now() - last > 60000) {
            try { sessionStorage.setItem('anima_recarga', String(Date.now())); } catch (e) { /* sin almacenamiento */ }
            this.newV = v; this.result = 'updating'; return;
          }
        }
        this.result = 'ok';
      })
      .catch(() => { this.result = 'offline'; });
  },
  update(dt) {
    this.t += dt; this.shownT += dt;
    // «Buscando…» se ve al menos un momento, para que se note que se comprobó
    if (this.state === 'checking' && this.result && this.t > 0.9) {
      this.state = this.result; this.shownT = 0;
      if (this.state === 'updating') setTimeout(() => location.reload(), 900);
    }
  },
  draw(ctx) {
    const x = 6, y = 226, lab = this.label(), bw = Font.width(lab) + 10;
    P(ctx, x, y, bw, 11, '#1a0c24'); P(ctx, x, y, bw, 1, '#ffd048');
    Font.draw(ctx, lab, x + 5, y + 2, '#ffd048');
    let msg = '', col = '#ffe8d8';
    if (this.state === 'checking') msg = 'Buscando actualización' + '.'.repeat(1 + (Math.floor(this.t * 3) % 3));
    else if (this.state === 'updating') { msg = 'Actualizando a v' + this.newV + '…'; col = '#ffd048'; }
    else if (this.state === 'ok' && this.shownT < 6) { msg = '✓ Versión más reciente'; col = '#a8f0a0'; }
    else if (this.state === 'offline' && this.shownT < 6) msg = 'Sin conexión: versión guardada';
    if (msg) {
      const a = this.state === 'ok' || this.state === 'offline' ? U.clamp(6 - this.shownT, 0, 1) : 1;
      ctx.globalAlpha = a; Font.drawOutlined(ctx, msg, x + bw + 6, y + 2, col, '#1a0c24'); ctx.globalAlpha = 1;
    }
  },
};

// ---------- pantalla de título ----------
{
  const TS = TitleScreen.prototype, _enter = TS.enter, _update = TS.update, _draw = TS.draw;
  TS.enter = function () { const r = _enter.apply(this, arguments); Updater.check(); return r; };
  TS.update = function (dt) { Updater.update(dt); return _update.call(this, dt); };
  TS.draw = function (ctx) {
    _draw.call(this, ctx);
    // en el título 3D, tras la entrada de cámara
    if (this.classic || this.t > 4.5) Updater.draw(ctx);
  };
  // al volver a la app (estaba en segundo plano) con el título en pantalla, se busca de nuevo
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Scenes.top() instanceof TitleScreen) Updater.check();
  });
}
