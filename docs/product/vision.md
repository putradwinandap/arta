# Product Vision

## Vision

Arta helps a household understand, organize, and intentionally use its money together without making financial recording feel like bookkeeping work.

Arta should minimize friction across the entire product journey: from installing and starting the application to capturing and reviewing everyday transactions.

## Core problem

Family finance apps fail when the data is incomplete. A major cause is capture friction: people postpone recording a purchase because entering wallet, category, amount, description, and other details at purchase time feels inconvenient. Later, they forget the transaction entirely.

Friction can also begin before the first transaction. If installation, device requirements, dependencies, permissions, setup, or onboarding are burdensome, users may never reach the point where Arta can help them manage their finances.

Arta treats both product adoption and reliable transaction capture as first-class product problems.

## Product principles

### Low friction from installation to daily capture

Arta should be easy to install, start, and use on ordinary consumer devices. Technical complexity should be absorbed by the product rather than imposed on the user.

This means product and technical decisions should favor:

- Simple installation with as few user steps as practical
- No unnecessary user-managed runtimes or external dependencies
- Reasonable storage, memory, CPU, battery, and network requirements
- Compatibility with modest consumer hardware where practical
- Short onboarding with progressive setup rather than mandatory configuration upfront
- Permissions requested only when they are needed and their purpose is clear
- Low-friction updates and upgrades
- Graceful behavior under imperfect connectivity where feasible

### Capture now, classify later

> Capture now, classify later.

A transaction should be able to enter Arta with the minimum information available and be enriched or confirmed later.

The first principle reduces the effort required to begin and continue using Arta. The second minimizes the effort required at the moment a financial event needs to be captured.

## Product promise

Arta should make it easier for a family to answer:

- Where is our money?
- What did we spend it on?
- How much can we still spend?
- What are we saving toward?
- Are there transactions we forgot to record?

## Target users

Initial target: households or families who manage multiple wallets/accounts and want a shared understanding of spending, budgets, and financial goals.

The household model should not require members to be biologically related; a household is a group intentionally managing finances together.

## Product pillars

### 1. Effortless adoption
Reduce friction before the first transaction by keeping installation, device requirements, setup, onboarding, permissions, and updates as simple and lightweight as practical.

### 2. Effortless capture
Reduce the effort between making a transaction and getting it into the system.

### 3. Review instead of recall
When details are incomplete, put transactions into an Inbox for later review instead of relying on the user to remember transactions from scratch.

### 4. Shared clarity
Members should be able to understand household money without turning the product into a surveillance tool.

### 5. Intentional spending
Budgets and goals connect everyday transactions to longer-term household priorities.

### 6. Trustworthy records
Transfers, corrections, and balances must behave predictably so reports can be trusted.

## Potential capture mechanisms

These are directions, not all MVP commitments:

- Very fast manual/quick capture
- Android transaction notification parsing
- Receipt capture
- Import/integration with financial sources where feasible
- Recurring transaction assistance
- Balance reconciliation and discrepancy detection

## Non-goals for the first MVP

- Full accounting/ERP functionality
- Investment trading
- Lending or credit products
- Becoming a bank or e-wallet
- Complex financial automation before core records are reliable
