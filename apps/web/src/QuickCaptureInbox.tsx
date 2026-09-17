import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  confirmCapture,
  createCapture,
  listPendingCaptures,
  listBudgets,
  reviewCapture,
  type BudgetSummary,
  type TransactionCapture,
  type TransactionKind,
  type Wallet,
} from "./lib/api";
import { localDb, type LocalCapture } from "./lib/db";
import { formatMoney } from "./components/financial/shared/currency";
import {
  captureApiPayload,
  createCaptureId,
  errorMessage,
  withCaptureTimeout,
} from "./components/capture/captureFormatters";
import { useCaptureOutbox } from "./components/capture/useCaptureOutbox";
import { QuickCaptureForm } from "./components/capture/QuickCaptureForm";

type Props = {
  householdId: string;
  wallets: Wallet[];
  onConfirmed: () => Promise<void>;
};

export function QuickCaptureInbox({ householdId, wallets, onConfirmed }: Props) {
  const [captures, setCaptures] = useState<TransactionCapture[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reviewWalletId, setReviewWalletId] = useState("");
  const [reviewKind, setReviewKind] = useState<TransactionKind>("expense");
  const [reviewAmount, setReviewAmount] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewBudgetId, setReviewBudgetId] = useState("");
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);

  const walletById = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets],
  );

  const refreshInbox = useCallback(async () => {
    const [nextCaptures, nextBudgets] = await Promise.all([
      listPendingCaptures(householdId),
      listBudgets(householdId),
    ]);
    setCaptures(nextCaptures);
    setBudgets(nextBudgets);
  }, [householdId]);

  const { localPendingCount, refreshLocalPendingCount } = useCaptureOutbox(
    householdId,
    refreshInbox,
    (err) => setError(errorMessage(err)),
  );

  useEffect(() => {
    void refreshInbox().catch((err) => setError(errorMessage(err)));
  }, [refreshInbox]);

  async function handleQuickCapture(event: FormEvent) {
    event.preventDefault();
    const amountMinor = Number(amount);
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
      setError("Amount must be a positive whole number.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    const localCapture: LocalCapture = {
      id: createCaptureId(),
      householdId,
      amountMinor,
      note: note.trim(),
      capturedAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    try {
      if (!navigator.onLine) {
        console.info("[quick-capture] offline; indexeddb.put:start", {
          id: localCapture.id,
          householdId,
        });
        await withCaptureTimeout("indexeddb_put", localDb.captures.put(localCapture));
        console.info("[quick-capture] offline; indexeddb.put:complete", {
          id: localCapture.id,
        });
        await refreshLocalPendingCount();
        setMessage(
          "Saved on this device. Arta will retry when the server is reachable.",
        );
        setAmount("");
        setNote("");
        return;
      }
      try {
        console.info("[quick-capture] api.post:start", {
          id: localCapture.id,
          householdId,
        });
        await withCaptureTimeout(
          "api_post",
          createCapture(householdId, captureApiPayload(localCapture)),
        );
        console.info("[quick-capture] api.post:complete", { id: localCapture.id });
        void refreshInbox().catch((refreshError) =>
          setError(errorMessage(refreshError)),
        );
        setMessage("Captured. You can classify it later.");
      } catch (error) {
        console.error("[quick-capture] api.post:failed", error);
        console.info("[quick-capture] fallback indexeddb.put:start", {
          id: localCapture.id,
          householdId,
        });
        await withCaptureTimeout(
          "fallback_indexeddb_put",
          localDb.captures.put({ ...localCapture, syncStatus: "failed" }),
        );
        console.info("[quick-capture] fallback indexeddb.put:complete", {
          id: localCapture.id,
        });
        setMessage(
          "Saved on this device. Arta will retry when the server is reachable.",
        );
      }
      await refreshLocalPendingCount();
      setAmount("");
      setNote("");
    } catch (err) {
      console.error("[quick-capture] failed-before-api", err);
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function beginReview(item: TransactionCapture) {
    setEditingId(item.id);
    setReviewWalletId(item.walletId || wallets[0]?.id || "");
    setReviewKind(item.kind || "expense");
    setReviewAmount(String(item.amountMinor));
    setReviewNote(item.note || "");
    setReviewBudgetId("");
    setError("");
    setMessage("");
  }

  async function handleSaveReview(event: FormEvent, captureId: string) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await reviewCapture(householdId, captureId, {
        walletId: reviewWalletId,
        kind: reviewKind,
        amountMinor: Number(reviewAmount),
        note: reviewNote,
        ...(reviewKind === "expense" && reviewBudgetId
          ? { budgetId: reviewBudgetId }
          : {}),
      });
      void refreshInbox().catch((refreshError) => setError(errorMessage(refreshError)));
      setEditingId(null);
      setMessage("Review saved. Ready to confirm.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(captureId: string) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await confirmCapture(householdId, captureId);
      await Promise.all([refreshInbox(), onConfirmed()]);
      setEditingId(null);
      setMessage("Confirmed and added to the financial ledger.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="transactions" className="capture-section">
      <QuickCaptureForm
        amount={amount}
        note={note}
        saving={saving}
        message={message}
        error={error}
        localPendingCount={localPendingCount}
        onSubmit={handleQuickCapture}
        onAmountChange={setAmount}
        onNoteChange={setNote}
      />

      <section className="panel inbox-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Transaction Inbox</p>
            <h2>{captures.length} pending review</h2>
          </div>
          <span className="summary-chip">Pending ≠ reporting</span>
        </div>
        <p className="muted">
          Pending captures do not affect wallet balances, income, expense, or future
          budget reporting until confirmed.
        </p>

        {captures.length === 0 ? (
          <div className="empty-state">
            <p>
              Inbox clear. Quick captures will wait here until you classify and confirm
              them.
            </p>
          </div>
        ) : (
          <div className="inbox-list">
            {captures.map((item) => {
              const wallet = item.walletId ? walletById.get(item.walletId) : undefined;
              const ready = Boolean(item.walletId && item.kind);
              return (
                <article className="inbox-item" key={item.id}>
                  {editingId === item.id ? (
                    <form
                      className="review-form"
                      onSubmit={(event) => handleSaveReview(event, item.id)}
                    >
                      <label>
                        Type
                        <select
                          aria-label="Review transaction type"
                          value={reviewKind}
                          onChange={(event) =>
                            setReviewKind(event.target.value as TransactionKind)
                          }
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                      </label>
                      <label>
                        Wallet
                        <select
                          aria-label="Review wallet"
                          value={reviewWalletId}
                          onChange={(event) => setReviewWalletId(event.target.value)}
                          required
                        >
                          <option value="" disabled>
                            Select wallet
                          </option>
                          {wallets.map((entry) => (
                            <option value={entry.id} key={entry.id}>
                              {entry.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Amount
                        <input
                          aria-label="Review amount"
                          type="number"
                          min="1"
                          step="1"
                          value={reviewAmount}
                          onChange={(event) => setReviewAmount(event.target.value)}
                          required
                        />
                      </label>
                      {reviewKind === "expense" && (
                        <label>
                          Budget
                          <select
                            aria-label="Review budget"
                            value={reviewBudgetId}
                            onChange={(event) => setReviewBudgetId(event.target.value)}
                          >
                            <option value="">No budget</option>
                            {budgets
                              .filter(
                                (budget) =>
                                  budget.currency ===
                                  walletById.get(reviewWalletId)?.currency,
                              )
                              .map((budget) => (
                                <option value={budget.id} key={budget.id}>
                                  {budget.periodStart.slice(0, 10)} →{" "}
                                  {budget.periodEnd.slice(0, 10)} · {budget.currency}
                                </option>
                              ))}
                          </select>
                        </label>
                      )}
                      <label>
                        Note
                        <input
                          aria-label="Review note"
                          value={reviewNote}
                          onChange={(event) => setReviewNote(event.target.value)}
                          maxLength={240}
                        />
                      </label>
                      <div className="button-row">
                        <button type="submit" disabled={saving}>
                          Save review
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="inbox-copy">
                        <strong>
                          {formatMoney(item.amountMinor, wallet?.currency || "IDR")}
                        </strong>
                        <p>{item.note || "No note"}</p>
                        <small>
                          {ready
                            ? `${item.kind} · ${wallet?.name}`
                            : "Needs classification"}{" "}
                          · captured {new Date(item.capturedAt).toLocaleString()}
                        </small>
                      </div>
                      <div className="wallet-actions">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => beginReview(item)}
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          disabled={!ready || saving}
                          onClick={() => handleConfirm(item.id)}
                        >
                          Confirm
                        </button>
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
