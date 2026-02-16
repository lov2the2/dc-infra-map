import type { AlertRule, AlertHistory } from "@/types/alerts";

// Mock power feed data for evaluation
const MOCK_POWER_FEEDS = [
    { id: "pf-1", name: "PDU-A1", amperage: 85, maxAmperage: 100, voltage: 208 },
    { id: "pf-2", name: "PDU-A2", amperage: 92, maxAmperage: 100, voltage: 208 },
    { id: "pf-3", name: "PDU-B1", amperage: 45, maxAmperage: 100, voltage: 208 },
    { id: "pf-4", name: "PDU-B2", amperage: 30, maxAmperage: 100, voltage: 208 },
];

function usagePercent(feed: { amperage: number; maxAmperage: number }): number {
    return (feed.amperage / feed.maxAmperage) * 100;
}

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

export function evaluatePowerThreshold(rule: AlertRule): Omit<AlertHistory, "id" | "createdAt">[] {
    const threshold = parseFloat(rule.thresholdValue);
    const triggered: Omit<AlertHistory, "id" | "createdAt">[] = [];

    for (const feed of MOCK_POWER_FEEDS) {
        const actual = usagePercent(feed);
        if (compare(actual, rule.conditionOperator, threshold)) {
            triggered.push({
                ruleId: rule.id,
                severity: rule.severity,
                message: `Power feed "${feed.name}" usage is ${actual.toFixed(1)}% (threshold: ${rule.conditionOperator} ${threshold}%)`,
                resourceType: "power_feed",
                resourceId: feed.id,
                resourceName: feed.name,
                thresholdValue: rule.thresholdValue,
                actualValue: actual.toFixed(2),
                acknowledgedAt: null,
                acknowledgedBy: null,
                resolvedAt: null,
            });
        }
    }

    return triggered;
}
