package handler

import (
	"encoding/xml"
	"fmt"
	"net/http"
	"time"

	"github.com/dcim/go-service/internal/db"
	"github.com/xuri/excelize/v2"
)

// ExportHandler handles data export HTTP requests.
type ExportHandler struct {
	DB *db.DB
}

// xlsxResponse writes an xlsx file as an HTTP download response.
func xlsxResponse(w http.ResponseWriter, f *excelize.File, filename string) {
	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	f.Write(w) //nolint:errcheck
}

// today returns the current date as YYYY-MM-DD.
func today() string {
	return time.Now().UTC().Format("2006-01-02")
}

// derefStr dereferences a string pointer, returning empty string for nil.
func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// derefInt dereferences an int pointer, returning 0 for nil.
func derefInt(i *int) int {
	if i == nil {
		return 0
	}
	return *i
}

// setHeaders writes header row to an xlsx sheet.
func setHeaders(f *excelize.File, sheet string, headers []string) {
	for col, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(col+1, 1)
		f.SetCellValue(sheet, cell, h)
	}
}

// setRow writes a data row to an xlsx sheet.
func setRow(f *excelize.File, sheet string, rowIdx int, vals []interface{}) {
	for col, val := range vals {
		cell, _ := excelize.CoordinatesToCellName(col+1, rowIdx)
		f.SetCellValue(sheet, cell, val)
	}
}

// ExportRacks handles GET /export/racks — exports rack and device data as xlsx.
func (h *ExportHandler) ExportRacks(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := h.DB.Pool.Query(ctx, `
		SELECT r.name, l.name, s.name, r.u_height,
		       COALESCE(d.name, ''), COALESCE(d.position, ''),
		       COALESCE(dt.model, ''), COALESCE(d.status, '')
		FROM racks r
		JOIN locations l ON r.location_id = l.id
		JOIN sites s ON l.site_id = s.id
		LEFT JOIN devices d ON d.rack_id = r.id AND d.deleted_at IS NULL
		WHERE r.deleted_at IS NULL
		ORDER BY s.name, l.name, r.name
	`)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	f := excelize.NewFile()
	sheet := "Racks"
	f.SetSheetName("Sheet1", sheet)
	headers := []string{"Rack Name", "Location", "Site", "U-Height", "Device Name", "Position", "Device Type", "Status"}
	setHeaders(f, sheet, headers)

	rowIdx := 2
	for rows.Next() {
		var rackName, location, site, deviceName, position, deviceType, status string
		var uHeight int
		if err := rows.Scan(&rackName, &location, &site, &uHeight, &deviceName, &position, &deviceType, &status); err != nil {
			continue
		}
		setRow(f, sheet, rowIdx, []interface{}{rackName, location, site, uHeight, deviceName, position, deviceType, status})
		rowIdx++
	}

	xlsxResponse(w, f, fmt.Sprintf("dcim-racks-%s.xlsx", today()))
}

// ExportDevices handles GET /export/devices?tenantId=&status= — exports device data as xlsx.
func (h *ExportHandler) ExportDevices(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := r.URL.Query().Get("tenantId")
	statusFilter := r.URL.Query().Get("status")

	query := `
		SELECT d.name, dt.model, m.name,
		       COALESCE(rk.name, ''), COALESCE(d.position, ''), d.status,
		       COALESCE(d.serial_number, ''), COALESCE(d.asset_tag, ''), COALESCE(t.name, '')
		FROM devices d
		JOIN device_types dt ON d.device_type_id = dt.id
		JOIN manufacturers m ON dt.manufacturer_id = m.id
		LEFT JOIN racks rk ON d.rack_id = rk.id
		LEFT JOIN tenants t ON d.tenant_id = t.id
		WHERE d.deleted_at IS NULL`
	args := []interface{}{}
	argIdx := 1
	if tenantID != "" {
		query += fmt.Sprintf(" AND d.tenant_id = $%d", argIdx)
		args = append(args, tenantID)
		argIdx++
	}
	if statusFilter != "" {
		query += fmt.Sprintf(" AND d.status = $%d", argIdx)
		args = append(args, statusFilter)
	}
	query += " ORDER BY d.name"

	rows, err := h.DB.Pool.Query(ctx, query, args...)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	f := excelize.NewFile()
	sheet := "Devices"
	f.SetSheetName("Sheet1", sheet)
	headers := []string{"Name", "Type", "Manufacturer", "Rack", "Position", "Status", "Serial", "Asset Tag", "Tenant"}
	setHeaders(f, sheet, headers)

	rowIdx := 2
	for rows.Next() {
		var name, deviceType, manufacturer, rack, position, status, serial, assetTag, tenant string
		if err := rows.Scan(&name, &deviceType, &manufacturer, &rack, &position, &status, &serial, &assetTag, &tenant); err != nil {
			continue
		}
		setRow(f, sheet, rowIdx, []interface{}{name, deviceType, manufacturer, rack, position, status, serial, assetTag, tenant})
		rowIdx++
	}

	xlsxResponse(w, f, fmt.Sprintf("dcim-devices-%s.xlsx", today()))
}

// ExportCables handles GET /export/cables — exports cable data as xlsx.
func (h *ExportHandler) ExportCables(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := h.DB.Pool.Query(ctx, `
		SELECT c.label, c.cable_type, c.status,
		       c.termination_a_type, c.termination_a_id,
		       c.termination_b_type, c.termination_b_id,
		       COALESCE(c.length::text, ''), COALESCE(c.color, ''), COALESCE(t.name, '')
		FROM cables c
		LEFT JOIN tenants t ON c.tenant_id = t.id
		WHERE c.deleted_at IS NULL
		ORDER BY c.label
	`)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	f := excelize.NewFile()
	sheet := "Cables"
	f.SetSheetName("Sheet1", sheet)
	headers := []string{"Label", "Type", "Status", "Side A Type", "Side A ID", "Side B Type", "Side B ID", "Length", "Color", "Tenant"}
	setHeaders(f, sheet, headers)

	rowIdx := 2
	for rows.Next() {
		var label, cableType, status, aType, aID, bType, bID, length, color, tenant string
		if err := rows.Scan(&label, &cableType, &status, &aType, &aID, &bType, &bID, &length, &color, &tenant); err != nil {
			continue
		}
		setRow(f, sheet, rowIdx, []interface{}{label, cableType, status, aType, aID, bType, bID, length, color, tenant})
		rowIdx++
	}

	xlsxResponse(w, f, fmt.Sprintf("dcim-cables-%s.xlsx", today()))
}

// ExportAccess handles GET /export/access?siteId=&from=&to= — exports access log data as xlsx.
func (h *ExportHandler) ExportAccess(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	siteID := r.URL.Query().Get("siteId")
	fromStr := r.URL.Query().Get("from")
	toStr := r.URL.Query().Get("to")

	query := `
		SELECT al.personnel_name, COALESCE(al.company, ''), al.access_type, al.status, s.name,
		       al.check_in_at, al.actual_check_out_at,
		       COALESCE(al.purpose, ''), COALESCE(al.badge_number, '')
		FROM access_logs al
		JOIN sites s ON al.site_id = s.id
		WHERE al.deleted_at IS NULL`
	args := []interface{}{}
	argIdx := 1
	if siteID != "" {
		query += fmt.Sprintf(" AND al.site_id = $%d", argIdx)
		args = append(args, siteID)
		argIdx++
	}
	if fromStr != "" {
		if t, err := time.Parse(time.RFC3339, fromStr); err == nil {
			query += fmt.Sprintf(" AND al.check_in_at >= $%d", argIdx)
			args = append(args, t)
			argIdx++
		}
	}
	if toStr != "" {
		if t, err := time.Parse(time.RFC3339, toStr); err == nil {
			query += fmt.Sprintf(" AND al.check_in_at <= $%d", argIdx)
			args = append(args, t)
		}
	}
	query += " ORDER BY al.check_in_at DESC"

	rows, err := h.DB.Pool.Query(ctx, query, args...)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	f := excelize.NewFile()
	sheet := "Access Logs"
	f.SetSheetName("Sheet1", sheet)
	headers := []string{"Personnel", "Company", "Access Type", "Status", "Site", "Check In", "Check Out", "Purpose", "Badge"}
	setHeaders(f, sheet, headers)

	rowIdx := 2
	for rows.Next() {
		var personnel, company, accessType, status, site, purpose, badge string
		var checkIn time.Time
		var checkOut *time.Time
		if err := rows.Scan(&personnel, &company, &accessType, &status, &site, &checkIn, &checkOut, &purpose, &badge); err != nil {
			continue
		}
		checkInStr := checkIn.UTC().Format("2006-01-02 15:04:05")
		checkOutStr := ""
		if checkOut != nil {
			checkOutStr = checkOut.UTC().Format("2006-01-02 15:04:05")
		}
		setRow(f, sheet, rowIdx, []interface{}{personnel, company, accessType, status, site, checkInStr, checkOutStr, purpose, badge})
		rowIdx++
	}

	xlsxResponse(w, f, fmt.Sprintf("dcim-access-%s.xlsx", today()))
}

// ExportPower handles GET /export/power — exports power panels and feeds as a two-sheet xlsx.
func (h *ExportHandler) ExportPower(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	f := excelize.NewFile()
	f.SetSheetName("Sheet1", "Panels")
	f.NewSheet("Feeds")

	// Panels sheet
	panelHeaders := []string{"Panel Name", "Site", "Location", "Rated KW", "Voltage", "Phase"}
	setHeaders(f, "Panels", panelHeaders)

	panelRows, err := h.DB.Pool.Query(ctx, `
		SELECT pp.name, s.name, COALESCE(pp.location, ''), pp.rated_capacity_kw, pp.voltage_v, pp.phase_type
		FROM power_panels pp JOIN sites s ON pp.site_id = s.id
		WHERE pp.deleted_at IS NULL ORDER BY s.name, pp.name
	`)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	panelRowIdx := 2
	for panelRows.Next() {
		var name, site, location, phaseType string
		var ratedKw, voltageV float64
		if err := panelRows.Scan(&name, &site, &location, &ratedKw, &voltageV, &phaseType); err != nil {
			continue
		}
		setRow(f, "Panels", panelRowIdx, []interface{}{name, site, location, ratedKw, voltageV, phaseType})
		panelRowIdx++
	}
	panelRows.Close()

	// Feeds sheet
	feedHeaders := []string{"Feed Name", "Panel", "Rack", "Feed Type", "Max Amps", "Rated KW"}
	setHeaders(f, "Feeds", feedHeaders)

	feedRows, err := h.DB.Pool.Query(ctx, `
		SELECT pf.name, pp.name, COALESCE(rk.name, ''), pf.feed_type, pf.max_amps, pf.rated_kw
		FROM power_feeds pf
		JOIN power_panels pp ON pf.panel_id = pp.id
		LEFT JOIN racks rk ON pf.rack_id = rk.id
		WHERE pf.deleted_at IS NULL ORDER BY pp.name, pf.name
	`)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	feedRowIdx := 2
	for feedRows.Next() {
		var name, panel, rack, feedType string
		var maxAmps, ratedKw float64
		if err := feedRows.Scan(&name, &panel, &rack, &feedType, &maxAmps, &ratedKw); err != nil {
			continue
		}
		setRow(f, "Feeds", feedRowIdx, []interface{}{name, panel, rack, feedType, maxAmps, ratedKw})
		feedRowIdx++
	}
	feedRows.Close()

	xlsxResponse(w, f, fmt.Sprintf("dcim-power-%s.xlsx", today()))
}

// --- XML export type definitions ---

type xmlDCIM struct {
	XMLName xml.Name    `xml:"dcim"`
	Sites   []xmlSite   `xml:"site,omitempty"`
	Devices []xmlDevice `xml:"device,omitempty"`
}

type xmlSite struct {
	ID        string        `xml:"id,attr"`
	Name      string        `xml:"name,attr"`
	Locations []xmlLocation `xml:"location"`
}

type xmlLocation struct {
	ID    string    `xml:"id,attr"`
	Name  string    `xml:"name,attr"`
	Racks []xmlRack `xml:"rack"`
}

type xmlRack struct {
	ID      string         `xml:"id,attr"`
	Name    string         `xml:"name,attr"`
	UHeight int            `xml:"uHeight,attr"`
	Devices []xmlRackDevice `xml:"device"`
}

type xmlRackDevice struct {
	Position   string        `xml:"position,attr"`
	Height     int           `xml:"height,attr"`
	Name       string        `xml:"name,attr"`
	Type       string        `xml:"type,attr"`
	Status     string        `xml:"status,attr"`
	Interfaces xmlInterfaces `xml:"interfaces"`
}

type xmlInterfaces struct {
	Items []xmlInterface `xml:"interface"`
}

type xmlInterface struct {
	Name string `xml:"name,attr"`
	Type string `xml:"type,attr"`
}

type xmlDevice struct {
	ID           string           `xml:"id,attr"`
	Name         string           `xml:"name,attr"`
	Status       string           `xml:"status,attr"`
	SerialNumber string           `xml:"serialNumber,attr"`
	AssetTag     string           `xml:"assetTag,attr"`
	Type         xmlDeviceType    `xml:"type"`
	Rack         *xmlDeviceRack   `xml:"rack,omitempty"`
	Tenant       *xmlDeviceTenant `xml:"tenant,omitempty"`
	Interfaces   xmlInterfaces    `xml:"interfaces"`
}

type xmlDeviceType struct {
	Model        string `xml:"model,attr"`
	Manufacturer string `xml:"manufacturer,attr"`
	UHeight      int    `xml:"uHeight,attr"`
}

type xmlDeviceRack struct {
	Name     string `xml:"name,attr"`
	Position string `xml:"position,attr"`
}

type xmlDeviceTenant struct {
	Name string `xml:"name,attr"`
}

// ExportXMLRacks handles GET /export/xml/racks — exports site/rack/device hierarchy as XML.
func (h *ExportHandler) ExportXMLRacks(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Fetch sites with nested locations, racks, devices, interfaces
	rows, err := h.DB.Pool.Query(ctx, `
		SELECT s.id, s.name,
		       l.id, l.name,
		       rk.id, rk.name, rk.u_height,
		       d.id, d.name, d.status, d.position,
		       dt.u_height, dt.model,
		       i.name, i.interface_type
		FROM sites s
		LEFT JOIN locations l ON l.site_id = s.id AND l.deleted_at IS NULL
		LEFT JOIN racks rk ON rk.location_id = l.id AND rk.deleted_at IS NULL
		LEFT JOIN devices d ON d.rack_id = rk.id AND d.deleted_at IS NULL
		LEFT JOIN device_types dt ON d.device_type_id = dt.id
		LEFT JOIN interfaces i ON i.device_id = d.id AND i.deleted_at IS NULL
		WHERE s.deleted_at IS NULL
		ORDER BY s.id, l.id, rk.id, d.id, i.name
	`)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Use ordered maps to preserve insertion order.
	// Types declared leaf-first to avoid forward reference errors.
	type rackEntry struct {
		rack    xmlRack
		devices map[string]*xmlRackDevice
		devOrder []string
	}
	type locEntry struct {
		loc       xmlLocation
		racks     map[string]*rackEntry
		rackOrder []string
	}
	type siteEntry struct {
		site     xmlSite
		locs     map[string]*locEntry
		locOrder []string
	}

	sites := map[string]*siteEntry{}
	siteOrder := []string{}

	for rows.Next() {
		var siteID, siteName string
		var locID, locName, rackID, rackName *string
		var rackUH *int
		var devID, devName, devStatus, devPos *string
		var dtUH *int
		var dtModel *string
		var ifName, ifType *string

		if err := rows.Scan(
			&siteID, &siteName,
			&locID, &locName,
			&rackID, &rackName, &rackUH,
			&devID, &devName, &devStatus, &devPos,
			&dtUH, &dtModel,
			&ifName, &ifType,
		); err != nil {
			continue
		}

		if _, ok := sites[siteID]; !ok {
			sites[siteID] = &siteEntry{
				site:  xmlSite{ID: siteID, Name: siteName},
				locs:  map[string]*locEntry{},
			}
			siteOrder = append(siteOrder, siteID)
		}
		se := sites[siteID]

		if locID == nil {
			continue
		}
		if _, ok := se.locs[*locID]; !ok {
			se.locs[*locID] = &locEntry{
				loc:   xmlLocation{ID: *locID, Name: *locName},
				racks: map[string]*rackEntry{},
			}
			se.locOrder = append(se.locOrder, *locID)
		}
		le := se.locs[*locID]

		if rackID == nil {
			continue
		}
		if _, ok := le.racks[*rackID]; !ok {
			le.racks[*rackID] = &rackEntry{
				rack:    xmlRack{ID: *rackID, Name: *rackName, UHeight: derefInt(rackUH)},
				devices: map[string]*xmlRackDevice{},
			}
			le.rackOrder = append(le.rackOrder, *rackID)
		}
		re := le.racks[*rackID]

		if devID == nil {
			continue
		}
		if _, ok := re.devices[*devID]; !ok {
			re.devices[*devID] = &xmlRackDevice{
				Position: derefStr(devPos),
				Height:   derefInt(dtUH),
				Name:     *devName,
				Type:     derefStr(dtModel),
				Status:   *devStatus,
			}
			re.devOrder = append(re.devOrder, *devID)
		}
		dev := re.devices[*devID]

		if ifName != nil {
			dev.Interfaces.Items = append(dev.Interfaces.Items, xmlInterface{Name: *ifName, Type: *ifType})
		}
	}

	// Build final nested structure
	var xmlSites []xmlSite
	for _, siteID := range siteOrder {
		se := sites[siteID]
		var xmlLocs []xmlLocation
		for _, locID := range se.locOrder {
			le := se.locs[locID]
			var xmlRacks []xmlRack
			for _, rackID := range le.rackOrder {
				re := le.racks[rackID]
				var xmlDevs []xmlRackDevice
				for _, devID := range re.devOrder {
					xmlDevs = append(xmlDevs, *re.devices[devID])
				}
				re.rack.Devices = xmlDevs
				xmlRacks = append(xmlRacks, re.rack)
			}
			le.loc.Racks = xmlRacks
			xmlLocs = append(xmlLocs, le.loc)
		}
		se.site.Locations = xmlLocs
		xmlSites = append(xmlSites, se.site)
	}

	out, err := xml.MarshalIndent(xmlDCIM{Sites: xmlSites}, "", "  ")
	if err != nil {
		http.Error(w, "xml error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/xml")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="dcim-racks-%s.xml"`, today()))
	w.Write([]byte(xml.Header))
	w.Write(out)
}

// ExportXMLDevices handles GET /export/xml/devices — exports device data as XML.
func (h *ExportHandler) ExportXMLDevices(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	rows, err := h.DB.Pool.Query(ctx, `
		SELECT d.id, d.name, d.status, COALESCE(d.serial_number, ''), COALESCE(d.asset_tag, ''),
		       dt.model, m.name, dt.u_height,
		       rk.name, d.position,
		       t.name,
		       i.name, i.interface_type
		FROM devices d
		JOIN device_types dt ON d.device_type_id = dt.id
		JOIN manufacturers m ON dt.manufacturer_id = m.id
		LEFT JOIN racks rk ON d.rack_id = rk.id
		LEFT JOIN tenants t ON d.tenant_id = t.id
		LEFT JOIN interfaces i ON i.device_id = d.id AND i.deleted_at IS NULL
		WHERE d.deleted_at IS NULL
		ORDER BY d.id, i.name
	`)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	deviceMap := map[string]*xmlDevice{}
	deviceOrder := []string{}

	for rows.Next() {
		var devID, devName, devStatus, devSerial, devAsset string
		var dtModel, mName string
		var dtUH int
		var rackName, devPos *string
		var tenantName *string
		var ifName, ifType *string

		if err := rows.Scan(
			&devID, &devName, &devStatus, &devSerial, &devAsset,
			&dtModel, &mName, &dtUH,
			&rackName, &devPos,
			&tenantName,
			&ifName, &ifType,
		); err != nil {
			continue
		}

		if _, ok := deviceMap[devID]; !ok {
			dev := &xmlDevice{
				ID:           devID,
				Name:         devName,
				Status:       devStatus,
				SerialNumber: devSerial,
				AssetTag:     devAsset,
				Type: xmlDeviceType{
					Model:        dtModel,
					Manufacturer: mName,
					UHeight:      dtUH,
				},
			}
			if rackName != nil {
				dev.Rack = &xmlDeviceRack{Name: *rackName, Position: derefStr(devPos)}
			}
			if tenantName != nil {
				dev.Tenant = &xmlDeviceTenant{Name: *tenantName}
			}
			deviceMap[devID] = dev
			deviceOrder = append(deviceOrder, devID)
		}

		if ifName != nil {
			deviceMap[devID].Interfaces.Items = append(
				deviceMap[devID].Interfaces.Items,
				xmlInterface{Name: *ifName, Type: *ifType},
			)
		}
	}

	var devices []xmlDevice
	for _, id := range deviceOrder {
		devices = append(devices, *deviceMap[id])
	}

	out, err := xml.MarshalIndent(xmlDCIM{Devices: devices}, "", "  ")
	if err != nil {
		http.Error(w, "xml error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/xml")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="dcim-devices-%s.xml"`, today()))
	w.Write([]byte(xml.Header))
	w.Write(out)
}
