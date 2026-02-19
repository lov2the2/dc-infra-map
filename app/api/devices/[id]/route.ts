import { eq } from "drizzle-orm";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, getRouteId } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { deviceUpdateSchema } from "@/lib/validators/device";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("devices", "read", async (req, _session) => {
    const id = getRouteId(req);
    const device = await db.query.devices.findFirst({
        where: eq(devices.id, id),
        with: { deviceType: true, rack: true, tenant: true },
    });

    if (!device) return errorResponse("Device not found", 404);
    return successResponse(device);
});

export const PATCH = withAuth("devices", "update", async (req, session) => {
    const id = getRouteId(req);
    const body = await req.json();
    const parsed = deviceUpdateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await db.query.devices.findFirst({ where: eq(devices.id, id) });
    if (!existing) return errorResponse("Device not found", 404);

    const { reason, ...data } = parsed.data;
    const [updated] = await db
        .update(devices)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(devices.id, id))
        .returning();

    await logAudit(session.user.id, "update", "devices", id, existing as Record<string, unknown>, updated as Record<string, unknown>, reason);

    return successResponse(updated);
});

export const DELETE = withAuth("devices", "delete", async (req, session) => {
    const id = getRouteId(req);
    const existing = await db.query.devices.findFirst({ where: eq(devices.id, id) });
    if (!existing) return errorResponse("Device not found", 404);

    const [deleted] = await db
        .update(devices)
        .set({ deletedAt: new Date() })
        .where(eq(devices.id, id))
        .returning();

    await logAudit(session.user.id, "delete", "devices", id, existing as Record<string, unknown>, null);

    if (!deleted) return errorResponse("Device not found", 404);
    return successResponse({ message: "Device deleted" });
});
