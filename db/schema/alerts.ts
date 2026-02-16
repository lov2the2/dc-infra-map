import {
    pgTable,
    text,
    timestamp,
    integer,
    boolean,
    numeric,
    jsonb,
} from "drizzle-orm/pg-core";
import {
    alertRuleTypeEnum,
    alertSeverityEnum,
    notificationChannelTypeEnum,
    conditionOperatorEnum,
} from "./enums";

// Shared timestamp columns
const timestamps = {
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const alertRules = pgTable("alert_rules", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    ruleType: alertRuleTypeEnum("rule_type").notNull(),
    resource: text("resource").notNull(), // e.g. 'racks', 'devices', 'power_feeds'
    conditionField: text("condition_field").notNull(),
    conditionOperator: conditionOperatorEnum("condition_operator").notNull(),
    thresholdValue: numeric("threshold_value").notNull(),
    severity: alertSeverityEnum("severity").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    notificationChannels: jsonb("notification_channels").$type<string[]>().default([]).notNull(),
    cooldownMinutes: integer("cooldown_minutes").default(60).notNull(),
    createdBy: text("created_by"),
    ...timestamps,
});

export const alertHistory = pgTable("alert_history", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    ruleId: text("rule_id").references(() => alertRules.id),
    severity: alertSeverityEnum("severity").notNull(),
    message: text("message").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    resourceName: text("resource_name").notNull(),
    thresholdValue: numeric("threshold_value"),
    actualValue: numeric("actual_value"),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    acknowledgedBy: text("acknowledged_by"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notificationChannels = pgTable("notification_channels", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    channelType: notificationChannelTypeEnum("channel_type").notNull(),
    config: jsonb("config").$type<Record<string, string>>().default({}).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    ...timestamps,
});
