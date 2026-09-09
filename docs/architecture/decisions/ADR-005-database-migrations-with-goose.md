# ADR-005: Database Migrations with Goose

Status: Accepted

Date: 2026-09-09

## Context

ADR-004 selected PostgreSQL, pgx, sqlc, and a lightweight SQL migration tool to be chosen during the scaffold.

## Decision

Arta will use **Goose** for PostgreSQL schema migrations.

Migrations remain explicit SQL files under `server/db/migrations`. Goose is used to apply and roll back those files; sqlc consumes the same schema history when generating typed query code.

## Rationale

- SQL-first and compatible with Arta's preference for explicit database behavior.
- Lightweight relative to ORM-driven migration systems.
- Works naturally with Go tooling and PostgreSQL.
- Keeps schema evolution reviewable in Git.

## Consequences

- Contributors and CI need the Goose CLI or an equivalent packaged execution path.
- Production/startup tooling must run migrations safely before serving requests.
- Down migrations should be treated carefully once real financial data exists.
