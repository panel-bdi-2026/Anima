// Graba un combate y una caminata de un ánima, cuadro por cuadro, para revisar sus animaciones en el juego.
// Uso: node tools/grabar_animas.js http://localhost:8080/ ignito carpeta_salida
// Deja PNG numerados en carpeta_salida/combate y carpeta_salida/mapa (luego se arman como GIF).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const [url, sp, out, modo] = process.argv.slice(2);   // modo 'viejo': sin las animaciones nuevas, para comparar
  for (const d of ['combate', 'mapa']) fs.mkdirSync(path.join(out, d), { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 900, height: 415 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto(url);
  await page.addScriptTag({ url: 'tools/testkit.js' });
  await page.waitForFunction(() => typeof T !== 'undefined' && Scenes.top(), null, { polling: 500 });
  await page.evaluate((viejo) => { Options.touch = 'on'; Options.quality = 'alta'; Mobile.active = true; Mobile.layoutScreen(); Engine.manual = true; if (viejo && typeof FrameSprites !== 'undefined') FrameSprites.SPECIES = {}; }, modo === 'viejo');
  const CLIP = { combate: { x: 250, y: 90, width: 400, height: 240 }, mapa: { x: 300, y: 110, width: 300, height: 190 } };
  const shot = async (dir, i) => { await page.evaluate(() => Engine.draw()); fs.writeFileSync(path.join(out, dir, String(i).padStart(4, '0') + '.png'), await page.screenshot({ clip: CLIP[dir] })); };

  // ---- combate: el ánima pelea sola (ataca, esquiva, recibe golpes) ----
  await page.evaluate(async (sp) => {
    await T.quick({ party: [[sp, 20]], map: 'ruta1', x: 10, y: 8 });
    World.runScript(async () => { await Battle.trainer({ title: 'P', cls: 'P', name: 'P', party: [['burbujo', 24]], skill: 0.5 }); });
    await T.until(() => Battle.active && Battle.active.state === 'fight', 900);
    window._auto = T.autoBattle({ dodge: 0.5, maxFrames: 60 * 60 });
  }, sp);
  for (let i = 0; i < 260; i++) {
    await page.evaluate(() => T.run(3));
    await shot('combate', i);
    const fin = await page.evaluate(() => !Battle.active || Battle.active.state === 'end');
    if (fin && i > 40) break;
  }
  // ---- mapa: camina con el ánima acompañante ----
  await page.evaluate(async (sp) => { await T.quick({ party: [[sp, 20]], map: 'ruta1', x: 10, y: 8 }); }, sp);
  const pasos = ['right', 'right', 'right', 'down', 'down', 'left', 'left', 'left', 'up', 'up'];
  let k = 0;
  for (const d of pasos) {
    await page.evaluate((d) => { const c = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[d]; Input.held[c] = true; Input.pressedKeys[c] = true; }, d);
    for (let j = 0; j < 5; j++) { await page.evaluate(() => T.run(4)); await shot('mapa', k++); }
    await page.evaluate(() => { for (const c of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) Input.held[c] = false; });
  }
  for (let j = 0; j < 12; j++) { await page.evaluate(() => T.run(4)); await shot('mapa', k++); }
  const tErr = await page.evaluate(() => T.errors.slice(0, 10));
  console.log('errores:', errores.concat(tErr).slice(0, 10));
  await browser.close();
})();
