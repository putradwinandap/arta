package finance

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// createTestUser keeps finance integration fixtures valid now that household
// ownership is backed by a real users foreign key. Finance tests do not need
// to authenticate, so the password hash is an intentionally inert fixture.
func createTestUser(t *testing.T, pool *pgxpool.Pool) uuid.UUID {
	t.Helper()

	id := uuid.New()
	email := "finance-test-" + id.String() + "@example.test"
	if _, err := pool.Exec(context.Background(), `
		INSERT INTO users (id, email, password_hash)
		VALUES ($1, $2, $3)
	`, id, email, "test-only-not-a-real-password-hash"); err != nil {
		t.Fatalf("create test user: %v", err)
	}

	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM users WHERE id = $1`, id)
	})
	return id
}
