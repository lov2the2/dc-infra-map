import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { acknowledgeMockAlert } from "@/lib/alerts/evaluate";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_history", "update")) return errorResponse("Forbidden", 403);

        const { id } = await params;
        const acknowledgedBy = session.user.email ?? session.user.id;
        const updated = acknowledgeMockAlert(id, acknowledgedBy);
        if (!updated) return errorResponse("Alert history entry not found", 404);

        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
}
