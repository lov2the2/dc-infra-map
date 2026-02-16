import type { AlertRule, AlertHistory } from "@/types/alerts";

// Mock rack data with U-space usage
const MOCK_RACKS = [
    { id: "rack-1", name: "DC1-A01", totalU: 42, usedU: 38 },
    { id: "rack-2", name: "DC1-A02", totalU: 42, usedU: 21 },
    { id: "rack-3", name: "DC1-B01", totalU: 42, usedU: 40 },
    { id: "rack-4", name: "DC1-B02", totalU: 42, usedU: 10 },
    { id: "rack-5", name: "DC2-A01", totalU: 48, usedU: 44 },
];

function usagePercent(rack: { usedU: number; totalU: number }): number {
    return (rack.usedU / rack.totalU) * 100;
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

export function evaluateRackCapacity(rule: AlertRule): Omit<AlertHistory, "id" | "createdAt">[] {
    const threshold = parseFloat(rule.thresholdValue);
    const triggered: Omit<AlertHistory, "id" | "createdAt">[] = [];

    for (const rack of MOCK_RACKS) {
        const actual = usagePercent(rack);
        if (compare(actual, rule.conditionOperator, threshold)) {
            triggered.push({
                ruleId: rule.id,
                severity: rule.severity,
                message: `Rack "${rack.name}" capacity is ${actual.toFixed(1)}% (${rack.usedU}U / ${rack.totalU}U used, threshold: ${rule.conditionOperator} ${threshold}%)`,
                resourceType: "rack",
                resourceId: rack.id,
                resourceName: rack.name,
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
