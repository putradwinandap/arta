# Architecture Overview

Status: **MVP implementation architecture selected and scaffolded.** See `docs/architecture/decisions/ADR-004-mvp-technical-architecture.md` and `ADR-005-database-migrations-with-goose.md`.

## Architecture goals

Arta should optimize for:

- Correctness of financial records
- Clear domain boundaries
- Auditability
- Low-friction installation and startup
- Low-friction transaction capture
- Self-hosted ownership of household financial data
- Useful PWA behavior across desktop and mobile browsers
- Resilience to temporary client/server connectivity loss
- Testability
- Safe AI-assisted development
- Ability to evolve from MVP without premature distributed-system complexity

## Selected MVP stack

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

### Data
- PostgreSQL
- `pgx`
- `sqlc`
- Goose SQL migrations

### Authentication
- Built-in self-hosted auth
- Argon2id password hashing
- Server-side sessions with secure HttpOnly cookies

### Testing / delivery
- Vitest
- React Testing Library
- Playwright
- Go `testing`
- Real PostgreSQL integration behavior where practical
- GitHub Actions
- GitHub Releases

## Current scaffold topology

The first technical self-hosted path uses Docker Compose:

```text
Browser / installed PWA
        |
        | http://host:8080
        v
+---------------------------+
| Nginx / built React PWA   |
|                           |
| /        -> static PWA    |
| /api/*   -> Go server     |
+-------------+-------------+
              |
              v
+---------------------------+
| Go + chi Arta server      |
| modular monolith          |
| health + readiness        |
+-------------+-------------+
              |
              | pgx / sqlc
              v
+---------------------------+
| PostgreSQL                |
| Goose-managed schema      |
| persistent Docker volume  |
+---------------------------+
```

Before the server starts, a one-shot Compose migration service waits for PostgreSQL health and applies Goose migrations.

This Nginx container is a practical scaffold/distribution boundary, not a permanent architectural requirement. ADR-004 still permits the Go server to embed built PWA assets later to reduce packaging components.

## Repository boundaries

```text
arta/
├── apps/
│   └── web/                 # React/Vite PWA + Dexie
├── server/
│   ├── cmd/arta/            # Go executable entrypoint
│   ├── internal/            # server/application infrastructure
│   ├── db/
│   │   ├── migrations/      # Goose SQL migrations
│   │   └── queries/         # sqlc query definitions
│   └── sqlc.yaml
├── e2e/                     # Playwright
├── docs/
├── compose.yaml
└── .github/workflows/
```

Avoid premature package fragmentation. Add domain packages when real domain behavior exists rather than creating empty abstractions during scaffolding.

## Offline capture and synchronization

Transaction capture should remain useful when the self-hosted server is temporarily unreachable.

Initial synchronization principles:

- Persist locally first where appropriate using IndexedDB/Dexie.
- Use stable client-generated identifiers for locally-created records.
- Retry writes safely using idempotent server behavior.
- Do not use browser Background Sync as a correctness dependency; it may only be an optimization.
- Do not silently duplicate financial records during retries.
- Do not use blind last-write-wins for sensitive financial conflicts.
- Keep the MVP sync engine deliberately small rather than introducing CRDTs or a general-purpose distributed database.

The current scaffold creates the IndexedDB/Dexie boundary but intentionally does **not** implement the transaction synchronization engine yet.

## Distribution topology

Arta distinguishes four experiences:

1. **Self-hosted end-user release** — primary product; installation/startup should minimize manual infrastructure work.
2. **Power-user/server deployment** — Docker Compose is the first supported technical deployment path.
3. **Public demo** — disposable preview only; not a production hosted finance service.
4. **Contributor environment** — source checkout and development dependencies; this must not be confused with normal installation.

The current Compose path packages the PWA, Go server, migration runner, and PostgreSQL. It proves the deployment topology but is not the final normal-user installer experience.

## Application shape

Use a modular monolith for the MVP unless a concrete requirement justifies additional services.

Logical modules will grow around real behavior:

- Identity / authentication
- Household and membership
- Wallets
- Transactions
- Transaction Inbox / capture
- Budgets
- Goals
- Reporting
- Reconciliation (future)
- Capture integrations (future)

These are domain boundaries, not separately deployed services.

## Core domain flow

```text
Capture sources
    |
    v
Transaction capture
    |
    +---- complete/trusted ----> Transactions
    |
    +---- needs review --------> Transaction Inbox
                                      |
                                      v
                                  Transactions
                                      |
                     +----------------+----------------+
                     |                |                |
                     v                v                v
                   Budget           Goals           Reports
```

Wallet transfers use explicit transfer semantics and must not be interpreted as household income/expense.

## Data integrity principles

- Use exact currency representation suitable for PostgreSQL and Go; never floating-point money arithmetic.
- Financial mutations should be traceable.
- Prefer explicit status transitions over silently discarding uncertain capture data.
- Automatic capture must preserve provenance.
- Domain rules should be enforced below the UI layer.
- Offline/retried writes must not silently duplicate financial records.
- Synchronization conflicts must be handled deliberately rather than with blind last-write-wins behavior for sensitive financial state.
- Database behavior should remain explicit; `sqlc` is preferred over hiding core financial semantics behind a large ORM abstraction.

## Health and readiness

The server exposes:

- `/api/health` — process liveness
- `/api/ready` — readiness including PostgreSQL connectivity

These endpoints are infrastructure signals and should remain free of product/business semantics.

## Future native integration

PWA-first does not mean browser-only forever. A future Android client or companion may provide OS-specific capabilities such as notification-based transaction capture and communicate with the same Arta domain/server model. Native functionality should be added when an OS capability justifies it rather than making native mobile installation a prerequisite for the core product.

## Decision records

- `ADR-004-mvp-technical-architecture.md`
- `ADR-005-database-migrations-with-goose.md`

Current implementation work is tracked by Issue #2 and PR #10.
