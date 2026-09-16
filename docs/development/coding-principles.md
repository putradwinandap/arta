# Arta Coding Principles

These rules apply to the whole codebase. They are pragmatic defaults: preserve clarity, correctness, and delivery speed over theoretical purity.

## Core principles

- **KISS:** choose the simplest design that satisfies the current requirement.
- **YAGNI:** do not add speculative features, abstractions, configuration, or dependencies.
- **DRY with restraint:** remove meaningful duplication, but do not force abstractions before patterns are stable.
- **SOLID pragmatically:** keep responsibilities focused, depend on stable boundaries, and prefer composition over inheritance.
- **Explicit over clever:** make business rules, state transitions, errors, and authorization visible in code.
- **Small focused modules:** split files and packages by responsibility or workflow, not by arbitrary line counts.

## Frontend

- Components should focus on rendering and local interaction.
- Data loading, caching, synchronization, and side effects belong in hooks or services.
- A component should not own several unrelated workflows.
- Keep API calls typed and centralized in the API client.
- Preserve user-visible behavior and offline/capture semantics during refactors.
- Do not introduce global state management without a documented need.

## Backend and domain

- Domain packages must not depend on HTTP or PostgreSQL details.
- HTTP handlers parse requests, enforce the boundary, and write responses; services orchestrate use cases.
- Domain packages own invariants and business rules, with explicit errors and focused tests.
- Monetary values use integer minor units; floating-point arithmetic is prohibited for money.
- Household authorization is required for every household-scoped operation.
- Historical financial records must not be silently rewritten.

## Database

- Migrations are append-only; never edit an applied migration.
- Use database constraints for critical invariants and tenant isolation.
- Derived financial values must not become mutable duplicate truth without an explicit decision.

## Testing and verification

- Behavior changes require tests at the narrowest useful layer.
- Use unit tests for domain rules, PostgreSQL integration tests for persistence/authorization, frontend tests for UI contracts, and E2E tests for critical cross-layer workflows.
- Assert stable semantic behavior (roles, labels, outcomes), not fragile implementation details.
- Run the relevant checks before committing. For server changes, run make server-check.
- When CI exposes a repeatable failure, add or improve a local prevention guard where practical.

## Refactoring

- Keep refactors separate from product behavior changes unless the refactor is required for the slice.
- Extract real responsibilities; do not create pass-through wrappers or empty organizational folders as a substitute for decomposition.
- Prefer incremental, reviewable changes with verification after each extraction.
- Avoid changing public contracts unless the change is required, documented, and tested.

## Review questions

- Is this the smallest coherent solution?
- Does every abstraction have a current consumer and a clear responsibility?
- Are domain invariants and authorization still explicit?
- Could this change silently lose, duplicate, or mutate financial data?
- Are tests and documentation proportional to the risk?
