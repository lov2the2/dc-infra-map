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

type CableHandler struct{ DB *db.DB }

type cableRow struct {
	ID               string  `json:"id"`
	CableType        string  `json:"cableType"`
	Status           string  `json:"status"`
	Label            string  `json:"label"`
	Length           *string `json:"length"`
	Color            *string `json:"color"`
	TerminationAType string  `json:"terminationAType"`
	TerminationAID   string  `json:"terminationAId"`
	TerminationBType string  `json:"terminationBType"`
	TerminationBID   string  `json:"terminationBId"`
	TenantID         *string `json:"tenantId"`
	Description      *string `json:"description"`
	CreatedAt        string  `json:"createdAt"`
	UpdatedAt        string  `json:"updatedAt"`
}

const cableCols = `id, cable_type, status, label, length, color, termination_a_type, termination_a_id, termination_b_type, termination_b_id, tenant_id, description, created_at, updated_at`

func (h *CableHandler) List(w http.ResponseWriter, r *http.Request) {
	query := fmt.Sprintf(`SELECT %s FROM cables WHERE deleted_at IS NULL`, cableCols)
	args := []interface{}{}
	ai := 1
	if v := r.URL.Query().Get("cableType"); v != "" {
		query += fmt.Sprintf(" AND cable_type = $%d", ai)
		args = append(args, v)
		ai++
	}
	if v := r.URL.Query().Get("status"); v != "" {
		query += fmt.Sprintf(" AND status = $%d", ai)
		args = append(args, v)
		ai++
	}
	if v := r.URL.Query().Get("search"); v != "" {
		query += fmt.Sprintf(" AND label ILIKE $%d", ai)
		args = append(args, "%"+v+"%")
		ai++
	}
	query += " ORDER BY label"
	rows, err := h.DB.Pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("cable list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []cableRow{}
	for rows.Next() {
		var c cableRow
		var ca, ua time.Time
		if err := rows.Scan(&c.ID, &c.CableType, &c.Status, &c.Label, &c.Length, &c.Color,
			&c.TerminationAType, &c.TerminationAID, &c.TerminationBType, &c.TerminationBID,
			&c.TenantID, &c.Description, &ca, &ua); err != nil {
			continue
		}
		c.CreatedAt = ca.UTC().Format(time.RFC3339)
		c.UpdatedAt = ua.UTC().Format(time.RFC3339)
		results = append(results, c)
	}
	response.OK(w, results)
}

func (h *CableHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var c cableRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`SELECT %s FROM cables WHERE id = $1 AND deleted_at IS NULL`, cableCols), id).Scan(
		&c.ID, &c.CableType, &c.Status, &c.Label, &c.Length, &c.Color,
		&c.TerminationAType, &c.TerminationAID, &c.TerminationBType, &c.TerminationBID,
		&c.TenantID, &c.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Cable")
		return
	}
	c.CreatedAt = ca.UTC().Format(time.RFC3339)
	c.UpdatedAt = ua.UTC().Format(time.RFC3339)
	response.OK(w, c)
}

func (h *CableHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	cableType, _ := body["cableType"].(string)
	label, _ := body["label"].(string)
	taType, _ := body["terminationAType"].(string)
	taID, _ := body["terminationAId"].(string)
	tbType, _ := body["terminationBType"].(string)
	tbID, _ := body["terminationBId"].(string)
	if cableType == "" || label == "" || taType == "" || taID == "" || tbType == "" || tbID == "" {
		response.BadRequest(w, "cableType, label, and both terminations are required")
		return
	}
	status := "connected"
	if s, ok := body["status"].(string); ok {
		status = s
	}
	length, _ := body["length"].(string)
	color, _ := body["color"].(string)
	tenantID, _ := body["tenantId"].(string)
	desc, _ := body["description"].(string)

	var c cableRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO cables (cable_type, status, label, length, color, termination_a_type, termination_a_id, termination_b_type, termination_b_id, tenant_id, description)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING %s`, cableCols),
		cableType, status, label, nilIfEmpty(length), nilIfEmpty(color), taType, taID, tbType, tbID, nilIfEmpty(tenantID), nilIfEmpty(desc)).Scan(
		&c.ID, &c.CableType, &c.Status, &c.Label, &c.Length, &c.Color,
		&c.TerminationAType, &c.TerminationAID, &c.TerminationBType, &c.TerminationBID,
		&c.TenantID, &c.Description, &ca, &ua)
	if err != nil {
		log.Printf("cable create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	c.CreatedAt = ca.UTC().Format(time.RFC3339)
	c.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "cables", c.ID, nil, c)
	response.Created(w, c)
}

func (h *CableHandler) Update(w http.ResponseWriter, r *http.Request) {
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
		{"cableType", "cable_type"}, {"status", "status"}, {"label", "label"},
		{"length", "length"}, {"color", "color"},
		{"terminationAType", "termination_a_type"}, {"terminationAId", "termination_a_id"},
		{"terminationBType", "termination_b_type"}, {"terminationBId", "termination_b_id"},
		{"tenantId", "tenant_id"}, {"description", "description"},
	} {
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
	var c cableRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`UPDATE cables SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING %s`, joinStrings(sc, ", "), ai, cableCols), args...).Scan(
		&c.ID, &c.CableType, &c.Status, &c.Label, &c.Length, &c.Color,
		&c.TerminationAType, &c.TerminationAID, &c.TerminationBType, &c.TerminationBID,
		&c.TenantID, &c.Description, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Cable")
		return
	}
	c.CreatedAt = ca.UTC().Format(time.RFC3339)
	c.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "cables", id, nil, c)
	response.OK(w, c)
}

func (h *CableHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `UPDATE cables SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Cable")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "cables", id, nil, nil)
	response.Message(w, "Cable deleted", http.StatusOK)
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
