# Backup and Restore

Status: MVP implementation for Issue #22.

## Product contract

Arta exposes household backup and restore as first-class UI/API workflows. Users do not need PostgreSQL or shell access.

A backup is JSON with `format: "arta-household-backup"`, `version: 1`, `exportedAt`, `householdId`, and household-scoped persisted tables. Version 1 includes household/membership, wallets, confirmed transactions, transfers, transaction captures, budgets, financial goals and reservation events, balance adjustments, and wallet reconciliations. Exact monetary values remain integer minor units.

Runtime secrets, `.env`, PostgreSQL credentials, session secrets, generated web assets, and the browser's transient IndexedDB retry outbox are not exported.

## Restore semantics

MVP restore is **replace**, never merge. The backup household ID must match the household being restored. The UI requires explicit destructive confirmation and tells the user that current household data will be replaced.

The server validates format, version, required table set, record IDs, and household ownership before destructive work. Restore then deletes/reinserts household state in foreign-key-safe order inside one PostgreSQL transaction. Any database failure rolls the transaction back, so partial restore is not an accepted state.

Unsupported or malformed artifacts are rejected. Cross-household import/merge and arbitrary SQL dumps are intentionally unsupported.

## Recovery expectations

Create a fresh backup before risky maintenance or upgrades. Preserve backup files outside the Arta runtime directory when they are your recovery copy. Version compatibility is explicit; future backup schema changes must introduce compatibility handling or a new format version rather than silently accepting incompatible data.
