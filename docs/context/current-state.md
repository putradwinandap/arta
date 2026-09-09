# Current State

Last updated: 2026-09-09

## Current phase

**Product discovery and engineering foundation**

No application stack or production implementation has been selected yet.

## Established

- Product name: **Arta**
- Product category: family / household finance management
- Repository is the durable AI-native source of truth.
- Primary product problem: transactions are often missed because recording them at purchase time creates friction.
- Core principle: **Capture now, classify later.**
- Transaction Inbox is a central product concept.
- Wallet transfers are explicit transfers, not income + expense.
- Initial MVP areas: household, wallets, transactions, quick capture, Transaction Inbox, budgets, goals, transfers, and basic reporting.

## Repository foundation completed

- AI agent instructions
- Product vision and requirements
- Product glossary and conceptual flows
- Architecture principles and conceptual data model
- Initial ADRs
- Roadmap and MVP definition
- Assumption/open-question register
- GitHub task backlog

## Not decided yet

- Primary client strategy: web, mobile, or staged combination
- Frontend framework
- Backend/runtime framework
- Database
- Authentication provider/approach
- Deployment platform
- Detailed permissions model
- Wallet balance/reconciliation strategy
- Budgeting model
- Goal funding model
- Detailed transaction/capture persistence model
- Automatic transaction capture implementation

## Next decision

Select the MVP technical stack and delivery strategy based on product constraints, especially the future need for low-friction/automatic capture on mobile devices.

## Next execution steps

1. Resolve technical-stack and client-platform constraints.
2. Record the decision in an ADR.
3. Scaffold the selected application architecture.
4. Implement the domain foundation starting with household/wallet/transaction semantics.
5. Build the minimal quick-capture -> Transaction Inbox -> confirm flow before advanced automation.
