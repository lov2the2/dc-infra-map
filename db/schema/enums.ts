import { pgEnum } from "drizzle-orm/pg-core";

export const deviceStatusEnum = pgEnum("device_status", [
    "active",
    "planned",
    "staged",
    "failed",
    "decommissioning",
    "decommissioned",
]);

export const siteStatusEnum = pgEnum("site_status", [
    "active",
    "planned",
    "staging",
    "decommissioning",
    "retired",
]);

export const rackTypeEnum = pgEnum("rack_type", [
    "server",
    "network",
    "power",
    "mixed",
]);

export const deviceFaceEnum = pgEnum("device_face", [
    "front",
    "rear",
]);

export const userRoleEnum = pgEnum("user_role", [
    "admin",
    "operator",
    "viewer",
]);

export const accessTypeEnum = pgEnum("access_type", [
    "visit", "maintenance", "delivery", "emergency", "tour",
]);

export const accessStatusEnum = pgEnum("access_status", [
    "checked_in", "checked_out", "expired", "denied",
]);

export const equipmentMovementTypeEnum = pgEnum("equipment_movement_type", [
    "install", "remove", "relocate", "rma",
]);

export const equipmentMovementStatusEnum = pgEnum("equipment_movement_status", [
    "pending", "approved", "in_progress", "completed", "rejected",
]);

export const powerFeedPhaseEnum = pgEnum("power_feed_phase", [
    "single", "three",
]);

export const powerFeedTypeEnum = pgEnum("power_feed_type", [
    "primary", "redundant",
]);

export const powerPortTypeEnum = pgEnum("power_port_type", [
    "input", "output",
]);

export const powerOutletTypeEnum = pgEnum("power_outlet_type", [
    "iec_c13", "iec_c19", "nema_l6_30", "nema_l6_20",
]);

export const cableTypeEnum = pgEnum("cable_type", [
    "cat5e", "cat6", "cat6a", "fiber-om3", "fiber-om4", "fiber-sm", "dac", "power", "console",
]);

export const cableStatusEnum = pgEnum("cable_status", [
    "connected", "planned", "decommissioned",
]);

export const interfaceTypeEnum = pgEnum("interface_type", [
    "rj45-1g", "rj45-10g", "sfp-1g", "sfp+-10g", "sfp28-25g", "qsfp+-40g", "qsfp28-100g", "console", "power",
]);

export const portSideEnum = pgEnum("port_side", [
    "front", "rear",
]);
