"use client";

import { useRef } from "react";
import type { DeviceNode, Connection } from "@/types/topology";

const CABLE_COLORS: Record<string, string> = {
    "cat5e": "#3b82f6", "cat6": "#2563eb", "cat6a": "#1d4ed8",
    "fiber-om3": "#f97316", "fiber-om4": "#ea580c", "fiber-sm": "#eab308",
    "dac": "#8b5cf6", "power": "#ef4444", "console": "#6b7280",
};

function getDevicePosition(deviceId: string, index: number, total: number, nodePositions: Record<string, { x: number; y: number }>) {
    if (nodePositions[deviceId]) return nodePositions[deviceId];
    const cols = Math.ceil(Math.sqrt(total));
    return { x: 60 + (index % cols) * 200, y: 60 + Math.floor(index / cols) * 140 };
}

interface TopologyCanvasProps {
    devices: DeviceNode[];
    connections: Connection[];
    connectedInterfaceIds: Set<string>;
    selectedDeviceId: string | null;
    nodePositions: Record<string, { x: number; y: number }>;
    draggingDeviceId: string | null;
    onSelectDevice: (id: string | null) => void;
    onPointerDown: (deviceId: string, e: React.PointerEvent<SVGGElement>) => void;
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
    onPointerUp: () => void;
}

export function TopologyCanvas({
    devices, connections, selectedDeviceId, nodePositions, draggingDeviceId,
    onSelectDevice, onPointerDown, onPointerMove, onPointerUp,
}: TopologyCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const total = devices.length;
    const width = Math.max(800, (Math.ceil(Math.sqrt(total)) * 200) + 120);
    const height = Math.max(400, (Math.ceil(total / Math.ceil(Math.sqrt(total))) * 140) + 120);

    return (
        <div ref={containerRef} className="overflow-auto rounded border bg-muted/30">
            <svg
                width="100%" height={height} viewBox={`0 0 ${width} ${height}`}
                className="min-w-full"
                onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
            >
                {connections.map((conn) => {
                    const srcIdx = devices.findIndex((d) => d.id === conn.sourceDeviceId);
                    const tgtIdx = devices.findIndex((d) => d.id === conn.targetDeviceId);
                    if (srcIdx === -1 || tgtIdx === -1) return null;
                    const srcPos = getDevicePosition(conn.sourceDeviceId, srcIdx, total, nodePositions);
                    const tgtPos = getDevicePosition(conn.targetDeviceId, tgtIdx, total, nodePositions);
                    const color = CABLE_COLORS[conn.cableType] ?? "#6b7280";
                    const isHighlighted = !selectedDeviceId ||
                        conn.sourceDeviceId === selectedDeviceId || conn.targetDeviceId === selectedDeviceId;

                    return (
                        <g key={conn.cableId}>
                            <line
                                x1={srcPos.x + 70} y1={srcPos.y + 30}
                                x2={tgtPos.x + 70} y2={tgtPos.y + 30}
                                stroke={conn.isPatchPanel ? "#10b981" : color}
                                strokeWidth={isHighlighted ? 2.5 : 1}
                                opacity={isHighlighted ? 1 : 0.2}
                                strokeDasharray={conn.isPatchPanel ? "8,4" : conn.status === "planned" ? "5,5" : undefined}
                            />
                            <text
                                x={(srcPos.x + tgtPos.x) / 2 + 70} y={(srcPos.y + tgtPos.y) / 2 + 25}
                                textAnchor="middle" className="fill-muted-foreground text-[10px]"
                                opacity={isHighlighted ? 1 : 0.3}
                            >
                                {conn.isPatchPanel ? `${conn.label} (PP)` : conn.label}
                            </text>
                        </g>
                    );
                })}

                {devices.map((device, idx) => {
                    const pos = getDevicePosition(device.id, idx, total, nodePositions);
                    const isSelected = selectedDeviceId === device.id;
                    const isDragging = draggingDeviceId === device.id;
                    const isHighlighted = !selectedDeviceId || isSelected ||
                        connections.some(
                            (c) => (c.sourceDeviceId === selectedDeviceId && c.targetDeviceId === device.id) ||
                                   (c.targetDeviceId === selectedDeviceId && c.sourceDeviceId === device.id),
                        );

                    return (
                        <g
                            key={device.id}
                            onClick={() => onSelectDevice(isSelected ? null : device.id)}
                            onPointerDown={(e) => { e.stopPropagation(); onPointerDown(device.id, e); }}
                            opacity={isHighlighted ? (isDragging ? 0.7 : 1) : 0.3}
                            style={{ cursor: isDragging ? "grabbing" : "grab" }}
                        >
                            <rect
                                x={pos.x} y={pos.y} width={140} height={60} rx={8}
                                className={isSelected ? "fill-primary/20 stroke-primary" : "fill-card stroke-border"}
                                strokeWidth={isSelected ? 2 : 1}
                            />
                            <text x={pos.x + 70} y={pos.y + 24} textAnchor="middle" className="fill-foreground text-xs font-medium">
                                {device.name.length > 18 ? device.name.slice(0, 16) + "..." : device.name}
                            </text>
                            <text x={pos.x + 70} y={pos.y + 42} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                                {device.interfaces.length} ports
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
