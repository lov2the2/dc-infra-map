'use client'

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
    // Controlled props — state owned by FloorPlanClient so it persists across tab switches
    gridCols: number;
    gridRows: number;
    cells: LocationFloorCell[];
    racks: RackPosition[];
    onRackPositionUpdate?: (rackId: string, posX: number, posY: number) => Promise<void>;
    onCellsChange?: (updater: (prev: LocationFloorCell[]) => LocationFloorCell[]) => void;
    onGridSizeChange?: (cols: number, rows: number) => void;
}

export function FloorSpaceManager({
    locationId,
    gridCols,
    gridRows,
    cells,
    racks,
    onRackPositionUpdate,
    onCellsChange,
    onGridSizeChange,
}: FloorSpaceManagerProps) {
    const router = useRouter();

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState<LocationFloorCell | null>(null);
    const [createPosition, setCreatePosition] = useState<{ posX: number; posY: number } | null>(null);

    const unplacedRacks = useMemo(
        () => racks.filter((r) => r.posX === null || r.posY === null),
        [racks],
    );

    const handleConfigSaved = useCallback((cols: number, rows: number) => {
        onGridSizeChange?.(cols, rows);
    }, [onGridSizeChange]);

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

    const handleRackClick = useCallback((rack: RackPosition) => {
        router.push(`/racks/${rack.id}`);
    }, [router]);

    const handleCellSaved = useCallback((savedCell: LocationFloorCell) => {
        onCellsChange?.((prev) => {
            const idx = prev.findIndex((c) => c.id === savedCell.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = savedCell;
                return next;
            }
            return [...prev, savedCell];
        });
    }, [onCellsChange]);

    const handleCellDeleted = useCallback((cellId: string) => {
        onCellsChange?.((prev) => prev.filter((c) => c.id !== cellId));
    }, [onCellsChange]);

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
                onRackClick={handleRackClick}
                onRackDrop={onRackPositionUpdate}
            />

            <FloorSpaceCellDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                locationId={locationId}
                cell={selectedCell}
                createPosition={createPosition}
                onSaved={handleCellSaved}
                onDeleted={handleCellDeleted}
                availableRacks={unplacedRacks}
                onRackPositionUpdate={onRackPositionUpdate}
            />
        </div>
    );
}
