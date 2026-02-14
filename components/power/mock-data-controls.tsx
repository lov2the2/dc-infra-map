"use client";

import { usePowerStore } from "@/stores/use-power-store";
import { Button } from "@/components/ui/button";

export function MockDataControls() {
    const sseStatus = usePowerStore((s) => s.sseStatus);
    const connectSSE = usePowerStore((s) => s.connectSSE);
    const disconnectSSE = usePowerStore((s) => s.disconnectSSE);

    return (
        <div className="flex items-center gap-3">
            {sseStatus === "connected" || sseStatus === "connecting" ? (
                <Button variant="outline" size="sm" onClick={disconnectSSE}>
                    Pause Updates
                </Button>
            ) : (
                <Button variant="outline" size="sm" onClick={connectSSE}>
                    Resume Updates
                </Button>
            )}
            <span className="text-xs text-muted-foreground">
                Mock data updates every 5s
            </span>
        </div>
    );
}
