import { useState, type FormEvent } from "react";
import {
  archiveWallet,
  createTransaction,
  createTransfer,
  createWallet,
  getFinanceOverview,
  getHousehold,
  listBudgets,
  listMyHouseholds,
  listWallets,
  updateWallet,
  type Household,
  type HouseholdMembership,
  type Wallet,
  type WalletType,
  type TransactionKind,
} from "../../../lib/api";
import { HOUSEHOLD_STORAGE_KEY } from "./financialWorkspaceCache";

type Data = {
  household: Household | null;
  memberships: HouseholdMembership[];
  setMemberships: (value: HouseholdMembership[]) => void;
  setHousehold: (value: Household | null) => void;
  setWallets: (value: Wallet[]) => void;
  setOverview: (value: Awaited<ReturnType<typeof getFinanceOverview>>) => void;
  setBudgets: (value: Awaited<ReturnType<typeof listBudgets>>) => void;
  setError: (value: string) => void;
};
function message(error: unknown) {
  return error instanceof Error
    ? error.message.replaceAll("_", " ")
    : "Something went wrong. Please try again.";
}
export function useFinancialWorkspaceActions(data: Data) {
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  async function refresh(id: string) {
    const [wallets, overview, budgets] = await Promise.all([
      listWallets(id),
      getFinanceOverview(id),
      listBudgets(id),
    ]);
    data.setWallets(wallets);
    data.setOverview(overview);
    data.setBudgets(budgets);
  }
  async function activateHousehold(id: string) {
    setSwitching(true);
    try {
      const memberships = await listMyHouseholds();
      data.setMemberships(memberships);
      const selected = memberships.find((item) => item.id === id);
      if (!selected) throw new Error("household_membership_not_found");
      const [household, wallets, overview] = await Promise.all([
        getHousehold(id),
        listWallets(id),
        getFinanceOverview(id),
      ]);
      localStorage.setItem(HOUSEHOLD_STORAGE_KEY, id);
      localStorage.setItem("arta.activeHouseholdName", household.name);
      data.setHousehold(household);
      data.setWallets(wallets);
      data.setOverview(overview);
    } catch (error) {
      data.setError(message(error));
    } finally {
      setSwitching(false);
    }
  }
  async function run(operation: () => Promise<void>, after?: () => void) {
    data.setError("");
    try {
      await operation();
      after?.();
    } catch (error) {
      data.setError(message(error));
    }
  }
  return {
    saving,
    setSaving,
    switching,
    refresh,
    activateHousehold,
    run,
    createWallet: (
      event: FormEvent,
      name: string,
      type: WalletType,
      currency: string,
    ) => {
      event.preventDefault();
      if (data.household)
        void run(async () => {
          await createWallet(data.household!.id, { name, type, currency });
          await refresh(data.household!.id);
        });
    },
    updateWallet: (event: FormEvent, id: string, name: string, type: WalletType) => {
      event.preventDefault();
      if (data.household)
        void run(async () => {
          await updateWallet(data.household!.id, id, { name, type });
          await refresh(data.household!.id);
        });
    },
    archiveWallet: (id: string) => {
      if (data.household)
        void run(async () => {
          await archiveWallet(data.household!.id, id);
          await refresh(data.household!.id);
        });
    },
    createTransaction: (
      event: FormEvent,
      walletId: string,
      kind: TransactionKind,
      amountMinor: number,
      note: string,
      budgetId?: string,
    ) => {
      event.preventDefault();
      if (data.household)
        void run(async () => {
          await createTransaction(data.household!.id, {
            walletId,
            kind,
            amountMinor,
            note,
            ...(kind === "expense" && budgetId ? { budgetId } : {}),
          });
          await refresh(data.household!.id);
        });
    },
    createTransfer: (
      event: FormEvent,
      sourceWalletId: string,
      destinationWalletId: string,
      amountMinor: number,
      note: string,
    ) => {
      event.preventDefault();
      if (data.household)
        void run(async () => {
          await createTransfer(data.household!.id, {
            sourceWalletId,
            destinationWalletId,
            amountMinor,
            note,
          });
          await refresh(data.household!.id);
        });
    },
  };
}
