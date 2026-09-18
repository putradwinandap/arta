import type { BudgetSummary } from "../../lib/api";
import { BudgetCard } from "./BudgetCard";
export function BudgetList({
  items,
  saving,
  onToggle,
}: {
  items: BudgetSummary[];
  saving: boolean;
  onToggle: (item: BudgetSummary) => void;
}) {
  return (
    <div className="budget-list" aria-live="polite">
      {items.length === 0 ? (
        <div className="empty-state">
          <p>No budgets yet.</p>
        </div>
      ) : (
        items.map((item) => (
          <BudgetCard
            key={item.id}
            item={item}
            saving={saving}
            onToggle={() => onToggle(item)}
          />
        ))
      )}
    </div>
  );
}
