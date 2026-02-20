package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/dcim/go-service/internal/db"
	"github.com/dcim/go-service/internal/handler"
	"github.com/dcim/go-service/internal/middleware"
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

	auth := middleware.InternalSecret(internalSecret)

	mux := http.NewServeMux()
	mux.Handle("POST /readings", auth(http.HandlerFunc(powerH.CreateReadings)))
	mux.Handle("GET /readings", auth(http.HandlerFunc(powerH.GetReadings)))
	mux.Handle("GET /sse", auth(http.HandlerFunc(powerH.StreamSSE)))
	mux.Handle("GET /export/racks", auth(http.HandlerFunc(exportH.ExportRacks)))
	mux.Handle("GET /export/devices", auth(http.HandlerFunc(exportH.ExportDevices)))
	mux.Handle("GET /export/cables", auth(http.HandlerFunc(exportH.ExportCables)))
	mux.Handle("GET /export/access", auth(http.HandlerFunc(exportH.ExportAccess)))
	mux.Handle("GET /export/power", auth(http.HandlerFunc(exportH.ExportPower)))
	mux.Handle("GET /export/xml/racks", auth(http.HandlerFunc(exportH.ExportXMLRacks)))
	mux.Handle("GET /export/xml/devices", auth(http.HandlerFunc(exportH.ExportXMLDevices)))

	log.Printf("Go service listening on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
