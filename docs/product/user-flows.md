# User Flows

These flows describe current product behavior where implemented and mark future behavior explicitly.

## Quick expense capture

Implemented in Issue #5:

1. Member opens the household app and focuses the prominent Quick Capture form.
2. Member enters **amount only**. A short note is optional.
3. Before any network request, the PWA stores the capture in its IndexedDB outbox with a client-generated UUID and capture timestamp.
4. The PWA sends that same capture ID to the Arta Server when reachable.
5. The server stores it as a `pending` capture. Wallet and transaction kind are intentionally allowed to be absent.
6. If the server is temporarily unreachable, the local outbox keeps the input and retries when connectivity returns.
7. The member can immediately continue their activity instead of completing a full transaction form.

The quick-capture step does **not** require wallet, transaction kind, category, or other enrichment merely because those fields are useful later.

## Transaction review

Implemented in Issue #5:

1. Member opens Transaction Inbox.
2. Arta shows pending captures with amount, note when present, capture time, and known classification context.
3. Member chooses **Review** and supplies the fields required for confirmation:
   - transaction kind (`income` or `expense`)
   - active wallet
   - positive amount (editable from the captured amount)
   - optional note
4. Saving review keeps the item pending but makes it ready for confirmation.
5. Member chooses **Confirm**.
6. The server creates the confirmed financial transaction and marks the capture confirmed in one database transaction.
7. The capture leaves the pending Inbox and the confirmed transaction becomes visible in financial history and eligible for wallet balance/reporting calculations.
8. Repeating the confirm request for an already-confirmed capture returns the same linked transaction rather than creating a duplicate.

### Trust boundary

Pending captures are deliberately excluded from:

- wallet balances
- household income totals
- household expense totals
- future budget spending calculations

Only confirmed transactions enter the trustworthy financial ledger.

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
4. Transfers and pending captures do not reduce the spending budget.

## Goal tracking

1. Household creates a goal and target amount.
2. Household records or allocates progress according to the future goal-funding model.
3. Arta shows current progress and remaining target.

## Future: balance reconciliation

1. Member provides or confirms the actual balance of a wallet.
2. Arta compares it with the expected balance.
3. If there is a discrepancy, Arta surfaces it rather than silently changing transaction history.
4. Member investigates, adds a missing transaction, or records an explicit adjustment according to the future reconciliation model.
