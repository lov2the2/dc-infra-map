# Database Migrations

## Drizzle ORM Migrations

Standard migration workflow:

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

## TimescaleDB Setup (Optional)

TimescaleDB provides time-series optimizations for power monitoring data.

The hypertable setup is stored as a custom SQL migration at `drizzle/0001_timescaledb_setup.sql`.
It is **not** applied automatically by `drizzle-kit migrate` — it runs as a separate step.

### Prerequisites

1. Install TimescaleDB extension on your PostgreSQL instance:
   - [TimescaleDB Installation Guide](https://docs.timescale.com/install/latest/)
   - For Docker: use `timescale/timescaledb-ha` image

2. Set the environment variable in your `.env.local`:

   ```
   TIMESCALEDB_ENABLED=true
   ```

### Setup — Full Database Initialization

Run Drizzle migrations **and** TimescaleDB hypertable setup in one command:

```bash
npm run db:setup
```

This is equivalent to:

```bash
npm run db:migrate   # Apply all Drizzle schema migrations
npm run db:timescale # Apply drizzle/0001_timescaledb_setup.sql via psql
```

### Setup — TimescaleDB Only

If Drizzle migrations are already applied, run only the hypertable setup:

```bash
npm run db:timescale
```

### What `drizzle/0001_timescaledb_setup.sql` Does

- Enables the `timescaledb` PostgreSQL extension
- Converts `power_readings` to a hypertable partitioned by `recorded_at` (1-week chunks)
- Creates a composite index on `(feed_id, recorded_at DESC)` for efficient time-range queries
- Script is idempotent — safe to run multiple times

### Without TimescaleDB

The application works without TimescaleDB. Power readings use standard
PostgreSQL tables. TimescaleDB is recommended only for:

- High-frequency monitoring (>1 reading/minute per device)
- Long-term historical data retention (>3 months)
- Complex time-series analytics
