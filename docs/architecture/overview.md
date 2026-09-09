# Architecture Overview

Status: **MVP implementation architecture selected.** See `docs/architecture/decisions/ADR-004-mvp-technical-architecture.md`.

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
- SQL migrations using a lightweight migration tool selected during scaffold implementation

### Authentication
- Built-in self-hosted auth
- Argon2id password hashing
- Server-side sessions with secure HttpOnly cookies

### Testing / delivery
- Vitest
- React Testing Library
- Playwright
- Go `testing`
- Real PostgreSQL integration testing where practical
- GitHub Actions
- GitHub Releases

## Deployment direction

Arta is an **open-source, self-hosted-first** application. The normal production path is a household-controlled Arta deployment rather than a mandatory Arta-operated SaaS service.

The MVP client is **PWA-first** and the primary server database is **PostgreSQL**.

Conceptually:

```text
                     Household-controlled deployment

                 +----------------------------------+
                 |            Arta Server           |
                 |                                  |
                 | Go + chi REST API                |
                 | modular monolith                 |
                 |                |                 |
                 |                v                 |
                 |   pgx/sqlc -> PostgreSQL         |
                 +----------------+-----------------+
                                  ^
                                  | sync / API
                  +---------------+---------------+
                  |                               |
             PWA on phone                    PWA on desktop
     React/Vite + Dexie/IndexedDB     React/Vite + Dexie/IndexedDB
```

The Go server may embed the built PWA assets so the core application can later be distributed as a cohesive server product.

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

Detailed sync endpoint and conflict rules will be refined during implementation and may receive a dedicated ADR.

## Distribution topology

Arta distinguishes four experiences:

1. **Self-hosted end-user release** — primary product; installation/startup should minimize manual infrastructure work.
2. **Power-user/server deployment** — Docker Compose is the first supported technical deployment path.
3. **Public demo** — disposable preview only; not a production hosted finance service.
4. **Contributor environment** — source checkout and development dependencies; this must not be confused with normal installation.

PostgreSQL is part of the accepted server architecture, but users should not be required to manually administer it for the default installation path when automation can reasonably handle initialization and migrations.

The product roadmap should move from Docker Compose toward a lower-friction launcher/CLI/installer for normal users.

## Application shape

Use a modular monolith for the MVP unless a concrete requirement justifies additional services.

Logical modules:

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

## Future native integration

PWA-first does not mean browser-only forever. A future Android client or companion may provide OS-specific capabilities such as notification-based transaction capture and communicate with the same Arta domain/server model. Native functionality should be added when an OS capability justifies it rather than making native mobile installation a prerequisite for the core product.

## Decision record

The implementation choice and alternatives are recorded in:

- `docs/architecture/decisions/ADR-004-mvp-technical-architecture.md`

The next engineering step is Issue #2: scaffold the selected architecture and establish the first reproducible self-hosted runtime.
