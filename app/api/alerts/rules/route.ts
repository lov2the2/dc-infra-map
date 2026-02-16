import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import {
    getMockAlertRules,
    createMockAlertRule,
} from "@/lib/alerts/evaluate";
import type { AlertRuleFormData } from "@/types/alerts";

export async function GET() {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_rules", "read")) return errorResponse("Forbidden", 403);

        return successResponse(getMockAlertRules());
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_rules", "create")) return errorResponse("Forbidden", 403);

        const body: AlertRuleFormData = await req.json();

        if (!body.name || !body.ruleType || !body.thresholdValue) {
            return errorResponse("name, ruleType, and thresholdValue are required", 400);
        }

        const rule = createMockAlertRule({
            ...body,
            createdBy: session.user.email ?? session.user.id,
        });

        return successResponse(rule, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
