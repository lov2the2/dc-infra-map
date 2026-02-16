import { auth } from "@/auth";
import { db } from "@/db";
import { alertHistory } from "@/db/schema/alerts";
import { desc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";

export async function GET() {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_history", "read")) return errorResponse("Forbidden", 403);

        const history = await db
            .select()
            .from(alertHistory)
            .orderBy(desc(alertHistory.createdAt));

        return successResponse(history);
    } catch (error) {
        return handleApiError(error);
    }
}
