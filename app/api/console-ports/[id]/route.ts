import { eq } from "drizzle-orm";
import { db } from "@/db";
import { consolePorts } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, getRouteId } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { consolePortUpdateSchema } from "@/lib/validators/cable";
import { withAuth, withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (req, _session) => {
    const id = getRouteId(req);
    const port = await db.query.consolePorts.findFirst({
        where: eq(consolePorts.id, id),
        with: { device: true },
    });

    if (!port) return errorResponse("Console port not found", 404);
    return successResponse(port);
});

export const PATCH = withAuth("cables", "update", async (req, session) => {
    const id = getRouteId(req);
    const body = await req.json();
    const parsed = consolePortUpdateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await db.query.consolePorts.findFirst({ where: eq(consolePorts.id, id) });
    if (!existing) return errorResponse("Console port not found", 404);

    const { reason, ...data } = parsed.data;
    const [updated] = await db
        .update(consolePorts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(consolePorts.id, id))
        .returning();

    await logAudit(session.user.id, "update", "console_ports", id, existing as Record<string, unknown>, updated as Record<string, unknown>, reason);

    return successResponse(updated);
});

export const DELETE = withAuth("cables", "delete", async (req, session) => {
    const id = getRouteId(req);
    const existing = await db.query.consolePorts.findFirst({ where: eq(consolePorts.id, id) });
    if (!existing) return errorResponse("Console port not found", 404);

    const [deleted] = await db
        .update(consolePorts)
        .set({ deletedAt: new Date() })
        .where(eq(consolePorts.id, id))
        .returning();

    await logAudit(session.user.id, "delete", "console_ports", id, existing as Record<string, unknown>, null);

    if (!deleted) return errorResponse("Console port not found", 404);
    return successResponse({ message: "Console port deleted" });
});
