package budget

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestNewAndSummary(t *testing.T) {
	start := time.Date(2026, 9, 1, 14, 0, 0, 0, time.FixedZone("WIB", 7*60*60))
	end := time.Date(2026, 9, 30, 20, 0, 0, 0, time.FixedZone("WIB", 7*60*60))
	value, err := New(uuid.New(), " idr ", start, end, 1_000_000)
	if err != nil {
		t.Fatal(err)
	}
	if value.Currency != "IDR" {
		t.Fatalf("currency = %q", value.Currency)
	}
	if value.PeriodStart.Hour() != 0 || value.PeriodEnd.Hour() != 0 {
		t.Fatal("periods must be normalized to dates")
	}

	summary := Summarize(value, 1_250_000)
	if summary.RemainingMinor != -250_000 {
		t.Fatalf("remaining = %d", summary.RemainingMinor)
	}
}

func TestNewRejectsInvalidBoundaries(t *testing.T) {
	householdID := uuid.New()
	cases := []struct {
		name       string
		currency   string
		start, end time.Time
		amount     int64
	}{
		{"zero amount", "IDR", time.Now(), time.Now(), 0},
		{"bad currency", "ID", time.Now(), time.Now(), 1},
		{"reversed period", "IDR", time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC), time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC), 1},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := New(householdID, tc.currency, tc.start, tc.end, tc.amount); err == nil {
				t.Fatal("expected error")
			}
		})
	}
}
