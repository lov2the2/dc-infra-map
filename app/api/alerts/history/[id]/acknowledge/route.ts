import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { alertHistory } from "@/db/schema/alerts";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_history", "update")) return errorResponse("Forbidden", 403);

        const { id } = await params;
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
    } catch (error) {
        return handleApiError(error);
    }
}
