# Current State

Last updated: 2026-09-10

## Current phase

**Planning-core implementation with vertical-slice delivery**

Arta's engineering scaffold, household/wallet workflows, confirmed transaction/transfer core, and defining capture-first workflow are complete through Issue #5 / PR #17. A user can now capture an amount immediately, keep incomplete information safely pending, review/classify it later, and confirm it into the trustworthy financial ledger. The next execution target is Issue #6: MVP budgeting.

## Established

- Product name: **Arta**
- Product category: family / household finance management
- Arta is **open source and self-hosted-first**.
- Repository is the durable AI-native source of truth.
- Product principle: **Low friction from installation to daily capture.**
- Core transaction principle: **Capture now, classify later.**
- Transaction Inbox is implemented as the trust boundary between incomplete capture and confirmed finance.
- Wallet transfers are explicit transfers, not income + expense.
- User-facing development follows the vertical-slice delivery rule in `AGENTS.md`.

## Implemented engineering foundation

### Client / PWA
- React + TypeScript + Vite
- `vite-plugin-pwa`
- Dexie/IndexedDB capture outbox
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
- Goose SQL migrations through version 4
- `sqlc` generation foundation
- persistent Docker volume
- real PostgreSQL integration tests

### Delivery / verification
- Docker Compose starts PostgreSQL, applies migrations, starts Go, and serves the PWA on port 8080.
- GitHub Actions has web, server, and self-hosted E2E lanes.
- Issue #2 / PR #10 completed the scaffold.
- Issue #3 / PR #11 completed household and wallet domain foundations.
- Issue #12 / PR #15 completed household onboarding and wallet management UI.
- Issue #4 / PR #16 completed confirmed transactions and wallet transfers.
- Issue #5 / PR #17 completed Quick Capture and Transaction Inbox.
- Issue #5 was verified by GitHub Actions run `34460805809`; web, server, and self-hosted E2E all passed before merge.
- PR #17 was squash-merged as commit `25fba29d8a8630a9e0314f2f26b4b27ee8c4e6ff`.

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

- `transactions` persist confirmed `income` and `expense` records.
- `transfers` persist one logical source-to-destination wallet movement.
- Monetary values use exact integer minor units: Go `int64` and PostgreSQL `BIGINT`.
- Positive amounts, household wallet scoping, archived-wallet restrictions, self-transfer rejection, and same-currency transfer rules are enforced below the UI.
- Wallet balance is derived from `income - expense - outgoing transfer + incoming transfer`; there is no mutable wallet-balance source of truth.
- Household income/expense totals read only confirmed transactions, so transfers cannot inflate them.
- Historical transaction edit/delete remains intentionally deferred in favor of auditability.

## Implemented Quick Capture and Transaction Inbox

Issue #5 makes Arta's defining product principle operational.

### Capture boundary

- Quick Capture requires only a positive `amount`; note is optional.
- Wallet, income/expense kind, category, and other enrichment are intentionally not required during capture.
- The PWA generates a stable UUID and writes the capture to IndexedDB before attempting the server request.
- The narrow local outbox preserves captures during temporary server/network unavailability and retries with the same UUID when connectivity returns.
- Capture creation is idempotent by UUID and a retry cannot overwrite the original captured facts.
- This IndexedDB behavior is intentionally limited to transaction capture; generalized offline synchronization remains future work.

### Transaction Inbox

- PostgreSQL `transaction_captures` stores pending capture state, provenance, classification fields, and its eventual confirmed transaction link.
- Pending captures may intentionally lack wallet and transaction kind.
- Inbox review can add an active household wallet, choose income/expense, and adjust amount/note.
- Pending captures remain excluded from wallet balances, household income/expense totals, and future budget spending calculations.

### Confirmation

- Confirmation requires a reviewed pending capture with wallet, kind, and positive amount.
- The server creates the confirmed transaction and marks the capture confirmed/linkage in one PostgreSQL transaction.
- Repeated confirmation returns the same linked transaction instead of creating a duplicate.
- Provenance remains available through capture source, capture timestamp, status, and capture-to-transaction link.

Implemented flow:

```text
Quick Capture
amount + optional note
        |
        v
IndexedDB outbox
        |
        v
server pending capture
        |
        v
Transaction Inbox
        |
        v
review wallet + income/expense
        |
        v
atomic confirm
        |
        v
trusted transaction ledger
```

Trust rule:

```text
pending capture != confirmed transaction
pending capture -> no balance/reporting/budget effect
confirmed transaction -> trusted financial calculations
```

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

Issue #5 implements only the narrow capture outbox needed for low-friction durability. It does not establish a generalized sync engine.

## Distribution state

Docker Compose remains the first technical self-hosted path, not the final normal-user installer. A future public deployment remains a disposable demo/preview rather than production SaaS.

## Still to decide / refine

- Initial MVP budget scope/model
- Detailed permissions model
- Complete login/session/household invitation behavior
- Detailed generalized sync endpoint contract and conflict rules
- Packaging evolution from Docker Compose toward CLI/launcher/installer
- Public demo hosting/deployment provider
- Opening-balance and reconciliation semantics
- Goal funding model
- Automatic transaction capture implementation

## Current execution target

Issue #6: **Design and implement MVP budgeting**.

Before implementation, select the smallest durable budget scope/model. The implementation must count only eligible confirmed expenses, calculate remaining amount exactly, exclude transfers, and explicitly keep pending/untrusted captures outside budget spending.

## Next execution steps

1. Resolve and document the MVP budget scope/model required by Issue #6.
2. Implement budgeting as a complete vertical slice across PostgreSQL, Go, REST, React, automated tests, and self-hosted E2E.
3. Reuse the established trust boundary: only eligible confirmed expenses consume budget; transfers and pending captures do not.
4. Keep exact integer monetary representation and all three CI lanes green.
5. Resolve opening balance/reconciliation only through an explicit financial-domain decision when needed.
6. Defer generalized synchronization and automatic capture integrations until the current core remains trustworthy.
