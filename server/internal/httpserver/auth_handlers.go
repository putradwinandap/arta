package httpserver

import (
	"errors"
	"net/http"

	"github.com/putradwinandap/arta/server/internal/auth"
)

type authHandlers struct { service *auth.Service; secure bool }
type credentialsInput struct { Email string `json:"email"`; Password string `json:"password"` }

func (h authHandlers) register(w http.ResponseWriter, r *http.Request) {
	var input credentialsInput
	if err := decodeJSON(r, &input); err != nil { writeError(w, http.StatusBadRequest, "invalid_json"); return }
	user, token, expiresAt, err := h.service.Register(r.Context(), input.Email, input.Password); if err != nil { handleAuthError(w, err); return }
	http.SetCookie(w, auth.SessionCookie(token, expiresAt, h.secure)); writeJSON(w, http.StatusCreated, user)
}
func (h authHandlers) login(w http.ResponseWriter, r *http.Request) {
	var input credentialsInput
	if err := decodeJSON(r, &input); err != nil { writeError(w, http.StatusBadRequest, "invalid_json"); return }
	user, token, expiresAt, err := h.service.Login(r.Context(), input.Email, input.Password); if err != nil { handleAuthError(w, err); return }
	http.SetCookie(w, auth.SessionCookie(token, expiresAt, h.secure)); writeJSON(w, http.StatusOK, user)
}
func (h authHandlers) me(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUser(r.Context()); if !ok { writeError(w, http.StatusUnauthorized, "unauthenticated"); return }; writeJSON(w, http.StatusOK, user)
}
func (h authHandlers) households(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUser(r.Context()); if !ok { writeError(w, http.StatusUnauthorized, "unauthenticated"); return }
	memberships, err := h.service.ListHouseholds(r.Context(), user.ID); if err != nil { writeError(w, http.StatusInternalServerError, "internal_error"); return }
	writeJSON(w, http.StatusOK, map[string]any{"households": memberships})
}
func (h authHandlers) logout(w http.ResponseWriter, r *http.Request) {
	token := sessionToken(r); if err := h.service.Logout(r.Context(), token); err != nil { writeError(w, http.StatusInternalServerError, "internal_error"); return }
	http.SetCookie(w, auth.ExpiredSessionCookie(h.secure)); w.WriteHeader(http.StatusNoContent)
}
func handleAuthError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, auth.ErrInvalidCredentials): writeError(w, http.StatusUnauthorized, "invalid_credentials")
	case errors.Is(err, auth.ErrEmailInUse): writeError(w, http.StatusConflict, "email_in_use")
	case errors.Is(err, auth.ErrUnauthenticated): writeError(w, http.StatusUnauthorized, "unauthenticated")
	case errors.Is(err, auth.ErrForbidden): writeError(w, http.StatusForbidden, "forbidden")
	default: writeError(w, http.StatusInternalServerError, "internal_error")
	}
}
