import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { isAdmin } from "@/lib/auth/rbac";
import { evaluateAllRules } from "@/lib/alerts/evaluate";

export async function POST() {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!isAdmin(session.user.role)) return errorResponse("Forbidden — admin only", 403);

        const triggered = await evaluateAllRules();

        return successResponse({
            message: `Evaluation complete. ${triggered.length} new alert(s) triggered.`,
            count: triggered.length,
            alerts: triggered,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
