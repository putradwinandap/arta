import { useEffect, useMemo, useState } from "react";
import {
  getFinanceOverview,
  getWallet,
  listWalletActivity,
  type Wallet,
  type WalletActivity,
} from "../lib/api";
import {
  formatMoney,
  walletTypes,
} from "../components/financial/workspace/useFinancialWorkspace";

function walletIdFromPath() {
  const match = window.location.pathname.match(/^\/wallets\/([^/]+)\/transactions$/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function WalletTransactionsPage() {
  const householdId = localStorage.getItem("arta.householdId") || "";
  const walletId = walletIdFromPath();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [activity, setActivity] = useState<WalletActivity[]>([]);
  const [balanceMinor, setBalanceMinor] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!householdId || !walletId) {
      setError("wallet_not_selected");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [nextWallet, nextActivity, overview] = await Promise.all([
        getWallet(householdId, walletId),
        listWalletActivity(householdId, walletId),
        getFinanceOverview(householdId),
      ]);
      setWallet(nextWallet);
      setActivity(nextActivity);
      setBalanceMinor(
        overview.balances.find((balance) => balance.walletId === walletId)
          ?.amountMinor ?? 0,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replaceAll("_", " ")
          : "Could not load wallet activity.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [householdId, walletId]);

  const walletType = useMemo(
    () =>
      walletTypes.find((item) => item.value === wallet?.type)?.label ?? wallet?.type,
    [wallet],
  );

  if (loading)
    return (
      <main className="app-shell">
        <section className="panel" role="status">
          Loading wallet transactions…
        </section>
      </main>
    );
  if (error)
    return (
      <main className="app-shell">
        <section className="panel">
          <p className="error" role="alert">
            Unable to load wallet transactions: {error}
          </p>
          <button type="button" onClick={() => void refresh()}>
            Retry
          </button>
        </section>
      </main>
    );
  if (!wallet)
    return (
      <main className="app-shell">
        <section className="panel">
          <p className="error" role="alert">
            Wallet not found.
          </p>
          <a href="/wallets">Back to wallets</a>
        </section>
      </main>
    );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <a href="/wallets">← Back to wallets</a>
          <p className="eyebrow">Wallet transactions</p>
          <h1>{wallet.name}</h1>
          <p className="muted">
            {walletType} · {wallet.currency}
          </p>
          <strong>{formatMoney(balanceMinor, wallet.currency)}</strong>
        </div>
        <button className="secondary" type="button" onClick={() => void refresh()}>
          Refresh
        </button>
      </header>
      {activity.length === 0 ? (
        <section className="panel empty-state">
          <h2>No activity yet</h2>
          <p>This wallet has no confirmed activity or linked pending captures.</p>
        </section>
      ) : (
        <section className="panel activity-panel">
          <div className="activity-list">
            {activity.map((item) => (
              <article className="activity-row" key={`${item.type}-${item.id}`}>
                <div>
                  <strong>
                    {item.type === "pending_capture"
                      ? "Pending capture"
                      : item.type === "transfer"
                        ? "Wallet transfer"
                        : item.type === "income"
                          ? "Income"
                          : "Expense"}
                  </strong>
                  <p className="muted">
                    {item.note || new Date(item.occurredAt).toLocaleString()}
                    {item.status === "pending" ? " · Needs review" : ""}
                  </p>
                </div>
                <strong>
                  {item.type === "expense" ? "-" : ""}
                  {formatMoney(item.amountMinor, item.currency)}
                </strong>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
