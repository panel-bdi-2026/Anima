'use strict';
// ============================================================
//  Opción «VERSIÓN» en la pantalla de título (ver js/channel.js)
//  - Publicada: lista de cambios en prueba; al elegir uno se abre directo en
//    su escenario de prueba.
//  - Prueba: probar el cambio otra vez, revisarlo (aceptar, rechazar…),
//    volver a la publicada o copiar las partidas publicadas.
// ============================================================
{
  const C = window.AnimaCanal;
  // los textos del juego solo tienen letras, números y signos básicos
  const clean = (s, n) => { s = String(s || '').replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ¿¡.,:;!?()#"+/\- ]/g, '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const TS = TitleScreen.prototype;
  const _opts = TS.options;
  TS.options = function () { return C ? _opts.call(this).concat(['VERSIÓN']) : _opts.call(this); };
  const _pick = TS.pick;
  TS.pick = async function () {
    if (this.options()[this.i] !== 'VERSIÓN') return _pick.call(this);
    this.busy = true;
    try {
      if (C.isPreview) {
        if (C.status === 'loading') await C.refresh();
        const opts = [], acts = [];
        if (C.info && C.info.escenario) { opts.push('Probar el cambio'); acts.push('probar'); }
        if (C.pr) { opts.push('Revisar el cambio'); acts.push('revisar'); }
        opts.push('Volver a la publicada', 'Copiar partidas publicadas', 'Cancelar'); acts.push('volver', 'copiar', null);
        const head = C.info ? `Cambio #${C.info.pr}: ${clean(C.info.title, 60)}.` : 'Versión de prueba.';
        const r = await ask(head + ' Partidas y opciones aparte.', opts);
        const a = acts[r];
        if (a === 'probar') { await Fade.out(0.4); Scenes.pop(this); C.runScenario(); return; }
        if (a === 'revisar') C.openPanel();
        if (a === 'volver') { await Fade.out(0.4); C.goPublished(); return; }
        if (a === 'copiar') {
          if (!C.publishedSaveCount()) await say('No hay partidas publicadas que copiar.');
          else if ((await ask('Las partidas de esta prueba se reemplazarán por una copia de las publicadas. Las publicadas no cambian. ¿Seguir?', ['Sí', 'No'])) === 0) {
            const n = C.copyPublished();
            Game.slot = U.clamp(parseInt(localStorage.getItem('anima_region_alba_last_slot') || '0', 10) || 0, 0, 2);
            this.hasSave = Game.hasSave(); this.sum = Game.saveSummary(); this.i = 0;
            await say(`Listo: ${n} partida(s) copiadas a esta prueba.`);
          }
        }
      } else {
        await C.refresh();
        const L = C.list.slice(0, 6);
        if (!L.length) await say('Ahora mismo no hay cambios en prueba.');
        else {
          const r = await ask(L.length === 1 ? 'Hay 1 cambio en prueba. Tus partidas no se tocan.' : `Hay ${L.length} cambios en prueba, el más reciente primero. Tus partidas no se tocan.`,
            L.map((c, k) => `${k + 1}. ${clean(c.title, 30)}`).concat(['Cancelar']));
          if (r >= 0 && r < L.length) { await Fade.out(0.4); C.goPreview(L[r].pr); return; }
        }
      }
    } catch (e) { console.error(e); }
    this.busy = false;
  };
}
