# Windows XAMPP development

This is the primary local setup. Docker remains an optional alternative. The intended checkout is `C:\xampp\htdocs\Velvet-Vogue`; substitute your real path everywhere if different. Windows execution has **not** been verified from the macOS workspace.

## 1. Inspect before changing services

Start PowerShell in the checkout. Run the read-only inspector:

```powershell
Set-Location C:\xampp\htdocs\Velvet-Vogue
powershell -NoProfile -ExecutionPolicy Bypass -File backend\scripts\windows\inspect-xampp.ps1
```

The execution-policy override applies only to this process, not to your machine configuration. The script reports PHP, extensions, available password algorithms, Apache version/modules/vhosts/config syntax, database **client** version, and Composer availability. Do not infer the database server version from its client binary. Missing extensions or unsupported PHP result in a nonzero preflight exit.

The dependency range is PHP 8.2–8.4; install a maintained patch release. The lockfile resolves for a PHP 8.2 baseline and has been tested in Linux PHP 8.2 and 8.4 runtimes on macOS. This is not a Windows certification. PHP 8.0/8.1 cannot install these Symfony 7.4 dependencies. Do not bypass Composer's platform checks. Inspect Apache's loaded PHP module/PHPIniDir and verify its PHP version using XAMPP's local diagnostic tools; CLI PHP and Apache PHP can differ. Do not add a public phpinfo endpoint to this application.

Enable the extensions reported by the inspector in the **actual loaded php.ini**; restart Apache after changing its PHP settings. Set the CLI path for this terminal and install Composer for that PHP executable if unavailable:

```powershell
$env:Path = "C:\xampp\php;" + $env:Path
php -v
composer --version
Set-Location backend
composer install
composer check-platform-reqs
```

## 2. Connect to the existing database

Copy `.env.example` only if `.env` does not already exist:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Set `APP_ENV=local`, `DB_HOST=127.0.0.1`, the actual port/database name, and an existing dedicated application account's username/password. Do not use a privileged root account. Keep `CACHE_DRIVER=file` for this single-process local setup. Use `SESSION_SECURE=false` **only for local HTTP**; staging/production must keep secure cookies and HTTPS. Cookie sessions are host-only, HttpOnly, SameSite=Lax; browser calls go through the same-origin frontend proxy. No wildcard credentialed CORS is enabled.

Start the database through XAMPP Control Panel. Inspect the actual server (read-only):

```powershell
php bin/diagnose.php --database
```

This reports `SELECT VERSION()`, server-engine identification, SQL mode and installed table metadata, without application rows or credentials. It does **not** certify schema compatibility. Capture a schema-only export if required:

```powershell
php bin/export-schema.php database/reference/installed-schema.sql
```

This refuses to overwrite an existing file. Keep exports private until reviewed; even schema defaults/comments can contain application-specific information. The authoritative input requested for this project is `database/velvet_vogue_database_v2_full.sql`. Do not import the partial fragment, apply guessed migrations, or replace an existing database. Full schema inspection and safe migration design are still pending that file. No new migration is applied by this setup.

## 3. Configure Apache safely

The supplied `deploy/apache/xampp.conf` creates a loopback API listener at **http://127.0.0.1:8081** with DocumentRoot pointing to `backend/public`. It also denies access to the entire checkout through Apache's default `http://localhost/Velvet-Vogue/...` path, including vendor, source, SQL, logs, Composer files, and environment files. Frontend files are served by Node, not directly from htdocs.

Back up `C:\xampp\apache\conf\httpd.conf`. Ensure the existing `LoadModule rewrite_module modules/mod_rewrite.so` directive is enabled once. Add this line at **server scope, outside any VirtualHost**:

```apache
Include "C:/xampp/htdocs/Velvet-Vogue/backend/deploy/apache/xampp.conf"
```

Review the `Define VelvetVogueRoot` path in the included file. Do not also add a second `Listen` for port 8081. Do not use the default htdocs URL to browse this project before protection is installed. No `.htaccess` is required: `AllowOverride None` is intentional, and the rewrite/authorization rules live in Apache configuration.

Validate before restarting Apache using XAMPP Control Panel:

```powershell
& C:\xampp\apache\bin\httpd.exe -t
& C:\xampp\apache\bin\httpd.exe -S
```

After restart:

```powershell
curl.exe -i http://127.0.0.1:8081/api/v1/health
curl.exe -i http://127.0.0.1:8081/api/v1/ready
curl.exe -i http://localhost/Velvet-Vogue/backend/.env
curl.exe -i http://localhost/Velvet-Vogue/backend/config/database.php
curl.exe -i http://localhost/Velvet-Vogue/backend/vendor/autoload.php
curl.exe -i http://localhost/Velvet-Vogue/backend/database/velvet_vogue_database_v2_full.sql
```

Health should be 200/alive; readiness should be 200/ready when DB/cache work. All default-host private-path checks must be **403**, including when a requested private file exists. Stop and fix the Apache configuration if private content is returned. Logs are in `C:\xampp\apache\logs\velvet-vogue-error.log`; do not post credentials or raw diagnostic dumps publicly.

Port 8081 is the **configured target**, not an already-installed service on your Windows computer. If occupied, choose another loopback port in both Apache Listen/VirtualHost and `API_PROXY_TARGET` below. This local listener is not a public deployment/TLS setup.

## 4. Run the existing frontend

The repository uses a custom Node ES-module development server, **not Vite**. Its layout and routes are unchanged. Use Node.js 20 or newer:

```powershell
Set-Location C:\xampp\htdocs\Velvet-Vogue\Front-end
npm.cmd ci
npm.cmd run dev
```

Open `http://127.0.0.1:5173`. `/api/v1` now proxies by default to `http://127.0.0.1:8081`. The proxy preserves JSON bodies, cookie/session headers, CSRF tokens, authorization and idempotency headers, and multiple Set-Cookie responses. It rejects unexpected Host and browser Origin values, never forwards client-supplied X-Forwarded-* headers, and does not grant authorization itself. Backend authentication, authorization and CSRF checks remain mandatory once their schema-backed implementation exists. No CORS bypass is required.

To use the preserved Docker backend instead, or another configured endpoint:

```powershell
$env:API_PROXY_TARGET = "http://127.0.0.1:8080"
npm.cmd run dev
```

Keep browser requests on the frontend origin rather than switching between localhost and 127.0.0.1; their cookie jars differ.

## 5. Verify and stop

```powershell
# backend terminal
composer validate --strict
composer check
composer audit

# Front-end terminal
npm.cmd test
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
node scripts/check-api.mjs
```

`check-api.mjs` needs both frontend and backend running. Database tests additionally need a separate, disposable database ending `_test` and its own restricted credentials in `TEST_DB_*` (use the actual XAMPP database port, often shared with the application database). Set `TEST_DB_PORT` explicitly; the example's Docker-oriented 3307 default need not match your installation. The test account needs CREATE TEMPORARY TABLES. `composer test:database` never falls back to the application database. Redis tests require a separately configured Redis service; file-cache local development does not require it.

Stop Node with Ctrl+C. Stop Apache/database using XAMPP Control Panel when finished. Existing workers intentionally refuse to run until real job handlers and authoritative schema are implemented; no Windows scheduled task should be installed for them yet.

## Current functionality boundary

Only the health/readiness APIs exist. Registration/login, persistent catalogue/cart, checkout/orders/payments, administration and background handlers remain unimplemented pending the complete v2 schema. Frontend products and bag are still labelled preview data, checkout is disabled, and no live payment provider is configured. This setup does not change those facts.

References: [Apache configuration sections](https://httpd.apache.org/docs/2.4/sections.html), [mod_rewrite](https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html), [Symfony 7.4 PHP requirements](https://symfony.com/releases/7.4).
