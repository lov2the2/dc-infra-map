import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { powerPanels } from "@/db/schema";
import { successResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { powerPanelCreateSchema } from "@/lib/validators/power";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("power_config", "read", async (req, _session) => {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    const conditions = [isNull(powerPanels.deletedAt)];
    if (siteId) conditions.push(eq(powerPanels.siteId, siteId));

    const result = await db.query.powerPanels.findMany({
        where: and(...conditions),
        with: { powerFeeds: true, site: true },
        orderBy: (t, { asc }) => [asc(t.name)],
    });

    return successResponse(result);
});

export const POST = withAuth("power_config", "create", async (req, session) => {
    const body = await req.json();
    const parsed = powerPanelCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const [panel] = await db.insert(powerPanels).values(parsed.data).returning();

    await logAudit(session.user.id, "create", "power_panels", panel.id, null, panel as Record<string, unknown>);

    return successResponse(panel, 201);
});
