package httpserver

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/google/uuid"

	"github.com/putradwinandap/arta/server/internal/auth"
	"github.com/putradwinandap/arta/server/internal/postgres"
)

func TestAuthenticationAndHouseholdAuthorization(t *testing.T) {
	databaseURL := os.Getenv("ARTA_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("ARTA_DATABASE_URL is not set")
	}
	pool, err := postgres.Open(context.Background(), databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	handler := New(pool)
	suffix := uuid.NewString()
	password := "correct horse battery staple"
	ownerCookie, ownerID := registerTestUser(t, handler, "owner-"+suffix+"@example.test", password)
	otherCookie, otherID := registerTestUser(t, handler, "other-"+suffix+"@example.test", password)

	recorder := performJSONRequest(t, handler, http.MethodPost, "/api/households", map[string]any{"name": "Test Household"}, ownerCookie)
	if recorder.Code != http.StatusCreated {
		t.Fatalf("create household: expected %d, got %d: %s", http.StatusCreated, recorder.Code, recorder.Body.String())
	}
	var household struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &household); err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() {
		ctx := context.Background()
		_, _ = pool.Exec(ctx, `DELETE FROM households WHERE id = $1`, household.ID)
		_, _ = pool.Exec(ctx, `DELETE FROM users WHERE id = ANY($1::uuid[])`, []uuid.UUID{ownerID, otherID})
	})

	recorder = performJSONRequest(t, handler, http.MethodGet, "/api/households/"+household.ID, nil, ownerCookie)
	if recorder.Code != http.StatusOK {
		t.Fatalf("owner access: expected %d, got %d: %s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	recorder = performJSONRequest(t, handler, http.MethodGet, "/api/households/"+household.ID, nil, otherCookie)
	if recorder.Code != http.StatusForbidden {
		t.Fatalf("cross-household access: expected %d, got %d: %s", http.StatusForbidden, recorder.Code, recorder.Body.String())
	}

	recorder = performJSONRequest(t, handler, http.MethodPost, "/api/households/"+household.ID+"/wallets", map[string]any{"name": "Forbidden Wallet", "type": "cash", "currency": "IDR"}, otherCookie)
	if recorder.Code != http.StatusForbidden {
		t.Fatalf("cross-household mutation: expected %d, got %d: %s", http.StatusForbidden, recorder.Code, recorder.Body.String())
	}
	var walletCount int
	if err := pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM wallets WHERE household_id = $1`, household.ID).Scan(&walletCount); err != nil {
		t.Fatal(err)
	}
	if walletCount != 0 {
		t.Fatalf("forbidden mutation changed state: expected 0 wallets, got %d", walletCount)
	}

	// Only an owner can mint a single-use invite token.
	recorder = performJSONRequest(t, handler, http.MethodPost, "/api/households/"+household.ID+"/invites", nil, ownerCookie)
	if recorder.Code != http.StatusCreated {
		t.Fatalf("create invite: expected %d, got %d: %s", http.StatusCreated, recorder.Code, recorder.Body.String())
	}
	var invite struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &invite); err != nil {
		t.Fatal(err)
	}
	if invite.Token == "" {
		t.Fatal("create invite returned empty token")
	}

	recorder = performJSONRequest(t, handler, http.MethodPost, "/api/invites/redeem", map[string]any{"token": invite.Token}, otherCookie)
	if recorder.Code != http.StatusOK {
		t.Fatalf("redeem invite: expected %d, got %d: %s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	recorder = performJSONRequest(t, handler, http.MethodGet, "/api/households/"+household.ID, nil, otherCookie)
	if recorder.Code != http.StatusOK {
		t.Fatalf("joined member access: expected %d, got %d: %s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	// Invite is single-use and cannot be replayed.
	recorder = performJSONRequest(t, handler, http.MethodPost, "/api/invites/redeem", map[string]any{"token": invite.Token}, otherCookie)
	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("invite replay: expected %d, got %d: %s", http.StatusBadRequest, recorder.Code, recorder.Body.String())
	}

	recorder = performJSONRequest(t, handler, http.MethodPost, "/api/auth/logout", nil, ownerCookie)
	if recorder.Code != http.StatusNoContent {
		t.Fatalf("logout: expected %d, got %d: %s", http.StatusNoContent, recorder.Code, recorder.Body.String())
	}
	recorder = performJSONRequest(t, handler, http.MethodGet, "/api/auth/me", nil, ownerCookie)
	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("revoked session: expected %d, got %d: %s", http.StatusUnauthorized, recorder.Code, recorder.Body.String())
	}
}

func registerTestUser(t *testing.T, handler http.Handler, email, password string) (*http.Cookie, uuid.UUID) {
	t.Helper()
	recorder := performJSONRequest(t, handler, http.MethodPost, "/api/auth/register", map[string]any{"email": email, "password": password}, nil)
	if recorder.Code != http.StatusCreated {
		t.Fatalf("register %s: expected %d, got %d: %s", email, http.StatusCreated, recorder.Code, recorder.Body.String())
	}
	var user auth.User
	if err := json.Unmarshal(recorder.Body.Bytes(), &user); err != nil {
		t.Fatal(err)
	}
	for _, cookie := range recorder.Result().Cookies() {
		if cookie.Name == auth.SessionCookieName {
			return cookie, user.ID
		}
	}
	t.Fatalf("register %s did not return session cookie", email)
	return nil, uuid.Nil
}

func performJSONRequest(t *testing.T, handler http.Handler, method, path string, body any, cookie *http.Cookie) *httptest.ResponseRecorder {
	t.Helper()
	var payload []byte
	var err error
	if body != nil {
		payload, err = json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
	}
	req := httptest.NewRequest(method, path, bytes.NewReader(payload))
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if cookie != nil {
		req.AddCookie(cookie)
	}
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, req)
	return recorder
}
