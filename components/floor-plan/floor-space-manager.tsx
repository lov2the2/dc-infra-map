'use client'

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FloorSpaceConfigForm } from "./floor-space-config-form";
import { FloorSpaceGrid } from "./floor-space-grid";
import { FloorSpaceCellDialog } from "./floor-space-cell-dialog";
import { Button } from "@/components/ui/button";
import { MousePointer2, Loader2 } from "lucide-react";
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

    // Range selection state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [bulkSaving, setBulkSaving] = useState(false);

    const unplacedRacks = useMemo(
        () => racks.filter((r) => r.posX === null || r.posY === null),
        [racks],
    );

    const handleConfigSaved = useCallback((cols: number, rows: number) => {
        onGridSizeChange?.(cols, rows);
    }, [onGridSizeChange]);

    const handleCellClick = useCallback((posX: number, posY: number, cell: LocationFloorCell | null) => {
        // In selection mode, the grid handles selection internally — do nothing here
        if (selectionMode) return;

        if (cell) {
            setSelectedCell(cell);
            setCreatePosition(null);
        } else {
            setSelectedCell(null);
            setCreatePosition({ posX, posY });
        }
        setDialogOpen(true);
    }, [selectionMode]);

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

    const handleBulkUnavailable = useCallback(async (markAsUnavailable: boolean) => {
        if (selectedKeys.size === 0) return;
        setBulkSaving(true);

        // Build a lookup map: "posX,posY" -> cell
        const cellMap = new Map<string, LocationFloorCell>();
        for (const cell of cells) {
            cellMap.set(`${cell.posX},${cell.posY}`, cell);
        }

        const promises: Promise<Response>[] = [];

        for (const key of selectedKeys) {
            const [xStr, yStr] = key.split(",");
            const posX = parseInt(xStr, 10);
            const posY = parseInt(yStr, 10);
            const existingCell = cellMap.get(key) ?? null;

            if (existingCell) {
                // PATCH existing cell
                promises.push(
                    fetch(`/api/floor-cells/${locationId}/cells/${existingCell.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isUnavailable: markAsUnavailable }),
                    }),
                );
            } else if (markAsUnavailable) {
                // POST new cell only when marking unavailable; empty cell already means available
                promises.push(
                    fetch(`/api/floor-cells/${locationId}/cells`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ posX, posY, isUnavailable: true }),
                    }),
                );
            }
        }

        const results = await Promise.allSettled(promises);

        // Collect updated/created cells from successful responses
        const updatedCells: LocationFloorCell[] = [];
        let anyFailed = false;

        for (const result of results) {
            if (result.status === "fulfilled" && result.value.ok) {
                try {
                    const data = await result.value.json();
                    // API may return { data: cell } or just the cell directly
                    const cell: LocationFloorCell = data.data ?? data;
                    updatedCells.push(cell);
                } catch {
                    // Response body consumed or not JSON — ignore
                }
            } else {
                anyFailed = true;
            }
        }

        // Update local cells state
        if (updatedCells.length > 0) {
            onCellsChange?.((prev) => {
                const next = [...prev];
                for (const updated of updatedCells) {
                    const idx = next.findIndex((c) => c.id === updated.id);
                    if (idx >= 0) {
                        next[idx] = updated;
                    } else {
                        next.push(updated);
                    }
                }
                return next;
            });
        }

        if (anyFailed) {
            console.error("Some bulk unavailable operations failed");
        }

        // Clear selection and exit selection mode
        setSelectedKeys(new Set());
        setSelectionMode(false);
        setBulkSaving(false);
    }, [selectedKeys, cells, locationId, onCellsChange]);

    return (
        <div className="space-y-6">
            <FloorSpaceConfigForm
                locationId={locationId}
                initialGridCols={gridCols}
                initialGridRows={gridRows}
                onConfigSaved={handleConfigSaved}
            />

            {/* Selection mode toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <Button
                    variant={selectionMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                        setSelectionMode(!selectionMode);
                        setSelectedKeys(new Set());
                    }}
                >
                    <MousePointer2 className="h-4 w-4 mr-1.5" />
                    {selectionMode ? "Cancel Selection" : "Select Range"}
                </Button>

                {selectionMode && selectedKeys.size > 0 && (
                    <>
                        <span className="text-sm text-muted-foreground">{selectedKeys.size} cells selected</span>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBulkUnavailable(true)}
                            disabled={bulkSaving}
                        >
                            {bulkSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                            Mark Unavailable
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBulkUnavailable(false)}
                            disabled={bulkSaving}
                        >
                            {bulkSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                            Remove Unavailable
                        </Button>
                    </>
                )}
            </div>

            <FloorSpaceGrid
                gridCols={gridCols}
                gridRows={gridRows}
                cells={cells}
                racks={racks}
                onCellClick={handleCellClick}
                onRackClick={handleRackClick}
                onRackDrop={onRackPositionUpdate}
                selectionMode={selectionMode}
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
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
