import { db } from "@/db";
import { alertHistory } from "@/db/schema/alerts";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { withAuth } from "@/lib/auth/with-auth";

export const PATCH = withAuth("alert_history", "update", async (req, session) => {
    // URL: /api/alerts/history/[id]/acknowledge — id is second-to-last segment
    const segments = req.nextUrl.pathname.split("/");
    const id = segments[segments.length - 2];
    const acknowledgedBy = session.user.email ?? session.user.id;

    const [existing] = await db.select().from(alertHistory).where(eq(alertHistory.id, id));
    if (!existing) return errorResponse("Alert history entry not found", 404);

    const [updated] = await db
        .update(alertHistory)
        .set({
            acknowledgedAt: new Date(),
            acknowledgedBy,
        })
        .where(eq(alertHistory.id, id))
        .returning();

    await logAudit(
        session.user.id,
        "update",
        "alert_history",
        id,
        existing as unknown as Record<string, unknown>,
        updated as unknown as Record<string, unknown>,
    );

    return successResponse(updated);
});
