import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { racks } from "@/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { MultiRackElevationClient } from "@/components/rack/multi-rack-elevation-client";
import { RackHeader } from "@/components/rack/rack-header";
import type { RackWithDevices } from "@/types/entities";

/** Same sort order as Grid View: placed racks by (posY asc, posX asc), unplaced last. */
function sortRackIds(rows: { id: string; posX: number | null; posY: number | null; name: string }[]): string[] {
    return [...rows]
        .sort((a, b) => {
            const aPlaced = a.posX !== null && a.posY !== null;
            const bPlaced = b.posX !== null && b.posY !== null;
            if (aPlaced && bPlaced) {
                if (a.posY !== b.posY) return (a.posY ?? 0) - (b.posY ?? 0);
                return (a.posX ?? 0) - (b.posX ?? 0);
            }
            if (aPlaced) return -1;
            if (bPlaced) return 1;
            return a.name.localeCompare(b.name);
        })
        .map((r) => r.id);
}

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

    // Fetch exactly 1 prev + 1 next rack using the same sort order as Grid View.
    let prevRack: RackWithDevices | null = null;
    let nextRack: RackWithDevices | null = null;

    if (rack.locationId) {
        // Fetch all racks in the location (lightweight: id + position + name only)
        const allLocRacks = await db
            .select({ id: racks.id, posX: racks.posX, posY: racks.posY, name: racks.name })
            .from(racks)
            .where(and(eq(racks.locationId, rack.locationId), isNull(racks.deletedAt)));

        const sortedIds = sortRackIds(allLocRacks);
        const currentIdx = sortedIds.indexOf(rackId);

        const prevId = currentIdx > 0 ? sortedIds[currentIdx - 1] : null;
        const nextId = currentIdx < sortedIds.length - 1 ? sortedIds[currentIdx + 1] : null;

        const adjacentIds = [prevId, nextId].filter((id): id is string => id !== null);

        if (adjacentIds.length > 0) {
            const adjacentRaw = await db.query.racks.findMany({
                where: and(inArray(racks.id, adjacentIds), isNull(racks.deletedAt)),
                with: {
                    location: { with: { site: true } },
                    tenant: true,
                    devices: { with: { deviceType: true } },
                },
            });

            const toFiltered = (r: (typeof adjacentRaw)[number]): RackWithDevices =>
                ({ ...r, devices: r.devices.filter((d) => !d.deletedAt) }) as RackWithDevices;

            if (prevId) {
                const raw = adjacentRaw.find((r) => r.id === prevId);
                if (raw) prevRack = toFiltered(raw);
            }
            if (nextId) {
                const raw = adjacentRaw.find((r) => r.id === nextId);
                if (raw) nextRack = toFiltered(raw);
            }
        }
    }

    // Order: [prev, current, next] — omit nulls
    const allRacks = [prevRack, filteredRack, nextRack].filter((r): r is RackWithDevices => r !== null);

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
