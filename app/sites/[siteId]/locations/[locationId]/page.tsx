import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { locations, racks, devices } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { PageHeader } from "@/components/common/page-header";
import { FloorPlanClient } from "./floor-plan-client";

export default async function LocationFloorPlanPage({
    params,
}: {
    params: Promise<{ siteId: string; locationId: string }>;
}) {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    const { siteId, locationId } = await params;

    // Fetch location with its site
    const location = await db.query.locations.findFirst({
        where: eq(locations.id, locationId),
        with: {
            site: true,
        },
    });

    if (!location || location.siteId !== siteId) {
        notFound();
    }

    // Fetch racks in this location (non-deleted)
    const locationRacks = await db.query.racks.findMany({
        where: and(
            eq(racks.locationId, locationId),
            isNull(racks.deletedAt),
        ),
        orderBy: (racks, { asc }) => [asc(racks.name)],
    });

    // Count devices per rack (non-deleted)
    const racksWithCounts = await Promise.all(
        locationRacks.map(async (rack) => {
            const deviceRows = await db
                .select({ id: devices.id })
                .from(devices)
                .where(
                    and(
                        eq(devices.rackId, rack.id),
                        isNull(devices.deletedAt),
                    ),
                );
            return {
                ...rack,
                deviceCount: deviceRows.length,
            };
        }),
    );

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title={location.name}
                description="Floor plan view — click a rack to view its elevation"
                breadcrumbs={[
                    { label: "Dashboard", href: "/" },
                    { label: "Sites", href: "/sites" },
                    { label: location.site?.name ?? "Site", href: `/sites/${siteId}` },
                    { label: location.name },
                ]}
            />

            <FloorPlanClient
                racks={racksWithCounts}
                siteId={siteId}
                locationId={locationId}
            />
        </div>
    );
}
