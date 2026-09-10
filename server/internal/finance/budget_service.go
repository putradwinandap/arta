package finance

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"github.com/putradwinandap/arta/server/internal/budget"
)

func (s *Service) CreateBudget(ctx context.Context, householdID uuid.UUID, currency string, periodStart, periodEnd time.Time, amountMinor int64) (budget.Summary, error) {
	if _, err := s.GetHousehold(ctx, householdID); err != nil {
		return budget.Summary{}, err
	}
	value, err := budget.New(householdID, currency, periodStart, periodEnd, amountMinor)
	if err != nil { return budget.Summary{}, err }

	var overlap bool
	err = s.pool.QueryRow(ctx, `SELECT EXISTS (
		SELECT 1 FROM budgets
		WHERE household_id=$1 AND currency=$2
		AND period_start <= $4::date AND period_end >= $3::date
	)`, value.HouseholdID, value.Currency, value.PeriodStart, value.PeriodEnd).Scan(&overlap)
	if err != nil { return budget.Summary{}, err }
	if overlap { return budget.Summary{}, budget.ErrOverlap }

	_, err = s.pool.Exec(ctx, `INSERT INTO budgets (id, household_id, currency, period_start, period_end, amount_minor) VALUES ($1,$2,$3,$4,$5,$6)`, value.ID, value.HouseholdID, value.Currency, value.PeriodStart, value.PeriodEnd, value.AmountMinor)
	if err != nil { return budget.Summary{}, err }
	return budget.Summarize(value, 0), nil
}

func (s *Service) ListBudgets(ctx context.Context, householdID uuid.UUID) ([]budget.Summary, error) {
	rows, err := s.pool.Query(ctx, `
SELECT b.id, b.household_id, b.currency, b.period_start, b.period_end, b.amount_minor,
       COALESCE(SUM(t.amount_minor), 0) AS spent_minor
FROM budgets b
LEFT JOIN transactions t
  ON t.household_id=b.household_id
 AND t.kind='expense'
 AND t.currency=b.currency
 AND t.occurred_at >= b.period_start::timestamptz
 AND t.occurred_at < (b.period_end + 1)::timestamptz
WHERE b.household_id=$1
GROUP BY b.id
ORDER BY b.period_start DESC, b.created_at DESC, b.id`, householdID)
	if err != nil { return nil, err }
	defer rows.Close()

	items := make([]budget.Summary, 0)
	for rows.Next() {
		var value budget.Budget
		var spent int64
		if err := rows.Scan(&value.ID, &value.HouseholdID, &value.Currency, &value.PeriodStart, &value.PeriodEnd, &value.AmountMinor, &spent); err != nil { return nil, err }
		items = append(items, budget.Summarize(value, spent))
	}
	return items, rows.Err()
}

func (s *Service) GetBudget(ctx context.Context, householdID, budgetID uuid.UUID) (budget.Summary, error) {
	var value budget.Budget
	var spent int64
	err := s.pool.QueryRow(ctx, `
SELECT b.id, b.household_id, b.currency, b.period_start, b.period_end, b.amount_minor,
       COALESCE(SUM(t.amount_minor), 0) AS spent_minor
FROM budgets b
LEFT JOIN transactions t
  ON t.household_id=b.household_id
 AND t.kind='expense'
 AND t.currency=b.currency
 AND t.occurred_at >= b.period_start::timestamptz
 AND t.occurred_at < (b.period_end + 1)::timestamptz
WHERE b.household_id=$1 AND b.id=$2
GROUP BY b.id`, householdID, budgetID).Scan(&value.ID, &value.HouseholdID, &value.Currency, &value.PeriodStart, &value.PeriodEnd, &value.AmountMinor, &spent)
	if err != nil { return budget.Summary{}, err }
	return budget.Summarize(value, spent), nil
}

func IsBudgetInputError(err error) bool {
	return errors.Is(err, budget.ErrInvalidHousehold) || errors.Is(err, budget.ErrInvalidAmount) || errors.Is(err, budget.ErrInvalidCurrency) || errors.Is(err, budget.ErrInvalidPeriod) || errors.Is(err, budget.ErrOverlap)
}
