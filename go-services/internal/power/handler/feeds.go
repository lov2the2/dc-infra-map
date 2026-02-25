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

// FeedHandler handles power feed CRUD.
type FeedHandler struct {
	DB *db.DB
}

type feedRow struct {
	ID        string  `json:"id"`
	PanelID   string  `json:"panelId"`
	RackID    *string `json:"rackId"`
	Name      string  `json:"name"`
	FeedType  string  `json:"feedType"`
	MaxAmps   float64 `json:"maxAmps"`
	RatedKw   float64 `json:"ratedKw"`
	CreatedAt string  `json:"createdAt"`
	UpdatedAt string  `json:"updatedAt"`
}

// List handles GET /feeds?panelId=&rackId=
func (h *FeedHandler) List(w http.ResponseWriter, r *http.Request) {
	panelID := r.URL.Query().Get("panelId")
	rackID := r.URL.Query().Get("rackId")

	query := `
		SELECT pf.id, pf.panel_id, pf.rack_id, pf.name, pf.feed_type,
		       pf.max_amps, pf.rated_kw, pf.created_at, pf.updated_at
		FROM power_feeds pf
		WHERE pf.deleted_at IS NULL`
	args := []interface{}{}
	argIdx := 1

	if panelID != "" {
		query += fmt.Sprintf(" AND pf.panel_id = $%d", argIdx)
		args = append(args, panelID)
		argIdx++
	}
	if rackID != "" {
		query += fmt.Sprintf(" AND pf.rack_id = $%d", argIdx)
		args = append(args, rackID)
		argIdx++
	}
	query += " ORDER BY pf.name"

	rows, err := h.DB.Pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("feed list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()

	results := []feedRow{}
	for rows.Next() {
		var f feedRow
		var rID *string
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&f.ID, &f.PanelID, &rID, &f.Name, &f.FeedType,
			&f.MaxAmps, &f.RatedKw, &createdAt, &updatedAt); err != nil {
			log.Printf("feed scan error: %v", err)
			continue
		}
		f.RackID = rID
		f.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		f.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		results = append(results, f)
	}

	response.OK(w, results)
}

// Get handles GET /feeds/{id}
func (h *FeedHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	var f feedRow
	var rID *string
	var createdAt, updatedAt time.Time

	err := h.DB.Pool.QueryRow(r.Context(), `
		SELECT id, panel_id, rack_id, name, feed_type, max_amps, rated_kw, created_at, updated_at
		FROM power_feeds
		WHERE id = $1 AND deleted_at IS NULL`, id).Scan(
		&f.ID, &f.PanelID, &rID, &f.Name, &f.FeedType,
		&f.MaxAmps, &f.RatedKw, &createdAt, &updatedAt)
	if err != nil {
		response.NotFound(w, "Power feed")
		return
	}
	f.RackID = rID
	f.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	f.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	response.OK(w, f)
}

// Create handles POST /feeds
func (h *FeedHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}

	panelID, _ := body["panelId"].(string)
	name, _ := body["name"].(string)
	if panelID == "" || name == "" {
		response.BadRequest(w, "panelId and name are required")
		return
	}

	rackID, _ := body["rackId"].(string)
	feedType := "primary"
	if ft, ok := body["feedType"].(string); ok {
		feedType = ft
	}
	maxAmps, _ := body["maxAmps"].(float64)
	ratedKw, _ := body["ratedKw"].(float64)

	var f feedRow
	var rID *string
	var createdAt, updatedAt time.Time

	err := h.DB.Pool.QueryRow(r.Context(), `
		INSERT INTO power_feeds (panel_id, rack_id, name, feed_type, max_amps, rated_kw)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, panel_id, rack_id, name, feed_type, max_amps, rated_kw, created_at, updated_at`,
		panelID, nilIfEmpty(rackID), name, feedType, maxAmps, ratedKw).Scan(
		&f.ID, &f.PanelID, &rID, &f.Name, &f.FeedType,
		&f.MaxAmps, &f.RatedKw, &createdAt, &updatedAt)
	if err != nil {
		log.Printf("feed create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	f.RackID = rID
	f.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	f.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "power_feeds", f.ID, nil, f)

	response.Created(w, f)
}

// Update handles PATCH /feeds/{id}
func (h *FeedHandler) Update(w http.ResponseWriter, r *http.Request) {
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

	if v, ok := body["panelId"].(string); ok {
		setClauses = append(setClauses, fmt.Sprintf("panel_id = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}
	if v, ok := body["rackId"].(string); ok {
		setClauses = append(setClauses, fmt.Sprintf("rack_id = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}
	if v, ok := body["name"].(string); ok {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}
	if v, ok := body["feedType"].(string); ok {
		setClauses = append(setClauses, fmt.Sprintf("feed_type = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}
	if v, ok := body["maxAmps"].(float64); ok {
		setClauses = append(setClauses, fmt.Sprintf("max_amps = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}
	if v, ok := body["ratedKw"].(float64); ok {
		setClauses = append(setClauses, fmt.Sprintf("rated_kw = $%d", argIdx))
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
		UPDATE power_feeds SET %s
		WHERE id = $%d AND deleted_at IS NULL
		RETURNING id, panel_id, rack_id, name, feed_type, max_amps, rated_kw, created_at, updated_at`,
		joinStrings(setClauses, ", "), argIdx)

	var f feedRow
	var rID *string
	var createdAt, updatedAt time.Time

	err := h.DB.Pool.QueryRow(r.Context(), query, args...).Scan(
		&f.ID, &f.PanelID, &rID, &f.Name, &f.FeedType,
		&f.MaxAmps, &f.RatedKw, &createdAt, &updatedAt)
	if err != nil {
		response.NotFound(w, "Power feed")
		return
	}
	f.RackID = rID
	f.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	f.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "power_feeds", id, nil, f)

	response.OK(w, f)
}

// Delete handles DELETE /feeds/{id}
func (h *FeedHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	tag, err := h.DB.Pool.Exec(r.Context(), `
		UPDATE power_feeds SET deleted_at = $1
		WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Power feed")
		return
	}

	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "power_feeds", id, nil, nil)

	response.Message(w, "Power feed deleted", http.StatusOK)
}
