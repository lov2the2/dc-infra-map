import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { powerFeeds } from "@/db/schema";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PowerReadingChart } from "@/components/power/power-reading-chart";

export default async function PowerFeedDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { id } = await params;
    const feed = await db.query.powerFeeds.findFirst({
        where: eq(powerFeeds.id, id),
        with: { panel: true, rack: true, powerPorts: true },
    });

    if (!feed) notFound();

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title={feed.name}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Power", href: "/power" },
                    { label: "Feeds", href: "/power/feeds" },
                    { label: feed.name },
                ]}
            />
            <div className="grid gap-6 md:grid-cols-4">
                <Card>
                    <CardHeader><CardTitle className="text-base">Type</CardTitle></CardHeader>
                    <CardContent>
                        <Badge variant="outline" className={
                            feed.feedType === "primary"
                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                                : "bg-purple-500/15 text-purple-700 dark:text-purple-400"
                        }>
                            {feed.feedType}
                        </Badge>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Max Amps</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{feed.maxAmps}A</div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Rated kW</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{feed.ratedKw} kW</div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Rack</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-lg font-medium">{feed.rack?.name ?? "Unassigned"}</div>
                    </CardContent>
                </Card>
            </div>
            <PowerReadingChart feedId={feed.id} feedName={feed.name} />
        </div>
    );
}
