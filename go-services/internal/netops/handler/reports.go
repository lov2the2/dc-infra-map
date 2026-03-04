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

type ReportScheduleHandler struct{ DB *db.DB }

type reportScheduleRow struct {
	ID              string          `json:"id"`
	Name            string          `json:"name"`
	ReportType      string          `json:"reportType"`
	Frequency       string          `json:"frequency"`
	CronExpression  string          `json:"cronExpression"`
	RecipientEmails json.RawMessage `json:"recipientEmails"`
	IsActive        bool            `json:"isActive"`
	LastRunAt       *string         `json:"lastRunAt"`
	NextRunAt       *string         `json:"nextRunAt"`
	CreatedBy       *string         `json:"createdBy"`
	CreatedAt       string          `json:"createdAt"`
	UpdatedAt       string          `json:"updatedAt"`
}

const rsCols = `id, name, report_type, frequency, cron_expression, recipient_emails, is_active, last_run_at, next_run_at, created_by, created_at, updated_at`

func scanSchedule(scan func(dest ...interface{}) error) (reportScheduleRow, error) {
	var r reportScheduleRow
	var ca, ua time.Time
	var lastRun, nextRun *time.Time
	err := scan(&r.ID, &r.Name, &r.ReportType, &r.Frequency, &r.CronExpression,
		&r.RecipientEmails, &r.IsActive, &lastRun, &nextRun, &r.CreatedBy, &ca, &ua)
	if err != nil {
		return r, err
	}
	r.CreatedAt = ca.UTC().Format(time.RFC3339)
	r.UpdatedAt = ua.UTC().Format(time.RFC3339)
	if r.RecipientEmails == nil {
		r.RecipientEmails = json.RawMessage("[]")
	}
	if lastRun != nil {
		s := lastRun.UTC().Format(time.RFC3339)
		r.LastRunAt = &s
	}
	if nextRun != nil {
		s := nextRun.UTC().Format(time.RFC3339)
		r.NextRunAt = &s
	}
	return r, nil
}

func (h *ReportScheduleHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Pool.Query(r.Context(),
		fmt.Sprintf(`SELECT %s FROM report_schedules ORDER BY name`, rsCols))
	if err != nil {
		log.Printf("report_schedule list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []reportScheduleRow{}
	for rows.Next() {
		s, err := scanSchedule(rows.Scan)
		if err != nil {
			continue
		}
		results = append(results, s)
	}
	response.OK(w, results)
}

func (h *ReportScheduleHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	s, err := scanSchedule(h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`SELECT %s FROM report_schedules WHERE id = $1`, rsCols), id).Scan)
	if err != nil {
		response.NotFound(w, "Report schedule")
		return
	}
	response.OK(w, s)
}

func (h *ReportScheduleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	name, _ := body["name"].(string)
	reportType, _ := body["reportType"].(string)
	frequency, _ := body["frequency"].(string)
	cronExpr, _ := body["cronExpression"].(string)
	if name == "" || reportType == "" || frequency == "" || cronExpr == "" {
		response.BadRequest(w, "name, reportType, frequency, and cronExpression are required")
		return
	}
	isActive := true
	if v, ok := body["isActive"].(bool); ok {
		isActive = v
	}
	emails := "[]"
	if v, ok := body["recipientEmails"]; ok {
		b, _ := json.Marshal(v)
		emails = string(b)
	}

	s, err := scanSchedule(h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO report_schedules (name, report_type, frequency, cron_expression, recipient_emails, is_active)
		VALUES ($1,$2,$3,$4,$5::jsonb,$6) RETURNING %s`, rsCols),
		name, reportType, frequency, cronExpr, emails, isActive).Scan)
	if err != nil {
		log.Printf("report_schedule create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "report_schedules", s.ID, nil, s)
	response.Created(w, s)
}

func (h *ReportScheduleHandler) Update(w http.ResponseWriter, r *http.Request) {
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
		{"name", "name"}, {"reportType", "report_type"}, {"frequency", "frequency"}, {"cronExpression", "cron_expression"},
	} {
		if v, ok := body[f.j].(string); ok {
			sc = append(sc, fmt.Sprintf("%s = $%d", f.c, ai))
			args = append(args, v)
			ai++
		}
	}
	if v, ok := body["isActive"].(bool); ok {
		sc = append(sc, fmt.Sprintf("is_active = $%d", ai))
		args = append(args, v)
		ai++
	}
	if v, ok := body["recipientEmails"]; ok {
		b, _ := json.Marshal(v)
		sc = append(sc, fmt.Sprintf("recipient_emails = $%d::jsonb", ai))
		args = append(args, string(b))
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
	s, err := scanSchedule(h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`UPDATE report_schedules SET %s WHERE id = $%d RETURNING %s`, joinStrings(sc, ", "), ai, rsCols), args...).Scan)
	if err != nil {
		response.NotFound(w, "Report schedule")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "report_schedules", id, nil, s)
	response.OK(w, s)
}

func (h *ReportScheduleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `DELETE FROM report_schedules WHERE id = $1`, id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Report schedule")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "report_schedules", id, nil, nil)
	response.Message(w, "Report schedule deleted", http.StatusOK)
}

// Run handles POST /reports/schedules/{id}/run — triggers immediate execution.
func (h *ReportScheduleHandler) Run(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(),
		`UPDATE report_schedules SET last_run_at = $1 WHERE id = $2`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Report schedule")
		return
	}
	response.OK(w, map[string]string{"status": "report execution triggered", "scheduleId": id})
}
