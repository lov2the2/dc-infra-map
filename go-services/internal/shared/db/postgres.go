package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps a pgxpool connection pool.
type DB struct {
	Pool *pgxpool.Pool
}

// New creates a new DB with a connection pool.
func New(ctx context.Context, connStr string) (*DB, error) {
	pool, err := pgxpool.New(ctx, connStr)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}
	return &DB{Pool: pool}, nil
}

// Close closes the connection pool.
func (d *DB) Close() {
	d.Pool.Close()
}
