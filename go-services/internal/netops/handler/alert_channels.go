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

type ChannelHandler struct{ DB *db.DB }

type channelRow struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	ChannelType string `json:"channelType"`
	Config      string `json:"config"`
	Enabled     bool   `json:"enabled"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

const chCols = `id, name, channel_type, config, enabled, created_at, updated_at`

func (h *ChannelHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Pool.Query(r.Context(),
		fmt.Sprintf(`SELECT %s FROM notification_channels ORDER BY name`, chCols))
	if err != nil {
		log.Printf("channel list error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()
	results := []channelRow{}
	for rows.Next() {
		var c channelRow
		var ca, ua time.Time
		if err := rows.Scan(&c.ID, &c.Name, &c.ChannelType, &c.Config, &c.Enabled, &ca, &ua); err != nil {
			continue
		}
		c.CreatedAt = ca.UTC().Format(time.RFC3339)
		c.UpdatedAt = ua.UTC().Format(time.RFC3339)
		results = append(results, c)
	}
	response.OK(w, results)
}

func (h *ChannelHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var c channelRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`SELECT %s FROM notification_channels WHERE id = $1`, chCols), id).Scan(
		&c.ID, &c.Name, &c.ChannelType, &c.Config, &c.Enabled, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Notification channel")
		return
	}
	c.CreatedAt = ca.UTC().Format(time.RFC3339)
	c.UpdatedAt = ua.UTC().Format(time.RFC3339)
	response.OK(w, c)
}

func (h *ChannelHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	name, _ := body["name"].(string)
	channelType, _ := body["channelType"].(string)
	if name == "" || channelType == "" {
		response.BadRequest(w, "name and channelType are required")
		return
	}
	enabled := true
	if v, ok := body["enabled"].(bool); ok {
		enabled = v
	}
	config := "{}"
	if v, ok := body["config"]; ok {
		b, _ := json.Marshal(v)
		config = string(b)
	}

	var c channelRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`INSERT INTO notification_channels (name, channel_type, config, enabled)
		VALUES ($1,$2,$3::jsonb,$4) RETURNING %s`, chCols),
		name, channelType, config, enabled).Scan(
		&c.ID, &c.Name, &c.ChannelType, &c.Config, &c.Enabled, &ca, &ua)
	if err != nil {
		log.Printf("channel create error: %v", err)
		response.InternalError(w, "create failed")
		return
	}
	c.CreatedAt = ca.UTC().Format(time.RFC3339)
	c.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "notification_channels", c.ID, nil, c)
	response.Created(w, c)
}

func (h *ChannelHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}
	sc := []string{}
	args := []interface{}{}
	ai := 1
	for _, f := range []struct{ j, c string }{{"name", "name"}, {"channelType", "channel_type"}} {
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
	if v, ok := body["config"]; ok {
		b, _ := json.Marshal(v)
		sc = append(sc, fmt.Sprintf("config = $%d::jsonb", ai))
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
	var c channelRow
	var ca, ua time.Time
	err := h.DB.Pool.QueryRow(r.Context(),
		fmt.Sprintf(`UPDATE notification_channels SET %s WHERE id = $%d RETURNING %s`, joinStrings(sc, ", "), ai, chCols), args...).Scan(
		&c.ID, &c.Name, &c.ChannelType, &c.Config, &c.Enabled, &ca, &ua)
	if err != nil {
		response.NotFound(w, "Notification channel")
		return
	}
	c.CreatedAt = ca.UTC().Format(time.RFC3339)
	c.UpdatedAt = ua.UTC().Format(time.RFC3339)
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "notification_channels", id, nil, c)
	response.OK(w, c)
}

func (h *ChannelHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := h.DB.Pool.Exec(r.Context(), `DELETE FROM notification_channels WHERE id = $1`, id)
	if err != nil || tag.RowsAffected() == 0 {
		response.NotFound(w, "Notification channel")
		return
	}
	_ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "notification_channels", id, nil, nil)
	response.Message(w, "Notification channel deleted", http.StatusOK)
}
