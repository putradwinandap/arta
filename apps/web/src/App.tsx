import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  archiveWallet,
  createHousehold,
  createWallet,
  getHousehold,
  listWallets,
  updateWallet,
  type Household,
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

export function App() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
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

  const activeWallets = useMemo(() => wallets.filter((wallet) => wallet.status === 'active'), [wallets]);
  const archivedWallets = useMemo(() => wallets.filter((wallet) => wallet.status === 'archived'), [wallets]);

  async function refreshWallets(householdId: string) {
    setWallets(await listWallets(householdId));
  }

  useEffect(() => {
    const householdId = localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
    if (!householdId) {
      setLoading(false);
      return;
    }

    Promise.all([getHousehold(householdId), listWallets(householdId)])
      .then(([storedHousehold, storedWallets]) => {
        setHousehold(storedHousehold);
        setWallets(storedWallets);
      })
      .catch(() => {
        localStorage.removeItem(HOUSEHOLD_STORAGE_KEY);
        setError('Saved household could not be reopened. Create or connect a household again.');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateHousehold(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await createHousehold(householdName, getOrCreateSubjectId());
      localStorage.setItem(HOUSEHOLD_STORAGE_KEY, created.id);
      setHousehold(created);
      setWallets([]);
      setHouseholdName('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateWallet(event: FormEvent) {
    event.preventDefault();
    if (!household) return;
    setSaving(true);
    setError('');
    try {
      await createWallet(household.id, { name: walletName, type: walletType, currency });
      await refreshWallets(household.id);
      setWalletName('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(wallet: Wallet) {
    setEditingWalletId(wallet.id);
    setEditName(wallet.name);
    setEditType(wallet.type);
  }

  async function handleUpdateWallet(event: FormEvent, walletId: string) {
    event.preventDefault();
    if (!household) return;
    setSaving(true);
    setError('');
    try {
      await updateWallet(household.id, walletId, { name: editName, type: editType });
      await refreshWallets(household.id);
      setEditingWalletId(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(walletId: string) {
    if (!household) return;
    setSaving(true);
    setError('');
    try {
      await archiveWallet(household.id, walletId);
      await refreshWallets(household.id);
      setEditingWalletId(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="center-state"><p>Opening Arta…</p></main>;
  }

  if (!household) {
    return (
      <main className="onboarding-shell">
        <section className="onboarding-card">
          <p className="eyebrow">Arta</p>
          <h1>Start your family finance space.</h1>
          <p className="muted">Create a household first. Wallets and daily finance workflows will live inside it.</p>
          {error && <p className="alert" role="alert">{error}</p>}
          <form onSubmit={handleCreateHousehold} className="stack-form">
            <label>
              Household name
              <input value={householdName} onChange={(event) => setHouseholdName(event.target.value)} placeholder="Keluarga Putra" maxLength={120} required />
            </label>
            <button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create household'}</button>
          </form>
          <p className="footnote">Development note: Arta currently uses a browser-local temporary subject identity until full login and authorization are implemented.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Arta household</p>
          <h1>{household.name}</h1>
          <p className="muted">Manage the places where your family keeps money.</p>
        </div>
        <div className="summary-chip">{activeWallets.length} active wallet{activeWallets.length === 1 ? '' : 's'}</div>
      </header>

      {error && <p className="alert" role="alert">{error}</p>}

      <section className="layout-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Wallets</p>
              <h2>Your money locations</h2>
            </div>
          </div>

          {wallets.length === 0 ? (
            <div className="empty-state">
              <h3>No wallets yet</h3>
              <p>Add cash, a bank account, or an e-wallet to start shaping your household finance view.</p>
            </div>
          ) : (
            <div className="wallet-list">
              {activeWallets.map((wallet) => (
                <article className="wallet-card" key={wallet.id}>
                  {editingWalletId === wallet.id ? (
                    <form className="edit-form" onSubmit={(event) => handleUpdateWallet(event, wallet.id)}>
                      <label>Wallet name<input value={editName} onChange={(event) => setEditName(event.target.value)} required maxLength={120} /></label>
                      <label>Type<select value={editType} onChange={(event) => setEditType(event.target.value as WalletType)}>{walletTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                      <div className="button-row"><button type="submit" disabled={saving}>Save</button><button type="button" className="secondary" onClick={() => setEditingWalletId(null)}>Cancel</button></div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <span className="wallet-type">{walletTypes.find((item) => item.value === wallet.type)?.label}</span>
                        <h3>{wallet.name}</h3>
                        <p className="muted">{wallet.currency}</p>
                      </div>
                      <div className="wallet-actions">
                        <button className="secondary" type="button" onClick={() => beginEdit(wallet)}>Edit</button>
                        <button className="danger" type="button" onClick={() => handleArchive(wallet.id)} disabled={saving}>Archive</button>
                      </div>
                    </>
                  )}
                </article>
              ))}

              {archivedWallets.length > 0 && (
                <div className="archived-section">
                  <h3>Archived</h3>
                  {archivedWallets.map((wallet) => (
                    <article className="wallet-card archived" key={wallet.id}>
                      <div><span className="wallet-type">Archived</span><h3>{wallet.name}</h3><p className="muted">{wallet.currency} · {wallet.type.replace('_', ' ')}</p></div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="panel create-panel">
          <p className="eyebrow">Add wallet</p>
          <h2>Create a money location</h2>
          <form className="stack-form" onSubmit={handleCreateWallet}>
            <label>Wallet name<input value={walletName} onChange={(event) => setWalletName(event.target.value)} placeholder="BCA Utama" maxLength={120} required /></label>
            <label>Type<select value={walletType} onChange={(event) => setWalletType(event.target.value as WalletType)}>{walletTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label>Currency<input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} maxLength={3} pattern="[A-Za-z]{3}" required /></label>
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add wallet'}</button>
          </form>
        </aside>
      </section>
    </main>
  );
}
