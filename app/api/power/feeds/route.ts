import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { powerFeeds } from "@/db/schema";
import { successResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { powerFeedCreateSchema } from "@/lib/validators/power";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("power_config", "read", async (req, _session) => {
    const { searchParams } = new URL(req.url);
    const panelId = searchParams.get("panelId");
    const rackId = searchParams.get("rackId");

    const conditions = [isNull(powerFeeds.deletedAt)];
    if (panelId) conditions.push(eq(powerFeeds.panelId, panelId));
    if (rackId) conditions.push(eq(powerFeeds.rackId, rackId));

    const result = await db.query.powerFeeds.findMany({
        where: and(...conditions),
        with: { panel: true, rack: true },
        orderBy: (t, { asc }) => [asc(t.name)],
    });

    return successResponse(result);
});

export const POST = withAuth("power_config", "create", async (req, session) => {
    const body = await req.json();
    const parsed = powerFeedCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const [feed] = await db.insert(powerFeeds).values(parsed.data).returning();

    await logAudit(session.user.id, "create", "power_feeds", feed.id, null, feed as Record<string, unknown>);

    return successResponse(feed, 201);
});
