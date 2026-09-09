# Current State

Last updated: 2026-09-09

## Current phase

**Financial core implementation**

Issue #2 and PR #10 completed the initial Arta application scaffold. Issue #3 is now implementing the first real financial-domain slice: household membership and wallet lifecycle behavior.

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
- Issue #2 is closed and PR #10 is merged

## Household and wallet domain implementation

Issue #3 implementation exists on branch `issue-3-household-wallet` and is pending CI/PR verification before merge.

Implemented domain decisions:

- Household IDs are application-generated UUIDs.
- Household names are trimmed, required, and limited to 120 characters.
- Creating a household creates its initial owner membership atomically.
- Membership links a household to an authentication `subject_id`; advanced roles and permissions remain out of scope.
- A household can own multiple wallets.
- Wallet types are `cash`, `bank`, `e_wallet`, and `other`.
- Wallet currency is a three-letter uppercase code established at creation.
- Wallet lifecycle is `active` -> `archived`.
- Archived wallets remain readable but cannot be modified through the wallet update domain operation.
- Archiving is a lifecycle transition rather than physical deletion.
- Critical household/wallet invariants are enforced below the UI layer in Go and duplicated as PostgreSQL constraints where practical.

Implemented server flows:

- Create/read household
- Create/list/read/update/archive wallet within household context
- PostgreSQL migration for households, memberships, and wallets
- Domain unit tests
- Real PostgreSQL integration coverage for household + multi-wallet + update/archive flow

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

Full login, household invitation, and authorization flows are not implemented yet. Issue #3 only establishes the membership relationship needed by the financial domain.

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

Issue #3: **Household and wallet domain foundation**.

The implementation is ready for automated verification. It must not be considered complete until migrations, domain tests, PostgreSQL integration behavior, existing web/server checks, and self-hosted startup remain green.

## Next execution steps

1. Verify Issue #3 through CI and merge its PR only when acceptance criteria are satisfied.
2. Implement transaction and wallet-transfer semantics through Issue #4.
3. Implement quick capture and Transaction Inbox through Issue #5.
4. Keep CI and self-hosted startup green as each domain slice is added.
5. Defer generalized synchronization and automatic capture until the core financial model is trustworthy.
