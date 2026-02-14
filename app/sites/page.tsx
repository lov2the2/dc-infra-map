import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { MapPin, Building2 } from "lucide-react";


export default async function SitesPage() {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    const allSites = await db.query.sites.findMany({
        where: isNull(sites.deletedAt),
        with: {
            region: true,
            tenant: true,
        },
        orderBy: (sites, { asc }) => [asc(sites.name)],
    });

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Sites"
                description="Manage data center sites and facilities"
                breadcrumbs={[
                    { label: "Dashboard", href: "/" },
                    { label: "Sites" },
                ]}
            />

            {allSites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No sites found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Get started by adding your first data center site.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allSites.map((site) => (
                        <Link key={site.id} href={`/sites/${site.id}`}>
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-lg line-clamp-1">
                                            {site.name}
                                        </CardTitle>
                                        <StatusBadge status={site.status} />
                                    </div>
                                    {site.region && (
                                        <CardDescription>{site.region.name}</CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {site.address && (
                                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{site.address}</span>
                                        </div>
                                    )}
                                    {site.facility && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Building2 className="h-4 w-4 shrink-0" />
                                            <span>{site.facility}</span>
                                        </div>
                                    )}
                                    {site.tenant && (
                                        <p className="text-xs text-muted-foreground">
                                            Tenant: {site.tenant.name}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
