import type { Wallet } from "../../lib/api";
export function GoalActions({
  name,
  wallets,
  walletId,
  amount,
  onWallet,
  onAmount,
  onReserve,
  onRelease,
  onArchive,
}: {
  name: string;
  wallets: Wallet[];
  walletId: string;
  amount: string;
  onWallet: (v: string) => void;
  onAmount: (v: string) => void;
  onReserve: () => void;
  onRelease: () => void;
  onArchive: () => void;
}) {
  return (
    <div className="inline-form">
      <select
        aria-label={`Wallet for ${name}`}
        value={walletId}
        onChange={(e) => onWallet(e.target.value)}
      >
        {wallets.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      <input
        aria-label={`Amount for ${name}`}
        type="number"
        min="1"
        value={amount}
        onChange={(e) => onAmount(e.target.value)}
        placeholder="Amount"
      />
      <button type="button" onClick={onReserve} disabled={!walletId}>
        Reserve
      </button>
      <button type="button" onClick={onRelease} disabled={!walletId}>
        Release
      </button>
      <button type="button" onClick={onArchive}>
        Archive
      </button>
    </div>
  );
}
