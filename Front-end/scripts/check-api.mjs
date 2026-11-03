import assert from 'node:assert/strict';
const base = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';
for (const [endpoint, expected] of [['health', 'alive'], ['ready', 'ready']]) {
  const response = await fetch(`${base}/api/v1/${endpoint}`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.status, expected);
  assert.equal(response.headers.get('x-request-id'), body.meta.request_id);
  console.log(`Live frontend proxy: ${endpoint} passed`);
}
