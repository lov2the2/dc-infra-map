import { db } from "@/db";
import { alertRules } from "@/db/schema/alerts";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, getRouteId } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("alert_rules", "read", async (req, _session) => {
    const id = getRouteId(req);
    const [rule] = await db.select().from(alertRules).where(eq(alertRules.id, id));
    if (!rule) return errorResponse("Alert rule not found", 404);

    return successResponse(rule);
});

export const PATCH = withAuth("alert_rules", "update", async (req, session) => {
    const id = getRouteId(req);

    const [existing] = await db.select().from(alertRules).where(eq(alertRules.id, id));
    if (!existing) return errorResponse("Alert rule not found", 404);

    const body = await req.json();
    const [updated] = await db
        .update(alertRules)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(alertRules.id, id))
        .returning();

    await logAudit(
        session.user.id,
        "update",
        "alert_rules",
        id,
        existing as unknown as Record<string, unknown>,
        updated as unknown as Record<string, unknown>,
    );

    return successResponse(updated);
});

export const DELETE = withAuth("alert_rules", "delete", async (req, session) => {
    const id = getRouteId(req);
    const [deleted] = await db.delete(alertRules).where(eq(alertRules.id, id)).returning();
    if (!deleted) return errorResponse("Alert rule not found", 404);

    await logAudit(session.user.id, "delete", "alert_rules", id, deleted as unknown as Record<string, unknown>, null);

    return successResponse({ message: "Alert rule deleted" });
});
