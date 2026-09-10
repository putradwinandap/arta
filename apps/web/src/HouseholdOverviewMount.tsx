import { useEffect, useMemo, useState } from 'react';
import { getFinanceOverview, listWallets, type FinanceOverview, type Wallet } from './lib/api';

const money = (value: number, currency: string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

export function HouseholdOverviewMount() {
  const [householdId, setHouseholdId] = useState(localStorage.getItem('arta.householdId') || '');
  useEffect(() => {
    const timer = setInterval(() => setHouseholdId(localStorage.getItem('arta.householdId') || ''), 500);
    return () => clearInterval(timer);
  }, []);
  if (!householdId) return null;
  return <HouseholdOverview householdId={householdId} />;
}

function HouseholdOverview({ householdId }: { householdId: string }) {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getFinanceOverview(householdId), listWallets(householdId)])
      .then(([nextOverview, nextWallets]) => {
        setOverview(nextOverview);
        setWallets(nextWallets);
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'overview_failed'));
  }, [householdId]);

  const names = useMemo(() => new Map(wallets.map((wallet) => [wallet.id, wallet.name])), [wallets]);
  if (error) return <section className="panel"><p className="error">{error}</p></section>;
  if (!overview) return <section className="panel"><p className="muted">Loading household overview…</p></section>;

  const budgets = overview.currentBudgets ?? [];
  const goals = overview.activeGoals ?? [];

  return <section className="panel overview-panel">
    <div className="section-heading"><div><p className="eyebrow">Household overview</p><h2>Your financial position</h2><p className="muted">Physical money, reserved goals, spendable funds, and current plans derived from trusted records.</p></div></div>
    {overview.balances.length === 0 ? <div className="empty-state"><p>Add a wallet to start your household overview.</p></div> : <div className="finance-summary">{overview.balances.map((balance) => <article className="summary-card" key={balance.walletId}><span>{names.get(balance.walletId) ?? 'Wallet'} · {balance.currency}</span><strong>{money(balance.amountMinor, balance.currency)}</strong><small>Reserved {money(balance.reservedMinor ?? 0, balance.currency)} · Available {money(balance.availableMinor ?? balance.amountMinor, balance.currency)}</small></article>)}</div>}
    <div className="layout-grid"><div><p className="eyebrow">Current budgets</p>{budgets.length === 0 ? <div className="empty-state"><p>No budget covers today.</p></div> : budgets.map((budget) => <article className="card" key={budget.id}><strong>{budget.currency} budget</strong><p>{money(budget.spentMinor, budget.currency)} spent of {money(budget.amountMinor, budget.currency)}</p><small>{money(budget.remainingMinor, budget.currency)} remaining</small></article>)}</div><div><p className="eyebrow">Active goals</p>{goals.length === 0 ? <div className="empty-state"><p>No active financial goals yet.</p></div> : goals.map((goal) => <article className="card" key={goal.id}><strong>{goal.name}</strong><p>{money(goal.reservedMinor, goal.currency)} reserved of {money(goal.targetAmountMinor, goal.currency)}</p><small>{money(goal.remainingMinor, goal.currency)} remaining</small></article>)}</div></div>
    <p className="footnote">Recent confirmed income, expenses, and transfers remain in the single Recent activity section below to avoid showing the same ledger event twice.</p>
  </section>;
}
