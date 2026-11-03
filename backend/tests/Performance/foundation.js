import http from 'k6/http';
import { check, sleep } from 'k6';

const base = (__ENV.BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const target = Number(__ENV.TARGET_VUS || 1);
if (![1, 100, 500, 1000, 5000].includes(target)) throw new Error('TARGET_VUS must be 1, 100, 500, 1000 or 5000');
if (target > 1 && __ENV.CONFIRM_STAGING !== base) throw new Error('Set CONFIRM_STAGING to the exact authorized staging BASE_URL');
if (!/^https?:\/\//.test(base)) throw new Error('BASE_URL must be HTTP(S)');
export const options = {
  scenarios: { foundation: target === 1
    ? { executor: 'constant-vus', vus: 1, duration: __ENV.SMOKE_DURATION || '10s' }
    : { executor: 'ramping-vus', startVUs: 0, stages: [
      { duration: '2m', target }, { duration: '5m', target }, { duration: '1m', target: 0 },
    ] } },
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<500', 'p(99)<1000'], checks: ['rate>0.99'] },
};
export default function () {
  const response = http.get(`${base}/api/v1/health`, { redirects: 0, tags: { operation: 'liveness' }, timeout: '10s' });
  check(response, { 'liveness 200': r => r.status === 200, 'request id': r => !!r.headers['X-Request-Id'] });
  sleep(1 + Math.random() * 2);
}
