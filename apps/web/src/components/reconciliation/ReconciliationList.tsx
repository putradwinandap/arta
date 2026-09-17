import type { Reconciliation, Wallet } from "../../lib/api";
import { ReconciliationItem } from "./ReconciliationItem";
export function ReconciliationList({
  items,
  wallets,
  reasons,
  onReasonChange,
  onAdjust,
}: {
  items: Reconciliation[];
  wallets: Wallet[];
  reasons: Record<string, string>;
  onReasonChange: (id: string, value: string) => void;
  onAdjust: (id: string) => void;
}) {
  if (!items.length)
    return (
      <div className="empty-state">
        <p>No reconciliation records yet.</p>
        <p className="muted">
          Check a wallet balance when you want to verify it against Arta's ledger.
        </p>
      </div>
    );
  return (
    <div className="card-list">
      {items.map((item) => (
        <ReconciliationItem
          key={item.id}
          item={item}
          wallets={wallets}
          reason={reasons[item.id] || ""}
          onReasonChange={(value) => onReasonChange(item.id, value)}
          onAdjust={() => onAdjust(item.id)}
        />
      ))}
    </div>
  );
}
