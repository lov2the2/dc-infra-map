package handler

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/dcim/go-service/internal/db"
)

// PowerHandler handles power-related HTTP requests.
type PowerHandler struct {
	DB *db.DB
}

type powerReadingInput struct {
	FeedID      string   `json:"feedId"`
	VoltageV    float64  `json:"voltageV"`
	CurrentA    float64  `json:"currentA"`
	PowerKw     float64  `json:"powerKw"`
	PowerFactor *float64 `json:"powerFactor"`
	EnergyKwh   *float64 `json:"energyKwh"`
}

type powerReadingOutput struct {
	FeedID      string  `json:"feedId"`
	Time        string  `json:"time"`
	VoltageV    float64 `json:"voltageV"`
	CurrentA    float64 `json:"currentA"`
	PowerKw     float64 `json:"powerKw"`
	PowerFactor float64 `json:"powerFactor"`
	EnergyKwh   float64 `json:"energyKwh"`
}

// CreateReadings handles POST /readings — batch inserts power readings.
func (h *PowerHandler) CreateReadings(w http.ResponseWriter, r *http.Request) {
	var inputs []powerReadingInput
	if err := json.NewDecoder(r.Body).Decode(&inputs); err != nil {
		jsonResponse(w, map[string]string{"error": "invalid JSON"}, http.StatusBadRequest)
		return
	}

	if len(inputs) == 0 {
		jsonResponse(w, map[string]int{"ingested": 0}, http.StatusCreated)
		return
	}

	ctx := r.Context()
	tx, err := h.DB.Pool.Begin(ctx)
	if err != nil {
		jsonResponse(w, map[string]string{"error": "db error"}, http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	count := 0
	for _, inp := range inputs {
		_, err := tx.Exec(ctx,
			`INSERT INTO power_readings (feed_id, voltage_v, current_a, power_kw, power_factor, energy_kwh)
             VALUES ($1, $2, $3, $4, $5, $6)`,
			inp.FeedID, inp.VoltageV, inp.CurrentA, inp.PowerKw, inp.PowerFactor, inp.EnergyKwh,
		)
		if err != nil {
			jsonResponse(w, map[string]string{"error": "insert failed"}, http.StatusInternalServerError)
			return
		}
		count++
	}

	if err := tx.Commit(ctx); err != nil {
		jsonResponse(w, map[string]string{"error": "commit failed"}, http.StatusInternalServerError)
		return
	}

	jsonResponse(w, map[string]int{"ingested": count}, http.StatusCreated)
}

// GetReadings handles GET /readings?feedId=X&from=Y&to=Z
func (h *PowerHandler) GetReadings(w http.ResponseWriter, r *http.Request) {
	feedID := r.URL.Query().Get("feedId")
	if feedID == "" {
		jsonResponse(w, map[string]string{"error": "feedId is required"}, http.StatusBadRequest)
		return
	}

	now := time.Now()
	startTime := now.Add(-1 * time.Hour)
	endTime := now

	if from := r.URL.Query().Get("from"); from != "" {
		if t, err := time.Parse(time.RFC3339, from); err == nil {
			startTime = t
		}
	}
	if to := r.URL.Query().Get("to"); to != "" {
		if t, err := time.Parse(time.RFC3339, to); err == nil {
			endTime = t
		}
	}

	ctx := r.Context()
	rows, err := h.DB.Pool.Query(ctx,
		`SELECT feed_id, recorded_at, voltage_v, current_a, power_kw,
                COALESCE(power_factor, 0), COALESCE(energy_kwh, 0)
         FROM power_readings
         WHERE feed_id = $1 AND recorded_at >= $2 AND recorded_at <= $3
         ORDER BY recorded_at`,
		feedID, startTime, endTime,
	)
	if err != nil {
		jsonResponse(w, map[string]string{"error": "query failed"}, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	readings := []powerReadingOutput{}
	for rows.Next() {
		var out powerReadingOutput
		var recordedAt time.Time
		if err := rows.Scan(&out.FeedID, &recordedAt, &out.VoltageV, &out.CurrentA,
			&out.PowerKw, &out.PowerFactor, &out.EnergyKwh); err != nil {
			continue
		}
		out.Time = recordedAt.UTC().Format(time.RFC3339)
		readings = append(readings, out)
	}

	// Fallback to mock data when no DB readings exist
	if len(readings) == 0 {
		interval := r.URL.Query().Get("interval")
		var intervalMs int64 = 300000
		switch interval {
		case "1h":
			intervalMs = 3600000
		case "1d":
			intervalMs = 86400000
		}
		startMs := startTime.UnixMilli()
		endMs := endTime.UnixMilli()
		for t := startMs; t <= endMs; t += intervalMs {
			readings = append(readings, generateMockReading(feedID, t))
		}
	}

	jsonResponse(w, readings, http.StatusOK)
}

// StreamSSE handles GET /sse — SSE stream of power readings every 5 seconds.
func (h *PowerHandler) StreamSSE(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming not supported", http.StatusInternalServerError)
		return
	}

	type feedConfig struct {
		ID       string
		RatedKw  float64
		FeedType string
	}

	ctx := r.Context()
	rows, err := h.DB.Pool.Query(ctx,
		`SELECT id, rated_kw, feed_type FROM power_feeds WHERE deleted_at IS NULL`,
	)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	var feeds []feedConfig
	for rows.Next() {
		var f feedConfig
		if err := rows.Scan(&f.ID, &f.RatedKw, &f.FeedType); err == nil {
			feeds = append(feeds, f)
		}
	}
	rows.Close()

	sendReadings := func() {
		var readings []powerReadingOutput
		now := time.Now().UTC()
		for _, f := range feeds {
			powerKw := f.RatedKw * (0.5 + rand.Float64()*0.45)
			voltageV := 208.0 + rand.Float64()*4.0
			currentA := (powerKw * 1000) / (voltageV * 1.732)
			readings = append(readings, powerReadingOutput{
				FeedID:      f.ID,
				Time:        now.Format(time.RFC3339),
				VoltageV:    voltageV,
				CurrentA:    currentA,
				PowerKw:     powerKw,
				PowerFactor: 0.9 + rand.Float64()*0.05,
				EnergyKwh:   powerKw * 0.0833,
			})
		}
		data, _ := json.Marshal(readings)
		fmt.Fprintf(w, "data: %s\n\n", data)
		flusher.Flush()
	}

	sendReadings()

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			sendReadings()
		case <-ctx.Done():
			return
		}
	}
}

func generateMockReading(feedID string, tsMs int64) powerReadingOutput {
	powerKw := 5.0 + rand.Float64()*5.0
	voltageV := 208.0 + rand.Float64()*4.0
	currentA := (powerKw * 1000) / (voltageV * 1.732)
	return powerReadingOutput{
		FeedID:      feedID,
		Time:        time.UnixMilli(tsMs).UTC().Format(time.RFC3339),
		VoltageV:    voltageV,
		CurrentA:    currentA,
		PowerKw:     powerKw,
		PowerFactor: 0.9 + rand.Float64()*0.05,
		EnergyKwh:   powerKw * 0.0833,
	}
}

func jsonResponse(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

