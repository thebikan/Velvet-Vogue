# Deployment audit runbook

**Release status: blocked.** Commerce modules and the complete v2.0 schema are absent. Do not deploy this foundation as an operational store.

## Build and verify

Install from `composer.lock`; run `composer validate --strict`, `composer check-platform-reqs`, `composer check`, `composer test:database`, the Redis suite and `composer audit`. Use a dedicated `_test` database/account with no application-database privileges. Build the Docker image with no development dependencies for deployment. Keep configuration and secrets outside the public document root. Inject stage-specific environment values and enforce TLS at the ingress. Never expose FPM or Redis to the public internet.

The current Nginx file is a private HTTP origin example, not a public TLS configuration. Configure certificate renewal, HTTPS redirects and HSTS at the TLS ingress; strip untrusted forwarded headers and only then configure explicit trusted proxy addresses. Validate both Nginx and FPM before each release. Do not broaden CORS to `*` for credentialed requests. A same-origin reverse proxy is preferred for the frontend.

## Capacity and instrumentation

The example 16 FPM children is not measured production sizing. Budget maximum replicas × children plus workers/migrations/operational headroom below the MySQL connection limit. Derive children from measured peak worker RSS and available memory. Set connection/query deadlines below request deadlines. Disable OPcache timestamp checks only for immutable images with worker restarts on release. Restrict any FPM status endpoint to the monitoring network.

Collect sanitized JSON logs and alert on `logging_sink_unavailable`, rising 5xx/503 rates, failed readiness, FPM queue saturation, DB connection exhaustion and Redis latency/evictions. Operational log failure must not change completed responses; durable audit records for future commerce transactions must remain transactional. Transactional/auth/worker alerts are blocked until those modules exist. MySQL slow-query logs may contain customer literals: restrict access, encrypt storage and redact before sharing. No business EXPLAIN ANALYZE results or index tuning can be claimed without schema and data.

## Database changes and recovery

No commerce migrations have been applied. Inspect the full schema first; take a verified backup before reviewed data-preserving migrations. Run DDL with a separate migration account. MySQL DDL may commit implicitly; do not promise transactional rollback of DDL. Deploy backward-compatible expansions before application changes, and contract only after the rollback window closes.

Before launch, establish encrypted full backups and binlog/managed point-in-time recovery with offsite retention. Proposed objectives for owner approval: RPO <=15 minutes and RTO <=60 minutes. These are targets, not achieved guarantees. Choose an actual storage/KMS provider, restricted backup identity, schedule, retention and deletion policy; none is configured here. The schema-export command is **not a backup**: it omits rows, triggers, routines and events.

Prove restoration into a separate non-production database: verify checksum/decryption, restore full data, replay to a chosen point, compare counts and business invariants, check application behavior, measure restoration time and retain evidence. No backup/restore success is claimed. Provider-specific backup scripts would be unsafe to invent without destination, encryption and access configuration.

## Release and rollback checklist

- [ ] Complete schema and commerce module verification, including ownership/admin authorization and concurrent stock/payment invariants.
- [ ] Validated payment/email configuration; demo payment isolated from production; no fake-success provider paths.
- [ ] Secrets, TLS, proxy/CORS policy, least-privilege identities and shared session storage reviewed.
- [ ] Tested encrypted backups/restoration and recorded RPO/RTO.
- [ ] Realistic staged load tests and coordinated resource limits passed.
- [ ] Immutable image digest, migration version, rollout/rollback owner and monitoring thresholds recorded.
- [ ] Gradual rollout; stop on errors/invariant failures; revert application image only where schema compatibility is proven.

There is no administrator setup command because there is no users/roles implementation. Do not seed guessed admin credentials. Worker entrypoints exit 78; no worker supervision unit should restart these placeholders in a loop. Configure bounded restart policies and lease-aware shutdown only after durable workers exist.
