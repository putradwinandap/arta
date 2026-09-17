import { FormEvent, useEffect, useState } from "react";
import {
  adjustReconciliation,
  createReconciliation,
  getFinanceOverview,
  listReconciliations,
  listWallets,
  Reconciliation,
  Wallet,
  WalletBalance,
} from "./lib/api";
import { formatMoney } from "./components/financial/shared/currency";

export function ReconciliationMount() {
  const [householdId, setHouseholdId] = useState(
    localStorage.getItem("arta.householdId") || "",
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
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [items, setItems] = useState<Reconciliation[]>([]);
  const [walletId, setWalletId] = useState("");
  const [observed, setObserved] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [walletResult, finance, reconciliationResult] = await Promise.all([
        listWallets(householdId),
        getFinanceOverview(householdId),
        listReconciliations(householdId),
      ]);
      const activeWallets = walletResult.filter((wallet) => wallet.status === "active");
      setWallets(activeWallets);
      setBalances(finance.balances);
      setItems(reconciliationResult);
      setWalletId((current) =>
        current && activeWallets.some((wallet) => wallet.id === current)
          ? current
          : activeWallets[0]?.id || "",
      );
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reconciliation.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [householdId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const amount = Math.round(Number(observed) * 100);
    if (!Number.isFinite(amount)) {
      setError("Enter a valid observed balance");
      return;
    }
    try {
      await createReconciliation(householdId, walletId, {
        observedAmountMinor: amount,
      });
      setObserved("");
      setError("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reconcile wallet.");
    }
  }
  async function adjust(id: string) {
    try {
      await adjustReconciliation(householdId, id, { reason: reason[id] || "" });
      setError("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to adjust reconciliation.");
    }
  }

  const selected = wallets.find((wallet) => wallet.id === walletId);
  const balance = balances.find((item) => item.walletId === walletId);
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
      {loading ? (
        <p className="muted" role="status" aria-live="polite">
          Loading reconciliation…
        </p>
      ) : (
        <>
          <form
            className="form-grid"
            onSubmit={submit}
            aria-label="Reconcile wallet form"
          >
            <label>
              Wallet
              <select
                aria-label="Reconciliation wallet"
                value={walletId}
                onChange={(event) => setWalletId(event.target.value)}
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name} · {wallet.currency}
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
                onChange={(event) => setObserved(event.target.value)}
                placeholder="4850000"
              />
            </label>
            <button disabled={!walletId}>Check balance</button>
          </form>
          {selected && balance && (
            <p className="muted">
              Arta currently expects{" "}
              {formatMoney(balance.amountMinor, selected.currency)} physical balance.
            </p>
          )}
          {error && (
            <p className="error" role="alert" aria-live="assertive">
              {error}
            </p>
          )}
          <div className="card-list">
            {items.length === 0 ? (
              <div className="empty-state">
                <p>No reconciliation records yet.</p>
                <p className="muted">
                  Check a wallet balance when you want to verify it against Arta's
                  ledger.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <article className="card" key={item.id}>
                  <strong>
                    {wallets.find((wallet) => wallet.id === item.walletId)?.name ||
                      "Wallet"}{" "}
                    · {item.status}
                  </strong>
                  <p>
                    Expected {formatMoney(item.expectedAmountMinor, item.currency)} ·
                    observed {formatMoney(item.observedAmountMinor, item.currency)}
                  </p>
                  <p>
                    Original discrepancy{" "}
                    <strong>{formatMoney(item.discrepancyMinor, item.currency)}</strong>
                  </p>
                  {item.status === "unresolved" && (
                    <div>
                      <p className="muted">
                        Record the real missing transaction/transfer first if you know
                        it. If the historical cause cannot be reconstructed, explicitly
                        adjust the unexplained remainder.
                      </p>
                      <label>
                        Adjustment reason
                        <input
                          aria-label={`Adjustment reason for ${item.id}`}
                          value={reason[item.id] || ""}
                          onChange={(event) =>
                            setReason({ ...reason, [item.id]: event.target.value })
                          }
                          placeholder="Reason, e.g. incomplete opening balance"
                        />
                      </label>
                      <button type="button" onClick={() => void adjust(item.id)}>
                        Adjust remaining difference
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
