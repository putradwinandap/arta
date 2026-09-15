# ADR-009: Overlapping budgets and explicit expense assignment

Status: Accepted
Date: 2026-09-15

## Context

ADR-006 made budget periods mutually exclusive because spending was derived from household, currency, and date alone. Issue #50 needs multiple budgets that may cover the same dates, with the user deciding which budget receives an expense.

## Decision

Budget periods may overlap when they belong to the same household and currency. A confirmed expense may reference one budget explicitly through a nullable budget association. Budget spending is derived from confirmed expenses assigned to that budget; an expense must not be counted in multiple budgets unless a later allocation decision explicitly introduces splitting.

When exactly one applicable budget exists, the UI may preselect it. When multiple applicable budgets exist, the user must choose one before confirmation or assignment. Expenses with no budget remain valid household expenses but do not consume a budget. Transfers, income, pending captures, and cross-currency assignments remain excluded.

The association must remain auditable when an expense is reassigned. Historical budget periods and transaction monetary values are not silently rewritten. The existing inclusive UTC calendar-date rule remains in force until household timezone semantics are decided.

## Consequences

- Overlap is useful for distinct household intentions, but the transaction model and UI must expose budget selection.
- Budget totals no longer come from date overlap alone; they come from explicit expense-to-budget assignment.
- A future split-allocation feature would require a separate domain decision and data model.
- ADR-006 remains the historical MVP decision; this ADR supersedes its overlap restriction for the Issue #50 evolution.
