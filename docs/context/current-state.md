# Current State

Last updated: 2026-09-10

## Current phase

**Capture-first implementation with vertical-slice delivery**

The engineering scaffold, household/wallet domain and UI, and confirmed financial core are complete through Issue #4 / PR #16. Arta can now record income and expense, move money between wallets, derive wallet balances, and show household totals/history through the real self-hosted stack. The next execution target is Issue #5: quick capture and Transaction Inbox.

## Established

- Product name: **Arta**
- Product category: family / household finance management
- Arta is **open source and self-hosted-first**.
- Repository is the durable AI-native source of truth.
- Product principle: **Low friction from installation to daily capture.**
- Core transaction principle: **Capture now, classify later.**
- Transaction Inbox is a central product concept and the next implementation target.
- Wallet transfers are explicit transfers, not income + expense.
- User-facing development follows the vertical-slice delivery rule in `AGENTS.md`.

## Implemented engineering foundation

### Client / PWA
- React + TypeScript + Vite
- `vite-plugin-pwa`
- Dexie/IndexedDB foundation
- Zod available for runtime validation
- Vitest + React Testing Library
- Nginx-served production PWA in Compose

### Server
- Go modular monolith
- `net/http` + `chi`
- REST API
- `pgx` PostgreSQL pool
- Argon2id password foundation
- secure session-cookie foundation

### Database
- PostgreSQL 17
- Goose SQL migrations through version 3
- `sqlc` generation foundation
- persistent Docker volume
- real PostgreSQL integration tests

### Delivery / verification
- Docker Compose starts PostgreSQL, applies migrations, starts Go, and serves the PWA on port 8080.
- GitHub Actions has web, server, and self-hosted E2E lanes.
- Issue #2 / PR #10 completed the scaffold.
- Issue #3 / PR #11 completed household and wallet domain foundations.
- Issue #12 / PR #15 completed household onboarding and wallet management UI.
- Issue #4 / PR #16 completed the confirmed transaction and wallet-transfer vertical slice.
- Issue #4 was verified by GitHub Actions run `34383346717`; web, server, and self-hosted E2E all passed before merge.
- PR #16 was squash-merged as commit `11b747c3bf54c524274b79d313f036f3961b5882`.

## Implemented household and wallet behavior

- Household creation with initial membership.
- Multiple wallets per household.
- Wallet types: `cash`, `bank`, `e_wallet`, `other`.
- Three-letter uppercase wallet currency.
- Wallet lifecycle `active` -> `archived`.
- Archived wallets remain visible/read-only.
- UI can create, edit, archive, reopen, and display wallets.
- Temporary browser-local subject identity remains an explicit bridge until full authentication/authorization exists.

## Implemented confirmed financial core

Issue #4 establishes confirmed financial activity separately from the upcoming quick-capture/Inbox model.

- `transactions` persist confirmed `income` and `expense` records.
- `transfers` persist one logical source-to-destination wallet movement.
- Monetary values use exact integer minor-unit representation: Go `int64` and PostgreSQL `BIGINT`; financial domain/persistence code does not use floating-point arithmetic.
- Amounts must be strictly positive.
- Self-transfers are rejected explicitly.
- Source and destination wallets are resolved inside the same household.
- Transfers currently require matching wallet currencies; FX is out of scope.
- Archived wallets reject new financial activity.
- Transaction/transfer currency is derived from wallet state rather than trusted from client input.
- Wallet balance is derived from `income - expense - outgoing transfer + incoming transfer`; there is no mutable wallet-balance source of truth.
- Household income and expense totals read only confirmed transactions, so wallet transfers cannot inflate household income or expense.
- REST endpoints support creating income/expense, creating transfers, and reading finance overview/history.
- React UI supports income/expense entry, wallet transfers, wallet balances, household totals, and recent activity.
- Domain tests, real PostgreSQL integration coverage, frontend tests, and self-hosted Playwright cover the slice end to end.

Verified example from the real self-hosted flow:

```text
BCA income       +1,000,000
BCA expense        -250,000
BCA -> Cash        -300,000
---------------------------
BCA balance         450,000
Cash balance        300,000

Household totals:
income            1,000,000
expense             250,000
transfer excluded
```

Issue #4 intentionally does not add transaction edit/delete behavior. Historical financial records continue to favor auditability over silent mutation.

## Accepted MVP implementation architecture

### Client
- React
- TypeScript
- Vite
- `vite-plugin-pwa`
- IndexedDB + Dexie
- Zod

### Server
- Go
- `net/http` + `chi`
- REST API
- Modular monolith

### Database
- PostgreSQL
- `pgx`
- `sqlc`
- Goose migrations

### Authentication
- Built-in self-hosted authentication direction
- Argon2id password hashing
- Server-side sessions with secure HttpOnly cookies

Full login, household invitation, and authorization flows are not implemented yet.

### Offline/sync direction
- Local-first capture where appropriate using IndexedDB/Dexie
- Stable client-generated IDs
- Idempotent retry-safe synchronization
- No blind last-write-wins for sensitive financial state
- No CRDT/general distributed-database complexity for MVP

Confirmed financial records are now implemented. Issue #5 must keep incomplete capture/review state conceptually and operationally separate from those confirmed records.

## Distribution state

Docker Compose remains the first technical self-hosted path, not the final normal-user installer. A future public deployment remains a disposable demo/preview rather than production SaaS.

## Still to decide / refine

- Detailed permissions model
- Complete login/session/household invitation behavior
- Detailed sync endpoint contract and conflict rules
- Packaging evolution from Docker Compose toward CLI/launcher/installer
- Public demo hosting/deployment provider
- Opening-balance and reconciliation semantics
- Budgeting model
- Goal funding model
- Detailed quick-capture / Transaction Inbox persistence semantics
- Automatic transaction capture implementation

## Current execution target

Issue #5: **Quick capture and Transaction Inbox**.

The next slice should make the product's defining principle real: a user can record incomplete transaction information with very low friction, keep it safely pending, and later classify/confirm it into the trustworthy financial core without losing provenance or creating duplicates.

## Next execution steps

1. Implement Issue #5 quick capture and Transaction Inbox as a complete vertical slice.
2. Keep incomplete capture/review state separate from confirmed transaction semantics.
3. Use stable IDs and retry-safe/idempotent boundaries where the capture flow introduces offline or repeated writes.
4. Keep Docker Compose plus all three CI lanes green as the capture slice is added.
5. Resolve opening balance/reconciliation only through an explicit financial-domain decision when enough transaction context exists.
6. Defer generalized synchronization and automatic capture integrations until the capture model itself is trustworthy.
