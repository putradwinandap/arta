package finance

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/putradwinandap/arta/server/internal/budget"
	"github.com/putradwinandap/arta/server/internal/goal"
)

type HouseholdOverview struct {
	Balances       []WalletBalance `json:"balances"`
	Totals         HouseholdTotals `json:"totals"`
	CurrentBudgets []budget.Summary `json:"currentBudgets"`
	ActiveGoals    []goal.Summary  `json:"activeGoals"`
	Activity       []Activity      `json:"activity"`
	RecentActivity []Activity      `json:"recentActivity"`
}

// GetHouseholdOverview derives one landing-page view from existing trusted
// financial records. It does not persist duplicate balance or progress state.
func (s *Service) GetHouseholdOverview(ctx context.Context, householdID uuid.UUID) (HouseholdOverview, error) {
	balances, err := s.WalletAvailableBalances(ctx, householdID)
	if err != nil {
		return HouseholdOverview{}, err
	}
	totals, err := s.HouseholdTotals(ctx, householdID)
	if err != nil {
		return HouseholdOverview{}, err
	}
	budgets, err := s.ListBudgets(ctx, householdID)
	if err != nil {
		return HouseholdOverview{}, err
	}
	goals, err := s.ListGoals(ctx, householdID)
	if err != nil {
		return HouseholdOverview{}, err
	}
	activity, err := s.ListActivity(ctx, householdID)
	if err != nil {
		return HouseholdOverview{}, err
	}

	today := s.now().UTC().Truncate(24 * time.Hour)
	currentBudgets := make([]budget.Summary, 0)
	for _, item := range budgets {
		if !today.Before(item.PeriodStart) && !today.After(item.PeriodEnd) {
			currentBudgets = append(currentBudgets, item)
		}
	}
	activeGoals := make([]goal.Summary, 0)
	for _, item := range goals {
		if item.Status == goal.StatusActive {
			activeGoals = append(activeGoals, item)
		}
	}
	recentActivity := activity
	if len(recentActivity) > 10 {
		recentActivity = recentActivity[:10]
	}

	return HouseholdOverview{
		Balances: balances, Totals: totals, CurrentBudgets: currentBudgets,
		ActiveGoals: activeGoals, Activity: activity, RecentActivity: recentActivity,
	}, nil
}
