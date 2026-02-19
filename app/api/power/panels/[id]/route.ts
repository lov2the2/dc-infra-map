import { eq } from "drizzle-orm";
import { db } from "@/db";
import { powerPanels } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, getRouteId } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { powerPanelUpdateSchema } from "@/lib/validators/power";
import { withAuth, withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (req, _session) => {
    const id = getRouteId(req);
    const panel = await db.query.powerPanels.findFirst({
        where: eq(powerPanels.id, id),
        with: { powerFeeds: { with: { rack: true } }, site: true },
    });

    if (!panel) return errorResponse("Power panel not found", 404);
    return successResponse(panel);
});

export const PATCH = withAuth("power_config", "update", async (req, session) => {
    const id = getRouteId(req);
    const body = await req.json();
    const parsed = powerPanelUpdateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await db.query.powerPanels.findFirst({ where: eq(powerPanels.id, id) });
    if (!existing) return errorResponse("Power panel not found", 404);

    const [updated] = await db
        .update(powerPanels)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(powerPanels.id, id))
        .returning();

    await logAudit(session.user.id, "update", "power_panels", id, existing as Record<string, unknown>, updated as Record<string, unknown>);

    return successResponse(updated);
});

export const DELETE = withAuth("power_config", "delete", async (req, session) => {
    const id = getRouteId(req);
    const existing = await db.query.powerPanels.findFirst({ where: eq(powerPanels.id, id) });
    if (!existing) return errorResponse("Power panel not found", 404);

    await db
        .update(powerPanels)
        .set({ deletedAt: new Date() })
        .where(eq(powerPanels.id, id));

    await logAudit(session.user.id, "delete", "power_panels", id, existing as Record<string, unknown>, null);

    return successResponse({ message: "Power panel deleted" });
});
