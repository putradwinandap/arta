package wallet

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestNewWalletNormalizesCurrencyAndStartsActive(t *testing.T) {
	w, err := New(uuid.New(), "  Dompet Utama  ", TypeCash, "idr")
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if w.Name != "Dompet Utama" {
		t.Fatalf("expected trimmed name, got %q", w.Name)
	}
	if w.Currency != "IDR" {
		t.Fatalf("expected IDR, got %q", w.Currency)
	}
	if w.Status != StatusActive || w.ArchivedAt != nil {
		t.Fatalf("expected active wallet, got status=%q archivedAt=%v", w.Status, w.ArchivedAt)
	}
}

func TestNewWalletRejectsInvalidTypeAndCurrency(t *testing.T) {
	if _, err := New(uuid.New(), "Wallet", Type("crypto"), "IDR"); err != ErrInvalidType {
		t.Fatalf("expected ErrInvalidType, got %v", err)
	}
	if _, err := New(uuid.New(), "Wallet", TypeCash, "RUPIAH"); err != ErrInvalidCurrency {
		t.Fatalf("expected ErrInvalidCurrency, got %v", err)
	}
}

func TestArchivePreventsFurtherUpdate(t *testing.T) {
	w, err := New(uuid.New(), "Wallet", TypeBank, "IDR")
	if err != nil {
		t.Fatal(err)
	}
	archivedAt := time.Date(2026, 9, 9, 12, 0, 0, 0, time.FixedZone("WIB", 7*60*60))
	if err := w.Archive(archivedAt); err != nil {
		t.Fatal(err)
	}
	if w.Status != StatusArchived || w.ArchivedAt == nil || !w.ArchivedAt.Equal(archivedAt.UTC()) {
		t.Fatalf("archive state not preserved: %+v", w)
	}
	if err := w.Update("Changed", TypeOther); err != ErrWalletArchived {
		t.Fatalf("expected ErrWalletArchived, got %v", err)
	}
}
