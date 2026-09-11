# AGENTS.md

## Purpose

This file defines the default operating rules for AI agents working on Arta. Treat the repository as the durable source of truth. Do not rely on chat memory for accepted product or engineering decisions.

## Project

Arta is a family finance application. Its primary differentiator is reducing the chance that household transactions are forgotten or left unrecorded.

### Product principle

**Capture now, classify later.**

Transaction capture should require as little effort as possible. Classification, enrichment, and review may happen later through the Transaction Inbox.

## Product priorities

1. Reliable transaction capture
2. Wallet management
3. Transaction Inbox and review
4. Budgeting
5. Financial goals
6. Transfers between wallets
7. Household collaboration

## Source of truth map

- Product vision and principles: `docs/product/vision.md`
- Product requirements: `docs/product/requirements.md`
- Domain terminology: `docs/product/glossary.md`
- User flows: `docs/product/user-flows.md`
- Architecture: `docs/architecture/overview.md`
- Domain/data model: `docs/architecture/data-model.md`
- Accepted technical/domain decisions: `docs/architecture/decisions/`
- Current implementation/project state: `docs/context/current-state.md`
- Explicit assumptions and unresolved questions: `docs/context/assumptions.md`
- Product roadmap: `docs/planning/roadmap.md`
- MVP boundaries: `docs/planning/mvp.md`
- Executable work: GitHub Issues
- Change history: commits and pull requests

## Required agent workflow

Before starting work:

1. Read this file.
2. Read `docs/context/current-state.md`.
3. Read the GitHub Issue for the task, if one exists.
4. Read only the product/architecture documents relevant to the task.
5. Inspect the existing implementation before proposing changes.

During work:

1. Do not invent requirements when the repository is ambiguous.
2. Prefer the smallest coherent change that satisfies the task.
3. Keep business/domain logic explicit and testable.
4. Preserve the distinction between accepted decisions and open assumptions.
5. Do not silently change product semantics or architecture.
6. Add or update tests when behavior changes.
7. Never commit secrets, credentials, tokens, private financial data, or production personal data.

Before finishing work:

1. Run relevant tests, linters, type checks, and builds when available. For any Go/server change, run the canonical `make server-check` from the repository root before committing or updating a PR. It applies `gofmt` automatically, then tests and builds the server.
2. Verify acceptance criteria from the Issue.
3. Update documentation when behavior, architecture, or accepted product knowledge changed.
4. Update `docs/context/current-state.md` when the project state materially changed.
5. Reconcile `docs/context/current-state.md` against `docs/planning/roadmap.md`, `docs/planning/mvp.md`, and relevant open/closed Issues whenever a major slice completes or the next execution target changes. Explicitly identify required capabilities as Done, Partial, or Missing rather than allowing earlier-phase debt to disappear behind later slices.
6. Add an ADR when making a durable architectural or domain decision with meaningful trade-offs.
7. Keep commits scoped and descriptive.
8. Summarize what changed, verification performed, and any remaining risks or questions.

## CI failure prevention rule

**A CI failure is not complete when the current run turns green; it is complete when the same preventable failure is unlikely to reach remote CI again.**

Whenever CI fails:

1. Identify and record the root cause before treating the failure as resolved.
2. Fix the immediate failure with the smallest coherent change.
3. Determine whether the same failure can be detected locally before push or pull request creation.
4. When practical, add or improve a local guard, canonical verification command, test, linter, formatter, validation script, hook, or shared CI/local command so the same class of failure is caught earlier.
5. Update the appropriate repository documentation or engineering rule when the failure reveals durable workflow knowledge.
6. Reuse the prevention mechanism in both local development and CI when practical, instead of maintaining duplicate checks that can drift.
7. Do not repeatedly spend remote CI runs rediscovering the same deterministic failure. If an identical or equivalent failure recurs, treat the missing prevention as a workflow defect and address it before continuing unrelated work.
8. Keep CI as the final enforcement layer even when a local guard exists; local prevention must not weaken remote verification.

The goal is to protect limited CI quota, reduce low-value red builds, and make every CI failure improve the engineering system rather than becoming recurring operational noise.

## Vertical slice delivery rule

For user-facing product work, vertical slices are the default delivery model.

**Implement the smallest end-to-end usable slice instead of completing one technical layer across many features.**

A user-facing feature should include the layers required to make that slice genuinely usable and verifiable, which may include:

- domain/business rules
- PostgreSQL persistence and migrations
- application/service behavior
- REST API
- frontend UX/UI
- automated tests
- end-to-end verification

Do not declare a user-facing feature complete merely because its backend, database, or UI exists in isolation. Prefer completing one narrow workflow end to end before expanding adjacent capabilities.

This rule does not require every Issue to touch every layer. Infrastructure, CI, security foundations, migrations, documentation, refactors, and architectural work may remain horizontal when that is the coherent nature of the task.

When an earlier horizontal foundation already exists, the next relevant slice should connect it to a usable product workflow rather than continuing to accumulate disconnected backend capability.

## Documentation rules

- Do not copy raw chat transcripts into the repository.
- Distill conversations into decisions, requirements, assumptions, or issues.
- Avoid duplicating the same source of truth across multiple documents.
- If two documents conflict, stop and surface the conflict instead of choosing silently.
- Date project-state documents when materially updating them.
- ADRs are append-only historical decisions. If a decision changes, supersede the old ADR with a new one rather than rewriting history.

## Git and task rules

- One Issue should describe one coherent outcome whenever practical.
- Branches should be task-scoped.
- Pull requests should reference their Issue.
- Do not mix unrelated refactors with feature work.
- Do not mark work complete solely because code was generated; completion requires verification against acceptance criteria.

## Financial domain invariants

These rules must not be changed without an explicit product/domain decision:

- A transfer between wallets is not household income or expense.
- Transaction capture and transaction classification are separate concerns.
- An incomplete captured transaction may exist in a pending/review state rather than being discarded.
- Historical financial records should favor auditability over silent mutation.
- Monetary calculations must avoid floating-point arithmetic that can introduce rounding errors.

## AI-native principle

**Chat is temporary. Repository is memory.**

When a discussion produces durable knowledge, convert it into the appropriate repository artifact before considering the work complete.
