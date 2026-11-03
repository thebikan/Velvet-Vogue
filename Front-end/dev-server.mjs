import http from 'node:http';
import https from 'node:https';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const mime = { '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const requestHeaders = ['accept', 'content-type', 'content-length', 'cookie', 'authorization', 'x-csrf-token', 'idempotency-key', 'origin'];
const responseHeaders = ['content-type', 'set-cookie', 'x-request-id', 'x-content-type-options', 'x-frame-options', 'content-security-policy', 'referrer-policy', 'retry-after', 'allow'];

function fail(res, status, code, message) {
  if (res.destroyed) return;
  if (res.headersSent) { res.destroy(); return; }
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify({ data: null, error: { code, message, details: {} }, meta: { request_id: randomUUID() } }));
}

// Development only. The backend must still authenticate, authorize and validate CSRF tokens.
export function createDevServer({ apiTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:8081', timeout = 5000 } = {}) {
  const api = new URL(apiTarget);
  if (!['http:', 'https:'].includes(api.protocol) || api.username || api.password || api.pathname !== '/' || api.search || api.hash) {
    throw new Error('API_PROXY_TARGET must be an HTTP(S) origin without credentials or a path.');
  }
  return http.createServer(async (req, res) => {
    const port = req.socket.localPort;
    const allowedHosts = [`127.0.0.1:${port}`, `localhost:${port}`];
    if (!allowedHosts.includes(req.headers.host)) {
      fail(res, 403, 'invalid_host', 'Use the local preview address.'); return;
    }
    let url;
    try { url = new URL(req.url, `http://${req.headers.host}`); }
    catch { fail(res, 400, 'invalid_url', 'Invalid request URL.'); return; }
    if (url.origin !== `http://${req.headers.host}`) {
      fail(res, 400, 'invalid_url', 'Invalid request URL.'); return;
    }
    if (url.pathname === '/api/v1' || url.pathname.startsWith('/api/v1/')) {
      // Protect the local proxy from cross-origin browser requests, including login CSRF.
      if ((req.headers.origin && req.headers.origin !== url.origin) || req.headers['sec-fetch-site'] === 'cross-site') {
        fail(res, 403, 'cross_origin_request', 'Use the same-origin frontend.'); return;
      }
      const target = new URL(url.pathname + url.search, api);
      const headers = {};
      const hopHeaders = (req.headers.connection || '').toLowerCase().split(',').map(value => value.trim());
      for (const name of requestHeaders) {
        if (req.headers[name] !== undefined && !hopHeaders.includes(name)) headers[name] = req.headers[name];
      }
      const transport = target.protocol === 'https:' ? https : http;
      const proxy = transport.request(target, { method: req.method, headers, timeout }, upstream => {
        const outgoing = { 'cache-control': 'no-store' };
        const hop = (upstream.headers.connection || '').toLowerCase().split(',').map(value => value.trim());
        for (const name of responseHeaders) {
          if (upstream.headers[name] !== undefined && !hop.includes(name)) outgoing[name] = upstream.headers[name];
        }
        res.writeHead(upstream.statusCode, outgoing);
        upstream.on('error', () => res.destroy());
        upstream.pipe(res);
      });
      proxy.on('timeout', () => proxy.destroy());
      proxy.on('error', () => fail(res, 503, 'backend_unavailable', 'Backend unavailable.'));
      req.on('aborted', () => proxy.destroy());
      res.on('close', () => { if (!res.writableEnded) proxy.destroy(); });
      req.pipe(proxy);
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { allow: 'GET, HEAD' }).end(); return; }
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400).end(); return; }
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!(relative === 'index.html' || /^(src|assets)\/[a-zA-Z0-9_./-]+$/.test(relative)) || relative.split('/').includes('..')) {
      res.writeHead(404).end('Not found'); return;
    }
    try {
      const content = await readFile(path.join(root, relative));
      res.writeHead(200, { 'content-type': mime[path.extname(relative)] || 'application/octet-stream', 'x-content-type-options': 'nosniff', 'cache-control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch { res.writeHead(404).end('Not found'); }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 5173);
  createDevServer().listen(port, '127.0.0.1', () => console.log(`Velvet Vogue: http://127.0.0.1:${port}`));
}
