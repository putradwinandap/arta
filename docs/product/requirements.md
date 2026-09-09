# Product Requirements

Status: Early product discovery. Requirements marked **MVP** are intended for the first usable product but may be refined through explicit decisions.

## Distribution and installation

- **MVP:** Arta is open source and self-hosted-first; normal use must not require an Arta-operated SaaS account or hosted financial-data backend.
- **MVP:** A usable Arta release must include an installation/startup path in addition to contributor source-code instructions.
- **MVP:** Normal end users must not be required to manually install the application's development toolchain just to use Arta.
- **MVP:** Required server infrastructure, including PostgreSQL initialization/migrations, should be automated or guided by the supported deployment path as far as practical.
- **MVP:** The primary client is a PWA usable from supported desktop and mobile browsers.
- **MVP:** Household members should be able to access the household's Arta deployment from supported devices when the deployment is reachable.
- **MVP:** Temporary loss of connectivity should not unnecessarily prevent transaction capture where the selected browser/platform permits reliable local persistence; synchronization behavior must preserve data integrity.
- A public online instance may be provided as a disposable demo/preview, but it is not a production hosted Arta service and should discourage use of real financial data.

## Household

- **MVP:** A user can belong to a household.
- **MVP:** A household can contain multiple members.
- Permissions and privacy boundaries require further design.

## Wallets

- **MVP:** A household can maintain multiple wallets.
- **MVP:** A wallet represents a place where money is held, such as cash, a bank account, or an e-wallet.
- **MVP:** Transactions reference the relevant wallet.
- Wallet balance strategy (derived vs reconciled/declared balance) remains an open design question.

## Transactions

- **MVP:** Support expense and income transactions.
- **MVP:** A transaction records an amount, date/time, and wallet at minimum when known.
- **MVP:** Transactions may have optional category, description, merchant/source, and creator/capture metadata.
- **MVP:** A captured transaction may be incomplete and require review.
- **MVP:** Money values must use an exact representation suitable for currency.

## Quick Capture

- **MVP:** Users can record an expense with minimal interaction.
- **MVP:** Detailed classification must not be required at capture time when it can safely be deferred.
- Product target: common quick-capture flows should feel substantially faster than a traditional expense form.

## Transaction Inbox

- **MVP:** Incomplete/unconfirmed captured transactions appear in a review queue.
- **MVP:** Users can complete required information and confirm an Inbox item.
- **MVP:** Confirmed items leave the pending review queue without losing their history.

## Wallet Transfers

- **MVP:** Users can move money from one wallet to another.
- **MVP:** A wallet transfer does not count as household income or expense.
- **MVP:** A transfer preserves source wallet, destination wallet, amount, and date/time.

## Budgets

- **MVP:** Users can define a spending budget for a period.
- **MVP:** Eligible expense transactions reduce available budget.
- **MVP:** Transfers do not consume a spending budget.
- Category-based vs envelope-based budgeting requires further product design.

## Goals

- **MVP:** Users can create a financial goal with a target amount.
- **MVP:** Users can see progress toward the goal.
- How funds are allocated/reserved for goals remains an open domain decision.

## Reconciliation

Post-MVP candidate:

- Allow users to provide/confirm actual wallet balances.
- Detect unexplained differences between expected and actual balances.
- Help create or identify missing transactions without silently fabricating records.

## Automatic Capture

Post-MVP candidate:

- Detect transaction-like events from supported sources, initially considering Android notifications.
- Automatically captured data must remain reviewable.
- The system must preserve capture source and confidence/provenance where relevant.
- A future native Android client/companion may provide OS-specific capture while interoperating with the same Arta household/server model.

## Reporting

- **MVP:** Basic household spending summary should derive from confirmed financial records.
- Transfers must be excluded from household income/expense totals.

## Safety and data integrity

- Never store monetary values using imprecise floating-point semantics.
- Destructive changes to historical financial records should be deliberate and auditable.
- Automatic detection must not silently turn uncertain data into trusted financial truth.
- Offline retries or synchronization must not silently create duplicate financial records.
- Sensitive financial conflicts must be resolved deliberately rather than through an unsafe blind overwrite policy.
