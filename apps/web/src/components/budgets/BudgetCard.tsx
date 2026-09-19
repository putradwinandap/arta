import type { BudgetSummary } from "../../lib/api";
import { formatMoney } from "../financial/shared/currency";
import { BudgetRenewalControl } from "./BudgetRenewalControl";

export function BudgetCard({
  item,
  saving,
  onToggle,
}: {
  item: BudgetSummary;
  saving: boolean;
  onToggle: () => void;
}) {
  const ratio =
    item.amountMinor > 0
      ? Math.min(100, Math.round((item.spentMinor / item.amountMinor) * 100))
      : 0;
  return (
    <article className="surface-card budget-card">
      <div className="section-heading">
        <div>
          <strong>
            {item.periodStart.slice(0, 10)} → {item.periodEnd.slice(0, 10)}
          </strong>
          <p className="muted">
            {item.currency} ·{" "}
            {item.autoRenew ? "Monthly auto-renew on" : "Auto-renew off"}
          </p>
        </div>
        <strong>{ratio}%</strong>
      </div>
      <progress
        max={item.amountMinor}
        value={Math.min(item.spentMinor, item.amountMinor)}
      />
      <div className="budget-totals">
        <span>
          Spent <strong>{formatMoney(item.spentMinor, item.currency)}</strong>
        </span>
        <span>
          Remaining <strong>{formatMoney(item.remainingMinor, item.currency)}</strong>
        </span>
        <span>
          Limit <strong>{formatMoney(item.amountMinor, item.currency)}</strong>
        </span>
      </div>
      <BudgetRenewalControl item={item} saving={saving} onToggle={onToggle} />
    </article>
  );
}
