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

// PanelHandler handles power panel CRUD.
type PanelHandler struct {
	DB *db.DB
}

type panelRow struct {
	ID              string   `json:"id"`
	SiteID          string   `json:"siteId"`
	Name            string   `json:"name"`
	Slug            string   `json:"slug"`
	Location        *string  `json:"location"`
	RatedCapacityKw float64  `json:"ratedCapacityKw"`
	VoltageV        int      `json:"voltageV"`
	PhaseType       string   `json:"phaseType"`
	CreatedAt       string   `json:"createdAt"`
	UpdatedAt       string   `json:"updatedAt"`
}

// List handles GET /panels?siteId=
func (h *PanelHandler) List(w http.ResponseWriter, r *http.Request) {
	siteID := r.URL.Query().Get("siteId")

	query := `
		SELECT pp.id, pp.site_id, pp.name, pp.slug, pp.location,
		       pp.rated_capacity_kw, pp.voltage_v, pp.phase_type,
		       pp.created_at, pp.updated_at
		FROM power_panels pp
		WHERE pp.deleted_at IS NULL`
	args := []interface{}{}
	argIdx := 1

	if siteID != "" {
		query += fmt.Sprintf(" AND pp.site_id = $%d", argIdx)
		args = append(args, siteID)
		argIdx++
	}
	query += " ORDER BY pp.name"

	rows, err := h.DB.Pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("panel list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()

	results := []panelRow{}
	for rows.Next() {
		var p panelRow
		var loc *string
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&p.ID, &p.SiteID, &p.Name, &p.Slug, &loc,
			&p.RatedCapacityKw, &p.VoltageV, &p.PhaseType,
			&createdAt, &updatedAt); err != nil {
			log.Printf("panel scan error: %v", err)
			continue
		}
		p.Location = loc
		p.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		p.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		results = append(results, p)
	}

	response.OK(w, results)
}

// Get handles GET /panels/{id}
func (h *PanelHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	var p panelRow
	var loc *string
	var createdAt, updatedAt time.Time

	err := h.DB.Pool.QueryRow(r.Context(), `
		SELECT id, site_id, name, slug, location,
		       rated_capacity_kw, voltage_v, phase_type,
		       created_at, updated_at
		FROM power_panels
		WHERE id = $1 AND deleted_at IS NULL`, id).Scan(
		&p.ID, &p.SiteID, &p.Name, &p.Slug, &loc,
		&p.RatedCapacityKw, &p.VoltageV, &p.PhaseType,
		&createdAt, &updatedAt)
	if err != nil {
		response.NotFound(w, "Power panel")
		return
	}
	p.Location = loc
	p.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	p.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	response.OK(w, p)
}

// Create handles POST /panels
func (h *PanelHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}

	siteID, _ := body["siteId"].(string)
	name, _ := body["name"].(string)
	slug, _ := body["slug"].(string)
	if name == "" || siteID == "" {
		response.BadRequest(w, "name and siteId are required")
		return
	}

	loc, _ := body["location"].(string)
	ratedKw, _ := body["ratedCapacityKw"].(float64)
	voltageV := 220
	if v, ok := body["voltageV"].(float64); ok {
		voltageV = int(v)
	}
	phaseType := "single"
	if pt, ok := body["phaseType"].(string); ok {
		phaseType = pt
	}

	var p panelRow
	var createdAt, updatedAt time.Time
	var locOut *string

	err := h.DB.Pool.QueryRow(r.Context(), `
		INSERT INTO power_panels (site_id, name, slug, location, rated_capacity_kw, voltage_v, phase_type)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, site_id, name, slug, location, rated_capacity_kw, voltage_v, phase_type, created_at, updated_at`,
		siteID, name, slug, nilIfEmpty(loc), ratedKw, voltageV, phaseType).Scan(
		&p.ID, &p.SiteID, &p.Name, &p.Slug, &locOut,
		&p.RatedCapacityKw, &p.VoltageV, &p.PhaseType,
		&createdAt, &updatedAt)
	if err != nil {
		log.Printf("panel create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	p.Location = locOut
	p.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	p.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "power_panels", p.ID, nil, p)

	response.Created(w, p)
}

// Update handles PATCH /panels/{id}
func (h *PanelHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}

	setClauses := []string{}
	args := []interface{}{}
	argIdx := 1

	if v, ok := body["name"].(string); ok {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}
	if v, ok := body["slug"].(string); ok {
		setClauses = append(setClauses, fmt.Sprintf("slug = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}
	if v, ok := body["siteId"].(string); ok {
		setClauses = append(setClauses, fmt.Sprintf("site_id = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}
	if v, ok := body["location"].(string); ok {
		setClauses = append(setClauses, fmt.Sprintf("location = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}
	if v, ok := body["ratedCapacityKw"].(float64); ok {
		setClauses = append(setClauses, fmt.Sprintf("rated_capacity_kw = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}
	if v, ok := body["voltageV"].(float64); ok {
		setClauses = append(setClauses, fmt.Sprintf("voltage_v = $%d", argIdx))
		args = append(args, int(v))
		argIdx++
	}
	if v, ok := body["phaseType"].(string); ok {
		setClauses = append(setClauses, fmt.Sprintf("phase_type = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}

	setClauses = append(setClauses, fmt.Sprintf("updated_at = $%d", argIdx))
	args = append(args, time.Now().UTC())
	argIdx++

	if len(setClauses) <= 1 {
		response.BadRequest(w, "no fields to update")
		return
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		UPDATE power_panels SET %s
		WHERE id = $%d AND deleted_at IS NULL
		RETURNING id, site_id, name, slug, location, rated_capacity_kw, voltage_v, phase_type, created_at, updated_at`,
		joinStrings(setClauses, ", "), argIdx)

	var p panelRow
	var locOut *string
	var createdAt, updatedAt time.Time

	err := h.DB.Pool.QueryRow(r.Context(), query, args...).Scan(
		&p.ID, &p.SiteID, &p.Name, &p.Slug, &locOut,
		&p.RatedCapacityKw, &p.VoltageV, &p.PhaseType,
		&createdAt, &updatedAt)
	if err != nil {
		response.NotFound(w, "Power panel")
		return
	}
	p.Location = locOut
	p.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	p.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "power_panels", id, nil, p)

	response.OK(w, p)
}

// Delete handles DELETE /panels/{id}
func (h *PanelHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	tag, err := h.DB.Pool.Exec(r.Context(), `
		UPDATE power_panels SET deleted_at = $1
		WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Power panel")
		return
	}

	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "power_panels", id, nil, nil)

	response.Message(w, "Power panel deleted", http.StatusOK)
}

func nilIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

func joinStrings(strs []string, sep string) string {
	result := ""
	for i, s := range strs {
		if i > 0 {
			result += sep
		}
		result += s
	}
	return result
}
