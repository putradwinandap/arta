package finance

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/putradwinandap/arta/server/internal/budget"
	"github.com/putradwinandap/arta/server/internal/ledger"
	"github.com/putradwinandap/arta/server/internal/wallet"
)

func TestBudgetCountsOnlyEligibleConfirmedExpenses(t *testing.T) {
	databaseURL := os.Getenv("ARTA_DATABASE_URL")
	if databaseURL == "" { t.Skip("ARTA_DATABASE_URL is required for PostgreSQL integration test") }
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL); if err != nil { t.Fatal(err) }; defer pool.Close()
	service := NewService(pool)
	house, err := service.CreateHousehold(ctx, "Budget Household", uuid.New()); if err != nil { t.Fatal(err) }
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM transaction_captures WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM budgets WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM transfers WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM transactions WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM wallets WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM households WHERE id=$1`, house.ID)
	})

	idr, _ := service.CreateWallet(ctx, house.ID, "IDR", wallet.TypeCash, "IDR")
	usd, _ := service.CreateWallet(ctx, house.ID, "USD", wallet.TypeCash, "USD")
	created, err := service.CreateBudget(ctx, house.ID, "idr", time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC), time.Date(2026, 9, 30, 0, 0, 0, 0, time.UTC), 500_000)
	if err != nil { t.Fatal(err) }
	if created.SpentMinor != 0 || created.RemainingMinor != 500_000 { t.Fatalf("unexpected initial summary: %+v", created) }

	inside := time.Date(2026, 9, 10, 12, 0, 0, 0, time.UTC)
	_, _ = service.CreateTransaction(ctx, house.ID, idr.ID, ledger.KindExpense, 125_000, inside, "eligible")
	_, _ = service.CreateTransaction(ctx, house.ID, idr.ID, ledger.KindIncome, 900_000, inside, "income")
	_, _ = service.CreateTransaction(ctx, house.ID, idr.ID, ledger.KindExpense, 75_000, time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC), "outside")
	_, _ = service.CreateTransaction(ctx, house.ID, usd.ID, ledger.KindExpense, 50, inside, "other currency")
	_, _ = service.CreateTransfer(ctx, house.ID, idr.ID, idr.ID, 10_000, inside, "rejected self transfer")
	captureID := uuid.New(); _, _ = service.CreateCapture(ctx, captureID, house.ID, 80_000, "pending", inside)

	summary, err := service.GetBudget(ctx, house.ID, created.ID); if err != nil { t.Fatal(err) }
	if summary.SpentMinor != 125_000 || summary.RemainingMinor != 375_000 { t.Fatalf("budget counted ineligible money: %+v", summary) }

	_, err = service.CreateBudget(ctx, house.ID, "IDR", time.Date(2026, 9, 15, 0, 0, 0, 0, time.UTC), time.Date(2026, 10, 15, 0, 0, 0, 0, time.UTC), 1)
	if !errors.Is(err, budget.ErrOverlap) { t.Fatalf("expected overlap error, got %v", err) }
}
