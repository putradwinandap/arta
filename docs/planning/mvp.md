# MVP Scope

## MVP objective

Validate that a household can maintain useful financial records with substantially less transaction-entry friction than a traditional manual finance tracker **and that Arta can be obtained and run as a practical self-hosted product rather than only as developer source code**.

## In scope

### Distribution and runtime
- Open-source, self-hosted-first production model
- PWA-first client
- PostgreSQL as the primary server database
- A supported installation/startup path for end users
- Automated/guided PostgreSQL startup, initialization, and migrations through the selected packaging approach where practical
- Clear separation between end-user installation and contributor development setup
- Household access from supported desktop/mobile browsers when the Arta deployment is reachable
- Foundation for reliable local/offline capture and later synchronization
- Optional public disposable demo/preview for evaluation; not a production hosted finance service

### Household
- Basic user authentication
- Create/join a household or equivalent minimum household setup
- Basic household membership

### Wallets
- Create, view, edit/archive wallets
- Support common logical wallet types such as cash, bank, and e-wallet

### Transactions
- Record income and expense
- Transaction history
- Exact currency handling
- Basic categorization

### Quick Capture
- Minimal-input expense capture
- Allow deferred classification where safe
- Avoid losing a capture solely because the self-hosted server is temporarily unreachable when supported local persistence is available

### Transaction Inbox
- Show transactions requiring review
- Edit/classify pending records
- Confirm records

### Transfers
- Move money between wallets
- Exclude transfers from income/expense and spending-budget totals

### Budgets
- Create a simple periodic spending budget
- Show spent and remaining amount

### Goals
- Create a goal with target amount
- Show goal progress using the initial goal model selected later

### Reporting
- Basic household income/expense/spending overview from trusted records

## MVP release bar

The MVP is **not complete merely because a developer can clone the repository and start it**.

A first usable release should demonstrate a path comparable to:

```text
Download / obtain Arta
        |
        v
Run supported installer/startup command
        |
        v
Arta + PostgreSQL become ready with minimal manual infrastructure setup
        |
        v
Open PWA in browser
        |
        v
Create household -> wallet -> capture transaction -> review/confirm
```

The exact installer/CLI/container mechanism is selected by the technical-stack ADR, but a usable startup experience is part of the MVP definition.

## Public demo

A public demo is desirable so people can evaluate Arta without self-hosting first. It should:

- Be clearly identified as a demo/preview
- Use disposable or seeded demo data
- Avoid encouraging users to enter real financial information
- Be resettable/ephemeral as appropriate
- Not redefine Arta as a hosted SaaS product

## Explicitly post-MVP unless required by technical validation

- Production-grade automatic bank/e-wallet integrations
- Broad Android notification parsing
- Native mobile apps as a prerequisite for core Arta usage
- Receipt OCR/capture automation
- Advanced reconciliation
- Investment tracking
- Debt/lending products
- Complex role/permission matrices
- Advanced analytics or AI financial advice
- Multiple polished platform-specific installers if one reliable low-friction distribution path is sufficient for MVP validation

## MVP success questions

The MVP should help us learn:

1. Can a non-contributor obtain and start Arta without setting up a development environment?
2. Can a family consistently capture transactions using Arta across their normal devices?
3. Does quick capture + later review reduce forgotten transactions?
4. Is the Transaction Inbox easier than requiring full entry immediately?
5. Can temporary connectivity loss be handled without making capture feel unreliable or corrupting financial records?
6. Do users trust wallet, transfer, and budget calculations?
7. Which automatic-capture mechanism would provide the most value next?
