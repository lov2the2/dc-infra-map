package crud

import (
	"net/http"
	"strconv"
)

// Pagination holds parsed pagination parameters from query string.
type Pagination struct {
	Limit  int
	Offset int
}

// ParsePagination extracts ?limit= and ?page= query params from a request.
// Defaults: limit=50, page=1. Maximum allowed limit: 500.
func ParsePagination(r *http.Request) Pagination {
	limit := 50
	page := 1
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			limit = v
			if limit > 500 {
				limit = 500
			}
		}
	}
	if p := r.URL.Query().Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	return Pagination{Limit: limit, Offset: (page - 1) * limit}
}
