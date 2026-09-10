package goal

import (
	"errors"
	"testing"

	"github.com/google/uuid"
)

func TestGoalNormalizesAndSummarizes(t *testing.T) {
	value, err := New(uuid.New(), "  Emergency Fund  ", "idr", 1_000_000)
	if err != nil { t.Fatal(err) }
	if value.Name != "Emergency Fund" || value.Currency != "IDR" { t.Fatalf("unexpected normalization: %+v", value) }
	summary := Summarize(value, 250_000)
	if summary.ReservedMinor != 250_000 || summary.RemainingMinor != 750_000 { t.Fatalf("unexpected summary: %+v", summary) }
}

func TestGoalRemainingFloorsAtZero(t *testing.T) {
	value, _ := New(uuid.New(), "Laptop", "IDR", 1_000)
	if got := Summarize(value, 1_250).RemainingMinor; got != 0 { t.Fatalf("remaining = %d", got) }
}

func TestGoalRejectsInvalidInput(t *testing.T) {
	if _, err := New(uuid.Nil, "Goal", "IDR", 1); !errors.Is(err, ErrInvalidHousehold) { t.Fatalf("expected household error, got %v", err) }
	if _, err := New(uuid.New(), " ", "IDR", 1); !errors.Is(err, ErrInvalidName) { t.Fatalf("expected name error, got %v", err) }
	if _, err := New(uuid.New(), "Goal", "RP", 1); !errors.Is(err, ErrInvalidCurrency) { t.Fatalf("expected currency error, got %v", err) }
	if _, err := New(uuid.New(), "Goal", "IDR", 0); !errors.Is(err, ErrInvalidTarget) { t.Fatalf("expected target error, got %v", err) }
}
