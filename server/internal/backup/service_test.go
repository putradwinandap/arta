package backup

import (
	"encoding/json"
	"testing"

	"github.com/google/uuid"
)

func validSnapshot(id uuid.UUID) Snapshot {
	return Snapshot{Format: Format, Version: Version, HouseholdID: id, Tables: map[string][]json.RawMessage{
		"households":              {json.RawMessage(`{"id":"` + id.String() + `"}`)},
		"household_members":       {},
		"wallets":                 {},
		"transactions":            {},
		"transfers":               {},
		"transaction_captures":    {},
		"budgets":                 {},
		"financial_goals":         {},
		"goal_reservation_events": {},
		"balance_adjustments":     {},
		"wallet_reconciliations":  {},
	}}
}

func TestValidateAcceptsSupportedSnapshot(t *testing.T) {
	id := uuid.New()
	if err := Validate(validSnapshot(id), id); err != nil {
		t.Fatal(err)
	}
}

func TestValidateRejectsHouseholdMismatch(t *testing.T) {
	a, b := uuid.New(), uuid.New()
	if err := Validate(validSnapshot(a), b); err != ErrHouseholdMismatch {
		t.Fatalf("got %v", err)
	}
}

func TestValidateRejectsMissingTable(t *testing.T) {
	id := uuid.New()
	s := validSnapshot(id)
	delete(s.Tables, "transactions")
	if err := Validate(s, id); err != ErrInvalidBackup {
		t.Fatalf("got %v", err)
	}
}

func TestSnapshotJSONPreservesLargeIntegerLexeme(t *testing.T) {
	id := uuid.New()
	s := validSnapshot(id)
	s.Tables["transactions"] = []json.RawMessage{json.RawMessage(`{"id":"` + uuid.NewString() + `","household_id":"` + id.String() + `","amount_minor":9007199254740993}`)}

	encoded, err := json.Marshal(s)
	if err != nil {
		t.Fatal(err)
	}
	if !containsBytes(encoded, []byte(`"amount_minor":9007199254740993`)) {
		t.Fatalf("large exact money value was rewritten: %s", encoded)
	}
}

func containsBytes(haystack, needle []byte) bool {
	if len(needle) == 0 {
		return true
	}
	for i := 0; i+len(needle) <= len(haystack); i++ {
		match := true
		for j := range needle {
			if haystack[i+j] != needle[j] {
				match = false
				break
			}
		}
		if match {
			return true
		}
	}
	return false
}
