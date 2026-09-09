package finance

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/putradwinandap/arta/server/internal/ledger"
	"github.com/putradwinandap/arta/server/internal/wallet"
)

func TestHouseholdWalletAndLedgerPersistenceFlow(t *testing.T) {
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
		cleanupCtx := context.Background()
		_, _ = pool.Exec(cleanupCtx, `DELETE FROM transfers WHERE household_id = $1`, house.ID)
		_, _ = pool.Exec(cleanupCtx, `DELETE FROM transactions WHERE household_id = $1`, house.ID)
		_, _ = pool.Exec(cleanupCtx, `DELETE FROM wallets WHERE household_id = $1`, house.ID)
		_, _ = pool.Exec(cleanupCtx, `DELETE FROM households WHERE id = $1`, house.ID)
	})

	first, err := service.CreateWallet(ctx, house.ID, "Cash", wallet.TypeCash, "idr")
	if err != nil {
		t.Fatalf("CreateWallet(first) error = %v", err)
	}
	second, err := service.CreateWallet(ctx, house.ID, "Bank", wallet.TypeBank, "IDR")
	if err != nil {
		t.Fatalf("CreateWallet(second) error = %v", err)
	}

	when := time.Date(2026, 9, 9, 12, 0, 0, 0, time.UTC)
	if _, err := service.CreateTransaction(ctx, house.ID, first.ID, ledger.KindIncome, 1_000_000, when, "salary"); err != nil {
		t.Fatalf("CreateTransaction(income) error = %v", err)
	}
	if _, err := service.CreateTransaction(ctx, house.ID, first.ID, ledger.KindExpense, 250_000, when.Add(time.Minute), "groceries"); err != nil {
		t.Fatalf("CreateTransaction(expense) error = %v", err)
	}
	if _, err := service.CreateTransfer(ctx, house.ID, first.ID, second.ID, 300_000, when.Add(2*time.Minute), "move to bank"); err != nil {
		t.Fatalf("CreateTransfer() error = %v", err)
	}

	balances, err := service.WalletBalances(ctx, house.ID)
	if err != nil {
		t.Fatalf("WalletBalances() error = %v", err)
	}
	balanceByID := map[uuid.UUID]int64{}
	for _, balance := range balances {
		balanceByID[balance.WalletID] = balance.AmountMinor
	}
	if balanceByID[first.ID] != 450_000 {
		t.Fatalf("expected source balance 450000, got %d", balanceByID[first.ID])
	}
	if balanceByID[second.ID] != 300_000 {
		t.Fatalf("expected destination balance 300000, got %d", balanceByID[second.ID])
	}

	totals, err := service.HouseholdTotals(ctx, house.ID)
	if err != nil {
		t.Fatalf("HouseholdTotals() error = %v", err)
	}
	if totals.IncomeMinor != 1_000_000 || totals.ExpenseMinor != 250_000 {
		t.Fatalf("transfer must not affect totals, got %+v", totals)
	}

	activity, err := service.ListActivity(ctx, house.ID)
	if err != nil {
		t.Fatalf("ListActivity() error = %v", err)
	}
	if len(activity) != 3 || activity[0].Type != "transfer" {
		t.Fatalf("unexpected activity: %+v", activity)
	}

	if _, err := service.CreateTransfer(ctx, house.ID, first.ID, first.ID, 100, when, ""); !errors.Is(err, ledger.ErrSelfTransfer) {
		t.Fatalf("expected self transfer error, got %v", err)
	}
	if _, err := service.CreateTransaction(ctx, house.ID, first.ID, ledger.KindExpense, 0, when, ""); !errors.Is(err, ledger.ErrInvalidAmount) {
		t.Fatalf("expected invalid amount, got %v", err)
	}

	archived, err := service.ArchiveWallet(ctx, house.ID, second.ID)
	if err != nil {
		t.Fatalf("ArchiveWallet() error = %v", err)
	}
	if archived.Status != wallet.StatusArchived {
		t.Fatalf("expected archived wallet")
	}
	if _, err := service.CreateTransaction(ctx, house.ID, second.ID, ledger.KindIncome, 100, when, ""); !errors.Is(err, ledger.ErrArchivedWallet) {
		t.Fatalf("expected archived wallet error, got %v", err)
	}
}
