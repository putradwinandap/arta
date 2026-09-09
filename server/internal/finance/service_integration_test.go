package finance

import (
	"context"
	"errors"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/putradwinandap/arta/server/internal/wallet"
)

func TestHouseholdAndWalletPersistenceFlow(t *testing.T) {
	databaseURL := os.Getenv("ARTA_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("ARTA_DATABASE_URL is required for PostgreSQL integration test")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatalf("open pool: %v", err)
	}
	defer pool.Close()

	service := NewService(pool)
	ownerID := uuid.New()
	house, err := service.CreateHousehold(ctx, "Integration Household", ownerID)
	if err != nil {
		t.Fatalf("CreateHousehold() error = %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM households WHERE id = $1`, house.ID)
	})

	loadedHouse, err := service.GetHousehold(ctx, house.ID)
	if err != nil {
		t.Fatalf("GetHousehold() error = %v", err)
	}
	if loadedHouse.Name != house.Name {
		t.Fatalf("expected household %q, got %q", house.Name, loadedHouse.Name)
	}

	first, err := service.CreateWallet(ctx, house.ID, "Cash", wallet.TypeCash, "idr")
	if err != nil {
		t.Fatalf("CreateWallet(first) error = %v", err)
	}
	second, err := service.CreateWallet(ctx, house.ID, "Bank", wallet.TypeBank, "IDR")
	if err != nil {
		t.Fatalf("CreateWallet(second) error = %v", err)
	}

	wallets, err := service.ListWallets(ctx, house.ID)
	if err != nil {
		t.Fatalf("ListWallets() error = %v", err)
	}
	if len(wallets) != 2 {
		t.Fatalf("expected 2 wallets, got %d", len(wallets))
	}

	updated, err := service.UpdateWallet(ctx, house.ID, first.ID, "Daily Cash", wallet.TypeCash)
	if err != nil {
		t.Fatalf("UpdateWallet() error = %v", err)
	}
	if updated.Name != "Daily Cash" {
		t.Fatalf("expected updated name, got %q", updated.Name)
	}

	archived, err := service.ArchiveWallet(ctx, house.ID, second.ID)
	if err != nil {
		t.Fatalf("ArchiveWallet() error = %v", err)
	}
	if archived.Status != wallet.StatusArchived || archived.ArchivedAt == nil {
		t.Fatalf("expected archived wallet, got %+v", archived)
	}

	if _, err := service.UpdateWallet(ctx, house.ID, second.ID, "Should Fail", wallet.TypeOther); !errors.Is(err, wallet.ErrWalletArchived) {
		t.Fatalf("expected ErrWalletArchived, got %v", err)
	}

	loadedWallet, err := service.GetWallet(ctx, house.ID, second.ID)
	if err != nil {
		t.Fatalf("GetWallet() error = %v", err)
	}
	if loadedWallet.Status != wallet.StatusArchived {
		t.Fatalf("expected archived status from database, got %q", loadedWallet.Status)
	}
}
