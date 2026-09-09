package ledger

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Kind string

const (
	KindIncome  Kind = "income"
	KindExpense Kind = "expense"
)

var (
	ErrInvalidAmount    = errors.New("invalid_amount")
	ErrInvalidKind      = errors.New("invalid_transaction_kind")
	ErrInvalidWallet    = errors.New("invalid_wallet")
	ErrInvalidHousehold = errors.New("invalid_household")
	ErrInvalidCurrency  = errors.New("invalid_currency")
	ErrSelfTransfer     = errors.New("self_transfer")
	ErrCurrencyMismatch = errors.New("currency_mismatch")
	ErrArchivedWallet   = errors.New("wallet_archived")
)

type Transaction struct {
	ID          uuid.UUID `json:"id"`
	HouseholdID uuid.UUID `json:"householdId"`
	WalletID    uuid.UUID `json:"walletId"`
	Kind        Kind      `json:"kind"`
	AmountMinor int64     `json:"amountMinor"`
	Currency    string    `json:"currency"`
	OccurredAt  time.Time `json:"occurredAt"`
	Note        string    `json:"note,omitempty"`
}

type Transfer struct {
	ID                  uuid.UUID `json:"id"`
	HouseholdID         uuid.UUID `json:"householdId"`
	SourceWalletID      uuid.UUID `json:"sourceWalletId"`
	DestinationWalletID uuid.UUID `json:"destinationWalletId"`
	AmountMinor         int64     `json:"amountMinor"`
	Currency            string    `json:"currency"`
	OccurredAt          time.Time `json:"occurredAt"`
	Note                string    `json:"note,omitempty"`
}

func NewTransaction(householdID, walletID uuid.UUID, kind Kind, amountMinor int64, currency string, occurredAt time.Time, note string) (Transaction, error) {
	if householdID == uuid.Nil {
		return Transaction{}, ErrInvalidHousehold
	}
	if walletID == uuid.Nil {
		return Transaction{}, ErrInvalidWallet
	}
	if kind != KindIncome && kind != KindExpense {
		return Transaction{}, ErrInvalidKind
	}
	if amountMinor <= 0 {
		return Transaction{}, ErrInvalidAmount
	}
	currency = strings.ToUpper(strings.TrimSpace(currency))
	if !validCurrency(currency) {
		return Transaction{}, ErrInvalidCurrency
	}
	if occurredAt.IsZero() {
		occurredAt = time.Now()
	}
	return Transaction{
		ID:          uuid.New(),
		HouseholdID: householdID,
		WalletID:    walletID,
		Kind:        kind,
		AmountMinor: amountMinor,
		Currency:    currency,
		OccurredAt:  occurredAt.UTC(),
		Note:        strings.TrimSpace(note),
	}, nil
}

func NewTransfer(householdID, sourceWalletID, destinationWalletID uuid.UUID, amountMinor int64, currency string, occurredAt time.Time, note string) (Transfer, error) {
	if householdID == uuid.Nil {
		return Transfer{}, ErrInvalidHousehold
	}
	if sourceWalletID == uuid.Nil || destinationWalletID == uuid.Nil {
		return Transfer{}, ErrInvalidWallet
	}
	if sourceWalletID == destinationWalletID {
		return Transfer{}, ErrSelfTransfer
	}
	if amountMinor <= 0 {
		return Transfer{}, ErrInvalidAmount
	}
	currency = strings.ToUpper(strings.TrimSpace(currency))
	if !validCurrency(currency) {
		return Transfer{}, ErrInvalidCurrency
	}
	if occurredAt.IsZero() {
		occurredAt = time.Now()
	}
	return Transfer{
		ID:                  uuid.New(),
		HouseholdID:         householdID,
		SourceWalletID:      sourceWalletID,
		DestinationWalletID: destinationWalletID,
		AmountMinor:         amountMinor,
		Currency:            currency,
		OccurredAt:          occurredAt.UTC(),
		Note:                strings.TrimSpace(note),
	}, nil
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
