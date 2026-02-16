import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { alertRules } from "@/db/schema/alerts";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";
import type { AlertRuleFormData } from "@/types/alerts";

export async function GET() {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "alert_rules", "read")) return errorResponse("Forbidden", 403);

        const rules = await db.select().from(alertRules);
        return successResponse(rules);
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

        const [rule] = await db.insert(alertRules).values({
            name: body.name,
            ruleType: body.ruleType,
            resource: body.resource,
            conditionField: body.conditionField,
            conditionOperator: body.conditionOperator,
            thresholdValue: body.thresholdValue,
            severity: body.severity,
            enabled: body.enabled ?? true,
            notificationChannels: body.notificationChannels ?? [],
            cooldownMinutes: body.cooldownMinutes ?? 60,
            createdBy: session.user.email ?? session.user.id,
        }).returning();

        await logAudit(session.user.id, "create", "alert_rules", rule.id, null, rule as unknown as Record<string, unknown>);

        return successResponse(rule, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
