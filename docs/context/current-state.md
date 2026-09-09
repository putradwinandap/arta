# Current State

Last updated: 2026-09-09

## Current phase

**Financial core implementation with vertical-slice delivery**

The initial engineering scaffold is complete, Issue #3 / PR #11 delivered the household membership and wallet lifecycle foundation, and Issue #12 connects that foundation to Arta's first usable frontend workflow. After this slice, the next financial capability target remains transaction and wallet-transfer semantics in Issue #4.

## Established

- Product name: **Arta**
- Product category: family / household finance management
- Arta is **open source and self-hosted-first**; normal use does not require an Arta-operated SaaS backend.
- Repository is the durable AI-native source of truth.
- Product principle: **Low friction from installation to daily capture.**
- Core transaction principle: **Capture now, classify later.**
- Technical complexity should be absorbed by the product rather than imposed on users where practical.
- Transaction Inbox is a central product concept.
- Wallet transfers are explicit transfers, not income + expense.
- User-facing development defaults to the vertical-slice delivery rule in `AGENTS.md`: complete the smallest usable end-to-end workflow rather than accumulating disconnected technical layers.

## Implemented engineering foundation

### Client / PWA
- React + TypeScript + Vite under `apps/web`
- `vite-plugin-pwa` manifest/service-worker build foundation
- Dexie/IndexedDB local persistence foundation
- Zod available for runtime validation
- Vitest + React Testing Library foundation
- Production PWA served through Nginx in the current Compose topology

### Server
- Go modular-monolith foundation under `server`
- `net/http` + `chi`
- REST API boundary
- `/api/health` liveness endpoint
- `/api/ready` PostgreSQL readiness endpoint
- graceful shutdown
- `pgx` PostgreSQL connection pool
- Argon2id password hashing
- high-entropy session token and secure HttpOnly/SameSite cookie foundation

### Database
- PostgreSQL 17 technical deployment
- Goose SQL migrations, recorded in ADR-005
- `sqlc` typed query generation foundation
- persistent PostgreSQL Docker volume
- real PostgreSQL integration-test foundation

### Delivery / verification
- Docker Compose starts PostgreSQL, applies migrations, starts the Go server, builds/serves the PWA, and exposes Arta on port 8080
- PWA `/api/*` requests are proxied internally to the Go server
- contributor/self-hosted technical setup is documented in `docs/development/setup.md`
- GitHub Actions has three verification lanes: web, server, and self-hosted E2E
- Issue #2 / PR #10 completed the scaffold
- Issue #3 / PR #11 completed the household and wallet domain foundation
- Issue #12 is the first user-facing vertical slice connecting the existing household/wallet API to the React PWA

## Implemented household and wallet domain

- Household IDs are application-generated UUIDs.
- Household names are trimmed, required, and limited to 120 characters.
- Creating a household creates its initial owner membership atomically.
- Membership links a household to an authentication `subject_id`; advanced roles and permissions remain out of scope.
- A household can own multiple wallets.
- Wallet types are `cash`, `bank`, `e_wallet`, and `other`.
- Wallet currency is normalized to a three-letter uppercase code and established at creation for this domain slice.
- Wallet lifecycle is `active` -> `archived`.
- Archived wallets remain readable but cannot be modified through the wallet update domain operation.
- Archiving is a lifecycle transition rather than physical deletion.
- Critical household/wallet invariants are enforced below the UI layer in Go and duplicated as PostgreSQL constraints where practical.

Implemented server flows:

- Create/read household
- Create/list/read/update/archive wallet within household context
- PostgreSQL schema for households, memberships, and wallets through migration version 2
- Domain unit tests
- Real PostgreSQL integration coverage for household + multi-wallet + update/archive behavior

Issue #3 was verified by GitHub Actions run `34358170304`; web, server, and complete self-hosted E2E lanes all passed before PR #11 was merged.

## Household and wallet UI slice

Issue #12 adds the first usable product workflow on top of the existing domain/API foundation:

- Fresh-browser household onboarding.
- Browser-local persistence of the current household ID so the same self-hosted browser can reopen it without copying identifiers manually.
- Temporary browser-local subject UUID while full authentication/authorization remains unfinished; this is an explicit development bridge, not the final identity model.
- Wallet list with active and archived lifecycle states.
- Create wallet with name, type, and currency.
- Edit active wallet name/type.
- Archive wallet while preserving it as a visible read-only historical wallet.
- Responsive loading, empty, and API error states.
- Frontend tests and self-hosted Playwright coverage against the real API/PostgreSQL stack.

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
- Built-in self-hosted authentication
- Argon2id password hashing
- Server-side sessions with secure HttpOnly cookies

Full login, household invitation, and authorization flows are not implemented yet. The household UI currently uses a browser-local temporary subject identity only to exercise the already-accepted membership foundation. It must later be replaced by identity derived from an authenticated session.

### Offline/sync direction
- Local-first capture where appropriate using IndexedDB/Dexie
- Stable client-generated IDs
- Idempotent retry-safe synchronization
- No blind last-write-wins for sensitive financial state
- No CRDT/general distributed-database complexity for MVP

The scaffold establishes the local persistence boundary only. Transaction synchronization remains future implementation work.

## Distribution state

Docker Compose is the **first technical self-hosted path**, not the final low-friction normal-user installer.

The product requirement remains to evolve toward a launcher/CLI/installer that hides infrastructure complexity from ordinary users. A public deployment, if provided, remains a disposable demo/preview rather than production SaaS.

## Still to decide / refine

- Detailed permissions model
- Complete login/session/household invitation behavior
- Detailed sync endpoint contract and conflict rules
- Packaging evolution from Docker Compose toward CLI/launcher/installer
- Public demo hosting/deployment provider
- Wallet balance/reconciliation strategy
- Budgeting model
- Goal funding model
- Detailed transaction/capture persistence model
- Automatic transaction capture implementation

## Current execution target

Issue #12: **Household onboarding and wallet management UI**.

This slice turns the completed household/wallet backend foundation into an end-to-end usable workflow and establishes vertical-slice delivery in practice.

## Next execution steps

1. Complete and verify Issue #12 through frontend tests plus the real self-hosted E2E stack.
2. Continue with Issue #4 using the same vertical-slice rule: transaction and wallet-transfer semantics should include the user-facing workflow required to make the slice usable.
3. Implement quick capture and Transaction Inbox through Issue #5 as a later vertical slice.
4. Keep CI and self-hosted startup green as each slice is added.
5. Resolve wallet balance/reconciliation semantics only when the transaction model provides enough context to do so explicitly.
6. Defer generalized synchronization and automatic capture until the core financial model is trustworthy.
