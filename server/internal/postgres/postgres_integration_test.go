package postgres

import (
	"context"
	"os"
	"testing"
)

func TestPostgresIntegration(t *testing.T) {
	databaseURL := os.Getenv("ARTA_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("ARTA_DATABASE_URL is not set")
	}

	pool, err := Open(context.Background(), databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	var value string
	if err := pool.QueryRow(context.Background(), "SELECT value FROM system_metadata WHERE key = 'schema_initialized'").Scan(&value); err != nil {
		t.Fatal(err)
	}
	if value != "true" {
		t.Fatalf("expected schema_initialized=true, got %q", value)
	}
}
