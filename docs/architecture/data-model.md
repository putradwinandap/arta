# Conceptual Data Model

Status: Conceptual. This is not yet a database schema.

## Household

Represents the shared financial context.

Conceptual relationships:

```text
Household
  |-- Members
  |-- Wallets
  |-- Transactions
  |-- Budgets
  `-- Goals
```

## Member

A user's membership in a household. Roles and permissions are not yet decided.

## Wallet

Represents a location of money.

Candidate attributes:

- id
- household_id
- name
- type (cash, bank, e-wallet, other)
- currency
- status

Balance storage/derivation is not yet decided.

## Transaction

Represents a financial event/captured record.

Candidate attributes:

- id
- household_id
- wallet_id where applicable
- type (expense, income, transfer semantics handled explicitly)
- amount
- currency
- occurred_at
- category_id (optional)
- description (optional)
- merchant/source information (optional)
- capture_source
- review_status
- created_by
- created_at
- updated_at

The final model must preserve the difference between capture state and financial semantics.

## Transfer

A transfer is one logical money movement connecting a source wallet and destination wallet.

Candidate attributes:

- id
- household_id
- source_wallet_id
- destination_wallet_id
- amount
- currency
- occurred_at
- created_by

Implementation may use linked ledger entries internally, but the domain must preserve one logical transfer and exclude it from household income/expense totals.

## Budget

Candidate concepts:

- household
- period
- amount
- scope/category
- spent amount derived from eligible confirmed expenses

Final budgeting model remains open.

## Goal

Candidate concepts:

- household
- name
- target_amount
- target_date (optional)
- progress/funding relationship

The funding/progress model remains open.

## Captured transaction / Inbox state

The system must support transaction information that exists before full classification or confirmation. Whether this is modeled as a transaction status, separate capture entity, or another structure is intentionally undecided pending implementation design.
