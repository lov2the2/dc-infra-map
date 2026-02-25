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

type LocationHandler struct{ DB *db.DB }

type locationRow struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	SiteID      string  `json:"siteId"`
	TenantID    *string `json:"tenantId"`
	Description *string `json:"description"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

func (h *LocationHandler) List(w http.ResponseWriter, r *http.Request) {
	siteID := r.URL.Query().Get("siteId")
	query := `SELECT id, name, slug, site_id, tenant_id, description, created_at, updated_at FROM locations WHERE deleted_at IS NULL`
	args := []interface{}{}
	argIdx := 1
	if siteID != "" {
		query += fmt.Sprintf(" AND site_id = $%d", argIdx)
		args = append(args, siteID)
		argIdx++
	}
	query += " ORDER BY name"

	rows, err := h.DB.Pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("location list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()

	results := []locationRow{}
	for rows.Next() {
		var l locationRow
		var ca, ua time.Time
		if err := rows.Scan(&l.ID, &l.Name, &l.Slug, &l.SiteID, &l.TenantID, &l.Description, &ca, &ua); err != nil {
			continue
		}
		l.CreatedAt = ca.UTC().Format(time.RFC3339)
		l.UpdatedAt = ua.UTC().Format(time.RFC3339)
		results = append(results, l)
	}
	response.OK(w, results)
}

func (h *LocationHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var l locationRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		`SELECT id, name, slug, site_id, tenant_id, description, created_at, updated_at FROM locations WHERE id = $1 AND deleted_at IS NULL`, id).Scan(
		&l.ID, &l.Name, &l.Slug, &l.SiteID, &l.TenantID, &l.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Location")
		return
	}
	l.CreatedAt = ca.UTC().Format(time.RFC3339)
	l.UpdatedAt = ua.UTC().Format(time.RFC3339)
	response.OK(w, l)
}

func (h *LocationHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	name, _ := body["name"].(string)
	slug, _ := body["slug"].(string)
	siteID, _ := body["siteId"].(string)
	if name == "" || siteID == "" {
		response.BadRequest(w, "name and siteId are required")
		return
	}
	tenantID, _ := body["tenantId"].(string)
	desc, _ := body["description"].(string)

	var l locationRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		`INSERT INTO locations (name, slug, site_id, tenant_id, description) VALUES ($1,$2,$3,$4,$5)
		 RETURNING id, name, slug, site_id, tenant_id, description, created_at, updated_at`,
		name, slug, siteID, nilIfEmpty(tenantID), nilIfEmpty(desc)).Scan(
		&l.ID, &l.Name, &l.Slug, &l.SiteID, &l.TenantID, &l.Description, &ca, &ua)
	if err != nil {
		log.Printf("location create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	l.CreatedAt = ca.UTC().Format(time.RFC3339)
	l.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "locations", l.ID, nil, l)
	response.Created(w, l)
}

func (h *LocationHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	sc := []string{}
	args := []interface{}{}
	ai := 1
	for _, f := range []struct{ j, c string }{{"name", "name"}, {"slug", "slug"}, {"siteId", "site_id"}, {"tenantId", "tenant_id"}, {"description", "description"}} {
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
	q := fmt.Sprintf(`UPDATE locations SET %s WHERE id = $%d AND deleted_at IS NULL
		RETURNING id, name, slug, site_id, tenant_id, description, created_at, updated_at`, joinStrings(sc, ", "), ai)
	var l locationRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(), q, args...).Scan(&l.ID, &l.Name, &l.Slug, &l.SiteID, &l.TenantID, &l.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Location")
		return
	}
	l.CreatedAt = ca.UTC().Format(time.RFC3339)
	l.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "locations", id, nil, l)
	response.OK(w, l)
}

func (h *LocationHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `UPDATE locations SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Location")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "locations", id, nil, nil)
	response.Message(w, "Location deleted", http.StatusOK)
}
