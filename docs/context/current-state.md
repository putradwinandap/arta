# Current State

Last updated: 2026-09-09

## Current phase

**Engineering foundation / scaffold preparation**

The MVP implementation architecture has been selected and recorded in `ADR-004-mvp-technical-architecture.md`. The next execution step is to scaffold the application foundation.

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
- Initial MVP areas: household, wallets, transactions, quick capture, Transaction Inbox, budgets, goals, transfers, and basic reporting.

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
- SQL migrations using a lightweight migration tool selected during scaffold implementation

### Authentication
- Built-in self-hosted authentication
- Argon2id password hashing
- Server-side sessions with secure HttpOnly cookies

### Offline/sync direction
- Local-first capture where appropriate using IndexedDB/Dexie
- Stable client-generated IDs
- Idempotent retry-safe sync behavior
- No blind last-write-wins for sensitive financial state
- No CRDT/general distributed-database complexity for the MVP

### Packaging/testing/delivery
- Docker Compose is the first supported technical self-hosted deployment path
- Product roadmap moves toward lower-friction CLI/launcher/installer distribution
- Vitest + React Testing Library for frontend tests
- Playwright for end-to-end browser testing
- Go `testing` for backend tests
- Real PostgreSQL integration behavior tested where practical
- GitHub Actions for CI
- GitHub Releases for distribution artifacts

## Accepted delivery direction

- **PWA-first** is the accepted MVP client strategy.
- **PostgreSQL** is the accepted primary server database.
- The primary product is a downloadable/self-hosted deployment controlled by the user/household.
- The MVP must provide an installation/startup path in addition to contributor source-code setup.
- End users should not need to manually install the application's development dependencies just to use Arta.
- Docker Compose is the first supported technical deployment path, but it is not considered the final normal-user installation experience.
- The PWA should tolerate temporary loss of connectivity for capture where feasible.
- A public online deployment may exist as a **demo/preview only**, with disposable/demo data and without being positioned as Arta's production SaaS offering.
- Future Android-native capability may complement the PWA for OS-specific automatic capture such as notification access; it is not required for the core MVP client.

## Developer/platform constraints

- Primary development environment is Windows.
- Primary personal mobile testing device is iPhone.
- The MVP should therefore be testable and useful without requiring a Mac or an iOS-native development/signing workflow.

## Repository foundation completed

- AI agent instructions
- Product vision and requirements
- Product glossary and conceptual flows
- Architecture principles and conceptual data model
- ADR-001 through ADR-004
- Roadmap and MVP definition
- Assumption/open-question register
- GitHub task backlog
- MVP implementation stack decision

## Still to decide / refine

These are implementation-detail or domain decisions, not blockers to starting the scaffold:

- Exact SQL migration tool (for example Goose or Tern)
- Detailed permissions model
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

The scaffold should establish:

- React + TypeScript + Vite PWA
- Dexie/IndexedDB foundation
- Go + chi server
- PostgreSQL
- `pgx` + `sqlc`
- migrations
- auth/session foundation
- Docker Compose
- test foundations
- GitHub Actions CI
- documented contributor and self-hosted startup paths

## Next execution steps

1. Scaffold the selected architecture through Issue #2.
2. Validate reproducible PostgreSQL startup and migrations.
3. Validate PWA access from supported desktop/mobile browsers.
4. Establish CI and test foundations.
5. Implement the domain foundation starting with household/wallet/transaction semantics.
6. Build the minimal quick-capture -> Transaction Inbox -> confirm flow before advanced automation.
