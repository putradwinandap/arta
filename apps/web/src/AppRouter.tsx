import { useEffect, useState } from "react";
import { DashboardPage, TransactionsPage, WalletsPage } from "./App";
import { BudgetMount } from "./BudgetMount";
import { GoalMount } from "./GoalMount";
import { ReconciliationMount } from "./ReconciliationMount";
import { BackupRestoreMount } from "./BackupRestoreMount";
import { WalletTransactionsPage } from "./pages/WalletTransactionsPage";

function routeFor(pathname: string) {
  if (/^\/wallets\/[^/]+\/transactions$/.test(pathname)) return "wallet-transactions";
  if (pathname === "/transactions") return "transactions";
  if (pathname === "/wallets" || pathname === "/wallet") return "wallets";
  if (pathname === "/budgets") return "budgets";
  if (pathname === "/goals") return "goals";
  if (pathname === "/reconciliation") return "reconciliation";
  if (pathname === "/family" || pathname === "/settings") return "family";
  return "dashboard";
}

export function AppRouter() {
  const [route, setRoute] = useState(() => routeFor(window.location.pathname));
  useEffect(() => {
    const handlePopState = () => setRoute(routeFor(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  if (route === "budgets") return <BudgetMount />;
  if (route === "goals") return <GoalMount />;
  if (route === "reconciliation") return <ReconciliationMount />;
  if (route === "family") return <BackupRestoreMount />;
  if (route === "wallets") return <WalletsPage />;
  if (route === "wallet-transactions") return <WalletTransactionsPage />;
  if (route === "transactions") return <TransactionsPage />;
  return <DashboardPage />;
}
