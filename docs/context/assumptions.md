# Assumptions and Open Questions

Last updated: 2026-09-09

This file contains unresolved questions. Items here are **not accepted requirements** unless promoted into the appropriate product/architecture document or ADR.

## Product

- Should one user be able to belong to multiple households?
- What financial information is private to a member versus visible to the household?
- Are personal wallets and shared wallets both needed?
- Should budgets be category-based, envelope-based, wallet-based, or support multiple scopes?
- Does a goal represent only tracked progress, or are funds actually reserved/allocated to it?
- What transaction details are mandatory before a record becomes confirmed?

## Capture

- What is the fastest acceptable MVP capture interaction?
- Is Android the initial priority because notification-based transaction detection may be strategically important?
- Which Indonesian bank/e-wallet notifications are technically and legally practical to parse?
- How should duplicate detection work when the same transaction arrives through multiple capture sources?
- How should confidence and provenance be represented for automatically captured data?

## Wallets and reconciliation

- Is wallet balance fully derived from transactions, or can users set/reconcile an observed balance?
- How should opening balances be represented?
- How should explicit balance adjustments appear in reports?
- How should fees during wallet transfers be modeled?

## Technical

- Web-first, mobile-first, or shared cross-platform client?
- Which stack best supports both rapid AI-assisted development and future Android capture capabilities?
- SQL database is likely appropriate for relational financial records, but the concrete database is undecided.
- What authentication approach provides household invitation/membership flows with minimal complexity?

## Process

- GitHub Issues are the task source of truth. A GitHub Project board may be added when the backlog becomes large enough to justify another management layer.
- Branch protection and CI rules should be introduced once the application scaffold exists.
