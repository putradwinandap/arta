# Current State

Last updated: 2026-09-10

## Current phase

**Planning-core implementation with vertical-slice delivery**

Arta's engineering scaffold, household/wallet workflows, confirmed transaction/transfer core, capture-first workflow, and MVP budgeting are complete through Issue #6 / merged PR #18. The current execution target is Issue #7: financial goals.

## Established

- Product name: **Arta**
- Product category: family / household finance management
- Arta is **open source and self-hosted-first**.
- Repository is the durable AI-native source of truth.
- Product principle: **Low friction from installation to daily capture.**
- Core transaction principle: **Capture now, classify later.**
- Transaction Inbox is the trust boundary between incomplete capture and confirmed finance.
- Wallet transfers are explicit transfers, not income + expense.
- MVP budgets are household-wide, per-currency spending limits over explicit inclusive date periods.
- Financial goals represent **actually reserved funds**, not manually claimed progress. Goal progress must be backed by real money allocated to the goal and must not double-count household funds.
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
- Goose SQL migrations through version 6
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
- Issue #6 / PR #18 completed MVP household spending budgets.
- PR #18 was squash-merged into `main` as `a8a2169dfc561c47d73b742f9087f67c6628a189` after GitHub Actions run `34475333435` (#74) passed web, server, and self-hosted E2E.

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

- Quick Capture requires only a positive amount; note is optional.
- The PWA persists capture to an IndexedDB outbox before attempting the server request and retries with a stable UUID.
- PostgreSQL `transaction_captures` stores pending capture state, provenance, classification fields, and eventual confirmed transaction linkage.
- Pending captures remain excluded from balances, income/expense totals, and budget spending.
- Confirmation creates the trusted transaction and capture linkage atomically and is idempotent.

Trust rule:

```text
pending capture != confirmed transaction
pending capture -> no balance/reporting/budget effect
confirmed transaction -> trusted financial calculations
```

## Implemented MVP budgeting

- A budget belongs to one household and one currency over an explicit inclusive date period.
- Only confirmed expenses in the same household, currency, and period contribute to `spent`.
- Income, transfers, pending captures, out-of-period expenses, and cross-currency expenses do not consume budget.
- `remaining = limit - spent` and may become negative after overspending.
- Overlapping budgets for the same household and currency are rejected.
- Budget period boundaries currently use UTC calendar dates because household timezone is not yet modeled.
- Category/envelope budgeting is deferred until transactions have trusted category semantics.
- The durable decision is recorded in `docs/architecture/decisions/ADR-006-mvp-budget-model.md`.

## Financial goal direction

Issue #7 must model a goal as money that the household has **actually set aside** for a purpose, matching the real-world behavior of moving money into savings for that goal.

Required invariants for the design:

- Goal progress cannot be an arbitrary manually entered number.
- Increasing goal progress must correspond to an explicit allocation/reservation of real household funds.
- Reserved money remains part of household wealth but must be distinguishable from money available for ordinary spending.
- Reserving money for a goal is not income or expense and must not distort income/expense reporting or budget spending.
- The same money must not be reserved to multiple goals at once.
- Releasing or moving reserved funds must be explicit and auditable.
- Exact integer minor-unit monetary representation remains mandatory.

The precise persistence and wallet interaction model will be finalized in ADR-007 as part of Issue #7 before implementation expands.

## Implemented reserved-fund financial goals

Issue #7 adds goals whose progress is backed by real wallet funds.

- Goals have household, currency, target amount, active/archived lifecycle, and derived reserved progress.
- `goal_reservation_events` records explicit reserve/release operations tied to a real source wallet.
- Reserving money does not change physical wallet balance and is neither income, expense, transfer, nor budget spending.
- Finance overview distinguishes physical, reserved, and available wallet money; `available = physical balance - reserved`.
- Reservations cannot exceed available wallet money, preventing the same funds from backing multiple goals.
- Releases cannot exceed the amount reserved by that goal from that wallet.
- Goal remaining target is floored at zero while reservation history remains auditable.
- REST endpoints and PWA workspace support create, edit, archive, reserve, release, and progress display.
- ADR-007 and `docs/product/financial-goals.md` define the durable semantics.

## Accepted MVP implementation architecture

- Client: React, TypeScript, Vite, PWA, IndexedDB/Dexie where appropriate.
- Server: Go modular monolith, `net/http` + `chi`, REST API.
- Database: PostgreSQL, `pgx`, `sqlc`, Goose migrations.
- Authentication direction: built-in self-hosted auth with Argon2id and server-side secure sessions; full login/invitation/authorization flows remain incomplete.
- Offline direction: local-first capture with stable IDs and idempotent retry; no generalized CRDT/sync engine for MVP.

## Distribution state

Docker Compose remains the first technical self-hosted path, not the final normal-user installer. A future public deployment remains a disposable demo/preview rather than production SaaS.

## Still to decide / refine

- Detailed permissions model and complete authentication/invitation behavior
- Generalized sync contract and conflict rules
- Packaging evolution from Docker Compose toward CLI/launcher/installer
- Public demo hosting/deployment provider
- Opening-balance and reconciliation semantics
- Exact goal reservation persistence/wallet interaction model (Issue #7 / ADR-007)
- Household timezone semantics
- Category model and future category/envelope budgeting
- Database-level concurrency protection for overlapping budget creation
- Automatic transaction capture implementation

## Current execution target

Issue #7 reserved-fund financial goals are implemented in PR #19 and are pending final CI/merge.

## Next execution steps

1. Merge PR #19 only after web, server, and self-hosted E2E CI lanes are green.
2. Select the next coherent roadmap Issue after the planning-core goal slice is merged.
3. Preserve exact integer monetary representation and the distinction between physical, reserved, and available funds.
4. Keep goal reservations separate from income/expense, budget spending, and physical wallet transfers.
5. Resolve future reconciliation and automatic-capture work through explicit domain decisions rather than weakening the trusted ledger.
