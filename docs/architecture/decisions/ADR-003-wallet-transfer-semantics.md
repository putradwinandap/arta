# ADR-003: Wallet Transfer Semantics

- Status: Accepted
- Date: 2026-09-09

## Context

Moving money between household wallets changes where money is held but does not create or consume household wealth. Modeling the two sides independently as ordinary expense and income would distort reports and budgets.

## Decision

A wallet transfer is one logical domain operation with a source wallet, destination wallet, amount, and occurrence time.

A transfer must not count as household income or household expense and must not consume a spending budget.

The eventual persistence layer may represent the movement using linked entries for accounting integrity, but those entries must retain their shared transfer identity and semantics.

## Consequences

- Reports exclude transfers from income/expense totals.
- Budgets exclude transfers from spending.
- Deleting/editing a transfer must preserve consistency between both wallet effects.
- The data model must make accidental treatment as unrelated income/expense difficult.
