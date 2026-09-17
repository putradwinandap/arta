import type { FormEvent } from "react";

type Props = {
  amount: string;
  note: string;
  saving: boolean;
  message: string;
  error: string;
  localPendingCount: number;
  onSubmit: (event: FormEvent) => void;
  onAmountChange: (value: string) => void;
  onNoteChange: (value: string) => void;
};

export function QuickCaptureForm({
  amount,
  note,
  saving,
  message,
  error,
  localPendingCount,
  onSubmit,
  onAmountChange,
  onNoteChange,
}: Props) {
  return (
    <section className="quick-capture-card">
      <div>
        <p className="eyebrow">Quick capture</p>
        <h2>Capture now. Classify later.</h2>
        <p className="muted">
          Only the amount is required. Wallet and transaction type can wait.
        </p>
      </div>
      <form className="quick-capture-form" onSubmit={onSubmit}>
        <label>
          Amount
          <input
            aria-label="Quick capture amount"
            inputMode="numeric"
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            placeholder="25000"
            required
          />
        </label>
        <label>
          Note <span className="optional">optional</span>
          <input
            aria-label="Quick capture note"
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Lunch"
            maxLength={240}
          />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? "Capturing…" : "Capture"}
        </button>
      </form>
      {message && (
        <p className="capture-message" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      {localPendingCount > 0 && (
        <p className="offline-note">
          {localPendingCount} capture{localPendingCount === 1 ? "" : "s"} safely waiting
          on this device for server sync.
        </p>
      )}
    </section>
  );
}
