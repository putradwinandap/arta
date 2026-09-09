# Architecture Overview

Status: Not yet selected. This document defines architectural boundaries before choosing a concrete stack.

## Architecture goals

Arta should optimize for:

- Correctness of financial records
- Clear domain boundaries
- Auditability
- Low-friction transaction capture
- Testability
- Safe AI-assisted development
- Ability to evolve from MVP without premature distributed-system complexity

## Initial recommendation

Prefer a modular monolith for the first product unless a concrete requirement justifies additional services.

Potential logical modules:

- Identity / authentication
- Household and membership
- Wallets
- Transactions
- Transaction Inbox / capture
- Budgets
- Goals
- Reporting
- Reconciliation (future)
- Capture integrations (future)

These are domain boundaries, not a requirement to deploy separate services.

## Core domain flow

```text
Capture sources
    |
    v
Transaction capture
    |
    +---- complete/trusted ----> Transactions
    |
    +---- needs review --------> Transaction Inbox
                                      |
                                      v
                                  Transactions
                                      |
                     +----------------+----------------+
                     |                |                |
                     v                v                v
                   Budget           Goals           Reports
```

Wallet transfers use explicit transfer semantics and must not be interpreted as household income/expense.

## Data integrity principles

- Use exact currency representation (for example integer minor units or an appropriate decimal type, depending on the selected database/language).
- Financial mutations should be traceable.
- Prefer explicit status transitions over silently discarding uncertain capture data.
- Automatic capture must preserve provenance.
- Domain rules should be enforced below the UI layer.

## Stack selection

The concrete frontend, backend, database, authentication, deployment, and mobile strategy are intentionally undecided. They should be selected through an ADR after requirements and constraints are discussed.
