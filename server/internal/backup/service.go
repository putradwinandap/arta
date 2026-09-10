package backup

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const Format = "arta-household-backup"
const Version = 1

var (
	ErrInvalidBackup        = errors.New("invalid_backup")
	ErrUnsupportedVersion   = errors.New("unsupported_backup_version")
	ErrHouseholdMismatch    = errors.New("backup_household_mismatch")
	ErrConfirmationRequired = errors.New("restore_confirmation_required")
)

type Snapshot struct {
	Format      string                       `json:"format"`
	Version     int                          `json:"version"`
	ExportedAt  time.Time                    `json:"exportedAt"`
	HouseholdID uuid.UUID                    `json:"householdId"`
	Tables      map[string][]json.RawMessage `json:"tables"`
}

type Service struct {
	pool *pgxpool.Pool
	now  func() time.Time
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool, now: time.Now} }

var tableOrder = []string{"households", "household_members", "wallets", "transactions", "transfers", "transaction_captures", "budgets", "financial_goals", "goal_reservation_events", "balance_adjustments", "wallet_reconciliations"}
var deleteOrder = []string{"wallet_reconciliations", "balance_adjustments", "goal_reservation_events", "transaction_captures", "financial_goals", "budgets", "transfers", "transactions", "wallets", "household_members"}

func (s *Service) Export(ctx context.Context, householdID uuid.UUID) (Snapshot, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		return Snapshot{}, err
	}
	defer tx.Rollback(ctx)

	var exists bool
	if err := tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM households WHERE id=$1)", householdID).Scan(&exists); err != nil || !exists {
		if err == nil {
			err = pgx.ErrNoRows
		}
		return Snapshot{}, err
	}

	out := Snapshot{Format: Format, Version: Version, ExportedAt: s.now().UTC(), HouseholdID: householdID, Tables: map[string][]json.RawMessage{}}
	for _, table := range tableOrder {
		query := fmt.Sprintf("SELECT to_jsonb(t) FROM %s t WHERE household_id=$1 ORDER BY id", table)
		if table == "households" {
			query = "SELECT to_jsonb(t) FROM households t WHERE id=$1"
		}
		rows, err := tx.Query(ctx, query, householdID)
		if err != nil {
			return Snapshot{}, err
		}
		items := []json.RawMessage{}
		for rows.Next() {
			var raw []byte
			if err := rows.Scan(&raw); err != nil {
				rows.Close()
				return Snapshot{}, err
			}
			items = append(items, append(json.RawMessage(nil), raw...))
		}
		if err := rows.Err(); err != nil {
			rows.Close()
			return Snapshot{}, err
		}
		rows.Close()
		out.Tables[table] = items
	}
	if err := tx.Commit(ctx); err != nil {
		return Snapshot{}, err
	}
	return out, nil
}

func Validate(snapshot Snapshot, householdID uuid.UUID) error {
	if snapshot.Format != Format || snapshot.Version != Version || snapshot.HouseholdID == uuid.Nil || snapshot.Tables == nil {
		return ErrInvalidBackup
	}
	if snapshot.HouseholdID != householdID {
		return ErrHouseholdMismatch
	}
	for _, name := range tableOrder {
		if _, ok := snapshot.Tables[name]; !ok {
			return ErrInvalidBackup
		}
	}
	if len(snapshot.Tables["households"]) != 1 {
		return ErrInvalidBackup
	}
	for _, name := range tableOrder {
		for _, row := range snapshot.Tables[name] {
			var identity struct {
				ID          string `json:"id"`
				HouseholdID string `json:"household_id"`
			}
			if err := json.Unmarshal(row, &identity); err != nil {
				return ErrInvalidBackup
			}
			if _, err := uuid.Parse(identity.ID); err != nil {
				return ErrInvalidBackup
			}
			rowHouseholdID := identity.HouseholdID
			if name == "households" {
				rowHouseholdID = identity.ID
			}
			if rowHouseholdID != householdID.String() {
				return ErrHouseholdMismatch
			}
		}
	}
	return nil
}

func (s *Service) Restore(ctx context.Context, householdID uuid.UUID, snapshot Snapshot, confirmed bool) error {
	if !confirmed {
		return ErrConfirmationRequired
	}
	if snapshot.Version != Version && snapshot.Format == Format {
		return ErrUnsupportedVersion
	}
	if err := Validate(snapshot, householdID); err != nil {
		return err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var lockedID uuid.UUID
	if err := tx.QueryRow(ctx, "SELECT id FROM households WHERE id=$1 FOR UPDATE", householdID).Scan(&lockedID); err != nil {
		return err
	}
	for _, table := range deleteOrder {
		if _, err := tx.Exec(ctx, fmt.Sprintf("DELETE FROM %s WHERE household_id=$1", table), householdID); err != nil {
			return err
		}
	}
	if _, err := tx.Exec(ctx, "DELETE FROM households WHERE id=$1", householdID); err != nil {
		return err
	}
	for _, table := range tableOrder {
		for _, row := range snapshot.Tables[table] {
			q := fmt.Sprintf("INSERT INTO %s SELECT * FROM jsonb_populate_record(NULL::%s,$1::jsonb)", table, table)
			if _, err := tx.Exec(ctx, q, string(row)); err != nil {
				return err
			}
		}
	}
	return tx.Commit(ctx)
}
