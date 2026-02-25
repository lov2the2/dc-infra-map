package crud

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/dcim/go-services/internal/shared/audit"
	"github.com/dcim/go-services/internal/shared/response"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Column defines a database column for CRUD operations.
type Column struct {
	Name     string // DB column name (snake_case)
	JSON     string // JSON field name (camelCase)
	Type     string // "string" | "int" | "float" | "bool" | "timestamp" | "json"
	Nullable bool
	ReadOnly bool // Skip in INSERT/UPDATE (e.g., id, created_at, updated_at, deleted_at)
}

// FilterDef maps a query parameter to a WHERE clause.
type FilterDef struct {
	QueryParam string // URL query parameter name
	Column     string // DB column name
	Op         string // "eq" | "ilike" | "in"
}

// Config defines the CRUD handler configuration for a resource.
type Config struct {
	Table      string      // e.g., "sites"
	IDColumn   string      // default "id"
	Columns    []Column    // SELECT/INSERT/UPDATE column definitions
	Filters    []FilterDef // Query param -> WHERE clause mapping
	JoinClause string      // Optional JOIN for GET list/detail
	OrderBy    string      // Optional ORDER BY clause, e.g., "name ASC"
	SoftDelete bool        // Use deleted_at soft delete pattern
	AuditTable string      // Resource name for audit logging
}

// RegisterRoutes registers standard CRUD routes on the given mux.
// Routes: GET /prefix, GET /prefix/{id}, POST /prefix, PATCH /prefix/{id}, DELETE /prefix/{id}
func RegisterRoutes(mux *http.ServeMux, prefix string, cfg Config, pool *pgxpool.Pool) {
	if cfg.IDColumn == "" {
		cfg.IDColumn = "id"
	}

	h := &handler{cfg: cfg, pool: pool}

	mux.HandleFunc("GET "+prefix, h.list)
	mux.HandleFunc("GET "+prefix+"/{id}", h.get)
	mux.HandleFunc("POST "+prefix, h.create)
	mux.HandleFunc("PATCH "+prefix+"/{id}", h.update)
	mux.HandleFunc("DELETE "+prefix+"/{id}", h.del)
}

type handler struct {
	cfg  Config
	pool *pgxpool.Pool
}

// list handles GET /resource — list all records with optional filtering.
func (h *handler) list(w http.ResponseWriter, r *http.Request) {
	cols := h.selectColumns()
	query := fmt.Sprintf("SELECT %s FROM %s", strings.Join(cols, ", "), h.cfg.Table)

	if h.cfg.JoinClause != "" {
		query += " " + h.cfg.JoinClause
	}

	conditions := []string{}
	args := []interface{}{}
	argIdx := 1

	if h.cfg.SoftDelete {
		conditions = append(conditions, fmt.Sprintf("%s.deleted_at IS NULL", h.cfg.Table))
	}

	for _, f := range h.cfg.Filters {
		val := r.URL.Query().Get(f.QueryParam)
		if val == "" {
			continue
		}
		switch f.Op {
		case "eq":
			conditions = append(conditions, fmt.Sprintf("%s = $%d", f.Column, argIdx))
			args = append(args, val)
			argIdx++
		case "ilike":
			conditions = append(conditions, fmt.Sprintf("%s ILIKE $%d", f.Column, argIdx))
			args = append(args, "%"+val+"%")
			argIdx++
		}
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}

	if h.cfg.OrderBy != "" {
		query += " ORDER BY " + h.cfg.OrderBy
	}

	rows, err := h.pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("crud list error [%s]: %v", h.cfg.Table, err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()

	results := []map[string]interface{}{}
	for rows.Next() {
		row, err := h.scanRow(rows)
		if err != nil {
			log.Printf("crud scan error [%s]: %v", h.cfg.Table, err)
			continue
		}
		results = append(results, row)
	}

	response.OK(w, results)
}

// get handles GET /resource/{id} — get single record by ID.
func (h *handler) get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	cols := h.selectColumns()
	query := fmt.Sprintf("SELECT %s FROM %s", strings.Join(cols, ", "), h.cfg.Table)

	if h.cfg.JoinClause != "" {
		query += " " + h.cfg.JoinClause
	}

	conditions := []string{fmt.Sprintf("%s.%s = $1", h.cfg.Table, h.cfg.IDColumn)}
	if h.cfg.SoftDelete {
		conditions = append(conditions, fmt.Sprintf("%s.deleted_at IS NULL", h.cfg.Table))
	}
	query += " WHERE " + strings.Join(conditions, " AND ")

	rows, err := h.pool.Query(r.Context(), query, id)
	if err != nil {
		log.Printf("crud get error [%s]: %v", h.cfg.Table, err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()

	if !rows.Next() {
		response.NotFound(w, h.cfg.Table)
		return
	}

	row, err := h.scanRow(rows)
	if err != nil {
		log.Printf("crud scan error [%s]: %v", h.cfg.Table, err)
		response.InternalError(w, "scan error")
		return
	}

	response.OK(w, row)
}

// create handles POST /resource — create a new record.
func (h *handler) create(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.BadRequest(w, "invalid JSON")
		return
	}

	writeCols := h.writeColumns()
	colNames := []string{}
	placeholders := []string{}
	args := []interface{}{}
	argIdx := 1

	for _, col := range writeCols {
		val, exists := body[col.JSON]
		if !exists {
			continue
		}
		colNames = append(colNames, col.Name)
		placeholders = append(placeholders, fmt.Sprintf("$%d", argIdx))
		args = append(args, val)
		argIdx++
	}

	if len(colNames) == 0 {
		response.BadRequest(w, "no valid fields provided")
		return
	}

	returnCols := h.selectColumnNames()
	query := fmt.Sprintf(
		"INSERT INTO %s (%s) VALUES (%s) RETURNING %s",
		h.cfg.Table,
		strings.Join(colNames, ", "),
		strings.Join(placeholders, ", "),
		strings.Join(returnCols, ", "),
	)

	rows, err := h.pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("crud create error [%s]: %v", h.cfg.Table, err)
		response.InternalError(w, "create failed")
		return
	}
	defer rows.Close()

	if !rows.Next() {
		response.InternalError(w, "create returned no rows")
		return
	}

	row, err := h.scanRow(rows)
	if err != nil {
		log.Printf("crud scan error [%s]: %v", h.cfg.Table, err)
		response.InternalError(w, "scan error")
		return
	}

	// Audit log (best-effort)
	if h.cfg.AuditTable != "" {
		if id, ok := row[h.idJSONName()]; ok {
			_ = audit.LogEntry(r.Context(), h.pool, "", "create", h.cfg.AuditTable, fmt.Sprint(id), nil, row)
		}
	}

	response.Created(w, row)
}

// update handles PATCH /resource/{id} — update an existing record.
func (h *handler) update(w http.ResponseWriter, r *http.Request) {
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

	// Fetch existing record for audit
	var existing map[string]interface{}
	if h.cfg.AuditTable != "" {
		existing = h.fetchByID(r, id)
	}

	if existing == nil && h.cfg.AuditTable == "" {
		// Check existence without audit
		exists := h.fetchByID(r, id)
		if exists == nil {
			response.NotFound(w, h.cfg.Table)
			return
		}
	} else if existing == nil {
		response.NotFound(w, h.cfg.Table)
		return
	}

	writeCols := h.writeColumns()
	setClauses := []string{}
	args := []interface{}{}
	argIdx := 1

	for _, col := range writeCols {
		val, exists := body[col.JSON]
		if !exists {
			continue
		}
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", col.Name, argIdx))
		args = append(args, val)
		argIdx++
	}

	// Always update updated_at
	setClauses = append(setClauses, fmt.Sprintf("updated_at = $%d", argIdx))
	args = append(args, time.Now().UTC())
	argIdx++

	if len(setClauses) <= 1 {
		response.BadRequest(w, "no valid fields to update")
		return
	}

	args = append(args, id)
	returnCols := h.selectColumnNames()
	query := fmt.Sprintf(
		"UPDATE %s SET %s WHERE %s = $%d RETURNING %s",
		h.cfg.Table,
		strings.Join(setClauses, ", "),
		h.cfg.IDColumn,
		argIdx,
		strings.Join(returnCols, ", "),
	)

	rows, err := h.pool.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("crud update error [%s]: %v", h.cfg.Table, err)
		response.InternalError(w, "update failed")
		return
	}
	defer rows.Close()

	if !rows.Next() {
		response.NotFound(w, h.cfg.Table)
		return
	}

	row, err := h.scanRow(rows)
	if err != nil {
		log.Printf("crud scan error [%s]: %v", h.cfg.Table, err)
		response.InternalError(w, "scan error")
		return
	}

	if h.cfg.AuditTable != "" {
		_ = audit.LogEntry(r.Context(), h.pool, "", "update", h.cfg.AuditTable, id, existing, row)
	}

	response.OK(w, row)
}

// del handles DELETE /resource/{id} — soft delete or hard delete.
func (h *handler) del(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.BadRequest(w, "id is required")
		return
	}

	// Fetch existing record for audit
	existing := h.fetchByID(r, id)
	if existing == nil {
		response.NotFound(w, h.cfg.Table)
		return
	}

	var err error
	if h.cfg.SoftDelete {
		_, err = h.pool.Exec(r.Context(),
			fmt.Sprintf("UPDATE %s SET deleted_at = $1 WHERE %s = $2", h.cfg.Table, h.cfg.IDColumn),
			time.Now().UTC(), id,
		)
	} else {
		_, err = h.pool.Exec(r.Context(),
			fmt.Sprintf("DELETE FROM %s WHERE %s = $1", h.cfg.Table, h.cfg.IDColumn),
			id,
		)
	}

	if err != nil {
		log.Printf("crud delete error [%s]: %v", h.cfg.Table, err)
		response.InternalError(w, "delete failed")
		return
	}

	if h.cfg.AuditTable != "" {
		_ = audit.LogEntry(r.Context(), h.pool, "", "delete", h.cfg.AuditTable, id, existing, nil)
	}

	response.Message(w, h.cfg.Table+" deleted", http.StatusOK)
}

// --- Helper methods ---

// selectColumns returns column expressions for SELECT (table-qualified for the main table).
func (h *handler) selectColumns() []string {
	cols := []string{}
	for _, c := range h.cfg.Columns {
		cols = append(cols, c.Name)
	}
	return cols
}

// selectColumnNames returns unqualified column names for RETURNING.
func (h *handler) selectColumnNames() []string {
	cols := []string{}
	for _, c := range h.cfg.Columns {
		// Strip table prefix for RETURNING clause
		name := c.Name
		if dot := strings.LastIndex(name, "."); dot >= 0 {
			name = name[dot+1:]
		}
		cols = append(cols, name)
	}
	return cols
}

// writeColumns returns columns that are writable (not ReadOnly).
func (h *handler) writeColumns() []Column {
	cols := []Column{}
	for _, c := range h.cfg.Columns {
		if c.ReadOnly {
			continue
		}
		cols = append(cols, c)
	}
	return cols
}

// idJSONName returns the JSON name for the ID column.
func (h *handler) idJSONName() string {
	for _, c := range h.cfg.Columns {
		name := c.Name
		if dot := strings.LastIndex(name, "."); dot >= 0 {
			name = name[dot+1:]
		}
		if name == h.cfg.IDColumn {
			return c.JSON
		}
	}
	return "id"
}

// scanRow scans a row into a map[string]interface{} based on column definitions.
func (h *handler) scanRow(rows interface{ Scan(dest ...interface{}) error }) (map[string]interface{}, error) {
	vals := make([]interface{}, len(h.cfg.Columns))
	ptrs := make([]interface{}, len(h.cfg.Columns))

	for i, col := range h.cfg.Columns {
		switch col.Type {
		case "string":
			if col.Nullable {
				var v *string
				ptrs[i] = &v
			} else {
				var v string
				ptrs[i] = &v
			}
		case "int":
			if col.Nullable {
				var v *int
				ptrs[i] = &v
			} else {
				var v int
				ptrs[i] = &v
			}
		case "float":
			if col.Nullable {
				var v *float64
				ptrs[i] = &v
			} else {
				var v float64
				ptrs[i] = &v
			}
		case "bool":
			if col.Nullable {
				var v *bool
				ptrs[i] = &v
			} else {
				var v bool
				ptrs[i] = &v
			}
		case "timestamp":
			if col.Nullable {
				var v *time.Time
				ptrs[i] = &v
			} else {
				var v time.Time
				ptrs[i] = &v
			}
		default:
			var v interface{}
			ptrs[i] = &v
		}
	}

	if err := rows.Scan(ptrs...); err != nil {
		return nil, err
	}

	result := map[string]interface{}{}
	for i, col := range h.cfg.Columns {
		jsonKey := col.JSON
		switch col.Type {
		case "string":
			if col.Nullable {
				v := ptrs[i].(**string)
				if *v != nil {
					result[jsonKey] = **v
				} else {
					result[jsonKey] = nil
				}
			} else {
				result[jsonKey] = *(ptrs[i].(*string))
			}
		case "int":
			if col.Nullable {
				v := ptrs[i].(**int)
				if *v != nil {
					result[jsonKey] = **v
				} else {
					result[jsonKey] = nil
				}
			} else {
				result[jsonKey] = *(ptrs[i].(*int))
			}
		case "float":
			if col.Nullable {
				v := ptrs[i].(**float64)
				if *v != nil {
					result[jsonKey] = **v
				} else {
					result[jsonKey] = nil
				}
			} else {
				result[jsonKey] = *(ptrs[i].(*float64))
			}
		case "bool":
			if col.Nullable {
				v := ptrs[i].(**bool)
				if *v != nil {
					result[jsonKey] = **v
				} else {
					result[jsonKey] = nil
				}
			} else {
				result[jsonKey] = *(ptrs[i].(*bool))
			}
		case "timestamp":
			if col.Nullable {
				v := ptrs[i].(**time.Time)
				if *v != nil {
					result[jsonKey] = (**v).UTC().Format(time.RFC3339)
				} else {
					result[jsonKey] = nil
				}
			} else {
				v := ptrs[i].(*time.Time)
				result[jsonKey] = v.UTC().Format(time.RFC3339)
			}
		default:
			v := ptrs[i].(*interface{})
			result[jsonKey] = *v
		}
		_ = vals
	}

	return result, nil
}

// fetchByID fetches a single record by ID for audit comparison.
func (h *handler) fetchByID(r *http.Request, id string) map[string]interface{} {
	cols := h.selectColumnNames()
	query := fmt.Sprintf("SELECT %s FROM %s WHERE %s = $1",
		strings.Join(cols, ", "), h.cfg.Table, h.cfg.IDColumn)

	if h.cfg.SoftDelete {
		query += " AND deleted_at IS NULL"
	}

	rows, err := h.pool.Query(r.Context(), query, id)
	if err != nil {
		return nil
	}
	defer rows.Close()

	if !rows.Next() {
		return nil
	}

	// Simplified scan for audit (uses unqualified columns)
	row, err := h.scanRow(rows)
	if err != nil {
		return nil
	}
	return row
}
