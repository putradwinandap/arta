# MVP Budgeting

Status: Implemented by Issue #6 / PR #18

## Model

Arta MVP uses a household-wide spending budget for one currency over an explicit inclusive date period.

A budget has:

- currency
- period start
- period end
- spending limit in integer minor units

Category and envelope budgets are intentionally outside the MVP model because confirmed transactions do not yet have a trusted category model.

## Spending semantics

`spent` is derived from confirmed transaction records. An item consumes a budget only when it is:

- a confirmed `expense`,
- in the same household,
- in the same currency, and
- within the budget period.

Income, wallet transfers, and pending Transaction Inbox captures do not consume budget. A pending capture begins affecting a budget only after review and confirmation creates its trusted expense transaction.

`remaining = amount - spent`; remaining may be negative when the household overspends.

## MVP constraints

- Budget amount must be positive.
- Period start must not be after period end.
- Overlapping budgets for the same household and currency are rejected.
- Different currencies are budgeted independently.
- Period boundaries currently use UTC calendar dates because household timezone is not yet modeled. A future household-timezone decision may supersede this boundary rule.
