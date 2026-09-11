package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var ErrInvalidInvite = errors.New("invalid invite")

const InviteLifetime = 7 * 24 * time.Hour

type HouseholdInvite struct {
	Token       string    `json:"token"`
	HouseholdID uuid.UUID `json:"householdId"`
	ExpiresAt   time.Time `json:"expiresAt"`
}

func (s *Service) CreateHouseholdInvite(ctx context.Context, userID, householdID uuid.UUID) (HouseholdInvite, error) {
	var role string
	if err := s.pool.QueryRow(ctx, `SELECT role FROM household_members WHERE household_id = $1 AND user_id = $2`, householdID, userID).Scan(&role); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return HouseholdInvite{}, ErrForbidden
		}
		return HouseholdInvite{}, err
	}
	if role != "owner" {
		return HouseholdInvite{}, ErrForbidden
	}

	token, err := newInviteToken()
	if err != nil {
		return HouseholdInvite{}, err
	}
	expiresAt := s.now().Add(InviteLifetime)
	hash := tokenHash(token)
	_, err = s.pool.Exec(ctx, `INSERT INTO household_invites (id, household_id, created_by_user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4, $5)`, uuid.New(), householdID, userID, hash[:], expiresAt)
	if err != nil {
		return HouseholdInvite{}, err
	}
	return HouseholdInvite{Token: token, HouseholdID: householdID, ExpiresAt: expiresAt}, nil
}

func (s *Service) RedeemHouseholdInvite(ctx context.Context, userID uuid.UUID, token string) (uuid.UUID, error) {
	if token == "" {
		return uuid.Nil, ErrInvalidInvite
	}
	hash := tokenHash(token)
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return uuid.Nil, err
	}
	defer tx.Rollback(ctx)

	var inviteID, householdID uuid.UUID
	err = tx.QueryRow(ctx, `SELECT id, household_id FROM household_invites WHERE token_hash = $1 AND redeemed_at IS NULL AND expires_at > $2 FOR UPDATE`, hash[:], s.now()).Scan(&inviteID, &householdID)
	if errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, ErrInvalidInvite
	}
	if err != nil {
		return uuid.Nil, err
	}

	_, err = tx.Exec(ctx, `INSERT INTO household_members (id, household_id, subject_id, user_id, role) VALUES ($1, $2, $3, $4, 'member') ON CONFLICT (household_id, user_id) WHERE user_id IS NOT NULL DO NOTHING`, uuid.New(), householdID, userID, userID)
	if err != nil {
		return uuid.Nil, err
	}
	if _, err = tx.Exec(ctx, `UPDATE household_invites SET redeemed_at = $2, redeemed_by_user_id = $3 WHERE id = $1`, inviteID, s.now(), userID); err != nil {
		return uuid.Nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return uuid.Nil, err
	}
	return householdID, nil
}

func newInviteToken() (string, error) {
	buffer := make([]byte, 24)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buffer), nil
}
