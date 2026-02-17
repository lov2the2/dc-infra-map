import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { racks } from "@/db/schema";
import { eq, ne, and, isNull } from "drizzle-orm";
import { MultiRackElevationClient } from "@/components/rack/multi-rack-elevation-client";
import { RackHeader } from "@/components/rack/rack-header";
import type { RackWithDevices } from "@/types/entities";

export default async function RackElevationPage({
    params,
}: {
    params: Promise<{ rackId: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { rackId } = await params;

    const rack = await db.query.racks.findFirst({
        where: eq(racks.id, rackId),
        with: {
            location: { with: { site: true } },
            tenant: true,
            devices: {
                with: { deviceType: true },
            },
        },
    });

    if (!rack) notFound();

    const filteredRack = {
        ...rack,
        devices: rack.devices.filter((d) => !d.deletedAt),
    } as RackWithDevices;

    // Fetch adjacent racks in same location (for multi-rack DnD)
    let adjacentRacks: RackWithDevices[] = [];
    if (rack.locationId) {
        const adjacentRaw = await db.query.racks.findMany({
            where: and(
                eq(racks.locationId, rack.locationId),
                ne(racks.id, rackId),
                isNull(racks.deletedAt),
            ),
            with: {
                location: { with: { site: true } },
                tenant: true,
                devices: {
                    with: { deviceType: true },
                },
            },
            limit: 3,
        });
        adjacentRacks = adjacentRaw.map((r) => ({
            ...r,
            devices: r.devices.filter((d) => !d.deletedAt),
        })) as RackWithDevices[];
    }

    const allRacks = [filteredRack, ...adjacentRacks];
    const siteName = rack.location?.site?.name;
    const siteId = rack.location?.site?.id;

    return (
        <div className="container py-8 space-y-6">
            <RackHeader
                rack={filteredRack}
                siteName={siteName}
                locationName={rack.location?.name}
                siteId={siteId}
            />
            <MultiRackElevationClient initialRacks={allRacks} />
        </div>
    );
}
