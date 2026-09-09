package household

import (
	"errors"
	"strings"

	"github.com/google/uuid"
)

var (
	ErrInvalidHouseholdName = errors.New("household name must be between 1 and 120 characters")
	ErrInvalidSubjectID     = errors.New("subject id is required")
)

type Household struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

type Membership struct {
	ID          uuid.UUID `json:"id"`
	HouseholdID uuid.UUID `json:"householdId"`
	SubjectID   uuid.UUID `json:"subjectId"`
}

func New(name string) (Household, error) {
	name = strings.TrimSpace(name)
	if len(name) == 0 || len(name) > 120 {
		return Household{}, ErrInvalidHouseholdName
	}

	return Household{ID: uuid.New(), Name: name}, nil
}

func NewMembership(householdID, subjectID uuid.UUID) (Membership, error) {
	if householdID == uuid.Nil || subjectID == uuid.Nil {
		return Membership{}, ErrInvalidSubjectID
	}

	return Membership{
		ID:          uuid.New(),
		HouseholdID: householdID,
		SubjectID:   subjectID,
	}, nil
}
