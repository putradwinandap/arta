# User Flows

These are conceptual flows. UI details are intentionally not fixed yet.

## Quick expense capture

1. Member triggers quick capture.
2. Member enters the minimum available transaction information, ideally amount plus wallet when needed.
3. Arta stores the captured transaction.
4. If required details are missing or uncertain, the transaction enters the Transaction Inbox.
5. Member can continue their activity immediately rather than completing a long form.

## Transaction review

1. Member opens Transaction Inbox.
2. Arta shows pending captured transactions with known context.
3. Member reviews and adds/corrects details such as category or description.
4. Member confirms the record.
5. The transaction leaves the pending queue and becomes trusted for applicable reporting/budget calculations.

## Wallet transfer

1. Member chooses transfer.
2. Member selects source wallet and destination wallet.
3. Member enters amount and confirms.
4. Arta records one logical transfer relationship.
5. Wallet balances reflect the movement.
6. Household income and expense totals remain unchanged.

## Budget usage

1. Household creates a budget for a defined period/scope.
2. Confirmed eligible expenses are associated with that budget scope.
3. Arta shows spent and remaining amounts.
4. Transfers do not reduce the spending budget.

## Goal tracking

1. Household creates a goal and target amount.
2. Household records or allocates progress according to the future goal-funding model.
3. Arta shows current progress and remaining target.

## Future: balance reconciliation

1. Member provides or confirms the actual balance of a wallet.
2. Arta compares it with the expected balance.
3. If there is a discrepancy, Arta surfaces it rather than silently changing transaction history.
4. Member investigates, adds a missing transaction, or records an explicit adjustment according to the future reconciliation model.
