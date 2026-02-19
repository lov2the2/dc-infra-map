import { eq } from "drizzle-orm";
import { db } from "@/db";
import { deviceTypes } from "@/db/schema";
import { successResponse, errorResponse, getRouteId } from "@/lib/api";
import { withAuth, withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (req, _session) => {
    const id = getRouteId(req);
    const deviceType = await db.query.deviceTypes.findFirst({
        where: eq(deviceTypes.id, id),
        with: { manufacturer: true },
    });

    if (!deviceType) return errorResponse("Device type not found", 404);
    return successResponse(deviceType);
});

export const PATCH = withAuth("devices", "update", async (req, _session) => {
    const id = getRouteId(req);
    const body = await req.json();
    const [updated] = await db
        .update(deviceTypes)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(deviceTypes.id, id))
        .returning();

    if (!updated) return errorResponse("Device type not found", 404);
    return successResponse(updated);
});

export const DELETE = withAuth("devices", "delete", async (req, _session) => {
    const id = getRouteId(req);
    const [deleted] = await db
        .update(deviceTypes)
        .set({ deletedAt: new Date() })
        .where(eq(deviceTypes.id, id))
        .returning();

    if (!deleted) return errorResponse("Device type not found", 404);
    return successResponse({ message: "Device type deleted" });
});
