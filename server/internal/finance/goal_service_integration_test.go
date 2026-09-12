package finance

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/putradwinandap/arta/server/internal/goal"
	"github.com/putradwinandap/arta/server/internal/ledger"
	"github.com/putradwinandap/arta/server/internal/wallet"
)

func TestGoalReservationUsesRealAvailableFunds(t *testing.T) {
	url := os.Getenv("ARTA_DATABASE_URL")
	if url == "" {
		t.Skip("ARTA_DATABASE_URL is required")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	s := NewService(pool)
	ownerID := createTestUser(t, pool)
	h, err := s.CreateHousehold(ctx, "Goal Household", ownerID)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM goal_reservation_events WHERE household_id=$1`, h.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM financial_goals WHERE household_id=$1`, h.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM transfers WHERE household_id=$1`, h.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM transactions WHERE household_id=$1`, h.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM wallets WHERE household_id=$1`, h.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM households WHERE id=$1`, h.ID)
	})
	w, _ := s.CreateWallet(ctx, h.ID, "Savings", wallet.TypeBank, "IDR")
	_, err = s.CreateTransaction(ctx, h.ID, w.ID, ledger.KindIncome, 1_000_000, time.Now(), "opening money")
	if err != nil {
		t.Fatal(err)
	}
	g1, err := s.CreateGoal(ctx, h.ID, "Laptop", "IDR", 800_000)
	if err != nil {
		t.Fatal(err)
	}
	g2, _ := s.CreateGoal(ctx, h.ID, "Holiday", "IDR", 500_000)
	g1, err = s.ReserveGoalFunds(ctx, h.ID, g1.ID, w.ID, 600_000)
	if err != nil {
		t.Fatal(err)
	}
	if g1.ReservedMinor != 600_000 || g1.RemainingMinor != 200_000 {
		t.Fatalf("bad progress: %+v", g1)
	}
	_, err = s.ReserveGoalFunds(ctx, h.ID, g2.ID, w.ID, 500_000)
	if !errors.Is(err, goal.ErrInsufficientAvailable) {
		t.Fatalf("expected double-reserve prevention, got %v", err)
	}
	g1, err = s.ReleaseGoalFunds(ctx, h.ID, g1.ID, w.ID, 100_000)
	if err != nil {
		t.Fatal(err)
	}
	if g1.ReservedMinor != 500_000 {
		t.Fatalf("bad release: %+v", g1)
	}
	_, err = s.ReleaseGoalFunds(ctx, h.ID, g1.ID, w.ID, 600_000)
	if !errors.Is(err, goal.ErrInsufficientReserved) {
		t.Fatalf("expected release boundary, got %v", err)
	}
	balances, err := s.WalletAvailableBalances(ctx, h.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(balances) != 1 || balances[0].AmountMinor != 1_000_000 || balances[0].ReservedMinor != 500_000 || balances[0].AvailableMinor != 500_000 {
		t.Fatalf("bad availability: %+v", balances)
	}
	_, err = s.ArchiveGoal(ctx, h.ID, g1.ID)
	if err != nil {
		t.Fatal(err)
	}
	_, err = s.ReserveGoalFunds(ctx, h.ID, g1.ID, w.ID, 1)
	if !errors.Is(err, goal.ErrArchived) {
		t.Fatalf("expected archived rejection, got %v", err)
	}
}
