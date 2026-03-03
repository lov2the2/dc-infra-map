import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DeviceNode, Connection } from "@/types/topology";

interface SwitchPortUsageProps {
    device: DeviceNode;
    connections: Connection[];
    connectedInterfaceIds: Set<string>;
    onClear: () => void;
}

export function SwitchPortUsage({ device, connections, connectedInterfaceIds, onClear }: SwitchPortUsageProps) {
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
