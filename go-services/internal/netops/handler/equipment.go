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

type EquipmentMovementHandler struct{ DB *db.DB }

type equipmentMovementRow struct {
	ID           string  `json:"id"`
	SiteID       string  `json:"siteId"`
	RackID       *string `json:"rackId"`
	DeviceID     *string `json:"deviceId"`
	MovementType string  `json:"movementType"`
	Status       string  `json:"status"`
	Description  *string `json:"description"`
	RequestedBy  string  `json:"requestedBy"`
	ApprovedBy   *string `json:"approvedBy"`
	ApprovedAt   *string `json:"approvedAt"`
	CompletedAt  *string `json:"completedAt"`
	SerialNumber *string `json:"serialNumber"`
	AssetTag     *string `json:"assetTag"`
	Notes        *string `json:"notes"`
	CreatedAt    string  `json:"createdAt"`
	UpdatedAt    string  `json:"updatedAt"`
}

const emCols = `id, site_id, rack_id, device_id, movement_type, status, description, requested_by, approved_by, approved_at, completed_at, serial_number, asset_tag, notes, created_at, updated_at`

func scanEquipment(scan func(dest ...interface{}) error) (equipmentMovementRow, error) {
	var e equipmentMovementRow
	var ca, ua time.Time
	var approvedAt, completedAt *time.Time
	err := scan(&e.ID, &e.SiteID, &e.RackID, &e.DeviceID, &e.MovementType, &e.Status,
		&e.Description, &e.RequestedBy, &e.ApprovedBy, &approvedAt, &completedAt,
		&e.SerialNumber, &e.AssetTag, &e.Notes, &ca, &ua)
	if err != nil {
		return e, err
	}
	e.CreatedAt = ca.UTC().Format(time.RFC3339)
	e.UpdatedAt = ua.UTC().Format(time.RFC3339)
	if approvedAt != nil {
		s := approvedAt.UTC().Format(time.RFC3339)
		e.ApprovedAt = &s
	}
	if completedAt != nil {
		s := completedAt.UTC().Format(time.RFC3339)
		e.CompletedAt = &s
	}
	return e, nil
}

func (h *EquipmentMovementHandler) List(w http.ResponseWriter, r *http.Request) {
	query := fmt.Sprintf(`SELECT %s FROM equipment_movements WHERE deleted_at IS NULL`, emCols)
	args := []interface{}{}
	ai := 1
	if v := r.URL.Query().Get("siteId"); v != "" {
		query += fmt.Sprintf(" AND site_id = $%d", ai)
		args = append(args, v)
		ai++
	}
	if v := r.URL.Query().Get("status"); v != "" {
		query += fmt.Sprintf(" AND status = $%d", ai)
		args = append(args, v)
		ai++
	}
	query += " ORDER BY created_at DESC"
	rows, err := h.DB.Pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("equipment_movement list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []equipmentMovementRow{}
	for rows.Next() {
		e, err := scanEquipment(rows.Scan)
		if err != nil {
			continue
		}
		results = append(results, e)
	}
	response.OK(w, results)
}

func (h *EquipmentMovementHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	e, err := scanEquipment(h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`SELECT %s FROM equipment_movements WHERE id = $1 AND deleted_at IS NULL`, emCols), id).Scan)
	if err != nil {
		response.NotFound(w, "Equipment movement")
		return
	}
	response.OK(w, e)
}

func (h *EquipmentMovementHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	siteID, _ := body["siteId"].(string)
	movementType, _ := body["movementType"].(string)
	requestedBy, _ := body["requestedBy"].(string)
	if siteID == "" || movementType == "" || requestedBy == "" {
		response.BadRequest(w, "siteId, movementType, and requestedBy are required")
		return
	}
	rackID, _ := body["rackId"].(string)
	deviceID, _ := body["deviceId"].(string)
	status := "pending"
	if s, ok := body["status"].(string); ok {
		status = s
	}
	desc, _ := body["description"].(string)
	serial, _ := body["serialNumber"].(string)
	asset, _ := body["assetTag"].(string)
	notes, _ := body["notes"].(string)

	e, err := scanEquipment(h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO equipment_movements (site_id, rack_id, device_id, movement_type, status, description, requested_by, serial_number, asset_tag, notes)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING %s`, emCols),
		siteID, nilIfEmpty(rackID), nilIfEmpty(deviceID), movementType, status,
		nilIfEmpty(desc), requestedBy, nilIfEmpty(serial), nilIfEmpty(asset), nilIfEmpty(notes)).Scan)
	if err != nil {
		log.Printf("equipment_movement create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "equipment_movements", e.ID, nil, e)
	response.Created(w, e)
}

func (h *EquipmentMovementHandler) Update(w http.ResponseWriter, r *http.Request) {
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
		{"siteId", "site_id"}, {"rackId", "rack_id"}, {"deviceId", "device_id"},
		{"movementType", "movement_type"}, {"status", "status"}, {"description", "description"},
		{"requestedBy", "requested_by"}, {"approvedBy", "approved_by"},
		{"serialNumber", "serial_number"}, {"assetTag", "asset_tag"}, {"notes", "notes"},
	} {
		if v, ok := body[f.j].(string); ok {
			sc = append(sc, fmt.Sprintf("%s = $%d", f.c, ai))
			args = append(args, nilIfEmpty(v))
			ai++
		}
	}
	if _, ok := body["approvedAt"]; ok {
		sc = append(sc, fmt.Sprintf("approved_at = $%d", ai))
		args = append(args, time.Now().UTC())
		ai++
	}
	if _, ok := body["completedAt"]; ok {
		sc = append(sc, fmt.Sprintf("completed_at = $%d", ai))
		args = append(args, time.Now().UTC())
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
	e, err := scanEquipment(h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`UPDATE equipment_movements SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING %s`, joinStrings(sc, ", "), ai, emCols), args...).Scan)
	if err != nil {
		response.NotFound(w, "Equipment movement")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "equipment_movements", id, nil, e)
	response.OK(w, e)
}

func (h *EquipmentMovementHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `UPDATE equipment_movements SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Equipment movement")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "equipment_movements", id, nil, nil)
	response.Message(w, "Equipment movement deleted", http.StatusOK)
}
