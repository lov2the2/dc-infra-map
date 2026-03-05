import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { racks } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";

/**
 * PATCH /api/racks/[rackId]/position
 * Updates posX and posY for a rack directly via Drizzle ORM.
 * Used by the floor plan 2D Map drag-and-drop feature.
 * This route takes precedence over the next.config.ts rewrite to Core API.
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ rackId: string }> },
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rackId } = await params;
    const body = await req.json();
    const { posX, posY } = body as { posX: number; posY: number };

    if (typeof posX !== "number" || typeof posY !== "number") {
        return NextResponse.json({ error: "posX and posY must be numbers" }, { status: 400 });
    }

    const updated = await db
        .update(racks)
        .set({ posX, posY })
        .where(and(eq(racks.id, rackId), isNull(racks.deletedAt)))
        .returning({ id: racks.id, posX: racks.posX, posY: racks.posY });

    if (updated.length === 0) {
        return NextResponse.json({ error: "Rack not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated[0] });
}
