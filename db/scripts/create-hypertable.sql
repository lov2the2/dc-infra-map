-- TimescaleDB hypertable for power readings
-- Run this after Drizzle migrations

CREATE TABLE IF NOT EXISTS power_readings (
    time TIMESTAMPTZ NOT NULL,
    feed_id TEXT NOT NULL REFERENCES power_feeds(id),
    voltage_v REAL,
    current_a REAL,
    power_kw REAL,
    power_factor REAL,
    energy_kwh REAL
);

-- Create hypertable (7-day chunks)
SELECT create_hypertable('power_readings', 'time',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Compression policy (compress chunks older than 30 days)
ALTER TABLE power_readings SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'feed_id',
    timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('power_readings', INTERVAL '30 days', if_not_exists => TRUE);

-- Continuous aggregate: 5-minute buckets
CREATE MATERIALIZED VIEW IF NOT EXISTS power_readings_5min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('5 minutes', time) AS bucket,
    feed_id,
    AVG(voltage_v) AS avg_voltage_v,
    AVG(current_a) AS avg_current_a,
    AVG(power_kw) AS avg_power_kw,
    AVG(power_factor) AS avg_power_factor,
    MAX(power_kw) AS max_power_kw,
    SUM(energy_kwh) AS total_energy_kwh
FROM power_readings
GROUP BY bucket, feed_id;

-- Continuous aggregate: hourly buckets
CREATE MATERIALIZED VIEW IF NOT EXISTS power_readings_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    feed_id,
    AVG(voltage_v) AS avg_voltage_v,
    AVG(current_a) AS avg_current_a,
    AVG(power_kw) AS avg_power_kw,
    AVG(power_factor) AS avg_power_factor,
    MAX(power_kw) AS max_power_kw,
    SUM(energy_kwh) AS total_energy_kwh
FROM power_readings
GROUP BY bucket, feed_id;

-- Refresh policies
SELECT add_continuous_aggregate_policy('power_readings_5min',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes',
    if_not_exists => TRUE
);

SELECT add_continuous_aggregate_policy('power_readings_hourly',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_power_readings_feed_time ON power_readings (feed_id, time DESC);
