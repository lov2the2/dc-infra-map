import type { AlertRule, AlertHistory, NotificationChannel } from "@/types/alerts";
import { evaluatePowerThreshold } from "./evaluators/power";
import { evaluateWarrantyExpiry } from "./evaluators/warranty";
import { evaluateRackCapacity } from "./evaluators/rack-capacity";
import { dispatchNotifications } from "./notify";

// Mock data stores — in a real application these would be DB queries
const MOCK_ALERT_HISTORY: AlertHistory[] = [
    {
        id: "hist-1",
        ruleId: "rule-1",
        severity: "critical",
        message: 'Power feed "PDU-A2" usage is 92.0% (threshold: gt 90%)',
        resourceType: "power_feed",
        resourceId: "pf-2",
        resourceName: "PDU-A2",
        thresholdValue: "90",
        actualValue: "92.00",
        acknowledgedAt: null,
        acknowledgedBy: null,
        resolvedAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
        id: "hist-2",
        ruleId: "rule-2",
        severity: "warning",
        message: 'Rack "DC1-B01" capacity is 95.2% (40U / 42U used, threshold: gt 90%)',
        resourceType: "rack",
        resourceId: "rack-3",
        resourceName: "DC1-B01",
        thresholdValue: "90",
        actualValue: "95.24",
        acknowledgedAt: null,
        acknowledgedBy: null,
        resolvedAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
        id: "hist-3",
        ruleId: "rule-3",
        severity: "warning",
        message: 'Device "Firewall-01" warranty expires in 12 day(s) (2026-02-28)',
        resourceType: "device",
        resourceId: "dev-5",
        resourceName: "Firewall-01",
        thresholdValue: "30",
        actualValue: "12",
        acknowledgedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        acknowledgedBy: "admin@example.com",
        resolvedAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
];

let MOCK_ALERT_RULES: AlertRule[] = [
    {
        id: "rule-1",
        name: "High Power Usage",
        ruleType: "power_threshold",
        resource: "power_feeds",
        conditionField: "usage_percent",
        conditionOperator: "gt",
        thresholdValue: "90",
        severity: "critical",
        enabled: true,
        notificationChannels: ["chan-1"],
        cooldownMinutes: 60,
        createdBy: "admin",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    },
    {
        id: "rule-2",
        name: "Rack Capacity Warning",
        ruleType: "rack_capacity",
        resource: "racks",
        conditionField: "usage_percent",
        conditionOperator: "gt",
        thresholdValue: "90",
        severity: "warning",
        enabled: true,
        notificationChannels: ["chan-1", "chan-2"],
        cooldownMinutes: 120,
        createdBy: "admin",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
    {
        id: "rule-3",
        name: "Warranty Expiry Alert",
        ruleType: "warranty_expiry",
        resource: "devices",
        conditionField: "days_until_expiry",
        conditionOperator: "lte",
        thresholdValue: "30",
        severity: "warning",
        enabled: true,
        notificationChannels: ["chan-2"],
        cooldownMinutes: 1440,
        createdBy: "admin",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
];

let MOCK_NOTIFICATION_CHANNELS: NotificationChannel[] = [
    {
        id: "chan-1",
        name: "Ops Slack",
        channelType: "slack_webhook",
        config: { webhookUrl: "https://hooks.slack.com/services/MOCK/WEBHOOK/URL" },
        enabled: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    },
    {
        id: "chan-2",
        name: "NOC Email",
        channelType: "email",
        config: { emailAddresses: "noc@example.com,alerts@example.com" },
        enabled: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    },
    {
        id: "chan-3",
        name: "In-App Notifications",
        channelType: "in_app",
        config: {},
        enabled: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    },
];

// --- Accessors (used by API routes as mock DB layer) ---

export function getMockAlertRules(): AlertRule[] {
    return [...MOCK_ALERT_RULES];
}

export function getMockAlertRuleById(id: string): AlertRule | undefined {
    return MOCK_ALERT_RULES.find((r) => r.id === id);
}

export function createMockAlertRule(data: Omit<AlertRule, "id" | "createdAt" | "updatedAt">): AlertRule {
    const rule: AlertRule = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    MOCK_ALERT_RULES.push(rule);
    return rule;
}

export function updateMockAlertRule(id: string, data: Partial<AlertRule>): AlertRule | null {
    const index = MOCK_ALERT_RULES.findIndex((r) => r.id === id);
    if (index === -1) return null;
    MOCK_ALERT_RULES[index] = { ...MOCK_ALERT_RULES[index], ...data, updatedAt: new Date().toISOString() };
    return MOCK_ALERT_RULES[index];
}

export function deleteMockAlertRule(id: string): boolean {
    const before = MOCK_ALERT_RULES.length;
    MOCK_ALERT_RULES = MOCK_ALERT_RULES.filter((r) => r.id !== id);
    return MOCK_ALERT_RULES.length < before;
}

export function getMockAlertHistory(): AlertHistory[] {
    return [...MOCK_ALERT_HISTORY].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getMockAlertHistoryById(id: string): AlertHistory | undefined {
    return MOCK_ALERT_HISTORY.find((h) => h.id === id);
}

export function acknowledgeMockAlert(id: string, acknowledgedBy: string): AlertHistory | null {
    const index = MOCK_ALERT_HISTORY.findIndex((h) => h.id === id);
    if (index === -1) return null;
    MOCK_ALERT_HISTORY[index] = {
        ...MOCK_ALERT_HISTORY[index],
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy,
    };
    return MOCK_ALERT_HISTORY[index];
}

export function getMockNotificationChannels(): NotificationChannel[] {
    return [...MOCK_NOTIFICATION_CHANNELS];
}

export function getMockNotificationChannelById(id: string): NotificationChannel | undefined {
    return MOCK_NOTIFICATION_CHANNELS.find((c) => c.id === id);
}

export function createMockNotificationChannel(data: Omit<NotificationChannel, "id" | "createdAt" | "updatedAt">): NotificationChannel {
    const channel: NotificationChannel = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    MOCK_NOTIFICATION_CHANNELS.push(channel);
    return channel;
}

export function updateMockNotificationChannel(id: string, data: Partial<NotificationChannel>): NotificationChannel | null {
    const index = MOCK_NOTIFICATION_CHANNELS.findIndex((c) => c.id === id);
    if (index === -1) return null;
    MOCK_NOTIFICATION_CHANNELS[index] = {
        ...MOCK_NOTIFICATION_CHANNELS[index],
        ...data,
        updatedAt: new Date().toISOString(),
    };
    return MOCK_NOTIFICATION_CHANNELS[index];
}

export function deleteMockNotificationChannel(id: string): boolean {
    const before = MOCK_NOTIFICATION_CHANNELS.length;
    MOCK_NOTIFICATION_CHANNELS = MOCK_NOTIFICATION_CHANNELS.filter((c) => c.id !== id);
    return MOCK_NOTIFICATION_CHANNELS.length < before;
}

// --- Core evaluation logic ---

export async function evaluateAllRules(): Promise<AlertHistory[]> {
    const rules = getMockAlertRules().filter((r) => r.enabled);
    const newAlerts: AlertHistory[] = [];

    for (const rule of rules) {
        let triggered: Omit<AlertHistory, "id" | "createdAt">[] = [];

        switch (rule.ruleType) {
            case "power_threshold":
                triggered = evaluatePowerThreshold(rule);
                break;
            case "warranty_expiry":
                triggered = evaluateWarrantyExpiry(rule);
                break;
            case "rack_capacity":
                triggered = evaluateRackCapacity(rule);
                break;
        }

        for (const alert of triggered) {
            const newAlert: AlertHistory = {
                ...alert,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            };
            MOCK_ALERT_HISTORY.push(newAlert);
            newAlerts.push(newAlert);

            // Dispatch notifications
            const channelObjects = getMockNotificationChannels().filter(
                (c) => rule.notificationChannels.includes(c.id)
            );
            await dispatchNotifications(channelObjects, alert);
        }
    }

    return newAlerts;
}
