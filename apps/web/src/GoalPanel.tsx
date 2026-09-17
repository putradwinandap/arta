import { FormEvent, useState } from "react";
import type { Wallet } from "./lib/api";
import { GoalCard } from "./components/goals/GoalCard";
import { GoalForm } from "./components/goals/GoalForm";
import { useGoals } from "./components/goals/useGoals";
export function GoalPanel({
  householdId,
  wallets,
}: {
  householdId: string;
  wallets: Wallet[];
}) {
  const state = useGoals(householdId);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState(wallets[0]?.currency || "IDR");
  const [target, setTarget] = useState("");
  async function add(e: FormEvent) {
    e.preventDefault();
    state.setError("");
    try {
      await state.create({ name, currency, targetAmountMinor: Number(target) });
      setName("");
      setTarget("");
      await state.refresh();
    } catch (e) {
      state.setError(e instanceof Error ? e.message : "goal_error");
    }
  }
  return (
    <section className="panel" aria-label="Financial goals">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reserved savings</p>
          <h2>Financial goals</h2>
          <p>
            Goal progress is backed by money actually reserved from a wallet. Reserved
            money remains yours, but is no longer ordinary available-to-spend money.
          </p>
        </div>
      </div>
      <GoalForm
        wallets={wallets}
        name={name}
        target={target}
        currency={currency}
        onName={setName}
        onTarget={setTarget}
        onCurrency={setCurrency}
        onSubmit={add}
      />
      {state.error && (
        <p role="alert" aria-live="assertive">
          {state.error}
        </p>
      )}
      <div className="stack">
        {state.goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            wallets={wallets.filter(
              (w) => w.status === "active" && w.currency === goal.currency,
            )}
            onReserve={async (id, walletId, amount) => {
              await state.reserve(id, { walletId, amountMinor: amount });
              await state.refresh();
            }}
            onRelease={async (id, walletId, amount) => {
              await state.release(id, { walletId, amountMinor: amount });
              await state.refresh();
            }}
            onArchive={async (id) => {
              await state.archive(id);
              await state.refresh();
            }}
          />
        ))}
      </div>
    </section>
  );
}
