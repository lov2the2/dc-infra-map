import { db } from "@/db";
import { powerFeeds } from "@/db/schema/power";
import { powerReadings } from "@/db/schema/power";
import { eq, desc } from "drizzle-orm";
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

export async function evaluatePowerThreshold(rule: AlertRule): Promise<Omit<AlertHistory, "id" | "createdAt">[]> {
    const threshold = parseFloat(rule.thresholdValue);
    const triggered: Omit<AlertHistory, "id" | "createdAt">[] = [];

    const feeds = await db.select().from(powerFeeds);

    for (const feed of feeds) {
        // Get the latest power reading for this feed
        const [latestReading] = await db
            .select()
            .from(powerReadings)
            .where(eq(powerReadings.feedId, feed.id))
            .orderBy(desc(powerReadings.recordedAt))
            .limit(1);

        if (!latestReading) continue;

        // Calculate usage percent: (currentKw / ratedKw) * 100
        const usagePercent = (latestReading.powerKw / feed.ratedKw) * 100;

        if (compare(usagePercent, rule.conditionOperator, threshold)) {
            triggered.push({
                ruleId: rule.id,
                severity: rule.severity,
                message: `Power feed "${feed.name}" usage is ${usagePercent.toFixed(1)}% (${latestReading.powerKw.toFixed(1)}kW / ${feed.ratedKw}kW, threshold: ${rule.conditionOperator} ${threshold}%)`,
                resourceType: "power_feed",
                resourceId: feed.id,
                resourceName: feed.name,
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
