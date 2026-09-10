package budget

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

var (
	ErrInvalidHousehold = errors.New("invalid_household")
	ErrInvalidAmount    = errors.New("invalid_budget_amount")
	ErrInvalidCurrency  = errors.New("invalid_budget_currency")
	ErrInvalidPeriod    = errors.New("invalid_budget_period")
	ErrOverlap          = errors.New("budget_period_overlap")
)

type Budget struct {
	ID          uuid.UUID `json:"id"`
	HouseholdID uuid.UUID `json:"householdId"`
	Currency    string    `json:"currency"`
	PeriodStart time.Time `json:"periodStart"`
	PeriodEnd   time.Time `json:"periodEnd"`
	AmountMinor int64     `json:"amountMinor"`
}

type Summary struct {
	Budget
	SpentMinor     int64 `json:"spentMinor"`
	RemainingMinor int64 `json:"remainingMinor"`
}

func New(householdID uuid.UUID, currency string, periodStart, periodEnd time.Time, amountMinor int64) (Budget, error) {
	if householdID == uuid.Nil {
		return Budget{}, ErrInvalidHousehold
	}
	if amountMinor <= 0 {
		return Budget{}, ErrInvalidAmount
	}
	currency = strings.ToUpper(strings.TrimSpace(currency))
	if !validCurrency(currency) {
		return Budget{}, ErrInvalidCurrency
	}
	start := dateUTC(periodStart)
	end := dateUTC(periodEnd)
	if periodStart.IsZero() || periodEnd.IsZero() || end.Before(start) {
		return Budget{}, ErrInvalidPeriod
	}
	return Budget{ID: uuid.New(), HouseholdID: householdID, Currency: currency, PeriodStart: start, PeriodEnd: end, AmountMinor: amountMinor}, nil
}

func Summarize(value Budget, spentMinor int64) Summary {
	return Summary{Budget: value, SpentMinor: spentMinor, RemainingMinor: value.AmountMinor - spentMinor}
}

func dateUTC(value time.Time) time.Time {
	return time.Date(value.UTC().Year(), value.UTC().Month(), value.UTC().Day(), 0, 0, 0, 0, time.UTC)
}

func validCurrency(currency string) bool {
	if len(currency) != 3 {
		return false
	}
	for _, r := range currency {
		if r < 'A' || r > 'Z' {
			return false
		}
	}
	return true
}
