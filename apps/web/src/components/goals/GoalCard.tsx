import { useState } from "react";
import type { GoalSummary, Wallet } from "../../lib/api";
import { formatMoney } from "../financial/shared/currency";
import { GoalActions } from "./GoalActions";
export function GoalCard({
  goal,
  wallets,
  onReserve,
  onRelease,
  onArchive,
}: {
  goal: GoalSummary;
  wallets: Wallet[];
  onReserve: (id: string, walletId: string, amount: number) => Promise<void>;
  onRelease: (id: string, walletId: string, amount: number) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}) {
  const [walletId, setWalletId] = useState(wallets[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const act = (fn: typeof onReserve) => {
    setError("");
    void fn(goal.id, walletId, Number(amount))
      .then(() => setAmount(""))
      .catch((e) => setError(e instanceof Error ? e.message : "goal_error"));
  };
  const pct = goal.targetAmountMinor
    ? Math.min(100, Math.round((goal.reservedMinor / goal.targetAmountMinor) * 100))
    : 0;
  return (
    <article className="surface-card budget-card">
      <div className="budget-card__header">
        <strong>{goal.name}</strong>
        <span>{goal.status}</span>
      </div>
      <p>
        {formatMoney(goal.reservedMinor, goal.currency)} reserved of{" "}
        {formatMoney(goal.targetAmountMinor, goal.currency)} · {pct}%
      </p>
      <p>
        <strong>{formatMoney(goal.remainingMinor, goal.currency)}</strong> remaining
      </p>
      <progress
        max={goal.targetAmountMinor}
        value={Math.min(goal.reservedMinor, goal.targetAmountMinor)}
      />
      {goal.status === "active" && (
        <>
          <GoalActions
            name={goal.name}
            wallets={wallets}
            walletId={walletId}
            amount={amount}
            onWallet={setWalletId}
            onAmount={setAmount}
            onReserve={() => act(onReserve)}
            onRelease={() => act(onRelease)}
            onArchive={() => void onArchive(goal.id)}
          />
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </article>
  );
}
