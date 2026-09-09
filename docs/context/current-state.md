# Current State

Last updated: 2026-09-10

## Current phase

**Financial core implementation with vertical-slice delivery**

The engineering scaffold, household/wallet domain, and first household/wallet UI slice are complete. Issue #4 is now implementing trustworthy income, expense, wallet balances, and wallet transfers end to end across PostgreSQL, Go, REST, React, automated tests, and self-hosted E2E.

## Established

- Product name: **Arta**
- Product category: family / household finance management
- Arta is **open source and self-hosted-first**.
- Repository is the durable AI-native source of truth.
- Product principle: **Low friction from installation to daily capture.**
- Core transaction principle: **Capture now, classify later.**
- Transaction Inbox remains a central later product concept.
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
- Goose SQL migrations
- `sqlc` generation foundation
- persistent Docker volume
- real PostgreSQL integration tests

### Delivery / verification
- Docker Compose starts PostgreSQL, applies migrations, starts Go, and serves the PWA on port 8080.
- GitHub Actions has web, server, and self-hosted E2E lanes.
- Issue #2 / PR #10 completed the scaffold.
- Issue #3 / PR #11 completed household and wallet domain foundations.
- Issue #12 / PR #15 completed household onboarding and wallet management UI.

## Implemented household and wallet behavior

- Household creation with initial membership.
- Multiple wallets per household.
- Wallet types: `cash`, `bank`, `e_wallet`, `other`.
- Three-letter uppercase wallet currency.
- Wallet lifecycle `active` -> `archived`.
- Archived wallets remain visible/read-only.
- UI can create, edit, archive, reopen, and display wallets.
- Temporary browser-local subject identity remains an explicit bridge until full authentication/authorization exists.

## Transaction and transfer slice

Issue #4 introduces confirmed financial activity separately from the future quick-capture/Inbox model.

Implemented on the task branch:

- `transactions` schema for `income` and `expense`.
- `transfers` schema for one logical source-to-destination movement.
- Exact integer minor-unit money representation using Go `int64` and PostgreSQL `BIGINT`.
- Positive-amount validation.
- Self-transfer rejection.
- Same-household wallet scoping through service lookups.
- Same-currency requirement for transfers; FX is out of scope.
- Archived wallets reject new financial activity.
- Currency comes from the wallet rather than client input.
- Wallet balance is derived from income - expense - outgoing transfer + incoming transfer; there is no mutable wallet balance column.
- Household income/expense totals read only `transactions`, so transfers cannot inflate either total.
- REST endpoints for creating transactions/transfers and retrieving finance overview/history.
- React forms for income/expense and wallet transfers.
- Wallet balance, household totals, and recent activity UI.
- Domain tests, real PostgreSQL integration coverage, frontend tests, and expanded self-hosted Playwright flow.

Issue #4 does not add transaction edit/delete behavior. Historical financial records continue to favor auditability over silent mutation.

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

Issue #4 is confirmed-finance behavior. Offline capture/sync remains future work and must not be conflated with these confirmed records.

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
- Detailed quick-capture / Transaction Inbox persistence
- Automatic transaction capture implementation

## Current execution target

Issue #4: **Transaction and wallet-transfer functionality as a vertical slice**.

Completion requires all GitHub Actions lanes to pass against the real self-hosted stack before merge.

## Next execution steps

1. Verify and merge Issue #4 after web, server, and self-hosted E2E are green.
2. Implement Issue #5 quick capture and Transaction Inbox as the next vertical slice.
3. Keep confirmed transaction semantics separate from incomplete capture/review state.
4. Resolve opening balance/reconciliation only with an explicit financial-domain decision.
5. Defer generalized sync and automatic capture until the confirmed financial model is trustworthy.
