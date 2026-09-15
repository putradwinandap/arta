package finance

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/putradwinandap/arta/server/internal/budget"
)

func (s *Service) CreateBudget(ctx context.Context, householdID uuid.UUID, currency string, periodStart, periodEnd time.Time, amountMinor int64) (budget.Summary, error) {
	return s.CreateBudgetWithRenewal(ctx, householdID, currency, periodStart, periodEnd, amountMinor, false, nil)
}

func (s *Service) CreateBudgetWithRenewal(ctx context.Context, householdID uuid.UUID, currency string, periodStart, periodEnd time.Time, amountMinor int64, autoRenew bool, cadence *string) (budget.Summary, error) {
	if _, err := s.GetHousehold(ctx, householdID); err != nil {
		return budget.Summary{}, err
	}
	value, err := budget.New(householdID, currency, periodStart, periodEnd, amountMinor)
	if err != nil {
		return budget.Summary{}, err
	}
	if autoRenew && (cadence == nil || *cadence != "monthly") {
		return budget.Summary{}, budget.ErrInvalidCadence
	}
	_, err = s.pool.Exec(ctx, `INSERT INTO budgets (id, household_id, currency, period_start, period_end, amount_minor, auto_renew, cadence) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, value.ID, value.HouseholdID, value.Currency, value.PeriodStart, value.PeriodEnd, value.AmountMinor, autoRenew, cadence)
	if err != nil {
		return budget.Summary{}, err
	}
	value.AutoRenew, value.Cadence = autoRenew, cadence
	return budget.Summarize(value, 0), nil
}

const budgetSummaryJoin = `
LEFT JOIN transactions t
 ON t.household_id=b.household_id
 AND t.kind='expense'
 AND t.budget_id=b.id
 AND t.currency=b.currency
 AND t.occurred_at >= (b.period_start::timestamp AT TIME ZONE 'UTC')
 AND t.occurred_at < ((b.period_end + 1)::timestamp AT TIME ZONE 'UTC')`

func (s *Service) ListBudgets(ctx context.Context, householdID uuid.UUID) ([]budget.Summary, error) {
	if _, err := s.pool.Exec(ctx, `
INSERT INTO budgets (id, household_id, currency, period_start, period_end, amount_minor, auto_renew, cadence, renewed_from_id)
SELECT gen_random_uuid(), household_id, currency, period_end + 1, (period_end + 1) + INTERVAL '1 month' - INTERVAL '1 day', amount_minor, auto_renew, cadence, id
FROM budgets
WHERE household_id=$1 AND auto_renew=TRUE AND cadence='monthly' AND renewed_from_id IS NULL AND period_end < (NOW() AT TIME ZONE 'UTC')::date
ON CONFLICT (renewed_from_id) DO NOTHING`, householdID); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `SELECT b.id, b.household_id, b.currency, b.period_start, b.period_end, b.amount_minor, b.auto_renew, b.cadence, b.renewed_from_id, COALESCE(SUM(t.amount_minor), 0) AS spent_minor FROM budgets b`+budgetSummaryJoin+` WHERE b.household_id=$1 GROUP BY b.id ORDER BY b.period_start DESC, b.created_at DESC, b.id`, householdID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]budget.Summary, 0)
	for rows.Next() {
		var value budget.Budget
		var spent int64
		if err := rows.Scan(&value.ID, &value.HouseholdID, &value.Currency, &value.PeriodStart, &value.PeriodEnd, &value.AmountMinor, &value.AutoRenew, &value.Cadence, &value.RenewedFromID, &spent); err != nil {
			return nil, err
		}
		items = append(items, budget.Summarize(value, spent))
	}
	return items, rows.Err()
}

func (s *Service) GetBudget(ctx context.Context, householdID, budgetID uuid.UUID) (budget.Summary, error) {
	var value budget.Budget
	var spent int64
	err := s.pool.QueryRow(ctx, `SELECT b.id, b.household_id, b.currency, b.period_start, b.period_end, b.amount_minor, b.auto_renew, b.cadence, b.renewed_from_id, COALESCE(SUM(t.amount_minor), 0) AS spent_minor FROM budgets b`+budgetSummaryJoin+` WHERE b.household_id=$1 AND b.id=$2 GROUP BY b.id`, householdID, budgetID).Scan(&value.ID, &value.HouseholdID, &value.Currency, &value.PeriodStart, &value.PeriodEnd, &value.AmountMinor, &value.AutoRenew, &value.Cadence, &value.RenewedFromID, &spent)
	if err != nil {
		return budget.Summary{}, err
	}
	return budget.Summarize(value, spent), nil
}

func (s *Service) UpdateBudgetRenewal(ctx context.Context, householdID, budgetID uuid.UUID, autoRenew bool, cadence *string) (budget.Summary, error) {
	if autoRenew && (cadence == nil || *cadence != "monthly") {
		return budget.Summary{}, budget.ErrInvalidCadence
	}
	if _, err := s.pool.Exec(ctx, `UPDATE budgets SET auto_renew=$1, cadence=$2 WHERE id=$3 AND household_id=$4`, autoRenew, cadence, budgetID, householdID); err != nil {
		return budget.Summary{}, err
	}
	return s.GetBudget(ctx, householdID, budgetID)
}

func IsBudgetInputError(err error) bool {
	return errors.Is(err, budget.ErrInvalidHousehold) || errors.Is(err, budget.ErrInvalidAmount) || errors.Is(err, budget.ErrInvalidCurrency) || errors.Is(err, budget.ErrInvalidPeriod) || errors.Is(err, budget.ErrOverlap) || errors.Is(err, budget.ErrInvalidCadence)
}
