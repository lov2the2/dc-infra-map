import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { notificationChannels } from "@/db/schema/alerts";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_channels", "read")) return errorResponse("Forbidden", 403);

        const { id } = await params;
        const [channel] = await db.select().from(notificationChannels).where(eq(notificationChannels.id, id));
        if (!channel) return errorResponse("Notification channel not found", 404);

        return successResponse(channel);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_channels", "update")) return errorResponse("Forbidden", 403);

        const { id } = await params;

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
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_channels", "delete")) return errorResponse("Forbidden", 403);

        const { id } = await params;
        const [deleted] = await db.delete(notificationChannels).where(eq(notificationChannels.id, id)).returning();
        if (!deleted) return errorResponse("Notification channel not found", 404);

        await logAudit(session.user.id, "delete", "notification_channels", id, deleted as unknown as Record<string, unknown>, null);

        return successResponse({ message: "Notification channel deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
