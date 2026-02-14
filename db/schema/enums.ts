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
