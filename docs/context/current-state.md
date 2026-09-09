# Current State

Last updated: 2026-09-09

## Current phase

**Engineering foundation complete / financial core next**

Issue #2 and PR #10 completed the initial Arta application scaffold. The accepted MVP architecture is now implemented on `main` and verified through GitHub Actions, including a full self-hosted Docker Compose browser E2E path.

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
- `sqlc` typed query generation
- persistent PostgreSQL Docker volume
- real PostgreSQL integration-test foundation

### Delivery / verification
- Docker Compose starts PostgreSQL, applies migrations, starts the Go server, builds/serves the PWA, and exposes Arta on port 8080
- PWA `/api/*` requests are proxied internally to the Go server
- contributor/self-hosted technical setup is documented in `docs/development/setup.md`
- GitHub Actions has three verification lanes: web, server, and self-hosted E2E
- verified self-hosted E2E covers Compose build/startup, `/api/health`, `/api/ready`, the PWA root, Playwright browser behavior, and clean shutdown
- Issue #2 is closed and PR #10 is merged

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

Full login, household invitation, membership, and authorization flows are not implemented yet.

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

## Developer/platform constraints

- Primary development environment is Windows.
- Primary personal mobile testing device is iPhone.
- The PWA-first path remains testable without requiring a Mac or iOS-native signing workflow.

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
- Initial application scaffold and CI/self-hosted verification

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

The project should now move from infrastructure scaffolding into real financial-domain behavior while preserving the invariants and boundaries established in the repository documentation.

## Next execution steps

1. Implement the household and wallet domain foundation through Issue #3.
2. Implement transaction and wallet-transfer semantics through Issue #4.
3. Implement quick capture and Transaction Inbox through Issue #5.
4. Keep CI and self-hosted startup green as each domain slice is added.
5. Defer generalized synchronization and automatic capture until the core financial model is trustworthy.
