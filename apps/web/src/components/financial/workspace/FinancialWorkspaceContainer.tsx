import { useEffect } from "react";
import { HouseholdEntry } from "../../../HouseholdEntry";
import { QuickCaptureInbox } from "../../../QuickCaptureInbox";
import { HouseholdOverview } from "../../../HouseholdOverviewMount";
import { ActivityList, FinancialSummary } from "../summary";
import { FinancialHeader } from "./FinancialHeader";
import { useFinancialWorkspace } from "./useFinancialWorkspace";
import { WalletSection } from "../wallets/WalletSection";
import { TransactionForm } from "../transactions/TransactionForm";
import { TransferForm } from "../transactions/TransferForm";
export function FinancialWorkspace({
  view = "dashboard",
}: {
  view?: "dashboard" | "wallets" | "transactions";
}) {
  const w = useFinancialWorkspace();
  const title =
    view === "wallets"
      ? "Wallets"
      : view === "transactions"
        ? "Transactions & Inbox"
        : w.household?.name;
  useEffect(() => {
    document.body.dataset.page = view;
    return () => {
      delete document.body.dataset.page;
    };
  }, [view]);
  useEffect(() => {
    if (title) document.title = `${title} · Arta`;
  }, [title]);
  if (w.loading)
    return (
      <main className="center-state">
        <p>Opening Arta…</p>
      </main>
    );
  if (!w.household)
    return (
      <main className="onboarding-shell">
        <HouseholdEntry onActivated={w.activateHousehold} />
        {w.error && (
          <p className="alert" role="alert">
            {w.error}
          </p>
        )}
      </main>
    );
  if (view === "dashboard") return <HouseholdOverview householdId={w.household.id} />;
  return (
    <main className="app-shell">
      <FinancialHeader
        household={w.household}
        memberships={w.memberships}
        activeWalletCount={w.activeWallets.length}
        switching={w.switching}
        showManagement={w.showHouseholdManagement}
        onSwitch={(id) => void w.activateHousehold(id)}
        onToggleManagement={() => w.setShowHouseholdManagement((v) => !v)}
      />
      {w.error && (
        <p className="alert" role="alert">
          {w.error}
        </p>
      )}
      {w.showHouseholdManagement && (
        <HouseholdEntry embedded onActivated={w.activateHousehold} />
      )}
      <QuickCaptureInbox
        householdId={w.household.id}
        wallets={w.activeWallets}
        onConfirmed={() => w.refresh(w.household!.id)}
      />
      <FinancialSummary overview={w.overview} />
      <WalletSection {...w} />
      {w.activeWallets.length > 0 && (
        <section className="finance-grid">
          <TransactionForm {...w} />
          <TransferForm {...w} />
        </section>
      )}
      <ActivityList overview={w.overview} wallets={w.wallets} />
    </main>
  );
}
