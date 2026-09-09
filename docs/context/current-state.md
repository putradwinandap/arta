# Current State

Last updated: 2026-09-09

## Current phase

**Engineering foundation / scaffold implementation**

The MVP architecture from ADR-004 has now been scaffolded on branch `issue-2-scaffold` through Issue #2 and draft PR #10. Verification is performed through GitHub Actions before the issue is considered complete.

## Established

- Product name: **Arta**
- Product category: family / household finance management
- Arta is **open source and self-hosted-first**; the project does not intend to require an Arta-operated SaaS backend for normal use.
- Repository is the durable AI-native source of truth.
- Primary product problem: transactions are often missed because recording them at purchase time creates friction.
- Product adoption must also be low-friction: download, installation, device requirements, dependencies, setup, onboarding, permissions, and updates should not become barriers to using Arta.
- Product principle: **Low friction from installation to daily capture.**
- Product distribution principle: self-hosting should not require ordinary users to set up a development environment.
- Core transaction principle: **Capture now, classify later.**
- Technical complexity should be absorbed by the product rather than imposed on users where practical.
- Transaction Inbox is a central product concept.
- Wallet transfers are explicit transfers, not income + expense.

## Implemented scaffold

### Client / PWA
- React + TypeScript + Vite application under `apps/web`
- `vite-plugin-pwa` manifest/service-worker build foundation
- Dexie/IndexedDB local database foundation
- Zod dependency ready for runtime validation
- Vitest + React Testing Library test foundation
- Production PWA container served through Nginx

### Server
- Go 1.27 modular-monolith foundation under `server`
- `net/http` + `chi` routing
- `/api/health` liveness endpoint
- `/api/ready` PostgreSQL readiness endpoint
- graceful HTTP shutdown
- `pgx` PostgreSQL connection pool
- Argon2id password hashing foundation

### Database
- PostgreSQL 17 technical deployment
- SQL-first migration files
- Goose selected as migration tool in ADR-005
- `sqlc` configuration and a trivial typed query definition
- persistent PostgreSQL Docker volume

### Delivery / verification
- Docker Compose starts PostgreSQL, applies migrations, starts the Go server, builds/serves the PWA, and exposes Arta on port 8080
- PWA `/api/*` requests are proxied internally to the Go server
- GitHub Actions verifies web typecheck/tests/build and backend database/toolchain/tests/build
- Playwright E2E test foundation exists
- contributor setup documented in `docs/development/setup.md`
- draft PR #10 tracks the scaffold change and closes Issue #2 when merged

## Accepted MVP implementation architecture

### Client
- React
- TypeScript
- Vite
- `vite-plugin-pwa`
- IndexedDB
- Dexie
- Zod

### Server
- Go
- `net/http`
- `chi`
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

The scaffold currently implements the password-hashing foundation. Full login/session/household authentication flows remain future product work.

### Offline/sync direction
- Local-first capture where appropriate using IndexedDB/Dexie
- Stable client-generated IDs
- Idempotent retry-safe sync behavior
- No blind last-write-wins for sensitive financial state
- No CRDT/general distributed-database complexity for the MVP

The scaffold establishes local persistence only. The generalized transaction sync engine is intentionally not part of Issue #2.

## Developer/platform constraints

- Primary development environment is Windows.
- Primary personal mobile testing device is iPhone.
- The PWA-first path remains testable without a Mac or iOS-native signing workflow.

## Repository foundation completed

- AI agent instructions
- Product vision and requirements
- Product glossary and conceptual flows
- Architecture principles and conceptual data model
- ADR-001 through ADR-005
- Roadmap and MVP definition
- Assumption/open-question register
- GitHub task backlog
- MVP implementation stack decision
- Initial application scaffold on `issue-2-scaffold`

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

Issue #2: **Scaffold Arta application foundation**.

The code scaffold exists. Remaining completion work is verification against its acceptance criteria and merging PR #10.

## Next execution steps

1. Finish CI verification for the scaffold.
2. Validate Docker Compose startup and PWA/API routing through the reproducible workflow.
3. Merge PR #10 and close Issue #2 when acceptance criteria are satisfied.
4. Begin the domain foundation with household, wallet, and transaction semantics.
5. Build the minimal quick-capture -> Transaction Inbox -> confirm flow before advanced automation.
