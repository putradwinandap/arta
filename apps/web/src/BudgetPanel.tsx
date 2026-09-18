import type { Wallet } from "./lib/api";
import { BudgetForm } from "./components/budgets/BudgetForm";
import { BudgetList } from "./components/budgets/BudgetList";
import { useBudgets } from "./components/budgets/useBudgets";

type Props = { householdId: string; wallets: Wallet[]; refreshKey: number };

export function BudgetPanel({ householdId, wallets, refreshKey }: Props) {
  const state = useBudgets(householdId, wallets, refreshKey);
  return (
    <section className="panel budget-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Spending budget</p>
          <h2>Plan a period, then track confirmed spending.</h2>
          <p className="muted">
            Only confirmed expenses in the same currency and period count. Transfers and
            pending captures stay outside the budget.
          </p>
        </div>
        <button
          className="secondary"
          type="button"
          onClick={() => void state.refresh()}
        >
          Refresh spending
        </button>
      </div>
      {state.error && (
        <p className="alert" role="alert">
          {state.error}
        </p>
      )}
      <div className="budget-grid">
        <BudgetForm
          currencies={state.currencies}
          currency={state.currency}
          setCurrency={state.setCurrency}
          periodStart={state.periodStart}
          setPeriodStart={state.setPeriodStart}
          periodEnd={state.periodEnd}
          setPeriodEnd={state.setPeriodEnd}
          amount={state.amount}
          setAmount={state.setAmount}
          autoRenew={state.autoRenew}
          setAutoRenew={state.setAutoRenew}
          saving={state.saving}
          onSubmit={state.submit}
        />
        <BudgetList
          items={state.items}
          saving={state.saving}
          onToggle={(item) => void state.toggleRenewal(item)}
        />
      </div>
    </section>
  );
}
