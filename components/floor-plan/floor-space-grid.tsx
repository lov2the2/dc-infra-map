'use client'

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { LocationFloorCell } from "@/types/entities";

interface RackPosition {
    id: string;
    name: string;
    posX: number | null;
    posY: number | null;
}

interface FloorSpaceGridProps {
    gridCols: number;
    gridRows: number;
    cells: LocationFloorCell[];
    racks?: RackPosition[];
    onCellClick: (posX: number, posY: number, cell: LocationFloorCell | null) => void;
}

export function FloorSpaceGrid({
    gridCols,
    gridRows,
    cells,
    racks = [],
    onCellClick,
}: FloorSpaceGridProps) {
    // Build a lookup map: "posX,posY" -> cell
    const cellMap = useMemo(() => {
        const map = new Map<string, LocationFloorCell>();
        for (const cell of cells) {
            map.set(`${cell.posX},${cell.posY}`, cell);
        }
        return map;
    }, [cells]);

    // Build a lookup map: "posX,posY" -> rack
    const rackMap = useMemo(() => {
        const map = new Map<string, RackPosition>();
        for (const rack of racks) {
            if (rack.posX !== null && rack.posY !== null) {
                map.set(`${rack.posX},${rack.posY}`, rack);
            }
        }
        return map;
    }, [racks]);

    const totalCells = gridCols * gridRows;

    if (totalCells > 2500) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Grid is too large to display (max 50x50). Please reduce dimensions.
            </div>
        );
    }

    return (
        <div className="overflow-auto">
            <div
                className="grid gap-1 w-fit"
                style={{
                    gridTemplateColumns: `repeat(${gridCols}, minmax(40px, 1fr))`,
                }}
                role="grid"
                aria-label="Floor space grid"
            >
                {Array.from({ length: gridRows }, (_, rowIdx) =>
                    Array.from({ length: gridCols }, (_, colIdx) => {
                        const cell = cellMap.get(`${colIdx},${rowIdx}`) ?? null;
                        const rack = rackMap.get(`${colIdx},${rowIdx}`) ?? null;
                        const isEmpty = cell === null && rack === null;
                        const isUnavailable = cell?.isUnavailable === true;
                        const label = rack?.name ?? cell?.name ?? `C${colIdx + 1}R${rowIdx + 1}`;

                        return (
                            <button
                                key={`${colIdx}-${rowIdx}`}
                                role="gridcell"
                                aria-label={
                                    rack
                                        ? `Rack: ${rack.name} at column ${colIdx + 1}, row ${rowIdx + 1}`
                                        : isEmpty
                                          ? `Empty cell at column ${colIdx + 1}, row ${rowIdx + 1}`
                                          : `${label} — ${isUnavailable ? "unavailable" : "available"}`
                                }
                                onClick={() => onCellClick(colIdx, rowIdx, cell)}
                                className={cn(
                                    "h-10 w-10 rounded text-xs font-medium border transition-colors",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    rack && [
                                        "bg-blue-100 border-blue-400",
                                        "hover:bg-blue-200",
                                        "text-blue-800",
                                        "dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-300",
                                        "dark:hover:bg-blue-900/60",
                                    ],
                                    !rack && isEmpty && [
                                        "bg-muted border-border",
                                        "hover:bg-muted/80 hover:border-muted-foreground/40",
                                        "text-muted-foreground",
                                    ],
                                    !rack && !isEmpty && !isUnavailable && [
                                        "bg-green-100 border-green-400",
                                        "hover:bg-green-200",
                                        "text-green-800",
                                        "dark:bg-green-900/40 dark:border-green-600 dark:text-green-300",
                                        "dark:hover:bg-green-900/60",
                                    ],
                                    !rack && !isEmpty && isUnavailable && [
                                        "bg-red-100 border-red-400",
                                        "hover:bg-red-200",
                                        "text-red-800",
                                        "dark:bg-red-900/40 dark:border-red-600 dark:text-red-300",
                                        "dark:hover:bg-red-900/60",
                                    ],
                                )}
                                title={
                                    rack
                                        ? `Rack: ${rack.name} (Col ${colIdx + 1}, Row ${rowIdx + 1})`
                                        : isEmpty
                                          ? `Click to create floor space at Col ${colIdx + 1}, Row ${rowIdx + 1}`
                                          : `${label}${isUnavailable ? " (unavailable)" : ""}`
                                }
                            >
                                <span className="truncate block px-0.5 leading-tight">
                                    {isEmpty ? "+" : label}
                                </span>
                            </button>
                        );
                    }),
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3.5 w-3.5 rounded border border-border bg-muted" />
                    Empty (click to create)
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3.5 w-3.5 rounded border border-green-400 bg-green-100 dark:bg-green-900/40 dark:border-green-600" />
                    Available
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3.5 w-3.5 rounded border border-red-400 bg-red-100 dark:bg-red-900/40 dark:border-red-600" />
                    Unavailable
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3.5 w-3.5 rounded border border-blue-400 bg-blue-100 dark:bg-blue-900/40 dark:border-blue-500" />
                    Rack
                </div>
            </div>
        </div>
    );
}
