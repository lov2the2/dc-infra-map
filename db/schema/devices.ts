import {
    pgTable,
    text,
    timestamp,
    integer,
    jsonb,
    real,
} from "drizzle-orm/pg-core";
import { deviceStatusEnum, deviceFaceEnum } from "./enums";
import { manufacturers, tenants, racks } from "./core";

const timestamps = {
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const deviceTypes = pgTable("device_types", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    manufacturerId: text("manufacturer_id")
        .notNull()
        .references(() => manufacturers.id),
    model: text("model").notNull(),
    slug: text("slug").notNull().unique(),
    uHeight: integer("u_height").default(1).notNull(),
    fullDepth: integer("full_depth").default(1).notNull(),
    weight: real("weight"),
    powerDraw: integer("power_draw"),
    interfaceTemplates: jsonb("interface_templates").$type<Record<string, unknown>>(),
    description: text("description"),
    ...timestamps,
});

export const devices = pgTable("devices", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    deviceTypeId: text("device_type_id")
        .notNull()
        .references(() => deviceTypes.id),
    rackId: text("rack_id").references(() => racks.id),
    tenantId: text("tenant_id").references(() => tenants.id),
    status: deviceStatusEnum("status").default("active").notNull(),
    face: deviceFaceEnum("face").default("front").notNull(),
    position: integer("position"),
    serialNumber: text("serial_number"),
    assetTag: text("asset_tag"),
    warrantyExpiresAt: timestamp("warranty_expires_at", { withTimezone: true }),
    primaryIp: text("primary_ip"),
    description: text("description"),
    customFields: jsonb("custom_fields").$type<Record<string, unknown>>(),
    ...timestamps,
});
