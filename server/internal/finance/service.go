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

func (s *Service) CreateHousehold(ctx context.Context, name string, ownerUserID uuid.UUID) (household.Household, error) {
	h, err := household.New(name)
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
	if _, err := tx.Exec(ctx, `INSERT INTO household_members (id, household_id, subject_id, user_id, role) VALUES ($1, $2, $3, $4, 'owner')`, uuid.New(), h.ID, ownerUserID, ownerUserID); err != nil {
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
	_, err = s.pool.Exec(ctx, `UPDATE wallets SET name = $3, type = $4, updated_at = NOW() WHERE id = $1 AND household_id = $2`, walletID, householdID, w.Name, w.Type)
	return w, err
}

func (s *Service) ArchiveWallet(ctx context.Context, householdID, walletID uuid.UUID) (wallet.Wallet, error) {
	w, err := s.GetWallet(ctx, householdID, walletID)
	if err != nil {
		return wallet.Wallet{}, err
	}
	if w.Status == wallet.StatusArchived {
		return w, nil
	}
	if err := s.ensureWalletArchivable(ctx, householdID, walletID); err != nil {
		return wallet.Wallet{}, err
	}
	archivedAt := s.now().UTC()
	if err := w.Archive(archivedAt); err != nil {
		return wallet.Wallet{}, err
	}
	_, err = s.pool.Exec(ctx, `UPDATE wallets SET status = 'archived', archived_at = $3, updated_at = NOW() WHERE id = $1 AND household_id = $2`, walletID, householdID, archivedAt)
	return w, err
}

func (s *Service) ensureWalletArchivable(ctx context.Context, householdID, walletID uuid.UUID) error {
	var count int
	if err := s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM transactions WHERE household_id = $1 AND wallet_id = $2`, householdID, walletID).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return errors.New("wallet with transactions cannot be archived")
	}
	if err := s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM transfers WHERE household_id = $1 AND (source_wallet_id = $2 OR destination_wallet_id = $2)`, householdID, walletID).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return errors.New("wallet with transfers cannot be archived")
	}
	return nil
}

func scanWallet(row pgx.Row) (wallet.Wallet, error) {
	var w wallet.Wallet
	err := row.Scan(&w.ID, &w.HouseholdID, &w.Name, &w.Type, &w.Currency, &w.Status, &w.ArchivedAt)
	return w, err
}

func (s *Service) CreateTransaction(ctx context.Context, householdID, walletID uuid.UUID, transactionType ledger.TransactionType, amountMinor int64, currency string, occurredAt time.Time, note string) (ledger.Transaction, error) {
	w, err := s.GetWallet(ctx, householdID, walletID)
	if err != nil {
		return ledger.Transaction{}, err
	}
	if w.Status != wallet.StatusActive {
		return ledger.Transaction{}, errors.New("wallet is archived")
	}
	transaction, err := ledger.NewTransaction(householdID, walletID, transactionType, amountMinor, currency, occurredAt, note)
	if err != nil {
		return ledger.Transaction{}, err
	}
	if transaction.Currency != w.Currency {
		return ledger.Transaction{}, errors.New("transaction currency must match wallet currency")
	}
	_, err = s.pool.Exec(ctx, `INSERT INTO transactions (id, household_id, wallet_id, type, amount_minor, currency, occurred_at, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, transaction.ID, transaction.HouseholdID, transaction.WalletID, transaction.Type, transaction.AmountMinor, transaction.Currency, transaction.OccurredAt, transaction.Note)
	return transaction, err
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
	if source.Status != wallet.StatusActive || destination.Status != wallet.StatusActive {
		return ledger.Transfer{}, errors.New("transfer wallets must be active")
	}
	if source.Currency != destination.Currency {
		return ledger.Transfer{}, errors.New("transfer wallets must use the same currency")
	}
	transfer, err := ledger.NewTransfer(householdID, sourceWalletID, destinationWalletID, amountMinor, source.Currency, occurredAt, note)
	if err != nil {
		return ledger.Transfer{}, err
	}
	_, err = s.pool.Exec(ctx, `INSERT INTO transfers (id, household_id, source_wallet_id, destination_wallet_id, amount_minor, currency, occurred_at, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, transfer.ID, transfer.HouseholdID, transfer.SourceWalletID, transfer.DestinationWalletID, transfer.AmountMinor, transfer.Currency, transfer.OccurredAt, transfer.Note)
	return transfer, err
}

func (s *Service) GetWalletBalance(ctx context.Context, householdID, walletID uuid.UUID) (WalletBalance, error) {
	w, err := s.GetWallet(ctx, householdID, walletID)
	if err != nil {
		return WalletBalance{}, err
	}
	var income, expense, incoming, outgoing, adjustments, reserved int64
	if err := s.pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount_minor) FILTER (WHERE type='income'),0), COALESCE(SUM(amount_minor) FILTER (WHERE type='expense'),0) FROM transactions WHERE household_id=$1 AND wallet_id=$2`, householdID, walletID).Scan(&income, &expense); err != nil {
		return WalletBalance{}, err
	}
	if err := s.pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount_minor) FILTER (WHERE destination_wallet_id=$2),0), COALESCE(SUM(amount_minor) FILTER (WHERE source_wallet_id=$2),0) FROM transfers WHERE household_id=$1 AND (source_wallet_id=$2 OR destination_wallet_id=$2)`, householdID, walletID).Scan(&incoming, &outgoing); err != nil {
		return WalletBalance{}, err
	}
	if err := s.pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount_minor),0) FROM balance_adjustments WHERE household_id=$1 AND wallet_id=$2`, householdID, walletID).Scan(&adjustments); err != nil {
		return WalletBalance{}, err
	}
	if err := s.pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount_minor),0) FROM goal_reservation_events WHERE household_id=$1 AND wallet_id=$2`, householdID, walletID).Scan(&reserved); err != nil {
		return WalletBalance{}, err
	}
	amount := income - expense + incoming - outgoing + adjustments
	return WalletBalance{WalletID: walletID, AmountMinor: amount, ReservedMinor: reserved, AvailableMinor: amount - reserved, Currency: w.Currency}, nil
}

func (s *Service) GetHouseholdTotals(ctx context.Context, householdID uuid.UUID) (HouseholdTotals, error) {
	var totals HouseholdTotals
	err := s.pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount_minor) FILTER (WHERE type='income'),0), COALESCE(SUM(amount_minor) FILTER (WHERE type='expense'),0) FROM transactions WHERE household_id=$1`, householdID).Scan(&totals.IncomeMinor, &totals.ExpenseMinor)
	return totals, err
}

func (s *Service) ListRecentActivity(ctx context.Context, householdID uuid.UUID, limit int) ([]Activity, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	rows, err := s.pool.Query(ctx, `SELECT id, type, wallet_id, NULL::uuid, NULL::uuid, amount_minor, currency, occurred_at, note FROM transactions WHERE household_id=$1 UNION ALL SELECT id, 'transfer', NULL::uuid, source_wallet_id, destination_wallet_id, amount_minor, currency, occurred_at, note FROM transfers WHERE household_id=$1 ORDER BY occurred_at DESC, id DESC LIMIT $2`, householdID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	activities := make([]Activity, 0)
	for rows.Next() {
		var a Activity
		if err := rows.Scan(&a.ID, &a.Type, &a.WalletID, &a.SourceWalletID, &a.DestinationWalletID, &a.AmountMinor, &a.Currency, &a.OccurredAt, &a.Note); err != nil {
			return nil, err
		}
		activities = append(activities, a)
	}
	return activities, rows.Err()
}
