# ADR-004: MVP Technical Architecture

Status: Accepted

Date: 2026-09-09

## Context

Arta is an open-source, self-hosted-first family finance application. The MVP must be practical for households to run without requiring an Arta-operated SaaS backend, while still supporting low-friction installation, a PWA-first client, PostgreSQL, offline-capable capture, household access from multiple devices, and future Android-native capture enhancements.

The project also prioritizes rapid AI-assisted development, explicit financial domain rules, testability, and avoiding unnecessary distributed-system complexity.

## Decision

Arta MVP will use the following implementation stack:

### Frontend / PWA

- React
- TypeScript
- Vite
- `vite-plugin-pwa`
- IndexedDB for browser-local persistence
- Dexie as the IndexedDB abstraction
- Zod for client-side/runtime validation where appropriate

### Backend

- Go
- `net/http` with `chi` for HTTP routing
- REST API
- Modular monolith architecture

### Database

- PostgreSQL
- `pgx` as the PostgreSQL driver/toolkit
- `sqlc` for type-safe query generation from explicit SQL
- SQL migrations using a lightweight migration tool selected during scaffold implementation (for example Goose or Tern)

### Authentication

- Built-in self-hosted authentication for the MVP
- Passwords stored using Argon2id hashing
- Server-side sessions delivered through secure HttpOnly cookies
- No mandatory external identity provider

### Offline / synchronization direction

- Transaction capture should persist locally first when server connectivity is unavailable.
- Client records should use stable client-generated IDs.
- Sync writes must be idempotent and safe to retry.
- Financial data must not use blind last-write-wins conflict handling for sensitive state.
- The MVP sync engine should remain intentionally small and focused on reliable capture rather than implementing CRDTs or a general-purpose distributed database.

The exact sync endpoint contract and conflict-resolution rules will be refined during implementation and may receive a dedicated ADR if they become substantial.

### Packaging and distribution

- Docker Compose is the initial supported self-hosted/development deployment path.
- The stack includes Arta Server, PostgreSQL, persistent database storage, health checks, and migrations.
- The end-user product direction is a lower-friction launcher/CLI/installer so normal users do not need to understand Docker, Node.js, Go, or PostgreSQL.
- The Go server may embed the built PWA assets so the core Arta application can be distributed as a cohesive server product.
- Public online deployment is demo/preview only and must use disposable/demo data rather than becoming a production SaaS offering.

### Testing

- Frontend unit/component tests: Vitest and React Testing Library
- End-to-end browser tests: Playwright
- Backend tests: Go `testing`
- Database/integration tests should use real PostgreSQL behavior where practical rather than relying only on mocks
- CI: GitHub Actions
- Releases: GitHub Releases

## Considered alternatives

### Alternative A: Full TypeScript stack

Example:

- React + Vite
- Dexie
- Node.js/Bun backend using Fastify or Hono
- Drizzle ORM
- PostgreSQL

Advantages:

- One primary language across frontend and backend
- Very fast iteration for AI-assisted development
- Strong TypeScript ecosystem

Disadvantages:

- Self-hosted distribution typically carries a JavaScript runtime or additional bundling complexity
- Harder to reach a simple native-server packaging model than a Go binary
- More temptation to couple frontend/backend tooling and framework abstractions

This is viable, but Arta values a compact self-hosted server and explicit backend behavior enough to prefer Go.

### Alternative B: React + Rust backend

Example:

- React + Vite
- Dexie
- Rust + Axum
- PostgreSQL

Advantages:

- Excellent performance and resource efficiency
- Strong type safety
- Good native distribution characteristics

Disadvantages:

- Higher implementation complexity
- Slower learning/iteration curve for this project
- More complexity than the MVP currently requires

Rust remains technically attractive but is not justified for the first Arta implementation.

## Why this decision

The selected stack balances Arta's priorities:

- React + TypeScript + Vite gives a mature, AI-friendly PWA development experience.
- Dexie/IndexedDB supports local-first transaction capture without making browser background-sync features a correctness dependency.
- Go provides a lightweight, native server runtime that is well suited to self-hosted distribution and can later serve/embed the PWA.
- PostgreSQL provides a durable relational foundation for households, transactions, transfers, budgets, goals, auditability, and future collaboration.
- `pgx` + `sqlc` keeps database behavior explicit and type-safe without introducing a large ORM abstraction into financial logic.
- Built-in session authentication avoids making self-hosted users depend on an external auth service.
- Docker Compose gives the project a reproducible first deployment path while preserving a roadmap toward a friendlier installer/launcher.

## Consequences

### Positive

- Strong separation between client, domain/server, and database responsibilities
- Good fit for self-hosted distribution
- Explicit SQL and financial data behavior
- Practical PWA path for iPhone/desktop testing without requiring a native iOS toolchain
- Clear path toward future Android-native capture extensions
- Good testability across frontend, backend, database, and end-to-end flows

### Costs / trade-offs

- Two implementation languages are used: TypeScript and Go
- PostgreSQL makes packaging heavier than an embedded database
- Offline synchronization introduces additional correctness work
- Docker Compose is still too technical to be the final normal-user installation experience
- Built-in authentication places security responsibility inside Arta and must be implemented carefully

## Guardrails

- Do not introduce microservices unless a concrete requirement justifies them.
- Do not introduce CRDTs or generalized distributed synchronization for the MVP.
- Do not replace explicit financial invariants with ORM or framework magic.
- Do not make SaaS-only infrastructure a mandatory dependency for normal Arta use.
- Do not require native Android/iOS clients for the core MVP.
- Preserve auditability, exact money handling, idempotency, and explicit review semantics throughout implementation.

## Follow-up

Issue #2 should scaffold this architecture, including:

- React + TypeScript + Vite PWA
- Dexie/IndexedDB foundation
- Go + chi server
- PostgreSQL with migrations
- `pgx` + `sqlc`
- auth/session foundation
- Docker Compose
- CI/test foundations
- self-hosted startup documentation

More detailed ADRs may be created later for authentication security, sync/conflict semantics, or packaging if those decisions become independently significant.
