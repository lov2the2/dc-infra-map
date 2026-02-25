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

// --- Console Ports ---

type ConsolePortHandler struct{ DB *db.DB }

type consolePortRow struct {
	ID          string  `json:"id"`
	DeviceID    string  `json:"deviceId"`
	Name        string  `json:"name"`
	PortType    string  `json:"portType"`
	Speed       *int    `json:"speed"`
	Description *string `json:"description"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

const cpCols = `id, device_id, name, port_type, speed, description, created_at, updated_at`

func (h *ConsolePortHandler) List(w http.ResponseWriter, r *http.Request) {
	query := fmt.Sprintf(`SELECT %s FROM console_ports WHERE deleted_at IS NULL`, cpCols)
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
		log.Printf("console_port list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []consolePortRow{}
	for rows.Next() {
		var p consolePortRow
		var ca, ua time.Time
		if err := rows.Scan(&p.ID, &p.DeviceID, &p.Name, &p.PortType, &p.Speed, &p.Description, &ca, &ua); err != nil {
			continue
		}
		p.CreatedAt = ca.UTC().Format(time.RFC3339)
		p.UpdatedAt = ua.UTC().Format(time.RFC3339)
		results = append(results, p)
	}
	response.OK(w, results)
}

func (h *ConsolePortHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var p consolePortRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`SELECT %s FROM console_ports WHERE id = $1 AND deleted_at IS NULL`, cpCols), id).Scan(
		&p.ID, &p.DeviceID, &p.Name, &p.PortType, &p.Speed, &p.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Console port")
		return
	}
	p.CreatedAt = ca.UTC().Format(time.RFC3339)
	p.UpdatedAt = ua.UTC().Format(time.RFC3339)
	response.OK(w, p)
}

func (h *ConsolePortHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	deviceID, _ := body["deviceId"].(string)
	name, _ := body["name"].(string)
	portType, _ := body["portType"].(string)
	if deviceID == "" || name == "" || portType == "" {
		response.BadRequest(w, "deviceId, name, and portType are required")
		return
	}
	var speed *int
	if v, ok := body["speed"].(float64); ok {
		s := int(v)
		speed = &s
	}
	desc, _ := body["description"].(string)

	var p consolePortRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO console_ports (device_id, name, port_type, speed, description)
		VALUES ($1,$2,$3,$4,$5) RETURNING %s`, cpCols),
		deviceID, name, portType, speed, nilIfEmpty(desc)).Scan(
		&p.ID, &p.DeviceID, &p.Name, &p.PortType, &p.Speed, &p.Description, &ca, &ua)
	if err != nil {
		log.Printf("console_port create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	p.CreatedAt = ca.UTC().Format(time.RFC3339)
	p.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "console_ports", p.ID, nil, p)
	response.Created(w, p)
}

func (h *ConsolePortHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	sc := []string{}
	args := []interface{}{}
	ai := 1
	for _, f := range []struct{ j, c string }{{"deviceId", "device_id"}, {"name", "name"}, {"portType", "port_type"}, {"description", "description"}} {
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
	sc = append(sc, fmt.Sprintf("updated_at = $%d", ai))
	args = append(args, time.Now().UTC())
	ai++
	if len(sc) <= 1 {
		response.BadRequest(w, "no fields to update")
		return
	}
	args = append(args, id)
	var p consolePortRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`UPDATE console_ports SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING %s`, joinStrings(sc, ", "), ai, cpCols), args...).Scan(
		&p.ID, &p.DeviceID, &p.Name, &p.PortType, &p.Speed, &p.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Console port")
		return
	}
	p.CreatedAt = ca.UTC().Format(time.RFC3339)
	p.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "console_ports", id, nil, p)
	response.OK(w, p)
}

func (h *ConsolePortHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `UPDATE console_ports SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Console port")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "console_ports", id, nil, nil)
	response.Message(w, "Console port deleted", http.StatusOK)
}

// --- Front Ports ---

type FrontPortHandler struct{ DB *db.DB }

type frontPortRow struct {
	ID          string  `json:"id"`
	DeviceID    string  `json:"deviceId"`
	Name        string  `json:"name"`
	PortType    string  `json:"portType"`
	RearPortID  string  `json:"rearPortId"`
	Description *string `json:"description"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

const fpCols = `id, device_id, name, port_type, rear_port_id, description, created_at, updated_at`

func (h *FrontPortHandler) List(w http.ResponseWriter, r *http.Request) {
	query := fmt.Sprintf(`SELECT %s FROM front_ports WHERE deleted_at IS NULL`, fpCols)
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
		log.Printf("front_port list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []frontPortRow{}
	for rows.Next() {
		var p frontPortRow
		var ca, ua time.Time
		if err := rows.Scan(&p.ID, &p.DeviceID, &p.Name, &p.PortType, &p.RearPortID, &p.Description, &ca, &ua); err != nil {
			continue
		}
		p.CreatedAt = ca.UTC().Format(time.RFC3339)
		p.UpdatedAt = ua.UTC().Format(time.RFC3339)
		results = append(results, p)
	}
	response.OK(w, results)
}

func (h *FrontPortHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var p frontPortRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`SELECT %s FROM front_ports WHERE id = $1 AND deleted_at IS NULL`, fpCols), id).Scan(
		&p.ID, &p.DeviceID, &p.Name, &p.PortType, &p.RearPortID, &p.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Front port")
		return
	}
	p.CreatedAt = ca.UTC().Format(time.RFC3339)
	p.UpdatedAt = ua.UTC().Format(time.RFC3339)
	response.OK(w, p)
}

func (h *FrontPortHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	deviceID, _ := body["deviceId"].(string)
	name, _ := body["name"].(string)
	portType, _ := body["portType"].(string)
	rearPortID, _ := body["rearPortId"].(string)
	if deviceID == "" || name == "" || portType == "" || rearPortID == "" {
		response.BadRequest(w, "deviceId, name, portType, and rearPortId are required")
		return
	}
	desc, _ := body["description"].(string)

	var p frontPortRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO front_ports (device_id, name, port_type, rear_port_id, description)
		VALUES ($1,$2,$3,$4,$5) RETURNING %s`, fpCols),
		deviceID, name, portType, rearPortID, nilIfEmpty(desc)).Scan(
		&p.ID, &p.DeviceID, &p.Name, &p.PortType, &p.RearPortID, &p.Description, &ca, &ua)
	if err != nil {
		log.Printf("front_port create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	p.CreatedAt = ca.UTC().Format(time.RFC3339)
	p.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "front_ports", p.ID, nil, p)
	response.Created(w, p)
}

func (h *FrontPortHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	sc := []string{}
	args := []interface{}{}
	ai := 1
	for _, f := range []struct{ j, c string }{{"deviceId", "device_id"}, {"name", "name"}, {"portType", "port_type"}, {"rearPortId", "rear_port_id"}, {"description", "description"}} {
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
	var p frontPortRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`UPDATE front_ports SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING %s`, joinStrings(sc, ", "), ai, fpCols), args...).Scan(
		&p.ID, &p.DeviceID, &p.Name, &p.PortType, &p.RearPortID, &p.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Front port")
		return
	}
	p.CreatedAt = ca.UTC().Format(time.RFC3339)
	p.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "front_ports", id, nil, p)
	response.OK(w, p)
}

func (h *FrontPortHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `UPDATE front_ports SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Front port")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "front_ports", id, nil, nil)
	response.Message(w, "Front port deleted", http.StatusOK)
}

// --- Rear Ports ---

type RearPortHandler struct{ DB *db.DB }

type rearPortRow struct {
	ID          string  `json:"id"`
	DeviceID    string  `json:"deviceId"`
	Name        string  `json:"name"`
	PortType    string  `json:"portType"`
	Positions   int     `json:"positions"`
	Description *string `json:"description"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

const rpCols = `id, device_id, name, port_type, positions, description, created_at, updated_at`

func (h *RearPortHandler) List(w http.ResponseWriter, r *http.Request) {
	query := fmt.Sprintf(`SELECT %s FROM rear_ports WHERE deleted_at IS NULL`, rpCols)
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
		log.Printf("rear_port list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []rearPortRow{}
	for rows.Next() {
		var p rearPortRow
		var ca, ua time.Time
		if err := rows.Scan(&p.ID, &p.DeviceID, &p.Name, &p.PortType, &p.Positions, &p.Description, &ca, &ua); err != nil {
			continue
		}
		p.CreatedAt = ca.UTC().Format(time.RFC3339)
		p.UpdatedAt = ua.UTC().Format(time.RFC3339)
		results = append(results, p)
	}
	response.OK(w, results)
}

func (h *RearPortHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var p rearPortRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`SELECT %s FROM rear_ports WHERE id = $1 AND deleted_at IS NULL`, rpCols), id).Scan(
		&p.ID, &p.DeviceID, &p.Name, &p.PortType, &p.Positions, &p.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Rear port")
		return
	}
	p.CreatedAt = ca.UTC().Format(time.RFC3339)
	p.UpdatedAt = ua.UTC().Format(time.RFC3339)
	response.OK(w, p)
}

func (h *RearPortHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	deviceID, _ := body["deviceId"].(string)
	name, _ := body["name"].(string)
	portType, _ := body["portType"].(string)
	if deviceID == "" || name == "" || portType == "" {
		response.BadRequest(w, "deviceId, name, and portType are required")
		return
	}
	positions := 1
	if v, ok := body["positions"].(float64); ok {
		positions = int(v)
	}
	desc, _ := body["description"].(string)

	var p rearPortRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO rear_ports (device_id, name, port_type, positions, description)
		VALUES ($1,$2,$3,$4,$5) RETURNING %s`, rpCols),
		deviceID, name, portType, positions, nilIfEmpty(desc)).Scan(
		&p.ID, &p.DeviceID, &p.Name, &p.PortType, &p.Positions, &p.Description, &ca, &ua)
	if err != nil {
		log.Printf("rear_port create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	p.CreatedAt = ca.UTC().Format(time.RFC3339)
	p.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "rear_ports", p.ID, nil, p)
	response.Created(w, p)
}

func (h *RearPortHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	sc := []string{}
	args := []interface{}{}
	ai := 1
	for _, f := range []struct{ j, c string }{{"deviceId", "device_id"}, {"name", "name"}, {"portType", "port_type"}, {"description", "description"}} {
		if v, ok := body[f.j].(string); ok {
			sc = append(sc, fmt.Sprintf("%s = $%d", f.c, ai))
			args = append(args, nilIfEmpty(v))
			ai++
		}
	}
	if v, ok := body["positions"].(float64); ok {
		sc = append(sc, fmt.Sprintf("positions = $%d", ai))
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
	var p rearPortRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`UPDATE rear_ports SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING %s`, joinStrings(sc, ", "), ai, rpCols), args...).Scan(
		&p.ID, &p.DeviceID, &p.Name, &p.PortType, &p.Positions, &p.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Rear port")
		return
	}
	p.CreatedAt = ca.UTC().Format(time.RFC3339)
	p.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "rear_ports", id, nil, p)
	response.OK(w, p)
}

func (h *RearPortHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `UPDATE rear_ports SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Rear port")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "rear_ports", id, nil, nil)
	response.Message(w, "Rear port deleted", http.StatusOK)
}
