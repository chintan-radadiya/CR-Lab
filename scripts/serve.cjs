// Development-only static server. Only public app assets are exposed.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT) || 4173;
http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const name = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!/^(?:index\.html|cr_(?:app_data|explanation_engine)\.js|(?:js|css|content)\/[a-z0-9-]+\.(?:js|css))$/.test(name)) { res.writeHead(404); res.end('Not found'); return; }
  fs.readFile(path.join(root, name), (error, data) => {
    if (error) { res.writeHead(404); res.end('Not found'); return; }
    res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript; charset=utf-8' : name.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache'); res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`CR Lab: http://127.0.0.1:${port}`));
