import type { ChangeEvent } from "react";
import type { TransactionKind } from "../../../lib/api";
import type { TransactionFormProps } from "../shared/types";

export function TransactionForm(p: TransactionFormProps) {
  const walletCurrency = p.activeWallets.find(
    (w) => w.id === p.transactionWalletId,
  )?.currency;
  return (
    <section className="panel transaction-panel">
      <p className="eyebrow">Record confirmed money</p>
      <h2>Income or expense</h2>
      <form className="stack-form" onSubmit={p.handleTransaction}>
        {p.transactionKind === "expense" && (
          <label>
            Budget
            <select
              aria-label="Transaction budget"
              value={p.transactionBudgetId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                p.setTransactionBudgetId(e.target.value)
              }
            >
              <option value="">No budget</option>
              {p.budgets
                .filter((b) => b.currency === walletCurrency)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.periodStart.slice(0, 10)} → {b.periodEnd.slice(0, 10)} ·{" "}
                    {b.currency}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label>
          Type
          <select
            aria-label="Transaction type"
            value={p.transactionKind}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              p.setTransactionKind(e.target.value as TransactionKind)
            }
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label>
          Wallet
          <select
            aria-label="Transaction wallet"
            value={p.transactionWalletId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              p.setTransactionWalletId(e.target.value)
            }
          >
            {p.activeWallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Amount
          <input
            aria-label="Transaction amount"
            type="number"
            min="1"
            step="1"
            value={p.transactionAmount}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              p.setTransactionAmount(e.target.value)
            }
            required
          />
        </label>
        <label>
          Note
          <input
            aria-label="Transaction note"
            value={p.transactionNote}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              p.setTransactionNote(e.target.value)
            }
            placeholder="Groceries"
          />
        </label>
        <button disabled={p.saving}>Record {p.transactionKind}</button>
      </form>
    </section>
  );
}
