package finance

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/putradwinandap/arta/server/internal/household"
	"github.com/putradwinandap/arta/server/internal/wallet"
)

type Service struct {
	pool *pgxpool.Pool
	now  func() time.Time
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

	if _, err := tx.Exec(ctx,
		`INSERT INTO households (id, name) VALUES ($1, $2)`, h.ID, h.Name,
	); err != nil {
		return household.Household{}, err
	}
	if _, err := tx.Exec(ctx,
		`INSERT INTO household_members (id, household_id, subject_id) VALUES ($1, $2, $3)`,
		membership.ID, membership.HouseholdID, membership.SubjectID,
	); err != nil {
		return household.Household{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return household.Household{}, err
	}
	return h, nil
}

func (s *Service) GetHousehold(ctx context.Context, id uuid.UUID) (household.Household, error) {
	var h household.Household
	err := s.pool.QueryRow(ctx,
		`SELECT id, name FROM households WHERE id = $1`, id,
	).Scan(&h.ID, &h.Name)
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
	_, err = s.pool.Exec(ctx,
		`INSERT INTO wallets (id, household_id, name, type, currency, status)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		w.ID, w.HouseholdID, w.Name, w.Type, w.Currency, w.Status,
	)
	return w, err
}

func (s *Service) GetWallet(ctx context.Context, householdID, walletID uuid.UUID) (wallet.Wallet, error) {
	return scanWallet(s.pool.QueryRow(ctx,
		`SELECT id, household_id, name, type, currency, status, archived_at
		 FROM wallets WHERE id = $1 AND household_id = $2`, walletID, householdID,
	))
}

func (s *Service) ListWallets(ctx context.Context, householdID uuid.UUID) ([]wallet.Wallet, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, household_id, name, type, currency, status, archived_at
		 FROM wallets WHERE household_id = $1 ORDER BY created_at, id`, householdID,
	)
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
	commandTag, err := s.pool.Exec(ctx,
		`UPDATE wallets SET name = $1, type = $2, updated_at = NOW()
		 WHERE id = $3 AND household_id = $4 AND status = 'active'`,
		w.Name, w.Type, w.ID, w.HouseholdID,
	)
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
	_, err = s.pool.Exec(ctx,
		`UPDATE wallets SET status = 'archived', archived_at = $1, updated_at = NOW()
		 WHERE id = $2 AND household_id = $3 AND status = 'active'`,
		w.ArchivedAt, w.ID, w.HouseholdID,
	)
	return w, err
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanWallet(row rowScanner) (wallet.Wallet, error) {
	var w wallet.Wallet
	err := row.Scan(&w.ID, &w.HouseholdID, &w.Name, &w.Type, &w.Currency, &w.Status, &w.ArchivedAt)
	return w, err
}
