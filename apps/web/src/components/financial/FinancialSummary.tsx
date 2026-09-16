import type { FinanceOverview, Wallet } from "../../lib/api";

function formatMoney(amountMinor: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor);
}

export function FinancialSummary({ overview }: { overview: FinanceOverview }) {
  return (
    <section className="finance-summary">
      <article className="summary-card">
        <span>Income</span>
        <strong>{formatMoney(overview.totals.incomeMinor)}</strong>
      </article>
      <article className="summary-card">
        <span>Expense</span>
        <strong>{formatMoney(overview.totals.expenseMinor)}</strong>
      </article>
      <article className="summary-card">
        <span>Net</span>
        <strong>
          {formatMoney(overview.totals.incomeMinor - overview.totals.expenseMinor)}
        </strong>
        <small>Transfers and pending captures excluded</small>
      </article>
    </section>
  );
}

export function ActivityList({
  overview,
  wallets,
}: {
  overview: FinanceOverview;
  wallets: Wallet[];
}) {
  const walletById = new Map(wallets.map((wallet) => [wallet.id, wallet]));
  return (
    <section className="panel activity-panel">
      <p className="eyebrow">Confirmed history</p>
      <h2>Recent activity</h2>
      {overview.activity.length === 0 ? (
        <div className="empty-state">
          <p>No confirmed financial activity yet.</p>
        </div>
      ) : (
        <div className="activity-list">
          {overview.activity.map((item) => {
            const wallet = item.walletId ? walletById.get(item.walletId) : undefined;
            const source = item.sourceWalletId
              ? walletById.get(item.sourceWalletId)
              : undefined;
            const destination = item.destinationWalletId
              ? walletById.get(item.destinationWalletId)
              : undefined;
            const title =
              item.type === "transfer"
                ? `${source?.name ?? "Wallet"} → ${destination?.name ?? "Wallet"}`
                : `${item.type === "income" ? "Income" : "Expense"} · ${wallet?.name ?? "Wallet"}`;
            return (
              <article className="activity-row" key={item.id}>
                <div>
                  <strong>{title}</strong>
                  <p className="muted">
                    {item.note || new Date(item.occurredAt).toLocaleString()}
                  </p>
                </div>
                <strong>
                  {item.type === "expense" ? "-" : ""}
                  {formatMoney(item.amountMinor, item.currency)}
                </strong>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
