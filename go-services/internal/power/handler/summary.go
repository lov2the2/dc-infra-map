package handler

import (
	"log"
	"math"
	"math/rand"
	"net/http"

	"github.com/dcim/go-services/internal/shared/db"
	"github.com/dcim/go-services/internal/shared/response"
)

// SummaryHandler handles power summary endpoint.
type SummaryHandler struct {
	DB *db.DB
}

type feedSummary struct {
	FeedID             string  `json:"feedId"`
	Name               string  `json:"name"`
	FeedType           string  `json:"feedType"`
	MaxKw              float64 `json:"maxKw"`
	CurrentKw          float64 `json:"currentKw"`
	UtilizationPercent int     `json:"utilizationPercent"`
}

type rackPowerSummary struct {
	RackID             string        `json:"rackId"`
	RackName           string        `json:"rackName"`
	Feeds              []feedSummary `json:"feeds"`
	TotalMaxKw         float64       `json:"totalMaxKw"`
	TotalCurrentKw     float64       `json:"totalCurrentKw"`
	UtilizationPercent int           `json:"utilizationPercent"`
}

// GetSummary handles GET /summary?siteId=
func (h *SummaryHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	siteID := r.URL.Query().Get("siteId")
	ctx := r.Context()

	// Step 1: Resolve rack IDs for the given site
	var rackIDs []string

	if siteID != "" {
		// Get locations for this site
		locRows, err := h.DB.Pool.Query(ctx, `SELECT id FROM locations WHERE site_id = $1`, siteID)
		if err != nil {
			log.Printf("summary location query error: %v", err)
			response.InternalError(w, "database error")
			return
		}

		var locationIDs []string
		for locRows.Next() {
			var locID string
			if err := locRows.Scan(&locID); err == nil {
				locationIDs = append(locationIDs, locID)
			}
		}
		locRows.Close()

		if len(locationIDs) == 0 {
			response.OK(w, []rackPowerSummary{})
			return
		}

		// Get racks for these locations
		rackRows, err := h.DB.Pool.Query(ctx, `
			SELECT id FROM racks
			WHERE deleted_at IS NULL AND location_id = ANY($1)`, locationIDs)
		if err != nil {
			log.Printf("summary rack query error: %v", err)
			response.InternalError(w, "database error")
			return
		}

		for rackRows.Next() {
			var rID string
			if err := rackRows.Scan(&rID); err == nil {
				rackIDs = append(rackIDs, rID)
			}
		}
		rackRows.Close()

		if len(rackIDs) == 0 {
			response.OK(w, []rackPowerSummary{})
			return
		}
	}

	// Step 2: Fetch feeds with rack info
	query := `
		SELECT pf.id, pf.name, pf.feed_type, pf.rated_kw, pf.rack_id,
		       COALESCE(rk.name, '')
		FROM power_feeds pf
		LEFT JOIN racks rk ON pf.rack_id = rk.id
		WHERE pf.deleted_at IS NULL AND pf.rack_id IS NOT NULL`
	args := []interface{}{}

	if len(rackIDs) > 0 {
		query += " AND pf.rack_id = ANY($1)"
		args = append(args, rackIDs)
	}

	feedRows, err := h.DB.Pool.Query(ctx, query, args...)
	if err != nil {
		log.Printf("summary feed query error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer feedRows.Close()

	// Step 3: Group feeds by rack
	type feedInfo struct {
		ID       string
		Name     string
		FeedType string
		RatedKw  float64
	}
	type rackInfo struct {
		Name  string
		Feeds []feedInfo
	}

	rackMap := map[string]*rackInfo{}
	rackOrder := []string{}

	for feedRows.Next() {
		var fID, fName, fType, rackID, rackName string
		var ratedKw float64
		if err := feedRows.Scan(&fID, &fName, &fType, &ratedKw, &rackID, &rackName); err != nil {
			continue
		}
		if _, ok := rackMap[rackID]; !ok {
			rackMap[rackID] = &rackInfo{Name: rackName}
			rackOrder = append(rackOrder, rackID)
		}
		rackMap[rackID].Feeds = append(rackMap[rackID].Feeds, feedInfo{
			ID: fID, Name: fName, FeedType: fType, RatedKw: ratedKw,
		})
	}

	// Step 4: Calculate power summaries with mock readings
	summaries := []rackPowerSummary{}

	for _, rackID := range rackOrder {
		ri := rackMap[rackID]
		feedSummaries := []feedSummary{}
		var totalMaxKw, totalCurrentKw float64

		for _, f := range ri.Feeds {
			currentKw := f.RatedKw * (0.5 + rand.Float64()*0.45)
			utilPct := 0
			if f.RatedKw > 0 {
				utilPct = int(math.Round((currentKw / f.RatedKw) * 100))
			}
			feedSummaries = append(feedSummaries, feedSummary{
				FeedID:             f.ID,
				Name:               f.Name,
				FeedType:           f.FeedType,
				MaxKw:              f.RatedKw,
				CurrentKw:          math.Round(currentKw*100) / 100,
				UtilizationPercent: utilPct,
			})
			totalMaxKw += f.RatedKw
			totalCurrentKw += currentKw
		}

		rackUtil := 0
		if totalMaxKw > 0 {
			rackUtil = int(math.Round((totalCurrentKw / totalMaxKw) * 100))
		}

		summaries = append(summaries, rackPowerSummary{
			RackID:             rackID,
			RackName:           ri.Name,
			Feeds:              feedSummaries,
			TotalMaxKw:         math.Round(totalMaxKw*100) / 100,
			TotalCurrentKw:     math.Round(totalCurrentKw*100) / 100,
			UtilizationPercent: rackUtil,
		})
	}

	response.OK(w, summaries)
}
