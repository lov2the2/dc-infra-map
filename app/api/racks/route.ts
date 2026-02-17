import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { racks } from "@/db/schema";
import { successResponse } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("racks", "read", async (req, _session) => {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");

    const result = await db.query.racks.findMany({
        where: locationId
            ? eq(racks.locationId, locationId)
            : isNull(racks.deletedAt),
        with: { location: true, tenant: true },
    });

    return successResponse(result);
});

export const POST = withAuth("racks", "create", async (req, _session) => {
    const body = await req.json();
    const [rack] = await db.insert(racks).values(body).returning();

    return successResponse(rack, 201);
});
