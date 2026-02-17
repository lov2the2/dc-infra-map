import {
    pgTable,
    text,
    timestamp,
    integer,
    real,
    boolean,
} from "drizzle-orm/pg-core";
import {
    powerFeedPhaseEnum,
    powerFeedTypeEnum,
    powerPortTypeEnum,
    powerOutletTypeEnum,
} from "./enums";
import { sites, racks } from "./core";
import { devices } from "./devices";

// Shared timestamp columns
const timestamps = {
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const powerPanels = pgTable("power_panels", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    siteId: text("site_id")
        .notNull()
        .references(() => sites.id),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    location: text("location"),
    ratedCapacityKw: real("rated_capacity_kw").notNull(),
    voltageV: integer("voltage_v").default(220).notNull(),
    phaseType: powerFeedPhaseEnum("phase_type").default("single").notNull(),
    ...timestamps,
});

export const powerFeeds = pgTable("power_feeds", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    panelId: text("panel_id")
        .notNull()
        .references(() => powerPanels.id),
    rackId: text("rack_id").references(() => racks.id),
    name: text("name").notNull(),
    feedType: powerFeedTypeEnum("feed_type").default("primary").notNull(),
    maxAmps: real("max_amps").notNull(),
    ratedKw: real("rated_kw").notNull(),
    ...timestamps,
});

export const powerPorts = pgTable("power_ports", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    feedId: text("feed_id")
        .notNull()
        .references(() => powerFeeds.id),
    portNumber: integer("port_number").notNull(),
    portType: powerPortTypeEnum("port_type").notNull(),
    outletType: powerOutletTypeEnum("outlet_type").notNull(),
    isOccupied: boolean("is_occupied").default(false).notNull(),
    deviceId: text("device_id").references(() => devices.id),
    ...timestamps,
});

export const powerOutlets = pgTable("power_outlets", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    portId: text("port_id").references(() => powerPorts.id),
    panelId: text("panel_id")
        .notNull()
        .references(() => powerPanels.id),
    label: text("label").notNull(),
    outletType: powerOutletTypeEnum("outlet_type").notNull(),
    maxAmps: real("max_amps").notNull(),
    ...timestamps,
});

export const powerReadings = pgTable("power_readings", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    feedId: text("feed_id")
        .notNull()
        .references(() => powerFeeds.id),
    voltageV: real("voltage_v").notNull(),
    currentA: real("current_a").notNull(),
    powerKw: real("power_kw").notNull(),
    powerFactor: real("power_factor"),
    energyKwh: real("energy_kwh"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
});
