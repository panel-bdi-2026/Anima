// Service worker: abrir rápido sin jugar con archivos viejos.
// - La página, el número de versión y las listas (json) se piden siempre a la red (si no hay red, la copia guardada).
// - Los scripts publicados llevan el código de su versión (js/x.js?v=abc1234): nunca cambian, así que se usan
//   directo desde el celular; al llegar una versión nueva se borran las copias de las versiones anteriores.
// - Los dibujos (assets/) se muestran al instante desde el celular y se actualizan por detrás.
const CACHE = 'anima-v3'; // v3: dibujos de ánimas a la mitad (los viejos no sirven con el código nuevo)
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const put = (req, res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; };
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const versioned = url.searchParams.has('v') && /\.js$/.test(url.pathname);
  const asset = /\/assets\//.test(url.pathname) && !/\/prueba\//.test(url.pathname);
  if (versioned) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res && res.ok) {
        c.put(req, res.clone());
        // copias del mismo archivo con otro código de versión: ya no sirven
        c.keys().then((ks) => ks.forEach((k) => { const u = new URL(k.url); if (u.pathname === url.pathname && u.search !== url.search) c.delete(k); }));
      }
      return res;
    }));
    return;
  }
  if (asset) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req, { cache: 'no-cache' }).then((res) => put(req, res)).catch(() => null);
      return hit || (await net) || Response.error();
    }));
    return;
  }
  // red primero (página, versión, listas, pruebas); sin red, la copia guardada
  e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => put(req, res)).catch(() => caches.match(req).then((r) => r || caches.match('./index.html'))));
});
