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

### Prerequisites

Install TimescaleDB extension on your PostgreSQL instance:

- [TimescaleDB Installation Guide](https://docs.timescale.com/install/latest/)
- For Docker: use `timescale/timescaledb-ha` image

### Setup

After running standard migrations, enable TimescaleDB:

```bash
npm run db:timescale
```

This converts the `power_readings` table to a TimescaleDB hypertable for:

- Automatic time-based partitioning (1-week chunks)
- Faster time-range queries
- Efficient data compression
- Continuous aggregate support

### Without TimescaleDB

The application works without TimescaleDB. Power readings use standard
PostgreSQL tables. TimescaleDB is recommended only for:

- High-frequency monitoring (>1 reading/minute per device)
- Long-term historical data retention (>3 months)
- Complex time-series analytics
