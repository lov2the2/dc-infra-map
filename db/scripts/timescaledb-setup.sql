-- TimescaleDB Setup for Power Readings
--
-- Prerequisites:
--   1. PostgreSQL with TimescaleDB extension installed
--      (https://docs.timescale.com/install/latest/)
--   2. Run AFTER initial Drizzle migrations: npm run db:migrate
--
-- Usage: npm run db:timescale
--
-- NOTE: This script is idempotent (safe to run multiple times).

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Convert power_readings to a hypertable partitioned by recorded_at
-- chunk_time_interval: 1 week (suitable for IoT/monitoring data)
SELECT create_hypertable(
    'power_readings',
    'recorded_at',
    chunk_time_interval => INTERVAL '1 week',
    if_not_exists => TRUE
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_power_readings_feed_time
    ON power_readings (feed_id, recorded_at DESC);

-- Enable compression (optional, for data older than 7 days)
-- ALTER TABLE power_readings SET (
--     timescaledb.compress,
--     timescaledb.compress_segmentby = 'feed_id'
-- );
-- SELECT add_compression_policy('power_readings', INTERVAL '7 days');

-- Enable continuous aggregate for hourly summaries (optional)
-- CREATE MATERIALIZED VIEW power_readings_hourly
-- WITH (timescaledb.continuous) AS
-- SELECT
--     time_bucket('1 hour', recorded_at) AS bucket,
--     feed_id,
--     AVG(power_kw) AS avg_power_kw,
--     MAX(power_kw) AS max_power_kw,
--     MIN(power_kw) AS min_power_kw,
--     AVG(current_a) AS avg_current_a,
--     AVG(voltage_v) AS avg_voltage_v
-- FROM power_readings
-- GROUP BY bucket, feed_id;
