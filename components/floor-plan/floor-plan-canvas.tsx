'use client'

import { useState, useCallback, useRef, useMemo } from "react";
import { FloorPlanToolbar } from "./floor-plan-toolbar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { X } from "lucide-react";

interface RackPosition {
    id: string;
    name: string;
    type: string;
    uHeight: number;
    posX: number | null;
    posY: number | null;
    rotation: number | null;
    deviceCount: number;
}

interface FloorPlanCanvasProps {
    racks: RackPosition[];
    onPositionChange: (rackId: string, posX: number, posY: number) => Promise<void>;
}

const CELL_SIZE = 60;
const GRID_COLS = 20;
const GRID_ROWS = 15;
const INITIAL_ZOOM = 1;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;

/** Compute the default grid position for each rack from the prop data. */
function computeDefaultPositions(
    racks: RackPosition[],
): Record<string, { x: number; y: number }> {
    const result: Record<string, { x: number; y: number }> = {};
    racks.forEach((rack, i) => {
        if (rack.posX !== null && rack.posY !== null) {
            result[rack.id] = { x: rack.posX, y: rack.posY };
        } else {
            // Default: arrange in grid layout if no position set
            result[rack.id] = { x: (i % 5) * 3, y: Math.floor(i / 5) * 4 };
        }
    });
    return result;
}

export function FloorPlanCanvas({ racks, onPositionChange }: FloorPlanCanvasProps) {
    const [zoom, setZoom] = useState(INITIAL_ZOOM);
    const [pan, setPan] = useState({ x: 40, y: 40 });
    const [showGrid, setShowGrid] = useState(true);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<{
        mx: number;
        my: number;
        px: number;
        py: number;
    } | null>(null);
    const [selectedRack, setSelectedRack] = useState<RackPosition | null>(null);
    // Stores only user-initiated drag overrides keyed by rack ID.
    // Positions not present here fall back to the values derived from the racks prop.
    const [dragOverrides, setDragOverrides] = useState<Record<string, { x: number; y: number }>>({});
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Derive effective positions by merging rack defaults with drag overrides.
    // This eliminates the need for a synchronising effect that called setState
    // directly (which triggers the react-hooks/set-state-in-effect lint error).
    const positions = useMemo(() => {
        const defaults = computeDefaultPositions(racks);
        return { ...defaults, ...dragOverrides };
    }, [racks, dragOverrides]);

    // Zoom with mouse wheel
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * delta)));
    }, []);

    // Pan with background drag
    const handleBgPointerDown = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if ((e.target as Element).closest("[data-rack]")) return;
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y });
            (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
        },
        [pan],
    );

    const handleBgPointerMove = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if (!isPanning || !panStart || draggingId) return;
            setPan({
                x: panStart.px + (e.clientX - panStart.mx),
                y: panStart.py + (e.clientY - panStart.my),
            });
        },
        [isPanning, panStart, draggingId],
    );

    const handleBgPointerUp = useCallback(() => {
        setIsPanning(false);
        setPanStart(null);
    }, []);

    // Rack drag handlers
    const handleRackPointerDown = useCallback(
        (e: React.PointerEvent<SVGGElement>, rack: RackPosition) => {
            e.stopPropagation();
            e.preventDefault();
            const svgRect = svgRef.current?.getBoundingClientRect();
            if (!svgRect) return;
            const svgX = (e.clientX - svgRect.left - pan.x) / zoom;
            const svgY = (e.clientY - svgRect.top - pan.y) / zoom;
            const pos = positions[rack.id] ?? { x: 0, y: 0 };
            setDraggingId(rack.id);
            setDragOffset({
                x: svgX - pos.x * CELL_SIZE,
                y: svgY - pos.y * CELL_SIZE,
            });
            (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
        },
        [pan, zoom, positions],
    );

    const handleRackPointerMove = useCallback(
        (e: React.PointerEvent<SVGGElement>, rack: RackPosition) => {
            if (draggingId !== rack.id) return;
            const svgRect = svgRef.current?.getBoundingClientRect();
            if (!svgRect) return;
            const svgX = (e.clientX - svgRect.left - pan.x) / zoom;
            const svgY = (e.clientY - svgRect.top - pan.y) / zoom;
            const rawX = (svgX - dragOffset.x) / CELL_SIZE;
            const rawY = (svgY - dragOffset.y) / CELL_SIZE;
            const snappedX = Math.max(0, Math.round(rawX));
            const snappedY = Math.max(0, Math.round(rawY));
            setDragOverrides((prev) => ({
                ...prev,
                [rack.id]: { x: snappedX, y: snappedY },
            }));
        },
        [draggingId, pan, zoom, dragOffset],
    );

    const handleRackPointerUp = useCallback(
        async (_e: React.PointerEvent<SVGGElement>, rack: RackPosition) => {
            if (draggingId !== rack.id) return;
            setDraggingId(null);
            const pos = positions[rack.id];
            if (pos) {
                await onPositionChange(rack.id, pos.x, pos.y);
            }
        },
        [draggingId, positions, onPositionChange],
    );

    const handleRackClick = useCallback(
        (e: React.MouseEvent, rack: RackPosition) => {
            if (draggingId) return;
            e.stopPropagation();
            setSelectedRack((prev) => (prev?.id === rack.id ? null : rack));
        },
        [draggingId],
    );

    const handleBgClick = useCallback(() => {
        setSelectedRack(null);
    }, []);

    const canvasWidth = GRID_COLS * CELL_SIZE;
    const canvasHeight = GRID_ROWS * CELL_SIZE;

    const getUtilizationColor = (rack: RackPosition) => {
        const util = rack.deviceCount / rack.uHeight;
        if (util > 0.9) return "#ef4444";
        if (util > 0.7) return "#f59e0b";
        return "#22c55e";
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <FloorPlanToolbar
                    onZoomIn={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))}
                    onZoomOut={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.2))}
                    onToggleGrid={() => setShowGrid((v) => !v)}
                    onReset={() => {
                        setZoom(INITIAL_ZOOM);
                        setPan({ x: 40, y: 40 });
                    }}
                    showGrid={showGrid}
                />
                <span className="text-xs text-muted-foreground">
                    {Math.round(zoom * 100)}%
                </span>
            </div>

            <div
                ref={containerRef}
                className="relative border rounded-lg overflow-hidden bg-slate-950"
                style={{ height: "600px" }}
            >
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    style={{ cursor: isPanning ? "grabbing" : "default" }}
                    onWheel={handleWheel}
                    onPointerDown={handleBgPointerDown}
                    onPointerMove={handleBgPointerMove}
                    onPointerUp={handleBgPointerUp}
                    onClick={handleBgClick}
                >
                    <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                        {/* Canvas background */}
                        <rect
                            width={canvasWidth}
                            height={canvasHeight}
                            fill="#0f172a"
                            rx={4}
                        />

                        {/* Grid lines */}
                        {showGrid && (
                            <g stroke="#1e293b" strokeWidth={1 / zoom}>
                                {Array.from({ length: GRID_COLS + 1 }, (_, i) => (
                                    <line
                                        key={`v${i}`}
                                        x1={i * CELL_SIZE}
                                        y1={0}
                                        x2={i * CELL_SIZE}
                                        y2={canvasHeight}
                                    />
                                ))}
                                {Array.from({ length: GRID_ROWS + 1 }, (_, i) => (
                                    <line
                                        key={`h${i}`}
                                        x1={0}
                                        y1={i * CELL_SIZE}
                                        x2={canvasWidth}
                                        y2={i * CELL_SIZE}
                                    />
                                ))}
                            </g>
                        )}

                        {/* Rack markers */}
                        {racks.map((rack) => {
                            const pos = positions[rack.id] ?? { x: 0, y: 0 };
                            const rotation = rack.rotation ?? 0;
                            const isDragging = draggingId === rack.id;
                            const isSelected = selectedRack?.id === rack.id;
                            const utilization = Math.round(
                                (rack.deviceCount / rack.uHeight) * 100,
                            );
                            const utilColor = getUtilizationColor(rack);
                            const px = pos.x * CELL_SIZE;
                            const py = pos.y * CELL_SIZE;
                            const rw = CELL_SIZE;
                            const rh = CELL_SIZE * 2;

                            return (
                                <g
                                    key={rack.id}
                                    data-rack={rack.id}
                                    transform={`translate(${px}, ${py}) rotate(${rotation}, ${rw / 2}, ${rh / 2})`}
                                    style={{
                                        cursor: isDragging ? "grabbing" : "grab",
                                    }}
                                    onPointerDown={(e) =>
                                        handleRackPointerDown(e, rack)
                                    }
                                    onPointerMove={(e) =>
                                        handleRackPointerMove(e, rack)
                                    }
                                    onPointerUp={(e) =>
                                        handleRackPointerUp(e, rack)
                                    }
                                    onClick={(e) => handleRackClick(e, rack)}
                                >
                                    {/* Drop shadow */}
                                    <rect
                                        width={rw}
                                        height={rh}
                                        rx={4}
                                        fill="rgba(0,0,0,0.4)"
                                        transform="translate(3, 3)"
                                    />
                                    {/* Rack body */}
                                    <rect
                                        width={rw}
                                        height={rh}
                                        rx={4}
                                        fill={isDragging ? "#312e81" : "#1e293b"}
                                        stroke={
                                            isSelected
                                                ? "#818cf8"
                                                : isDragging
                                                  ? "#6366f1"
                                                  : "#334155"
                                        }
                                        strokeWidth={
                                            isSelected || isDragging
                                                ? 2 / zoom
                                                : 1 / zoom
                                        }
                                    />
                                    {/* Utilization bar */}
                                    <rect
                                        x={3}
                                        y={rh - 10}
                                        width={(rw - 6) * (utilization / 100)}
                                        height={4}
                                        rx={2}
                                        fill={utilColor}
                                        opacity={0.9}
                                    />
                                    {/* Rack name */}
                                    <text
                                        x={rw / 2}
                                        y={rh / 2 - 6}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize={Math.min(12, CELL_SIZE * 0.2)}
                                        fill="white"
                                        fontWeight="600"
                                        style={{
                                            userSelect: "none",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {rack.name.length > 8
                                            ? rack.name.slice(0, 7) + "\u2026"
                                            : rack.name}
                                    </text>
                                    {/* U height label */}
                                    <text
                                        x={rw / 2}
                                        y={rh / 2 + 8}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize={Math.min(9, CELL_SIZE * 0.15)}
                                        fill="#94a3b8"
                                        style={{
                                            userSelect: "none",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {rack.uHeight}U
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                </svg>

                {/* Info overlay for selected rack */}
                {selectedRack && (
                    <div className="absolute top-3 right-3 w-56 bg-background border rounded-lg shadow-lg p-3 space-y-2 z-10">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-sm">
                                    {selectedRack.name}
                                </p>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] mt-1"
                                >
                                    {selectedRack.type}
                                </Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setSelectedRack(null)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>
                                    {selectedRack.deviceCount} devices /{" "}
                                    {selectedRack.uHeight}U
                                </span>
                                <span>
                                    {Math.round(
                                        (selectedRack.deviceCount /
                                            selectedRack.uHeight) *
                                            100,
                                    )}
                                    %
                                </span>
                            </div>
                            <Progress
                                value={Math.round(
                                    (selectedRack.deviceCount /
                                        selectedRack.uHeight) *
                                        100,
                                )}
                                className="h-1.5"
                            />
                        </div>
                        <Link
                            href={`/racks/${selectedRack.id}`}
                            className="block text-xs text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            View rack elevation &rarr;
                        </Link>
                    </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-3 left-3 flex items-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-1.5 rounded bg-green-500" />
                        <span>&lt;70%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-1.5 rounded bg-yellow-500" />
                        <span>70&ndash;90%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-1.5 rounded bg-red-500" />
                        <span>&gt;90%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
