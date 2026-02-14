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
