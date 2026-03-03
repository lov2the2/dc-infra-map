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

// SiteHandler handles site CRUD.
type SiteHandler struct {
    DB *db.DB
}

type siteRow struct {
    ID           string          `json:"id"`
    Name         string          `json:"name"`
    Slug         string          `json:"slug"`
    Status       string          `json:"status"`
    RegionID     *string         `json:"regionId"`
    TenantID     *string         `json:"tenantId"`
    Facility     *string         `json:"facility"`
    Address      *string         `json:"address"`
    Latitude     *string         `json:"latitude"`
    Longitude    *string         `json:"longitude"`
    Description  *string         `json:"description"`
    CustomFields json.RawMessage `json:"customFields"`
    CreatedAt    string          `json:"createdAt"`
    UpdatedAt    string          `json:"updatedAt"`
}

const siteCols = `id, name, slug, status, region_id, tenant_id, facility, address, latitude, longitude, description, custom_fields, created_at, updated_at`

func scanSite(s *siteRow, createdAt, updatedAt *time.Time) {
    s.CreatedAt = createdAt.UTC().Format(time.RFC3339)
    s.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
    if s.CustomFields == nil {
        s.CustomFields = json.RawMessage("{}")
    }
}

// List handles GET /sites
func (h *SiteHandler) List(w http.ResponseWriter, r *http.Request) {
    query := fmt.Sprintf(`SELECT %s FROM sites WHERE deleted_at IS NULL ORDER BY name`, siteCols)

    rows, err := h.DB.Pool.Query(r.Context(), query)
    if err != nil {
        log.Printf("site list error: %v", err)
        response.InternalError(w, "database error")
        return
    }
    defer rows.Close()

    results := []siteRow{}
    for rows.Next() {
        var s siteRow
        var createdAt, updatedAt time.Time
        if err := rows.Scan(&s.ID, &s.Name, &s.Slug, &s.Status, &s.RegionID, &s.TenantID,
            &s.Facility, &s.Address, &s.Latitude, &s.Longitude, &s.Description,
            &s.CustomFields, &createdAt, &updatedAt); err != nil {
            log.Printf("site scan error: %v", err)
            continue
        }
        scanSite(&s, &createdAt, &updatedAt)
        results = append(results, s)
    }

    response.OK(w, results)
}

// Get handles GET /sites/{id}
func (h *SiteHandler) Get(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    if id == "" {
        response.BadRequest(w, "id is required")
        return
    }

    var s siteRow
    var createdAt, updatedAt time.Time

    err := h.DB.Pool.QueryRow(r.Context(),
        fmt.Sprintf(`SELECT %s FROM sites WHERE id = $1 AND deleted_at IS NULL`, siteCols), id).Scan(
        &s.ID, &s.Name, &s.Slug, &s.Status, &s.RegionID, &s.TenantID,
        &s.Facility, &s.Address, &s.Latitude, &s.Longitude, &s.Description,
        &s.CustomFields, &createdAt, &updatedAt)
    if err != nil {
        response.NotFound(w, "Site")
        return
    }
    scanSite(&s, &createdAt, &updatedAt)

    response.OK(w, s)
}

// Create handles POST /sites
func (h *SiteHandler) Create(w http.ResponseWriter, r *http.Request) {
    var body map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        response.BadRequest(w, "invalid JSON")
        return
    }

    name, _ := body["name"].(string)
    slug, _ := body["slug"].(string)
    if name == "" {
        response.BadRequest(w, "name is required")
        return
    }

    status := "active"
    if s, ok := body["status"].(string); ok {
        status = s
    }
    regionID, _ := body["regionId"].(string)
    tenantID, _ := body["tenantId"].(string)
    facility, _ := body["facility"].(string)
    address, _ := body["address"].(string)
    latitude, _ := body["latitude"].(string)
    longitude, _ := body["longitude"].(string)
    description, _ := body["description"].(string)

    var customFields interface{}
    if cf, ok := body["customFields"]; ok && cf != nil {
        cfBytes, _ := json.Marshal(cf)
        customFields = cfBytes
    }

    var s siteRow
    var createdAt, updatedAt time.Time

    err := h.DB.Pool.QueryRow(r.Context(),
        fmt.Sprintf(`INSERT INTO sites (name, slug, status, region_id, tenant_id, facility, address, latitude, longitude, description, custom_fields)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING %s`, siteCols),
        name, slug, status, nilIfEmpty(regionID), nilIfEmpty(tenantID), nilIfEmpty(facility),
        nilIfEmpty(address), nilIfEmpty(latitude), nilIfEmpty(longitude), nilIfEmpty(description), customFields).Scan(
        &s.ID, &s.Name, &s.Slug, &s.Status, &s.RegionID, &s.TenantID,
        &s.Facility, &s.Address, &s.Latitude, &s.Longitude, &s.Description,
        &s.CustomFields, &createdAt, &updatedAt)
    if err != nil {
        log.Printf("site create error: %v", err)
        response.InternalError(w, "create failed")
        return
    }
    scanSite(&s, &createdAt, &updatedAt)

    _ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "sites", s.ID, nil, s)

    response.Created(w, s)
}

// Update handles PATCH /sites/{id}
func (h *SiteHandler) Update(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    if id == "" {
        response.BadRequest(w, "id is required")
        return
    }

    var body map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        response.BadRequest(w, "invalid JSON")
        return
    }

    setClauses := []string{}
    args := []interface{}{}
    argIdx := 1

    if v, ok := body["name"].(string); ok {
        setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
        args = append(args, v)
        argIdx++
    }
    if v, ok := body["slug"].(string); ok {
        setClauses = append(setClauses, fmt.Sprintf("slug = $%d", argIdx))
        args = append(args, v)
        argIdx++
    }
    if v, ok := body["status"].(string); ok {
        setClauses = append(setClauses, fmt.Sprintf("status = $%d", argIdx))
        args = append(args, v)
        argIdx++
    }
    if v, ok := body["regionId"].(string); ok {
        setClauses = append(setClauses, fmt.Sprintf("region_id = $%d", argIdx))
        args = append(args, nilIfEmpty(v))
        argIdx++
    }
    if v, ok := body["tenantId"].(string); ok {
        setClauses = append(setClauses, fmt.Sprintf("tenant_id = $%d", argIdx))
        args = append(args, nilIfEmpty(v))
        argIdx++
    }
    if v, ok := body["facility"].(string); ok {
        setClauses = append(setClauses, fmt.Sprintf("facility = $%d", argIdx))
        args = append(args, nilIfEmpty(v))
        argIdx++
    }
    if v, ok := body["address"].(string); ok {
        setClauses = append(setClauses, fmt.Sprintf("address = $%d", argIdx))
        args = append(args, nilIfEmpty(v))
        argIdx++
    }
    if v, ok := body["latitude"].(string); ok {
        setClauses = append(setClauses, fmt.Sprintf("latitude = $%d", argIdx))
        args = append(args, nilIfEmpty(v))
        argIdx++
    }
    if v, ok := body["longitude"].(string); ok {
        setClauses = append(setClauses, fmt.Sprintf("longitude = $%d", argIdx))
        args = append(args, nilIfEmpty(v))
        argIdx++
    }
    if v, ok := body["description"].(string); ok {
        setClauses = append(setClauses, fmt.Sprintf("description = $%d", argIdx))
        args = append(args, nilIfEmpty(v))
        argIdx++
    }
    if cf, ok := body["customFields"]; ok && cf != nil {
        cfBytes, _ := json.Marshal(cf)
        setClauses = append(setClauses, fmt.Sprintf("custom_fields = $%d", argIdx))
        args = append(args, cfBytes)
        argIdx++
    }

    setClauses = append(setClauses, fmt.Sprintf("updated_at = $%d", argIdx))
    args = append(args, time.Now().UTC())
    argIdx++

    if len(setClauses) <= 1 {
        response.BadRequest(w, "no fields to update")
        return
    }

    args = append(args, id)
    query := fmt.Sprintf(`UPDATE sites SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING %s`,
        joinStrings(setClauses, ", "), argIdx, siteCols)

    var s siteRow
    var createdAt, updatedAt time.Time

    err := h.DB.Pool.QueryRow(r.Context(), query, args...).Scan(
        &s.ID, &s.Name, &s.Slug, &s.Status, &s.RegionID, &s.TenantID,
        &s.Facility, &s.Address, &s.Latitude, &s.Longitude, &s.Description,
        &s.CustomFields, &createdAt, &updatedAt)
    if err != nil {
        response.NotFound(w, "Site")
        return
    }
    scanSite(&s, &createdAt, &updatedAt)

    _ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "sites", id, nil, s)

    response.OK(w, s)
}

// Delete handles DELETE /sites/{id}
func (h *SiteHandler) Delete(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    if id == "" {
        response.BadRequest(w, "id is required")
        return
    }

    tag, err := h.DB.Pool.Exec(r.Context(), `
        UPDATE sites SET deleted_at = $1
        WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
    if err != nil || tag.RowsAffected() == 0 {
        response.NotFound(w, "Site")
        return
    }

    _ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "sites", id, nil, nil)

    response.Message(w, "Site deleted", http.StatusOK)
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
