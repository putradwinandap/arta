import { useEffect, useMemo, useState } from "react";
import {
  getFinanceOverview,
  getHousehold,
  listMyHouseholds,
  listWallets,
  type BudgetSummary,
  type FinanceOverview,
  type Household,
  type HouseholdMembership,
  type Wallet,
} from "../../../lib/api";
import {
  HOUSEHOLD_STORAGE_KEY,
  readSnapshot,
  saveSnapshot,
} from "./financialWorkspaceCache";

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message.replaceAll("_", " ")
    : "Something went wrong. Please try again.";
}

export function useFinancialWorkspaceData() {
  const [memberships, setMemberships] = useState<HouseholdMembership[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [overview, setOverview] = useState<FinanceOverview>({
    balances: [],
    totals: { incomeMinor: 0, expenseMinor: 0 },
    activity: [],
  });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [online, setOnline] = useState(() => navigator.onLine);
  const activeWallets = useMemo(
    () => wallets.filter((wallet) => wallet.status === "active"),
    [wallets],
  );
  const archivedWallets = useMemo(
    () => wallets.filter((wallet) => wallet.status === "archived"),
    [wallets],
  );
  const balanceByWallet = useMemo(
    () => new Map(overview.balances.map((balance) => [balance.walletId, balance])),
    [overview],
  );
  useEffect(() => {
    listMyHouseholds()
      .then(async (nextMemberships) => {
        setMemberships(nextMemberships);
        if (!nextMemberships.length) {
          localStorage.removeItem(HOUSEHOLD_STORAGE_KEY);
          return;
        }
        const savedId = localStorage.getItem(HOUSEHOLD_STORAGE_KEY),
          selected =
            nextMemberships.find((item) => item.id === savedId) ?? nextMemberships[0];
        const [nextHousehold, nextWallets, nextOverview] = await Promise.all([
          getHousehold(selected.id),
          listWallets(selected.id),
          getFinanceOverview(selected.id),
        ]);
        localStorage.setItem(HOUSEHOLD_STORAGE_KEY, selected.id);
        localStorage.setItem("arta.activeHouseholdName", nextHousehold.name);
        setHousehold(nextHousehold);
        setWallets(nextWallets);
        setOverview(nextOverview);
        saveSnapshot({
          userId: localStorage.getItem("arta.activeUserId") || "",
          memberships: nextMemberships,
          household: nextHousehold,
          wallets: nextWallets,
          overview: nextOverview,
        });
      })
      .catch((cause) => {
        const snapshot = !(
          cause instanceof Error && /^(http_4|unauthenticated)/.test(cause.message)
        )
          ? readSnapshot()
          : null;
        if (snapshot) {
          setMemberships(snapshot.memberships);
          setHousehold(snapshot.household);
          setWallets(snapshot.wallets);
          setOverview(snapshot.overview);
          setError(
            `Offline mode. Showing data saved ${new Date(snapshot.savedAt).toLocaleString()}.`,
          );
          return;
        }
        setError(errorMessage(cause));
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const onlineHandler = () => setOnline(true),
      offlineHandler = () => setOnline(false);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);
  useEffect(() => {
    document.body.dataset.connection = online ? "online" : "offline";
    return () => {
      delete document.body.dataset.connection;
    };
  }, [online]);
  return {
    memberships,
    setMemberships,
    household,
    setHousehold,
    wallets,
    setWallets,
    budgets,
    setBudgets,
    overview,
    setOverview,
    loading,
    error,
    setError,
    online,
    activeWallets,
    archivedWallets,
    balanceByWallet,
  };
}
