package handler

import (
	"context"
	"net/http"

	"github.com/dcim/go-services/internal/shared/db"
	"github.com/dcim/go-services/internal/shared/response"
)

type CableTraceHandler struct{ DB *db.DB }

type traceHop struct {
	CableID     string `json:"cableId"`
	CableLabel  string `json:"cableLabel"`
	AType       string `json:"aType"`
	AID         string `json:"aId"`
	ADeviceName string `json:"aDeviceName,omitempty"`
	APortName   string `json:"aPortName,omitempty"`
	BType       string `json:"bType"`
	BID         string `json:"bId"`
	BDeviceName string `json:"bDeviceName,omitempty"`
	BPortName   string `json:"bPortName,omitempty"`
}

// Trace handles GET /cables/trace/{id} — traces a cable path through patch panels.
func (h *CableTraceHandler) Trace(w http.ResponseWriter, r *http.Request) {
	startCableID := r.PathValue("id")
	ctx := r.Context()

	hops := []traceHop{}
	visited := map[string]bool{}
	currentCableID := startCableID

	for i := 0; i < 20; i++ {
		if visited[currentCableID] {
			break
		}
		visited[currentCableID] = true

		var hop traceHop
		err := h.DB.Pool.QueryRow(ctx,
			`SELECT id, label, termination_a_type, termination_a_id, termination_b_type, termination_b_id
			 FROM cables WHERE id = $1 AND deleted_at IS NULL`, currentCableID).Scan(
			&hop.CableID, &hop.CableLabel, &hop.AType, &hop.AID, &hop.BType, &hop.BID)
		if err != nil {
			if len(hops) == 0 {
				response.NotFound(w, "Cable")
				return
			}
			break
		}

		hop.ADeviceName, hop.APortName = h.resolveTermination(ctx, hop.AType, hop.AID)
		hop.BDeviceName, hop.BPortName = h.resolveTermination(ctx, hop.BType, hop.BID)

		hops = append(hops, hop)

		nextCableID := ""
		if hop.BType == "frontPort" {
			var rearPortID string
			err := h.DB.Pool.QueryRow(ctx,
				`SELECT rear_port_id FROM front_ports WHERE id = $1`, hop.BID).Scan(&rearPortID)
			if err == nil {
				_ = h.DB.Pool.QueryRow(ctx,
					`SELECT id FROM cables WHERE deleted_at IS NULL AND (
						(termination_a_type = 'rearPort' AND termination_a_id = $1) OR
						(termination_b_type = 'rearPort' AND termination_b_id = $1)
					) AND id != $2`, rearPortID, currentCableID).Scan(&nextCableID)
			}
		} else if hop.BType == "rearPort" {
			var frontPortID string
			err := h.DB.Pool.QueryRow(ctx,
				`SELECT id FROM front_ports WHERE rear_port_id = $1 LIMIT 1`, hop.BID).Scan(&frontPortID)
			if err == nil {
				_ = h.DB.Pool.QueryRow(ctx,
					`SELECT id FROM cables WHERE deleted_at IS NULL AND (
						(termination_a_type = 'frontPort' AND termination_a_id = $1) OR
						(termination_b_type = 'frontPort' AND termination_b_id = $1)
					) AND id != $2`, frontPortID, currentCableID).Scan(&nextCableID)
			}
		}

		if nextCableID == "" {
			break
		}
		currentCableID = nextCableID
	}

	response.OK(w, hops)
}

func (h *CableTraceHandler) resolveTermination(ctx context.Context, termType, termID string) (deviceName, portName string) {
	switch termType {
	case "interface":
		_ = h.DB.Pool.QueryRow(ctx, `SELECT d.name, i.name FROM interfaces i JOIN devices d ON i.device_id = d.id WHERE i.id = $1`, termID).Scan(&deviceName, &portName)
	case "frontPort":
		_ = h.DB.Pool.QueryRow(ctx, `SELECT d.name, fp.name FROM front_ports fp JOIN devices d ON fp.device_id = d.id WHERE fp.id = $1`, termID).Scan(&deviceName, &portName)
	case "rearPort":
		_ = h.DB.Pool.QueryRow(ctx, `SELECT d.name, rp.name FROM rear_ports rp JOIN devices d ON rp.device_id = d.id WHERE rp.id = $1`, termID).Scan(&deviceName, &portName)
	case "consolePort":
		_ = h.DB.Pool.QueryRow(ctx, `SELECT d.name, cp.name FROM console_ports cp JOIN devices d ON cp.device_id = d.id WHERE cp.id = $1`, termID).Scan(&deviceName, &portName)
	}
	return
}
