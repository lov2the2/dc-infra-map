package audit

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"
)

// LogEntry represents an audit log record for INSERT.
func LogEntry(ctx context.Context, pool *pgxpool.Pool, userID, action, tableName, recordID string, before, after interface{}) error {
	var beforeJSON, afterJSON []byte
	var err error

	if before != nil {
		beforeJSON, err = json.Marshal(before)
		if err != nil {
			return err
		}
	}
	if after != nil {
		afterJSON, err = json.Marshal(after)
		if err != nil {
			return err
		}
	}

	_, err = pool.Exec(ctx,
		`INSERT INTO audit_logs (user_id, action, table_name, record_id, changes_before, changes_after)
         VALUES ($1, $2, $3, $4, $5, $6)`,
		nilIfEmpty(userID), action, tableName, recordID, nullableJSON(beforeJSON), nullableJSON(afterJSON),
	)
	return err
}

func nilIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

func nullableJSON(b []byte) interface{} {
	if b == nil {
		return nil
	}
	return b
}
