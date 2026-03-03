package middleware

import (
	"crypto/subtle"
	"net/http"
)

// InternalSecret returns a middleware that validates the x-internal-secret header.
// Uses constant-time comparison to prevent timing attacks.
func InternalSecret(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			provided := r.Header.Get("x-internal-secret")
			if subtle.ConstantTimeCompare([]byte(provided), []byte(secret)) != 1 {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
