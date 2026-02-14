import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { powerPanels } from "@/db/schema";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function PowerPanelDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { id } = await params;
    const panel = await db.query.powerPanels.findFirst({
        where: eq(powerPanels.id, id),
        with: { powerFeeds: { with: { rack: true } }, site: true },
    });

    if (!panel) notFound();

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title={panel.name}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Power", href: "/power" },
                    { label: "Panels", href: "/power/panels" },
                    { label: panel.name },
                ]}
            />
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle className="text-base">Capacity</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{panel.ratedCapacityKw} kW</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Voltage</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{panel.voltageV}V</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Phase</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{panel.phaseType}</div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Feeds ({panel.powerFeeds.length})</CardTitle>
                        <Button size="sm" asChild>
                            <Link href="/power/feeds/new">Add Feed</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Rack</TableHead>
                                <TableHead>Max Amps</TableHead>
                                <TableHead>Rated kW</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {panel.powerFeeds.map((feed) => (
                                <TableRow key={feed.id}>
                                    <TableCell className="font-medium">{feed.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{feed.feedType}</Badge>
                                    </TableCell>
                                    <TableCell>{feed.rack?.name ?? "-"}</TableCell>
                                    <TableCell>{feed.maxAmps}A</TableCell>
                                    <TableCell>{feed.ratedKw} kW</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/power/feeds/${feed.id}`}>View</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
