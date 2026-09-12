package httpserver

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/putradwinandap/arta/server/internal/auth"
)

type authUserContextKey struct{}

func sessionToken(r *http.Request) string {
	cookie, err := r.Cookie(auth.SessionCookieName)
	if err != nil {
		return ""
	}
	return cookie.Value
}

func requireAuthentication(service *auth.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, err := service.UserForToken(r.Context(), sessionToken(r))
			if err != nil {
				handleAuthError(w, err)
				return
			}
			ctx := context.WithValue(r.Context(), authUserContextKey{}, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func authenticatedUser(ctx context.Context) (auth.User, bool) {
	user, ok := ctx.Value(authUserContextKey{}).(auth.User)
	return user, ok
}

func requireHouseholdMembership(service *auth.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
			member, err := service.IsHouseholdMember(r.Context(), user.ID, householdID)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "internal_error")
				return
			}
			if !member {
				writeError(w, http.StatusForbidden, "forbidden")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
