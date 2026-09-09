package auth

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"
)

const (
	SessionCookieName = "arta_session"
	sessionTokenBytes = 32
)

func NewSessionToken() (string, error) {
	buffer := make([]byte, sessionTokenBytes)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buffer), nil
}

func SessionCookie(token string, expiresAt time.Time, secure bool) *http.Cookie {
	return &http.Cookie{
		Name:     SessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  expiresAt,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	}
}

func ExpiredSessionCookie(secure bool) *http.Cookie {
	cookie := SessionCookie("", time.Unix(0, 0), secure)
	cookie.MaxAge = -1
	return cookie
}
