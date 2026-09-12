package finance

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/putradwinandap/arta/server/internal/ledger"
	"github.com/putradwinandap/arta/server/internal/wallet"
)

func TestReconciliationAdjustmentPreservesReportingSemantics(t *testing.T) {
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
	h, err := s.CreateHousehold(ctx, "Reconcile Household", ownerID)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM wallet_reconciliations WHERE household_id=$1`, h.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM balance_adjustments WHERE household_id=$1`, h.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM transfers WHERE household_id=$1`, h.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM transactions WHERE household_id=$1`, h.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM wallets WHERE household_id=$1`, h.ID)
		_, _ = pool.Exec(context.Background(), `DELETE FROM households WHERE id=$1`, h.ID)
	})
	w, err := s.CreateWallet(ctx, h.ID, "Bank", wallet.TypeBank, "IDR")
	if err != nil {
		t.Fatal(err)
	}
	if _, err = s.CreateTransaction(ctx, h.ID, w.ID, ledger.KindIncome, 1_000_000, time.Now(), "opening deposit"); err != nil {
		t.Fatal(err)
	}
	r, err := s.CreateReconciliation(ctx, h.ID, w.ID, 850_000)
	if err != nil {
		t.Fatal(err)
	}
	if r.DiscrepancyMinor != -150_000 || r.Status != "unresolved" {
		t.Fatalf("unexpected reconciliation: %+v", r)
	}
	before, err := s.HouseholdTotals(ctx, h.ID)
	if err != nil {
		t.Fatal(err)
	}
	resolved, err := s.ResolveReconciliationWithAdjustment(ctx, h.ID, r.ID, "historical bank difference")
	if err != nil {
		t.Fatal(err)
	}
	if resolved.Status != "reconciled" || resolved.AdjustmentID == nil {
		t.Fatalf("unexpected resolved: %+v", resolved)
	}
	balances, err := s.WalletBalances(ctx, h.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(balances) != 1 || balances[0].AmountMinor != 850_000 {
		t.Fatalf("adjusted balance=%+v", balances)
	}
	after, err := s.HouseholdTotals(ctx, h.ID)
	if err != nil {
		t.Fatal(err)
	}
	if after != before {
		t.Fatalf("adjustment polluted totals: before=%+v after=%+v", before, after)
	}
	zero, err := s.CreateReconciliation(ctx, h.ID, w.ID, 850_000)
	if err != nil {
		t.Fatal(err)
	}
	if zero.Status != "reconciled" || zero.DiscrepancyMinor != 0 {
		t.Fatalf("zero discrepancy should reconcile: %+v", zero)
	}
}
