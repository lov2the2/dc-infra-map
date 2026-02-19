import { eq } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, getRouteId } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { locationUpdateSchema } from "@/lib/validators/location";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("sites", "read", async (req, _session) => {
    const id = getRouteId(req);
    const location = await db.query.locations.findFirst({
        where: eq(locations.id, id),
        with: { site: true, racks: true, tenant: true },
    });

    if (!location) return errorResponse("Location not found", 404);
    return successResponse(location);
});

export const PATCH = withAuth("sites", "update", async (req, session) => {
    const id = getRouteId(req);
    const body = await req.json();
    const parsed = locationUpdateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await db.query.locations.findFirst({ where: eq(locations.id, id) });
    if (!existing) return errorResponse("Location not found", 404);

    const [updated] = await db
        .update(locations)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(locations.id, id))
        .returning();

    await logAudit(session.user.id, "update", "locations", id, existing as Record<string, unknown>, updated as Record<string, unknown>);

    return successResponse(updated);
});

export const DELETE = withAuth("sites", "delete", async (req, session) => {
    const id = getRouteId(req);
    const existing = await db.query.locations.findFirst({ where: eq(locations.id, id) });
    if (!existing) return errorResponse("Location not found", 404);

    const [deleted] = await db
        .update(locations)
        .set({ deletedAt: new Date() })
        .where(eq(locations.id, id))
        .returning();

    await logAudit(session.user.id, "delete", "locations", id, existing as Record<string, unknown>, null);

    if (!deleted) return errorResponse("Location not found", 404);
    return successResponse({ message: "Location deleted" });
});
