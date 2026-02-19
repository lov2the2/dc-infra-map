import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { reportTypeEnum, reportFrequencyEnum } from "./enums";

export const reportSchedules = pgTable("report_schedules", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    reportType: reportTypeEnum("report_type").notNull(),
    frequency: reportFrequencyEnum("frequency").notNull(),
    cronExpression: text("cron_expression").notNull(),
    recipientEmails: jsonb("recipient_emails").$type<string[]>().default([]).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
