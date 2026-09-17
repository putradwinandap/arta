import type { FormEvent } from "react";
import type { Wallet } from "../../lib/api";
export function ReconciliationForm({
  wallets,
  walletId,
  observed,
  onWalletChange,
  onObservedChange,
  onSubmit,
}: {
  wallets: Wallet[];
  walletId: string;
  observed: string;
  onWalletChange: (value: string) => void;
  onObservedChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit} aria-label="Reconcile wallet form">
      <label>
        Wallet
        <select
          aria-label="Reconciliation wallet"
          value={walletId}
          onChange={(e) => onWalletChange(e.target.value)}
        >
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} · {w.currency}
            </option>
          ))}
        </select>
      </label>
      <label>
        Observed balance
        <input
          aria-label="Observed balance"
          inputMode="decimal"
          value={observed}
          onChange={(e) => onObservedChange(e.target.value)}
          placeholder="4850000"
        />
      </label>
      <button disabled={!walletId}>Check balance</button>
    </form>
  );
}
