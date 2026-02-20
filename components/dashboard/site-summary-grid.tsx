"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSiteStore } from "@/stores/use-site-store";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Building2, Server, HardDrive, Zap } from "lucide-react";
import type { SiteSummary } from "@/app/api/dashboard/summary/route";

/**
 * Renders a per-site summary grid when "All Sites" is selected.
 * Hidden when a specific site is active.
 */
export function SiteSummaryGrid() {
    const activeSiteId = useSiteStore((s) => s.activeSiteId);
    const [summaries, setSummaries] = useState<SiteSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Only fetch when viewing all sites
        if (activeSiteId !== null) return;

        setIsLoading(true);
        fetch("/api/dashboard/summary")
            .then((r) => r.json())
            .then((data) => setSummaries(data.data ?? []))
            .catch(() => setSummaries([]))
            .finally(() => setIsLoading(false));
    }, [activeSiteId]);

    // Hide when a specific site is selected
    if (activeSiteId !== null) return null;

    if (isLoading) {
        return (
            <div className="text-center text-muted-foreground py-6">
                Loading site summaries...
            </div>
        );
    }

    if (summaries.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    No sites found. Create a site to get started.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-semibold">Site Overview</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {summaries.map((site) => (
                    <Link
                        key={site.siteId}
                        href={`/sites/${site.siteId}`}
                        className="block group"
                    >
                        <Card className="hover:bg-muted/50 transition-colors h-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base group-hover:text-primary transition-colors">
                                    <Building2 className="h-4 w-4 shrink-0" />
                                    {site.siteName}
                                </CardTitle>
                                <CardDescription className="text-xs font-mono">
                                    {site.siteSlug}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <Server className="h-3.5 w-3.5" />
                                        Racks
                                    </span>
                                    <span className="font-medium">{site.rackCount}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <HardDrive className="h-3.5 w-3.5" />
                                        Devices
                                    </span>
                                    <span className="font-medium">{site.deviceCount}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <Zap className="h-3.5 w-3.5" />
                                            Power
                                        </span>
                                        <span
                                            className={
                                                site.powerUtilizationPercent >= 90
                                                    ? "font-medium text-destructive"
                                                    : site.powerUtilizationPercent >= 75
                                                      ? "font-medium text-yellow-600 dark:text-yellow-400"
                                                      : "font-medium"
                                            }
                                        >
                                            {site.powerUtilizationPercent}%
                                        </span>
                                    </div>
                                    <Progress
                                        value={site.powerUtilizationPercent}
                                        className="h-1.5"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
