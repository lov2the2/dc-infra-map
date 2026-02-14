import {
    pgTable,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { accessTypeEnum, accessStatusEnum, equipmentMovementTypeEnum, equipmentMovementStatusEnum } from "./enums";
import { sites, racks } from "./core";
import { users } from "./auth";
import { devices } from "./devices";

// Shared timestamp columns
const timestamps = {
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const accessLogs = pgTable("access_logs", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    siteId: text("site_id")
        .notNull()
        .references(() => sites.id),
    personnelName: text("personnel_name").notNull(),
    company: text("company"),
    contactPhone: text("contact_phone"),
    accessType: accessTypeEnum("access_type").notNull(),
    status: accessStatusEnum("status").default("checked_in").notNull(),
    purpose: text("purpose"),
    escortName: text("escort_name"),
    badgeNumber: text("badge_number"),
    checkInAt: timestamp("check_in_at", { withTimezone: true }).defaultNow().notNull(),
    expectedCheckOutAt: timestamp("expected_check_out_at", { withTimezone: true }),
    actualCheckOutAt: timestamp("actual_check_out_at", { withTimezone: true }),
    checkOutNote: text("check_out_note"),
    createdBy: text("created_by").references(() => users.id),
    ...timestamps,
});

export const equipmentMovements = pgTable("equipment_movements", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    siteId: text("site_id")
        .notNull()
        .references(() => sites.id),
    rackId: text("rack_id").references(() => racks.id),
    deviceId: text("device_id").references(() => devices.id),
    movementType: equipmentMovementTypeEnum("movement_type").notNull(),
    status: equipmentMovementStatusEnum("status").default("pending").notNull(),
    description: text("description"),
    requestedBy: text("requested_by")
        .notNull()
        .references(() => users.id),
    approvedBy: text("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    serialNumber: text("serial_number"),
    assetTag: text("asset_tag"),
    notes: text("notes"),
    ...timestamps,
});
