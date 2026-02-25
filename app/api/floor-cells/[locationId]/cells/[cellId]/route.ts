import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { locationFloorCells } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";
import { z } from "zod/v4";

const updateCellSchema = z.object({
    name: z.string().max(100).optional().nullable(),
    isUnavailable: z.boolean().optional(),
    notes: z.string().max(500).optional().nullable(),
});

function getCellIds(req: NextRequest): { locationId: string; cellId: string } {
    const segments = req.nextUrl.pathname.split("/");
    // pathname: /api/floor-cells/[locationId]/cells/[cellId]
    const cellId = segments[segments.length - 1];
    const locationId = segments[segments.length - 3];
    return { locationId, cellId };
}

// PATCH /api/floor-cells/[locationId]/cells/[cellId] — update floor cell
export const PATCH = withAuth("floor_spaces", "update", async (req: NextRequest) => {
    const { locationId, cellId } = getCellIds(req);

    const existing = await db.query.locationFloorCells.findFirst({
        where: and(
            eq(locationFloorCells.id, cellId),
            eq(locationFloorCells.locationId, locationId),
        ),
    });

    if (!existing) {
        return errorResponse("Floor cell not found", 404);
    }

    const body = await req.json();
    const parsed = updateCellSchema.safeParse(body);
    if (!parsed.success) {
        return errorResponse("Invalid cell data", 422);
    }

    const updateData: Partial<typeof existing> = {
        updatedAt: new Date(),
    };

    if ("name" in parsed.data) updateData.name = parsed.data.name ?? null;
    if ("isUnavailable" in parsed.data) updateData.isUnavailable = parsed.data.isUnavailable!;
    if ("notes" in parsed.data) updateData.notes = parsed.data.notes ?? null;

    const [updated] = await db
        .update(locationFloorCells)
        .set(updateData)
        .where(
            and(
                eq(locationFloorCells.id, cellId),
                eq(locationFloorCells.locationId, locationId),
            ),
        )
        .returning();

    return successResponse(updated);
});

// DELETE /api/floor-cells/[locationId]/cells/[cellId] — delete floor cell
export const DELETE = withAuth("floor_spaces", "delete", async (req: NextRequest) => {
    const { locationId, cellId } = getCellIds(req);

    const existing = await db.query.locationFloorCells.findFirst({
        where: and(
            eq(locationFloorCells.id, cellId),
            eq(locationFloorCells.locationId, locationId),
        ),
    });

    if (!existing) {
        return errorResponse("Floor cell not found", 404);
    }

    await db
        .delete(locationFloorCells)
        .where(
            and(
                eq(locationFloorCells.id, cellId),
                eq(locationFloorCells.locationId, locationId),
            ),
        );

    return successResponse({ id: cellId, deleted: true });
});
