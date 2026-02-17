import { eq } from "drizzle-orm";
import { db } from "@/db";
import { powerFeeds } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { powerFeedUpdateSchema } from "@/lib/validators/power";
import { withAuth, withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const feed = await db.query.powerFeeds.findFirst({
        where: eq(powerFeeds.id, id),
        with: { panel: true, rack: true, powerPorts: true },
    });

    if (!feed) return errorResponse("Power feed not found", 404);
    return successResponse(feed);
});

export const PATCH = withAuth("power_config", "update", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const body = await req.json();
    const parsed = powerFeedUpdateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await db.query.powerFeeds.findFirst({ where: eq(powerFeeds.id, id) });
    if (!existing) return errorResponse("Power feed not found", 404);

    const [updated] = await db
        .update(powerFeeds)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(powerFeeds.id, id))
        .returning();

    await logAudit(session.user.id, "update", "power_feeds", id, existing as Record<string, unknown>, updated as Record<string, unknown>);

    return successResponse(updated);
});

export const DELETE = withAuth("power_config", "delete", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const existing = await db.query.powerFeeds.findFirst({ where: eq(powerFeeds.id, id) });
    if (!existing) return errorResponse("Power feed not found", 404);

    await db
        .update(powerFeeds)
        .set({ deletedAt: new Date() })
        .where(eq(powerFeeds.id, id));

    await logAudit(session.user.id, "delete", "power_feeds", id, existing as Record<string, unknown>, null);

    return successResponse({ message: "Power feed deleted" });
});
