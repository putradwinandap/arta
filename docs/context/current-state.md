# Current State

Last updated: 2026-09-17

## Current phase

**Arta has completed the authentication, household UX, navigation, dashboard, and UX stabilization phase tracked by Issue #33. Issues #34, #35, #36, #37, #38, #39, #40, and #44 are complete.**

Arta has the household/wallet foundation, confirmed financial core, capture-first workflow, budgeting, reserved-fund goals, wallet reconciliation, unified household overview, safe household backup/restore, supported self-hosted setup/start, authenticated household authorization, server-backed household discovery after login, and a unified household entry/selection/switching experience.

Issue #9 (Android notification-based transaction capture research) remains intentionally postponed as a coming-soon exploration; it is not the current execution target.

## Established product and domain rules

- Arta is an open-source, self-hosted-first family finance application.
- Repository is the durable AI-native source of truth; chat is temporary.
- Capture now, classify later. Pending captures have no trusted financial effect until confirmed.
- Transfers are explicit transfers, never household income + expense.
- Monetary calculations use exact integer minor units.
- Wallet balances are derived rather than stored as mutable truth.
- MVP budgets are household-wide per-currency limits over explicit inclusive UTC date periods. Issue #50 extends this with overlapping periods and explicit assignment of confirmed expenses to at most one same-household, same-currency budget.
- Financial goals represent actually reserved wallet funds. Reservations remain household wealth but reduce ordinary available-to-spend funds.
- Reconciliation compares observed physical balance with trusted ledger state; Arta never silently fabricates activity to hide a discrepancy.
- Household overview/reporting is derived and does not persist duplicate financial truth.
- Backup/restore is household-scoped, versioned, excludes runtime secrets, and MVP restore replaces rather than ambiguously merges household state.
- Destructive local reset is fail-closed and requires explicit typed confirmation before persistent PostgreSQL data can be removed.
- Browser-selected household state is a UI preference only. Household discovery and authorization come from the authenticated user's persisted server-side memberships.
- Switching household must update every household-scoped UI surface; no mount may remain pinned to stale browser state from a previous household.
- CI security coverage must execute against PostgreSQL rather than silently skipping database-backed authorization assertions.
- CI tool installation retries transient Go module registry failures up to three times before failing, so a temporary checksum/proxy outage is less likely to create a false-negative run.
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
- Issue #36 / PR #43: owner-only household invitation management UI with token creation, copy interaction, safe states, frontend coverage, and dependency verification; merged as `c335eac` and Issue #36 is closed.
- Issue #50 / branch `issue-50-budget-evolution`: overlapping budgets, explicit expense-to-budget assignment, capture-time budget selection, and idempotent request-triggered monthly auto-renewal are implemented and the issue is closed. Scheduler/background execution and richer renewal controls remain outside the completed scope.
- Installer recovery hardening: Windows PowerShell 5.1 compatibility and guarded destructive reset behavior are implemented on `main`.

## Current engineering foundation

- Client: React + TypeScript + Vite PWA; Dexie/IndexedDB capture outbox; Vitest + React Testing Library.
- Server: Go modular monolith, `net/http` + `chi`, REST, `pgx`.
- Database: PostgreSQL 17, Goose migrations, `sqlc` foundation, PostgreSQL integration tests.
- Delivery: Docker Compose, supported POSIX/PowerShell launchers, and GitHub Actions with a cheap deterministic preflight before PostgreSQL server integration and self-hosted E2E lanes.
- Data recovery: versioned household JSON backup/restore with explicit replace semantics and destructive confirmation.
- Authentication: persisted users with Argon2id password hashes, server-side hashed sessions, register/login/me/logout, authenticated household ownership, authenticated membership discovery, owner-created single-use invites, member join, and server-enforced household membership on household-scoped routes.
- Household UX: zero-membership users receive one Create/Join entry surface; valid server memberships control activation; one membership is selected automatically; multiple memberships can be switched; create/join remains available through household management.
- Offline recovery (Issue #44, complete): a previously authenticated browser can restore an offline-authenticated UI state after auth validation cannot reach the server; household, wallet, and overview snapshots are cached for read-only fallback. HTTP 401 remains distinct from network failure. A global offline indicator, reconnect/visibility retry for local captures, cache invalidation, user/household isolation, and session-expiry capture safety are implemented.
- Security regression coverage: PostgreSQL-backed tests prove cross-household reads/writes are rejected, forbidden writes do not mutate finance state, invite replay is rejected, and logout invalidates the old session. CI has an explicit security integration step so these assertions cannot silently disappear behind an unset database URL.
- Offline verification: web typecheck, 19 web tests, production PWA build, and Playwright E2E against `http://127.0.0.1:8080` pass. The E2E flow covers login, household setup, financial activity, API interruption, reload, cached activity visibility, offline Quick Capture, reconnect sync, and logout.
- Offline cache hardening: auth and household snapshots are invalidated on logout, explicit HTTP 401, and authenticated user changes; snapshots carry the active user ID; local captures remain retained when retry receives 401 and are eligible for a later retry after authentication recovery.
- Responsive app shell (Issue #37, PR #46, merged `ad341d4`): desktop sidebar and mobile menu now expose account/session controls, active household context, logout, and scoped destinations for dashboard, transactions, wallets, budgets, goals, reconciliation, and family/settings. Navigation controls preserve native keyboard/focus behavior, and representative desktop/mobile shell tests plus full E2E coverage are green.
- Dedicated financial workflow pages (Issue #38): Transactions & Inbox, Wallets, Budgets, Financial Goals, Reconciliation, and Family & Settings have clear routes and scoped surfaces. Dashboard no longer presents unrelated management forms; route titles and browser history state remain synchronized. Existing create/manage/review actions and responsive shell behavior remain covered by frontend and E2E verification.
- Dashboard overview (Issue #39 / PR #48, complete): the dashboard uses derived finance, capture, budget, goal, and reconciliation data to show physical/reserved/available funds, pending review, summary health, recent activity, useful empty/error states, and links to dedicated workflows. Management forms remain on their dedicated pages. Frontend tests, production build, Docker E2E, and CI all passed before merge.
- UX stabilization (Issue #40 / PR #49, complete): responsive navigation supports keyboard dismissal and clear focus indicators; dashboard, budget, goal, backup/restore, and reconciliation states expose consistent status/error semantics; reconciliation has explicit loading, empty, and accessible form states. Frontend tests, production build, Docker E2E, and all CI lanes passed before merge.

## CI lessons captured during Issue #35

- CI #149 and #150 failed in self-hosted E2E because the onboarding assertion still described an older UX contract. Unit tests were green, so changing selector text without checking the actual rendered `HouseholdEntry` contract caused a second avoidable remote failure.
- The regression guard now asserts the real accessible contract: the `Choose how to get started` heading, active Create Household tab, and visible Join Family tab.
- Before rerunning a failed E2E caused by a UI contract change, inspect the rendered component/source and align the test with stable semantic roles instead of guessing replacement copy.
- Final inspection of Issue #35 also found household-scoped mounts that could remain stale after an in-tab household switch. Budget and Backup/Restore mounts were aligned with the active household before the related changes were merged; existing Overview, Goals, and Reconciliation mounts already observe household changes.

## Current execution target

The stabilization baseline and the Issue #50 budget-evolution slice are complete. Frontend maintainability is now in progress: Issues #55, #56, #57, #60, and #62 are Done, while Issues #58, #59, and #61 remain Missing. The current execution target is Issue #58, followed by the remaining maintainability Issues incrementally.

Issue #33 — **Stabilize authentication, household UX, navigation, and dashboard information architecture** — is complete through Issues #34–#40. Issue #37 — **Build responsive Arta app shell and integrate account/session controls** — is complete and merged via PR #46 (`ad341d4`). Issue #38 — **Separate financial management workflows into dedicated pages** — is complete. Issue #39 — **Redesign Dashboard as a focused household financial overview** — is complete and merged via PR #48. Issue #40 — **Run responsive, accessibility, and UX stabilization pass** — is complete and merged via PR #49.

Issue #9 remains a future/coming-soon research target and is not scheduled for immediate execution.

Issue #44 — **Support offline-authenticated reload and cached household mode** — is complete and merged via PR #45 (`d3b7f73`).

## Still to decide / refine

- Generalized offline sync/conflict rules beyond capture outbox.
- Distribution beyond a source checkout after the MVP path is validated.
- Household timezone semantics.
- Category model and future envelope/category budgeting.
- Stronger concurrency constraints where required.
- Android notification-based automatic capture feasibility (Issue #9), future/coming soon and intentionally postponed.
- Reconciliation UX expansion for linking known missing transactions/transfers and pending Inbox candidates.
- Future backup migrations/compatibility policy beyond format version 1 and optional encryption at rest for exported files.
- Richer permission roles beyond the MVP owner/member boundary.
- Budget evolution beyond Issue #50: scheduler/background execution, reassignment timing, richer renewal controls, and any future category/envelope model remain open.

## Next execution steps

1. Keep the stabilization baseline maintained after Issues #33–#40 completion.
2. Execute Issues #58, #59, and #61 through scoped PRs; Issues #55, #56, #57, #60, and #62 are Done.
3. Reconcile this status after each maintainability slice and choose the next product target through roadmap/issue triage afterward.
4. Revisit Issue #9 only when Android capture becomes an explicitly scheduled priority.
