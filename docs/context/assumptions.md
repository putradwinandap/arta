# Assumptions and Open Questions

Last updated: 2026-09-18

This file contains unresolved questions. Items here are **not accepted requirements** unless promoted into the appropriate product/architecture document or ADR.

Resolved decisions should not remain listed as open questions. Current accepted MVP implementation architecture is recorded in `docs/architecture/decisions/ADR-004-mvp-technical-architecture.md` and summarized in `docs/context/current-state.md`.

## Product

- What financial information is private to a member versus visible to the household?
- Are personal wallets and shared wallets both needed?
- Should budgets be category-based, envelope-based, wallet-based, or support multiple scopes?
- What transaction details are mandatory before a record becomes confirmed?

## Capture

- What is the fastest acceptable MVP capture interaction?
- Which Indonesian bank/e-wallet notifications are technically and legally practical to parse?
- How should duplicate detection work when the same transaction arrives through multiple capture sources?
- How should confidence and provenance be represented for automatically captured data?
- What future Android-native/companion architecture best adds notification capture without duplicating core domain behavior?

## Wallets and reconciliation

- How should opening balances be represented?
- How should explicit balance adjustments appear in reports?
- How should fees during wallet transfers be modeled?

## Technical

Accepted and therefore no longer open here:

- Product distribution is self-hosted-first rather than mandatory SaaS.
- MVP client strategy is PWA-first.
- Frontend stack is React + TypeScript + Vite with `vite-plugin-pwa`.
- Client-local persistence uses IndexedDB through Dexie.
- Backend uses Go + `net/http` + `chi` with a REST API and modular monolith shape.
- Primary server database is PostgreSQL using `pgx` + `sqlc`.
- MVP authentication uses built-in self-hosted auth with Argon2id password hashing and server-side HttpOnly-cookie sessions.
- Docker Compose is the first supported technical deployment path.
- Testing direction is Vitest/React Testing Library, Playwright, Go `testing`, and real PostgreSQL integration behavior where practical.
- GitHub Actions is the CI direction and GitHub Releases is the release channel.
- A usable installation/startup path is part of MVP.
- A public online deployment, if provided, is a disposable demo/preview rather than hosted production Arta.
- A user may belong to multiple households; server-side memberships are authoritative.
- Wallet balances are derived from trusted financial activity; observed balances belong to reconciliation rather than mutable wallet truth.
- Financial goals represent reserved funds backed by auditable reservation events.
- Goose is the selected PostgreSQL migration tool, with migrations stored as append-only SQL files.

Still open / implementation-detail decisions:

- What exact sync endpoint contract, retry protocol, versioning model, and conflict-resolution rules should be used?
- What should the next packaging step after Docker Compose be: Go CLI, launcher, native installer, or staged combination?
- How should PostgreSQL backup, restore, and upgrades be made low-friction for end users?
- Where/how should the public disposable demo be hosted?
- Which optional observability/logging approach is appropriate without making self-hosting heavy?

## Process

- GitHub Issues are the task source of truth. A GitHub Project board may be added when the backlog becomes large enough to justify another management layer.
- Branch protection and CI rules are maintained as part of the repository delivery workflow.
