import type { Reconciliation, Wallet } from "../../lib/api";
import { formatMoney } from "../financial/shared/currency";
export function ReconciliationItem({
  item,
  wallets,
  reason,
  onReasonChange,
  onAdjust,
}: {
  item: Reconciliation;
  wallets: Wallet[];
  reason: string;
  onReasonChange: (value: string) => void;
  onAdjust: () => void;
}) {
  return (
    <article className="surface-card card">
      <strong>
        {wallets.find((w) => w.id === item.walletId)?.name || "Wallet"} · {item.status}
      </strong>
      <p>
        Expected {formatMoney(item.expectedAmountMinor, item.currency)} · observed{" "}
        {formatMoney(item.observedAmountMinor, item.currency)}
      </p>
      <p>
        Original discrepancy{" "}
        <strong>{formatMoney(item.discrepancyMinor, item.currency)}</strong>
      </p>
      {item.status === "unresolved" && (
        <div>
          <p className="muted">
            Record the real missing transaction/transfer first if you know it. If the
            historical cause cannot be reconstructed, explicitly adjust the unexplained
            remainder.
          </p>
          <label>
            Adjustment reason
            <input
              aria-label={`Adjustment reason for ${item.id}`}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Reason, e.g. incomplete opening balance"
            />
          </label>
          <button type="button" onClick={onAdjust}>
            Adjust remaining difference
          </button>
        </div>
      )}
    </article>
  );
}
