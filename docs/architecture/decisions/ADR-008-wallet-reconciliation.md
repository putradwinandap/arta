# ADR-008: Wallet reconciliation uses observed balances and explicit resolution

- Status: Accepted
- Date: 2026-09-10
- Issue: #8

## Context

Arta derives wallet balances from trusted confirmed transactions and transfers. In real household use, records can still be incomplete: a purchase may be forgotten, a bank fee may not be captured, an opening balance may be incomplete, or an external institution may apply a correction.

A wallet therefore needs a way to compare Arta's expected ledger balance with the balance the user actually observes without weakening the trusted ledger or silently fabricating financial activity.

## Considered models

### Model A — silently force the wallet balance to the observed balance

Store or overwrite a mutable wallet balance whenever the user reports a real-world balance.

Rejected because this destroys the distinction between financial history and current observation, makes discrepancies unauditable, and can hide missing transactions.

### Model B — automatically synthesize income/expense for every discrepancy

When observed and expected balances differ, create an income or expense equal to the difference.

Rejected because Arta would be inventing financial meaning. A discrepancy does not prove that an expense or income occurred; it may represent multiple missing records, an opening-balance problem, a transfer, a pending capture, or another correction.

### Model C — observed balance checkpoint + explicit reconciliation case

Record what the user observed, compare it with the ledger-derived expected balance, and preserve any non-zero discrepancy as an explicit reconciliation case until the household explains or adjusts it.

Accepted.

## Decision

Arta will model reconciliation as a comparison between **ledger truth** and an **observed real-world balance**.

For a wallet at a reconciliation checkpoint:

```text
expected balance = balance derived from trusted ledger records
observed balance = balance explicitly entered/observed by the user
discrepancy      = observed balance - expected balance
```

A zero discrepancy is reconciled immediately. A non-zero discrepancy creates or preserves an auditable unresolved reconciliation case.

Arta MUST NOT silently create an income, expense, transfer, or adjustment merely to make the numbers match.

## Resolution model

A discrepancy may be resolved by one or more explicit actions:

1. **Record missing financial activity.** The household creates/confirms the actual missing transaction or transfer. Reconciliation is recalculated against the trusted ledger.
2. **Use an explicit balance adjustment.** When the historical cause cannot reasonably be reconstructed (for example an incomplete opening balance), the household may create a dedicated adjustment with a reason. An adjustment affects wallet balance but is not income, expense, transfer, or budget spending.
3. **Leave unresolved.** If the household does not know the cause yet, the discrepancy remains visible rather than being hidden.

A case becomes reconciled only when the remaining discrepancy is zero or when an explicit adjustment accounts for the remaining difference.

## Balance adjustment semantics

Balance adjustments are a dedicated ledger concept, not fake transactions.

- They belong to one household and wallet.
- They carry a signed exact integer minor-unit amount and an explicit reason/provenance.
- They affect the wallet's physical derived balance.
- They do not affect household income/expense totals.
- They do not consume budgets.
- They are auditable and are not silently edited into historical transactions.
- Goal reserved funds remain reservations against physical wallet money; reconciliation must continue to expose physical, reserved, and available amounts honestly.

## Pending captures and automatic capture

Pending Transaction Inbox captures are evidence, not trusted ledger entries, so they do not change expected balance until confirmed. The reconciliation UX may later suggest pending captures whose amounts/timing could explain a discrepancy, but it must require explicit confirmation.

The same rule applies to future Android notification capture: automated evidence may help explain a discrepancy but cannot silently become financial truth.

## Transfers

A missing transfer must be recorded as a transfer, not as an expense in one wallet and income in another. Future reconciliation assistance may correlate discrepancies across two same-currency household wallets to suggest a possible missing transfer.

## Opening balance

MVP does not require users to reconstruct arbitrary historical transactions. An explicit adjustment can establish/correct an opening position while preserving the fact that it is an adjustment rather than ordinary income.

## Auditability

Reconciliation checkpoints must preserve at least the wallet, observed amount, expected amount at observation time, discrepancy, timestamp, status, and resolution provenance. Resolution must remain explainable after the wallet balance later changes.

## Consequences

### Positive

- Arta never invents transactions to make balances look correct.
- Forgotten transactions become visible as discrepancies.
- Users can defer a discrepancy when they do not yet know the cause.
- Incomplete opening history has a safe escape hatch through explicit adjustments.
- The model composes with Transaction Inbox and future automatic capture.

### Costs

- Reconciliation introduces dedicated persisted state and UX.
- Adjustments become another balance-affecting ledger concept that all balance calculations must understand.
- A discrepancy may require multiple user actions before it reaches zero.

## Implementation direction

The first production vertical slice should let a user:

1. choose a wallet and enter its observed balance;
2. see expected, observed, and discrepancy values;
3. retain non-zero discrepancy as unresolved;
4. resolve the unexplained remainder with an explicit balance adjustment and reason;
5. see the resulting wallet balance reconcile to the observation;
6. preserve the checkpoint and adjustment audit history.

More advanced matching/suggestions for missing transactions, transfers, pending captures, and automatic sources can build on this boundary without changing the core trust model.
