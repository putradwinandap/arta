package ledger

import (
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestNewTransactionUsesExactMinorUnits(t *testing.T) {
	tx, err := NewTransaction(uuid.New(), uuid.New(), KindExpense, 125050, "idr", time.Date(2026, 9, 9, 10, 0, 0, 0, time.FixedZone("WIB", 7*60*60)), "  groceries  ")
	if err != nil {
		t.Fatal(err)
	}
	if tx.AmountMinor != 125050 || tx.Currency != "IDR" || tx.Note != "groceries" {
		t.Fatalf("unexpected transaction: %+v", tx)
	}
	if tx.OccurredAt.Location() != time.UTC {
		t.Fatalf("occurredAt must be normalized to UTC")
	}
}

func TestTransactionRejectsInvalidAmountAndKind(t *testing.T) {
	_, err := NewTransaction(uuid.New(), uuid.New(), KindExpense, 0, "IDR", time.Now(), "")
	if !errors.Is(err, ErrInvalidAmount) {
		t.Fatalf("expected invalid amount, got %v", err)
	}
	_, err = NewTransaction(uuid.New(), uuid.New(), Kind("transfer"), 100, "IDR", time.Now(), "")
	if !errors.Is(err, ErrInvalidKind) {
		t.Fatalf("expected invalid kind, got %v", err)
	}
}

func TestTransferRejectsSelfTransfer(t *testing.T) {
	walletID := uuid.New()
	_, err := NewTransfer(uuid.New(), walletID, walletID, 10000, "IDR", time.Now(), "")
	if !errors.Is(err, ErrSelfTransfer) {
		t.Fatalf("expected self transfer error, got %v", err)
	}
}

func TestTransferUsesOneLogicalMovement(t *testing.T) {
	transfer, err := NewTransfer(uuid.New(), uuid.New(), uuid.New(), 250000, "idr", time.Now(), "Move to savings")
	if err != nil {
		t.Fatal(err)
	}
	if transfer.AmountMinor != 250000 || transfer.Currency != "IDR" {
		t.Fatalf("unexpected transfer: %+v", transfer)
	}
}
