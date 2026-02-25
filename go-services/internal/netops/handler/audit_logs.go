package handler

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/dcim/go-services/internal/shared/db"
	"github.com/dcim/go-services/internal/shared/response"
)

type AuditLogHandler struct{ DB *db.DB }

type auditLogRow struct {
	ID            string  `json:"id"`
	UserID        *string `json:"userId"`
	Action        string  `json:"action"`
	ActionType    *string `json:"actionType"`
	TableName     string  `json:"tableName"`
	RecordID      string  `json:"recordId"`
	ChangesBefore *string `json:"changesBefore"`
	ChangesAfter  *string `json:"changesAfter"`
	Reason        *string `json:"reason"`
	IPAddress     *string `json:"ipAddress"`
	UserAgent     *string `json:"userAgent"`
	CreatedAt     string  `json:"createdAt"`
}

func (h *AuditLogHandler) List(w http.ResponseWriter, r *http.Request) {
	query := `SELECT id, user_id, action, action_type, table_name, record_id, changes_before, changes_after, reason, ip_address, user_agent, created_at
		FROM audit_logs`
	args := []interface{}{}
	ai := 1
	where := ""
	if v := r.URL.Query().Get("tableName"); v != "" {
		where += fmt.Sprintf(" AND table_name = $%d", ai)
		args = append(args, v)
		ai++
	}
	if v := r.URL.Query().Get("recordId"); v != "" {
		where += fmt.Sprintf(" AND record_id = $%d", ai)
		args = append(args, v)
		ai++
	}
	if v := r.URL.Query().Get("action"); v != "" {
		where += fmt.Sprintf(" AND action = $%d", ai)
		args = append(args, v)
		ai++
	}
	if where != "" {
		query += " WHERE " + where[5:] // trim leading " AND "
	}
	query += " ORDER BY created_at DESC LIMIT 200"

	rows, err := h.DB.Pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("audit_log list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []auditLogRow{}
	for rows.Next() {
		var a auditLogRow
		var ca time.Time
		if err := rows.Scan(&a.ID, &a.UserID, &a.Action, &a.ActionType, &a.TableName,
			&a.RecordID, &a.ChangesBefore, &a.ChangesAfter, &a.Reason,
			&a.IPAddress, &a.UserAgent, &ca); err != nil {
			continue
		}
		a.CreatedAt = ca.UTC().Format(time.RFC3339)
		results = append(results, a)
	}
	response.OK(w, results)
}
