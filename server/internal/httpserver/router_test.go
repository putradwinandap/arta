package httpserver

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWriteJSON(t *testing.T) {
	recorder := httptest.NewRecorder()
	writeJSON(recorder, http.StatusOK, map[string]string{"status": "ok"})
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}
	if got := recorder.Header().Get("Content-Type"); got != "application/json" {
		t.Fatalf("expected application/json, got %q", got)
	}
}
