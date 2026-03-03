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

type RackHandler struct{ DB *db.DB }

type rackRow struct {
	ID           string          `json:"id"`
	Name         string          `json:"name"`
	LocationID   string          `json:"locationId"`
	TenantID     *string         `json:"tenantId"`
	Type         string          `json:"type"`
	UHeight      int             `json:"uHeight"`
	PosX         *int            `json:"posX"`
	PosY         *int            `json:"posY"`
	Rotation     *int            `json:"rotation"`
	Description  *string         `json:"description"`
	CustomFields json.RawMessage `json:"customFields"`
	CreatedAt    string          `json:"createdAt"`
	UpdatedAt    string          `json:"updatedAt"`
}

const rackCols = `id, name, location_id, tenant_id, type, u_height, pos_x, pos_y, rotation, description, custom_fields, created_at, updated_at`

func scanRack(rk *rackRow, ca, ua *time.Time) {
	rk.CreatedAt = ca.UTC().Format(time.RFC3339)
	rk.UpdatedAt = ua.UTC().Format(time.RFC3339)
	if rk.CustomFields == nil {
		rk.CustomFields = json.RawMessage("{}")
	}
}

func (h *RackHandler) List(w http.ResponseWriter, r *http.Request) {
	locID := r.URL.Query().Get("locationId")
	query := fmt.Sprintf(`SELECT %s FROM racks WHERE deleted_at IS NULL`, rackCols)
	args := []interface{}{}
	ai := 1
	if locID != "" {
		query += fmt.Sprintf(" AND location_id = $%d", ai)
		args = append(args, locID)
		ai++
	}
	query += " ORDER BY name"
	rows, err := h.DB.Pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("rack list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []rackRow{}
	for rows.Next() {
		var rk rackRow
		var ca, ua time.Time
		if err := rows.Scan(&rk.ID, &rk.Name, &rk.LocationID, &rk.TenantID, &rk.Type, &rk.UHeight, &rk.PosX, &rk.PosY, &rk.Rotation, &rk.Description, &rk.CustomFields, &ca, &ua); err != nil {
			continue
		}
		scanRack(&rk, &ca, &ua)
		results = append(results, rk)
	}
	response.OK(w, results)
}

func (h *RackHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var rk rackRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`SELECT %s FROM racks WHERE id = $1 AND deleted_at IS NULL`, rackCols), id).Scan(
		&rk.ID, &rk.Name, &rk.LocationID, &rk.TenantID, &rk.Type, &rk.UHeight, &rk.PosX, &rk.PosY, &rk.Rotation, &rk.Description, &rk.CustomFields, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Rack")
		return
	}
	scanRack(&rk, &ca, &ua)
	response.OK(w, rk)
}

func (h *RackHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	name, _ := body["name"].(string)
	locationID, _ := body["locationId"].(string)
	if name == "" || locationID == "" {
		response.BadRequest(w, "name and locationId are required")
		return
	}
	tenantID, _ := body["tenantId"].(string)
	rType := "server"
	if t, ok := body["type"].(string); ok {
		rType = t
	}
	uHeight := 42
	if u, ok := body["uHeight"].(float64); ok {
		uHeight = int(u)
	}
	desc, _ := body["description"].(string)

	var customFields interface{}
	if cf, ok := body["customFields"]; ok && cf != nil {
		cfBytes, _ := json.Marshal(cf)
		customFields = cfBytes
	}

	var rk rackRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO racks (name, location_id, tenant_id, type, u_height, description, custom_fields)
		 VALUES ($1,$2,$3,$4,$5,$6,$7)
		 RETURNING %s`, rackCols),
		name, locationID, nilIfEmpty(tenantID), rType, uHeight, nilIfEmpty(desc), customFields).Scan(
		&rk.ID, &rk.Name, &rk.LocationID, &rk.TenantID, &rk.Type, &rk.UHeight, &rk.PosX, &rk.PosY, &rk.Rotation, &rk.Description, &rk.CustomFields, &ca, &ua)
	if err != nil {
		log.Printf("rack create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	scanRack(&rk, &ca, &ua)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "racks", rk.ID, nil, rk)
	response.Created(w, rk)
}

func (h *RackHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	sc := []string{}
	args := []interface{}{}
	ai := 1
	strFields := []struct{ j, c string }{{"name", "name"}, {"locationId", "location_id"}, {"tenantId", "tenant_id"}, {"type", "type"}, {"description", "description"}}
	for _, f := range strFields {
		if v, ok := body[f.j].(string); ok {
			sc = append(sc, fmt.Sprintf("%s = $%d", f.c, ai))
			args = append(args, nilIfEmpty(v))
			ai++
		}
	}
	intFields := []struct{ j, c string }{{"uHeight", "u_height"}, {"posX", "pos_x"}, {"posY", "pos_y"}, {"rotation", "rotation"}}
	for _, f := range intFields {
		if v, ok := body[f.j].(float64); ok {
			sc = append(sc, fmt.Sprintf("%s = $%d", f.c, ai))
			args = append(args, int(v))
			ai++
		}
	}
	if cf, ok := body["customFields"]; ok && cf != nil {
		cfBytes, _ := json.Marshal(cf)
		sc = append(sc, fmt.Sprintf("custom_fields = $%d", ai))
		args = append(args, cfBytes)
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
	q := fmt.Sprintf(`UPDATE racks SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING %s`, joinStrings(sc, ", "), ai, rackCols)
	var rk rackRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(), q, args...).Scan(
		&rk.ID, &rk.Name, &rk.LocationID, &rk.TenantID, &rk.Type, &rk.UHeight, &rk.PosX, &rk.PosY, &rk.Rotation, &rk.Description, &rk.CustomFields, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Rack")
		return
	}
	scanRack(&rk, &ca, &ua)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "racks", id, nil, rk)
	response.OK(w, rk)
}

func (h *RackHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `UPDATE racks SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Rack")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "racks", id, nil, nil)
	response.Message(w, "Rack deleted", http.StatusOK)
}
