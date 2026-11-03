# Performance validation

Only foundation probes are currently implemented. `foundation.js` measures those probes; it is **not** an e-commerce workload or evidence of checkout capacity. k6 uses ramping virtual users and percentile thresholds as documented at https://grafana.com/docs/k6/latest/using-k6/scenarios/ .

```sh
k6 run -e BASE_URL=http://127.0.0.1:8080 tests/Performance/foundation.js
# Authorized staging only. Repeat separately at 100, 500, 1000, 5000 after reviewing each result.
k6 run -e BASE_URL=https://staging.example.test -e CONFIRM_STAGING=https://staging.example.test -e TARGET_VUS=100 tests/Performance/foundation.js
```

No staging hostname or capacity is provisioned. Never substitute a payment provider or third-party hostname. Thresholds are initial acceptance targets, not measured SLAs. The 5,000-VU target remains unverified.

The realistic commerce scenario is blocked on implemented endpoints and seeded data. Once available, allocate approximately 55% catalogue/homepage browsing, 25% product/category/search reads, 15% customer login/cart journeys and 5% checkout, with think time and distinct per-VU accounts. Use server-issued CSRF tokens, cookie jars, seeded variants, unique checkout idempotency keys and sandbox/COD only. Keep every step on the approved origin, abort on missing endpoints, and assert order/inventory invariants after each run. Do not create a script that silently treats nonexistent endpoints as successful load.

Capture throughput, p50/p95/p99, error rates, host CPU/memory, FPM active/idle children and listen queue, MySQL Threads_connected/max_connections, query latency, lock waits/deadlocks, Redis hits/misses/evictions and worker backlog. Preserve k6 JSON/Prometheus output alongside the exact revision, dataset, machine limits and config. Increase load only after reviewing each run. Account for shared client IP throttles without disabling security globally; configure an isolated staging load-generator policy.
