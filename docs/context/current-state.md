# Current State

Last updated: 2026-09-09

## Current phase

**Technical architecture selection and engineering foundation**

Several platform-level decisions are now accepted, while the complete implementation stack is still being selected.

## Established

- Product name: **Arta**
- Product category: family / household finance management
- Arta is **open source and self-hosted-first**; the project does not intend to require an Arta-operated SaaS backend for normal use.
- Repository is the durable AI-native source of truth.
- Primary product problem: transactions are often missed because recording them at purchase time creates friction.
- Product adoption must also be low-friction: download, installation, device requirements, dependencies, setup, onboarding, permissions, and updates should not become barriers to using Arta.
- Product principle: **Low friction from installation to daily capture.**
- Product distribution principle: self-hosting should not require ordinary users to set up a development environment.
- Core transaction principle: **Capture now, classify later.**
- Technical complexity should be absorbed by the product rather than imposed on users where practical.
- Transaction Inbox is a central product concept.
- Wallet transfers are explicit transfers, not income + expense.
- Initial MVP areas: household, wallets, transactions, quick capture, Transaction Inbox, budgets, goals, transfers, and basic reporting.

## Accepted technical / delivery direction

- **PWA-first** is the accepted MVP client strategy.
- **PostgreSQL** is the accepted primary server database.
- The primary product is a downloadable/self-hosted deployment controlled by the user/household.
- The MVP must provide an installation/startup path in addition to contributor source-code setup.
- End users should not need to manually install the application's development dependencies just to use Arta.
- Docker/CLI/binary/installer packaging remains to be finalized, but low-friction startup is an MVP requirement.
- The PWA should tolerate temporary loss of connectivity for capture where feasible; the exact local persistence and synchronization protocol remains to be designed.
- A public online deployment may exist as a **demo/preview only**, with disposable/demo data and without being positioned as Arta's production SaaS offering.
- Future Android-native capability may complement the PWA for OS-specific automatic capture such as notification access; it is not required for the core MVP client.

## Developer/platform constraints

- Primary development environment is Windows.
- Primary personal mobile testing device is iPhone.
- The MVP should therefore be testable and useful without requiring a Mac or an iOS-native development/signing workflow.

## Repository foundation completed

- AI agent instructions
- Product vision and requirements
- Product glossary and conceptual flows
- Architecture principles and conceptual data model
- Initial ADRs
- Roadmap and MVP definition
- Assumption/open-question register
- GitHub task backlog

## Still to decide

- Concrete PWA/frontend framework
- Backend language/runtime/framework
- Self-hosted authentication/session approach
- Detailed permissions model
- Offline/local client persistence implementation
- Synchronization protocol and conflict/idempotency strategy
- Packaging/startup strategy: Docker Compose, CLI/binary, installer, or staged combination
- Testing toolchain
- Public demo hosting/deployment approach
- Wallet balance/reconciliation strategy
- Budgeting model
- Goal funding model
- Detailed transaction/capture persistence model
- Automatic transaction capture implementation

## Technical-stack evaluation constraints

The remaining MVP stack decisions should explicitly consider:

- Self-hosted-first distribution
- Installation friction and number of steps required before first use
- No mandatory third-party cloud account for normal end-user operation
- Need for user-managed runtimes or dependencies
- PostgreSQL packaging, initialization, migrations, backup, and upgrades
- Application size and resource requirements
- Compatibility with modest consumer devices
- Startup and everyday interaction responsiveness
- Household access from multiple devices
- Battery and network impact where relevant
- Permission burden
- Update/upgrade friction
- Offline or degraded-connectivity capture behavior
- Data integrity during synchronization/retries
- Future path to Android notification-based automatic capture
- AI-assisted development speed and maintainability

## Next decision

Complete Issue #1 by comparing viable implementation approaches and selecting the concrete frontend, backend, authentication, sync, packaging, testing, and demo deployment strategy around the already accepted PWA-first + PostgreSQL + self-hosted-first direction.

## Next execution steps

1. Compare at least two viable implementation stacks and packaging approaches.
2. Select the complete MVP stack and record it in a new ADR.
3. Update architecture documentation with the selected runtime and deployment topology.
4. Scaffold the selected application architecture, PostgreSQL migrations, CI, and self-hosted startup path.
5. Implement the domain foundation starting with household/wallet/transaction semantics.
6. Build the minimal quick-capture -> Transaction Inbox -> confirm flow before advanced automation.
