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

func TestHouseholdWalletLedgerAndCapturePersistenceFlow(t *testing.T) {
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
		_, _ = pool.Exec(cleanupCtx, `DELETE FROM transaction_captures WHERE household_id = $1`, house.ID)
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

	when := time.Date(2026, 9, 10, 12, 0, 0, 0, time.UTC)
	if _, err := service.CreateTransaction(ctx, house.ID, first.ID, ledger.KindIncome, 1_000_000, when, "salary"); err != nil {
		t.Fatalf("CreateTransaction(income) error = %v", err)
	}
	if _, err := service.CreateTransaction(ctx, house.ID, first.ID, ledger.KindExpense, 250_000, when.Add(time.Minute), "groceries"); err != nil {
		t.Fatalf("CreateTransaction(expense) error = %v", err)
	}
	if _, err := service.CreateTransfer(ctx, house.ID, first.ID, second.ID, 300_000, when.Add(2*time.Minute), "move to bank"); err != nil {
		t.Fatalf("CreateTransfer() error = %v", err)
	}

	captureID := uuid.New()
	pending, err := service.CreateCapture(ctx, captureID, house.ID, 25_000, "lunch", when.Add(3*time.Minute))
	if err != nil {
		t.Fatalf("CreateCapture() error = %v", err)
	}
	if pending.WalletID != nil || pending.Kind != nil {
		t.Fatalf("quick capture should be incomplete: %+v", pending)
	}

	duplicate, err := service.CreateCapture(ctx, captureID, house.ID, 99_999, "changed retry payload", when.Add(4*time.Minute))
	if err != nil {
		t.Fatalf("CreateCapture(retry) error = %v", err)
	}
	if duplicate.AmountMinor != 25_000 || duplicate.Note != "lunch" {
		t.Fatalf("stable capture id must be idempotent, got %+v", duplicate)
	}

	totalsBeforeConfirm, err := service.HouseholdTotals(ctx, house.ID)
	if err != nil {
		t.Fatal(err)
	}
	if totalsBeforeConfirm.IncomeMinor != 1_000_000 || totalsBeforeConfirm.ExpenseMinor != 250_000 {
		t.Fatalf("pending capture must not affect reporting totals: %+v", totalsBeforeConfirm)
	}

	reviewed, err := service.ReviewCapture(ctx, house.ID, captureID, first.ID, ledger.KindExpense, 25_000, "lunch")
	if err != nil {
		t.Fatalf("ReviewCapture() error = %v", err)
	}
	if reviewed.WalletID == nil || *reviewed.WalletID != first.ID || reviewed.Kind == nil || *reviewed.Kind != ledger.KindExpense {
		t.Fatalf("capture review not persisted: %+v", reviewed)
	}

	confirmed, err := service.ConfirmCapture(ctx, house.ID, captureID)
	if err != nil {
		t.Fatalf("ConfirmCapture() error = %v", err)
	}
	retried, err := service.ConfirmCapture(ctx, house.ID, captureID)
	if err != nil {
		t.Fatalf("ConfirmCapture(retry) error = %v", err)
	}
	if retried.ID != confirmed.ID {
		t.Fatalf("confirm retry created duplicate transaction: first=%s retry=%s", confirmed.ID, retried.ID)
	}

	pendingItems, err := service.ListPendingCaptures(ctx, house.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(pendingItems) != 0 {
		t.Fatalf("confirmed capture should leave inbox, got %+v", pendingItems)
	}

	balances, err := service.WalletBalances(ctx, house.ID)
	if err != nil {
		t.Fatalf("WalletBalances() error = %v", err)
	}
	balanceByID := map[uuid.UUID]int64{}
	for _, balance := range balances {
		balanceByID[balance.WalletID] = balance.AmountMinor
	}
	if balanceByID[first.ID] != 425_000 {
		t.Fatalf("expected source balance 425000 after confirmed capture, got %d", balanceByID[first.ID])
	}
	if balanceByID[second.ID] != 300_000 {
		t.Fatalf("expected destination balance 300000, got %d", balanceByID[second.ID])
	}

	totals, err := service.HouseholdTotals(ctx, house.ID)
	if err != nil {
		t.Fatalf("HouseholdTotals() error = %v", err)
	}
	if totals.IncomeMinor != 1_000_000 || totals.ExpenseMinor != 275_000 {
		t.Fatalf("confirmed capture should affect expense once while transfer stays excluded, got %+v", totals)
	}

	activity, err := service.ListActivity(ctx, house.ID)
	if err != nil {
		t.Fatalf("ListActivity() error = %v", err)
	}
	if len(activity) != 4 || activity[0].Note != "lunch" {
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
