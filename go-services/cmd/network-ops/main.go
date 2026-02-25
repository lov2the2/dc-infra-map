package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/dcim/go-services/internal/netops/handler"
	"github.com/dcim/go-services/internal/shared/db"
	"github.com/dcim/go-services/internal/shared/middleware"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
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

	cableH := &handler.CableHandler{DB: database}
	traceH := &handler.CableTraceHandler{DB: database}
	ifaceH := &handler.InterfaceHandler{DB: database}
	cpH := &handler.ConsolePortHandler{DB: database}
	fpH := &handler.FrontPortHandler{DB: database}
	rpH := &handler.RearPortHandler{DB: database}
	accessH := &handler.AccessLogHandler{DB: database}
	equipH := &handler.EquipmentMovementHandler{DB: database}
	alertH := &handler.AlertRuleHandler{DB: database}
	historyH := &handler.AlertHistoryHandler{DB: database}
	channelH := &handler.ChannelHandler{DB: database}
	reportH := &handler.ReportScheduleHandler{DB: database}
	auditH := &handler.AuditLogHandler{DB: database}
	importH := &handler.ImportHandler{DB: database}

	auth := middleware.InternalSecret(internalSecret)

	mux := http.NewServeMux()

	// Cables CRUD + Trace
	mux.Handle("GET /cables", auth(http.HandlerFunc(cableH.List)))
	mux.Handle("GET /cables/{id}", auth(http.HandlerFunc(cableH.Get)))
	mux.Handle("POST /cables", auth(http.HandlerFunc(cableH.Create)))
	mux.Handle("PATCH /cables/{id}", auth(http.HandlerFunc(cableH.Update)))
	mux.Handle("DELETE /cables/{id}", auth(http.HandlerFunc(cableH.Delete)))
	mux.Handle("GET /cables/trace/{id}", auth(http.HandlerFunc(traceH.Trace)))

	// Interfaces CRUD
	mux.Handle("GET /interfaces", auth(http.HandlerFunc(ifaceH.List)))
	mux.Handle("GET /interfaces/{id}", auth(http.HandlerFunc(ifaceH.Get)))
	mux.Handle("POST /interfaces", auth(http.HandlerFunc(ifaceH.Create)))
	mux.Handle("PATCH /interfaces/{id}", auth(http.HandlerFunc(ifaceH.Update)))
	mux.Handle("DELETE /interfaces/{id}", auth(http.HandlerFunc(ifaceH.Delete)))

	// Console Ports CRUD
	mux.Handle("GET /console-ports", auth(http.HandlerFunc(cpH.List)))
	mux.Handle("GET /console-ports/{id}", auth(http.HandlerFunc(cpH.Get)))
	mux.Handle("POST /console-ports", auth(http.HandlerFunc(cpH.Create)))
	mux.Handle("PATCH /console-ports/{id}", auth(http.HandlerFunc(cpH.Update)))
	mux.Handle("DELETE /console-ports/{id}", auth(http.HandlerFunc(cpH.Delete)))

	// Front Ports CRUD
	mux.Handle("GET /front-ports", auth(http.HandlerFunc(fpH.List)))
	mux.Handle("GET /front-ports/{id}", auth(http.HandlerFunc(fpH.Get)))
	mux.Handle("POST /front-ports", auth(http.HandlerFunc(fpH.Create)))
	mux.Handle("PATCH /front-ports/{id}", auth(http.HandlerFunc(fpH.Update)))
	mux.Handle("DELETE /front-ports/{id}", auth(http.HandlerFunc(fpH.Delete)))

	// Rear Ports CRUD
	mux.Handle("GET /rear-ports", auth(http.HandlerFunc(rpH.List)))
	mux.Handle("GET /rear-ports/{id}", auth(http.HandlerFunc(rpH.Get)))
	mux.Handle("POST /rear-ports", auth(http.HandlerFunc(rpH.Create)))
	mux.Handle("PATCH /rear-ports/{id}", auth(http.HandlerFunc(rpH.Update)))
	mux.Handle("DELETE /rear-ports/{id}", auth(http.HandlerFunc(rpH.Delete)))

	// Access Logs CRUD
	mux.Handle("GET /access-logs", auth(http.HandlerFunc(accessH.List)))
	mux.Handle("GET /access-logs/{id}", auth(http.HandlerFunc(accessH.Get)))
	mux.Handle("POST /access-logs", auth(http.HandlerFunc(accessH.Create)))
	mux.Handle("PATCH /access-logs/{id}", auth(http.HandlerFunc(accessH.Update)))
	mux.Handle("DELETE /access-logs/{id}", auth(http.HandlerFunc(accessH.Delete)))

	// Equipment Movements CRUD
	mux.Handle("GET /equipment-movements", auth(http.HandlerFunc(equipH.List)))
	mux.Handle("GET /equipment-movements/{id}", auth(http.HandlerFunc(equipH.Get)))
	mux.Handle("POST /equipment-movements", auth(http.HandlerFunc(equipH.Create)))
	mux.Handle("PATCH /equipment-movements/{id}", auth(http.HandlerFunc(equipH.Update)))
	mux.Handle("DELETE /equipment-movements/{id}", auth(http.HandlerFunc(equipH.Delete)))

	// Alert Rules CRUD + Evaluate
	mux.Handle("GET /alerts/rules", auth(http.HandlerFunc(alertH.List)))
	mux.Handle("GET /alerts/rules/{id}", auth(http.HandlerFunc(alertH.Get)))
	mux.Handle("POST /alerts/rules", auth(http.HandlerFunc(alertH.Create)))
	mux.Handle("PATCH /alerts/rules/{id}", auth(http.HandlerFunc(alertH.Update)))
	mux.Handle("DELETE /alerts/rules/{id}", auth(http.HandlerFunc(alertH.Delete)))
	mux.Handle("POST /alerts/evaluate", auth(http.HandlerFunc(alertH.Evaluate)))

	// Alert History
	mux.Handle("GET /alerts/history", auth(http.HandlerFunc(historyH.List)))
	mux.Handle("PATCH /alerts/history/{id}/acknowledge", auth(http.HandlerFunc(historyH.Acknowledge)))

	// Notification Channels CRUD
	mux.Handle("GET /alerts/channels", auth(http.HandlerFunc(channelH.List)))
	mux.Handle("GET /alerts/channels/{id}", auth(http.HandlerFunc(channelH.Get)))
	mux.Handle("POST /alerts/channels", auth(http.HandlerFunc(channelH.Create)))
	mux.Handle("PATCH /alerts/channels/{id}", auth(http.HandlerFunc(channelH.Update)))
	mux.Handle("DELETE /alerts/channels/{id}", auth(http.HandlerFunc(channelH.Delete)))

	// Report Schedules CRUD + Run
	mux.Handle("GET /reports/schedules", auth(http.HandlerFunc(reportH.List)))
	mux.Handle("GET /reports/schedules/{id}", auth(http.HandlerFunc(reportH.Get)))
	mux.Handle("POST /reports/schedules", auth(http.HandlerFunc(reportH.Create)))
	mux.Handle("PATCH /reports/schedules/{id}", auth(http.HandlerFunc(reportH.Update)))
	mux.Handle("DELETE /reports/schedules/{id}", auth(http.HandlerFunc(reportH.Delete)))
	mux.Handle("POST /reports/schedules/{id}/run", auth(http.HandlerFunc(reportH.Run)))

	// Audit Logs (read-only)
	mux.Handle("GET /audit-logs", auth(http.HandlerFunc(auditH.List)))

	// Import
	mux.Handle("POST /import/devices", auth(http.HandlerFunc(importH.ImportDevices)))
	mux.Handle("POST /import/cables", auth(http.HandlerFunc(importH.ImportCables)))
	mux.Handle("GET /import/templates/{type}", auth(http.HandlerFunc(importH.Template)))

	logged := middleware.Logging(middleware.CORS(mux))

	log.Printf("Network Ops service listening on :%s", port)
	if err := http.ListenAndServe(":"+port, logged); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
