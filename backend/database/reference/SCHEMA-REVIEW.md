# Supplied v2.0 fragment review

The supplied text is preserved verbatim in `v2.0.partial.sql.txt`. It is reference material, not an executable migration. No database statements have been executed.

## Confirmed definitions

- Partial authentication-session definition: unsigned ID and user ID, unique binary SHA-256-sized token hash, timestamps for expiry/revocation, user/expiry indexes and a cascading users foreign key. The opening CREATE TABLE statement is missing.
- `login_attempts`: keyed identity hash, packed IP, success flag and time-based indexes.
- `cache_versions`: namespace/version pairs seeded for catalogue, categories and homepage.
- `audit_logs`: nullable actor, action/entity metadata and JSON details.
- `inventory_movements`: signed nonzero quantity, reason enum, variant/order/actor foreign keys.
- `background_jobs`: pending/running/completed/failed states, attempts, maximum attempts, availability, lease deadline and unique type/deduplication key.

## Missing compatibility evidence

The fragment references but does not define `users`, `products`, `product_variants`, `orders`, `payment_events`, `inventory_reservations`, `inquiries` and `schema_migrations`. It also provides no definitions for categories, product images, addresses, carts/items, order items, payments or other supporting catalogue/checkout tables. Exact names for those additional tables remain unverified. Authentication and commerce repositories cannot be made backward-compatible without their columns, keys and state constraints.

Supply the preceding SQL, including the base schema and the opening authentication-session statement, or a complete schema-only export. The v2.0 migration fragment alone is insufficient even if its missing first line is restored.

## Items to resolve after the complete schema is available

- The ALTER TABLE ADD INDEX statements and schema_migrations insertion are not inherently rerunnable. A version-controlled migration runner must gate them; existing index names and migration-ledger constraints must be inspected first.
- CREATE TABLE IF NOT EXISTS does not reconcile an existing table with the supplied definition. Inspect installed definitions if a database already exists.
- Jobs have a lease deadline but no explicit lease-owner token. Worker acknowledgements/retries must be fenced with a claim generation/token or equivalent conditional update so a stale worker cannot complete a newer claim. Any schema addition must preserve existing rows.
- Job deduplication is unique across all states when dedupe_key is non-null. Recurring tasks need occurrence-scoped keys and a retention policy; retries must preserve the intended deduplication semantics.
- The stock ledger lacks a visible operation-level unique key. Inventory mutations and ledger writes need atomic transaction boundaries and a verified deduplication strategy; reservation/order constraints are not yet available.
- Payment-event provider IDs, signature/replay data and uniqueness cannot be assessed from the added index alone.
- Index suitability and capacity cannot be established without the complete schema, representative data and query plans.

The Phase 1 implementation remains unchanged. No Phase 2 endpoint or production-readiness claim follows from this partial schema review.

## Export the missing definitions from an existing database

Configure `backend/.env` with the existing database connection and an account allowed to inspect every table/view (including SHOW VIEW for views). Do not place credentials in the SQL reference or chat. Then, from `backend`:

```sh
composer db:schema -- database/reference/installed-schema.sql
```

For a running Compose application:

```sh
docker compose exec php composer db:schema -- database/reference/installed-schema.sql
```

The command reads information_schema and SHOW CREATE in a read-only transaction, exports no application rows, and refuses to overwrite an existing file. Exit status 0 indicates completion; do not rely on a partial output after an I/O failure. The export covers table/view definitions, not routines, triggers, events, grants or migration-history data. Supply those definitions separately if used. Pause schema deployments during export because metadata reads are not a consistent DDL snapshot. No database was configured or exported automatically.
