# Velvet Vogue frontend

A responsive local storefront and workspace inspired by the supplied fashion references. Built with HTML, CSS and browser-native ES modules, without changing the PHP backend stack. All imagery and fonts are local assets.

## Run

```sh
cd Front-end
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Routes:

- `/` — editorial landing page.
- `/#/shop` — searchable/filterable/sortable collection preview.
- `/#/product/relaxed-blazer` — image gallery, zoom, sizing and preview bag.
- `/#/saved` — saved pieces, persisted on this device.
- `/#/edit` — editorial page.
- `/#/admin` — dashboard preview, empty trading states and live health checks.
- `/#/admin/products`, `/orders`, `/customers`, `/analytics`, `/settings` — workspace sections (each under `/#/admin`).

The dev server proxies `/api/v1` to the XAMPP Apache listener at `http://127.0.0.1:8081` by default. See [Windows XAMPP setup](../backend/docs/WINDOWS-XAMPP.md). Override for another local PHP endpoint:

```sh
API_PROXY_TARGET=http://127.0.0.1:8080 npm run dev
```

The preview is useful without a running backend; the dashboard reports an unavailable connection honestly. The development proxy forwards JSON bodies, cookie/session, CSRF, authorization and idempotency headers and Set-Cookie responses, with local Host/Origin checks. Only public probes are currently implemented by the backend; forwarding cookies does not implement authentication. This is not a production proxy. Production should serve `dist/` and proxy `/api/v1` to PHP on the same origin, preserving the backend's security configuration. The PHP document root remains `backend/public`.

## Scope and integration boundary

The PHP audit confirmed that only health/readiness endpoints exist. `src/catalog.js` therefore contains four **explicit editorial fixtures**, not database products. Prices in LKR are illustrative. Saved pieces and preview-bag variants/quantities are stored locally under `velvet-vogue-preview-v1`; unknown products, invalid sizes and invalid quantities are rejected when reading storage. These client values must never become authoritative prices/stock/order totals in a future backend.

No checkout, charge, stock reservation, order, customer login, admin authorization or newsletter subscription is simulated as successful. Checkout is disabled. No passwords are collected; newsletter submissions explain that no email is sent or saved. Dashboard financial/customer/order metrics are empty, not fabricated. The dashboard route is public preview UI and confers **no administrative privilege**. Only the health-check action makes live API calls.

After the complete schema and commerce modules are implemented, replace catalogue fixtures with documented API resources, implement server-authorized sessions/CSRF and ownership checks, and use backend-computed totals. Never infer authorization from this dashboard or local storage. See `../backend/docs/openapi.yaml` and `../backend/docs/AUDIT-2026-11-03.md` for actual API coverage and release blockers.

## Build and test

```sh
npm test
npm run build
npm run test:e2e
node scripts/visual-check.mjs
```

`npm test` covers local-state validation, variants/totals, query/filter/sort behavior and escaping. Playwright tests run desktop and mobile layouts in installed Chrome on macOS (Chromium elsewhere). On Linux/CI first install the browser with `npx playwright install --with-deps chromium`. Playwright starts the local server when needed.

`npm run build` copies only `index.html`, `src/`, and `assets/` into `dist/`; no PHP, environment secrets, test runner or dev server is included. `node scripts/visual-check.mjs` needs an already running dev server and captures the landing, product and dashboard pages at 1440 and 390 pixels into ignored `test-results/visual/`.

Browser tests use stubbed probe responses for deterministic outage behavior; the audit additionally verified live proxy requests against the isolated PHP service. Browser mocks are not shipped in the frontend. Native dialog focus trapping, Escape closing, keyboard focus indicators, labelled controls, alt text, reduced-motion support and mobile navigation are included. Formal assistive-technology and full accessibility conformance audits remain future work.

## Assets

See `ASSETS.md` for source attribution and generated-image prompts. Images illustrate a visual direction; they do not establish actual stock, manufacture, composition or supplier relationships. No real product images or live product dataset were supplied.

## Verified locally — 2026-11-03

- Four unit tests and 12 desktop/mobile browser tests passed; static build completed.
- Live health and readiness requests passed through the development proxy, including request-ID propagation.
- Six screenshots cover home, product and dashboard at desktop/mobile sizes. All images loaded and no horizontal overflow was detected.
- Backend verification: 27 tests / 71 assertions; see the linked backend audit for exact scope and unresolved release blockers.

The disposable audit services are stopped after verification. Start your configured backend separately for live probes; the storefront preview runs independently.
