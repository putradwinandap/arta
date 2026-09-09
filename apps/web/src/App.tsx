import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  archiveWallet,
  createHousehold,
  createTransaction,
  createTransfer,
  createWallet,
  getFinanceOverview,
  getHousehold,
  listWallets,
  updateWallet,
  type FinanceOverview,
  type Household,
  type TransactionKind,
  type Wallet,
  type WalletType,
} from './lib/api';

const HOUSEHOLD_STORAGE_KEY = 'arta.householdId';
const SUBJECT_STORAGE_KEY = 'arta.subjectId';
const walletTypes: Array<{ value: WalletType; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'e_wallet', label: 'E-Wallet' },
  { value: 'other', label: 'Other' },
];

function getOrCreateSubjectId() {
  const existing = localStorage.getItem(SUBJECT_STORAGE_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(SUBJECT_STORAGE_KEY, created);
  return created;
}

function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return 'Something went wrong. Please try again.';
  return error.message.replaceAll('_', ' ');
}

function formatMoney(amountMinor: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amountMinor);
}

export function App() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [overview, setOverview] = useState<FinanceOverview>({ balances: [], totals: { incomeMinor: 0, expenseMinor: 0 }, activity: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('cash');
  const [currency, setCurrency] = useState('IDR');
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<WalletType>('cash');
  const [transactionKind, setTransactionKind] = useState<TransactionKind>('expense');
  const [transactionWalletId, setTransactionWalletId] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionNote, setTransactionNote] = useState('');
  const [transferSourceId, setTransferSourceId] = useState('');
  const [transferDestinationId, setTransferDestinationId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  const activeWallets = useMemo(() => wallets.filter((wallet) => wallet.status === 'active'), [wallets]);
  const archivedWallets = useMemo(() => wallets.filter((wallet) => wallet.status === 'archived'), [wallets]);
  const walletById = useMemo(() => new Map(wallets.map((wallet) => [wallet.id, wallet])), [wallets]);
  const balanceByWallet = useMemo(() => new Map(overview.balances.map((balance) => [balance.walletId, balance])), [overview]);

  async function refresh(householdId: string) {
    const [nextWallets, nextOverview] = await Promise.all([listWallets(householdId), getFinanceOverview(householdId)]);
    setWallets(nextWallets);
    setOverview(nextOverview);
  }

  useEffect(() => {
    const householdId = localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
    if (!householdId) {
      setLoading(false);
      return;
    }
    Promise.all([getHousehold(householdId), listWallets(householdId), getFinanceOverview(householdId)])
      .then(([storedHousehold, storedWallets, storedOverview]) => {
        setHousehold(storedHousehold);
        setWallets(storedWallets);
        setOverview(storedOverview);
      })
      .catch(() => {
        localStorage.removeItem(HOUSEHOLD_STORAGE_KEY);
        setError('Saved household could not be reopened. Create or connect a household again.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeWallets.length === 0) return;
    if (!transactionWalletId) setTransactionWalletId(activeWallets[0].id);
    if (!transferSourceId) setTransferSourceId(activeWallets[0].id);
    if (!transferDestinationId && activeWallets.length > 1) setTransferDestinationId(activeWallets[1].id);
  }, [activeWallets, transactionWalletId, transferDestinationId, transferSourceId]);

  async function handleCreateHousehold(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const created = await createHousehold(householdName, getOrCreateSubjectId());
      localStorage.setItem(HOUSEHOLD_STORAGE_KEY, created.id);
      setHousehold(created); setWallets([]); setHouseholdName('');
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }

  async function handleCreateWallet(event: FormEvent) {
    event.preventDefault(); if (!household) return; setSaving(true); setError('');
    try {
      await createWallet(household.id, { name: walletName, type: walletType, currency });
      await refresh(household.id); setWalletName('');
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }

  function beginEdit(wallet: Wallet) { setEditingWalletId(wallet.id); setEditName(wallet.name); setEditType(wallet.type); }

  async function handleUpdateWallet(event: FormEvent, walletId: string) {
    event.preventDefault(); if (!household) return; setSaving(true); setError('');
    try {
      await updateWallet(household.id, walletId, { name: editName, type: editType });
      await refresh(household.id); setEditingWalletId(null);
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }

  async function handleArchive(walletId: string) {
    if (!household) return; setSaving(true); setError('');
    try { await archiveWallet(household.id, walletId); await refresh(household.id); setEditingWalletId(null); }
    catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }

  async function handleTransaction(event: FormEvent) {
    event.preventDefault(); if (!household) return; setSaving(true); setError('');
    try {
      await createTransaction(household.id, { walletId: transactionWalletId, kind: transactionKind, amountMinor: Number(transactionAmount), note: transactionNote });
      await refresh(household.id); setTransactionAmount(''); setTransactionNote('');
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }

  async function handleTransfer(event: FormEvent) {
    event.preventDefault(); if (!household) return; setSaving(true); setError('');
    try {
      await createTransfer(household.id, { sourceWalletId: transferSourceId, destinationWalletId: transferDestinationId, amountMinor: Number(transferAmount), note: transferNote });
      await refresh(household.id); setTransferAmount(''); setTransferNote('');
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }

  if (loading) return <main className="center-state"><p>Opening Arta…</p></main>;

  if (!household) {
    return <main className="onboarding-shell"><section className="onboarding-card">
      <p className="eyebrow">Arta</p><h1>Start your family finance space.</h1>
      <p className="muted">Create a household first. Wallets and daily finance workflows will live inside it.</p>
      {error && <p className="alert" role="alert">{error}</p>}
      <form onSubmit={handleCreateHousehold} className="stack-form"><label>Household name<input value={householdName} onChange={(event) => setHouseholdName(event.target.value)} placeholder="Keluarga Putra" maxLength={120} required /></label><button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create household'}</button></form>
      <p className="footnote">Development note: Arta currently uses a browser-local temporary subject identity until full login and authorization are implemented.</p>
    </section></main>;
  }

  return <main className="app-shell">
    <header className="topbar"><div><p className="eyebrow">Arta household</p><h1>{household.name}</h1><p className="muted">Wallets, income, expenses, and transfers in one trustworthy ledger.</p></div><div className="summary-chip">{activeWallets.length} active wallet{activeWallets.length === 1 ? '' : 's'}</div></header>
    {error && <p className="alert" role="alert">{error}</p>}

    <section className="finance-summary">
      <article className="summary-card"><span>Income</span><strong>{formatMoney(overview.totals.incomeMinor)}</strong></article>
      <article className="summary-card"><span>Expense</span><strong>{formatMoney(overview.totals.expenseMinor)}</strong></article>
      <article className="summary-card"><span>Net</span><strong>{formatMoney(overview.totals.incomeMinor - overview.totals.expenseMinor)}</strong><small>Transfers excluded</small></article>
    </section>

    <section className="layout-grid">
      <section className="panel"><div className="section-heading"><div><p className="eyebrow">Wallets</p><h2>Your money locations</h2></div></div>
        {wallets.length === 0 ? <div className="empty-state"><h3>No wallets yet</h3><p>Add at least one wallet before recording financial activity.</p></div> : <div className="wallet-list">
          {activeWallets.map((wallet) => <article className="wallet-card" key={wallet.id}>
            {editingWalletId === wallet.id ? <form className="edit-form" onSubmit={(event) => handleUpdateWallet(event, wallet.id)}><label>Wallet name<input value={editName} onChange={(event) => setEditName(event.target.value)} required maxLength={120} /></label><label>Type<select value={editType} onChange={(event) => setEditType(event.target.value as WalletType)}>{walletTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><div className="button-row"><button type="submit" disabled={saving}>Save</button><button type="button" className="secondary" onClick={() => setEditingWalletId(null)}>Cancel</button></div></form> : <><div><span className="wallet-type">{walletTypes.find((item) => item.value === wallet.type)?.label}</span><h3>{wallet.name}</h3><p className="wallet-balance">{formatMoney(balanceByWallet.get(wallet.id)?.amountMinor ?? 0, wallet.currency)}</p></div><div className="wallet-actions"><button className="secondary" type="button" onClick={() => beginEdit(wallet)}>Edit</button><button className="danger" type="button" onClick={() => handleArchive(wallet.id)} disabled={saving}>Archive</button></div></>}
          </article>)}
          {archivedWallets.length > 0 && <div className="archived-section"><h3>Archived</h3>{archivedWallets.map((wallet) => <article className="wallet-card archived" key={wallet.id}><div><span className="wallet-type">Archived</span><h3>{wallet.name}</h3><p className="muted">{formatMoney(balanceByWallet.get(wallet.id)?.amountMinor ?? 0, wallet.currency)} · read only</p></div></article>)}</div>}
        </div>}
      </section>
      <aside className="panel create-panel"><p className="eyebrow">Add wallet</p><h2>Create a money location</h2><form className="stack-form" onSubmit={handleCreateWallet}><label>Wallet name<input value={walletName} onChange={(event) => setWalletName(event.target.value)} placeholder="BCA Utama" maxLength={120} required /></label><label>Type<select value={walletType} onChange={(event) => setWalletType(event.target.value as WalletType)}>{walletTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Currency<input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} maxLength={3} pattern="[A-Za-z]{3}" required /></label><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add wallet'}</button></form></aside>
    </section>

    {activeWallets.length > 0 && <section className="finance-grid">
      <section className="panel transaction-panel"><p className="eyebrow">Record money</p><h2>Income or expense</h2><form className="stack-form" onSubmit={handleTransaction}><label>Type<select aria-label="Transaction type" value={transactionKind} onChange={(event) => setTransactionKind(event.target.value as TransactionKind)}><option value="expense">Expense</option><option value="income">Income</option></select></label><label>Wallet<select aria-label="Transaction wallet" value={transactionWalletId} onChange={(event) => setTransactionWalletId(event.target.value)}>{activeWallets.map((wallet) => <option value={wallet.id} key={wallet.id}>{wallet.name}</option>)}</select></label><label>Amount<input aria-label="Transaction amount" type="number" min="1" step="1" value={transactionAmount} onChange={(event) => setTransactionAmount(event.target.value)} required /></label><label>Note<input aria-label="Transaction note" value={transactionNote} onChange={(event) => setTransactionNote(event.target.value)} placeholder="Groceries" /></label><button disabled={saving}>Record {transactionKind}</button></form></section>
      <section className="panel transfer-panel"><p className="eyebrow">Move money</p><h2>Wallet transfer</h2>{activeWallets.length < 2 ? <div className="empty-state"><p>Add another active wallet to transfer money.</p></div> : <form className="stack-form" onSubmit={handleTransfer}><label>From<select aria-label="Transfer source" value={transferSourceId} onChange={(event) => setTransferSourceId(event.target.value)}>{activeWallets.map((wallet) => <option value={wallet.id} key={wallet.id}>{wallet.name}</option>)}</select></label><label>To<select aria-label="Transfer destination" value={transferDestinationId} onChange={(event) => setTransferDestinationId(event.target.value)}>{activeWallets.map((wallet) => <option value={wallet.id} key={wallet.id}>{wallet.name}</option>)}</select></label><label>Amount<input aria-label="Transfer amount" type="number" min="1" step="1" value={transferAmount} onChange={(event) => setTransferAmount(event.target.value)} required /></label><label>Note<input aria-label="Transfer note" value={transferNote} onChange={(event) => setTransferNote(event.target.value)} placeholder="Move to savings" /></label><button disabled={saving}>Transfer money</button></form>}</section>
    </section>}

    <section className="panel activity-panel"><p className="eyebrow">History</p><h2>Recent activity</h2>{overview.activity.length === 0 ? <div className="empty-state"><p>No financial activity yet.</p></div> : <div className="activity-list">{overview.activity.map((item) => {
      const wallet = item.walletId ? walletById.get(item.walletId) : undefined;
      const source = item.sourceWalletId ? walletById.get(item.sourceWalletId) : undefined;
      const destination = item.destinationWalletId ? walletById.get(item.destinationWalletId) : undefined;
      const title = item.type === 'transfer' ? `${source?.name ?? 'Wallet'} → ${destination?.name ?? 'Wallet'}` : `${item.type === 'income' ? 'Income' : 'Expense'} · ${wallet?.name ?? 'Wallet'}`;
      return <article className="activity-row" key={item.id}><div><strong>{title}</strong><p className="muted">{item.note || new Date(item.occurredAt).toLocaleString()}</p></div><strong>{item.type === 'expense' ? '-' : item.type === 'income' ? '+' : ''}{formatMoney(item.amountMinor, item.currency)}</strong></article>;
    })}</div>}</section>
  </main>;
}
