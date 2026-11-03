'use strict';
// ============================================================
//  Opción «VERSIÓN» en la pantalla de título: pasar entre la versión
//  publicada y la de prueba, y copiar partidas a la prueba (ver js/channel.js)
// ============================================================
{
  const C = window.AnimaCanal;
  // los textos del juego solo tienen letras, números y signos básicos
  const clean = (s, n) => { s = String(s || '').replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ¿¡.,:;!?()#"+/\- ]/g, '').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const TS = TitleScreen.prototype;
  const _opts = TS.options;
  TS.options = function () { return C ? _opts.call(this).concat(['VERSIÓN']) : _opts.call(this); };
  const _pick = TS.pick;
  TS.pick = async function () {
    if (this.options()[this.i] !== 'VERSIÓN') return _pick.call(this);
    this.busy = true;
    try {
      if (C.status === 'loading') await C.refresh();
      const pr = C.info ? `#${C.info.pr}: ${clean(C.info.title, 40)}` : '';
      if (C.isPreview) {
        const r = await ask(`VERSIÓN DE PRUEBA${pr ? ' ' + pr : ''}. Partidas y opciones aparte.`, ['Volver a la publicada', 'Copiar partidas publicadas', 'Cancelar']);
        if (r === 0) { await Fade.out(0.4); C.goPublished(); return; }
        if (r === 1) {
          if (!C.publishedSaveCount()) await say('No hay partidas publicadas que copiar.');
          else {
            const ok = await ask('Las partidas de prueba se reemplazarán por una copia de las publicadas. Las publicadas no cambian. ¿Seguir?', ['Sí', 'No']);
            if (ok === 0) {
              const n = C.copyPublished();
              Game.slot = U.clamp(parseInt(localStorage.getItem('anima_region_alba_last_slot') || '0', 10) || 0, 0, 2);
              this.hasSave = Game.hasSave(); this.sum = Game.saveSummary(); this.i = 0;
              await say(`Listo: ${n} partida(s) copiadas a la versión de prueba.`);
            }
          }
        }
      } else if (!C.info) {
        await say('Ahora mismo no hay ninguna versión de prueba publicada.');
      } else {
        const r = await ask(`Versión de prueba ${pr}. Tus partidas no se tocan. ¿Ir a la prueba?`, ['Sí', 'No']);
        if (r === 0) { await Fade.out(0.4); C.goPreview(); return; }
      }
    } catch (e) { console.error(e); }
    this.busy = false;
  };
}
