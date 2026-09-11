# Current State

Last updated: 2026-09-11

## Current phase

**Core financial, planning, reliability, operability, and household backup/restore capabilities are delivered as vertical slices; the next MVP gap is complete authentication and household authorization.**

Arta has the household/wallet foundation, confirmed financial core, capture-first workflow, budgeting, reserved-fund goals, wallet reconciliation, unified household overview, safe household backup/restore, and a supported self-hosted setup/start flow.

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
- Destructive local reset is fail-closed and requires explicit typed confirmation before persistent PostgreSQL data can be removed.
- Browser-selected household state is a UI preference only; after the authentication slice is complete, authorization must be enforced server-side from authenticated household membership.
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
- Issue #22: safe household backup and restore from the Arta interface, completed and closed.
- Installer recovery hardening: Windows PowerShell 5.1 compatibility and guarded destructive reset behavior are implemented on `main`; latest verified `main` CI is green.

## Current engineering foundation

- Client: React + TypeScript + Vite PWA; Dexie/IndexedDB capture outbox; Vitest + React Testing Library.
- Server: Go modular monolith, `net/http` + `chi`, REST, `pgx`.
- Database: PostgreSQL 17, Goose migrations, `sqlc` foundation, PostgreSQL integration tests.
- Delivery: Docker Compose, supported POSIX/PowerShell launchers, and GitHub Actions web/server/self-hosted-E2E lanes.
- Data recovery: versioned household JSON backup/restore with explicit replace semantics and destructive confirmation.
- Authentication: Argon2id/session foundation exists; complete registration/login/invitation/authorization product flows remain incomplete.

## Current execution target

Issue #31 — **Complete MVP authentication and household authorization**.

The target is the smallest complete authentication vertical slice: register/login -> authenticated server session -> create or join household -> server-verified household membership -> household-scoped financial workflows -> logout/session invalidation.

`arta.householdId` may remain client-side active-household UI state, but it must never grant access by itself. Every household-scoped API must authorize the authenticated user against persisted household membership, and cross-household reads/writes must be rejected even when a client manually supplies another household ID.

## Still to decide / refine

- Minimal invitation/join mechanics and the smallest useful owner/member permission model for MVP.
- Generalized offline sync/conflict rules beyond capture outbox.
- Distribution beyond a source checkout after the MVP path is validated.
- Household timezone semantics.
- Category model and future envelope/category budgeting.
- Stronger concurrency constraints where required.
- Android notification-based automatic capture feasibility (Issue #9).
- Reconciliation UX expansion for linking known missing transactions/transfers and pending Inbox candidates.
- Future backup migrations/compatibility policy beyond format version 1 and optional encryption at rest for exported files.

## Next execution steps

1. Execute Issue #31 as an end-to-end authentication + household authorization vertical slice.
2. Make server-side authenticated membership, not browser-controlled household identity, the authorization boundary for all household-scoped APIs.
3. Add PostgreSQL-backed integration tests proving unauthenticated access and cross-household access are rejected without mutation.
4. Connect registration/login, household onboarding/join, active-household selection, and logout to the PWA.
5. Run canonical local guards before remote CI and update this state again when the slice materially changes the project.
