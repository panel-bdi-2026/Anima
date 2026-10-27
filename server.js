// Servidor estático mínimo para jugar en local: node server.js  ->  http://localhost:8080
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
http.createServer((req, res) => {
  // solo desarrollo: guarda capturas enviadas por el kit de pruebas
  if (req.method === 'POST' && req.url.startsWith('/__shot')) {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const name = (req.url.split('name=')[1] || 'shot').replace(/[^a-z0-9_-]/gi, '');
      fs.mkdirSync(path.join(root, 'tools', 'shots'), { recursive: true });
      fs.writeFileSync(path.join(root, 'tools', 'shots', name + '.png'), Buffer.from(body.split(',')[1], 'base64'));
      res.writeHead(200); res.end('ok');
    });
    return;
  }
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(process.env.PORT || 8080, '127.0.0.1', () => console.log('Ánima en http://localhost:' + (process.env.PORT || 8080)));
