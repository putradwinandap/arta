import { FormEvent, useEffect, useState } from "react";
import {
  adjustReconciliation,
  ReconciliationForm,
  ReconciliationList,
  submitReconciliation,
  useReconciliation,
} from "./components/reconciliation";
import { formatMoney } from "./components/financial/shared/currency";
export function ReconciliationMount() {
  const [householdId, setHouseholdId] = useState(
    () => localStorage.getItem("arta.householdId") || "",
  );
  useEffect(() => {
    const timer = setInterval(
      () => setHouseholdId(localStorage.getItem("arta.householdId") || ""),
      500,
    );
    return () => clearInterval(timer);
  }, []);
  if (!householdId) return null;
  return (
    <main id="reconciliation" className="app-shell reconciliation-shell">
      <ReconciliationPanel householdId={householdId} />
    </main>
  );
}
function ReconciliationPanel({ householdId }: { householdId: string }) {
  const state = useReconciliation(householdId);
  const [observed, setObserved] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const selected = state.wallets.find((w) => w.id === state.walletId);
  const balance = state.balances.find((b) => b.walletId === state.walletId);
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await submitReconciliation(householdId, state.walletId, observed);
      setObserved("");
      state.setError("");
      await state.load();
    } catch (err) {
      state.setError(
        err instanceof Error ? err.message : "Unable to reconcile wallet.",
      );
    }
  }
  async function adjust(id: string) {
    try {
      await adjustReconciliation(householdId, id, { reason: reasons[id] || "" });
      state.setError("");
      await state.load();
    } catch (err) {
      state.setError(
        err instanceof Error ? err.message : "Unable to adjust reconciliation.",
      );
    }
  }
  return (
    <section className="workspace panel" aria-labelledby="reconciliation-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reliability</p>
          <h1 id="reconciliation-title">Reconcile wallet balance</h1>
          <p className="muted">
            Compare Arta's trusted ledger with the balance you actually see. Arta never
            invents a transaction to hide a difference.
          </p>
        </div>
      </div>
      {state.loading ? (
        <p className="muted" role="status" aria-live="polite">
          Loading reconciliation…
        </p>
      ) : (
        <>
          <ReconciliationForm
            wallets={state.wallets}
            walletId={state.walletId}
            observed={observed}
            onWalletChange={state.setWalletId}
            onObservedChange={setObserved}
            onSubmit={submit}
          />
          {selected && balance && (
            <p className="muted">
              Arta currently expects{" "}
              {formatMoney(balance.amountMinor, selected.currency)} physical balance.
            </p>
          )}
          {state.error && (
            <p className="error" role="alert" aria-live="assertive">
              {state.error}
            </p>
          )}
          <ReconciliationList
            items={state.items}
            wallets={state.wallets}
            reasons={reasons}
            onReasonChange={(id, value) => setReasons({ ...reasons, [id]: value })}
            onAdjust={(id) => void adjust(id)}
          />
        </>
      )}
    </section>
  );
}
