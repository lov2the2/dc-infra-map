import { eq } from "drizzle-orm";
import { db } from "@/db";
import { frontPorts } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, getRouteId } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { frontPortUpdateSchema } from "@/lib/validators/cable";
import { withAuth, withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (req, _session) => {
    const id = getRouteId(req);
    const port = await db.query.frontPorts.findFirst({
        where: eq(frontPorts.id, id),
        with: { device: true, rearPort: true },
    });

    if (!port) return errorResponse("Front port not found", 404);
    return successResponse(port);
});

export const PATCH = withAuth("cables", "update", async (req, session) => {
    const id = getRouteId(req);
    const body = await req.json();
    const parsed = frontPortUpdateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await db.query.frontPorts.findFirst({ where: eq(frontPorts.id, id) });
    if (!existing) return errorResponse("Front port not found", 404);

    const { reason, ...data } = parsed.data;
    const [updated] = await db
        .update(frontPorts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(frontPorts.id, id))
        .returning();

    await logAudit(session.user.id, "update", "front_ports", id, existing as Record<string, unknown>, updated as Record<string, unknown>, reason);

    return successResponse(updated);
});

export const DELETE = withAuth("cables", "delete", async (req, session) => {
    const id = getRouteId(req);
    const existing = await db.query.frontPorts.findFirst({ where: eq(frontPorts.id, id) });
    if (!existing) return errorResponse("Front port not found", 404);

    const [deleted] = await db
        .update(frontPorts)
        .set({ deletedAt: new Date() })
        .where(eq(frontPorts.id, id))
        .returning();

    await logAudit(session.user.id, "delete", "front_ports", id, existing as Record<string, unknown>, null);

    if (!deleted) return errorResponse("Front port not found", 404);
    return successResponse({ message: "Front port deleted" });
});
