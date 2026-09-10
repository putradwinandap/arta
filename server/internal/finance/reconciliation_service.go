package finance

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	ErrInvalidObservedBalance = errors.New("invalid observed balance")
	ErrInvalidAdjustmentReason = errors.New("adjustment reason is required")
	ErrAlreadyReconciled = errors.New("reconciliation already resolved")
)

type Reconciliation struct {
	ID                  uuid.UUID  `json:"id"`
	HouseholdID         uuid.UUID  `json:"householdId"`
	WalletID            uuid.UUID  `json:"walletId"`
	Currency            string     `json:"currency"`
	ExpectedAmountMinor int64      `json:"expectedAmountMinor"`
	ObservedAmountMinor int64      `json:"observedAmountMinor"`
	DiscrepancyMinor    int64      `json:"discrepancyMinor"`
	Status              string     `json:"status"`
	AdjustmentID        *uuid.UUID `json:"adjustmentId,omitempty"`
	ObservedAt          time.Time  `json:"observedAt"`
	ResolvedAt          *time.Time `json:"resolvedAt,omitempty"`
}

func (s *Service) walletPhysicalBalance(ctx context.Context, q interface{ QueryRow(context.Context, string, ...any) pgx.Row }, householdID, walletID uuid.UUID) (int64, error) {
	var balance int64
	err := q.QueryRow(ctx, `SELECT
COALESCE((SELECT SUM(CASE WHEN kind='income' THEN amount_minor ELSE -amount_minor END) FROM transactions WHERE household_id=$1 AND wallet_id=$2),0)
+ COALESCE((SELECT SUM(CASE WHEN destination_wallet_id=$2 THEN amount_minor ELSE -amount_minor END) FROM transfers WHERE household_id=$1 AND (source_wallet_id=$2 OR destination_wallet_id=$2)),0)
+ COALESCE((SELECT SUM(amount_minor) FROM balance_adjustments WHERE household_id=$1 AND wallet_id=$2),0)`, householdID, walletID).Scan(&balance)
	return balance, err
}

func (s *Service) CreateReconciliation(ctx context.Context, householdID, walletID uuid.UUID, observedAmountMinor int64) (Reconciliation, error) {
	w, err := s.GetWallet(ctx, householdID, walletID)
	if err != nil { return Reconciliation{}, err }
	expected, err := s.walletPhysicalBalance(ctx, s.pool, householdID, walletID)
	if err != nil { return Reconciliation{}, err }
	now := s.now().UTC()
	r := Reconciliation{ID: uuid.New(), HouseholdID: householdID, WalletID: walletID, Currency: w.Currency, ExpectedAmountMinor: expected, ObservedAmountMinor: observedAmountMinor, DiscrepancyMinor: observedAmountMinor-expected, Status: "unresolved", ObservedAt: now}
	if r.DiscrepancyMinor == 0 { r.Status = "reconciled"; r.ResolvedAt = &now }
	_, err = s.pool.Exec(ctx, `INSERT INTO wallet_reconciliations (id,household_id,wallet_id,currency,expected_amount_minor,observed_amount_minor,discrepancy_minor,status,observed_at,resolved_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, r.ID,r.HouseholdID,r.WalletID,r.Currency,r.ExpectedAmountMinor,r.ObservedAmountMinor,r.DiscrepancyMinor,r.Status,r.ObservedAt,r.ResolvedAt)
	return r, err
}

func (s *Service) ListReconciliations(ctx context.Context, householdID uuid.UUID) ([]Reconciliation, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,household_id,wallet_id,currency,expected_amount_minor,observed_amount_minor,discrepancy_minor,status,adjustment_id,observed_at,resolved_at FROM wallet_reconciliations WHERE household_id=$1 ORDER BY observed_at DESC,id DESC`, householdID)
	if err != nil { return nil, err }; defer rows.Close()
	out := []Reconciliation{}
	for rows.Next() { var r Reconciliation; if err:=rows.Scan(&r.ID,&r.HouseholdID,&r.WalletID,&r.Currency,&r.ExpectedAmountMinor,&r.ObservedAmountMinor,&r.DiscrepancyMinor,&r.Status,&r.AdjustmentID,&r.ObservedAt,&r.ResolvedAt); err!=nil{return nil,err}; out=append(out,r) }
	return out, rows.Err()
}

func (s *Service) ResolveReconciliationWithAdjustment(ctx context.Context, householdID, reconciliationID uuid.UUID, reason string) (Reconciliation, error) {
	reason = strings.TrimSpace(reason); if reason == "" { return Reconciliation{}, ErrInvalidAdjustmentReason }
	tx, err := s.pool.Begin(ctx); if err != nil { return Reconciliation{}, err }; defer tx.Rollback(ctx)
	var r Reconciliation
	err = tx.QueryRow(ctx, `SELECT id,household_id,wallet_id,currency,expected_amount_minor,observed_amount_minor,discrepancy_minor,status,adjustment_id,observed_at,resolved_at FROM wallet_reconciliations WHERE id=$1 AND household_id=$2 FOR UPDATE`, reconciliationID, householdID).Scan(&r.ID,&r.HouseholdID,&r.WalletID,&r.Currency,&r.ExpectedAmountMinor,&r.ObservedAmountMinor,&r.DiscrepancyMinor,&r.Status,&r.AdjustmentID,&r.ObservedAt,&r.ResolvedAt)
	if err != nil { return Reconciliation{}, err }; if r.Status != "unresolved" { return Reconciliation{}, ErrAlreadyReconciled }
	current, err := s.walletPhysicalBalance(ctx, tx, householdID, r.WalletID); if err != nil { return Reconciliation{}, err }
	remaining := r.ObservedAmountMinor-current
	if remaining == 0 { now:=s.now().UTC(); r.Status="reconciled"; r.ResolvedAt=&now; _,err=tx.Exec(ctx,`UPDATE wallet_reconciliations SET status='reconciled',resolved_at=$1 WHERE id=$2`,now,r.ID); if err!=nil{return Reconciliation{},err}; if err=tx.Commit(ctx);err!=nil{return Reconciliation{},err}; return r,nil }
	adjustmentID := uuid.New(); now:=s.now().UTC()
	if _,err=tx.Exec(ctx,`INSERT INTO balance_adjustments (id,household_id,wallet_id,amount_minor,currency,reason,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,adjustmentID,householdID,r.WalletID,remaining,r.Currency,reason,now);err!=nil{return Reconciliation{},err}
	if _,err=tx.Exec(ctx,`UPDATE wallet_reconciliations SET status='reconciled',adjustment_id=$1,resolved_at=$2 WHERE id=$3`,adjustmentID,now,r.ID);err!=nil{return Reconciliation{},err}
	if err=tx.Commit(ctx);err!=nil{return Reconciliation{},err}; r.Status="reconciled"; r.AdjustmentID=&adjustmentID; r.ResolvedAt=&now; return r,nil
}

func IsReconciliationInputError(err error) bool { return errors.Is(err,ErrInvalidObservedBalance)||errors.Is(err,ErrInvalidAdjustmentReason)||errors.Is(err,ErrAlreadyReconciled) }
