import { successResponse, errorResponse } from "@/lib/api";
import { isAdmin } from "@/lib/auth/rbac";
import { evaluateAllRules } from "@/lib/alerts/evaluate";
import { withAuthOnly } from "@/lib/auth/with-auth";

export const POST = withAuthOnly(async (_req, session) => {
    if (!isAdmin(session.user.role)) return errorResponse("Forbidden - admin only", 403);

    const triggered = await evaluateAllRules();

    return successResponse({
        message: `Evaluation complete. ${triggered.length} new alert(s) triggered.`,
        count: triggered.length,
        alerts: triggered,
    });
});
