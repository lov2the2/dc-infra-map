"use client";

import { useEffect, useState } from "react";
import { usePowerStore } from "@/stores/use-power-store";
import { useSiteStore } from "@/stores/use-site-store";
import { SseConnectionIndicator } from "./sse-connection-indicator";
import { PowerOverviewCards } from "./power-overview-cards";
import { RackPowerGrid } from "./rack-power-grid";
import type { RackPowerSummary } from "@/types/entities";

export function PowerDashboard() {
    const connectSSE = usePowerStore((s) => s.connectSSE);
    const disconnectSSE = usePowerStore((s) => s.disconnectSSE);
    const activeSiteId = useSiteStore((s) => s.activeSiteId);
    const [summaries, setSummaries] = useState<RackPowerSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchSummaries() {
            setIsLoading(true);
            const url = activeSiteId
                ? `/api/power/summary?siteId=${activeSiteId}`
                : "/api/power/summary";
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setSummaries(data.data ?? []);
            }
            setIsLoading(false);
        }
        fetchSummaries();
        connectSSE();
        return () => disconnectSSE();
    }, [connectSSE, disconnectSSE, activeSiteId]);

    if (isLoading) {
        return <div className="text-center text-muted-foreground py-12">Loading power data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <SseConnectionIndicator />
            </div>
            <PowerOverviewCards summaries={summaries} />
            <RackPowerGrid summaries={summaries} />
        </div>
    );
}
