package finance

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/putradwinandap/arta/server/internal/capture"
	"github.com/putradwinandap/arta/server/internal/ledger"
	"github.com/putradwinandap/arta/server/internal/wallet"
)

func (s *Service) CreateCapture(ctx context.Context, id, householdID uuid.UUID, amountMinor int64, note string, capturedAt time.Time) (capture.Capture, error) {
	if _, err := s.GetHousehold(ctx, householdID); err != nil {
		return capture.Capture{}, err
	}
	created, err := capture.New(id, householdID, amountMinor, note, capturedAt)
	if err != nil {
		return capture.Capture{}, err
	}

	row := s.pool.QueryRow(ctx, `
INSERT INTO transaction_captures (id, household_id, amount_minor, note, source, status, captured_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
ON CONFLICT (id) DO UPDATE SET id = transaction_captures.id
RETURNING id, household_id, wallet_id, kind, amount_minor, note, source, status, captured_at, updated_at, confirmed_at, confirmed_transaction_id`, created.ID, created.HouseholdID, created.AmountMinor, created.Note, created.Source, created.Status, created.CapturedAt)
	persisted, err := scanCapture(row)
	if err != nil {
		return capture.Capture{}, err
	}
	if persisted.HouseholdID != householdID {
		return capture.Capture{}, capture.ErrInvalidHousehold
	}
	return persisted, nil
}

func (s *Service) ListPendingCaptures(ctx context.Context, householdID uuid.UUID) ([]capture.Capture, error) {
	rows, err := s.pool.Query(ctx, `
SELECT id, household_id, wallet_id, kind, amount_minor, note, source, status, captured_at, updated_at, confirmed_at, confirmed_transaction_id
FROM transaction_captures
WHERE household_id = $1 AND status = 'pending'
ORDER BY captured_at DESC, id DESC`, householdID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]capture.Capture, 0)
	for rows.Next() {
		item, err := scanCapture(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) ReviewCapture(ctx context.Context, householdID, captureID, walletID uuid.UUID, kind ledger.Kind, amountMinor int64, note string) (capture.Capture, error) {
	item, err := s.getCapture(ctx, householdID, captureID)
	if err != nil {
		return capture.Capture{}, err
	}
	w, err := s.GetWallet(ctx, householdID, walletID)
	if err != nil {
		return capture.Capture{}, err
	}
	if w.Status == wallet.StatusArchived {
		return capture.Capture{}, ledger.ErrArchivedWallet
	}
	if err := item.Review(walletID, kind, amountMinor, note, s.now()); err != nil {
		return capture.Capture{}, err
	}

	row := s.pool.QueryRow(ctx, `
UPDATE transaction_captures
SET wallet_id=$1, kind=$2, amount_minor=$3, note=$4, updated_at=$5
WHERE id=$6 AND household_id=$7 AND status='pending'
RETURNING id, household_id, wallet_id, kind, amount_minor, note, source, status, captured_at, updated_at, confirmed_at, confirmed_transaction_id`, walletID, kind, amountMinor, item.Note, item.UpdatedAt, captureID, householdID)
	return scanCapture(row)
}

func (s *Service) ConfirmCapture(ctx context.Context, householdID, captureID uuid.UUID) (ledger.Transaction, error) {
	dbtx, err := s.pool.Begin(ctx)
	if err != nil {
		return ledger.Transaction{}, err
	}
	defer dbtx.Rollback(ctx)

	item, err := scanCapture(dbtx.QueryRow(ctx, `
SELECT id, household_id, wallet_id, kind, amount_minor, note, source, status, captured_at, updated_at, confirmed_at, confirmed_transaction_id
FROM transaction_captures
WHERE id=$1 AND household_id=$2
FOR UPDATE`, captureID, householdID))
	if err != nil {
		return ledger.Transaction{}, err
	}

	if item.Status == capture.StatusConfirmed && item.ConfirmedTransactionID != nil {
		var existing ledger.Transaction
		err := dbtx.QueryRow(ctx, `SELECT id, household_id, wallet_id, kind, amount_minor, currency, occurred_at, note FROM transactions WHERE id=$1`, *item.ConfirmedTransactionID).Scan(
			&existing.ID, &existing.HouseholdID, &existing.WalletID, &existing.Kind, &existing.AmountMinor, &existing.Currency, &existing.OccurredAt, &existing.Note,
		)
		if err != nil {
			return ledger.Transaction{}, err
		}
		if err := dbtx.Commit(ctx); err != nil {
			return ledger.Transaction{}, err
		}
		return existing, nil
	}

	if err := item.ReadyToConfirm(); err != nil {
		return ledger.Transaction{}, err
	}
	if item.WalletID == nil || item.Kind == nil {
		return ledger.Transaction{}, capture.ErrIncompleteCapture
	}

	var walletCurrency string
	var walletStatus wallet.Status
	if err := dbtx.QueryRow(ctx, `SELECT currency, status FROM wallets WHERE id=$1 AND household_id=$2`, *item.WalletID, householdID).Scan(&walletCurrency, &walletStatus); err != nil {
		return ledger.Transaction{}, err
	}
	if walletStatus == wallet.StatusArchived {
		return ledger.Transaction{}, ledger.ErrArchivedWallet
	}

	confirmed, err := ledger.NewTransaction(householdID, *item.WalletID, *item.Kind, item.AmountMinor, walletCurrency, item.CapturedAt, item.Note)
	if err != nil {
		return ledger.Transaction{}, err
	}
	if _, err := dbtx.Exec(ctx, `INSERT INTO transactions (id, household_id, wallet_id, kind, amount_minor, currency, occurred_at, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, confirmed.ID, confirmed.HouseholdID, confirmed.WalletID, confirmed.Kind, confirmed.AmountMinor, confirmed.Currency, confirmed.OccurredAt, confirmed.Note); err != nil {
		return ledger.Transaction{}, err
	}
	confirmedAt := s.now().UTC()
	if _, err := dbtx.Exec(ctx, `UPDATE transaction_captures SET status='confirmed', confirmed_at=$1, confirmed_transaction_id=$2, updated_at=$1 WHERE id=$3 AND household_id=$4`, confirmedAt, confirmed.ID, captureID, householdID); err != nil {
		return ledger.Transaction{}, err
	}
	if err := dbtx.Commit(ctx); err != nil {
		return ledger.Transaction{}, err
	}
	return confirmed, nil
}

func (s *Service) getCapture(ctx context.Context, householdID, captureID uuid.UUID) (capture.Capture, error) {
	return scanCapture(s.pool.QueryRow(ctx, `
SELECT id, household_id, wallet_id, kind, amount_minor, note, source, status, captured_at, updated_at, confirmed_at, confirmed_transaction_id
FROM transaction_captures
WHERE id=$1 AND household_id=$2`, captureID, householdID))
}

func IsCaptureInputError(err error) bool {
	return errors.Is(err, capture.ErrInvalidCaptureID) || errors.Is(err, capture.ErrInvalidHousehold) || errors.Is(err, capture.ErrInvalidAmount) || errors.Is(err, capture.ErrAlreadyConfirmed) || errors.Is(err, capture.ErrIncompleteCapture)
}

func scanCapture(row rowScanner) (capture.Capture, error) {
	var item capture.Capture
	var walletID *uuid.UUID
	var kind *string
	var source string
	var status string
	if err := row.Scan(&item.ID, &item.HouseholdID, &walletID, &kind, &item.AmountMinor, &item.Note, &source, &status, &item.CapturedAt, &item.UpdatedAt, &item.ConfirmedAt, &item.ConfirmedTransactionID); err != nil {
		return capture.Capture{}, err
	}
	item.WalletID = walletID
	if kind != nil {
		parsed := ledger.Kind(*kind)
		item.Kind = &parsed
	}
	item.Source = capture.Source(source)
	item.Status = capture.Status(status)
	return item, nil
}

var _ = pgx.ErrNoRows
