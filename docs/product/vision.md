# Product Vision

## Vision

Arta helps a household understand, organize, and intentionally use its money together without making financial recording feel like bookkeeping work.

Arta is an **open-source, self-hosted-first** product. The primary distribution model is software that households can download and run on infrastructure they control. Arta does not require a mandatory Arta-operated SaaS account or hosted financial-data service.

Arta should minimize friction across the entire product journey: from downloading, installing, and starting the application to capturing and reviewing everyday transactions.

## Core problem

Family finance apps fail when the data is incomplete. A major cause is capture friction: people postpone recording a purchase because entering wallet, category, amount, description, and other details at purchase time feels inconvenient. Later, they forget the transaction entirely.

Friction can also begin before the first transaction. If installation, device requirements, dependencies, permissions, setup, or onboarding are burdensome, users may never reach the point where Arta can help them manage their finances.

Self-hosting must not mean pushing development or infrastructure complexity onto ordinary users. Arta should absorb as much setup complexity as practical through packaging, startup tooling, sensible defaults, migrations, and documentation.

Arta treats both product adoption and reliable transaction capture as first-class product problems.

## Product principles

### Low friction from installation to daily capture

Arta should be easy to download, install, start, and use on ordinary consumer devices. Technical complexity should be absorbed by the product rather than imposed on the user.

This means product and technical decisions should favor:

- Simple installation with as few user steps as practical
- A usable release/startup path rather than source code alone
- No unnecessary user-managed development runtimes or dependencies
- Automated or guided initialization of required infrastructure where practical
- Reasonable storage, memory, CPU, battery, and network requirements
- Compatibility with modest consumer hardware where practical
- Short onboarding with progressive setup rather than mandatory configuration upfront
- Permissions requested only when they are needed and their purpose is clear
- Low-friction updates, migrations, backup, and upgrades
- Graceful behavior under imperfect connectivity where feasible

### Self-hosted ownership

Arta's primary product is software the household can run and control itself. Financial data should not depend on a mandatory Arta-operated cloud service.

A public online deployment may be provided as a **demo/preview** so people can evaluate Arta before installing it. That demo is not the primary product, should use disposable/demo data, and should not be presented as a production hosted finance service.

### Capture now, classify later

> Capture now, classify later.

A transaction should be able to enter Arta with the minimum information available and be enriched or confirmed later.

Client experiences should also be designed so temporary connectivity loss does not unnecessarily block capture. The detailed offline persistence and synchronization model is an architecture decision, but capture reliability remains the product goal.

## Product promise

Arta should make it easier for a family to answer:

- Where is our money?
- What did we spend it on?
- How much can we still spend?
- What are we saving toward?
- Are there transactions we forgot to record?

## Target users

Initial target: households or families who manage multiple wallets/accounts and want a shared understanding of spending, budgets, and financial goals while retaining control of their own Arta deployment and data.

The household model should not require members to be biologically related; a household is a group intentionally managing finances together.

## Product pillars

### 1. Effortless adoption
Reduce friction before the first transaction by keeping download, installation, device requirements, setup, onboarding, permissions, and updates as simple and lightweight as practical.

### 2. User-controlled deployment
Keep self-hosting as the primary distribution model without requiring ordinary users to behave like software developers or database administrators.

### 3. Effortless capture
Reduce the effort between making a transaction and getting it into the system.

### 4. Review instead of recall
When details are incomplete, put transactions into an Inbox for later review instead of relying on the user to remember transactions from scratch.

### 5. Shared clarity
Members should be able to understand household money without turning the product into a surveillance tool.

### 6. Intentional spending
Budgets and goals connect everyday transactions to longer-term household priorities.

### 7. Trustworthy records
Transfers, corrections, and balances must behave predictably so reports can be trusted.

## Potential capture mechanisms

These are directions, not all MVP commitments:

- Very fast manual/quick capture
- Offline-capable capture with later synchronization
- Android transaction notification parsing
- Receipt capture
- Import/integration with financial sources where feasible
- Recurring transaction assistance
- Balance reconciliation and discrepancy detection

## Distribution direction

Arta should eventually support multiple ways to evaluate or run the same product:

1. **Public demo** — a disposable online preview for evaluation, not hosted production finance.
2. **User-friendly self-hosted release** — the primary end-user distribution, with installation/startup tooling that minimizes manual dependency setup.
3. **Power-user/server deployment** — for example container-based deployment where appropriate.
4. **Contributor workflow** — source checkout and development tooling, explicitly separate from the normal user installation experience.

## Non-goals for the first MVP

- Operating Arta as a mandatory SaaS/cloud finance service
- Requiring end users to set up a development environment just to use Arta
- Full accounting/ERP functionality
- Investment trading
- Lending or credit products
- Becoming a bank or e-wallet
- Complex financial automation before core records are reliable
