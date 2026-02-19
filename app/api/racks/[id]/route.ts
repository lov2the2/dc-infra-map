import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { racks, devices } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, getRouteId } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { rackUpdateSchema } from "@/lib/validators/rack";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("racks", "read", async (req, _session) => {
    const id = getRouteId(req);
    const rack = await db.query.racks.findFirst({
        where: eq(racks.id, id),
        with: {
            location: true,
            tenant: true,
            devices: {
                where: isNull(devices.deletedAt),
                with: { deviceType: true },
            },
        },
    });

    if (!rack) return errorResponse("Rack not found", 404);
    return successResponse(rack);
});

export const PATCH = withAuth("racks", "update", async (req, session) => {
    const id = getRouteId(req);
    const body = await req.json();
    const parsed = rackUpdateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await db.query.racks.findFirst({ where: eq(racks.id, id) });
    if (!existing) return errorResponse("Rack not found", 404);

    const [updated] = await db
        .update(racks)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(racks.id, id))
        .returning();

    const reason = body.reason as string | undefined;
    await logAudit(session.user.id, "update", "racks", id, existing as Record<string, unknown>, updated as Record<string, unknown>, reason);

    return successResponse(updated);
});

export const DELETE = withAuth("racks", "delete", async (req, session) => {
    const id = getRouteId(req);
    const existing = await db.query.racks.findFirst({ where: eq(racks.id, id) });
    if (!existing) return errorResponse("Rack not found", 404);

    const [deleted] = await db
        .update(racks)
        .set({ deletedAt: new Date() })
        .where(eq(racks.id, id))
        .returning();

    await logAudit(session.user.id, "delete", "racks", id, existing as Record<string, unknown>, null);

    if (!deleted) return errorResponse("Rack not found", 404);
    return successResponse({ message: "Rack deleted" });
});
