"use client";

import { usePowerStore } from "@/stores/use-power-store";

const STATUS_CONFIG = {
    connected: { color: "bg-emerald-500", label: "Connected" },
    connecting: { color: "bg-amber-500 animate-pulse", label: "Connecting" },
    disconnected: { color: "bg-gray-400", label: "Disconnected" },
    error: { color: "bg-red-500", label: "Error" },
};

export function SseConnectionIndicator() {
    const sseStatus = usePowerStore((s) => s.sseStatus);
    const config = STATUS_CONFIG[sseStatus];

    return (
        <div className="flex items-center gap-2 text-sm">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${config.color}`} />
            <span className="text-muted-foreground">SSE: {config.label}</span>
        </div>
    );
}
