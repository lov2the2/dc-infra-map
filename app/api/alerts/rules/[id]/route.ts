import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import {
    getMockAlertRuleById,
    updateMockAlertRule,
    deleteMockAlertRule,
} from "@/lib/alerts/evaluate";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_rules", "read")) return errorResponse("Forbidden", 403);

        const { id } = await params;
        const rule = getMockAlertRuleById(id);
        if (!rule) return errorResponse("Alert rule not found", 404);

        return successResponse(rule);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_rules", "update")) return errorResponse("Forbidden", 403);

        const { id } = await params;
        const body = await req.json();
        const updated = updateMockAlertRule(id, body);
        if (!updated) return errorResponse("Alert rule not found", 404);

        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_rules", "delete")) return errorResponse("Forbidden", 403);

        const { id } = await params;
        const deleted = deleteMockAlertRule(id);
        if (!deleted) return errorResponse("Alert rule not found", 404);

        return successResponse({ message: "Alert rule deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
