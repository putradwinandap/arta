import type { FinanceOverview, Wallet } from "../../lib/api";
import { formatMoney } from "../financial/shared/currency";

export function OverviewSummary({
  overview,
  names,
}: {
  overview: FinanceOverview;
  names: Map<string, string>;
}) {
  if (overview.balances.length === 0)
    return (
      <section className="panel empty-state">
        <h2>Start your household overview</h2>
        <p>Add a wallet to see balances and begin recording financial activity.</p>
        <a className="button" href="/wallets">
          Add a wallet
        </a>
      </section>
    );
  return (
    <section className="finance-summary">
      {overview.balances.map((balance) => (
        <article className="summary-card" key={balance.walletId}>
          <span>
            {names.get(balance.walletId) ?? "Wallet"} · {balance.currency}
          </span>
          <strong>{formatMoney(balance.amountMinor, balance.currency)}</strong>
          <small>
            Physical · Reserved{" "}
            {formatMoney(balance.reservedMinor ?? 0, balance.currency)} · Available{" "}
            {formatMoney(
              balance.availableMinor ?? balance.amountMinor,
              balance.currency,
            )}
          </small>
        </article>
      ))}
    </section>
  );
}

export type OverviewWalletNames = Map<Wallet["id"], Wallet["name"]>;
