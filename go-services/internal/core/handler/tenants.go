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

type TenantHandler struct{ DB *db.DB }

type tenantRow struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

const tenantCols = `id, name, slug, description, created_at, updated_at`

func (h *TenantHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Pool.Query(r.Context(),
		fmt.Sprintf(`SELECT %s FROM tenants WHERE deleted_at IS NULL ORDER BY name`, tenantCols))
	if err != nil {
		log.Printf("tenant list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []tenantRow{}
	for rows.Next() {
		var t tenantRow
		var ca, ua time.Time
		if err := rows.Scan(&t.ID, &t.Name, &t.Slug, &t.Description, &ca, &ua); err != nil {
			continue
		}
		t.CreatedAt = ca.UTC().Format(time.RFC3339)
		t.UpdatedAt = ua.UTC().Format(time.RFC3339)
		results = append(results, t)
	}
	response.OK(w, results)
}

func (h *TenantHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var t tenantRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`SELECT %s FROM tenants WHERE id = $1 AND deleted_at IS NULL`, tenantCols), id).Scan(
		&t.ID, &t.Name, &t.Slug, &t.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Tenant")
		return
	}
	t.CreatedAt = ca.UTC().Format(time.RFC3339)
	t.UpdatedAt = ua.UTC().Format(time.RFC3339)
	response.OK(w, t)
}

func (h *TenantHandler) Create(w http.ResponseWriter, r *http.Request) {
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

	var t tenantRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO tenants (name, slug, description) VALUES ($1,$2,$3) RETURNING %s`, tenantCols),
		name, slug, nilIfEmpty(desc)).Scan(
		&t.ID, &t.Name, &t.Slug, &t.Description, &ca, &ua)
	if err != nil {
		log.Printf("tenant create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	t.CreatedAt = ca.UTC().Format(time.RFC3339)
	t.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "tenants", t.ID, nil, t)
	response.Created(w, t)
}

func (h *TenantHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	sc := []string{}
	args := []interface{}{}
	ai := 1
	for _, f := range []struct{ j, c string }{{"name", "name"}, {"slug", "slug"}, {"description", "description"}} {
		if v, ok := body[f.j].(string); ok {
			sc = append(sc, fmt.Sprintf("%s = $%d", f.c, ai))
			args = append(args, nilIfEmpty(v))
			ai++
		}
	}
	sc = append(sc, fmt.Sprintf("updated_at = $%d", ai))
	args = append(args, time.Now().UTC())
	ai++
	if len(sc) <= 1 {
		response.BadRequest(w, "no fields to update")
		return
	}
	args = append(args, id)
	var t tenantRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`UPDATE tenants SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING %s`, joinStrings(sc, ", "), ai, tenantCols), args...).Scan(
		&t.ID, &t.Name, &t.Slug, &t.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Tenant")
		return
	}
	t.CreatedAt = ca.UTC().Format(time.RFC3339)
	t.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "tenants", id, nil, t)
	response.OK(w, t)
}

func (h *TenantHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `UPDATE tenants SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Tenant")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "tenants", id, nil, nil)
	response.Message(w, "Tenant deleted", http.StatusOK)
}
