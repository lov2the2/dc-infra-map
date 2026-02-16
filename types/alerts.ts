export type AlertRuleType = "power_threshold" | "warranty_expiry" | "rack_capacity";
export type AlertSeverity = "critical" | "warning" | "info";
export type NotificationChannelType = "slack_webhook" | "email" | "in_app";
export type ConditionOperator = "gt" | "lt" | "gte" | "lte" | "eq";

export interface AlertRule {
    id: string;
    name: string;
    ruleType: AlertRuleType;
    resource: string;
    conditionField: string;
    conditionOperator: ConditionOperator;
    thresholdValue: string;
    severity: AlertSeverity;
    enabled: boolean;
    notificationChannels: string[];
    cooldownMinutes: number;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AlertHistory {
    id: string;
    ruleId: string | null;
    severity: AlertSeverity;
    message: string;
    resourceType: string;
    resourceId: string;
    resourceName: string;
    thresholdValue: string | null;
    actualValue: string | null;
    acknowledgedAt: string | null;
    acknowledgedBy: string | null;
    resolvedAt: string | null;
    createdAt: string;
}

export interface NotificationChannel {
    id: string;
    name: string;
    channelType: NotificationChannelType;
    config: Record<string, string>;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

// Form types
export interface AlertRuleFormData {
    name: string;
    ruleType: AlertRuleType;
    resource: string;
    conditionField: string;
    conditionOperator: ConditionOperator;
    thresholdValue: string;
    severity: AlertSeverity;
    enabled: boolean;
    notificationChannels: string[];
    cooldownMinutes: number;
}

export interface NotificationChannelFormData {
    name: string;
    channelType: NotificationChannelType;
    config: Record<string, string>;
    enabled: boolean;
}

// Alert stats
export interface AlertStats {
    totalRules: number;
    enabledRules: number;
    totalChannels: number;
    criticalAlerts: number;
    warningAlerts: number;
    unacknowledgedAlerts: number;
}
