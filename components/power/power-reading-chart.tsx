"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PowerChart } from "./power-chart";
import type { PowerReadingEvent } from "@/types/entities";

interface PowerReadingChartProps {
    feedId: string;
    feedName: string;
}

export function PowerReadingChart({ feedId, feedName }: PowerReadingChartProps) {
    const [readings, setReadings] = useState<PowerReadingEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchReadings() {
            const res = await fetch(`/api/power/readings?feedId=${feedId}&interval=5m`);
            if (res.ok) {
                const data = await res.json();
                setReadings(data.data ?? []);
            }
            setIsLoading(false);
        }
        fetchReadings();
    }, [feedId]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{feedName} - Power History</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        Loading...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <PowerChart readings={readings} width={600} height={200} dataKey="powerKw" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
