import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createDevServer } from '../dev-server.mjs';

async function listen(server, t) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('proxy preserves JSON, cookie sessions, CSRF, idempotency, query and response cookies', async t => {
  let received;
  const upstream = await listen(http.createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    received = { headers: req.headers, method: req.method, url: req.url, body };
    res.writeHead(201, { 'content-type': 'application/json', 'set-cookie': ['vv_session=opaque; HttpOnly; SameSite=Lax; Path=/', 'other=value; Path=/'], 'x-request-id': 'test-id' });
    res.end('{"accepted":true}');
  }), t);
  const base = await listen(createDevServer({ apiTarget: upstream }), t);
  const response = await fetch(`${base}/api/v1/cart?view=full`, { method: 'POST', headers: {
    'content-type': 'application/json', cookie: 'vv_session=existing', 'x-csrf-token': 'csrf-value', 'idempotency-key': 'retry-1', origin: base,
    'x-forwarded-for': 'untrusted', authorization: 'Bearer test-only',
  }, body: '{"quantity":2}' });
  assert.equal(response.status, 201);
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.equal(response.headers.get('x-request-id'), 'test-id');
  assert.equal(received.headers.cookie, 'vv_session=existing');
  assert.equal(received.headers['content-type'], 'application/json');
  assert.equal(received.headers['x-csrf-token'], 'csrf-value');
  assert.equal(received.headers['idempotency-key'], 'retry-1');
  assert.equal(received.headers.authorization, 'Bearer test-only');
  assert.equal(received.headers['x-forwarded-for'], undefined);
  assert.equal(received.method, 'POST');
  assert.equal(received.url, '/api/v1/cart?view=full');
  assert.equal(received.body, '{"quantity":2}');
});

test('proxy rejects foreign origins and forged host headers before forwarding', async t => {
  let calls = 0;
  const upstream = await listen(http.createServer((req, res) => { calls++; res.end(); }), t);
  const base = await listen(createDevServer({ apiTarget: upstream }), t);
  assert.equal((await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers: { origin: 'https://foreign.example' } })).status, 403);
  assert.equal((await fetch(`${base}/api/v1/health`, { headers: { 'sec-fetch-site': 'cross-site' } })).status, 403);
  const status = await new Promise((resolve, reject) => {
    const request = http.get(`${base}/api/v1/health`, { headers: { host: 'foreign.example' } }, res => { res.resume(); resolve(res.statusCode); });
    request.on('error', reject);
  });
  assert.equal(status, 403);
  assert.equal(calls, 0);
});

test('unavailable backend has a sanitized error and static private paths stay inaccessible', async t => {
  const upstream = http.createServer(); upstream.listen(0, '127.0.0.1'); await once(upstream, 'listening');
  const target = `http://127.0.0.1:${upstream.address().port}`;
  await new Promise(resolve => upstream.close(resolve));
  const base = await listen(createDevServer({ apiTarget: target }), t);
  const response = await fetch(`${base}/api/v1/health`);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, 'backend_unavailable');
  for (const file of ['.env', 'package.json', '../backend/.env', 'src/%2e%2e/dev-server.mjs', 'api/other']) {
    assert.equal((await fetch(`${base}/${file}`)).status, 404);
  }
  const head = await fetch(base, { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
});

test('hung upstream times out without exposing internal diagnostics', async t => {
  const upstream = await listen(http.createServer(() => {}), t);
  const base = await listen(createDevServer({ apiTarget: upstream, timeout: 50 }), t);
  const response = await fetch(`${base}/api/v1/ready`);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.message, 'Backend unavailable.');
});
