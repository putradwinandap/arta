package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/putradwinandap/arta/server/internal/finance"
)

func (h financeHandlers) createReconciliation(w http.ResponseWriter, r *http.Request) {
	hid, err := uuid.Parse(chi.URLParam(r,"householdID")); if err != nil { writeJSON(w,400,map[string]string{"error":"invalid_household_id"}); return }
	wid, err := uuid.Parse(chi.URLParam(r,"walletID")); if err != nil { writeJSON(w,400,map[string]string{"error":"invalid_wallet_id"}); return }
	var input struct{ ObservedAmountMinor int64 `json:"observedAmountMinor"` }
	if json.NewDecoder(r.Body).Decode(&input)!=nil { writeJSON(w,400,map[string]string{"error":"invalid_json"}); return }
	result, err := h.service.CreateReconciliation(r.Context(),hid,wid,input.ObservedAmountMinor); if err != nil { handleReconciliationError(w,err); return }; writeJSON(w,201,result)
}
func (h financeHandlers) listReconciliations(w http.ResponseWriter,r *http.Request){hid,err:=uuid.Parse(chi.URLParam(r,"householdID"));if err!=nil{writeJSON(w,400,map[string]string{"error":"invalid_household_id"});return};items,err:=h.service.ListReconciliations(r.Context(),hid);if err!=nil{handleReconciliationError(w,err);return};writeJSON(w,200,map[string]any{"reconciliations":items})}
func (h financeHandlers) adjustReconciliation(w http.ResponseWriter,r *http.Request){hid,err:=uuid.Parse(chi.URLParam(r,"householdID"));if err!=nil{writeJSON(w,400,map[string]string{"error":"invalid_household_id"});return};rid,err:=uuid.Parse(chi.URLParam(r,"reconciliationID"));if err!=nil{writeJSON(w,400,map[string]string{"error":"invalid_reconciliation_id"});return};var input struct{Reason string `json:"reason"`};if json.NewDecoder(r.Body).Decode(&input)!=nil{writeJSON(w,400,map[string]string{"error":"invalid_json"});return};item,err:=h.service.ResolveReconciliationWithAdjustment(r.Context(),hid,rid,input.Reason);if err!=nil{handleReconciliationError(w,err);return};writeJSON(w,200,item)}
func handleReconciliationError(w http.ResponseWriter,err error){if err==pgx.ErrNoRows{writeJSON(w,404,map[string]string{"error":"not_found"});return};if finance.IsReconciliationInputError(err){writeJSON(w,400,map[string]string{"error":err.Error()});return};writeJSON(w,500,map[string]string{"error":"internal_error"})}
