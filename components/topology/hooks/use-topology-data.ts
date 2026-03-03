import { useEffect, useState } from "react";
import type { CableWithTenant } from "@/types/cable";
import type { DeviceNode, Connection, PortData, RearPortData } from "@/types/topology";

interface UseTopologyDataResult {
    devices: DeviceNode[];
    connections: Connection[];
    connectedInterfaceIds: Set<string>;
    loading: boolean;
    error: string | null;
}

// Trace through patch panels to find the endpoint interface deviceId
function traceToEndpoint(
    terminationType: string,
    terminationId: string,
    ifaceData: { id: string; deviceId: string }[],
    frontPortData: PortData[],
    rearPortData: RearPortData[],
    allCables: CableWithTenant[],
    visited: Set<string> = new Set(),
): string | null {
    const visitKey = `${terminationType}:${terminationId}`;
    if (visited.has(visitKey)) return null;
    visited.add(visitKey);

    if (terminationType === "interface") {
        return ifaceData.find((i) => i.id === terminationId)?.deviceId ?? null;
    }
    if (terminationType === "frontPort") {
        const fp = frontPortData.find((p) => p.id === terminationId);
        if (!fp?.rearPortId) return null;
        const cable = allCables.find(
            (c) => (c.terminationAType === "rearPort" && c.terminationAId === fp.rearPortId) ||
                   (c.terminationBType === "rearPort" && c.terminationBId === fp.rearPortId),
        );
        if (!cable) return null;
        const otherType = cable.terminationAId === fp.rearPortId ? cable.terminationBType : cable.terminationAType;
        const otherId = cable.terminationAId === fp.rearPortId ? cable.terminationBId : cable.terminationAId;
        return traceToEndpoint(otherType, otherId, ifaceData, frontPortData, rearPortData, allCables, visited);
    }
    if (terminationType === "rearPort") {
        const fp = frontPortData.find((p) => p.rearPortId === terminationId);
        if (!fp) return null;
        const cable = allCables.find(
            (c) => (c.terminationAType === "frontPort" && c.terminationAId === fp.id) ||
                   (c.terminationBType === "frontPort" && c.terminationBId === fp.id),
        );
        if (!cable) return null;
        const otherType = cable.terminationAId === fp.id ? cable.terminationBType : cable.terminationAType;
        const otherId = cable.terminationAId === fp.id ? cable.terminationBId : cable.terminationAId;
        return traceToEndpoint(otherType, otherId, ifaceData, frontPortData, rearPortData, allCables, visited);
    }
    return null;
}

export function useTopologyData(): UseTopologyDataResult {
    const [devices, setDevices] = useState<DeviceNode[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [connectedInterfaceIds, setConnectedInterfaceIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

            const connectedIds = new Set<string>();
            for (const cable of cableData) {
                if (cable.terminationAType === "interface") connectedIds.add(cable.terminationAId);
                if (cable.terminationBType === "interface") connectedIds.add(cable.terminationBId);
            }
            setConnectedInterfaceIds(connectedIds);

            const deviceMap = new Map<string, DeviceNode>();
            for (const dev of devData) {
                deviceMap.set(dev.id, { id: dev.id, name: dev.name, type: dev.deviceType?.model ?? "Unknown", interfaces: [] });
            }
            for (const iface of ifaceData) {
                deviceMap.get(iface.deviceId)?.interfaces.push({ id: iface.id, name: iface.name });
            }

            const conns: Connection[] = [];
            for (const cable of cableData) {
                if (cable.terminationAType === "interface" && cable.terminationBType === "interface") {
                    const ifaceA = ifaceData.find((i) => i.id === cable.terminationAId);
                    const ifaceB = ifaceData.find((i) => i.id === cable.terminationBId);
                    if (ifaceA && ifaceB) {
                        conns.push({ cableId: cable.id, label: cable.label, cableType: cable.cableType,
                            status: cable.status, sourceDeviceId: ifaceA.deviceId, targetDeviceId: ifaceB.deviceId });
                    }
                }
            }
            for (const cable of cableData) {
                if (cable.terminationAType === "interface" && cable.terminationBType === "interface") continue;
                const srcDeviceId = traceToEndpoint(cable.terminationAType, cable.terminationAId, ifaceData, frontPortData, rearPortData, cableData);
                const tgtDeviceId = traceToEndpoint(cable.terminationBType, cable.terminationBId, ifaceData, frontPortData, rearPortData, cableData);
                if (srcDeviceId && tgtDeviceId && srcDeviceId !== tgtDeviceId) {
                    const exists = conns.some(
                        (c) => (c.sourceDeviceId === srcDeviceId && c.targetDeviceId === tgtDeviceId) ||
                               (c.sourceDeviceId === tgtDeviceId && c.targetDeviceId === srcDeviceId),
                    );
                    if (!exists) {
                        conns.push({ cableId: `pp-${cable.id}`, label: cable.label ?? "patch panel",
                            cableType: cable.cableType, status: cable.status,
                            sourceDeviceId: srcDeviceId, targetDeviceId: tgtDeviceId, isPatchPanel: true });
                    }
                }
            }

            const connectedDeviceIds = new Set(conns.flatMap((c) => [c.sourceDeviceId, c.targetDeviceId]));
            setDevices(Array.from(deviceMap.values()).filter((d) => connectedDeviceIds.has(d.id) || d.interfaces.length > 0));
            setConnections(conns);
            setLoading(false);
        }).catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to load topology data");
            setLoading(false);
        });
    }, []);

    return { devices, connections, connectedInterfaceIds, loading, error };
}
