import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { auditActionTypeEnum } from "./enums";

export const auditLogs = pgTable("audit_logs", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => users.id),
    action: text("action").notNull(),
    actionType: auditActionTypeEnum("action_type"),
    tableName: text("table_name").notNull(),
    recordId: text("record_id").notNull(),
    changesBefore: jsonb("changes_before").$type<Record<string, unknown>>(),
    changesAfter: jsonb("changes_after").$type<Record<string, unknown>>(),
    reason: text("reason"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
