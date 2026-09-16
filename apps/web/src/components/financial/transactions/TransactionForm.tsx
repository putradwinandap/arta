import { FormEvent } from "react";
export function TransactionForm(p: any) {
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
              onChange={(e: any) => p.setTransactionBudgetId(e.target.value)}
            >
              <option value="">No budget</option>
              {p.budgets
                .filter(
                  (b: any) =>
                    b.currency ===
                    p.activeWallets.find((w: any) => w.id === p.transactionWalletId)
                      ?.currency,
                )
                .map((b: any) => (
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
            onChange={(e: any) => p.setTransactionKind(e.target.value)}
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
            onChange={(e: any) => p.setTransactionWalletId(e.target.value)}
          >
            {p.activeWallets.map((w: any) => (
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
            onChange={(e: any) => p.setTransactionAmount(e.target.value)}
            required
          />
        </label>
        <label>
          Note
          <input
            aria-label="Transaction note"
            value={p.transactionNote}
            onChange={(e: any) => p.setTransactionNote(e.target.value)}
            placeholder="Groceries"
          />
        </label>
        <button disabled={p.saving}>Record {p.transactionKind}</button>
      </form>
    </section>
  );
}
