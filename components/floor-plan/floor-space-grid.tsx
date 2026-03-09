'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
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
    onRackClick?: (rack: RackPosition) => void;
    onRackDrop?: (rackId: string, posX: number, posY: number) => Promise<void>;
    selectionMode?: boolean;
    selectedKeys?: Set<string>;
    onSelectionChange?: (keys: Set<string>) => void;
}

export function FloorSpaceGrid({
    gridCols,
    gridRows,
    cells,
    racks = [],
    onCellClick,
    onRackClick,
    onRackDrop,
    selectionMode = false,
    selectedKeys = new Set(),
    onSelectionChange,
}: FloorSpaceGridProps) {
    const [draggingRackId, setDraggingRackId] = useState<string | null>(null);
    const [dragOverKey, setDragOverKey] = useState<string | null>(null);
    const [savingRackId, setSavingRackId] = useState<string | null>(null);

    // Range selection state
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ posX: number; posY: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ posX: number; posY: number } | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

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

    // Compute current rectangular selection keys while dragging
    const activeSelectionKeys = useMemo(() => {
        if (!isSelecting || !selectionStart || !selectionEnd) return null;
        const minX = Math.min(selectionStart.posX, selectionEnd.posX);
        const maxX = Math.max(selectionStart.posX, selectionEnd.posX);
        const minY = Math.min(selectionStart.posY, selectionEnd.posY);
        const maxY = Math.max(selectionStart.posY, selectionEnd.posY);
        const keys = new Set<string>();
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                keys.add(`${x},${y}`);
            }
        }
        return keys;
    }, [isSelecting, selectionStart, selectionEnd]);

    // Handle global mouseup to finalize selection even if released outside grid
    useEffect(() => {
        if (!selectionMode) return;
        const handleMouseUp = () => {
            if (isSelecting && selectionStart && selectionEnd) {
                const minX = Math.min(selectionStart.posX, selectionEnd.posX);
                const maxX = Math.max(selectionStart.posX, selectionEnd.posX);
                const minY = Math.min(selectionStart.posY, selectionEnd.posY);
                const maxY = Math.max(selectionStart.posY, selectionEnd.posY);
                const keys = new Set<string>();
                for (let y = minY; y <= maxY; y++) {
                    for (let x = minX; x <= maxX; x++) {
                        keys.add(`${x},${y}`);
                    }
                }
                onSelectionChange?.(keys);
            }
            setIsSelecting(false);
            setSelectionStart(null);
            setSelectionEnd(null);
        };
        document.addEventListener("mouseup", handleMouseUp);
        return () => document.removeEventListener("mouseup", handleMouseUp);
    }, [selectionMode, isSelecting, selectionStart, selectionEnd, onSelectionChange]);

    const handleCellMouseDown = useCallback((posX: number, posY: number) => {
        if (!selectionMode) return;
        setIsSelecting(true);
        setSelectionStart({ posX, posY });
        setSelectionEnd({ posX, posY });
    }, [selectionMode]);

    const handleCellMouseEnter = useCallback((posX: number, posY: number) => {
        if (!selectionMode || !isSelecting) return;
        setSelectionEnd({ posX, posY });
    }, [selectionMode, isSelecting]);

    const handleRackDragStart = useCallback((e: React.DragEvent<HTMLButtonElement>, rack: RackPosition) => {
        setDraggingRackId(rack.id);
        e.dataTransfer.setData("text/plain", rack.id);
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggingRackId(null);
        setDragOverKey(null);
    }, []);

    const handleCellDragOver = useCallback((e: React.DragEvent<HTMLButtonElement>, key: string, targetRack: RackPosition | null) => {
        if (!draggingRackId || targetRack) return; // Cannot drop on occupied rack cell
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverKey(key);
    }, [draggingRackId]);

    const handleCellDragLeave = useCallback(() => {
        setDragOverKey(null);
    }, []);

    const handleCellDrop = useCallback(async (e: React.DragEvent<HTMLButtonElement>, posX: number, posY: number, targetRack: RackPosition | null) => {
        e.preventDefault();
        if (targetRack) return; // Cannot drop on occupied rack cell
        const rackId = e.dataTransfer.getData("text/plain");
        if (!rackId || !onRackDrop) return;
        setDragOverKey(null);
        setDraggingRackId(null);
        setSavingRackId(rackId);
        try {
            await onRackDrop(rackId, posX, posY);
        } finally {
            setSavingRackId(null);
        }
    }, [onRackDrop]);

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
                ref={gridRef}
                className={cn("grid gap-1 w-fit", selectionMode && "select-none")}
                style={{
                    gridTemplateColumns: `repeat(${gridCols}, minmax(40px, 1fr))`,
                }}
                role="grid"
                aria-label="Floor space grid"
            >
                {Array.from({ length: gridRows }, (_, rowIdx) =>
                    Array.from({ length: gridCols }, (_, colIdx) => {
                        const key = `${colIdx},${rowIdx}`;
                        const cell = cellMap.get(key) ?? null;
                        const rack = rackMap.get(key) ?? null;
                        const isEmpty = cell === null && rack === null;
                        const isUnavailable = cell?.isUnavailable === true;
                        const isDragOver = dragOverKey === key;
                        const isSaving = rack !== null && savingRackId === rack.id;
                        const label = rack?.name ?? cell?.name ?? `C${colIdx + 1}R${rowIdx + 1}`;
                        const isSelected =
                            selectionMode &&
                            (activeSelectionKeys?.has(key) ?? selectedKeys.has(key));

                        if (rack) {
                            // Rack cell: draggable, click navigates to rack
                            return (
                                <button
                                    key={`${colIdx}-${rowIdx}`}
                                    role="gridcell"
                                    draggable={!selectionMode && !!onRackDrop}
                                    onDragStart={!selectionMode ? (e) => handleRackDragStart(e, rack) : undefined}
                                    onDragEnd={!selectionMode ? handleDragEnd : undefined}
                                    onClick={!selectionMode ? () => onRackClick?.(rack) : undefined}
                                    onMouseDown={() => handleCellMouseDown(colIdx, rowIdx)}
                                    onMouseEnter={() => handleCellMouseEnter(colIdx, rowIdx)}
                                    className={cn(
                                        "h-10 w-10 rounded text-xs font-medium border transition-colors",
                                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        "bg-blue-100 border-blue-400 text-blue-800",
                                        "dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-300",
                                        !selectionMode && (
                                            draggingRackId === rack.id
                                                ? "opacity-40 cursor-grabbing"
                                                : onRackDrop
                                                  ? "hover:bg-blue-200 dark:hover:bg-blue-900/60 cursor-grab"
                                                  : "hover:bg-blue-200 dark:hover:bg-blue-900/60"
                                        ),
                                        selectionMode && "cursor-crosshair hover:bg-blue-200 dark:hover:bg-blue-900/60",
                                        isSelected && "ring-2 ring-indigo-500 ring-offset-1",
                                    )}
                                    title={
                                        selectionMode
                                            ? `Rack: ${rack.name} (Col ${colIdx + 1}, Row ${rowIdx + 1})`
                                            : `Rack: ${rack.name} (Col ${colIdx + 1}, Row ${rowIdx + 1})${onRackDrop ? " — drag to move" : ""}`
                                    }
                                    aria-label={`Rack: ${rack.name} at column ${colIdx + 1}, row ${rowIdx + 1}`}
                                >
                                    <span className="truncate block px-0.5 leading-tight">
                                        {isSaving ? "⟳" : label}
                                    </span>
                                </button>
                            );
                        }

                        // Empty or floor-space cell: drop target + click to configure
                        return (
                            <button
                                key={`${colIdx}-${rowIdx}`}
                                role="gridcell"
                                aria-label={
                                    isEmpty
                                        ? `Empty cell at column ${colIdx + 1}, row ${rowIdx + 1}`
                                        : `${label} — ${isUnavailable ? "unavailable" : "available"}`
                                }
                                onClick={() => {
                                    if (selectionMode) return;
                                    if (!draggingRackId) {
                                        onCellClick(colIdx, rowIdx, cell);
                                    }
                                }}
                                onMouseDown={() => handleCellMouseDown(colIdx, rowIdx)}
                                onMouseEnter={() => handleCellMouseEnter(colIdx, rowIdx)}
                                onDragOver={!selectionMode ? (e) => handleCellDragOver(e, key, null) : undefined}
                                onDragLeave={!selectionMode ? handleCellDragLeave : undefined}
                                onDrop={!selectionMode ? (e) => handleCellDrop(e, colIdx, rowIdx, null) : undefined}
                                className={cn(
                                    "h-10 w-10 rounded text-xs font-medium border transition-colors",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    selectionMode && "cursor-crosshair",
                                    !selectionMode && isDragOver && [
                                        "bg-indigo-100 border-indigo-500 border-2 text-indigo-800",
                                        "dark:bg-indigo-900/40 dark:border-indigo-400 dark:text-indigo-300",
                                    ],
                                    // Empty and available cells share the same green styling
                                    !isDragOver && (isEmpty || (!isEmpty && !isUnavailable)) && [
                                        "bg-green-100 border-green-400",
                                        "hover:bg-green-200",
                                        "text-green-800",
                                        "dark:bg-green-900/40 dark:border-green-600 dark:text-green-300",
                                        "dark:hover:bg-green-900/60",
                                    ],
                                    !isDragOver && !isEmpty && isUnavailable && [
                                        "bg-red-100 border-red-400",
                                        "hover:bg-red-200",
                                        "text-red-800",
                                        "dark:bg-red-900/40 dark:border-red-600 dark:text-red-300",
                                        "dark:hover:bg-red-900/60",
                                    ],
                                    isSelected && "ring-2 ring-indigo-500 ring-offset-1",
                                )}
                                title={
                                    !selectionMode && isDragOver
                                        ? `Drop rack here (Col ${colIdx + 1}, Row ${rowIdx + 1})`
                                        : isEmpty
                                          ? `Click to create floor space at Col ${colIdx + 1}, Row ${rowIdx + 1}`
                                          : `${label}${isUnavailable ? " (unavailable)" : ""}`
                                }
                            >
                                <span className="truncate block px-0.5 leading-tight">
                                    {!selectionMode && isDragOver ? "→" : isEmpty ? "" : label}
                                </span>
                            </button>
                        );
                    }),
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3.5 w-3.5 rounded border border-green-400 bg-green-100 dark:bg-green-900/40 dark:border-green-600" />
                    Available (click to configure)
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3.5 w-3.5 rounded border border-red-400 bg-red-100 dark:bg-red-900/40 dark:border-red-600" />
                    Unavailable
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3.5 w-3.5 rounded border border-blue-400 bg-blue-100 dark:bg-blue-900/40 dark:border-blue-500" />
                    Rack {onRackDrop ? "(drag to move)" : ""}
                </div>
            </div>
        </div>
    );
}
