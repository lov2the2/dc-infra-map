import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { getMockAlertHistory } from "@/lib/alerts/evaluate";

export async function GET() {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_history", "read")) return errorResponse("Forbidden", 403);

        return successResponse(getMockAlertHistory());
    } catch (error) {
        return handleApiError(error);
    }
}
