// Capturas de «antes y después»: saca las mismas escenas de dos versiones del juego y las pone lado a lado.
// Uso:  node tools/capturas.js http://localhost:8081/ http://localhost:8080/ [escena…]
//       (primero la versión de antes, después la nueva; sin escenas = todas)
// Deja las imágenes en tools/shots/capturas/ (Git las ignora). Escenas: titulo, pueblo, ruta, casa, combate.
// Simula un celular en horizontal (900×415, con controles táctiles), igual que lo ve Alejandro.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ESCENAS = {
  // la entrada de cámara del título dura ~4,5 s: se avanza el tiempo hasta que termina
  titulo: async () => { const t = Scenes.top(); t.t = 0; for (let i = 0; i < 400; i++) await T.run(1); },
  pueblo: async () => { await T.quick({ party: [['ignito', 12]], map: 'pueblo_alba', x: 12, y: 9 }); await T.run(60); },
  ruta: async () => { await T.quick({ party: [['ignito', 12]], map: 'ruta1', x: 10, y: 8 }); await T.run(60); },
  casa: async () => { await T.quick({ party: [['ignito', 12]], map: 'casa_jugador', x: 4, y: 5 }); await T.run(60); },
  combate: async () => {
    await T.quick({ party: [['ignito', 20]], map: 'ruta1', x: 10, y: 8 });
    World.runScript(async () => { await Battle.trainer({ title: 'P', cls: 'P', name: 'P', party: [['burbujo', 18]], skill: 0 }); });
    await T.until(() => Battle.active && Battle.active.state === 'fight', 900); await T.run(40);
  },
};

async function capturar(browser, url, escena) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 415 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  // mismo azar en las dos versiones (criatura del título, pasto…), para comparar lo mismo
  await page.addInitScript(() => { let s = 12345; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; });
  await page.goto(url);
  await page.addScriptTag({ url: 'tools/testkit.js' });
  await page.waitForFunction(() => typeof T !== 'undefined' && Scenes.top(), null, { polling: 500 });
  await page.evaluate(() => { Options.touch = 'on'; Options.quality = 'alta'; Mobile.active = true; Mobile.layoutScreen(); Engine.manual = true; });
  await page.evaluate(`(${ESCENAS[escena]})()`);
  // sin criaturas sueltas que cambien la escena entre una versión y otra
  await page.evaluate(() => { if (typeof Critters !== 'undefined' && Critters.list) Critters.list.length = 0; Engine.draw(); });
  const png = await page.screenshot();
  await ctx.close();
  return png;
}

(async () => {
  const [antes, despues, ...pedidas] = process.argv.slice(2);
  if (!antes || !despues) { console.log('Uso: node tools/capturas.js URL_ANTES URL_DESPUES [escena…]'); process.exit(1); }
  const escenas = pedidas.length ? pedidas : Object.keys(ESCENAS);
  const dir = path.join(__dirname, 'shots', 'capturas');
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  try {
    for (const e of escenas) {
      const a = await capturar(browser, antes, e), d = await capturar(browser, despues, e);
      // una sobre otra, con su rótulo
      const page = await browser.newPage();
      const out = await page.evaluate(async ([a64, d64]) => {
        const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
        const [ia, id] = await Promise.all([load(a64), load(d64)]);
        const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height * 2 + 8;
        const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(ia, 0, 0); x.drawImage(id, 0, ia.height + 8);
        x.font = 'bold 36px sans-serif';
        for (const [txt, y] of [['ANTES', 50], ['DESPUÉS', ia.height + 58]]) { x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(10, y - 38, x.measureText(txt).width + 20, 48); x.fillStyle = '#ffd048'; x.fillText(txt, 20, y); }
        return c.toDataURL('image/png').split(',')[1];
      }, [a.toString('base64'), d.toString('base64')]);
      await page.close();
      const f = path.join(dir, e + '.png');
      fs.writeFileSync(f, Buffer.from(out, 'base64'));
      console.log('listo', f);
    }
  } finally { await browser.close(); }
})().catch((err) => { console.error(err); process.exit(1); });
