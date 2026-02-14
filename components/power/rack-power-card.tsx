"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PowerFeedBar } from "./power-feed-bar";
import { PowerGauge } from "./power-gauge";
import { usePowerStore } from "@/stores/use-power-store";
import type { RackPowerSummary } from "@/types/entities";

interface RackPowerCardProps {
    summary: RackPowerSummary;
}

export function RackPowerCard({ summary }: RackPowerCardProps) {
    const liveReadings = usePowerStore((s) => s.liveReadings);

    // Use live readings if available, fallback to summary data
    const feeds = summary.feeds.map((feed) => {
        const live = liveReadings[feed.feedId];
        if (live) {
            const currentKw = live.powerKw;
            return {
                ...feed,
                currentKw,
                utilizationPercent: Math.round((currentKw / feed.maxKw) * 100),
            };
        }
        return feed;
    });

    const totalCurrentKw = feeds.reduce((sum, f) => sum + f.currentKw, 0);
    const utilization = summary.totalMaxKw > 0
        ? Math.round((totalCurrentKw / summary.totalMaxKw) * 100)
        : 0;

    return (
        <Link href={`/power/racks/${summary.rackId}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{summary.rackName}</CardTitle>
                        <PowerGauge percent={utilization} size={64} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {feeds.map((feed) => (
                        <PowerFeedBar
                            key={feed.feedId}
                            name={feed.name}
                            feedType={feed.feedType}
                            currentKw={feed.currentKw}
                            maxKw={feed.maxKw}
                            utilizationPercent={feed.utilizationPercent}
                        />
                    ))}
                    <div className="pt-2 border-t text-sm text-muted-foreground">
                        Total: {totalCurrentKw.toFixed(1)} / {summary.totalMaxKw.toFixed(1)} kW
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
