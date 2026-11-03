import http from 'node:http';
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);
const api = new URL(process.env.API_PROXY_TARGET || 'http://127.0.0.1:8080');
const mime = { '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const target = new URL(url.pathname + url.search, api);
    const transport = target.protocol === 'https:' ? https : http;
    const proxy = transport.request(target, { method: req.method, headers: { accept: 'application/json' }, timeout: 5000 }, upstream => {
      const headers = { 'content-type': 'application/json', 'cache-control': 'no-store' };
      for (const key of ['x-request-id', 'x-content-type-options', 'x-frame-options', 'content-security-policy', 'referrer-policy', 'retry-after', 'allow']) {
        if (upstream.headers[key]) headers[key] = upstream.headers[key];
      }
      res.writeHead(upstream.statusCode, headers);
      upstream.pipe(res);
    });
    proxy.on('timeout', () => proxy.destroy());
    proxy.on('error', () => {
      if (!res.headersSent) res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: null, error: { code: 'backend_unavailable', message: 'Backend unavailable.' } }));
    });
    req.pipe(proxy);
    return;
  }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400).end(); return; }
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!(relative === 'index.html' || /^(src|assets)\/[a-zA-Z0-9_./-]+$/.test(relative)) || relative.split('/').includes('..')) {
    res.writeHead(404).end('Not found'); return;
  }
  try {
    const content = await readFile(path.join(root, relative));
    res.writeHead(200, { 'Content-Type': mime[path.extname(relative)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Velvet Vogue: http://127.0.0.1:${port}`));
