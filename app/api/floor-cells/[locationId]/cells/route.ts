import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { locations, locationFloorCells } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";
import { z } from "zod/v4";

const createCellSchema = z.object({
    posX: z.number().int().min(0),
    posY: z.number().int().min(0),
    name: z.string().max(100).optional().nullable(),
    isUnavailable: z.boolean().optional(),
    notes: z.string().max(500).optional().nullable(),
});

// POST /api/floor-cells/[locationId]/cells — create a new floor cell
export const POST = withAuth("floor_spaces", "create", async (req: NextRequest) => {
    const segments = req.nextUrl.pathname.split("/");
    // pathname: /api/floor-cells/[locationId]/cells
    const locationId = segments[segments.length - 2];

    const location = await db.query.locations.findFirst({
        where: eq(locations.id, locationId),
    });

    if (!location) {
        return errorResponse("Location not found", 404);
    }

    const body = await req.json();
    const parsed = createCellSchema.safeParse(body);
    if (!parsed.success) {
        return errorResponse("Invalid cell data", 422);
    }

    const { posX, posY, name, isUnavailable, notes } = parsed.data;

    // Validate position is within grid bounds
    if (posX >= location.gridCols || posY >= location.gridRows) {
        return errorResponse("Cell position is outside grid bounds", 422);
    }

    // Check for duplicate position
    const existing = await db.query.locationFloorCells.findFirst({
        where: (c, { and, eq }) =>
            and(
                eq(c.locationId, locationId),
                eq(c.posX, posX),
                eq(c.posY, posY),
            ),
    });

    if (existing) {
        return errorResponse("A cell already exists at this position", 409);
    }

    const [cell] = await db
        .insert(locationFloorCells)
        .values({
            locationId,
            posX,
            posY,
            name: name ?? null,
            isUnavailable: isUnavailable ?? false,
            notes: notes ?? null,
        })
        .returning();

    return successResponse(cell, 201);
});
