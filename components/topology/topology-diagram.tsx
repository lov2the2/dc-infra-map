"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTopologyData } from "./hooks/use-topology-data";
import { useNodePositions } from "./hooks/use-node-positions";
import { TopologyCanvas } from "./topology-canvas";
import { SwitchPortUsage } from "./switch-port-usage";

export function TopologyDiagram() {
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const { devices, connections, connectedInterfaceIds, loading, error } = useTopologyData();
    const {
        nodePositions,
        draggingDeviceId,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        resetPositions,
    } = useNodePositions(devices.map((d) => d.id));

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    Loading topology...
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    {error}
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

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Device Connections</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={resetPositions}>
                            Auto Layout
                        </Button>
                        <Button variant="outline" size="sm" onClick={resetPositions}>
                            Reset Layout
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <TopologyCanvas
                        devices={devices}
                        connections={connections}
                        connectedInterfaceIds={connectedInterfaceIds}
                        selectedDeviceId={selectedDeviceId}
                        nodePositions={nodePositions}
                        draggingDeviceId={draggingDeviceId}
                        onSelectDevice={setSelectedDeviceId}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                    />
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
