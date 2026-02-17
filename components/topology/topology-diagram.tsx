"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CableWithTenant } from "@/types/cable";

interface DeviceNode {
    id: string;
    name: string;
    type: string;
    interfaces: { id: string; name: string }[];
}

interface Connection {
    cableId: string;
    label: string;
    cableType: string;
    status: string;
    sourceDeviceId: string;
    targetDeviceId: string;
    isPatchPanel?: boolean;
}

interface PortData {
    id: string;
    name: string;
    deviceId: string;
    rearPortId?: string | null;
}

interface RearPortData {
    id: string;
    name: string;
    deviceId: string;
}

const CABLE_COLORS: Record<string, string> = {
    "cat5e": "#3b82f6",
    "cat6": "#2563eb",
    "cat6a": "#1d4ed8",
    "fiber-om3": "#f97316",
    "fiber-om4": "#ea580c",
    "fiber-sm": "#eab308",
    "dac": "#8b5cf6",
    "power": "#ef4444",
    "console": "#6b7280",
};

// Trace through patch panels to find the endpoint interface deviceId
function traceToEndpoint(
    terminationType: string,
    terminationId: string,
    ifaceData: { id: string; deviceId: string }[],
    frontPortData: PortData[],
    rearPortData: RearPortData[],
    allCables: { id: string; terminationAType: string; terminationAId: string; terminationBType: string; terminationBId: string }[],
    visited: Set<string> = new Set(),
): string | null {
    const visitKey = `${terminationType}:${terminationId}`;
    if (visited.has(visitKey)) return null;
    visited.add(visitKey);

    if (terminationType === "interface") {
        const iface = ifaceData.find((i) => i.id === terminationId);
        return iface?.deviceId ?? null;
    }

    if (terminationType === "frontPort") {
        const fp = frontPortData.find((p) => p.id === terminationId);
        if (!fp?.rearPortId) return null;
        // Find cable on the rear port
        const cable = allCables.find(
            (c) =>
                (c.terminationAType === "rearPort" && c.terminationAId === fp.rearPortId) ||
                (c.terminationBType === "rearPort" && c.terminationBId === fp.rearPortId),
        );
        if (!cable) return null;
        const otherType = cable.terminationAId === fp.rearPortId ? cable.terminationBType : cable.terminationAType;
        const otherId = cable.terminationAId === fp.rearPortId ? cable.terminationBId : cable.terminationAId;
        return traceToEndpoint(otherType, otherId, ifaceData, frontPortData, rearPortData, allCables, visited);
    }

    if (terminationType === "rearPort") {
        // Find the first front port linked to this rear port
        const fp = frontPortData.find((p) => p.rearPortId === terminationId);
        if (!fp) return null;
        // Find cable on the front port
        const cable = allCables.find(
            (c) =>
                (c.terminationAType === "frontPort" && c.terminationAId === fp.id) ||
                (c.terminationBType === "frontPort" && c.terminationBId === fp.id),
        );
        if (!cable) return null;
        const otherType = cable.terminationAId === fp.id ? cable.terminationBType : cable.terminationAType;
        const otherId = cable.terminationAId === fp.id ? cable.terminationBId : cable.terminationAId;
        return traceToEndpoint(otherType, otherId, ifaceData, frontPortData, rearPortData, allCables, visited);
    }

    return null;
}

export function TopologyDiagram() {
    const [devices, setDevices] = useState<DeviceNode[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [connectedInterfaceIds, setConnectedInterfaceIds] = useState<Set<string>>(new Set());
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        Promise.all([
            fetch("/api/devices").then((r) => r.json()),
            fetch("/api/interfaces").then((r) => r.json()),
            fetch("/api/cables").then((r) => r.json()),
            fetch("/api/front-ports").then((r) => r.json()),
            fetch("/api/rear-ports").then((r) => r.json()),
        ]).then(([devRes, ifaceRes, cableRes, frontPortRes, rearPortRes]) => {
            const devData = devRes.data ?? [];
            const ifaceData: { id: string; deviceId: string; name: string }[] = ifaceRes.data ?? [];
            const cableData: CableWithTenant[] = cableRes.data ?? [];
            const frontPortData: PortData[] = frontPortRes.data ?? [];
            const rearPortData: RearPortData[] = rearPortRes.data ?? [];

            // Build connected interface IDs set from cables
            const connectedIds = new Set<string>();
            for (const cable of cableData) {
                if (cable.terminationAType === "interface") {
                    connectedIds.add(cable.terminationAId);
                }
                if (cable.terminationBType === "interface") {
                    connectedIds.add(cable.terminationBId);
                }
            }
            setConnectedInterfaceIds(connectedIds);

            // Build device nodes with their interfaces
            const deviceMap = new Map<string, DeviceNode>();
            for (const dev of devData) {
                deviceMap.set(dev.id, {
                    id: dev.id,
                    name: dev.name,
                    type: dev.deviceType?.model ?? "Unknown",
                    interfaces: [],
                });
            }

            for (const iface of ifaceData) {
                const device = deviceMap.get(iface.deviceId);
                if (device) {
                    device.interfaces.push({ id: iface.id, name: iface.name });
                }
            }

            // Build connections from cables that connect interfaces directly
            const conns: Connection[] = [];
            for (const cable of cableData) {
                if (cable.terminationAType === "interface" && cable.terminationBType === "interface") {
                    const ifaceA = ifaceData.find((i) => i.id === cable.terminationAId);
                    const ifaceB = ifaceData.find((i) => i.id === cable.terminationBId);
                    if (ifaceA && ifaceB) {
                        conns.push({
                            cableId: cable.id,
                            label: cable.label,
                            cableType: cable.cableType,
                            status: cable.status,
                            sourceDeviceId: ifaceA.deviceId,
                            targetDeviceId: ifaceB.deviceId,
                        });
                    }
                }
            }

            // Build patch panel connections
            for (const cable of cableData) {
                // Skip cables already handled as direct interface-interface
                if (cable.terminationAType === "interface" && cable.terminationBType === "interface") continue;

                const srcDeviceId = traceToEndpoint(
                    cable.terminationAType,
                    cable.terminationAId,
                    ifaceData,
                    frontPortData,
                    rearPortData,
                    cableData,
                );
                const tgtDeviceId = traceToEndpoint(
                    cable.terminationBType,
                    cable.terminationBId,
                    ifaceData,
                    frontPortData,
                    rearPortData,
                    cableData,
                );

                if (srcDeviceId && tgtDeviceId && srcDeviceId !== tgtDeviceId) {
                    // Check if this device pair already has a direct connection
                    const alreadyExists = conns.some(
                        (c) =>
                            (c.sourceDeviceId === srcDeviceId && c.targetDeviceId === tgtDeviceId) ||
                            (c.sourceDeviceId === tgtDeviceId && c.targetDeviceId === srcDeviceId),
                    );
                    if (!alreadyExists) {
                        conns.push({
                            cableId: `pp-${cable.id}`,
                            label: cable.label ?? "patch panel",
                            cableType: cable.cableType,
                            status: cable.status,
                            sourceDeviceId: srcDeviceId,
                            targetDeviceId: tgtDeviceId,
                            isPatchPanel: true,
                        });
                    }
                }
            }

            // Only include devices that have connections or interfaces
            const connectedDeviceIds = new Set<string>();
            for (const conn of conns) {
                connectedDeviceIds.add(conn.sourceDeviceId);
                connectedDeviceIds.add(conn.targetDeviceId);
            }

            const relevantDevices = Array.from(deviceMap.values()).filter(
                (d) => connectedDeviceIds.has(d.id) || d.interfaces.length > 0,
            );

            setDevices(relevantDevices);
            setConnections(conns);
            setLoading(false);
        });
    }, []);

    const getDevicePosition = useCallback((index: number, total: number) => {
        const cols = Math.ceil(Math.sqrt(total));
        const row = Math.floor(index / cols);
        const col = index % cols;
        return {
            x: 60 + col * 200,
            y: 60 + row * 140,
        };
    }, []);

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    Loading topology...
                </CardContent>
            </Card>
        );
    }

    if (devices.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    No devices with interfaces found. Add interfaces to devices to see the topology.
                </CardContent>
            </Card>
        );
    }

    const width = Math.max(800, (Math.ceil(Math.sqrt(devices.length)) * 200) + 120);
    const height = Math.max(400, (Math.ceil(devices.length / Math.ceil(Math.sqrt(devices.length))) * 140) + 120);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Device Connections</CardTitle>
                </CardHeader>
                <CardContent>
                    <div ref={containerRef} className="overflow-auto rounded border bg-muted/30">
                        <svg width={width} height={height} className="min-w-full">
                            {/* Draw connection lines */}
                            {connections.map((conn) => {
                                const srcIdx = devices.findIndex((d) => d.id === conn.sourceDeviceId);
                                const tgtIdx = devices.findIndex((d) => d.id === conn.targetDeviceId);
                                if (srcIdx === -1 || tgtIdx === -1) return null;

                                const srcPos = getDevicePosition(srcIdx, devices.length);
                                const tgtPos = getDevicePosition(tgtIdx, devices.length);
                                const color = CABLE_COLORS[conn.cableType] ?? "#6b7280";
                                const isHighlighted = !selectedDeviceId ||
                                    conn.sourceDeviceId === selectedDeviceId ||
                                    conn.targetDeviceId === selectedDeviceId;

                                return (
                                    <g key={conn.cableId}>
                                        <line
                                            x1={srcPos.x + 70}
                                            y1={srcPos.y + 30}
                                            x2={tgtPos.x + 70}
                                            y2={tgtPos.y + 30}
                                            stroke={conn.isPatchPanel ? "#10b981" : color}
                                            strokeWidth={isHighlighted ? 2.5 : 1}
                                            opacity={isHighlighted ? 1 : 0.2}
                                            strokeDasharray={
                                                conn.isPatchPanel ? "8,4" :
                                                conn.status === "planned" ? "5,5" : undefined
                                            }
                                        />
                                        <text
                                            x={(srcPos.x + tgtPos.x) / 2 + 70}
                                            y={(srcPos.y + tgtPos.y) / 2 + 25}
                                            textAnchor="middle"
                                            className="fill-muted-foreground text-[10px]"
                                            opacity={isHighlighted ? 1 : 0.3}
                                        >
                                            {conn.isPatchPanel ? `${conn.label} (PP)` : conn.label}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Draw device nodes */}
                            {devices.map((device, idx) => {
                                const pos = getDevicePosition(idx, devices.length);
                                const isSelected = selectedDeviceId === device.id;
                                const isHighlighted = !selectedDeviceId || isSelected ||
                                    connections.some(
                                        (c) =>
                                            (c.sourceDeviceId === selectedDeviceId && c.targetDeviceId === device.id) ||
                                            (c.targetDeviceId === selectedDeviceId && c.sourceDeviceId === device.id),
                                    );

                                return (
                                    <g
                                        key={device.id}
                                        onClick={() => setSelectedDeviceId(isSelected ? null : device.id)}
                                        className="cursor-pointer"
                                        opacity={isHighlighted ? 1 : 0.3}
                                    >
                                        <rect
                                            x={pos.x}
                                            y={pos.y}
                                            width={140}
                                            height={60}
                                            rx={8}
                                            className={isSelected
                                                ? "fill-primary/20 stroke-primary"
                                                : "fill-card stroke-border"
                                            }
                                            strokeWidth={isSelected ? 2 : 1}
                                        />
                                        <text
                                            x={pos.x + 70}
                                            y={pos.y + 24}
                                            textAnchor="middle"
                                            className="fill-foreground text-xs font-medium"
                                        >
                                            {device.name.length > 18
                                                ? device.name.slice(0, 16) + "..."
                                                : device.name}
                                        </text>
                                        <text
                                            x={pos.x + 70}
                                            y={pos.y + 42}
                                            textAnchor="middle"
                                            className="fill-muted-foreground text-[10px]"
                                        >
                                            {device.interfaces.length} ports
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </CardContent>
            </Card>

            {selectedDeviceId && (
                <SwitchPortUsage
                    device={devices.find((d) => d.id === selectedDeviceId)!}
                    connections={connections}
                    connectedInterfaceIds={connectedInterfaceIds}
                    onClear={() => setSelectedDeviceId(null)}
                />
            )}
        </div>
    );
}

interface SwitchPortUsageProps {
    device: DeviceNode;
    connections: Connection[];
    connectedInterfaceIds: Set<string>;
    onClear: () => void;
}

function SwitchPortUsage({ device, connections, connectedInterfaceIds, onClear }: SwitchPortUsageProps) {
    const deviceConns = connections.filter(
        (c) => c.sourceDeviceId === device.id || c.targetDeviceId === device.id,
    );
    const connectedPorts = device.interfaces.filter((i) => connectedInterfaceIds.has(i.id)).length;
    const totalPorts = device.interfaces.length;
    const utilization = totalPorts > 0 ? Math.round((connectedPorts / totalPorts) * 100) : 0;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                    {device.name} - Port Usage ({deviceConns.length} cables)
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={onClear}>
                    Clear
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                        <span>Total: {totalPorts}</span>
                        <span className="text-emerald-600">Connected: {connectedPorts}</span>
                        <span className="text-muted-foreground">Available: {totalPorts - connectedPorts}</span>
                        <span className="font-medium">Utilization: {utilization}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {device.interfaces.map((iface, idx) => {
                            const isConnected = connectedInterfaceIds.has(iface.id);
                            return (
                                <div
                                    key={iface.id}
                                    className={`h-6 w-6 rounded text-[8px] flex items-center justify-center border ${
                                        isConnected
                                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                                            : "bg-muted border-border text-muted-foreground"
                                    }`}
                                    title={`${iface.name} - ${isConnected ? "connected" : "available"}`}
                                >
                                    {idx + 1}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
