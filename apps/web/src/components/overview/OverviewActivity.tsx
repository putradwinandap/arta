import type { FinanceOverview } from "../../lib/api";
import { formatMoney } from "../financial/shared/currency";

export function OverviewActivity({ overview }: { overview: FinanceOverview }) {
  return (
    <section className="panel activity-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Confirmed ledger</p>
          <h2>Recent activity</h2>
        </div>
        <a href="/transactions">View all</a>
      </div>
      {overview.activity.length === 0 ? (
        <div className="empty-state">
          <p>No confirmed activity yet. Capture something when you are ready.</p>
        </div>
      ) : (
        <div className="activity-list">
          {overview.activity.slice(0, 5).map((item) => (
            <article className="activity-row" key={item.id}>
              <div>
                <strong>
                  {item.type === "transfer"
                    ? "Wallet transfer"
                    : item.type === "income"
                      ? "Income"
                      : "Expense"}
                </strong>
                <p className="muted">
                  {item.note || new Date(item.occurredAt).toLocaleString()}
                </p>
              </div>
              <strong>
                {item.type === "expense" ? "-" : ""}
                {formatMoney(item.amountMinor, item.currency)}
              </strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
