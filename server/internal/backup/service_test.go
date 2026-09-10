package backup

import (
	"github.com/google/uuid"
	"testing"
)

func validSnapshot(id uuid.UUID) Snapshot {
	return Snapshot{Format: Format, Version: Version, HouseholdID: id, Tables: map[string][]map[string]any{"households": {{"id": id.String()}}, "household_members": {}, "wallets": {}, "transactions": {}, "transfers": {}, "transaction_captures": {}, "budgets": {}, "financial_goals": {}, "goal_reservation_events": {}, "balance_adjustments": {}, "wallet_reconciliations": {}}}
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
