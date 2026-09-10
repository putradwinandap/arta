package httpserver

import (
	"net/http"
	"time"
)

func (h financeHandlers) createBudget(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok { return }
	var input struct {
		Currency    string `json:"currency"`
		PeriodStart string `json:"periodStart"`
		PeriodEnd   string `json:"periodEnd"`
		AmountMinor int64  `json:"amountMinor"`
	}
	if err := decodeJSON(r, &input); err != nil { writeError(w, http.StatusBadRequest, "invalid_json"); return }
	start, err := time.Parse("2006-01-02", input.PeriodStart)
	if err != nil { writeError(w, http.StatusBadRequest, "invalid_budget_period"); return }
	end, err := time.Parse("2006-01-02", input.PeriodEnd)
	if err != nil { writeError(w, http.StatusBadRequest, "invalid_budget_period"); return }
	created, err := h.service.CreateBudget(r.Context(), householdID, input.Currency, start, end, input.AmountMinor)
	if err != nil { handleFinanceError(w, err); return }
	writeJSON(w, http.StatusCreated, created)
}

func (h financeHandlers) listBudgets(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok { return }
	items, err := h.service.ListBudgets(r.Context(), householdID)
	if err != nil { handleFinanceError(w, err); return }
	writeJSON(w, http.StatusOK, map[string]any{"budgets": items})
}

func (h financeHandlers) getBudget(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok { return }
	budgetID, ok := pathUUID(w, r, "budgetID")
	if !ok { return }
	item, err := h.service.GetBudget(r.Context(), householdID, budgetID)
	if err != nil { handleFinanceError(w, err); return }
	writeJSON(w, http.StatusOK, item)
}
