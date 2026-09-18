import type { BudgetSummary } from "../../lib/api";
export function BudgetRenewalControl({
  item,
  saving,
  onToggle,
}: {
  item: BudgetSummary;
  saving: boolean;
  onToggle: () => void;
}) {
  return (
    <button className="secondary" type="button" disabled={saving} onClick={onToggle}>
      {item.autoRenew ? "Disable auto-renew" : "Enable auto-renew"}
    </button>
  );
}
