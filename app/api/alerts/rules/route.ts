import { db } from "@/db";
import { alertRules } from "@/db/schema/alerts";
import { successResponse, errorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import type { AlertRuleFormData } from "@/types/alerts";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("alert_rules", "read", async (_req, _session) => {
    const rules = await db.select().from(alertRules);
    return successResponse(rules);
});

export const POST = withAuth("alert_rules", "create", async (req, session) => {
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
});
