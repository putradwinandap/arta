package capture

import (
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/putradwinandap/arta/server/internal/ledger"
)

func TestQuickCaptureRequiresOnlyAmountAndStableID(t *testing.T) {
	id := uuid.New()
	created, err := New(id, uuid.New(), 25_000, "  lunch  ", time.Date(2026, 9, 10, 9, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatal(err)
	}
	if created.ID != id || created.AmountMinor != 25_000 || created.Note != "lunch" {
		t.Fatalf("unexpected capture: %+v", created)
	}
	if created.WalletID != nil || created.Kind != nil || created.Status != StatusPending {
		t.Fatalf("quick capture should remain incomplete and pending: %+v", created)
	}
}

func TestReviewCompletesPendingCapture(t *testing.T) {
	created, err := New(uuid.New(), uuid.New(), 25_000, "lunch", time.Now())
	if err != nil {
		t.Fatal(err)
	}
	walletID := uuid.New()
	updatedAt := time.Now().Add(time.Minute)
	if err := created.Review(walletID, ledger.KindExpense, 30_000, "Lunch with family", updatedAt); err != nil {
		t.Fatal(err)
	}
	if created.WalletID == nil || *created.WalletID != walletID || created.Kind == nil || *created.Kind != ledger.KindExpense {
		t.Fatalf("review classification not applied: %+v", created)
	}
	if err := created.ReadyToConfirm(); err != nil {
		t.Fatalf("reviewed capture should be confirmable: %v", err)
	}
}

func TestIncompleteCaptureCannotConfirm(t *testing.T) {
	created, err := New(uuid.New(), uuid.New(), 25_000, "", time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if err := created.ReadyToConfirm(); !errors.Is(err, ErrIncompleteCapture) {
		t.Fatalf("expected incomplete capture error, got %v", err)
	}
}

func TestConfirmedCaptureCannotBeReviewedAgain(t *testing.T) {
	created, err := New(uuid.New(), uuid.New(), 25_000, "", time.Now())
	if err != nil {
		t.Fatal(err)
	}
	created.Status = StatusConfirmed
	if err := created.Review(uuid.New(), ledger.KindExpense, 25_000, "", time.Now()); !errors.Is(err, ErrAlreadyConfirmed) {
		t.Fatalf("expected already confirmed error, got %v", err)
	}
}
