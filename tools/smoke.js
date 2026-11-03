// Prueba automática: abre el juego en un navegador sin ventana y comprueba que no se rompe.
// Se ejecuta en GitHub con cada cambio (.github/workflows/test.yml).
// En local: npm i playwright && npx playwright install chromium && node tools/smoke.js
const { spawn } = require('child_process');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8080, URL = `http://localhost:${PORT}/`;

// cada comprobación se ejecuta dentro de la página, con el kit de pruebas cargado
const CHECKS = [
  ['El mundo 3D carga', async () => { await T.quick({ map: 'ruta1', x: 10, y: 8 }); await T.run(60); if (T.top() !== 'World') throw new Error('escena: ' + T.top()); }],
  ['Un combate llega a su final', async () => { const r = await T.duel(['ignito', 14], ['burbujo', 12], 0.5, false); if (!r.res) throw new Error('sin resultado: ' + JSON.stringify(r)); }],
  ['Vistas de frente y espalda de todas las ánimas', async () => { const [c] = U.makeCanvas(40, 40), x = c.getContext('2d'); for (const k of Object.keys(HAND)) for (const view of ['side', 'front', 'back']) CreatureAnim.portrait(x, k, 40, false, 0, 0, 'smoke' + k + view, { view }); }],
  ['Entradas al azar', async () => { await T.quick({ party: [['voltin', 14]], map: 'ruta1', x: 10, y: 8 }); await T.fuzz(1500); }],
  ['Modo clásico (2D)', async () => { Options.gfx3d = false; await T.quick({ map: 'ruta1', x: 10, y: 8 }); await T.run(60); await T.duel(['burbujo', 14], ['semillin', 12], 0.5, false); Options.gfx3d = true; }],
];

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  let failed = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    page.setDefaultTimeout(0);
    let errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.goto(URL);
    await page.addScriptTag({ url: 'tools/testkit.js' });
    await page.waitForFunction(() => typeof T !== 'undefined' && Scenes.top());
    for (const [name, fn] of CHECKS) {
      errors = [];
      const t0 = Date.now();
      let problem = null;
      try { await page.evaluate(fn); } catch (e) { problem = e.message.split('\n')[0]; }
      if (!problem && errors.length) problem = errors[0];
      console.log(`${problem ? 'FALLA' : 'ok   '}  ${name} (${((Date.now() - t0) / 1000).toFixed(1)} s)${problem ? ' — ' + problem : ''}`);
      if (problem) failed++;
    }
    // controles táctiles: botones en los menús y en combate
    const phone = await browser.newContext({ viewport: { width: 800, height: 360 }, hasTouch: true, isMobile: true });
    const p2 = await phone.newPage();
    errors = [];
    p2.on('pageerror', (e) => errors.push(e.message));
    await p2.goto(URL);
    await p2.addScriptTag({ url: 'tools/testkit.js' });
    await p2.waitForFunction(() => typeof T !== 'undefined' && Scenes.top());
    const ids = await p2.evaluate(async () => {
      const menu = Mobile.buttons('title').map((b) => b.id);
      await T.quick({ party: [['ignito', 12]], map: 'ruta1', x: 10, y: 8 });
      World.runScript(async () => { await Battle.trainer({ title: 'P', cls: 'P', name: 'P', party: [['burbujo', 10]], skill: 0 }); });
      await T.until(() => Battle.active && Battle.active.state === 'fight', 900);
      return { menu, battle: Mobile.buttons('battle').map((b) => b.id) };
    });
    const touchOk = ['dpad', 'a', 'b'].every((k) => ids.menu.includes(k)) && ids.battle.includes('m0') && ids.battle.includes('dodge') && !errors.length;
    console.log(`${touchOk ? 'ok   ' : 'FALLA'}  Controles táctiles${touchOk ? '' : ' — ' + JSON.stringify(ids) + ' ' + errors[0]}`);
    if (!touchOk) failed++;
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(failed ? `\n${failed} comprobación(es) fallaron` : '\nTodo bien');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
