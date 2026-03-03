package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
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

func (h *ManufacturerHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	setClauses := []string{}
	args := []interface{}{}
	argIdx := 1

	if v, ok := body["name"].(string); ok && v != "" {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}
	if v, ok := body["slug"].(string); ok && v != "" {
		setClauses = append(setClauses, fmt.Sprintf("slug = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}
	if v, ok := body["description"]; ok {
		setClauses = append(setClauses, fmt.Sprintf("description = $%d", argIdx))
		if s, ok := v.(string); ok && s != "" {
			args = append(args, s)
		} else {
			args = append(args, nil)
		}
		argIdx++
	}
	if len(setClauses) == 0 {
		response.BadRequest(w, "no fields to update")
		return
	}
	setClauses = append(setClauses, fmt.Sprintf("updated_at = $%d", argIdx))
	args = append(args, time.Now().UTC())
	argIdx++
	args = append(args, id)

	var m manufacturerRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`UPDATE manufacturers SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING %s`,
			strings.Join(setClauses, ", "), argIdx, mfCols),
		args...).Scan(&m.ID, &m.Name, &m.Slug, &m.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Manufacturer")
		return
	}
	m.CreatedAt = ca.UTC().Format(time.RFC3339)
	m.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "manufacturers", m.ID, body, m)
	response.OK(w, m)
}

func (h *ManufacturerHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	result, err := h.DB.Pool.Exec(r.Context(),
		`UPDATE manufacturers SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, id)
	if err != nil || result.RowsAffected() == 0 {
		response.NotFound(w, "Manufacturer")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "manufacturers", id, nil, nil)
	response.OK(w, map[string]string{"message": "deleted"})
}
