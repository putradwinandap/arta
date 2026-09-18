import type { Reconciliation, TransactionCapture } from "../../lib/api";

export function OverviewHealth({
  pending,
  reconciliations,
}: {
  pending: TransactionCapture[];
  reconciliations: Reconciliation[];
}) {
  const unresolved = reconciliations.filter((item) => item.status === "unresolved");
  return (
    <section className="dashboard-grid">
      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Needs attention</p>
            <h2>Transaction Inbox</h2>
          </div>
          <a href="/transactions">Open Inbox</a>
        </div>
        <strong>{pending.length} pending review</strong>
        <p className="muted">
          Pending captures stay outside trusted balances until reviewed and confirmed.
        </p>
      </article>
      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Reconciliation</p>
            <h2>
              {unresolved.length ? "Balance needs review" : "Balances look aligned"}
            </h2>
          </div>
          <a href="/reconciliation">Open reconciliation</a>
        </div>
        <p className="muted">
          {unresolved.length
            ? `${unresolved.length} wallet balance discrepancy needs attention.`
            : "No unresolved wallet discrepancy is currently recorded."}
        </p>
      </article>
    </section>
  );
}
