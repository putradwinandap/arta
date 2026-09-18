import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createBudget,
  listBudgets,
  updateBudgetRenewal,
  type BudgetSummary,
  type Wallet,
} from "../../lib/api";

function localDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function useBudgets(householdId: string, wallets: Wallet[], refreshKey: number) {
  const currencies = useMemo(
    () => [...new Set(wallets.map((wallet) => wallet.currency))],
    [wallets],
  );
  const today = new Date();
  const [items, setItems] = useState<BudgetSummary[]>([]);
  const [currency, setCurrency] = useState(currencies[0] ?? "IDR");
  const [periodStart, setPeriodStart] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`,
  );
  const [periodEnd, setPeriodEnd] = useState(
    localDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
  );
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError("");
      setItems(await listBudgets(householdId));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replaceAll("_", " ")
          : "Could not load budgets.",
      );
    }
  }, [householdId]);
  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);
  useEffect(() => {
    if (currencies.length && !currencies.includes(currency)) setCurrency(currencies[0]);
  }, [currencies, currency]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createBudget(householdId, {
        currency,
        periodStart,
        periodEnd,
        amountMinor: Number(amount),
        autoRenew,
        ...(autoRenew ? { cadence: "monthly" } : {}),
      });
      setAmount("");
      setAutoRenew(false);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replaceAll("_", " ")
          : "Could not create budget.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleRenewal(item: BudgetSummary) {
    setSaving(true);
    setError("");
    try {
      await updateBudgetRenewal(householdId, item.id, {
        autoRenew: !item.autoRenew,
        ...(item.autoRenew ? {} : { cadence: "monthly" }),
      });
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replaceAll("_", " ")
          : "Could not update auto-renew.",
      );
    } finally {
      setSaving(false);
    }
  }

  return {
    currencies,
    items,
    currency,
    setCurrency,
    periodStart,
    setPeriodStart,
    periodEnd,
    setPeriodEnd,
    amount,
    setAmount,
    error,
    saving,
    autoRenew,
    setAutoRenew,
    refresh,
    submit,
    toggleRenewal,
  };
}
