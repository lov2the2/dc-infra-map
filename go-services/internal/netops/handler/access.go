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

type AccessLogHandler struct{ DB *db.DB }

type accessLogRow struct {
	ID                 string  `json:"id"`
	SiteID             string  `json:"siteId"`
	PersonnelName      string  `json:"personnelName"`
	Company            *string `json:"company"`
	ContactPhone       *string `json:"contactPhone"`
	AccessType         string  `json:"accessType"`
	Status             string  `json:"status"`
	Purpose            *string `json:"purpose"`
	EscortName         *string `json:"escortName"`
	BadgeNumber        *string `json:"badgeNumber"`
	CheckInAt          string  `json:"checkInAt"`
	ExpectedCheckOutAt *string `json:"expectedCheckOutAt"`
	ActualCheckOutAt   *string `json:"actualCheckOutAt"`
	CheckOutNote       *string `json:"checkOutNote"`
	CreatedBy          *string `json:"createdBy"`
	CreatedAt          string  `json:"createdAt"`
	UpdatedAt          string  `json:"updatedAt"`
}

const alCols = `id, site_id, personnel_name, company, contact_phone, access_type, status, purpose, escort_name, badge_number, check_in_at, expected_check_out_at, actual_check_out_at, check_out_note, created_by, created_at, updated_at`

func scanAccessLog(scan func(dest ...interface{}) error) (accessLogRow, error) {
	var a accessLogRow
	var checkIn, ca, ua time.Time
	var expectedOut, actualOut *time.Time
	err := scan(&a.ID, &a.SiteID, &a.PersonnelName, &a.Company, &a.ContactPhone,
		&a.AccessType, &a.Status, &a.Purpose, &a.EscortName, &a.BadgeNumber,
		&checkIn, &expectedOut, &actualOut, &a.CheckOutNote, &a.CreatedBy, &ca, &ua)
	if err != nil {
		return a, err
	}
	a.CheckInAt = checkIn.UTC().Format(time.RFC3339)
	a.CreatedAt = ca.UTC().Format(time.RFC3339)
	a.UpdatedAt = ua.UTC().Format(time.RFC3339)
	if expectedOut != nil {
		s := expectedOut.UTC().Format(time.RFC3339)
		a.ExpectedCheckOutAt = &s
	}
	if actualOut != nil {
		s := actualOut.UTC().Format(time.RFC3339)
		a.ActualCheckOutAt = &s
	}
	return a, nil
}

func (h *AccessLogHandler) List(w http.ResponseWriter, r *http.Request) {
	query := fmt.Sprintf(`SELECT %s FROM access_logs WHERE deleted_at IS NULL`, alCols)
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
	query += " ORDER BY check_in_at DESC"
	rows, err := h.DB.Pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("access_log list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []accessLogRow{}
	for rows.Next() {
		a, err := scanAccessLog(rows.Scan)
		if err != nil {
			continue
		}
		results = append(results, a)
	}
	response.OK(w, results)
}

func (h *AccessLogHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	a, err := scanAccessLog(h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`SELECT %s FROM access_logs WHERE id = $1 AND deleted_at IS NULL`, alCols), id).Scan)
	if err != nil {
		response.NotFound(w, "Access log")
		return
	}
	response.OK(w, a)
}

func (h *AccessLogHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	siteID, _ := body["siteId"].(string)
	personnelName, _ := body["personnelName"].(string)
	accessType, _ := body["accessType"].(string)
	if siteID == "" || personnelName == "" || accessType == "" {
		response.BadRequest(w, "siteId, personnelName, and accessType are required")
		return
	}
	company, _ := body["company"].(string)
	phone, _ := body["contactPhone"].(string)
	status := "checked_in"
	if s, ok := body["status"].(string); ok {
		status = s
	}
	purpose, _ := body["purpose"].(string)
	escort, _ := body["escortName"].(string)
	badge, _ := body["badgeNumber"].(string)

	a, err := scanAccessLog(h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO access_logs (site_id, personnel_name, company, contact_phone, access_type, status, purpose, escort_name, badge_number)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING %s`, alCols),
		siteID, personnelName, nilIfEmpty(company), nilIfEmpty(phone), accessType, status,
		nilIfEmpty(purpose), nilIfEmpty(escort), nilIfEmpty(badge)).Scan)
	if err != nil {
		log.Printf("access_log create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "access_logs", a.ID, nil, a)
	response.Created(w, a)
}

func (h *AccessLogHandler) Update(w http.ResponseWriter, r *http.Request) {
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
		{"siteId", "site_id"}, {"personnelName", "personnel_name"}, {"company", "company"},
		{"contactPhone", "contact_phone"}, {"accessType", "access_type"}, {"status", "status"},
		{"purpose", "purpose"}, {"escortName", "escort_name"}, {"badgeNumber", "badge_number"},
		{"checkOutNote", "check_out_note"},
	} {
		if v, ok := body[f.j].(string); ok {
			sc = append(sc, fmt.Sprintf("%s = $%d", f.c, ai))
			args = append(args, nilIfEmpty(v))
			ai++
		}
	}
	// Handle checkout timestamp
	if _, ok := body["actualCheckOutAt"]; ok {
		sc = append(sc, fmt.Sprintf("actual_check_out_at = $%d", ai))
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
	a, err := scanAccessLog(h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`UPDATE access_logs SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING %s`, joinStrings(sc, ", "), ai, alCols), args...).Scan)
	if err != nil {
		response.NotFound(w, "Access log")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "access_logs", id, nil, a)
	response.OK(w, a)
}

func (h *AccessLogHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `UPDATE access_logs SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Access log")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "access_logs", id, nil, nil)
	response.Message(w, "Access log deleted", http.StatusOK)
}
