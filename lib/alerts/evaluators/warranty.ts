import type { AlertRule, AlertHistory } from "@/types/alerts";

// Mock device data with warranty expiry dates
const MOCK_DEVICES = [
    { id: "dev-1", name: "Core-SW-01", warrantyExpiry: "2026-03-15" },
    { id: "dev-2", name: "Core-SW-02", warrantyExpiry: "2026-04-20" },
    { id: "dev-3", name: "Server-A01", warrantyExpiry: "2025-12-31" },
    { id: "dev-4", name: "Server-B01", warrantyExpiry: "2027-06-30" },
    { id: "dev-5", name: "Firewall-01", warrantyExpiry: "2026-02-28" },
];

export function evaluateWarrantyExpiry(rule: AlertRule): Omit<AlertHistory, "id" | "createdAt">[] {
    // thresholdValue = days before expiry to trigger alert
    const daysThreshold = parseFloat(rule.thresholdValue);
    const now = new Date();
    const triggered: Omit<AlertHistory, "id" | "createdAt">[] = [];

    for (const device of MOCK_DEVICES) {
        const expiryDate = new Date(device.warrantyExpiry);
        const daysUntilExpiry = Math.ceil(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= daysThreshold) {
            const message =
                daysUntilExpiry <= 0
                    ? `Device "${device.name}" warranty expired ${Math.abs(daysUntilExpiry)} days ago`
                    : `Device "${device.name}" warranty expires in ${daysUntilExpiry} day(s) (${device.warrantyExpiry})`;

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
