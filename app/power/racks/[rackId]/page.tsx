import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { eq, and, isNull } from "drizzle-orm";
import { racks, powerFeeds } from "@/db/schema";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PowerReadingChart } from "@/components/power/power-reading-chart";
import { generateMockReading } from "@/lib/power/mock-generator";

export default async function RackPowerDetailPage({
    params,
}: {
    params: Promise<{ rackId: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { rackId } = await params;
    const rack = await db.query.racks.findFirst({
        where: eq(racks.id, rackId),
    });

    if (!rack) notFound();

    const feeds = await db.query.powerFeeds.findMany({
        where: and(eq(powerFeeds.rackId, rackId), isNull(powerFeeds.deletedAt)),
        with: { panel: true },
    });

    // Generate current readings for each feed
    const feedsWithReadings = feeds.map((feed) => {
        const reading = generateMockReading(feed.id, feed.ratedKw, feed.feedType);
        return {
            ...feed,
            currentKw: reading.powerKw,
            currentA: reading.currentA,
            voltageV: reading.voltageV,
            utilizationPercent: Math.round((reading.powerKw / feed.ratedKw) * 100),
        };
    });

    const totalMaxKw = feeds.reduce((sum, f) => sum + f.ratedKw, 0);
    const totalCurrentKw = feedsWithReadings.reduce((sum, f) => sum + f.currentKw, 0);
    const avgUtilization = totalMaxKw > 0 ? Math.round((totalCurrentKw / totalMaxKw) * 100) : 0;

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title={`${rack.name} - Power Detail`}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Power", href: "/power" },
                    { label: rack.name },
                ]}
            />
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Capacity</CardTitle>
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{totalMaxKw.toFixed(1)} kW</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Current Load</CardTitle>
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{totalCurrentKw.toFixed(1)} kW</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Utilization</CardTitle>
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{avgUtilization}%</div></CardContent>
                </Card>
            </div>
            {feedsWithReadings.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No power feeds connected to this rack
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {feedsWithReadings.map((feed) => (
                        <Card key={feed.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">{feed.name}</CardTitle>
                                    <div className="text-sm text-muted-foreground">
                                        {feed.currentKw.toFixed(2)} kW / {feed.ratedKw} kW ({feed.utilizationPercent}%)
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Voltage</span>
                                        <div className="font-medium">{feed.voltageV.toFixed(1)}V</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Current</span>
                                        <div className="font-medium">{feed.currentA.toFixed(2)}A</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Max Amps</span>
                                        <div className="font-medium">{feed.maxAmps}A</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Panel</span>
                                        <div className="font-medium">{feed.panel?.name ?? "-"}</div>
                                    </div>
                                </div>
                                <PowerReadingChart feedId={feed.id} feedName={feed.name} />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
