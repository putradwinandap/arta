import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import {
  confirmCapture,
  createCapture,
  listPendingCaptures,
  reviewCapture,
  type TransactionCapture,
  type TransactionKind,
  type Wallet,
} from './lib/api';
import { localDb, type LocalCapture } from './lib/db';

type Props = {
  householdId: string;
  wallets: Wallet[];
  onConfirmed: () => Promise<void>;
};

function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return 'Something went wrong. Please try again.';
  return error.message.replaceAll('_', ' ');
}

function formatMoney(amountMinor: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor);
}

export function QuickCaptureInbox({ householdId, wallets, onConfirmed }: Props) {
  const [captures, setCaptures] = useState<TransactionCapture[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [localPendingCount, setLocalPendingCount] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reviewWalletId, setReviewWalletId] = useState('');
  const [reviewKind, setReviewKind] = useState<TransactionKind>('expense');
  const [reviewAmount, setReviewAmount] = useState('');
  const [reviewNote, setReviewNote] = useState('');

  const walletById = useMemo(() => new Map(wallets.map((wallet) => [wallet.id, wallet])), [wallets]);

  const refreshInbox = useCallback(async () => {
    setCaptures(await listPendingCaptures(householdId));
  }, [householdId]);

  const refreshLocalPendingCount = useCallback(async () => {
    const count = await localDb.captures.where('householdId').equals(householdId).count();
    setLocalPendingCount(count);
  }, [householdId]);

  const syncLocalCaptures = useCallback(async () => {
    const localCaptures = await localDb.captures.where('householdId').equals(householdId).toArray();
    let syncedAny = false;
    for (const item of localCaptures) {
      try {
        await createCapture(householdId, {
          id: item.id,
          amountMinor: item.amountMinor,
          note: item.note,
          capturedAt: item.capturedAt,
        });
        await localDb.captures.delete(item.id);
        syncedAny = true;
      } catch {
        await localDb.captures.update(item.id, { syncStatus: 'failed' });
      }
    }
    await refreshLocalPendingCount();
    if (syncedAny) await refreshInbox();
  }, [householdId, refreshInbox, refreshLocalPendingCount]);

  useEffect(() => {
    void Promise.all([refreshInbox(), refreshLocalPendingCount()]).catch((err) => setError(errorMessage(err)));
    void syncLocalCaptures();

    function handleOnline() {
      void syncLocalCaptures();
    }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refreshInbox, refreshLocalPendingCount, syncLocalCaptures]);

  async function handleQuickCapture(event: FormEvent) {
    event.preventDefault();
    const amountMinor = Number(amount);
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
      setError('Amount must be a positive whole number.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    const localCapture: LocalCapture = {
      id: crypto.randomUUID(),
      householdId,
      amountMinor,
      note: note.trim(),
      capturedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };

    try {
      await localDb.captures.put(localCapture);
      try {
        await createCapture(householdId, localCapture);
        await localDb.captures.delete(localCapture.id);
        await refreshInbox();
        setMessage('Captured. You can classify it later.');
      } catch {
        await localDb.captures.update(localCapture.id, { syncStatus: 'failed' });
        setMessage('Saved on this device. Arta will retry when the server is reachable.');
      }
      await refreshLocalPendingCount();
      setAmount('');
      setNote('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function beginReview(item: TransactionCapture) {
    setEditingId(item.id);
    setReviewWalletId(item.walletId || wallets[0]?.id || '');
    setReviewKind(item.kind || 'expense');
    setReviewAmount(String(item.amountMinor));
    setReviewNote(item.note || '');
    setError('');
    setMessage('');
  }

  async function handleSaveReview(event: FormEvent, captureId: string) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await reviewCapture(householdId, captureId, {
        walletId: reviewWalletId,
        kind: reviewKind,
        amountMinor: Number(reviewAmount),
        note: reviewNote,
      });
      await refreshInbox();
      setEditingId(null);
      setMessage('Review saved. Ready to confirm.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(captureId: string) {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await confirmCapture(householdId, captureId);
      await Promise.all([refreshInbox(), onConfirmed()]);
      setEditingId(null);
      setMessage('Confirmed and added to the financial ledger.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="capture-section">
      <section className="quick-capture-card">
        <div>
          <p className="eyebrow">Quick capture</p>
          <h2>Capture now. Classify later.</h2>
          <p className="muted">Only the amount is required. Wallet and transaction type can wait.</p>
        </div>
        <form className="quick-capture-form" onSubmit={handleQuickCapture}>
          <label>
            Amount
            <input
              aria-label="Quick capture amount"
              inputMode="numeric"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="25000"
              required
            />
          </label>
          <label>
            Note <span className="optional">optional</span>
            <input
              aria-label="Quick capture note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Lunch"
              maxLength={240}
            />
          </label>
          <button type="submit" disabled={saving}>{saving ? 'Capturing…' : 'Capture'}</button>
        </form>
        {message && <p className="capture-message" role="status">{message}</p>}
        {error && <p className="alert" role="alert">{error}</p>}
        {localPendingCount > 0 && (
          <p className="offline-note">{localPendingCount} capture{localPendingCount === 1 ? '' : 's'} safely waiting on this device for server sync.</p>
        )}
      </section>

      <section className="panel inbox-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Transaction Inbox</p>
            <h2>{captures.length} pending review</h2>
          </div>
          <span className="summary-chip">Pending ≠ reporting</span>
        </div>
        <p className="muted">Pending captures do not affect wallet balances, income, expense, or future budget reporting until confirmed.</p>

        {captures.length === 0 ? (
          <div className="empty-state"><p>Inbox clear. Quick captures will wait here until you classify and confirm them.</p></div>
        ) : (
          <div className="inbox-list">
            {captures.map((item) => {
              const wallet = item.walletId ? walletById.get(item.walletId) : undefined;
              const ready = Boolean(item.walletId && item.kind);
              return (
                <article className="inbox-item" key={item.id}>
                  {editingId === item.id ? (
                    <form className="review-form" onSubmit={(event) => handleSaveReview(event, item.id)}>
                      <label>Type<select aria-label="Review transaction type" value={reviewKind} onChange={(event) => setReviewKind(event.target.value as TransactionKind)}><option value="expense">Expense</option><option value="income">Income</option></select></label>
                      <label>Wallet<select aria-label="Review wallet" value={reviewWalletId} onChange={(event) => setReviewWalletId(event.target.value)} required><option value="" disabled>Select wallet</option>{wallets.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select></label>
                      <label>Amount<input aria-label="Review amount" type="number" min="1" step="1" value={reviewAmount} onChange={(event) => setReviewAmount(event.target.value)} required /></label>
                      <label>Note<input aria-label="Review note" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} maxLength={240} /></label>
                      <div className="button-row"><button type="submit" disabled={saving}>Save review</button><button type="button" className="secondary" onClick={() => setEditingId(null)}>Cancel</button></div>
                    </form>
                  ) : (
                    <>
                      <div className="inbox-copy">
                        <strong>{formatMoney(item.amountMinor, wallet?.currency || 'IDR')}</strong>
                        <p>{item.note || 'No note'}</p>
                        <small>{ready ? `${item.kind} · ${wallet?.name}` : 'Needs classification'} · captured {new Date(item.capturedAt).toLocaleString()}</small>
                      </div>
                      <div className="wallet-actions">
                        <button type="button" className="secondary" onClick={() => beginReview(item)}>Review</button>
                        <button type="button" disabled={!ready || saving} onClick={() => handleConfirm(item.id)}>Confirm</button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
