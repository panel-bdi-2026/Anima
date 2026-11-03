// hoja de revisión de sprites a mano: estáticos ampliados + fotogramas animados
window.handSheet = async function (list, name) {
  const cw = 44, n = 6;
  const cv = document.createElement('canvas'); cv.width = Math.max(26 + list.length * 48 + 10, 30 + 6 * 44 + 10); cv.height = 52 + list.length * 46; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
  x.fillStyle = '#8cc870'; x.fillRect(0, 0, cv.width, cv.height);
  // fila de estáticos con el entrenador para la escala
  x.drawImage(CharSprites.get(LOOKS.player), 0, 0, 16, 24, 4, 20, 16, 24);
  list.forEach((sp, k) => { x.drawImage(CreatureGfx.get(sp, 40), 22 + k * 48, 4); Font.draw(x, SPECIES[sp].name, 22 + k * 48, 44, '#1a3010'); });
  // animaciones: camina (3), ataque (2), daño (1)
  list.forEach((sp, r) => {
    const e = { x: 0, y: 0, animSeed: 0 }; const A = CreatureAnim.state(e); A.nextBlink = 99;
    const fr = [{ t: 0.0, speed: 60 }, { t: 0.09, speed: 60 }, { t: 0.18, speed: 60 }, { t: 0, act: { m: { kind: 'melee' }, t: 0.3, windup: 0.3, fired: false } }, { t: 0, atk: { kind: 'melee', t: 0.08, dur: 0.32 } }, { t: 0, hurt: 0.3 }];
    fr.forEach((o, k) => { A.hurtT = o.hurt || 0; A.hurtPow = 1.2; A.hurtWorld = 1; A.atk = o.atk ? Object.assign({}, o.atk) : null;
      CreatureAnim.draw(x, e, { sp, S: 40, px: 22 + k * cw + 20, py: 52 + r * 46 + 40, flip: false, t: o.t, dt: 1 / 30, speed: o.speed || 0, act: o.act }); });
  });
  const c2 = document.createElement('canvas'); c2.width = cv.width * 2; c2.height = cv.height * 2; const y = c2.getContext('2d'); y.imageSmoothingEnabled = false; y.drawImage(cv, 0, 0, c2.width, c2.height);
  await fetch('/__shot?name=' + name, { method: 'POST', body: c2.toDataURL('image/png') });
};
window.handZoom = async function (list, name, scale = 6) {
  const cv = document.createElement('canvas'); cv.width = list.length * 42; cv.height = 40; const x = cv.getContext('2d'); x.fillStyle = '#8cc870'; x.fillRect(0, 0, cv.width, cv.height);
  list.forEach((sp, k) => x.drawImage(CreatureGfx.get(sp, 40), k * 42, 0));
  const c2 = document.createElement('canvas'); c2.width = cv.width * scale; c2.height = cv.height * scale; const y = c2.getContext('2d'); y.imageSmoothingEnabled = false; y.drawImage(cv, 0, 0, c2.width, c2.height);
  await fetch('/__shot?name=' + name, { method: 'POST', body: c2.toDataURL('image/png') });
};
window.renderLine = async (L, name) => { await handZoom(L, name + '_zoom', 6); await handSheet(L, name + '_sheet'); return 'ok'; };
