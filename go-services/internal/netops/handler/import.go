package handler

import (
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/dcim/go-services/internal/shared/db"
	"github.com/dcim/go-services/internal/shared/response"
)

type ImportHandler struct{ DB *db.DB }

func buildColMap(headers []string) map[string]int {
	m := make(map[string]int, len(headers))
	for i, h := range headers {
		m[strings.TrimSpace(strings.ToLower(h))] = i
	}
	return m
}

func getCol(record []string, colMap map[string]int, key string) string {
	if i, ok := colMap[strings.ToLower(key)]; ok && i < len(record) {
		return strings.TrimSpace(record[i])
	}
	return ""
}

// ImportDevices handles POST /import/devices — CSV import for devices.
func (h *ImportHandler) ImportDevices(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		response.BadRequest(w, "failed to parse form: "+err.Error())
		return
	}
	file, _, err := r.FormFile("file")
	if err != nil {
		response.BadRequest(w, "file field required")
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	headers, err := reader.Read()
	if err != nil {
		response.BadRequest(w, "failed to read CSV headers")
		return
	}
	colMap := buildColMap(headers)

	imported := 0
	var importErrors []map[string]string

	for rowNum := 2; ; rowNum++ {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			importErrors = append(importErrors, map[string]string{
				"row": strconv.Itoa(rowNum), "error": err.Error(),
			})
			continue
		}

		name := getCol(record, colMap, "name")
		if name == "" {
			importErrors = append(importErrors, map[string]string{
				"row": strconv.Itoa(rowNum), "error": "name is required",
			})
			continue
		}

		status := getCol(record, colMap, "status")
		if status == "" {
			status = "active"
		}
		deviceTypeID := getCol(record, colMap, "devicetypeid")
		rackID := getCol(record, colMap, "rackid")
		face := getCol(record, colMap, "face")
		posStr := getCol(record, colMap, "position")
		serialNumber := getCol(record, colMap, "serialnumber")
		assetTag := getCol(record, colMap, "assettag")
		description := getCol(record, colMap, "description")

		var position *int
		if posStr != "" {
			if p, err := strconv.Atoi(posStr); err == nil {
				position = &p
			}
		}

		// device_type_id is NOT NULL — validate before attempting insert
		if deviceTypeID == "" {
			importErrors = append(importErrors, map[string]string{
				"row": strconv.Itoa(rowNum), "error": "deviceTypeId is required",
			})
			continue
		}

		nilStr := func(s string) interface{} {
			if s == "" {
				return nil
			}
			return s
		}

		_, insertErr := h.DB.Pool.Exec(r.Context(),
			`INSERT INTO devices (id, name, device_type_id, rack_id, status, face, position, serial_number, asset_tag, description)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			name, deviceTypeID, nilStr(rackID), status,
			nilStr(face), position, nilStr(serialNumber), nilStr(assetTag), nilStr(description))
		if insertErr != nil {
			importErrors = append(importErrors, map[string]string{
				"row": strconv.Itoa(rowNum), "error": insertErr.Error(),
			})
			continue
		}
		imported++
	}

	// Return flat response (no "data" wrapper) so callers can access imported/errors directly.
	response.JSON(w, map[string]interface{}{
		"imported": imported,
		"errors":   importErrors,
	}, http.StatusOK)
}

// ImportCables handles POST /import/cables — CSV import for cables.
func (h *ImportHandler) ImportCables(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		response.BadRequest(w, "failed to parse form: "+err.Error())
		return
	}
	file, _, err := r.FormFile("file")
	if err != nil {
		response.BadRequest(w, "file field required")
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	headers, err := reader.Read()
	if err != nil {
		response.BadRequest(w, "failed to read CSV headers")
		return
	}
	colMap := buildColMap(headers)

	imported := 0
	var importErrors []map[string]string

	for rowNum := 2; ; rowNum++ {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			importErrors = append(importErrors, map[string]string{
				"row": strconv.Itoa(rowNum), "error": err.Error(),
			})
			continue
		}

		cableType := getCol(record, colMap, "cabletype")
		if cableType == "" {
			importErrors = append(importErrors, map[string]string{
				"row": strconv.Itoa(rowNum), "error": "cableType is required",
			})
			continue
		}
		status := getCol(record, colMap, "status")
		if status == "" {
			status = "connected"
		}

		nilStr := func(s string) interface{} {
			if s == "" {
				return nil
			}
			return s
		}

		label := getCol(record, colMap, "label")
		length := getCol(record, colMap, "length")
		color := getCol(record, colMap, "color")
		termAType := getCol(record, colMap, "terminationatype")
		termAID := getCol(record, colMap, "terminationaid")
		termBType := getCol(record, colMap, "terminationbtype")
		termBID := getCol(record, colMap, "terminationbid")
		description := getCol(record, colMap, "description")

		var lengthVal *float64
		if length != "" {
			if l, err := strconv.ParseFloat(length, 64); err == nil {
				lengthVal = &l
			}
		}

		// label, termination_a_type/id, termination_b_type/id are NOT NULL
		if label == "" {
			label = ""
		}

		_, insertErr := h.DB.Pool.Exec(r.Context(),
			`INSERT INTO cables (id, cable_type, status, label, length, color, termination_a_type, termination_a_id, termination_b_type, termination_b_id, description)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
			cableType, status, label, lengthVal, nilStr(color),
			nilStr(termAType), nilStr(termAID), nilStr(termBType), nilStr(termBID), nilStr(description))
		if insertErr != nil {
			importErrors = append(importErrors, map[string]string{
				"row": strconv.Itoa(rowNum), "error": insertErr.Error(),
			})
			continue
		}
		imported++
	}

	// Return flat response (no "data" wrapper) so callers can access imported/errors directly.
	response.JSON(w, map[string]interface{}{
		"imported": imported,
		"errors":   importErrors,
	}, http.StatusOK)
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
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s_template.csv", templateType))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(headers + "\n"))
}
