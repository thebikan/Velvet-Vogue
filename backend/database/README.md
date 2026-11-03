# Database inspection

The complete workspace was inspected before implementation. All 15 backend files were empty. The root README identifies this as an HND project. No SQL files, v2.0 schema, database credentials, installed database evidence or development plans were present. Actual tables, columns, constraints, indexes and relationships cannot yet be verified. No business tables or migrations have been fabricated, imported or altered.

Before Phase 2, supply the authoritative v2.0 SQL export or read-only schema access. Inspect INFORMATION_SCHEMA and SHOW CREATE TABLE for users, categories, products, variants, images, carts, orders, payments, reservations, sessions, audit logs and background jobs. Record actual names, foreign keys/delete actions, unique constraints, monetary precision, UTC timestamps, InnoDB engines and reservation indexes. Compare these to the module contracts before writing repositories. Capture discrepancies in a versioned review; any necessary change must be an additive, reviewed migration with backup and rollback/forward recovery instructions.

Transactions accept DML only. MySQL DDL can implicitly commit and must run separately in reviewed migrations. Nested transactions are rejected rather than falsely implying atomic nested commits. See https://www.php.net/manual/en/pdo.transactions.php .

Integration tests use an independent account/database ending in `_test` and connection-local temporary InnoDB tables. They do not install the commerce schema. A name suffix is a guardrail, not access control: the test account must have no privileges on application databases.
