# ADR-007: Financial goals represent reserved funds

- Status: Accepted
- Date: 2026-09-10
- Issue: #7

## Context

Arta needs financial goals whose progress reflects reality. A household may create a goal such as an emergency fund, laptop, education fund, or vacation and then actually move/set aside money for that purpose.

A manually editable progress number would let Arta claim that money has been saved when no funds were actually reserved. Deriving progress from unrelated income/expense transactions would also fail to express the household's intent that specific money is no longer available for ordinary spending.

## Decision

For MVP, a financial goal represents **actually reserved household funds**.

Goal progress is therefore backed by explicit reservation/allocation operations, not by an arbitrary progress field.

The following invariants apply:

1. A goal has a household, currency, target amount, lifecycle state, and reserved amount derived from its reservation history.
2. Reserving funds is a movement/allocation of existing household money. It is neither income nor expense.
3. Reserved funds remain part of household wealth, but are not ordinary available-to-spend funds.
4. The same monetary value cannot simultaneously be available for ordinary spending and reserved to multiple goals.
5. Goal progress is `reserved / target`; remaining target is `target - reserved`, floored at zero for display where appropriate.
6. Releasing funds from a goal is explicit and auditable rather than silently editing progress downward.
7. Monetary values use exact integer minor units.
8. Goal operations must respect currency boundaries.

## MVP implementation direction

The implementation should model reservations explicitly rather than mutating a manually stored `current_amount` field.

A reservation must identify the real source of funds so Arta can distinguish:

- physical/account balance: money that exists in the household's wallets;
- reserved balance: the portion committed to goals;
- available balance: wallet funds not currently reserved.

The exact schema may use goal allocation records tied to a source wallet, provided the invariants above hold. This is preferred over pretending that each goal is automatically an external bank account: Arta's logical goal and the user's physical savings account are related concepts but not necessarily identical.

If the household really transfers money between two physical wallets/accounts while funding a goal, that physical transfer remains represented by Arta's existing transfer model; the goal reservation records the purpose/allocation without turning the transfer into income or expense.

## Consequences

### Positive

- Goal progress corresponds to money actually set aside.
- Household wealth is not distorted by goal funding.
- Budgets and income/expense reports are not consumed by saving toward a goal.
- Arta can later show available versus reserved money honestly.
- The model supports multiple goals without double-counting the same funds.

### Costs

- Goal funding is more complex than a manually editable progress number.
- Wallet availability must account for reservations.
- Funding, releasing, and potentially reallocating reserved money require auditable operations and validation.
- Physical wallet transfers and logical goal allocation must remain conceptually distinct even when the user performs both together in real life.

## Deferred

- Automatically linking a goal to one dedicated bank/e-wallet account.
- Investment returns or interest credited specifically to a goal.
- Shared reservation across multiple goals.
- Scheduled/recurring goal funding.
- Goal funding recommendations or automation.
