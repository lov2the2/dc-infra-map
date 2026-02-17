import { db } from "@/db";
import { racks } from "@/db/schema/core";
import { devices } from "@/db/schema/devices";
import { deviceTypes } from "@/db/schema/devices";
import { eq, isNull } from "drizzle-orm";
import type { AlertRule, AlertHistory } from "@/types/alerts";

function compare(actual: number, operator: string, threshold: number): boolean {
    switch (operator) {
        case "gt": return actual > threshold;
        case "lt": return actual < threshold;
        case "gte": return actual >= threshold;
        case "lte": return actual <= threshold;
        case "eq": return actual === threshold;
        default: return false;
    }
}

export async function evaluateRackCapacity(rule: AlertRule): Promise<Omit<AlertHistory, "id" | "createdAt">[]> {
    const threshold = parseFloat(rule.thresholdValue);
    const triggered: Omit<AlertHistory, "id" | "createdAt">[] = [];

    const allRacks = await db.select().from(racks).where(isNull(racks.deletedAt));

    for (const rack of allRacks) {
        // Get devices in this rack with their device types for uHeight
        const rackDevices = await db
            .select({
                uHeight: deviceTypes.uHeight,
            })
            .from(devices)
            .innerJoin(deviceTypes, eq(devices.deviceTypeId, deviceTypes.id))
            .where(eq(devices.rackId, rack.id));

        const usedU = rackDevices.reduce((sum, d) => sum + d.uHeight, 0);
        const totalU = rack.uHeight;
        const usagePercent = totalU > 0 ? (usedU / totalU) * 100 : 0;

        if (compare(usagePercent, rule.conditionOperator, threshold)) {
            triggered.push({
                ruleId: rule.id,
                severity: rule.severity,
                message: `Rack "${rack.name}" capacity is ${usagePercent.toFixed(1)}% (${usedU}U / ${totalU}U used, threshold: ${rule.conditionOperator} ${threshold}%)`,
                resourceType: "rack",
                resourceId: rack.id,
                resourceName: rack.name,
                thresholdValue: rule.thresholdValue,
                actualValue: usagePercent.toFixed(2),
                acknowledgedAt: null,
                acknowledgedBy: null,
                resolvedAt: null,
            });
        }
    }

    return triggered;
}
