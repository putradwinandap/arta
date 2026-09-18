import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getFinanceOverview,
  listPendingCaptures,
  listReconciliations,
  listWallets,
  type FinanceOverview,
  type Reconciliation,
  type TransactionCapture,
  type Wallet,
} from "../../lib/api";

export function useHouseholdOverview(householdId: string) {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [pending, setPending] = useState<TransactionCapture[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError("");
      const [overviewResult, walletsResult, pendingResult, reconciliationResult] =
        await Promise.allSettled([
          getFinanceOverview(householdId),
          listWallets(householdId),
          listPendingCaptures(householdId),
          listReconciliations(householdId),
        ]);
      if (overviewResult.status === "rejected") throw overviewResult.reason;
      if (walletsResult.status === "rejected") throw walletsResult.reason;
      setOverview(overviewResult.value);
      setWallets(walletsResult.value);
      setPending(
        pendingResult.status === "fulfilled"
          ? pendingResult.value.filter((capture) => capture.status === "pending")
          : [],
      );
      setReconciliations(
        reconciliationResult.status === "fulfilled" ? reconciliationResult.value : [],
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "overview_failed");
    }
  }, [householdId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const names = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet.name])),
    [wallets],
  );

  return { overview, wallets, pending, reconciliations, names, error, refresh };
}
