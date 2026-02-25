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

// RegionHandler handles region CRUD.
type RegionHandler struct {
    DB *db.DB
}

type regionRow struct {
    ID          string  `json:"id"`
    Name        string  `json:"name"`
    Slug        string  `json:"slug"`
    Description *string `json:"description"`
    CreatedAt   string  `json:"createdAt"`
    UpdatedAt   string  `json:"updatedAt"`
}

// List handles GET /regions
func (h *RegionHandler) List(w http.ResponseWriter, r *http.Request) {
    query := `
        SELECT id, name, slug, description, created_at, updated_at
        FROM regions
        WHERE deleted_at IS NULL
        ORDER BY name`

    rows, err := h.DB.Pool.Query(r.Context(), query)
    if err != nil {
        log.Printf("region list error: %v", err)
        response.InternalError(w, "database error")
        return
    }
    defer rows.Close()

    results := []regionRow{}
    for rows.Next() {
        var rg regionRow
        var createdAt, updatedAt time.Time
        if err := rows.Scan(&rg.ID, &rg.Name, &rg.Slug, &rg.Description,
            &createdAt, &updatedAt); err != nil {
            log.Printf("region scan error: %v", err)
            continue
        }
        rg.CreatedAt = createdAt.UTC().Format(time.RFC3339)
        rg.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
        results = append(results, rg)
    }

    response.OK(w, results)
}

// Get handles GET /regions/{id}
func (h *RegionHandler) Get(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    if id == "" {
        response.BadRequest(w, "id is required")
        return
    }

    var rg regionRow
    var createdAt, updatedAt time.Time

    err := h.DB.Pool.QueryRow(r.Context(), `
        SELECT id, name, slug, description, created_at, updated_at
        FROM regions
        WHERE id = $1 AND deleted_at IS NULL`, id).Scan(
        &rg.ID, &rg.Name, &rg.Slug, &rg.Description,
        &createdAt, &updatedAt)
    if err != nil {
        response.NotFound(w, "Region")
        return
    }
    rg.CreatedAt = createdAt.UTC().Format(time.RFC3339)
    rg.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

    response.OK(w, rg)
}

// Create handles POST /regions
func (h *RegionHandler) Create(w http.ResponseWriter, r *http.Request) {
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

    description, _ := body["description"].(string)

    var rg regionRow
    var createdAt, updatedAt time.Time

    err := h.DB.Pool.QueryRow(r.Context(), `
        INSERT INTO regions (name, slug, description)
        VALUES ($1, $2, $3)
        RETURNING id, name, slug, description, created_at, updated_at`,
        name, slug, nilIfEmpty(description)).Scan(
        &rg.ID, &rg.Name, &rg.Slug, &rg.Description,
        &createdAt, &updatedAt)
    if err != nil {
        log.Printf("region create error: %v", err)
        response.InternalError(w, "create failed")
        return
    }
    rg.CreatedAt = createdAt.UTC().Format(time.RFC3339)
    rg.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

    _ = audit.LogEntry(r.Context(), h.DB.Pool, "", "create", "regions", rg.ID, nil, rg)

    response.Created(w, rg)
}

// Update handles PATCH /regions/{id}
func (h *RegionHandler) Update(w http.ResponseWriter, r *http.Request) {
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
    if v, ok := body["description"].(string); ok {
        setClauses = append(setClauses, fmt.Sprintf("description = $%d", argIdx))
        args = append(args, nilIfEmpty(v))
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
    query := fmt.Sprintf(`
        UPDATE regions SET %s
        WHERE id = $%d AND deleted_at IS NULL
        RETURNING id, name, slug, description, created_at, updated_at`,
        joinStrings(setClauses, ", "), argIdx)

    var rg regionRow
    var createdAt, updatedAt time.Time

    err := h.DB.Pool.QueryRow(r.Context(), query, args...).Scan(
        &rg.ID, &rg.Name, &rg.Slug, &rg.Description,
        &createdAt, &updatedAt)
    if err != nil {
        response.NotFound(w, "Region")
        return
    }
    rg.CreatedAt = createdAt.UTC().Format(time.RFC3339)
    rg.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

    _ = audit.LogEntry(r.Context(), h.DB.Pool, "", "update", "regions", id, nil, rg)

    response.OK(w, rg)
}

// Delete handles DELETE /regions/{id}
func (h *RegionHandler) Delete(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    if id == "" {
        response.BadRequest(w, "id is required")
        return
    }

    tag, err := h.DB.Pool.Exec(r.Context(), `
        UPDATE regions SET deleted_at = $1
        WHERE id = $2 AND deleted_at IS NULL`, time.Now().UTC(), id)
    if err != nil || tag.RowsAffected() == 0 {
        response.NotFound(w, "Region")
        return
    }

    _ = audit.LogEntry(r.Context(), h.DB.Pool, "", "delete", "regions", id, nil, nil)

    response.Message(w, "Region deleted", http.StatusOK)
}
