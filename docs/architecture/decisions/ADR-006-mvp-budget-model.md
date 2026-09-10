# ADR-006: MVP budget model

Status: Accepted
Date: 2026-09-10

## Context

Issue #6 requires Arta to provide a simple, trustworthy periodic spending budget. The current trusted ledger has confirmed income/expense transactions with wallet, amount, currency, and occurred-at timestamp. Category is not yet part of the trusted transaction model, while pending captures intentionally remain outside trusted financial calculations.

Introducing category-based or envelope budgeting now would require widening the transaction classification model before Arta can deliver a usable budget slice.

## Decision

For MVP, a budget is a **household-wide spending limit for one currency over an explicit date period**.

A budget stores:

- household
- currency
- period start date (inclusive)
- period end date (inclusive)
- amount in integer minor units

Budget spending is derived, never stored as mutable truth.

Eligible spending is the sum of confirmed `expense` transactions that:

1. belong to the same household,
2. use the budget currency, and
3. occurred within the budget period.

Income does not consume a budget. Transfers do not consume a budget. Pending/untrusted transaction captures do not consume a budget until they are confirmed into the trusted transaction ledger.

Remaining amount is `budget amount - eligible spent amount`. Remaining may become negative when spending exceeds the budget.

For MVP, overlapping budgets for the same household and currency are rejected so the meaning of "the budget for this period" stays unambiguous. Category and envelope scopes remain future product work.

## Consequences

- Arta can ship a useful end-to-end budget workflow without inventing category semantics that the ledger does not yet trust.
- Budget calculations reuse the existing confirmed-transaction trust boundary.
- Exact integer monetary representation is preserved.
- Multi-currency households can create independent budgets per currency.
- Users cannot yet maintain separate grocery, transport, or envelope budgets; that requires a later explicit product/domain decision and transaction-category model.
