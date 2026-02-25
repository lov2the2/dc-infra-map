package middleware

import (
	"log"
	"net/http"
	"time"
)

// responseCapture wraps ResponseWriter to capture the status code.
type responseCapture struct {
	http.ResponseWriter
	statusCode int
}

func (rc *responseCapture) WriteHeader(code int) {
	rc.statusCode = code
	rc.ResponseWriter.WriteHeader(code)
}

// Logging returns a middleware that logs each request with method, path, status, and duration.
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rc := &responseCapture{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(rc, r)

		log.Printf("%s %s %d %s", r.Method, r.URL.Path, rc.statusCode, time.Since(start))
	})
}
