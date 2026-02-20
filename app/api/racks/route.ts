import { eq, isNull, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { racks, locations } from "@/db/schema";
import { successResponse } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("racks", "read", async (req, _session) => {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const siteId = searchParams.get("siteId");

    if (locationId) {
        // Original behavior: filter by specific location
        const result = await db.query.racks.findMany({
            where: eq(racks.locationId, locationId),
            with: { location: true, tenant: true },
        });
        return successResponse(result);
    }

    if (siteId) {
        // Filter by site: resolve location IDs for the site first
        const siteLocations = await db
            .select({ id: locations.id })
            .from(locations)
            .where(eq(locations.siteId, siteId));

        if (siteLocations.length === 0) {
            return successResponse([]);
        }

        const locationIds = siteLocations.map((l) => l.id);
        const result = await db.query.racks.findMany({
            where: and(isNull(racks.deletedAt), inArray(racks.locationId, locationIds)),
            with: { location: true, tenant: true },
        });
        return successResponse(result);
    }

    // Default: return all non-deleted racks
    const result = await db.query.racks.findMany({
        where: isNull(racks.deletedAt),
        with: { location: true, tenant: true },
    });
    return successResponse(result);
});

export const POST = withAuth("racks", "create", async (req, _session) => {
    const body = await req.json();
    const [rack] = await db.insert(racks).values(body).returning();

    return successResponse(rack, 201);
});
