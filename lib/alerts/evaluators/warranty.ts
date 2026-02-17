import { db } from "@/db";
import { devices } from "@/db/schema/devices";
import { isNotNull } from "drizzle-orm";
import type { AlertRule, AlertHistory } from "@/types/alerts";

export async function evaluateWarrantyExpiry(rule: AlertRule): Promise<Omit<AlertHistory, "id" | "createdAt">[]> {
    const daysThreshold = parseFloat(rule.thresholdValue);
    const now = new Date();
    const triggered: Omit<AlertHistory, "id" | "createdAt">[] = [];

    // Query devices that have a warranty expiry date set
    const devicesWithWarranty = await db
        .select()
        .from(devices)
        .where(isNotNull(devices.warrantyExpiresAt));

    for (const device of devicesWithWarranty) {
        const expiryDate = device.warrantyExpiresAt!;
        const daysUntilExpiry = Math.ceil(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= daysThreshold) {
            const message =
                daysUntilExpiry <= 0
                    ? `Device "${device.name}" warranty expired ${Math.abs(daysUntilExpiry)} days ago`
                    : `Device "${device.name}" warranty expires in ${daysUntilExpiry} day(s) (${expiryDate.toISOString().split("T")[0]})`;

            triggered.push({
                ruleId: rule.id,
                severity: rule.severity,
                message,
                resourceType: "device",
                resourceId: device.id,
                resourceName: device.name,
                thresholdValue: rule.thresholdValue,
                actualValue: daysUntilExpiry.toString(),
                acknowledgedAt: null,
                acknowledgedBy: null,
                resolvedAt: null,
            });
        }
    }

    return triggered;
}
