import {
    pgTable,
    text,
    timestamp,
    integer,
    jsonb,
    real,
} from "drizzle-orm/pg-core";
import { siteStatusEnum, rackTypeEnum } from "./enums";

// Shared timestamp columns
const timestamps = {
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const manufacturers = pgTable("manufacturers", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    ...timestamps,
});

export const tenants = pgTable("tenants", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    ...timestamps,
});

export const regions = pgTable("regions", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    ...timestamps,
});

export const sites = pgTable("sites", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    status: siteStatusEnum("status").default("active").notNull(),
    regionId: text("region_id").references(() => regions.id),
    tenantId: text("tenant_id").references(() => tenants.id),
    facility: text("facility"),
    address: text("address"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    description: text("description"),
    customFields: jsonb("custom_fields").$type<Record<string, unknown>>(),
    ...timestamps,
});

export const locations = pgTable("locations", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    siteId: text("site_id")
        .notNull()
        .references(() => sites.id),
    tenantId: text("tenant_id").references(() => tenants.id),
    description: text("description"),
    ...timestamps,
});

export const racks = pgTable("racks", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    locationId: text("location_id")
        .notNull()
        .references(() => locations.id),
    tenantId: text("tenant_id").references(() => tenants.id),
    type: rackTypeEnum("type").default("server").notNull(),
    uHeight: integer("u_height").default(42).notNull(),
    posX: integer("pos_x"),
    posY: integer("pos_y"),
    rotation: integer("rotation").default(0),
    description: text("description"),
    customFields: jsonb("custom_fields").$type<Record<string, unknown>>(),
    ...timestamps,
});
