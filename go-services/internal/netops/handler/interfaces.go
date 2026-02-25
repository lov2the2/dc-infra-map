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

type InterfaceHandler struct{ DB *db.DB }

type interfaceRow struct {
	ID            string  `json:"id"`
	DeviceID      string  `json:"deviceId"`
	Name          string  `json:"name"`
	InterfaceType string  `json:"interfaceType"`
	Speed         *int    `json:"speed"`
	MACAddress    *string `json:"macAddress"`
	Enabled       bool    `json:"enabled"`
	Description   *string `json:"description"`
	CreatedAt     string  `json:"createdAt"`
	UpdatedAt     string  `json:"updatedAt"`
}

const ifaceCols = `id, device_id, name, interface_type, speed, mac_address, enabled, description, created_at, updated_at`

func (h *InterfaceHandler) List(w http.ResponseWriter, r *http.Request) {
	query := fmt.Sprintf(`SELECT %s FROM interfaces WHERE deleted_at IS NULL`, ifaceCols)
	args := []interface{}{}
	ai := 1
	if v := r.URL.Query().Get("deviceId"); v != "" {
		query += fmt.Sprintf(" AND device_id = $%d", ai)
		args = append(args, v)
		ai++
	}
	query += " ORDER BY name"
	rows, err := h.DB.Pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("interface list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []interfaceRow{}
	for rows.Next() {
		var i interfaceRow
		var ca, ua time.Time
		if err := rows.Scan(&i.ID, &i.DeviceID, &i.Name, &i.InterfaceType, &i.Speed, &i.MACAddress, &i.Enabled, &i.Description, &ca, &ua); err != nil {
			continue
		}
		i.CreatedAt = ca.UTC().Format(time.RFC3339)
		i.UpdatedAt = ua.UTC().Format(time.RFC3339)
		results = append(results, i)
	}
	response.OK(w, results)
}

func (h *InterfaceHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var i interfaceRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`SELECT %s FROM interfaces WHERE id = $1 AND deleted_at IS NULL`, ifaceCols), id).Scan(
		&i.ID, &i.DeviceID, &i.Name, &i.InterfaceType, &i.Speed, &i.MACAddress, &i.Enabled, &i.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Interface")
		return
	}
	i.CreatedAt = ca.UTC().Format(time.RFC3339)
	i.UpdatedAt = ua.UTC().Format(time.RFC3339)
	response.OK(w, i)
}

func (h *InterfaceHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	deviceID, _ := body["deviceId"].(string)
	name, _ := body["name"].(string)
	ifaceType, _ := body["interfaceType"].(string)
	if deviceID == "" || name == "" || ifaceType == "" {
		response.BadRequest(w, "deviceId, name, and interfaceType are required")
		return
	}
	var speed *int
	if v, ok := body["speed"].(float64); ok {
		s := int(v)
		speed = &s
	}
	mac, _ := body["macAddress"].(string)
	enabled := true
	if v, ok := body["enabled"].(bool); ok {
		enabled = v
	}
	desc, _ := body["description"].(string)

	var i interfaceRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO interfaces (device_id, name, interface_type, speed, mac_address, enabled, description)
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING %s`, ifaceCols),
		deviceID, name, ifaceType, speed, nilIfEmpty(mac), enabled, nilIfEmpty(desc)).Scan(
		&i.ID, &i.DeviceID, &i.Name, &i.InterfaceType, &i.Speed, &i.MACAddress, &i.Enabled, &i.Description, &ca, &ua)
	if err != nil {
		log.Printf("interface create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	i.CreatedAt = ca.UTC().Format(time.RFC3339)
	i.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "interfaces", i.ID, nil, i)
	response.Created(w, i)
}

func (h *InterfaceHandler) Update(w http.ResponseWriter, r *http.Request) {
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
		{"deviceId", "device_id"}, {"name", "name"}, {"interfaceType", "interface_type"}, {"macAddress", "mac_address"}, {"description", "description"},
	} {
		if v, ok := body[f.j].(string); ok {
			sc = append(sc, fmt.Sprintf("%s = $%d", f.c, ai))
			args = append(args, nilIfEmpty(v))
			ai++
		}
	}
	if v, ok := body["speed"].(float64); ok {
		sc = append(sc, fmt.Sprintf("speed = $%d", ai))
		args = append(args, int(v))
		ai++
	}
	if v, ok := body["enabled"].(bool); ok {
		sc = append(sc, fmt.Sprintf("enabled = $%d", ai))
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
	var i interfaceRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`UPDATE interfaces SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING %s`, joinStrings(sc, ", "), ai, ifaceCols), args...).Scan(
		&i.ID, &i.DeviceID, &i.Name, &i.InterfaceType, &i.Speed, &i.MACAddress, &i.Enabled, &i.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Interface")
		return
	}
	i.CreatedAt = ca.UTC().Format(time.RFC3339)
	i.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "interfaces", id, nil, i)
	response.OK(w, i)
}

func (h *InterfaceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `UPDATE interfaces SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Interface")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "interfaces", id, nil, nil)
	response.Message(w, "Interface deleted", http.StatusOK)
}
