import { useEffect, useMemo, useState } from "react";
import {
  getFinanceOverview,
  listPendingCaptures,
  listReconciliations,
  listWallets,
  type FinanceOverview,
  type Reconciliation,
  type TransactionCapture,
  type Wallet,
} from "./lib/api";
import { formatMoney } from "./components/financial/shared/currency";

export function HouseholdOverviewMount() {
  const [householdId, setHouseholdId] = useState(
    localStorage.getItem("arta.householdId") || "",
  );
  useEffect(() => {
    const timer = setInterval(
      () => setHouseholdId(localStorage.getItem("arta.householdId") || ""),
      500,
    );
    return () => clearInterval(timer);
  }, []);
  if (!householdId) return null;
  return <HouseholdOverview householdId={householdId} />;
}

export function HouseholdOverview({ householdId }: { householdId: string }) {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [pending, setPending] = useState<TransactionCapture[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.allSettled([
      getFinanceOverview(householdId),
      listWallets(householdId),
      listPendingCaptures(householdId),
      listReconciliations(householdId),
    ])
      .then(([overviewResult, walletsResult, pendingResult, reconciliationResult]) => {
        if (overviewResult.status === "rejected") throw overviewResult.reason;
        if (walletsResult.status === "rejected") throw walletsResult.reason;
        const nextOverview = overviewResult.value;
        const nextWallets = walletsResult.value;
        const nextPending =
          pendingResult.status === "fulfilled" ? pendingResult.value : [];
        const nextReconciliations =
          reconciliationResult.status === "fulfilled" ? reconciliationResult.value : [];
        setOverview(nextOverview);
        setWallets(nextWallets);
        setPending(nextPending.filter((capture) => capture.status === "pending"));
        setReconciliations(nextReconciliations);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "overview_failed"));
  }, [householdId]);

  const names = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet.name])),
    [wallets],
  );
  if (error)
    return (
      <main className="app-shell">
        <section className="panel">
          <p className="error" role="alert">
            Unable to load dashboard: {error}
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </section>
      </main>
    );
  if (!overview)
    return (
      <main className="app-shell">
        <section className="panel" role="status" aria-live="polite">
          <p className="muted">Loading household overview…</p>
        </section>
      </main>
    );

  const budgets = overview.currentBudgets ?? [];
  const goals = overview.activeGoals ?? [];

  const unresolved = reconciliations.filter((item) => item.status === "unresolved");
  return (
    <main className="app-shell dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Household overview</p>
          <h2>
            {localStorage.getItem("arta.activeHouseholdName") || "Active household"}
          </h2>
          <h1>Your financial position</h1>
          <p className="muted">
            A quick view of physical money, reserved funds, spendable funds, and what
            needs attention.
          </p>
        </div>
        <a className="button secondary" href="/transactions">
          Capture or review money
        </a>
      </header>
      {overview.balances.length === 0 ? (
        <section className="panel empty-state">
          <h2>Start your household overview</h2>
          <p>Add a wallet to see balances and begin recording financial activity.</p>
          <a className="button" href="/wallets">
            Add a wallet
          </a>
        </section>
      ) : (
        <section className="finance-summary">
          {overview.balances.map((balance) => (
            <article className="summary-card" key={balance.walletId}>
              <span>
                {names.get(balance.walletId) ?? "Wallet"} · {balance.currency}
              </span>
              <strong>{formatMoney(balance.amountMinor, balance.currency)}</strong>
              <small>
                Physical · Reserved{" "}
                {formatMoney(balance.reservedMinor ?? 0, balance.currency)} · Available{" "}
                {formatMoney(
                  balance.availableMinor ?? balance.amountMinor,
                  balance.currency,
                )}
              </small>
            </article>
          ))}
        </section>
      )}
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
      <div className="layout-grid">
        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Budget health</p>
              <h2>Current budgets</h2>
            </div>
            <a href="/budgets">Manage budgets</a>
          </div>
          {budgets.length === 0 ? (
            <div className="empty-state">
              <p>No budget covers today.</p>
              <a href="/budgets">Create a budget</a>
            </div>
          ) : (
            budgets.map((budget) => (
              <article className="card" key={budget.id}>
                <strong>{budget.currency} budget</strong>
                <p>
                  {formatMoney(budget.spentMinor, budget.currency)} spent of{" "}
                  {formatMoney(budget.amountMinor, budget.currency)}
                </p>
                <small>
                  {formatMoney(budget.remainingMinor, budget.currency)} remaining
                </small>
              </article>
            ))
          )}
        </section>
        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Goal progress</p>
              <h2>Active goals</h2>
            </div>
            <a href="/goals">Manage goals</a>
          </div>
          {goals.length === 0 ? (
            <div className="empty-state">
              <p>No active financial goals yet.</p>
              <a href="/goals">Create a goal</a>
            </div>
          ) : (
            goals.map((goal) => (
              <article className="card" key={goal.id}>
                <strong>{goal.name}</strong>
                <p>
                  {formatMoney(goal.reservedMinor, goal.currency)} reserved of{" "}
                  {formatMoney(goal.targetAmountMinor, goal.currency)}
                </p>
                <small>
                  {formatMoney(goal.remainingMinor, goal.currency)} remaining
                </small>
              </article>
            ))
          )}
        </section>
      </div>
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
    </main>
  );
}
