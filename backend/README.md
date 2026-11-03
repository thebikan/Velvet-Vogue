# Velvet Vogue backend — Phase 1

PHP 8.2–8.4 modular monolith with a custom kernel and MVC module boundaries. Symfony components supply HTTP requests/responses, routing matching, validation, CSRF, cache and rate limiting; PHP-DI supplies the container, Monolog structured logging, and phpdotenv environment loading. No Symfony full-stack framework is installed. JSON is the API view layer. Future modules own Controllers, Services and Repositories inside their existing `src/Modules/<Module>` directory; controllers translate HTTP, services coordinate use cases/transactions, repositories alone issue business SQL. No business repositories are invented before the schema review.

## Inspected baseline

The existing 15 backend files were empty. No SQL schema or secrets were supplied. See [database inspection](database/README.md). No frontend files or existing root documentation were changed. Schema verification remains a Phase 2 prerequisite.

## Primary local setup: Windows XAMPP

Follow [the Windows XAMPP guide](docs/WINDOWS-XAMPP.md). It includes runtime inspection, Apache private-path protection, same-origin frontend proxying and database metadata checks. No Docker installation is required. The full commerce schema remains pending.

## Other local setup without Docker

Install PHP **8.2–8.4** and Composer 2; enable PDO MySQL, mbstring, XML/DOM/XMLWriter (tests), and Redis (for Redis mode). On macOS, Homebrew's `php@8.4` is an option; on Linux use your distribution's supported PHP 8.4 packages. Confirm `php -v`, `php -m`, and `composer check-platform-reqs`.

```sh
cd backend
cp .env.example .env
composer install
php -S 127.0.0.1:8080 -t public public/index.php
```

Edit `.env` with local database credentials. Provision a MySQL 8 database and least-privilege application account separately; no schema is imported automatically. Liveness works without a database. Readiness requires the configured database and writable cache storage. The built-in server is for development only. Use HTTPS and `SESSION_SECURE=true` for cookie sessions; local HTTP session experiments require explicitly setting it to false. Health routes never start sessions.

## Docker development

Docker Desktop works on macOS; Docker Engine with Compose works on Linux. Copy `.env.example` to `.env` and set distinct nonempty `DB_PASSWORD` and `TEST_DB_PASSWORD` values. These are local service credentials, never committed. The local database uses a named volume; the test database uses ephemeral memory storage. Neither imports the missing v2.0 schema.

```sh
docker compose build
docker compose run --rm php composer install
docker compose up -d
curl -i http://127.0.0.1:8080/api/v1/health
curl -i http://127.0.0.1:8080/api/v1/ready
docker compose --profile test up -d --wait mysql-test redis-test
docker compose exec php composer check
docker compose exec php composer test:database
docker compose exec -e CACHE_DRIVER=redis -e REDIS_URL=redis://redis-test:6379 php composer test:redis
docker compose down
```

The source bind mount hides dependencies baked into the image; the explicit Composer install populates host `vendor/`. Do not use `down -v` unless you intend to delete the local application database. No host database port is published by Compose. Production uses the built image without the source bind mount or development dependencies.

## Configuration and API contract

`.env` is local convenience; process environment wins. Select `APP_ENV=local|testing|staging|production`. Testing exclusively reads `TEST_DB_*` and rejects names without `_test`; it never falls back to `DB_*`. Staging and production require database credentials, Redis and secure cookies. `REDIS_URL` should use authenticated/TLS Redis as appropriate. No credentials are hardcoded. Config is loaded once per bootstrap; shared PDO is opened only when used, with native prepares, utf8mb4, strict SQL mode, UTC and no persistent connections.

Every response has `data`, `error`, and `meta.request_id`. Success has `error: null`; errors have `data: null` and `error: {code, message, details}`. Validation uses 422 and field-keyed error arrays. Supported errors include 400 malformed JSON, 401 unauthenticated, 403 forbidden/CSRF, 404 missing route, 405 with Allow, 413 oversized body, 415 unsupported content type, 429 with Retry-After, 500 internal error and 503 unavailable readiness. Proxy-level rejection bodies may differ.

- `GET|HEAD /api/v1/health`: process liveness, no DB/cache calls.
- `GET|HEAD /api/v1/ready`: `SELECT 1` and a short-lived cache read/write check, no diagnostics exposed. This does not validate the absent commerce schema.

Requests with bodies must contain a JSON object and fit `MAX_BODY_BYTES`; reading is bounded even without Content-Length. Request IDs are generated server-side. Logs record route names, status and latency, never raw URLs, bodies, cookies, tokens, SQL values or exception messages. Local logs rotate for 14 days with mode 0640; deployed logs default to stderr. Apply collector retention/access control in deployment.

Global middleware handles body/content limits and rate limits. Kernel boundaries apply error conversion, identifiers, security headers and access logging to successes and failures. Configure per-route middleware IDs in `routes/api.php`. For future cookie routes, register `[CookieSession::class, Authentication::class, <permission middleware>, Csrf::class]`. Authentication currently fails closed; inject a real provider in Phase 2. Register each authorization middleware with an explicit permission string. CSRF uses Symfony's session token manager (`api` token ID); token issuance must be added through the authenticated session flow. Regenerate session IDs at login and privilege changes. No cross-origin CORS or trusted forwarded headers are enabled by default.

File-based rate counters/locks support one local host. Periodically prune expired local cache entries with Symfony FilesystemAdapter::prune(); local file storage is not intended for long-running shared deployments. Deployed environments require Redis for shared counters/locks. Probe endpoints are exempt. Application rate limiting supplements ingress controls; it is not DDoS protection. Redis failures fail closed on ordinary API requests; liveness remains independent. Cache uses PSR-6, and `Shared/Contracts/Queue` defines the future queue boundary. Worker entrypoints deliberately exit 78 until handlers exist.

## Checks

```sh
composer validate --strict
composer check-platform-reqs
composer check
composer test:database
composer audit
```

`composer check` lints PHP and runs PHPUnit (non-database tests), PHPStan level 5, and PSR-12 style checks. `composer style:fix` applies mechanical formatting. Database tests require a separate MySQL 8 account restricted to a database ending `_test`, with `CREATE TEMPORARY TABLES` permission; they use only connection-local temporary InnoDB tables. Do not give test accounts production privileges. Missing dependencies cause failures rather than silently skipped database tests.

Transactions commit callback success and roll back exceptions; nesting is rejected. Callbacks must not execute DDL, manually commit, or manipulate transactions. MySQL implicitly commits DDL, so transaction wrappers cannot undo it. Never mix schema migrations and application transactions.

## Deployment and capacity

Use `deploy/nginx/default.conf`, `deploy/php-fpm/pool.conf`, and `production.ini` as reviewed examples. The sole executable HTTP entry is `public/index.php`; document root must be `backend/public`, never the project root. FPM must remain on a private network/socket. Terminate TLS at the ingress, strip client forwarded headers, and explicitly configure trusted proxy addresses before relying on them. Add HSTS at that TLS ingress. Configure sessions in Redis before scaling cookie-authenticated routes across hosts.

Run Composer with `--no-dev --optimize-autoloader` from the committed lockfile, inject secrets at runtime, and give the FPM user write permission only to storage/session directories. Set OPcache timestamp validation off for immutable releases and reload workers on deployment. Restrict production DB privileges; migrations require a separate deployment identity. Review backup restoration, log retention and alerts before release.

FPM's example of 16 children is a starting point, not a sizing claim. Approximately 5,000 concurrent users is a future load-test objective. Measure request mix, latency, memory, DB connection limits, queries and indexes, cache behavior, queue lag and ingress capacity before choosing worker counts or claiming capacity.

## Phase 2 gates

1. Supply and review the authoritative v2.0 schema; record exact names, relationships and inconsistencies, and design only data-preserving migrations where needed.
2. Provision isolated local/test/staging credentials and least-privilege permissions; execute all checks against MySQL 8 and staging Redis.
3. Agree on session/token lifecycle, authorization permissions, CSRF issuance, account recovery and audit policies before implementing Auth/Users.
4. Review deployment TLS, trusted proxies, shared session storage, secrets, backup restoration, monitoring and resource budgets.
5. Implement module controllers → services → repositories against the reviewed schema, with business invariants and integration tests. Workers and commerce logic remain intentionally out of scope here.

## November 2026 audit

See [the audit report](docs/AUDIT-2026-11-03.md), [implemented API specification](docs/openapi.yaml), [deployment runbook](deploy/RUNBOOK.md), and [load-test scope](tests/Performance/README.md). This remains a foundation, not a production commerce application. Operational logging now degrades without replacing successful responses; unavailable rate-limit storage fails closed with 503. The sibling frontend is an explicit design preview until the missing commerce modules and complete schema are implemented.
