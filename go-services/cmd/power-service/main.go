package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/dcim/go-services/internal/power/handler"
	"github.com/dcim/go-services/internal/shared/db"
	"github.com/dcim/go-services/internal/shared/middleware"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	internalSecret := os.Getenv("INTERNAL_SECRET")
	if internalSecret == "" {
		log.Fatal("INTERNAL_SECRET environment variable is required")
	}

	ctx := context.Background()
	database, err := db.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("connect to database: %v", err)
	}
	defer database.Close()

	powerH := &handler.PowerHandler{DB: database}
	exportH := &handler.ExportHandler{DB: database}
	panelH := &handler.PanelHandler{DB: database}
	feedH := &handler.FeedHandler{DB: database}
	summaryH := &handler.SummaryHandler{DB: database}

	auth := middleware.InternalSecret(internalSecret)

	mux := http.NewServeMux()

	// Power readings & SSE (existing routes)
	mux.Handle("POST /readings", auth(http.HandlerFunc(powerH.CreateReadings)))
	mux.Handle("GET /readings", auth(http.HandlerFunc(powerH.GetReadings)))
	mux.Handle("GET /sse", auth(http.HandlerFunc(powerH.StreamSSE)))

	// Power panels CRUD
	mux.Handle("GET /panels", auth(http.HandlerFunc(panelH.List)))
	mux.Handle("GET /panels/{id}", auth(http.HandlerFunc(panelH.Get)))
	mux.Handle("POST /panels", auth(http.HandlerFunc(panelH.Create)))
	mux.Handle("PATCH /panels/{id}", auth(http.HandlerFunc(panelH.Update)))
	mux.Handle("DELETE /panels/{id}", auth(http.HandlerFunc(panelH.Delete)))

	// Power feeds CRUD
	mux.Handle("GET /feeds", auth(http.HandlerFunc(feedH.List)))
	mux.Handle("GET /feeds/{id}", auth(http.HandlerFunc(feedH.Get)))
	mux.Handle("POST /feeds", auth(http.HandlerFunc(feedH.Create)))
	mux.Handle("PATCH /feeds/{id}", auth(http.HandlerFunc(feedH.Update)))
	mux.Handle("DELETE /feeds/{id}", auth(http.HandlerFunc(feedH.Delete)))

	// Power summary
	mux.Handle("GET /summary", auth(http.HandlerFunc(summaryH.GetSummary)))

	// Export routes (existing)
	mux.Handle("GET /export/racks", auth(http.HandlerFunc(exportH.ExportRacks)))
	mux.Handle("GET /export/devices", auth(http.HandlerFunc(exportH.ExportDevices)))
	mux.Handle("GET /export/cables", auth(http.HandlerFunc(exportH.ExportCables)))
	mux.Handle("GET /export/access", auth(http.HandlerFunc(exportH.ExportAccess)))
	mux.Handle("GET /export/power", auth(http.HandlerFunc(exportH.ExportPower)))
	mux.Handle("GET /export/xml/racks", auth(http.HandlerFunc(exportH.ExportXMLRacks)))
	mux.Handle("GET /export/xml/devices", auth(http.HandlerFunc(exportH.ExportXMLDevices)))

	// Apply logging middleware
	logged := middleware.Logging(middleware.CORS(mux))

	log.Printf("Power service listening on :%s", port)
	if err := http.ListenAndServe(":"+port, logged); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
