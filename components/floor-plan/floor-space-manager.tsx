'use client'

import { useState, useCallback } from "react";
import { FloorSpaceConfigForm } from "./floor-space-config-form";
import { FloorSpaceGrid } from "./floor-space-grid";
import { FloorSpaceCellDialog } from "./floor-space-cell-dialog";
import type { LocationFloorCell } from "@/types/entities";

interface RackPosition {
    id: string;
    name: string;
    posX: number | null;
    posY: number | null;
}

interface FloorSpaceManagerProps {
    locationId: string;
    initialGridCols: number;
    initialGridRows: number;
    initialCells: LocationFloorCell[];
    racks: RackPosition[];
}

export function FloorSpaceManager({
    locationId,
    initialGridCols,
    initialGridRows,
    initialCells,
    racks,
}: FloorSpaceManagerProps) {
    const [gridCols, setGridCols] = useState(initialGridCols);
    const [gridRows, setGridRows] = useState(initialGridRows);
    const [cells, setCells] = useState<LocationFloorCell[]>(initialCells);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState<LocationFloorCell | null>(null);
    const [createPosition, setCreatePosition] = useState<{ posX: number; posY: number } | null>(null);

    const handleConfigSaved = useCallback((cols: number, rows: number) => {
        setGridCols(cols);
        setGridRows(rows);
    }, []);

    const handleCellClick = useCallback((posX: number, posY: number, cell: LocationFloorCell | null) => {
        if (cell) {
            setSelectedCell(cell);
            setCreatePosition(null);
        } else {
            setSelectedCell(null);
            setCreatePosition({ posX, posY });
        }
        setDialogOpen(true);
    }, []);

    const handleCellSaved = useCallback((savedCell: LocationFloorCell) => {
        setCells((prev) => {
            const idx = prev.findIndex((c) => c.id === savedCell.id);
            if (idx >= 0) {
                // Update existing
                const next = [...prev];
                next[idx] = savedCell;
                return next;
            }
            // Add new
            return [...prev, savedCell];
        });
    }, []);

    const handleCellDeleted = useCallback((cellId: string) => {
        setCells((prev) => prev.filter((c) => c.id !== cellId));
    }, []);

    return (
        <div className="space-y-6">
            <FloorSpaceConfigForm
                locationId={locationId}
                initialGridCols={gridCols}
                initialGridRows={gridRows}
                onConfigSaved={handleConfigSaved}
            />

            <FloorSpaceGrid
                gridCols={gridCols}
                gridRows={gridRows}
                cells={cells}
                racks={racks}
                onCellClick={handleCellClick}
            />

            <FloorSpaceCellDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                locationId={locationId}
                cell={selectedCell}
                createPosition={createPosition}
                onSaved={handleCellSaved}
                onDeleted={handleCellDeleted}
            />
        </div>
    );
}
