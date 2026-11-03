# XAMPP transition: implemented scope and outstanding schema gate

Date: 2026-11-03. This report supersedes the earlier PHP-8.4-only setup assumptions; it does not claim the requested commerce implementation is complete.

## Evidence inspected

- Actual checkout is macOS, not `C:\xampp\htdocs\Velvet-Vogue`.
- Local XAMPP binaries exist under `/Applications/XAMPP/xamppfiles`, but executing its PHP, Apache and database client fails with `bad CPU type in executable`; they are x86_64 binaries on this workspace. No runtime version was inferred from their installation directory.
- Native macOS Apache is 2.4.67 and was used only with a temporary config and fixture files. No system Apache configuration was modified.
- The frontend has a custom Node development server, not Vite. It previously forwarded only Accept, so it could not support JSON/cookie/CSRF authenticated requests correctly.
- Backend routes still expose only health/readiness. Commerce module directories remain empty; authentication fails closed and workers refuse to execute nonexistent handlers.
- `backend/database/velvet_vogue_database_v2_full.sql` is absent. The only repository SQL is the incomplete v2 fragment. Other local XAMPP project directories have older schemas, but those were not treated as the user-designated authoritative file or imported.

## Implemented

- Version-controlled Apache config for the intended Windows checkout: loopback port 8081, public-only DocumentRoot, rewrite routing, forbidden hidden/alternate PHP/static files, and global protection of the default htdocs path. Access logs omit query strings and sensitive headers.
- Frontend default proxy now targets 8081. Request/response forwarding supports cookies, JSON, CSRF, authorization and idempotency headers; rejects foreign browser origins and forged Host values; rejects upstream failures with a sanitized 503; preserves multiple Set-Cookie headers. This does not itself implement auth or checkout.
- Standalone PHP runtime diagnostic that runs before dependencies are installed. Optional DB inspection detects the actual server/version and table metadata without reading records or exposing credentials. A read-only Windows PowerShell inspector collects local installation information.
- PHP requirement changed to 8.2–8.4; lockfile platform is 8.2.0. Four transitive Symfony 8.x dependencies were resolved to 7.4 releases. Existing Docker default remains PHP 8.4, with a build argument for compatibility testing. CI matrix covers 8.2/8.4; hosted execution is not claimed.
- LF preservation for Linux shell scripts, PHP and Apache config; Windows instructions use PowerShell syntax. Original frontend design/routes preserved.

## Executed checks

- PHP **8.2.35** and **8.4.27**, isolated Linux runtimes on this macOS host: `composer check` passed. Each run: **24 tests / 71 assertions**, 45 PHP files linted, PHPStan 35 files with zero errors, PSR-12 clean. Composer manifest/platform checks passed, and dependency audit found no published advisories.
- Disposable **MariaDB 10.11.19**, PHP 8.2: **3 database tests / 7 assertions**, using connection-local temporary tables only. Engine/version metadata detection passed. This version was selected as an independent compatibility target, not assumed to be the installed Windows version.
- Native macOS Apache 2.4.67: syntax and **12 routing/private-path checks passed** via `python3 backend/scripts/apache-smoke.py`. Fixture index content, not PHP execution; tests include default-host access to private files and direct access to alternate PHP entrypoints.
- Frontend: **8 Node tests** (including four real HTTP proxy integration tests), **12 desktop/mobile browser tests**, static build passed. Proxy cookies/CSRF were tested against a temporary HTTP fixture, not a nonexistent login endpoint.
- No Docker installation is required by the Windows workflow. Containers were used only as available verification tools on macOS. The disposable MariaDB test service/network and temporary credentials are removed after verification.

## Still required

Place the actual `velvet_vogue_database_v2_full.sql` in `backend/database/` before schema-dependent implementation. The user explicitly requires inspection before database changes. Its tables, state constraints, indexes and relationships cannot be recovered from the partial fragment or assumed from older unrelated checkouts.

Registration/login/reset, persistent catalogue/cart, stock/reservations, checkout/order idempotency, COD/demo payments, gateway/webhook integration, administrative operations and job handlers are **not implemented in this change**. No migration, application row, account or order was changed. No fake successful endpoint was added. Complete-schema inspection is the blocking input for those features; installed Windows PHP/Apache/MariaDB reports are needed for actual XAMPP verification. Live gateway credentials/provider testing remain a separate future requirement.

Use [Windows setup](WINDOWS-XAMPP.md) to inspect/configure the intended machine. This report does not claim Windows XAMPP, full schema compatibility, live payments, or production readiness have been verified.
