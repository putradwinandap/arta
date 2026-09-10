package httpserver

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/putradwinandap/arta/server/internal/finance"
	"github.com/putradwinandap/arta/server/internal/household"
	"github.com/putradwinandap/arta/server/internal/ledger"
	"github.com/putradwinandap/arta/server/internal/wallet"
)

type financeHandlers struct {
	service *finance.Service
}

func (h financeHandlers) createHousehold(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name           string `json:"name"`
		OwnerSubjectID string `json:"ownerSubjectId"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json")
		return
	}
	ownerID, err := uuid.Parse(input.OwnerSubjectID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_owner_subject_id")
		return
	}
	house, err := h.service.CreateHousehold(r.Context(), input.Name, ownerID)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, house)
}

func (h financeHandlers) getHousehold(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	house, err := h.service.GetHousehold(r.Context(), householdID)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, house)
}

func (h financeHandlers) createWallet(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	var input struct {
		Name     string      `json:"name"`
		Type     wallet.Type `json:"type"`
		Currency string      `json:"currency"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json")
		return
	}
	created, err := h.service.CreateWallet(r.Context(), householdID, input.Name, input.Type, input.Currency)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (h financeHandlers) listWallets(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	wallets, err := h.service.ListWallets(r.Context(), householdID)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"wallets": wallets})
}

func (h financeHandlers) getWallet(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	walletID, ok := pathUUID(w, r, "walletID")
	if !ok {
		return
	}
	walletValue, err := h.service.GetWallet(r.Context(), householdID, walletID)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, walletValue)
}

func (h financeHandlers) updateWallet(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	walletID, ok := pathUUID(w, r, "walletID")
	if !ok {
		return
	}
	var input struct {
		Name string      `json:"name"`
		Type wallet.Type `json:"type"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json")
		return
	}
	updated, err := h.service.UpdateWallet(r.Context(), householdID, walletID, input.Name, input.Type)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (h financeHandlers) archiveWallet(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	walletID, ok := pathUUID(w, r, "walletID")
	if !ok {
		return
	}
	archived, err := h.service.ArchiveWallet(r.Context(), householdID, walletID)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, archived)
}

func (h financeHandlers) createTransaction(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	var input struct {
		WalletID    string      `json:"walletId"`
		Kind        ledger.Kind `json:"kind"`
		AmountMinor int64       `json:"amountMinor"`
		OccurredAt  *time.Time  `json:"occurredAt"`
		Note        string      `json:"note"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json")
		return
	}
	walletID, err := uuid.Parse(input.WalletID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_wallet_id")
		return
	}
	occurredAt := time.Now()
	if input.OccurredAt != nil {
		occurredAt = *input.OccurredAt
	}
	created, err := h.service.CreateTransaction(r.Context(), householdID, walletID, input.Kind, input.AmountMinor, occurredAt, input.Note)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (h financeHandlers) createTransfer(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	var input struct {
		SourceWalletID      string     `json:"sourceWalletId"`
		DestinationWalletID string     `json:"destinationWalletId"`
		AmountMinor         int64      `json:"amountMinor"`
		OccurredAt          *time.Time `json:"occurredAt"`
		Note                string     `json:"note"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json")
		return
	}
	sourceID, err := uuid.Parse(input.SourceWalletID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_source_wallet_id")
		return
	}
	destinationID, err := uuid.Parse(input.DestinationWalletID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_destination_wallet_id")
		return
	}
	occurredAt := time.Now()
	if input.OccurredAt != nil {
		occurredAt = *input.OccurredAt
	}
	created, err := h.service.CreateTransfer(r.Context(), householdID, sourceID, destinationID, input.AmountMinor, occurredAt, input.Note)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (h financeHandlers) getFinanceOverview(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	balances, err := h.service.WalletAvailableBalances(r.Context(), householdID)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	totals, err := h.service.HouseholdTotals(r.Context(), householdID)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	activity, err := h.service.ListActivity(r.Context(), householdID)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"balances": balances, "totals": totals, "activity": activity})
}

func pathUUID(w http.ResponseWriter, r *http.Request, key string) (uuid.UUID, bool) {
	id, err := uuid.Parse(chi.URLParam(r, key))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_"+key)
		return uuid.Nil, false
	}
	return id, true
}

func decodeJSON(r *http.Request, target any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}

func handleFinanceError(w http.ResponseWriter, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "not_found")
		return
	}
	if errors.Is(err, household.ErrInvalidHouseholdName) ||
		errors.Is(err, household.ErrInvalidSubjectID) ||
		errors.Is(err, wallet.ErrInvalidName) ||
		errors.Is(err, wallet.ErrInvalidType) ||
		errors.Is(err, wallet.ErrInvalidCurrency) ||
		errors.Is(err, wallet.ErrInvalidHousehold) ||
		errors.Is(err, wallet.ErrWalletArchived) ||
		finance.IsLedgerInputError(err) ||
		finance.IsCaptureInputError(err) ||
		finance.IsBudgetInputError(err) ||
		finance.IsGoalInputError(err) {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeError(w, http.StatusInternalServerError, "internal_error")
}

func writeError(w http.ResponseWriter, status int, code string) {
	writeJSON(w, status, map[string]string{"error": code})
}
