package goal

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

var (
	ErrInvalidHousehold      = errors.New("invalid_goal_household")
	ErrInvalidName           = errors.New("invalid_goal_name")
	ErrInvalidCurrency       = errors.New("invalid_goal_currency")
	ErrInvalidTarget         = errors.New("invalid_goal_target")
	ErrInvalidAmount         = errors.New("invalid_goal_amount")
	ErrArchived              = errors.New("goal_archived")
	ErrInsufficientAvailable = errors.New("insufficient_available_funds")
	ErrInsufficientReserved  = errors.New("insufficient_reserved_funds")
)

type Status string

const (
	StatusActive   Status = "active"
	StatusArchived Status = "archived"
)

type Goal struct {
	ID                uuid.UUID  `json:"id"`
	HouseholdID       uuid.UUID  `json:"householdId"`
	Name              string     `json:"name"`
	Currency          string     `json:"currency"`
	TargetAmountMinor int64      `json:"targetAmountMinor"`
	Status            Status     `json:"status"`
	ArchivedAt        *time.Time `json:"archivedAt,omitempty"`
}

type Summary struct {
	Goal
	ReservedMinor  int64 `json:"reservedMinor"`
	RemainingMinor int64 `json:"remainingMinor"`
}

func New(householdID uuid.UUID, name, currency string, target int64) (Goal, error) {
	if householdID == uuid.Nil {
		return Goal{}, ErrInvalidHousehold
	}
	name = strings.TrimSpace(name)
	if name == "" {
		return Goal{}, ErrInvalidName
	}
	currency = strings.ToUpper(strings.TrimSpace(currency))
	if len(currency) != 3 {
		return Goal{}, ErrInvalidCurrency
	}
	for _, r := range currency {
		if r < 'A' || r > 'Z' {
			return Goal{}, ErrInvalidCurrency
		}
	}
	if target <= 0 {
		return Goal{}, ErrInvalidTarget
	}
	return Goal{ID: uuid.New(), HouseholdID: householdID, Name: name, Currency: currency, TargetAmountMinor: target, Status: StatusActive}, nil
}

func Summarize(value Goal, reserved int64) Summary {
	remaining := value.TargetAmountMinor - reserved
	if remaining < 0 {
		remaining = 0
	}
	return Summary{Goal: value, ReservedMinor: reserved, RemainingMinor: remaining}
}
