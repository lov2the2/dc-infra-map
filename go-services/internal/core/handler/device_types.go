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

type DeviceTypeHandler struct{ DB *db.DB }

type deviceTypeRow struct {
	ID             string   `json:"id"`
	ManufacturerID string   `json:"manufacturerId"`
	Model          string   `json:"model"`
	Slug           string   `json:"slug"`
	UHeight        int      `json:"uHeight"`
	FullDepth      int      `json:"fullDepth"`
	Weight         *float64 `json:"weight"`
	PowerDraw      *int     `json:"powerDraw"`
	Description    *string  `json:"description"`
	CreatedAt      string   `json:"createdAt"`
	UpdatedAt      string   `json:"updatedAt"`
}

const dtCols = `id, manufacturer_id, model, slug, u_height, full_depth, weight, power_draw, description, created_at, updated_at`

func (h *DeviceTypeHandler) List(w http.ResponseWriter, r *http.Request) {
	mfID := r.URL.Query().Get("manufacturerId")
	query := fmt.Sprintf(`SELECT %s FROM device_types WHERE deleted_at IS NULL`, dtCols)
	args := []interface{}{}
	ai := 1
	if mfID != "" {
		query += fmt.Sprintf(" AND manufacturer_id = $%d", ai)
		args = append(args, mfID)
		ai++
	}
	query += " ORDER BY model"
	rows, err := h.DB.Pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("device_type list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []deviceTypeRow{}
	for rows.Next() {
		var d deviceTypeRow
		var ca, ua time.Time
		if err := rows.Scan(&d.ID, &d.ManufacturerID, &d.Model, &d.Slug, &d.UHeight, &d.FullDepth, &d.Weight, &d.PowerDraw, &d.Description, &ca, &ua); err != nil {
			continue
		}
		d.CreatedAt = ca.UTC().Format(time.RFC3339)
		d.UpdatedAt = ua.UTC().Format(time.RFC3339)
		results = append(results, d)
	}
	response.OK(w, results)
}

func (h *DeviceTypeHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var d deviceTypeRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(), fmt.Sprintf(`SELECT %s FROM device_types WHERE id = $1 AND deleted_at IS NULL`, dtCols), id).Scan(
		&d.ID, &d.ManufacturerID, &d.Model, &d.Slug, &d.UHeight, &d.FullDepth, &d.Weight, &d.PowerDraw, &d.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Device type")
		return
	}
	d.CreatedAt = ca.UTC().Format(time.RFC3339)
	d.UpdatedAt = ua.UTC().Format(time.RFC3339)
	response.OK(w, d)
}

func (h *DeviceTypeHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	mfID, _ := body["manufacturerId"].(string)
	model, _ := body["model"].(string)
	slug, _ := body["slug"].(string)
	if mfID == "" || model == "" {
		response.BadRequest(w, "manufacturerId and model are required")
		return
	}
	uHeight := 1
	if v, ok := body["uHeight"].(float64); ok {
		uHeight = int(v)
	}
	fullDepth := 1
	if v, ok := body["fullDepth"].(float64); ok {
		fullDepth = int(v)
	}
	desc, _ := body["description"].(string)

	var d deviceTypeRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO device_types (manufacturer_id, model, slug, u_height, full_depth, description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING %s`, dtCols),
		mfID, model, slug, uHeight, fullDepth, nilIfEmpty(desc)).Scan(
		&d.ID, &d.ManufacturerID, &d.Model, &d.Slug, &d.UHeight, &d.FullDepth, &d.Weight, &d.PowerDraw, &d.Description, &ca, &ua)
	if err != nil {
		log.Printf("device_type create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	d.CreatedAt = ca.UTC().Format(time.RFC3339)
	d.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "device_types", d.ID, nil, d)
	response.Created(w, d)
}

func (h *DeviceTypeHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	sc := []string{}
	args := []interface{}{}
	ai := 1
	for _, f := range []struct{ j, c string }{{"manufacturerId", "manufacturer_id"}, {"model", "model"}, {"slug", "slug"}, {"description", "description"}} {
		if v, ok := body[f.j].(string); ok {
			sc = append(sc, fmt.Sprintf("%s = $%d", f.c, ai))
			args = append(args, nilIfEmpty(v))
			ai++
		}
	}
	for _, f := range []struct{ j, c string }{{"uHeight", "u_height"}, {"fullDepth", "full_depth"}, {"powerDraw", "power_draw"}} {
		if v, ok := body[f.j].(float64); ok {
			sc = append(sc, fmt.Sprintf("%s = $%d", f.c, ai))
			args = append(args, int(v))
			ai++
		}
	}
	if v, ok := body["weight"].(float64); ok {
		sc = append(sc, fmt.Sprintf("weight = $%d", ai))
		args = append(args, v)
		ai++
	}
	sc = append(sc, fmt.Sprintf("updated_at = $%d", ai))
	args = append(args, time.Now().UTC())
	ai++
	if len(sc) <= 1 {
		response.BadRequest(w, "no fields to update")
		return
	}
	args = append(args, id)
	var d deviceTypeRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(), fmt.Sprintf(`UPDATE device_types SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING %s`, joinStrings(sc, ", "), ai, dtCols), args...).Scan(
		&d.ID, &d.ManufacturerID, &d.Model, &d.Slug, &d.UHeight, &d.FullDepth, &d.Weight, &d.PowerDraw, &d.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Device type")
		return
	}
	d.CreatedAt = ca.UTC().Format(time.RFC3339)
	d.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "device_types", id, nil, d)
	response.OK(w, d)
}

func (h *DeviceTypeHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `UPDATE device_types SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Device type")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "device_types", id, nil, nil)
	response.Message(w, "Device type deleted", http.StatusOK)
}
