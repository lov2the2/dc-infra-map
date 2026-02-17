import { db } from "@/db";
import { notificationChannels } from "@/db/schema/alerts";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("alert_channels", "read", async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const [channel] = await db.select().from(notificationChannels).where(eq(notificationChannels.id, id));
    if (!channel) return errorResponse("Notification channel not found", 404);

    return successResponse(channel);
});

export const PATCH = withAuth("alert_channels", "update", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;

    const [existing] = await db.select().from(notificationChannels).where(eq(notificationChannels.id, id));
    if (!existing) return errorResponse("Notification channel not found", 404);

    const body = await req.json();
    const [updated] = await db
        .update(notificationChannels)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(notificationChannels.id, id))
        .returning();

    await logAudit(
        session.user.id,
        "update",
        "notification_channels",
        id,
        existing as unknown as Record<string, unknown>,
        updated as unknown as Record<string, unknown>,
    );

    return successResponse(updated);
});

export const DELETE = withAuth("alert_channels", "delete", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const [deleted] = await db.delete(notificationChannels).where(eq(notificationChannels.id, id)).returning();
    if (!deleted) return errorResponse("Notification channel not found", 404);

    await logAudit(session.user.id, "delete", "notification_channels", id, deleted as unknown as Record<string, unknown>, null);

    return successResponse({ message: "Notification channel deleted" });
});
