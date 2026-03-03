package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/dcim/go-services/internal/shared/audit"
	"github.com/dcim/go-services/internal/shared/crud"
	"github.com/dcim/go-services/internal/shared/db"
	"github.com/dcim/go-services/internal/shared/response"
)

type DeviceHandler struct{ DB *db.DB }

type deviceRow struct {
	ID                string  `json:"id"`
	Name              string  `json:"name"`
	DeviceTypeID      string  `json:"deviceTypeId"`
	RackID            *string `json:"rackId"`
	TenantID          *string `json:"tenantId"`
	Status            string  `json:"status"`
	Face              string  `json:"face"`
	Position          *int    `json:"position"`
	SerialNumber      *string `json:"serialNumber"`
	AssetTag          *string `json:"assetTag"`
	WarrantyExpiresAt *string `json:"warrantyExpiresAt"`
	PrimaryIP         *string `json:"primaryIp"`
	Description       *string `json:"description"`
	CreatedAt         string  `json:"createdAt"`
	UpdatedAt         string  `json:"updatedAt"`
}

const deviceCols = `id, name, device_type_id, rack_id, tenant_id, status, face, position, serial_number, asset_tag, warranty_expires_at, primary_ip, description, created_at, updated_at`

func scanDevice(scan func(dest ...interface{}) error) (deviceRow, error) {
	var d deviceRow
	var ca, ua time.Time
	var wea *time.Time
	err := scan(&d.ID, &d.Name, &d.DeviceTypeID, &d.RackID, &d.TenantID, &d.Status, &d.Face, &d.Position,
		&d.SerialNumber, &d.AssetTag, &wea, &d.PrimaryIP, &d.Description, &ca, &ua)
	if err != nil {
		return d, err
	}
	d.CreatedAt = ca.UTC().Format(time.RFC3339)
	d.UpdatedAt = ua.UTC().Format(time.RFC3339)
	if wea != nil {
		s := wea.UTC().Format(time.RFC3339)
		d.WarrantyExpiresAt = &s
	}
	return d, nil
}

func (h *DeviceHandler) List(w http.ResponseWriter, r *http.Request) {
	pg := crud.ParsePagination(r)
	where := `WHERE deleted_at IS NULL`
	args := []interface{}{}
	ai := 1
	if v := r.URL.Query().Get("rackId"); v != "" {
		where += fmt.Sprintf(" AND rack_id = $%d", ai)
		args = append(args, v)
		ai++
	}
	if v := r.URL.Query().Get("status"); v != "" {
		where += fmt.Sprintf(" AND status = $%d", ai)
		args = append(args, v)
		ai++
	}
	if v := r.URL.Query().Get("tenantId"); v != "" {
		where += fmt.Sprintf(" AND tenant_id = $%d", ai)
		args = append(args, v)
		ai++
	}
	if v := r.URL.Query().Get("search"); v != "" {
		where += fmt.Sprintf(" AND name ILIKE $%d", ai)
		args = append(args, "%"+v+"%")
		ai++
	}

	var total int
	countArgs := make([]interface{}, len(args))
	copy(countArgs, args)
	if err := h.DB.Pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM devices `+where, countArgs...).Scan(&total); err != nil {
		log.Printf("device count error: %v", err)
		response.InternalError(w, "database error")
		return
	}

	query := fmt.Sprintf(`SELECT %s FROM devices %s ORDER BY name LIMIT $%d OFFSET $%d`, deviceCols, where, ai, ai+1)
	args = append(args, pg.Limit, pg.Offset)

	rows, err := h.DB.Pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("device list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []deviceRow{}
	for rows.Next() {
		d, err := scanDevice(rows.Scan)
		if err != nil {
			continue
		}
		results = append(results, d)
	}
	response.OK(w, map[string]interface{}{"data": results, "total": total, "limit": pg.Limit, "offset": pg.Offset})
}

func (h *DeviceHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	d, err := scanDevice(h.DB.Pool.QueryRow(r.Context(), fmt.Sprintf(`SELECT %s FROM devices WHERE id = $1 AND deleted_at IS NULL`, deviceCols), id).Scan)
	if err != nil {
		response.NotFound(w, "Device")
		return
	}
	response.OK(w, d)
}

func (h *DeviceHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	name, _ := body["name"].(string)
	dtID, _ := body["deviceTypeId"].(string)
	if name == "" || dtID == "" {
		response.BadRequest(w, "name and deviceTypeId are required")
		return
	}
	rackID, _ := body["rackId"].(string)
	tenantID, _ := body["tenantId"].(string)
	status := "planned"
	if s, ok := body["status"].(string); ok {
		status = s
	}
	face := "front"
	if f, ok := body["face"].(string); ok {
		face = f
	}
	var pos *int
	if p, ok := body["position"].(float64); ok {
		pi := int(p)
		pos = &pi
	}
	serial, _ := body["serialNumber"].(string)
	asset, _ := body["assetTag"].(string)
	pip, _ := body["primaryIp"].(string)
	desc, _ := body["description"].(string)

	d, err := scanDevice(h.DB.Pool.QueryRow(r.Context(), fmt.Sprintf(
		`INSERT INTO devices (name, device_type_id, rack_id, tenant_id, status, face, position, serial_number, asset_tag, primary_ip, description)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING %s`, deviceCols),
		name, dtID, nilIfEmpty(rackID), nilIfEmpty(tenantID), status, face, pos,
		nilIfEmpty(serial), nilIfEmpty(asset), nilIfEmpty(pip), nilIfEmpty(desc)).Scan)
	if err != nil {
		log.Printf("device create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "devices", d.ID, nil, d)
	response.Created(w, d)
}

func (h *DeviceHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	sc := []string{}
	args := []interface{}{}
	ai := 1
	for _, f := range []struct{ j, c string }{
		{"name", "name"}, {"deviceTypeId", "device_type_id"}, {"rackId", "rack_id"},
		{"tenantId", "tenant_id"}, {"status", "status"}, {"face", "face"},
		{"serialNumber", "serial_number"}, {"assetTag", "asset_tag"}, {"primaryIp", "primary_ip"}, {"description", "description"},
	} {
		if v, ok := body[f.j].(string); ok {
			sc = append(sc, fmt.Sprintf("%s = $%d", f.c, ai))
			args = append(args, nilIfEmpty(v))
			ai++
		}
	}
	if v, ok := body["position"].(float64); ok {
		sc = append(sc, fmt.Sprintf("position = $%d", ai))
		args = append(args, int(v))
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
	q := fmt.Sprintf(`UPDATE devices SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING %s`, joinStrings(sc, ", "), ai, deviceCols)
	d, err := scanDevice(h.DB.Pool.QueryRow(r.Context(), q, args...).Scan)
	if err != nil {
		response.NotFound(w, "Device")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "devices", id, nil, d)
	response.OK(w, d)
}

func (h *DeviceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `UPDATE devices SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Device")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "devices", id, nil, nil)
	response.Message(w, "Device deleted", http.StatusOK)
}

// Batch handles POST /devices/batch — batch delete or status change.
func (h *DeviceHandler) Batch(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Action string   `json:"action"`
		IDs    []string `json:"ids"`
		Status string   `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	if len(body.IDs) == 0 {
		response.BadRequest(w, "ids are required")
		return
	}
	ctx := r.Context()
	now := time.Now().UTC()
	switch body.Action {
	case "delete":
		tag, err := h.DB.Pool.Exec(ctx, `UPDATE devices SET deleted_at = $1 WHERE id = ANY($2) AND deleted_at IS NULL`, now, body.IDs)
		if err != nil {
			response.InternalError(w, "batch delete failed")
			return
		}
		response.OK(w, map[string]int64{"deleted": tag.RowsAffected()})
	case "statusChange":
		if body.Status == "" {
			response.BadRequest(w, "status is required for statusChange")
			return
		}
		tag, err := h.DB.Pool.Exec(ctx, `UPDATE devices SET status = $1, updated_at = $2 WHERE id = ANY($3) AND deleted_at IS NULL`, body.Status, now, body.IDs)
		if err != nil {
			response.InternalError(w, "batch status change failed")
			return
		}
		response.OK(w, map[string]int64{"updated": tag.RowsAffected()})
	default:
		response.BadRequest(w, "action must be 'delete' or 'statusChange'")
	}
}
