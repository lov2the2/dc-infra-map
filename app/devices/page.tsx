import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { devices, racks, locations } from "@/db/schema";
import { isNull, and, eq, ilike, inArray } from "drizzle-orm";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { DeviceFilters } from "@/components/devices/device-filters";
import { DeviceTable } from "@/components/devices/device-table";
import { ExportButton } from "@/components/common/export-button";
import { SiteFilterSync } from "@/components/common/site-filter-sync";
import type { DeviceWithRelations } from "@/types/entities";

export default async function DevicesPage({
    searchParams,
}: {
    searchParams: Promise<{
        search?: string;
        status?: string;
        tenantId?: string;
        siteId?: string;
    }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const params = await searchParams;
    const conditions = [isNull(devices.deletedAt)];
    if (params.status) conditions.push(eq(devices.status, params.status as "active"));
    if (params.tenantId) conditions.push(eq(devices.tenantId, params.tenantId));
    if (params.search) conditions.push(ilike(devices.name, `%${params.search}%`));

    // Filter by siteId: traverse rack -> location -> site relationship
    if (params.siteId) {
        const siteLocations = await db
            .select({ id: locations.id })
            .from(locations)
            .where(eq(locations.siteId, params.siteId));

        if (siteLocations.length === 0) {
            return (
                <div className="container py-8 space-y-6">
                    <SiteFilterSync />
                    <PageHeader
                        title="Devices"
                        breadcrumbs={[
                            { label: "Dashboard", href: "/dashboard" },
                            { label: "Devices" },
                        ]}
                        action={
                            <div className="flex items-center gap-2">
                                <ExportButton formats={["xlsx", "xml"]} baseEndpoint="/api/export/devices" />
                                <Button asChild>
                                    <Link href="/devices/new">
                                        <Plus className="mr-2 h-4 w-4" />
                                        New Device
                                    </Link>
                                </Button>
                            </div>
                        }
                    />
                    <DeviceFilters />
                    <DeviceTable devices={[]} />
                </div>
            );
        }

        const locationIds = siteLocations.map((l) => l.id);
        const siteRacks = await db
            .select({ id: racks.id })
            .from(racks)
            .where(and(isNull(racks.deletedAt), inArray(racks.locationId, locationIds)));

        if (siteRacks.length > 0) {
            const rackIds = siteRacks.map((r) => r.id);
            conditions.push(inArray(devices.rackId, rackIds));
        } else {
            conditions.push(eq(devices.rackId, "__no_match__"));
        }
    }

    const result = await db.query.devices.findMany({
        where: and(...conditions),
        with: {
            deviceType: { with: { manufacturer: true } },
            rack: true,
            tenant: true,
        },
    });

    return (
        <div className="container py-8 space-y-6">
            <SiteFilterSync />
            <PageHeader
                title="Devices"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Devices" },
                ]}
                action={
                    <div className="flex items-center gap-2">
                        <ExportButton formats={["xlsx", "xml"]} baseEndpoint="/api/export/devices" />
                        <Button asChild>
                            <Link href="/devices/new">
                                <Plus className="mr-2 h-4 w-4" />
                                New Device
                            </Link>
                        </Button>
                    </div>
                }
            />
            <DeviceFilters />
            <DeviceTable devices={result as DeviceWithRelations[]} />
        </div>
    );
}
