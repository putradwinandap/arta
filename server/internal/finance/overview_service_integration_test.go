package finance

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/putradwinandap/arta/server/internal/ledger"
	"github.com/putradwinandap/arta/server/internal/wallet"
)

func TestHouseholdOverviewDerivesTrustedFinancialState(t *testing.T) {
	databaseURL := os.Getenv("ARTA_DATABASE_URL")
	if databaseURL == "" { t.Skip("ARTA_DATABASE_URL is required for PostgreSQL integration test") }
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil { t.Fatal(err) }
	defer pool.Close()
	service := NewService(pool)
	service.now = func() time.Time { return time.Date(2026, 9, 10, 12, 0, 0, 0, time.UTC) }
	house, err := service.CreateHousehold(ctx, "Overview Household", uuid.New())
	if err != nil { t.Fatal(err) }
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM reconciliation_cases WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM balance_adjustments WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM goal_reservation_events WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM financial_goals WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM budgets WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM transfers WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM transactions WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM wallets WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM household_members WHERE household_id=$1`, house.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM households WHERE id=$1`, house.ID)
	})

	checking, _ := service.CreateWallet(ctx, house.ID, "Checking", wallet.TypeBank, "IDR")
	savings, _ := service.CreateWallet(ctx, house.ID, "Savings", wallet.TypeBank, "IDR")
	at := service.now()
	_, _ = service.CreateTransaction(ctx, house.ID, checking.ID, ledger.KindIncome, 1_000_000, at, "salary")
	_, _ = service.CreateTransaction(ctx, house.ID, checking.ID, ledger.KindExpense, 100_000, at, "groceries")
	_, _ = service.CreateTransfer(ctx, house.ID, checking.ID, savings.ID, 200_000, at, "save")
	budgetSummary, err := service.CreateBudget(ctx, house.ID, "IDR", time.Date(2026,9,1,0,0,0,0,time.UTC), time.Date(2026,9,30,0,0,0,0,time.UTC), 500_000)
	if err != nil { t.Fatal(err) }
	goalSummary, err := service.CreateGoal(ctx, house.ID, "Emergency", "IDR", 400_000)
	if err != nil { t.Fatal(err) }
	if _, err = service.ReserveGoalFunds(ctx, house.ID, goalSummary.ID, savings.ID, 150_000); err != nil { t.Fatal(err) }

	overview, err := service.GetHouseholdOverview(ctx, house.ID)
	if err != nil { t.Fatal(err) }
	if len(overview.Balances) != 2 { t.Fatalf("expected two balances, got %d", len(overview.Balances)) }
	var physical, reserved, available int64
	for _, b := range overview.Balances { physical += b.AmountMinor; reserved += b.ReservedMinor; available += b.AvailableMinor }
	if physical != 900_000 || reserved != 150_000 || available != 750_000 { t.Fatalf("unexpected balance totals: physical=%d reserved=%d available=%d", physical,reserved,available) }
	if len(overview.CurrentBudgets) != 1 || overview.CurrentBudgets[0].ID != budgetSummary.ID || overview.CurrentBudgets[0].SpentMinor != 100_000 { t.Fatalf("unexpected current budget: %+v", overview.CurrentBudgets) }
	if len(overview.ActiveGoals) != 1 || overview.ActiveGoals[0].ReservedMinor != 150_000 { t.Fatalf("unexpected active goals: %+v", overview.ActiveGoals) }
	if len(overview.RecentActivity) != 3 { t.Fatalf("expected three recent activities, got %d", len(overview.RecentActivity)) }
	seen := map[string]bool{}
	for _, item := range overview.RecentActivity { seen[item.Type] = true }
	if !seen["income"] || !seen["expense"] || !seen["transfer"] { t.Fatalf("activity semantics missing: %+v", seen) }
}
