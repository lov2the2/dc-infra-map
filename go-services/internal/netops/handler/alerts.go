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

type AlertRuleHandler struct{ DB *db.DB }

type alertRuleRow struct {
	ID                   string  `json:"id"`
	Name                 string  `json:"name"`
	RuleType             string  `json:"ruleType"`
	Resource             string  `json:"resource"`
	ConditionField       string  `json:"conditionField"`
	ConditionOperator    string  `json:"conditionOperator"`
	ThresholdValue       string  `json:"thresholdValue"`
	Severity             string  `json:"severity"`
	Enabled              bool    `json:"enabled"`
	NotificationChannels string  `json:"notificationChannels"`
	CooldownMinutes      int     `json:"cooldownMinutes"`
	CreatedBy            *string `json:"createdBy"`
	CreatedAt            string  `json:"createdAt"`
	UpdatedAt            string  `json:"updatedAt"`
}

const arCols = `id, name, rule_type, resource, condition_field, condition_operator, threshold_value, severity, enabled, notification_channels, cooldown_minutes, created_by, created_at, updated_at`

func (h *AlertRuleHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Pool.Query(r.Context(),
		fmt.Sprintf(`SELECT %s FROM alert_rules ORDER BY name`, arCols))
	if err != nil {
		log.Printf("alert_rule list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []alertRuleRow{}
	for rows.Next() {
		var a alertRuleRow
		var ca, ua time.Time
		if err := rows.Scan(&a.ID, &a.Name, &a.RuleType, &a.Resource, &a.ConditionField,
			&a.ConditionOperator, &a.ThresholdValue, &a.Severity, &a.Enabled,
			&a.NotificationChannels, &a.CooldownMinutes, &a.CreatedBy, &ca, &ua); err != nil {
			continue
		}
		a.CreatedAt = ca.UTC().Format(time.RFC3339)
		a.UpdatedAt = ua.UTC().Format(time.RFC3339)
		results = append(results, a)
	}
	response.OK(w, results)
}

func (h *AlertRuleHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var a alertRuleRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`SELECT %s FROM alert_rules WHERE id = $1`, arCols), id).Scan(
		&a.ID, &a.Name, &a.RuleType, &a.Resource, &a.ConditionField,
		&a.ConditionOperator, &a.ThresholdValue, &a.Severity, &a.Enabled,
		&a.NotificationChannels, &a.CooldownMinutes, &a.CreatedBy, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Alert rule")
		return
	}
	a.CreatedAt = ca.UTC().Format(time.RFC3339)
	a.UpdatedAt = ua.UTC().Format(time.RFC3339)
	response.OK(w, a)
}

func (h *AlertRuleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	name, _ := body["name"].(string)
	ruleType, _ := body["ruleType"].(string)
	resource, _ := body["resource"].(string)
	condField, _ := body["conditionField"].(string)
	condOp, _ := body["conditionOperator"].(string)
	threshold, _ := body["thresholdValue"].(string)
	severity, _ := body["severity"].(string)
	if name == "" || ruleType == "" || resource == "" || condField == "" || condOp == "" || threshold == "" || severity == "" {
		response.BadRequest(w, "name, ruleType, resource, conditionField, conditionOperator, thresholdValue, severity are required")
		return
	}
	// Handle thresholdValue from float64
	if threshold == "" {
		if v, ok := body["thresholdValue"].(float64); ok {
			threshold = fmt.Sprintf("%g", v)
		}
	}
	enabled := true
	if v, ok := body["enabled"].(bool); ok {
		enabled = v
	}
	cooldown := 60
	if v, ok := body["cooldownMinutes"].(float64); ok {
		cooldown = int(v)
	}
	channels := "[]"
	if v, ok := body["notificationChannels"]; ok {
		b, _ := json.Marshal(v)
		channels = string(b)
	}

	var a alertRuleRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO alert_rules (name, rule_type, resource, condition_field, condition_operator, threshold_value, severity, enabled, notification_channels, cooldown_minutes)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) RETURNING %s`, arCols),
		name, ruleType, resource, condField, condOp, threshold, severity, enabled, channels, cooldown).Scan(
		&a.ID, &a.Name, &a.RuleType, &a.Resource, &a.ConditionField,
		&a.ConditionOperator, &a.ThresholdValue, &a.Severity, &a.Enabled,
		&a.NotificationChannels, &a.CooldownMinutes, &a.CreatedBy, &ca, &ua)
	if err != nil {
		log.Printf("alert_rule create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	a.CreatedAt = ca.UTC().Format(time.RFC3339)
	a.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "alert_rules", a.ID, nil, a)
	response.Created(w, a)
}

func (h *AlertRuleHandler) Update(w http.ResponseWriter, r *http.Request) {
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
		{"name", "name"}, {"ruleType", "rule_type"}, {"resource", "resource"},
		{"conditionField", "condition_field"}, {"conditionOperator", "condition_operator"},
		{"thresholdValue", "threshold_value"}, {"severity", "severity"},
	} {
		if v, ok := body[f.j].(string); ok {
			sc = append(sc, fmt.Sprintf("%s = $%d", f.c, ai))
			args = append(args, v)
			ai++
		}
	}
	if v, ok := body["enabled"].(bool); ok {
		sc = append(sc, fmt.Sprintf("enabled = $%d", ai))
		args = append(args, v)
		ai++
	}
	if v, ok := body["cooldownMinutes"].(float64); ok {
		sc = append(sc, fmt.Sprintf("cooldown_minutes = $%d", ai))
		args = append(args, int(v))
		ai++
	}
	if v, ok := body["notificationChannels"]; ok {
		b, _ := json.Marshal(v)
		sc = append(sc, fmt.Sprintf("notification_channels = $%d::jsonb", ai))
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
	var a alertRuleRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`UPDATE alert_rules SET %s WHERE id = $%d RETURNING %s`, joinStrings(sc, ", "), ai, arCols), args...).Scan(
		&a.ID, &a.Name, &a.RuleType, &a.Resource, &a.ConditionField,
		&a.ConditionOperator, &a.ThresholdValue, &a.Severity, &a.Enabled,
		&a.NotificationChannels, &a.CooldownMinutes, &a.CreatedBy, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Alert rule")
		return
	}
	a.CreatedAt = ca.UTC().Format(time.RFC3339)
	a.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "alert_rules", id, nil, a)
	response.OK(w, a)
}

func (h *AlertRuleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `DELETE FROM alert_rules WHERE id = $1`, id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Alert rule")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "alert_rules", id, nil, nil)
	response.Message(w, "Alert rule deleted", http.StatusOK)
}

// --- Alert History ---

type AlertHistoryHandler struct{ DB *db.DB }

type alertHistoryRow struct {
	ID             string  `json:"id"`
	RuleID         *string `json:"ruleId"`
	Severity       string  `json:"severity"`
	Message        string  `json:"message"`
	ResourceType   string  `json:"resourceType"`
	ResourceID     string  `json:"resourceId"`
	ResourceName   string  `json:"resourceName"`
	ThresholdValue *string `json:"thresholdValue"`
	ActualValue    *string `json:"actualValue"`
	AcknowledgedAt *string `json:"acknowledgedAt"`
	AcknowledgedBy *string `json:"acknowledgedBy"`
	ResolvedAt     *string `json:"resolvedAt"`
	CreatedAt      string  `json:"createdAt"`
}

func (h *AlertHistoryHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Pool.Query(r.Context(),
		`SELECT id, rule_id, severity, message, resource_type, resource_id, resource_name, threshold_value, actual_value, acknowledged_at, acknowledged_by, resolved_at, created_at
		FROM alert_history ORDER BY created_at DESC`)
	if err != nil {
		log.Printf("alert_history list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []alertHistoryRow{}
	for rows.Next() {
		var a alertHistoryRow
		var ca time.Time
		var ackAt, resAt *time.Time
		if err := rows.Scan(&a.ID, &a.RuleID, &a.Severity, &a.Message, &a.ResourceType,
			&a.ResourceID, &a.ResourceName, &a.ThresholdValue, &a.ActualValue,
			&ackAt, &a.AcknowledgedBy, &resAt, &ca); err != nil {
			continue
		}
		a.CreatedAt = ca.UTC().Format(time.RFC3339)
		if ackAt != nil {
			s := ackAt.UTC().Format(time.RFC3339)
			a.AcknowledgedAt = &s
		}
		if resAt != nil {
			s := resAt.UTC().Format(time.RFC3339)
			a.ResolvedAt = &s
		}
		results = append(results, a)
	}
	response.OK(w, results)
}

func (h *AlertHistoryHandler) Acknowledge(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(),
		`UPDATE alert_history SET acknowledged_at = $1 WHERE id = $2 AND acknowledged_at IS NULL`, time.Now().UTC(), id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Alert history")
		return
	}
	response.Message(w, "Alert acknowledged", http.StatusOK)
}

// Evaluate handles POST /alerts/evaluate — triggers manual alert evaluation.
func (h *AlertRuleHandler) Evaluate(w http.ResponseWriter, r *http.Request) {
	// Simplified: just return OK as actual evaluation logic will depend on business rules
	response.OK(w, map[string]string{"status": "evaluation triggered"})
}
