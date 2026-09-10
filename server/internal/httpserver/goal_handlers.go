package httpserver

import (
	"net/http"

	"github.com/google/uuid"
)

func (h financeHandlers) createGoal(w http.ResponseWriter,r *http.Request){hid,ok:=pathUUID(w,r,"householdID");if !ok{return};var in struct{Name string `json:"name"`;Currency string `json:"currency"`;TargetAmountMinor int64 `json:"targetAmountMinor"`};if decodeJSON(r,&in)!=nil{writeError(w,400,"invalid_json");return};v,err:=h.service.CreateGoal(r.Context(),hid,in.Name,in.Currency,in.TargetAmountMinor);if err!=nil{handleFinanceError(w,err);return};writeJSON(w,http.StatusCreated,v)}
func (h financeHandlers) listGoals(w http.ResponseWriter,r *http.Request){hid,ok:=pathUUID(w,r,"householdID");if !ok{return};v,err:=h.service.ListGoals(r.Context(),hid);if err!=nil{handleFinanceError(w,err);return};writeJSON(w,200,map[string]any{"goals":v})}
func (h financeHandlers) getGoal(w http.ResponseWriter,r *http.Request){hid,ok:=pathUUID(w,r,"householdID");if !ok{return};gid,ok:=pathUUID(w,r,"goalID");if !ok{return};v,err:=h.service.GetGoal(r.Context(),hid,gid);if err!=nil{handleFinanceError(w,err);return};writeJSON(w,200,v)}
func (h financeHandlers) updateGoal(w http.ResponseWriter,r *http.Request){hid,ok:=pathUUID(w,r,"householdID");if !ok{return};gid,ok:=pathUUID(w,r,"goalID");if !ok{return};var in struct{Name string `json:"name"`;TargetAmountMinor int64 `json:"targetAmountMinor"`};if decodeJSON(r,&in)!=nil{writeError(w,400,"invalid_json");return};v,err:=h.service.UpdateGoal(r.Context(),hid,gid,in.Name,in.TargetAmountMinor);if err!=nil{handleFinanceError(w,err);return};writeJSON(w,200,v)}
func (h financeHandlers) archiveGoal(w http.ResponseWriter,r *http.Request){hid,ok:=pathUUID(w,r,"householdID");if !ok{return};gid,ok:=pathUUID(w,r,"goalID");if !ok{return};v,err:=h.service.ArchiveGoal(r.Context(),hid,gid);if err!=nil{handleFinanceError(w,err);return};writeJSON(w,200,v)}
func (h financeHandlers) reserveGoal(w http.ResponseWriter,r *http.Request){h.goalMoney(w,r,true)}
func (h financeHandlers) releaseGoal(w http.ResponseWriter,r *http.Request){h.goalMoney(w,r,false)}
func (h financeHandlers) goalMoney(w http.ResponseWriter,r *http.Request,reserve bool){hid,ok:=pathUUID(w,r,"householdID");if !ok{return};gid,ok:=pathUUID(w,r,"goalID");if !ok{return};var in struct{WalletID string `json:"walletId"`;AmountMinor int64 `json:"amountMinor"`};if decodeJSON(r,&in)!=nil{writeError(w,400,"invalid_json");return};wid,err:=uuid.Parse(in.WalletID);if err!=nil{writeError(w,400,"invalid_wallet_id");return};var v any;if reserve{v,err=h.service.ReserveGoalFunds(r.Context(),hid,gid,wid,in.AmountMinor)}else{v,err=h.service.ReleaseGoalFunds(r.Context(),hid,gid,wid,in.AmountMinor)};if err!=nil{handleFinanceError(w,err);return};writeJSON(w,200,v)}
