package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/dcim/go-services/internal/core/handler"
	"github.com/dcim/go-services/internal/shared/db"
	"github.com/dcim/go-services/internal/shared/middleware"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	internalSecret := os.Getenv("X_INTERNAL_SECRET")
	if internalSecret == "" {
		log.Fatal("X_INTERNAL_SECRET environment variable is required")
	}

	ctx := context.Background()
	database, err := db.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("connect to database: %v", err)
	}
	defer database.Close()

	siteH := &handler.SiteHandler{DB: database}
	regionH := &handler.RegionHandler{DB: database}
	locationH := &handler.LocationHandler{DB: database}
	rackH := &handler.RackHandler{DB: database}
	deviceH := &handler.DeviceHandler{DB: database}
	dtH := &handler.DeviceTypeHandler{DB: database}
	mfH := &handler.ManufacturerHandler{DB: database}
	tenantH := &handler.TenantHandler{DB: database}
	dashH := &handler.DashboardHandler{DB: database}

	auth := middleware.InternalSecret(internalSecret)

	mux := http.NewServeMux()

	// Sites CRUD
	mux.Handle("GET /sites", auth(http.HandlerFunc(siteH.List)))
	mux.Handle("GET /sites/{id}", auth(http.HandlerFunc(siteH.Get)))
	mux.Handle("POST /sites", auth(http.HandlerFunc(siteH.Create)))
	mux.Handle("PATCH /sites/{id}", auth(http.HandlerFunc(siteH.Update)))
	mux.Handle("DELETE /sites/{id}", auth(http.HandlerFunc(siteH.Delete)))

	// Regions CRUD
	mux.Handle("GET /regions", auth(http.HandlerFunc(regionH.List)))
	mux.Handle("GET /regions/{id}", auth(http.HandlerFunc(regionH.Get)))
	mux.Handle("POST /regions", auth(http.HandlerFunc(regionH.Create)))
	mux.Handle("PATCH /regions/{id}", auth(http.HandlerFunc(regionH.Update)))
	mux.Handle("DELETE /regions/{id}", auth(http.HandlerFunc(regionH.Delete)))

	// Locations CRUD
	mux.Handle("GET /locations", auth(http.HandlerFunc(locationH.List)))
	mux.Handle("GET /locations/{id}", auth(http.HandlerFunc(locationH.Get)))
	mux.Handle("POST /locations", auth(http.HandlerFunc(locationH.Create)))
	mux.Handle("PATCH /locations/{id}", auth(http.HandlerFunc(locationH.Update)))
	mux.Handle("DELETE /locations/{id}", auth(http.HandlerFunc(locationH.Delete)))

	// Racks CRUD
	mux.Handle("GET /racks", auth(http.HandlerFunc(rackH.List)))
	mux.Handle("GET /racks/{id}", auth(http.HandlerFunc(rackH.Get)))
	mux.Handle("POST /racks", auth(http.HandlerFunc(rackH.Create)))
	mux.Handle("PATCH /racks/{id}", auth(http.HandlerFunc(rackH.Update)))
	mux.Handle("DELETE /racks/{id}", auth(http.HandlerFunc(rackH.Delete)))

	// Devices CRUD + Batch
	mux.Handle("GET /devices", auth(http.HandlerFunc(deviceH.List)))
	mux.Handle("GET /devices/{id}", auth(http.HandlerFunc(deviceH.Get)))
	mux.Handle("POST /devices", auth(http.HandlerFunc(deviceH.Create)))
	mux.Handle("PATCH /devices/{id}", auth(http.HandlerFunc(deviceH.Update)))
	mux.Handle("DELETE /devices/{id}", auth(http.HandlerFunc(deviceH.Delete)))
	mux.Handle("POST /devices/batch", auth(http.HandlerFunc(deviceH.Batch)))

	// Device Types CRUD
	mux.Handle("GET /device-types", auth(http.HandlerFunc(dtH.List)))
	mux.Handle("GET /device-types/{id}", auth(http.HandlerFunc(dtH.Get)))
	mux.Handle("POST /device-types", auth(http.HandlerFunc(dtH.Create)))
	mux.Handle("PATCH /device-types/{id}", auth(http.HandlerFunc(dtH.Update)))
	mux.Handle("DELETE /device-types/{id}", auth(http.HandlerFunc(dtH.Delete)))

	// Manufacturers CRUD
	mux.Handle("GET /manufacturers", auth(http.HandlerFunc(mfH.List)))
	mux.Handle("GET /manufacturers/{id}", auth(http.HandlerFunc(mfH.Get)))
	mux.Handle("POST /manufacturers", auth(http.HandlerFunc(mfH.Create)))
	mux.Handle("PATCH /manufacturers/{id}", auth(http.HandlerFunc(mfH.Update)))
	mux.Handle("DELETE /manufacturers/{id}", auth(http.HandlerFunc(mfH.Delete)))

	// Tenants CRUD
	mux.Handle("GET /tenants", auth(http.HandlerFunc(tenantH.List)))
	mux.Handle("GET /tenants/{id}", auth(http.HandlerFunc(tenantH.Get)))
	mux.Handle("POST /tenants", auth(http.HandlerFunc(tenantH.Create)))
	mux.Handle("PATCH /tenants/{id}", auth(http.HandlerFunc(tenantH.Update)))
	mux.Handle("DELETE /tenants/{id}", auth(http.HandlerFunc(tenantH.Delete)))

	// Dashboard
	mux.Handle("GET /dashboard/summary", auth(http.HandlerFunc(dashH.Summary)))

	logged := middleware.Logging(middleware.CORS(mux))

	log.Printf("Core API service listening on :%s", port)
	if err := http.ListenAndServe(":"+port, logged); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
