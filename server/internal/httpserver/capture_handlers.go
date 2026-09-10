package httpserver

import (
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/putradwinandap/arta/server/internal/ledger"
)

func (h financeHandlers) createCapture(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	var input struct {
		ID          string     `json:"id"`
		AmountMinor int64      `json:"amountMinor"`
		Note        string     `json:"note"`
		CapturedAt  *time.Time `json:"capturedAt"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json")
		return
	}
	captureID, err := uuid.Parse(input.ID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_capture_id")
		return
	}
	capturedAt := time.Now()
	if input.CapturedAt != nil {
		capturedAt = *input.CapturedAt
	}
	created, err := h.service.CreateCapture(r.Context(), captureID, householdID, input.AmountMinor, input.Note, capturedAt)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (h financeHandlers) listPendingCaptures(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	items, err := h.service.ListPendingCaptures(r.Context(), householdID)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"captures": items})
}

func (h financeHandlers) reviewCapture(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	captureID, ok := pathUUID(w, r, "captureID")
	if !ok {
		return
	}
	var input struct {
		WalletID    string      `json:"walletId"`
		Kind        ledger.Kind `json:"kind"`
		AmountMinor int64       `json:"amountMinor"`
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
	updated, err := h.service.ReviewCapture(r.Context(), householdID, captureID, walletID, input.Kind, input.AmountMinor, input.Note)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (h financeHandlers) confirmCapture(w http.ResponseWriter, r *http.Request) {
	householdID, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	captureID, ok := pathUUID(w, r, "captureID")
	if !ok {
		return
	}
	confirmed, err := h.service.ConfirmCapture(r.Context(), householdID, captureID)
	if err != nil {
		handleFinanceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, confirmed)
}
