import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createBudget, listBudgets, type BudgetSummary, type Wallet } from './lib/api';

type Props = { householdId: string; wallets: Wallet[]; refreshKey: number };

function formatMoney(amountMinor: number, currency: string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amountMinor);
}

function dateOnly(value: string) { return value.slice(0, 10); }

export function BudgetPanel({ householdId, wallets, refreshKey }: Props) {
  const currencies = useMemo(() => [...new Set(wallets.map((wallet) => wallet.currency))], [wallets]);
  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  const [items, setItems] = useState<BudgetSummary[]>([]);
  const [currency, setCurrency] = useState(currencies[0] ?? 'IDR');
  const [periodStart, setPeriodStart] = useState(monthStart);
  const [periodEnd, setPeriodEnd] = useState(monthEnd);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try { setItems(await listBudgets(householdId)); }
    catch (err) { setError(err instanceof Error ? err.message.replaceAll('_', ' ') : 'Could not load budgets.'); }
  }

  useEffect(() => { void refresh(); }, [householdId, refreshKey]);
  useEffect(() => { if (currencies.length && !currencies.includes(currency)) setCurrency(currencies[0]); }, [currencies, currency]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await createBudget(householdId, { currency, periodStart, periodEnd, amountMinor: Number(amount) });
      setAmount(''); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message.replaceAll('_', ' ') : 'Could not create budget.'); }
    finally { setSaving(false); }
  }

  return <section className="panel budget-panel">
    <div className="section-heading"><div><p className="eyebrow">Spending budget</p><h2>Plan a period, then track confirmed spending.</h2><p className="muted">Only confirmed expenses in the same currency and period count. Transfers and pending captures stay outside the budget.</p></div></div>
    {error && <p className="alert" role="alert">{error}</p>}
    <div className="budget-grid">
      <form className="stack-form" onSubmit={submit}>
        <label>Currency<select aria-label="Budget currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>{(currencies.length ? currencies : ['IDR']).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Period start<input aria-label="Budget period start" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} required /></label>
        <label>Period end<input aria-label="Budget period end" type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} required /></label>
        <label>Budget amount<input aria-label="Budget amount" type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
        <button disabled={saving}>{saving ? 'Creating…' : 'Create budget'}</button>
      </form>
      <div className="budget-list">{items.length === 0 ? <div className="empty-state"><p>No budgets yet.</p></div> : items.map((item) => {
        const ratio = item.amountMinor > 0 ? Math.min(100, Math.round((item.spentMinor / item.amountMinor) * 100)) : 0;
        return <article className="budget-card" key={item.id}><div className="section-heading"><div><strong>{dateOnly(item.periodStart)} → {dateOnly(item.periodEnd)}</strong><p className="muted">{item.currency}</p></div><strong>{ratio}%</strong></div><progress max={item.amountMinor} value={Math.min(item.spentMinor, item.amountMinor)} /><div className="budget-totals"><span>Spent <strong>{formatMoney(item.spentMinor, item.currency)}</strong></span><span>Remaining <strong>{formatMoney(item.remainingMinor, item.currency)}</strong></span><span>Limit <strong>{formatMoney(item.amountMinor, item.currency)}</strong></span></div></article>;
      })}</div>
    </div>
  </section>;
}
