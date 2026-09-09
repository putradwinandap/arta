package household

import (
	"testing"

	"github.com/google/uuid"
)

func TestNewHousehold(t *testing.T) {
	h, err := New("  Keluarga Dwi  ")
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if h.Name != "Keluarga Dwi" {
		t.Fatalf("expected trimmed name, got %q", h.Name)
	}
	if h.ID == uuid.Nil {
		t.Fatal("expected generated household ID")
	}
}

func TestNewHouseholdRejectsBlankName(t *testing.T) {
	if _, err := New("   "); err != ErrInvalidHouseholdName {
		t.Fatalf("expected ErrInvalidHouseholdName, got %v", err)
	}
}

func TestNewMembershipRequiresIDs(t *testing.T) {
	if _, err := NewMembership(uuid.Nil, uuid.New()); err != ErrInvalidSubjectID {
		t.Fatalf("expected invalid membership error, got %v", err)
	}

	m, err := NewMembership(uuid.New(), uuid.New())
	if err != nil {
		t.Fatalf("NewMembership() error = %v", err)
	}
	if m.ID == uuid.Nil {
		t.Fatal("expected generated membership ID")
	}
}
