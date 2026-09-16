import type { ChangeEvent } from "react";
import type { TransferFormProps } from "../shared/types";

export function TransferForm(p: TransferFormProps) {
  const walletOptions = (
    value: string,
    onChange: (value: string) => void,
    label: string,
  ) => (
    <label>
      {label}
      <select
        aria-label={`Transfer ${label === "From" ? "source" : "destination"}`}
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      >
        {p.activeWallets.map((wallet) => (
          <option key={wallet.id} value={wallet.id}>
            {wallet.name}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <section className="panel transfer-panel">
      <p className="eyebrow">Move money</p>
      <h2>Wallet transfer</h2>
      {p.activeWallets.length < 2 ? (
        <div className="empty-state">
          <p>Add another active wallet to transfer money.</p>
        </div>
      ) : (
        <form className="stack-form" onSubmit={p.handleTransfer}>
          {walletOptions(p.transferSourceId, p.setTransferSourceId, "From")}
          {walletOptions(p.transferDestinationId, p.setTransferDestinationId, "To")}
          <label>
            Amount
            <input
              aria-label="Transfer amount"
              type="number"
              min="1"
              step="1"
              value={p.transferAmount}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                p.setTransferAmount(e.target.value)
              }
              required
            />
          </label>
          <label>
            Note
            <input
              aria-label="Transfer note"
              value={p.transferNote}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                p.setTransferNote(e.target.value)
              }
              placeholder="Move to savings"
            />
          </label>
          <button disabled={p.saving}>Transfer money</button>
        </form>
      )}
    </section>
  );
}
