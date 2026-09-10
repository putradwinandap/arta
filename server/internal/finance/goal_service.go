package finance

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/putradwinandap/arta/server/internal/goal"
	"github.com/putradwinandap/arta/server/internal/wallet"
)

func (s *Service) CreateGoal(ctx context.Context, householdID uuid.UUID, name, currency string, target int64) (goal.Summary, error) {
	if _, err := s.GetHousehold(ctx, householdID); err != nil { return goal.Summary{}, err }
	value, err := goal.New(householdID, name, currency, target)
	if err != nil { return goal.Summary{}, err }
	_, err = s.pool.Exec(ctx, `INSERT INTO financial_goals (id,household_id,name,currency,target_amount_minor,status) VALUES ($1,$2,$3,$4,$5,$6)`, value.ID, value.HouseholdID, value.Name, value.Currency, value.TargetAmountMinor, value.Status)
	if err != nil { return goal.Summary{}, err }
	return goal.Summarize(value, 0), nil
}

func (s *Service) ListGoals(ctx context.Context, householdID uuid.UUID) ([]goal.Summary, error) {
	rows, err := s.pool.Query(ctx, `SELECT g.id,g.household_id,g.name,g.currency,g.target_amount_minor,g.status,g.archived_at,COALESCE(SUM(CASE WHEN e.kind='reserve' THEN e.amount_minor ELSE -e.amount_minor END),0) FROM financial_goals g LEFT JOIN goal_reservation_events e ON e.goal_id=g.id WHERE g.household_id=$1 GROUP BY g.id ORDER BY g.status,g.created_at,g.id`, householdID)
	if err != nil { return nil, err }
	defer rows.Close()
	items := make([]goal.Summary, 0)
	for rows.Next() {
		var value goal.Goal; var reserved int64
		if err := rows.Scan(&value.ID,&value.HouseholdID,&value.Name,&value.Currency,&value.TargetAmountMinor,&value.Status,&value.ArchivedAt,&reserved); err != nil { return nil, err }
		items = append(items, goal.Summarize(value, reserved))
	}
	return items, rows.Err()
}

func (s *Service) GetGoal(ctx context.Context, householdID, goalID uuid.UUID) (goal.Summary, error) {
	var value goal.Goal; var reserved int64
	err := s.pool.QueryRow(ctx, `SELECT g.id,g.household_id,g.name,g.currency,g.target_amount_minor,g.status,g.archived_at,COALESCE(SUM(CASE WHEN e.kind='reserve' THEN e.amount_minor ELSE -e.amount_minor END),0) FROM financial_goals g LEFT JOIN goal_reservation_events e ON e.goal_id=g.id WHERE g.household_id=$1 AND g.id=$2 GROUP BY g.id`, householdID, goalID).Scan(&value.ID,&value.HouseholdID,&value.Name,&value.Currency,&value.TargetAmountMinor,&value.Status,&value.ArchivedAt,&reserved)
	if err != nil { return goal.Summary{}, err }
	return goal.Summarize(value, reserved), nil
}

func (s *Service) UpdateGoal(ctx context.Context, householdID, goalID uuid.UUID, name string, target int64) (goal.Summary, error) {
	current, err := s.GetGoal(ctx, householdID, goalID); if err != nil { return goal.Summary{}, err }
	if current.Status == goal.StatusArchived { return goal.Summary{}, goal.ErrArchived }
	name = strings.TrimSpace(name); if name == "" { return goal.Summary{}, goal.ErrInvalidName }; if target <= 0 { return goal.Summary{}, goal.ErrInvalidTarget }
	_, err = s.pool.Exec(ctx, `UPDATE financial_goals SET name=$1,target_amount_minor=$2,updated_at=NOW() WHERE household_id=$3 AND id=$4 AND status='active'`, name,target,householdID,goalID)
	if err != nil { return goal.Summary{}, err }
	return s.GetGoal(ctx, householdID, goalID)
}

func (s *Service) ArchiveGoal(ctx context.Context, householdID, goalID uuid.UUID) (goal.Summary, error) {
	current, err := s.GetGoal(ctx, householdID, goalID); if err != nil { return goal.Summary{}, err }
	if current.Status == goal.StatusArchived { return current, nil }
	now := s.now().UTC()
	_, err = s.pool.Exec(ctx, `UPDATE financial_goals SET status='archived',archived_at=$1,updated_at=NOW() WHERE household_id=$2 AND id=$3 AND status='active'`, now,householdID,goalID)
	if err != nil { return goal.Summary{}, err }
	return s.GetGoal(ctx, householdID, goalID)
}

func (s *Service) ReserveGoalFunds(ctx context.Context, householdID, goalID, walletID uuid.UUID, amount int64) (goal.Summary, error) {
	if amount <= 0 { return goal.Summary{}, goal.ErrInvalidAmount }
	tx, err := s.pool.Begin(ctx); if err != nil { return goal.Summary{}, err }; defer tx.Rollback(ctx)
	var status goal.Status; var currency string
	if err := tx.QueryRow(ctx, `SELECT status,currency FROM financial_goals WHERE household_id=$1 AND id=$2 FOR UPDATE`, householdID,goalID).Scan(&status,&currency); err != nil { return goal.Summary{}, err }
	if status == goal.StatusArchived { return goal.Summary{}, goal.ErrArchived }
	var walletCurrency string; var walletStatus wallet.Status
	if err := tx.QueryRow(ctx, `SELECT currency,status FROM wallets WHERE household_id=$1 AND id=$2 FOR UPDATE`, householdID,walletID).Scan(&walletCurrency,&walletStatus); err != nil { return goal.Summary{}, err }
	if walletStatus == wallet.StatusArchived { return goal.Summary{}, goal.ErrArchived }
	if walletCurrency != currency { return goal.Summary{}, goal.ErrInvalidCurrency }
	var balance, reserved int64
	if err := tx.QueryRow(ctx, `SELECT COALESCE((SELECT SUM(CASE WHEN kind='income' THEN amount_minor ELSE -amount_minor END) FROM transactions WHERE household_id=$1 AND wallet_id=$2),0)+COALESCE((SELECT SUM(CASE WHEN destination_wallet_id=$2 THEN amount_minor ELSE -amount_minor END) FROM transfers WHERE household_id=$1 AND (source_wallet_id=$2 OR destination_wallet_id=$2)),0)`, householdID,walletID).Scan(&balance); err != nil { return goal.Summary{}, err }
	if err := tx.QueryRow(ctx, `SELECT COALESCE(SUM(CASE WHEN kind='reserve' THEN amount_minor ELSE -amount_minor END),0) FROM goal_reservation_events WHERE household_id=$1 AND wallet_id=$2`, householdID,walletID).Scan(&reserved); err != nil { return goal.Summary{}, err }
	if balance-reserved < amount { return goal.Summary{}, goal.ErrInsufficientAvailable }
	_, err = tx.Exec(ctx, `INSERT INTO goal_reservation_events (id,goal_id,household_id,wallet_id,kind,amount_minor) VALUES ($1,$2,$3,$4,'reserve',$5)`, uuid.New(),goalID,householdID,walletID,amount); if err != nil { return goal.Summary{}, err }
	if err := tx.Commit(ctx); err != nil { return goal.Summary{}, err }
	return s.GetGoal(ctx, householdID, goalID)
}

func (s *Service) ReleaseGoalFunds(ctx context.Context, householdID, goalID, walletID uuid.UUID, amount int64) (goal.Summary, error) {
	if amount <= 0 { return goal.Summary{}, goal.ErrInvalidAmount }
	tx, err := s.pool.Begin(ctx); if err != nil { return goal.Summary{}, err }; defer tx.Rollback(ctx)
	var currency string
	if err := tx.QueryRow(ctx, `SELECT currency FROM financial_goals WHERE household_id=$1 AND id=$2 FOR UPDATE`, householdID,goalID).Scan(&currency); err != nil { return goal.Summary{}, err }
	var walletCurrency string
	if err := tx.QueryRow(ctx, `SELECT currency FROM wallets WHERE household_id=$1 AND id=$2 FOR UPDATE`, householdID,walletID).Scan(&walletCurrency); err != nil { return goal.Summary{}, err }
	if walletCurrency != currency { return goal.Summary{}, goal.ErrInvalidCurrency }
	var reserved int64
	if err := tx.QueryRow(ctx, `SELECT COALESCE(SUM(CASE WHEN kind='reserve' THEN amount_minor ELSE -amount_minor END),0) FROM goal_reservation_events WHERE household_id=$1 AND goal_id=$2 AND wallet_id=$3`, householdID,goalID,walletID).Scan(&reserved); err != nil { return goal.Summary{}, err }
	if reserved < amount { return goal.Summary{}, goal.ErrInsufficientReserved }
	_, err = tx.Exec(ctx, `INSERT INTO goal_reservation_events (id,goal_id,household_id,wallet_id,kind,amount_minor) VALUES ($1,$2,$3,$4,'release',$5)`, uuid.New(),goalID,householdID,walletID,amount); if err != nil { return goal.Summary{}, err }
	if err := tx.Commit(ctx); err != nil { return goal.Summary{}, err }
	return s.GetGoal(ctx, householdID, goalID)
}

func (s *Service) WalletAvailableBalances(ctx context.Context, householdID uuid.UUID) ([]WalletBalance, error) {
	balances, err := s.WalletBalances(ctx, householdID); if err != nil { return nil, err }
	for i := range balances {
		var reserved int64
		if err := s.pool.QueryRow(ctx, `SELECT COALESCE(SUM(CASE WHEN kind='reserve' THEN amount_minor ELSE -amount_minor END),0) FROM goal_reservation_events WHERE household_id=$1 AND wallet_id=$2`, householdID,balances[i].WalletID).Scan(&reserved); err != nil { return nil, err }
		balances[i].ReservedMinor = reserved; balances[i].AvailableMinor = balances[i].AmountMinor-reserved
	}
	return balances,nil
}

func IsGoalInputError(err error) bool {
	return errors.Is(err, goal.ErrInvalidHousehold)||errors.Is(err,goal.ErrInvalidName)||errors.Is(err,goal.ErrInvalidCurrency)||errors.Is(err,goal.ErrInvalidTarget)||errors.Is(err,goal.ErrInvalidAmount)||errors.Is(err,goal.ErrArchived)||errors.Is(err,goal.ErrInsufficientAvailable)||errors.Is(err,goal.ErrInsufficientReserved)
}

var _ = time.Time{}
var _ = pgx.ErrNoRows
