# Current State

Last updated: 2026-09-12

## Current phase

**The MVP foundation now includes authenticated household authorization; the next open product investigation is Android notification-based transaction capture.**

Arta has the household/wallet foundation, confirmed financial core, capture-first workflow, budgeting, reserved-fund goals, wallet reconciliation, unified household overview, safe household backup/restore, supported self-hosted setup/start, and an authenticated household boundary.

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
- Browser-selected household state is a UI preference only. Authorization is enforced server-side from the authenticated user's persisted household membership.
- CI security coverage must execute against PostgreSQL rather than silently skipping database-backed authorization assertions.
- When a CI failure exposes a repeatable local or fixture problem, add a preventive guard/fixture fix before relying on another remote run.
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
- Issue #31 / PR #32: MVP authentication and household authorization, squash-merged as `234338242874d16a0f90f2ef22efb11fb9d29582` after all CI lanes passed.
- Installer recovery hardening: Windows PowerShell 5.1 compatibility and guarded destructive reset behavior are implemented on `main`.

## Current engineering foundation

- Client: React + TypeScript + Vite PWA; Dexie/IndexedDB capture outbox; Vitest + React Testing Library.
- Server: Go modular monolith, `net/http` + `chi`, REST, `pgx`.
- Database: PostgreSQL 17, Goose migrations, `sqlc` foundation, PostgreSQL integration tests.
- Delivery: Docker Compose, supported POSIX/PowerShell launchers, and GitHub Actions web/server/self-hosted-E2E lanes.
- Data recovery: versioned household JSON backup/restore with explicit replace semantics and destructive confirmation.
- Authentication: persisted users with Argon2id password hashes, server-side hashed sessions, register/login/me/logout, authenticated household ownership, owner-created single-use invites, member join, and server-enforced household membership on household-scoped routes.
- Security regression coverage: PostgreSQL-backed tests prove cross-household reads/writes are rejected, forbidden writes do not mutate finance state, invite replay is rejected, and logout invalidates the old session. CI has an explicit security integration step so these assertions cannot silently disappear behind an unset database URL.

## Current execution target

Issue #9 — **Research Android notification-based transaction capture**.

This is a research/decision slice, not permission to ingest notification-derived transactions directly into trusted financial state. The investigation must preserve Arta's capture-first rule: notification-derived candidates should enter the Transaction Inbox with provenance/confidence and idempotency protections rather than silently becoming financial truth.

## Still to decide / refine

- Generalized offline sync/conflict rules beyond capture outbox.
- Distribution beyond a source checkout after the MVP path is validated.
- Household timezone semantics.
- Category model and future envelope/category budgeting.
- Stronger concurrency constraints where required.
- Android notification-based automatic capture feasibility (Issue #9).
- Reconciliation UX expansion for linking known missing transactions/transfers and pending Inbox candidates.
- Future backup migrations/compatibility policy beyond format version 1 and optional encryption at rest for exported files.
- Richer multi-household selection/switching UX and permission roles beyond the MVP owner/member boundary.

## Next execution steps

1. Execute Issue #9 as a bounded research/decision slice covering Android notification access, privacy/security, parsing reliability, duplicate/idempotency risks, provenance/confidence, and safe ingestion architecture.
2. Keep notification-derived data outside trusted ledger state until the user confirms it through the capture/review workflow.
3. Record the resulting pursue/prototype/postpone/reject decision in the repository source of truth before implementation work begins.
4. If the recommendation is to prototype, create a narrowly scoped implementation issue with explicit privacy and failure-mode acceptance criteria.
