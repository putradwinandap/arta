# Arta

Arta is a family finance application focused on making shared household money management simple, reliable, and low-friction.

## Core product idea

The central problem Arta solves is not only budgeting, but making sure family transactions are captured even when people forget or do not want to fill a detailed form at the moment of purchase.

**Product principle:** Capture now, classify later.

## Core areas

- Wallets
- Transactions
- Transaction Inbox
- Budgets
- Goals
- Transfers between wallets
- Household / family members

## Install and run locally

The supported self-hosted MVP path only requires Docker with Docker Compose v2.

Windows PowerShell:

```powershell
.\scripts\arta.ps1 setup
.\scripts\arta.ps1 start
```

macOS/Linux/POSIX shell:

```sh
sh scripts/arta.sh setup
sh scripts/arta.sh start
```

Then open `http://localhost:8080`. The launcher generates local secrets, starts PostgreSQL, applies migrations, and starts the full Arta stack without requiring host installations of Node.js, Go, or PostgreSQL.

See [`docs/development/install.md`](./docs/development/install.md) for prerequisites, stop/update commands, configuration, and data-safety notes. Contributors should use [`docs/development/setup.md`](./docs/development/setup.md).

## Source of truth

This repository is the project brain for Arta.

- AI working rules: [`AGENTS.md`](./AGENTS.md)
- Product vision: [`docs/product/vision.md`](./docs/product/vision.md)
- Requirements: [`docs/product/requirements.md`](./docs/product/requirements.md)
- Current project state: [`docs/context/current-state.md`](./docs/context/current-state.md)
- Roadmap: [`docs/planning/roadmap.md`](./docs/planning/roadmap.md)
- MVP scope: [`docs/planning/mvp.md`](./docs/planning/mvp.md)
- Architecture: [`docs/architecture/overview.md`](./docs/architecture/overview.md)
- Architecture decisions: [`docs/architecture/decisions/`](./docs/architecture/decisions/)

## Development philosophy

Arta is intended to be developed with an AI-native engineering workflow. Chat conversations are temporary; accepted product knowledge, implementation decisions, and project progress must be distilled back into this repository.

## Status

Current phase: **Planning and reliability MVP slices**.
