import { useCallback, useEffect, useState } from "react";
import {
  adjustReconciliation,
  createReconciliation,
  getFinanceOverview,
  listReconciliations,
  listWallets,
  Reconciliation,
  Wallet,
  WalletBalance,
} from "../../lib/api";

export function useReconciliation(householdId: string) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [items, setItems] = useState<Reconciliation[]>([]);
  const [walletId, setWalletId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [walletResult, finance, reconciliationResult] = await Promise.all([
        listWallets(householdId),
        getFinanceOverview(householdId),
        listReconciliations(householdId),
      ]);
      const active = walletResult.filter((wallet) => wallet.status === "active");
      setWallets(active);
      setBalances(finance.balances);
      setItems(reconciliationResult);
      setWalletId((current) =>
        current && active.some((w) => w.id === current) ? current : active[0]?.id || "",
      );
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reconciliation.");
    } finally {
      setLoading(false);
    }
  }, [householdId]);
  useEffect(() => {
    void load();
  }, [load]);
  return {
    wallets,
    balances,
    items,
    walletId,
    setWalletId,
    error,
    setError,
    loading,
    load,
  };
}

export async function submitReconciliation(
  householdId: string,
  walletId: string,
  observed: string,
) {
  const amount = Math.round(Number(observed) * 100);
  if (!Number.isFinite(amount)) throw new Error("Enter a valid observed balance");
  return createReconciliation(householdId, walletId, { observedAmountMinor: amount });
}

export { adjustReconciliation };
