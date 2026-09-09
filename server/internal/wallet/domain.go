package wallet

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Type string

type Status string

const (
	TypeCash    Type = "cash"
	TypeBank    Type = "bank"
	TypeEWallet Type = "e_wallet"
	TypeOther   Type = "other"

	StatusActive   Status = "active"
	StatusArchived Status = "archived"
)

var (
	ErrInvalidName      = errors.New("wallet name must be between 1 and 120 characters")
	ErrInvalidType      = errors.New("wallet type must be cash, bank, e_wallet, or other")
	ErrInvalidCurrency  = errors.New("currency must be a 3-letter uppercase code")
	ErrInvalidHousehold = errors.New("household id is required")
	ErrWalletArchived   = errors.New("archived wallet cannot be modified")
)

type Wallet struct {
	ID          uuid.UUID  `json:"id"`
	HouseholdID uuid.UUID  `json:"householdId"`
	Name        string     `json:"name"`
	Type        Type       `json:"type"`
	Currency    string     `json:"currency"`
	Status      Status     `json:"status"`
	ArchivedAt  *time.Time `json:"archivedAt,omitempty"`
}

func New(householdID uuid.UUID, name string, walletType Type, currency string) (Wallet, error) {
	if householdID == uuid.Nil {
		return Wallet{}, ErrInvalidHousehold
	}
	name = strings.TrimSpace(name)
	if len(name) == 0 || len(name) > 120 {
		return Wallet{}, ErrInvalidName
	}
	if !walletType.Valid() {
		return Wallet{}, ErrInvalidType
	}
	currency = strings.ToUpper(strings.TrimSpace(currency))
	if !validCurrency(currency) {
		return Wallet{}, ErrInvalidCurrency
	}

	return Wallet{
		ID:          uuid.New(),
		HouseholdID: householdID,
		Name:        name,
		Type:        walletType,
		Currency:    currency,
		Status:      StatusActive,
	}, nil
}

func (w *Wallet) Update(name string, walletType Type) error {
	if w.Status == StatusArchived {
		return ErrWalletArchived
	}
	name = strings.TrimSpace(name)
	if len(name) == 0 || len(name) > 120 {
		return ErrInvalidName
	}
	if !walletType.Valid() {
		return ErrInvalidType
	}
	w.Name = name
	w.Type = walletType
	return nil
}

func (w *Wallet) Archive(at time.Time) error {
	if w.Status == StatusArchived {
		return nil
	}
	w.Status = StatusArchived
	archivedAt := at.UTC()
	w.ArchivedAt = &archivedAt
	return nil
}

func (t Type) Valid() bool {
	switch t {
	case TypeCash, TypeBank, TypeEWallet, TypeOther:
		return true
	default:
		return false
	}
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
