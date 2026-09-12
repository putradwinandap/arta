package httpserver

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/putradwinandap/arta/server/internal/auth"
)

type inviteHandlers struct {
	service *auth.Service
}

type redeemInviteInput struct {
	Token string `json:"token"`
}

func (h inviteHandlers) create(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUser(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	householdID, err := uuid.Parse(chi.URLParam(r, "householdID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_household_id")
		return
	}
	invite, err := h.service.CreateHouseholdInvite(r.Context(), user.ID, householdID)
	if err != nil {
		handleAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, invite)
}

func (h inviteHandlers) redeem(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUser(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	var input redeemInviteInput
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json")
		return
	}
	householdID, err := h.service.RedeemHouseholdInvite(r.Context(), user.ID, input.Token)
	if err != nil {
		if errors.Is(err, auth.ErrInvalidInvite) {
			writeError(w, http.StatusBadRequest, "invalid_invite")
			return
		}
		handleAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"householdId": householdID.String()})
}
