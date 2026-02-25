package handler

import (
	"net/http"

	"github.com/dcim/go-services/internal/shared/db"
	"github.com/dcim/go-services/internal/shared/response"
)

type ImportHandler struct{ DB *db.DB }

// ImportDevices handles POST /import/devices — CSV import for devices.
func (h *ImportHandler) ImportDevices(w http.ResponseWriter, r *http.Request) {
	// CSV import requires multipart form parsing
	// Placeholder: returns success with guidance
	response.OK(w, map[string]string{"status": "device import endpoint ready", "note": "send multipart/form-data with CSV file"})
}

// ImportCables handles POST /import/cables — CSV import for cables.
func (h *ImportHandler) ImportCables(w http.ResponseWriter, r *http.Request) {
	response.OK(w, map[string]string{"status": "cable import endpoint ready", "note": "send multipart/form-data with CSV file"})
}

// Template handles GET /import/templates/{type} — CSV template download.
func (h *ImportHandler) Template(w http.ResponseWriter, r *http.Request) {
	templateType := r.PathValue("type")

	var headers string
	switch templateType {
	case "devices":
		headers = "name,deviceTypeId,rackId,status,face,position,serialNumber,assetTag,description"
	case "cables":
		headers = "cableType,status,label,length,color,terminationAType,terminationAId,terminationBType,terminationBId,description"
	default:
		response.BadRequest(w, "unknown template type: "+templateType)
		return
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename="+templateType+"_template.csv")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(headers + "\n"))
}
