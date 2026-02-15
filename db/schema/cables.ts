import {
    pgTable,
    text,
    timestamp,
    integer,
    boolean,
    numeric,
} from "drizzle-orm/pg-core";
import {
    cableTypeEnum,
    cableStatusEnum,
    interfaceTypeEnum,
    portSideEnum,
} from "./enums";
import { devices } from "./devices";
import { tenants } from "./core";

// Shared timestamp columns
const timestamps = {
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const interfaces = pgTable("interfaces", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    deviceId: text("device_id")
        .notNull()
        .references(() => devices.id),
    name: text("name").notNull(),
    interfaceType: interfaceTypeEnum("interface_type").notNull(),
    speed: integer("speed"), // Mbps
    macAddress: text("mac_address"),
    enabled: boolean("enabled").default(true).notNull(),
    description: text("description"),
    ...timestamps,
});

export const consolePorts = pgTable("console_ports", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    deviceId: text("device_id")
        .notNull()
        .references(() => devices.id),
    name: text("name").notNull(),
    portType: text("port_type").notNull(), // 'rj45' | 'usb' | 'serial'
    speed: integer("speed"), // bps
    description: text("description"),
    ...timestamps,
});

export const rearPorts = pgTable("rear_ports", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    deviceId: text("device_id")
        .notNull()
        .references(() => devices.id),
    name: text("name").notNull(),
    portType: portSideEnum("port_type").notNull(),
    positions: integer("positions").default(1).notNull(),
    description: text("description"),
    ...timestamps,
});

export const frontPorts = pgTable("front_ports", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    deviceId: text("device_id")
        .notNull()
        .references(() => devices.id),
    name: text("name").notNull(),
    portType: portSideEnum("port_type").notNull(),
    rearPortId: text("rear_port_id")
        .notNull()
        .references(() => rearPorts.id),
    description: text("description"),
    ...timestamps,
});

export const cables = pgTable("cables", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    cableType: cableTypeEnum("cable_type").notNull(),
    status: cableStatusEnum("status").default("connected").notNull(),
    label: text("label").notNull(),
    length: numeric("length"), // meters
    color: text("color"),
    terminationAType: text("termination_a_type").notNull(), // 'interface' | 'frontPort' | 'rearPort' | 'consolePort' | 'powerPort' | 'powerOutlet'
    terminationAId: text("termination_a_id").notNull(),
    terminationBType: text("termination_b_type").notNull(),
    terminationBId: text("termination_b_id").notNull(),
    tenantId: text("tenant_id").references(() => tenants.id),
    description: text("description"),
    ...timestamps,
});
