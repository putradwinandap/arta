# Current State

Last updated: 2026-09-10

## Current phase

**Planning and reliability capabilities delivered as vertical slices.**

Arta now has the household/wallet foundation, confirmed financial core, capture-first workflow, budgeting, reserved-fund goals, and wallet reconciliation foundation. Issue #20 is adding the first unified household overview.

## Established product and domain rules

- Arta is an open-source, self-hosted-first family finance application.
- Repository is the durable AI-native source of truth; chat is temporary.
- Capture now, classify later. Pending captures have no trusted financial effect until confirmed.
- Transfers are explicit transfers, never household income + expense.
- Monetary calculations use exact integer minor units.
- Wallet balances are derived rather than stored as mutable truth.
- Budgets are household-wide per-currency limits over explicit inclusive UTC date periods.
- Financial goals represent actually reserved wallet funds. Reservations remain household wealth but reduce ordinary available-to-spend funds.
- Reconciliation compares an observed physical balance with Arta's trusted ledger. Arta never silently fabricates a transaction or adjustment to hide a discrepancy.
- User-facing work follows the vertical-slice rule in `AGENTS.md`.

## Implemented product slices

- Issue #2 / PR #10: engineering scaffold.
- Issue #3 / PR #11: household and wallet domain foundation.
- Issue #12 / PR #15: household onboarding and wallet management UI.
- Issue #4 / PR #16: confirmed income/expense transactions and wallet transfers.
- Issue #5 / PR #17: Quick Capture and Transaction Inbox.
- Issue #6 / PR #18: MVP household spending budgets.
- Issue #7 / PR #19: reserved-fund financial goals.
- Issue #8 / PR #23: wallet reconciliation foundation, squash-merged as `6d1b9bc34dcbf43f08fb92b3f030705457c6608e` after web, server, and self-hosted E2E CI passed.

## Current engineering foundation

- Client: React + TypeScript + Vite PWA; Dexie/IndexedDB capture outbox; Vitest + React Testing Library.
- Server: Go modular monolith, `net/http` + `chi`, REST, `pgx`.
- Database: PostgreSQL 17, Goose migrations, `sqlc` foundation, PostgreSQL integration tests.
- Delivery: Docker Compose and GitHub Actions web/server/self-hosted-E2E lanes.
- Authentication: Argon2id/session foundation exists; complete login/invitation/authorization flows remain incomplete.

## Current execution target

Issue #20 — **Build household overview and basic reporting**.

The overview is a derived read model over existing trusted state. It combines physical/reserved/available wallet money, current budgets, active goal progress, and recent confirmed activity without introducing duplicate financial truth. See `docs/product/household-overview.md`.

## Still to decide / refine

- Detailed permissions and complete authentication/invitation behavior.
- Generalized offline sync/conflict rules beyond capture outbox.
- Packaging evolution from Docker Compose toward normal-user installer/launcher (Issue #21).
- Safe UI-driven backup and restore (Issue #22).
- Household timezone semantics.
- Category model and future envelope/category budgeting.
- Stronger concurrency constraints where required.
- Android notification-based automatic capture feasibility (Issue #9).
- Reconciliation UX expansion for linking known missing transactions/transfers and pending Inbox candidates.

## Next execution steps

1. Complete Issue #20 through service aggregation, API, main UI, automated tests, and CI.
2. Keep the overview derived from existing financial truth; never persist duplicate balance/progress state.
3. After Issue #20, select the next roadmap slice, with installer/startup and backup/restore already tracked separately.
