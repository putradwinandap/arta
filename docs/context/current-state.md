# Current State

Last updated: 2026-09-11

## Current phase

**Planning and reliability capabilities delivered as vertical slices; MVP operability and data recovery are being hardened.**

Arta has the household/wallet foundation, confirmed financial core, capture-first workflow, budgeting, reserved-fund goals, wallet reconciliation, unified household overview, and a supported self-hosted setup/start flow.

## Established product and domain rules

- Arta is an open-source, self-hosted-first family finance application.
- Repository is the durable AI-native source of truth; chat is temporary.
- Capture now, classify later. Pending captures have no trusted financial effect until confirmed.
- Transfers are explicit transfers, never household income + expense.
- Monetary calculations use exact integer minor units.
- Wallet balances are derived rather than stored as mutable truth.
- Budgets are household-wide per-currency limits over explicit inclusive UTC date periods.
- Financial goals represent actually reserved wallet funds. Reservations remain household wealth but reduce ordinary available-to-spend funds.
- Reconciliation compares observed physical balance with trusted ledger state; Arta never silently fabricates activity to hide a discrepancy.
- Household overview/reporting is derived and does not persist duplicate financial truth.
- Backup/restore is household-scoped, versioned, excludes runtime secrets, and MVP restore replaces rather than ambiguously merges household state.
- User-facing work follows the vertical-slice rule in `AGENTS.md`.

## Implemented product slices

- Issue #2 / PR #10: engineering scaffold.
- Issue #3 / PR #11: household and wallet domain foundation.
- Issue #12 / PR #15: household onboarding and wallet management UI.
- Issue #4 / PR #16: confirmed income/expense transactions and wallet transfers.
- Issue #5 / PR #17: Quick Capture and Transaction Inbox.
- Issue #6 / PR #18: MVP household spending budgets.
- Issue #7 / PR #19: reserved-fund financial goals.
- Issue #8 / PR #23: wallet reconciliation foundation, squash-merged as `6d1b9bc34dcbf43f08fb92b3f030705457c6608e`.
- Issue #20 / PR #25: household overview and basic reporting, merged as `10daf17d322079c28c54035c1a95059142fe35ac`.
- Issue #21 / PR #26: supported local/self-hosted installer and startup flow, squash-merged as `20fadbe4988bf1a3c22682aa9d013f66782ff87f` after all CI lanes passed.

## Current engineering foundation

- Client: React + TypeScript + Vite PWA; Dexie/IndexedDB capture outbox; Vitest + React Testing Library.
- Server: Go modular monolith, `net/http` + `chi`, REST, `pgx`.
- Database: PostgreSQL 17, Goose migrations, `sqlc` foundation, PostgreSQL integration tests.
- Delivery: Docker Compose, supported POSIX/PowerShell launchers, and GitHub Actions web/server/self-hosted-E2E lanes.
- Authentication: Argon2id/session foundation exists; complete login/invitation/authorization flows remain incomplete.

## Current execution target

Issue #22 — **Add safe backup and restore from the Arta interface**.

The MVP format is a versioned Arta JSON household snapshot. It preserves persisted household financial truth and audit history while excluding runtime secrets/configuration and transient browser retry state. Restore is explicit replace semantics, requires destructive confirmation, validates compatibility before mutation, and executes atomically in one PostgreSQL transaction. See `docs/product/backup-restore.md`.

## Still to decide / refine

- Detailed permissions and complete authentication/invitation behavior, including who may perform restore.
- Generalized offline sync/conflict rules beyond capture outbox.
- Distribution beyond a source checkout after the MVP path is validated.
- Household timezone semantics.
- Category model and future envelope/category budgeting.
- Stronger concurrency constraints where required.
- Android notification-based automatic capture feasibility (Issue #9).
- Reconciliation UX expansion for linking known missing transactions/transfers and pending Inbox candidates.
- Future backup migrations/compatibility policy beyond format version 1 and optional encryption at rest for exported files.

## Next execution steps

1. Complete Issue #22 end-to-end with export/download and confirmed restore UI/API.
2. Prove representative backup -> destructive change -> restore round-trip behavior in automated PostgreSQL-backed tests/E2E.
3. Reject malformed, cross-household, and unsupported-version artifacts before destructive work.
4. Keep secrets and unrelated server/runtime configuration outside household backup artifacts.
