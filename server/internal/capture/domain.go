package capture

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/putradwinandap/arta/server/internal/ledger"
)

type Status string

type Source string

const (
	StatusPending     Status = "pending"
	StatusConfirmed   Status = "confirmed"
	SourceQuickManual Source = "quick_manual"
)

var (
	ErrInvalidCaptureID  = errors.New("invalid_capture_id")
	ErrInvalidHousehold  = errors.New("invalid_household")
	ErrInvalidAmount     = errors.New("invalid_amount")
	ErrAlreadyConfirmed  = errors.New("capture_already_confirmed")
	ErrIncompleteCapture = errors.New("incomplete_capture")
)

type Capture struct {
	ID                     uuid.UUID    `json:"id"`
	HouseholdID            uuid.UUID    `json:"householdId"`
	WalletID               *uuid.UUID   `json:"walletId,omitempty"`
	Kind                   *ledger.Kind `json:"kind,omitempty"`
	AmountMinor            int64        `json:"amountMinor"`
	Note                   string       `json:"note,omitempty"`
	Source                 Source       `json:"source"`
	Status                 Status       `json:"status"`
	CapturedAt             time.Time    `json:"capturedAt"`
	UpdatedAt              time.Time    `json:"updatedAt"`
	ConfirmedAt            *time.Time   `json:"confirmedAt,omitempty"`
	ConfirmedTransactionID *uuid.UUID   `json:"confirmedTransactionId,omitempty"`
}

func New(id, householdID uuid.UUID, amountMinor int64, note string, capturedAt time.Time) (Capture, error) {
	if id == uuid.Nil {
		return Capture{}, ErrInvalidCaptureID
	}
	if householdID == uuid.Nil {
		return Capture{}, ErrInvalidHousehold
	}
	if amountMinor <= 0 {
		return Capture{}, ErrInvalidAmount
	}
	if capturedAt.IsZero() {
		capturedAt = time.Now()
	}
	capturedAt = capturedAt.UTC()
	return Capture{
		ID:          id,
		HouseholdID: householdID,
		AmountMinor: amountMinor,
		Note:        strings.TrimSpace(note),
		Source:      SourceQuickManual,
		Status:      StatusPending,
		CapturedAt:  capturedAt,
		UpdatedAt:   capturedAt,
	}, nil
}

func (c *Capture) Review(walletID uuid.UUID, kind ledger.Kind, amountMinor int64, note string, updatedAt time.Time) error {
	if c.Status != StatusPending {
		return ErrAlreadyConfirmed
	}
	if walletID == uuid.Nil {
		return ledger.ErrInvalidWallet
	}
	if kind != ledger.KindIncome && kind != ledger.KindExpense {
		return ledger.ErrInvalidKind
	}
	if amountMinor <= 0 {
		return ErrInvalidAmount
	}
	c.WalletID = &walletID
	c.Kind = &kind
	c.AmountMinor = amountMinor
	c.Note = strings.TrimSpace(note)
	c.UpdatedAt = updatedAt.UTC()
	return nil
}

func (c Capture) ReadyToConfirm() error {
	if c.Status != StatusPending {
		return ErrAlreadyConfirmed
	}
	if c.WalletID == nil || c.Kind == nil {
		return ErrIncompleteCapture
	}
	if c.AmountMinor <= 0 {
		return ErrInvalidAmount
	}
	return nil
}
