# Architecture Overview

Status: **Partially selected.** The product topology, client strategy, and primary database are accepted; the concrete frontend/backend frameworks, sync protocol, authentication, and packaging are still being selected in Issue #1.

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

## Accepted deployment direction

Arta is an **open-source, self-hosted-first** application. The normal production path is a household-controlled Arta deployment rather than a mandatory Arta-operated SaaS service.

The MVP client is **PWA-first** and the primary server database is **PostgreSQL**.

Conceptually:

```text
                     Household-controlled deployment

                 +-------------------------------+
                 |          Arta Server          |
                 |                               |
                 |  API / domain application     |
                 |             |                 |
                 |             v                 |
                 |        PostgreSQL             |
                 +---------------+---------------+
                                 ^
                                 | sync / API
                  +--------------+--------------+
                  |                             |
             PWA on phone                  PWA on desktop
          local client state              local client state
```

The exact local client persistence and synchronization protocol is not yet selected. However, transaction capture should not unnecessarily fail merely because the self-hosted server is temporarily unreachable. Any eventual sync design must preserve financial correctness, retries/idempotency, provenance, and review semantics.

## Distribution topology

Arta should distinguish four experiences:

1. **Self-hosted end-user release** — primary product; installation/startup should minimize manual infrastructure work.
2. **Power-user/server deployment** — container/CLI-oriented deployment may be provided for technical users.
3. **Public demo** — disposable preview only; not a production hosted finance service.
4. **Contributor environment** — source checkout and development dependencies; this must not be confused with normal installation.

PostgreSQL is part of the accepted server architecture, but users should not be required to manually administer it for the default installation path when automation can reasonably handle initialization and migrations.

## Application shape

Prefer a modular monolith for the first product unless a concrete requirement justifies additional services.

Potential logical modules:

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

These are domain boundaries, not a requirement to deploy separate services.

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

- Use exact currency representation (for example integer minor units or an appropriate PostgreSQL numeric/integer representation selected with the implementation stack).
- Financial mutations should be traceable.
- Prefer explicit status transitions over silently discarding uncertain capture data.
- Automatic capture must preserve provenance.
- Domain rules should be enforced below the UI layer.
- Offline/retried writes must not silently duplicate financial records.
- Synchronization conflicts must be handled deliberately rather than with blind last-write-wins behavior for sensitive financial state.

## Future native integration

PWA-first does not mean browser-only forever. A future Android client or companion may provide OS-specific capabilities such as notification-based transaction capture and communicate with the same Arta domain/server model. Native functionality should be added when an OS capability justifies it rather than making native mobile installation a prerequisite for the core product.

## Remaining stack selection

Issue #1 still needs to select and document:

- PWA/frontend framework
- Backend language/runtime/framework
- Self-hosted authentication/session model
- Client local persistence technology
- Synchronization protocol
- Packaging/startup strategy
- Testing toolchain
- Public demo deployment strategy

The accepted choices must be recorded in a dedicated ADR before the application scaffold is considered finalized.
