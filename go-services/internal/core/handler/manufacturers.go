package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/dcim/go-services/internal/shared/audit"
	"github.com/dcim/go-services/internal/shared/db"
	"github.com/dcim/go-services/internal/shared/response"
)

type ManufacturerHandler struct{ DB *db.DB }

type manufacturerRow struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

const mfCols = `id, name, slug, description, created_at, updated_at`

func (h *ManufacturerHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Pool.Query(r.Context(),
		fmt.Sprintf(`SELECT %s FROM manufacturers WHERE deleted_at IS NULL ORDER BY name`, mfCols))
	if err != nil {
		log.Printf("manufacturer list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []manufacturerRow{}
	for rows.Next() {
		var m manufacturerRow
		var ca, ua time.Time
		if err := rows.Scan(&m.ID, &m.Name, &m.Slug, &m.Description, &ca, &ua); err != nil {
			continue
		}
		m.CreatedAt = ca.UTC().Format(time.RFC3339)
		m.UpdatedAt = ua.UTC().Format(time.RFC3339)
		results = append(results, m)
	}
	response.OK(w, results)
}

func (h *ManufacturerHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var m manufacturerRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`SELECT %s FROM manufacturers WHERE id = $1 AND deleted_at IS NULL`, mfCols), id).Scan(
		&m.ID, &m.Name, &m.Slug, &m.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Manufacturer")
		return
	}
	m.CreatedAt = ca.UTC().Format(time.RFC3339)
	m.UpdatedAt = ua.UTC().Format(time.RFC3339)
	response.OK(w, m)
}

func (h *ManufacturerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	name, _ := body["name"].(string)
	slug, _ := body["slug"].(string)
	if name == "" || slug == "" {
		response.BadRequest(w, "name and slug are required")
		return
	}
	desc, _ := body["description"].(string)

	var m manufacturerRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO manufacturers (name, slug, description) VALUES ($1,$2,$3) RETURNING %s`, mfCols),
		name, slug, nilIfEmpty(desc)).Scan(
		&m.ID, &m.Name, &m.Slug, &m.Description, &ca, &ua)
	if err != nil {
		log.Printf("manufacturer create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	m.CreatedAt = ca.UTC().Format(time.RFC3339)
	m.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "manufacturers", m.ID, nil, m)
	response.Created(w, m)
}
