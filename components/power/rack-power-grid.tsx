"use client";

import { RackPowerCard } from "./rack-power-card";
import type { RackPowerSummary } from "@/types/entities";

interface RackPowerGridProps {
    summaries: RackPowerSummary[];
}

export function RackPowerGrid({ summaries }: RackPowerGridProps) {
    if (summaries.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12">
                No racks with power feeds found. Create power panels and feeds first.
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summaries.map((summary) => (
                <RackPowerCard key={summary.rackId} summary={summary} />
            ))}
        </div>
    );
}
