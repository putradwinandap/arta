# Household Overview

Status: Implemented by Issue #20

The household overview is Arta's compact landing view for understanding the household's current financial position. It is a derived read model, not a second financial source of truth.

## What it shows

- Physical wallet balance by wallet and currency.
- Goal-reserved funds and ordinary available-to-spend funds.
- Budgets whose inclusive UTC date period contains today.
- Active financial goals and their derived reserved/remaining progress.
- Up to ten most recent confirmed income, expense, or transfer activities.

## Trust rules

The overview reuses the same trusted calculations as the underlying finance, budget, and goal features. It never stores duplicate balances, budget spending, or goal progress.

Pending Transaction Inbox captures remain excluded until confirmed. Transfers remain transfers rather than income/expense. Goal reservations reduce available-to-spend funds without reducing physical wealth. Explicit reconciliation balance adjustments are included in physical balance but do not become income, expense, or budget spending.

## Time boundary

A current budget is selected using the server's current UTC calendar date because household timezone semantics are not yet modeled. This follows the existing MVP budget decision.

## Empty states

A household can legitimately have no wallets, no current budget, no active goals, or no confirmed activity. The UI describes each absence instead of fabricating zero-state financial records.
