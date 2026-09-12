import { useEffect, useState } from 'react';
import { BudgetPanel } from './BudgetPanel';
import { listWallets, type Wallet } from './lib/api';

const HOUSEHOLD_STORAGE_KEY = 'arta.householdId';

export function BudgetMount() {
  const [householdId, setHouseholdId] = useState(() => localStorage.getItem(HOUSEHOLD_STORAGE_KEY) ?? '');
  const [wallets, setWallets] = useState<Wallet[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = localStorage.getItem(HOUSEHOLD_STORAGE_KEY) ?? '';
      setHouseholdId((current) => current === next ? current : next);
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!householdId) {
      setWallets([]);
      return;
    }
    void listWallets(householdId).then(setWallets).catch(() => setWallets([]));
  }, [householdId]);

  if (!householdId) return null;
  return <main className="app-shell budget-shell"><BudgetPanel householdId={householdId} wallets={wallets} refreshKey={0} /></main>;
}
