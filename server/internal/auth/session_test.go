package auth

import (
	"testing"
	"time"
)

func TestSessionTokenAndCookie(t *testing.T) {
	token, err := NewSessionToken()
	if err != nil {
		t.Fatal(err)
	}
	if len(token) < 40 {
		t.Fatalf("expected high-entropy token, got length %d", len(token))
	}

	expiresAt := time.Now().Add(time.Hour)
	cookie := SessionCookie(token, expiresAt, true)
	if !cookie.HttpOnly {
		t.Fatal("session cookie must be HttpOnly")
	}
	if !cookie.Secure {
		t.Fatal("secure deployment cookie must set Secure")
	}
	if cookie.SameSite == 0 {
		t.Fatal("session cookie must set SameSite")
	}
}
