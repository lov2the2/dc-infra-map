import { db } from "@/db";
import { alertRules, alertHistory, notificationChannels } from "@/db/schema/alerts";
import { eq, inArray } from "drizzle-orm";
import type { AlertHistory as AlertHistoryType } from "@/types/alerts";
import { evaluatePowerThreshold } from "./evaluators/power";
import { evaluateWarrantyExpiry } from "./evaluators/warranty";
import { evaluateRackCapacity } from "./evaluators/rack-capacity";
import { dispatchNotifications } from "./notify";

// Core evaluation logic — queries enabled rules from DB, runs evaluators,
// inserts results into alertHistory, and dispatches notifications.
export async function evaluateAllRules(): Promise<AlertHistoryType[]> {
    const rules = await db
        .select()
        .from(alertRules)
        .where(eq(alertRules.enabled, true));

    const newAlerts: AlertHistoryType[] = [];

    for (const rule of rules) {
        // Map DB row to the AlertRule type expected by evaluators
        const ruleForEval = {
            ...rule,
            thresholdValue: String(rule.thresholdValue),
            createdAt: rule.createdAt.toISOString(),
            updatedAt: rule.updatedAt.toISOString(),
        };

        let triggered: Omit<AlertHistoryType, "id" | "createdAt">[] = [];

        switch (rule.ruleType) {
            case "power_threshold":
                triggered = await evaluatePowerThreshold(ruleForEval);
                break;
            case "warranty_expiry":
                triggered = await evaluateWarrantyExpiry(ruleForEval);
                break;
            case "rack_capacity":
                triggered = await evaluateRackCapacity(ruleForEval);
                break;
        }

        for (const alert of triggered) {
            const [inserted] = await db
                .insert(alertHistory)
                .values({
                    ruleId: alert.ruleId,
                    severity: alert.severity,
                    message: alert.message,
                    resourceType: alert.resourceType,
                    resourceId: alert.resourceId,
                    resourceName: alert.resourceName,
                    thresholdValue: alert.thresholdValue,
                    actualValue: alert.actualValue,
                })
                .returning();

            const newAlert: AlertHistoryType = {
                id: inserted.id,
                ruleId: inserted.ruleId,
                severity: inserted.severity,
                message: inserted.message,
                resourceType: inserted.resourceType,
                resourceId: inserted.resourceId,
                resourceName: inserted.resourceName,
                thresholdValue: inserted.thresholdValue,
                actualValue: inserted.actualValue,
                acknowledgedAt: null,
                acknowledgedBy: null,
                resolvedAt: null,
                createdAt: inserted.createdAt.toISOString(),
            };
            newAlerts.push(newAlert);

            // Dispatch notifications to channels referenced by the rule
            const channelIds = rule.notificationChannels ?? [];
            if (channelIds.length > 0) {
                const channelRows = await db
                    .select()
                    .from(notificationChannels)
                    .where(inArray(notificationChannels.id, channelIds));

                const channelObjects = channelRows.map((c) => ({
                    ...c,
                    createdAt: c.createdAt.toISOString(),
                    updatedAt: c.updatedAt.toISOString(),
                }));

                await dispatchNotifications(channelObjects, alert);
            }
        }
    }

    return newAlerts;
}
