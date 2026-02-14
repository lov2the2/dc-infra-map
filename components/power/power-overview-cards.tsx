"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePowerStore } from "@/stores/use-power-store";
import type { RackPowerSummary } from "@/types/entities";

interface PowerOverviewCardsProps {
    summaries: RackPowerSummary[];
}

export function PowerOverviewCards({ summaries }: PowerOverviewCardsProps) {
    const liveReadings = usePowerStore((s) => s.liveReadings);
    const readingCount = Object.keys(liveReadings).length;

    const totalCapacity = summaries.reduce((sum, s) => sum + s.totalMaxKw, 0);
    const totalCurrent = summaries.reduce((sum, s) => sum + s.totalCurrentKw, 0);
    const avgUtilization = totalCapacity > 0 ? Math.round((totalCurrent / totalCapacity) * 100) : 0;
    const totalFeeds = summaries.reduce((sum, s) => sum + s.feeds.length, 0);

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Capacity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalCapacity.toFixed(1)} kW</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Current Load</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalCurrent.toFixed(1)} kW</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{avgUtilization}%</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Feeds</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{readingCount > 0 ? readingCount : totalFeeds}</div>
                </CardContent>
            </Card>
        </div>
    );
}
