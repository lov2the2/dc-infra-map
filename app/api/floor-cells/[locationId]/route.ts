import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { locations, locationFloorCells } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";
import { z } from "zod/v4";

const gridConfigSchema = z.object({
    gridCols: z.number().int().min(1).max(50),
    gridRows: z.number().int().min(1).max(50),
});

// GET /api/floor-cells/[locationId] — fetch grid config + all floor cells
export const GET = withAuth("floor_spaces", "read", async (req: NextRequest) => {
    const segments = req.nextUrl.pathname.split("/");
    const locationId = segments[segments.length - 1];

    const location = await db.query.locations.findFirst({
        where: eq(locations.id, locationId),
    });

    if (!location) {
        return errorResponse("Location not found", 404);
    }

    const cells = await db.query.locationFloorCells.findMany({
        where: eq(locationFloorCells.locationId, locationId),
        orderBy: (c, { asc }) => [asc(c.posY), asc(c.posX)],
    });

    return successResponse({
        locationId: location.id,
        gridCols: location.gridCols,
        gridRows: location.gridRows,
        cells,
    });
});

// PUT /api/floor-cells/[locationId] — update grid size
export const PUT = withAuth("floor_spaces", "update", async (req: NextRequest) => {
    const segments = req.nextUrl.pathname.split("/");
    const locationId = segments[segments.length - 1];

    const location = await db.query.locations.findFirst({
        where: eq(locations.id, locationId),
    });

    if (!location) {
        return errorResponse("Location not found", 404);
    }

    const body = await req.json();
    const parsed = gridConfigSchema.safeParse(body);
    if (!parsed.success) {
        return errorResponse("Invalid grid configuration", 422);
    }

    const { gridCols, gridRows } = parsed.data;

    const [updated] = await db
        .update(locations)
        .set({ gridCols, gridRows, updatedAt: new Date() })
        .where(eq(locations.id, locationId))
        .returning({
            id: locations.id,
            gridCols: locations.gridCols,
            gridRows: locations.gridRows,
        });

    return successResponse(updated);
});
