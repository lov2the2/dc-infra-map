import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { sites, locations } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Layers, ChevronRight } from "lucide-react";

export default async function SiteDetailPage({
    params,
}: {
    params: Promise<{ siteId: string }>;
}) {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    const { siteId } = await params;

    const site = await db.query.sites.findFirst({
        where: eq(sites.id, siteId),
        with: {
            region: true,
            tenant: true,
            locations: {
                where: isNull(locations.deletedAt),
                orderBy: (loc, { asc }) => [asc(loc.name)],
            },
        },
    });

    if (!site) {
        notFound();
    }

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title={site.name}
                description={site.description ?? undefined}
                breadcrumbs={[
                    { label: "Dashboard", href: "/" },
                    { label: "Sites", href: "/sites" },
                    { label: site.name },
                ]}
                action={<StatusBadge status={site.status} />}
            />

            {/* Site details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Site Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {site.region && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Region</span>
                                <span className="font-medium">{site.region.name}</span>
                            </div>
                        )}
                        {site.facility && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Facility</span>
                                <span className="font-medium">{site.facility}</span>
                            </div>
                        )}
                        {site.address && (
                            <div className="flex justify-between text-sm gap-4">
                                <span className="text-muted-foreground shrink-0">Address</span>
                                <span className="font-medium text-right">{site.address}</span>
                            </div>
                        )}
                        {site.tenant && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tenant</span>
                                <span className="font-medium">{site.tenant.name}</span>
                            </div>
                        )}
                        {site.latitude != null && site.longitude != null && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Coordinates</span>
                                <span className="font-medium font-mono text-xs">
                                    {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Layers className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{site.locations.length}</p>
                                <p className="text-xs text-muted-foreground">Locations</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Locations list */}
            <div className="space-y-3">
                <h2 className="text-xl font-semibold">Locations</h2>
                {site.locations.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Layers className="h-10 w-10 text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">No locations found for this site.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {site.locations.map((location) => (
                            <Link
                                key={location.id}
                                href={`/sites/${siteId}/locations/${location.id}`}
                            >
                                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base line-clamp-1">
                                                {location.name}
                                            </CardTitle>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                        </div>
                                        {location.description && (
                                            <CardDescription className="line-clamp-2">
                                                {location.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-muted-foreground">
                                            View floor plan
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
