import type { FinanceOverview } from "../../lib/api";
import { formatMoney } from "../financial/shared/currency";
import { OverviewActivity } from "./OverviewActivity";
import { OverviewHealth } from "./OverviewHealth";
import { OverviewSummary } from "./OverviewSummary";

type Props = {
  overview: FinanceOverview;
  names: Map<string, string>;
  pending: Parameters<typeof OverviewHealth>[0]["pending"];
  reconciliations: Parameters<typeof OverviewHealth>[0]["reconciliations"];
};

export function HouseholdOverview({
  overview,
  names,
  pending,
  reconciliations,
}: Props) {
  const budgets = overview.currentBudgets ?? [];
  const goals = overview.activeGoals ?? [];
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
      <OverviewSummary overview={overview} names={names} />
      <OverviewHealth pending={pending} reconciliations={reconciliations} />
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
              <article className="surface-card card" key={budget.id}>
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
              <article className="surface-card card" key={goal.id}>
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
      <OverviewActivity overview={overview} />
    </main>
  );
}
