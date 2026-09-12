# Current State

Last updated: 2026-09-12

## Current phase

**Arta is in the authentication, household UX, navigation, and dashboard stabilization phase tracked by Issue #33. Issues #34 and #35 are complete; Issue #36 is the active vertical slice.**

Arta has the household/wallet foundation, confirmed financial core, capture-first workflow, budgeting, reserved-fund goals, wallet reconciliation, unified household overview, safe household backup/restore, supported self-hosted setup/start, authenticated household authorization, server-backed household discovery after login, and a unified household entry/selection/switching experience.

Issue #9 (Android notification-based transaction capture research) is intentionally postponed until the stabilization umbrella is complete enough to resume product expansion safely.

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
- Browser-selected household state is a UI preference only. Household discovery and authorization come from the authenticated user's persisted server-side memberships.
- Switching household must update every household-scoped UI surface; no mount may remain pinned to stale browser state from a previous household.
- CI security coverage must execute against PostgreSQL rather than silently skipping database-backed authorization assertions.
- Deterministic formatting, typecheck, web-test, and web-build failures are checked in the cheap CI preflight before expensive PostgreSQL integration and self-hosted E2E jobs.
- When a CI failure exposes a repeatable local, fixture, or UX-contract problem, identify the root cause and add/update a preventive guard before relying on another remote run. Do not repeatedly burn CI quota on the same known failure.
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
- Issue #34 / PR #41: server-authoritative fresh-browser household bootstrap, authenticated membership discovery, safe stale-local-selection fallback, bootstrap regression coverage, and CI fail-fast hardening; squash-merged as `80576ddb9f5c4f2855fea3a164dcc29f5769a684` after CI #147 passed.
- Issue #35 / PR #42: unified zero-household Create/Join entry, membership refresh after create/join, multi-household selection/switching, and household management access for existing users; merged as `d519d2e` and Issue #35 is closed.
- Installer recovery hardening: Windows PowerShell 5.1 compatibility and guarded destructive reset behavior are implemented on `main`.

## Current engineering foundation

- Client: React + TypeScript + Vite PWA; Dexie/IndexedDB capture outbox; Vitest + React Testing Library.
- Server: Go modular monolith, `net/http` + `chi`, REST, `pgx`.
- Database: PostgreSQL 17, Goose migrations, `sqlc` foundation, PostgreSQL integration tests.
- Delivery: Docker Compose, supported POSIX/PowerShell launchers, and GitHub Actions with a cheap deterministic preflight before PostgreSQL server integration and self-hosted E2E lanes.
- Data recovery: versioned household JSON backup/restore with explicit replace semantics and destructive confirmation.
- Authentication: persisted users with Argon2id password hashes, server-side hashed sessions, register/login/me/logout, authenticated household ownership, authenticated membership discovery, owner-created single-use invites, member join, and server-enforced household membership on household-scoped routes.
- Household UX: zero-membership users receive one Create/Join entry surface; valid server memberships control activation; one membership is selected automatically; multiple memberships can be switched; create/join remains available through household management.
- Security regression coverage: PostgreSQL-backed tests prove cross-household reads/writes are rejected, forbidden writes do not mutate finance state, invite replay is rejected, and logout invalidates the old session. CI has an explicit security integration step so these assertions cannot silently disappear behind an unset database URL.

## CI lessons captured during Issue #35

- CI #149 and #150 failed in self-hosted E2E because the onboarding assertion still described an older UX contract. Unit tests were green, so changing selector text without checking the actual rendered `HouseholdEntry` contract caused a second avoidable remote failure.
- The regression guard now asserts the real accessible contract: the `Choose how to get started` heading, active Create Household tab, and visible Join Family tab.
- Before rerunning a failed E2E caused by a UI contract change, inspect the rendered component/source and align the test with stable semantic roles instead of guessing replacement copy.
- Final inspection of Issue #35 also found household-scoped mounts that could remain stale after an in-tab household switch. Budget and Backup/Restore mounts are being aligned with the active household before merge; existing Overview, Goals, and Reconciliation mounts already observe household changes.

## Current execution target

Issue #33 — **Stabilize authentication, household UX, navigation, and dashboard information architecture**.

The active slice is Issue #36 — **Add owner household invitation management UI**. Issue #35 / PR #42 is merged and closed.

Issue #9 remains postponed while this stabilization sequence is active.

## Still to decide / refine

- Generalized offline sync/conflict rules beyond capture outbox.
- Distribution beyond a source checkout after the MVP path is validated.
- Household timezone semantics.
- Category model and future envelope/category budgeting.
- Stronger concurrency constraints where required.
- Android notification-based automatic capture feasibility (Issue #9), postponed during stabilization.
- Reconciliation UX expansion for linking known missing transactions/transfers and pending Inbox candidates.
- Future backup migrations/compatibility policy beyond format version 1 and optional encryption at rest for exported files.
- Richer permission roles beyond the MVP owner/member boundary.

## Next execution steps

1. Finish Issue #36: expose owner invitation creation/view/copy management in the household UI while preserving server-enforced owner authorization.
3. Continue the Issue #33 stabilization sequence with responsive app shell/session controls, dedicated financial workflow pages, dashboard redesign, and the final responsive/accessibility/UX pass.
4. Resume Issue #9 only after the stabilization umbrella is sufficiently complete and the source of truth explicitly advances the execution target.
