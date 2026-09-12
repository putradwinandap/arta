package auth

import (
	"context"
	"crypto/sha256"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailInUse         = errors.New("email already in use")
	ErrUnauthenticated    = errors.New("unauthenticated")
	ErrForbidden          = errors.New("forbidden")
)

const SessionLifetime = 30 * 24 * time.Hour

type User struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
}

type HouseholdMembership struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Role string    `json:"role"`
}

type Service struct {
	pool *pgxpool.Pool
	now  func() time.Time
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool, now: time.Now} }
func NormalizeEmail(email string) string { return strings.ToLower(strings.TrimSpace(email)) }

func (s *Service) Register(ctx context.Context, email, password string) (User, string, time.Time, error) {
	email = NormalizeEmail(email)
	if email == "" || !strings.Contains(email, "@") { return User{}, "", time.Time{}, ErrInvalidCredentials }
	passwordHash, err := HashPassword(password); if err != nil { return User{}, "", time.Time{}, err }
	user := User{ID: uuid.New(), Email: email}
	tx, err := s.pool.Begin(ctx); if err != nil { return User{}, "", time.Time{}, err }; defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)`, user.ID, user.Email, passwordHash); err != nil {
		var existing uuid.UUID
		if lookupErr := tx.QueryRow(ctx, `SELECT id FROM users WHERE email = $1`, email).Scan(&existing); lookupErr == nil { return User{}, "", time.Time{}, ErrEmailInUse }
		return User{}, "", time.Time{}, err
	}
	token, expiresAt, err := createSession(ctx, tx, user.ID, s.now()); if err != nil { return User{}, "", time.Time{}, err }
	if err := tx.Commit(ctx); err != nil { return User{}, "", time.Time{}, err }
	return user, token, expiresAt, nil
}

func (s *Service) Login(ctx context.Context, email, password string) (User, string, time.Time, error) {
	email = NormalizeEmail(email)
	var user User; var passwordHash string
	if err := s.pool.QueryRow(ctx, `SELECT id, email, password_hash FROM users WHERE email = $1`, email).Scan(&user.ID, &user.Email, &passwordHash); err != nil {
		if errors.Is(err, pgx.ErrNoRows) { return User{}, "", time.Time{}, ErrInvalidCredentials }; return User{}, "", time.Time{}, err
	}
	if !VerifyPassword(password, passwordHash) { return User{}, "", time.Time{}, ErrInvalidCredentials }
	tx, err := s.pool.Begin(ctx); if err != nil { return User{}, "", time.Time{}, err }; defer tx.Rollback(ctx)
	token, expiresAt, err := createSession(ctx, tx, user.ID, s.now()); if err != nil { return User{}, "", time.Time{}, err }
	if err := tx.Commit(ctx); err != nil { return User{}, "", time.Time{}, err }
	return user, token, expiresAt, nil
}

func (s *Service) UserForToken(ctx context.Context, token string) (User, error) {
	if token == "" { return User{}, ErrUnauthenticated }
	hash := tokenHash(token); var user User
	err := s.pool.QueryRow(ctx, `SELECT u.id, u.email FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > $2`, hash[:], s.now()).Scan(&user.ID, &user.Email)
	if errors.Is(err, pgx.ErrNoRows) { return User{}, ErrUnauthenticated }; return user, err
}

func (s *Service) Logout(ctx context.Context, token string) error {
	if token == "" { return nil }; hash := tokenHash(token); _, err := s.pool.Exec(ctx, `DELETE FROM user_sessions WHERE token_hash = $1`, hash[:]); return err
}

func (s *Service) ListHouseholds(ctx context.Context, userID uuid.UUID) ([]HouseholdMembership, error) {
	rows, err := s.pool.Query(ctx, `SELECT h.id, h.name, hm.role FROM household_members hm JOIN households h ON h.id = hm.household_id WHERE hm.user_id = $1 ORDER BY h.created_at, h.id`, userID)
	if err != nil { return nil, err }
	defer rows.Close()
	memberships := make([]HouseholdMembership, 0)
	for rows.Next() {
		var membership HouseholdMembership
		if err := rows.Scan(&membership.ID, &membership.Name, &membership.Role); err != nil { return nil, err }
		memberships = append(memberships, membership)
	}
	return memberships, rows.Err()
}

func (s *Service) IsHouseholdMember(ctx context.Context, userID, householdID uuid.UUID) (bool, error) {
	var exists bool; err := s.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM household_members WHERE household_id = $1 AND user_id = $2)`, householdID, userID).Scan(&exists); return exists, err
}

func createSession(ctx context.Context, tx pgx.Tx, userID uuid.UUID, now time.Time) (string, time.Time, error) {
	token, err := NewSessionToken(); if err != nil { return "", time.Time{}, err }; expiresAt := now.Add(SessionLifetime); hash := tokenHash(token)
	_, err = tx.Exec(ctx, `INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)`, uuid.New(), userID, hash[:], expiresAt)
	if err != nil { return "", time.Time{}, err }; return token, expiresAt, nil
}
func tokenHash(token string) [sha256.Size]byte { return sha256.Sum256([]byte(token)) }
