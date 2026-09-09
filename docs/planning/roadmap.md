# Product Roadmap

The roadmap communicates sequence and intent, not fixed dates.

## Phase 0 — Foundation

Goal: make Arta safe and efficient to build with AI agents.

- Establish repository source of truth
- Define product vision and core domain invariants
- Maintain current-state checkpoint and ADRs
- Choose technical stack
- Scaffold application and CI/testing conventions

## Phase 1 — Financial Core

Goal: create trustworthy basic household financial records.

- Authentication and household foundation
- Household membership basics
- Wallet CRUD
- Income/expense transaction foundation
- Wallet transfers
- Exact monetary handling
- Basic transaction history

## Phase 2 — Capture First

Goal: prove Arta's core differentiator.

- Quick expense capture
- Pending/review transaction state
- Transaction Inbox
- Classification and confirmation
- Capture provenance
- UX performance for frequent entry

## Phase 3 — Planning

Goal: connect spending with household intent.

- Budget model and period tracking
- Budget progress/remaining amount
- Financial goals
- Basic household overview/reporting

## Phase 4 — Reliability

Goal: find transactions users forgot to record.

- Wallet reconciliation
- Balance discrepancy detection
- Missing-transaction assistance
- Recurring transaction support
- Duplicate detection improvements

## Phase 5 — Automatic Capture

Goal: reduce manual capture further where platform access permits.

- Android notification-based capture exploration/implementation
- Supported-source parsers
- Confidence/provenance review
- Receipt capture exploration
- Financial integrations where feasible

## Phase 6 — Product Maturity

Potential directions after validated usage:

- Rich household permissions/privacy
- Advanced reporting
- Smarter classification suggestions
- Financial insights/assistant
- Additional import/integration sources
- Multi-household support if validated

## Delivery model — vertical slices

For user-facing work, roadmap phases describe capability order, but implementation should proceed as small vertical slices.

A slice should connect as much of the real user workflow as required: domain rules, persistence, API, frontend UX, and verification. Prefer making one narrow workflow usable end to end over building several backend-only capabilities and postponing their UI.

For example, once wallet domain/API foundations exist, prefer connecting household onboarding and wallet management to the frontend before accumulating unrelated financial-core backend features.

Horizontal work remains appropriate when the outcome is inherently infrastructural or cross-cutting, such as CI, security foundations, migration tooling, packaging, refactoring, or architecture decisions.

## Roadmap rule

Do not implement later-phase complexity simply because it is technically interesting. Each phase should validate the product assumptions required by the next one.

For user-facing features, apply the vertical slice delivery rule in `AGENTS.md`: implement the smallest end-to-end usable slice and verify it before expanding adjacent capability.
