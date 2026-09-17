import type { FormEvent } from "react";
import type { Wallet } from "../../lib/api";
export function GoalForm({
  wallets,
  name,
  target,
  currency,
  onName,
  onTarget,
  onCurrency,
  onSubmit,
}: {
  wallets: Wallet[];
  name: string;
  target: string;
  currency: string;
  onName: (v: string) => void;
  onTarget: (v: string) => void;
  onCurrency: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <form className="inline-form" onSubmit={onSubmit}>
      <input
        aria-label="Goal name"
        placeholder="Goal name"
        value={name}
        onChange={(e) => onName(e.target.value)}
        required
      />
      <input
        aria-label="Goal target"
        type="number"
        min="1"
        placeholder="Target (minor units)"
        value={target}
        onChange={(e) => onTarget(e.target.value)}
        required
      />
      <select
        aria-label="Goal currency"
        value={currency}
        onChange={(e) => onCurrency(e.target.value)}
      >
        {[...new Set(wallets.map((w) => w.currency))].map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <button type="submit">Create goal</button>
    </form>
  );
}
