import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, handleApiError, getRouteId } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";
import { locationUpdateSchema } from "@/lib/validators/location";

// GET /api/locations/[locationId]
export const GET = withAuth("sites", "read", async (req: NextRequest) => {
    try {
        const locationId = getRouteId(req);
        const location = await db.query.locations.findFirst({
            where: eq(locations.id, locationId),
        });
        if (!location || location.deletedAt) {
            return errorResponse("Location not found", 404);
        }
        return successResponse(location);
    } catch (error) {
        return handleApiError(error);
    }
});

// PATCH /api/locations/[locationId]
export const PATCH = withAuth("sites", "update", async (req: NextRequest) => {
    try {
        const locationId = getRouteId(req);
        const body = await req.json();
        const parsed = locationUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return validationErrorResponse(parsed.error);
        }

        const [updated] = await db
            .update(locations)
            .set({ ...parsed.data, updatedAt: new Date() })
            .where(eq(locations.id, locationId))
            .returning();

        if (!updated) {
            return errorResponse("Location not found", 404);
        }
        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
});

// DELETE /api/locations/[locationId]
export const DELETE = withAuth("sites", "delete", async (req: NextRequest) => {
    try {
        const locationId = getRouteId(req);
        const [deleted] = await db
            .update(locations)
            .set({ deletedAt: new Date() })
            .where(eq(locations.id, locationId))
            .returning({ id: locations.id });

        if (!deleted) {
            return errorResponse("Location not found", 404);
        }
        return successResponse({ message: "Location deleted" });
    } catch (error) {
        return handleApiError(error);
    }
});
