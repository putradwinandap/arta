import { WalletType } from "../../../lib/api";
import { formatMoney, walletTypes } from "../workspace/useFinancialWorkspace";
export function WalletSection(p: any) {
  return (
    <section className="layout-grid">
      <section className="panel">
        <p className="eyebrow">Wallets</p>
        <h2>Your money locations</h2>
        <div className="wallet-list">
          {[...p.activeWallets, ...p.archivedWallets].map((w: any) =>
            w.status === "active" && p.editingWalletId === w.id ? (
              <article className="wallet-card" key={w.id}>
                <form
                  className="edit-form"
                  onSubmit={(e: any) => p.handleUpdateWallet(e, w.id)}
                >
                  <label>
                    Wallet name
                    <input
                      value={p.editName}
                      onChange={(e: any) => p.setEditName(e.target.value)}
                      required
                      maxLength={120}
                    />
                  </label>
                  <label>
                    Type
                    <select
                      value={p.editType}
                      onChange={(e: any) => p.setEditType(e.target.value as WalletType)}
                    >
                      {walletTypes.map((x) => (
                        <option key={x.value} value={x.value}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button disabled={p.saving}>Save</button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => p.setEditingWalletId(null)}
                  >
                    Cancel
                  </button>
                </form>
              </article>
            ) : (
              <article
                className={`wallet-card ${w.status === "archived" ? "archived" : ""}`}
                key={w.id}
              >
                <span className="wallet-type">
                  {w.status === "archived"
                    ? "Archived"
                    : walletTypes.find((x) => x.value === w.type)?.label}
                </span>
                <h3>{w.name}</h3>
                <p className="wallet-balance">
                  {formatMoney(
                    p.balanceByWallet.get(w.id)?.amountMinor ?? 0,
                    w.currency,
                  )}
                </p>
                {w.status === "active" && (
                  <div className="wallet-actions">
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => p.beginEdit(w)}
                    >
                      Edit
                    </button>
                    <button
                      className="danger"
                      type="button"
                      onClick={() => p.handleArchive(w.id)}
                      disabled={p.saving}
                    >
                      Archive
                    </button>
                  </div>
                )}
              </article>
            ),
          )}
        </div>
      </section>
      <aside className="panel create-panel">
        <p className="eyebrow">Add wallet</p>
        <h2>Create a money location</h2>
        <form className="stack-form" onSubmit={p.handleCreateWallet}>
          <label>
            Wallet name
            <input
              value={p.walletName}
              onChange={(e: any) => p.setWalletName(e.target.value)}
              required
              maxLength={120}
            />
          </label>
          <label>
            Type
            <select
              value={p.walletType}
              onChange={(e: any) => p.setWalletType(e.target.value as WalletType)}
            >
              {walletTypes.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Currency
            <input
              value={p.currency}
              onChange={(e: any) => p.setCurrency(e.target.value.toUpperCase())}
              maxLength={3}
              required
            />
          </label>
          <button disabled={p.saving}>Add wallet</button>
        </form>
      </aside>
    </section>
  );
}
