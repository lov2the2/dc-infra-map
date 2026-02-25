package handler

import (
	"log"
	"net/http"

	"github.com/dcim/go-services/internal/shared/db"
	"github.com/dcim/go-services/internal/shared/response"
)

type DashboardHandler struct{ DB *db.DB }

type siteSummary struct {
	SiteID                  string `json:"siteId"`
	SiteName                string `json:"siteName"`
	SiteSlug                string `json:"siteSlug"`
	RackCount               int    `json:"rackCount"`
	DeviceCount             int    `json:"deviceCount"`
	PowerUtilizationPercent int    `json:"powerUtilizationPercent"`
}

func (h *DashboardHandler) Summary(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	rows, err := h.DB.Pool.Query(ctx, `SELECT id, name, slug FROM sites WHERE deleted_at IS NULL ORDER BY name`)
	if err != nil {
		log.Printf("dashboard summary sites error: %v", err)
		response.InternalError(w, "database error")
		return
	}
	defer rows.Close()

	type siteInfo struct {
		id, name, slug string
	}
	var sites []siteInfo
	for rows.Next() {
		var s siteInfo
		if err := rows.Scan(&s.id, &s.name, &s.slug); err != nil {
			continue
		}
		sites = append(sites, s)
	}

	if len(sites) == 0 {
		response.OK(w, []siteSummary{})
		return
	}

	results := make([]siteSummary, 0, len(sites))
	for _, site := range sites {
		var rackCount, deviceCount int

		// Count racks via locations
		err := h.DB.Pool.QueryRow(ctx, `
			SELECT COUNT(*) FROM racks r
			JOIN locations l ON r.location_id = l.id
			WHERE l.site_id = $1 AND r.deleted_at IS NULL AND l.deleted_at IS NULL`, site.id).Scan(&rackCount)
		if err != nil {
			rackCount = 0
		}

		// Count devices in those racks
		err = h.DB.Pool.QueryRow(ctx, `
			SELECT COUNT(*) FROM devices d
			JOIN racks r ON d.rack_id = r.id
			JOIN locations l ON r.location_id = l.id
			WHERE l.site_id = $1 AND d.deleted_at IS NULL AND r.deleted_at IS NULL AND l.deleted_at IS NULL`, site.id).Scan(&deviceCount)
		if err != nil {
			deviceCount = 0
		}

		// Power utilization from feeds
		var totalRated, totalCurrent float64
		feedRows, err := h.DB.Pool.Query(ctx, `
			SELECT f.rated_kw FROM power_feeds f
			JOIN racks r ON f.rack_id = r.id
			JOIN locations l ON r.location_id = l.id
			WHERE l.site_id = $1 AND f.deleted_at IS NULL AND r.deleted_at IS NULL`, site.id)
		if err == nil {
			defer feedRows.Close()
			for feedRows.Next() {
				var rated float64
				if err := feedRows.Scan(&rated); err == nil {
					totalRated += rated
					totalCurrent += rated * 0.65 // mock utilization ~65%
				}
			}
		}

		pct := 0
		if totalRated > 0 {
			pct = int(totalCurrent / totalRated * 100)
		}

		results = append(results, siteSummary{
			SiteID:                  site.id,
			SiteName:                site.name,
			SiteSlug:                site.slug,
			RackCount:               rackCount,
			DeviceCount:             deviceCount,
			PowerUtilizationPercent: pct,
		})
	}

	response.OK(w, results)
}
