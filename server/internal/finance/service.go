package finance

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/putradwinandap/arta/server/internal/household"
	"github.com/putradwinandap/arta/server/internal/ledger"
	"github.com/putradwinandap/arta/server/internal/wallet"
)

type Service struct {
	pool *pgxpool.Pool
	now  func() time.Time
}

type WalletBalance struct {
	WalletID       uuid.UUID `json:"walletId"`
	AmountMinor    int64     `json:"amountMinor"`
	ReservedMinor  int64     `json:"reservedMinor"`
	AvailableMinor int64     `json:"availableMinor"`
	Currency       string    `json:"currency"`
}

type HouseholdTotals struct {
	IncomeMinor  int64 `json:"incomeMinor"`
	ExpenseMinor int64 `json:"expenseMinor"`
}

type Activity struct {
	ID                  uuid.UUID  `json:"id"`
	Type                string     `json:"type"`
	WalletID            *uuid.UUID `json:"walletId,omitempty"`
	SourceWalletID      *uuid.UUID `json:"sourceWalletId,omitempty"`
	DestinationWalletID *uuid.UUID `json:"destinationWalletId,omitempty"`
	AmountMinor         int64      `json:"amountMinor"`
	Currency            string     `json:"currency"`
	OccurredAt          time.Time  `json:"occurredAt"`
	Note                string     `json:"note,omitempty"`
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool, now: time.Now}
}

func (s *Service) CreateHousehold(ctx context.Context, name string, ownerSubjectID uuid.UUID) (household.Household, error) {
	h, err := household.New(name)
	if err != nil {
		return household.Household{}, err
	}
	membership, err := household.NewMembership(h.ID, ownerSubjectID)
	if err != nil {
		return household.Household{}, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return household.Household{}, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `INSERT INTO households (id, name) VALUES ($1, $2)`, h.ID, h.Name); err != nil {
		return household.Household{}, err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO household_members (id, household_id, subject_id) VALUES ($1, $2, $3)`, membership.ID, membership.HouseholdID, membership.SubjectID); err != nil {
		return household.Household{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return household.Household{}, err
	}
	return h, nil
}

func (s *Service) GetHousehold(ctx context.Context, id uuid.UUID) (household.Household, error) {
	var h household.Household
	err := s.pool.QueryRow(ctx, `SELECT id, name FROM households WHERE id = $1`, id).Scan(&h.ID, &h.Name)
	return h, err
}

func (s *Service) CreateWallet(ctx context.Context, householdID uuid.UUID, name string, walletType wallet.Type, currency string) (wallet.Wallet, error) {
	if _, err := s.GetHousehold(ctx, householdID); err != nil {
		return wallet.Wallet{}, err
	}
	w, err := wallet.New(householdID, name, walletType, currency)
	if err != nil {
		return wallet.Wallet{}, err
	}
	_, err = s.pool.Exec(ctx, `INSERT INTO wallets (id, household_id, name, type, currency, status) VALUES ($1, $2, $3, $4, $5, $6)`, w.ID, w.HouseholdID, w.Name, w.Type, w.Currency, w.Status)
	return w, err
}

func (s *Service) GetWallet(ctx context.Context, householdID, walletID uuid.UUID) (wallet.Wallet, error) {
	return scanWallet(s.pool.QueryRow(ctx, `SELECT id, household_id, name, type, currency, status, archived_at FROM wallets WHERE id = $1 AND household_id = $2`, walletID, householdID))
}

func (s *Service) ListWallets(ctx context.Context, householdID uuid.UUID) ([]wallet.Wallet, error) {
	rows, err := s.pool.Query(ctx, `SELECT id, household_id, name, type, currency, status, archived_at FROM wallets WHERE household_id = $1 ORDER BY created_at, id`, householdID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	wallets := make([]wallet.Wallet, 0)
	for rows.Next() {
		w, err := scanWallet(rows)
		if err != nil {
			return nil, err
		}
		wallets = append(wallets, w)
	}
	return wallets, rows.Err()
}

func (s *Service) UpdateWallet(ctx context.Context, householdID, walletID uuid.UUID, name string, walletType wallet.Type) (wallet.Wallet, error) {
	w, err := s.GetWallet(ctx, householdID, walletID)
	if err != nil {
		return wallet.Wallet{}, err
	}
	if err := w.Update(name, walletType); err != nil {
		return wallet.Wallet{}, err
	}
	commandTag, err := s.pool.Exec(ctx, `UPDATE wallets SET name = $1, type = $2, updated_at = NOW() WHERE id = $3 AND household_id = $4 AND status = 'active'`, w.Name, w.Type, w.ID, w.HouseholdID)
	if err != nil {
		return wallet.Wallet{}, err
	}
	if commandTag.RowsAffected() != 1 {
		return wallet.Wallet{}, pgx.ErrNoRows
	}
	return w, nil
}

func (s *Service) ArchiveWallet(ctx context.Context, householdID, walletID uuid.UUID) (wallet.Wallet, error) {
	w, err := s.GetWallet(ctx, householdID, walletID)
	if err != nil {
		return wallet.Wallet{}, err
	}
	if err := w.Archive(s.now()); err != nil {
		return wallet.Wallet{}, err
	}
	_, err = s.pool.Exec(ctx, `UPDATE wallets SET status = 'archived', archived_at = $1, updated_at = NOW() WHERE id = $2 AND household_id = $3 AND status = 'active'`, w.ArchivedAt, w.ID, w.HouseholdID)
	return w, err
}

func (s *Service) CreateTransaction(ctx context.Context, householdID, walletID uuid.UUID, kind ledger.Kind, amountMinor int64, occurredAt time.Time, note string) (ledger.Transaction, error) {
	w, err := s.GetWallet(ctx, householdID, walletID)
	if err != nil {
		return ledger.Transaction{}, err
	}
	if w.Status == wallet.StatusArchived {
		return ledger.Transaction{}, ledger.ErrArchivedWallet
	}
	tx, err := ledger.NewTransaction(householdID, walletID, kind, amountMinor, w.Currency, occurredAt, note)
	if err != nil {
		return ledger.Transaction{}, err
	}
	_, err = s.pool.Exec(ctx, `INSERT INTO transactions (id, household_id, wallet_id, kind, amount_minor, currency, occurred_at, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, tx.ID, tx.HouseholdID, tx.WalletID, tx.Kind, tx.AmountMinor, tx.Currency, tx.OccurredAt, tx.Note)
	return tx, err
}

func (s *Service) CreateTransfer(ctx context.Context, householdID, sourceWalletID, destinationWalletID uuid.UUID, amountMinor int64, occurredAt time.Time, note string) (ledger.Transfer, error) {
	source, err := s.GetWallet(ctx, householdID, sourceWalletID)
	if err != nil {
		return ledger.Transfer{}, err
	}
	destination, err := s.GetWallet(ctx, householdID, destinationWalletID)
	if err != nil {
		return ledger.Transfer{}, err
	}
	if source.Status == wallet.StatusArchived || destination.Status == wallet.StatusArchived {
		return ledger.Transfer{}, ledger.ErrArchivedWallet
	}
	if source.Currency != destination.Currency {
		return ledger.Transfer{}, ledger.ErrCurrencyMismatch
	}
	transfer, err := ledger.NewTransfer(householdID, sourceWalletID, destinationWalletID, amountMinor, source.Currency, occurredAt, note)
	if err != nil {
		return ledger.Transfer{}, err
	}
	_, err = s.pool.Exec(ctx, `INSERT INTO transfers (id, household_id, source_wallet_id, destination_wallet_id, amount_minor, currency, occurred_at, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, transfer.ID, transfer.HouseholdID, transfer.SourceWalletID, transfer.DestinationWalletID, transfer.AmountMinor, transfer.Currency, transfer.OccurredAt, transfer.Note)
	return transfer, err
}

func (s *Service) WalletBalances(ctx context.Context, householdID uuid.UUID) ([]WalletBalance, error) {
	rows, err := s.pool.Query(ctx, `
SELECT w.id,
       COALESCE(SUM(CASE WHEN t.kind='income' THEN t.amount_minor WHEN t.kind='expense' THEN -t.amount_minor ELSE 0 END),0)
       + COALESCE((SELECT SUM(CASE WHEN tr.destination_wallet_id=w.id THEN tr.amount_minor ELSE -tr.amount_minor END) FROM transfers tr WHERE tr.household_id=w.household_id AND (tr.source_wallet_id=w.id OR tr.destination_wallet_id=w.id)),0) AS balance,
       w.currency
FROM wallets w
LEFT JOIN transactions t ON t.wallet_id=w.id AND t.household_id=w.household_id
WHERE w.household_id=$1
GROUP BY w.id, w.currency, w.household_id
ORDER BY w.created_at, w.id`, householdID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	balances := make([]WalletBalance, 0)
	for rows.Next() {
		var b WalletBalance
		if err := rows.Scan(&b.WalletID, &b.AmountMinor, &b.Currency); err != nil {
			return nil, err
		}
		balances = append(balances, b)
	}
	return balances, rows.Err()
}

func (s *Service) HouseholdTotals(ctx context.Context, householdID uuid.UUID) (HouseholdTotals, error) {
	var totals HouseholdTotals
	err := s.pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount_minor) FILTER (WHERE kind='income'),0), COALESCE(SUM(amount_minor) FILTER (WHERE kind='expense'),0) FROM transactions WHERE household_id=$1`, householdID).Scan(&totals.IncomeMinor, &totals.ExpenseMinor)
	return totals, err
}

func (s *Service) ListActivity(ctx context.Context, householdID uuid.UUID) ([]Activity, error) {
	rows, err := s.pool.Query(ctx, `
SELECT id, kind AS type, wallet_id, NULL::uuid, NULL::uuid, amount_minor, currency, occurred_at, note FROM transactions WHERE household_id=$1
UNION ALL
SELECT id, 'transfer' AS type, NULL::uuid, source_wallet_id, destination_wallet_id, amount_minor, currency, occurred_at, note FROM transfers WHERE household_id=$1
ORDER BY occurred_at DESC, id DESC LIMIT 50`, householdID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Activity, 0)
	for rows.Next() {
		var item Activity
		if err := rows.Scan(&item.ID, &item.Type, &item.WalletID, &item.SourceWalletID, &item.DestinationWalletID, &item.AmountMinor, &item.Currency, &item.OccurredAt, &item.Note); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func IsLedgerInputError(err error) bool {
	return errors.Is(err, ledger.ErrInvalidAmount) || errors.Is(err, ledger.ErrInvalidKind) || errors.Is(err, ledger.ErrInvalidWallet) || errors.Is(err, ledger.ErrInvalidHousehold) || errors.Is(err, ledger.ErrInvalidCurrency) || errors.Is(err, ledger.ErrSelfTransfer) || errors.Is(err, ledger.ErrCurrencyMismatch) || errors.Is(err, ledger.ErrArchivedWallet)
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanWallet(row rowScanner) (wallet.Wallet, error) {
	var w wallet.Wallet
	err := row.Scan(&w.ID, &w.HouseholdID, &w.Name, &w.Type, &w.Currency, &w.Status, &w.ArchivedAt)
	return w, err
}
