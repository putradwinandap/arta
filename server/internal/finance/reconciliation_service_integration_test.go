package finance

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/putradwinandap/arta/server/internal/ledger"
	"github.com/putradwinandap/arta/server/internal/wallet"
)

// This test runs with the repository's PostgreSQL integration-test harness.
func TestReconciliationAdjustmentPreservesReportingSemantics(t *testing.T) {
	pool := integrationPool(t)
	ctx := context.Background()
	s := NewService(pool)
	h, err := s.CreateHousehold(ctx,"Reconcile household",uuid.New()); if err != nil { t.Fatal(err) }
	w, err := s.CreateWallet(ctx,h.ID,"Bank",wallet.TypeBank,"IDR"); if err != nil { t.Fatal(err) }
	if _,err=s.CreateTransaction(ctx,h.ID,w.ID,ledger.KindIncome,1_000_000,s.now(),"opening deposit");err!=nil{t.Fatal(err)}
	r,err:=s.CreateReconciliation(ctx,h.ID,w.ID,850_000);if err!=nil{t.Fatal(err)}
	if r.DiscrepancyMinor!=-150_000||r.Status!="unresolved"{t.Fatalf("unexpected reconciliation: %+v",r)}
	totalsBefore,err:=s.HouseholdTotals(ctx,h.ID);if err!=nil{t.Fatal(err)}
	resolved,err:=s.ResolveReconciliationWithAdjustment(ctx,h.ID,r.ID,"historical bank difference");if err!=nil{t.Fatal(err)}
	if resolved.Status!="reconciled"||resolved.AdjustmentID==nil{t.Fatalf("unexpected resolved: %+v",resolved)}
	balances,err:=s.WalletBalances(ctx,h.ID);if err!=nil{t.Fatal(err)}
	if len(balances)!=1||balances[0].AmountMinor!=850_000{t.Fatalf("adjusted balance=%+v",balances)}
	totalsAfter,err:=s.HouseholdTotals(ctx,h.ID);if err!=nil{t.Fatal(err)}
	if totalsAfter!=totalsBefore{t.Fatalf("adjustment polluted totals: before=%+v after=%+v",totalsBefore,totalsAfter)}
	zero,err:=s.CreateReconciliation(ctx,h.ID,w.ID,850_000);if err!=nil{t.Fatal(err)}
	if zero.Status!="reconciled"||zero.DiscrepancyMinor!=0{t.Fatalf("zero discrepancy should reconcile: %+v",zero)}
}
