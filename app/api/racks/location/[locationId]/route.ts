import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { racks } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";

/**
 * GET /api/racks/location/[locationId]
 * Returns a lightweight list of racks (id + name) for a given location.
 * Used by the device edit dialog's "Move to Rack" feature.
 * Uses Drizzle ORM directly — works without Go Core API running.
 */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ locationId: string }> },
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { locationId } = await params;

    const result = await db
        .select({ id: racks.id, name: racks.name })
        .from(racks)
        .where(and(eq(racks.locationId, locationId), isNull(racks.deletedAt)))
        .orderBy(racks.name);

    return NextResponse.json({ data: result });
}
