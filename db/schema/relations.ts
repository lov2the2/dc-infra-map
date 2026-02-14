import { relations } from "drizzle-orm";
import { users, accounts, sessions } from "./auth";
import {
    manufacturers,
    tenants,
    regions,
    sites,
    locations,
    racks,
} from "./core";
import { deviceTypes, devices } from "./devices";
import { auditLogs } from "./audit";

// Auth relations
export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
    auditLogs: many(auditLogs),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

// Core relations
export const regionsRelations = relations(regions, ({ many }) => ({
    sites: many(sites),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
    sites: many(sites),
    locations: many(locations),
    racks: many(racks),
    devices: many(devices),
}));

export const sitesRelations = relations(sites, ({ one, many }) => ({
    region: one(regions, {
        fields: [sites.regionId],
        references: [regions.id],
    }),
    tenant: one(tenants, {
        fields: [sites.tenantId],
        references: [tenants.id],
    }),
    locations: many(locations),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
    site: one(sites, {
        fields: [locations.siteId],
        references: [sites.id],
    }),
    tenant: one(tenants, {
        fields: [locations.tenantId],
        references: [tenants.id],
    }),
    racks: many(racks),
}));

export const racksRelations = relations(racks, ({ one, many }) => ({
    location: one(locations, {
        fields: [racks.locationId],
        references: [locations.id],
    }),
    tenant: one(tenants, {
        fields: [racks.tenantId],
        references: [tenants.id],
    }),
    devices: many(devices),
}));

// Device relations
export const manufacturersRelations = relations(manufacturers, ({ many }) => ({
    deviceTypes: many(deviceTypes),
}));

export const deviceTypesRelations = relations(deviceTypes, ({ one, many }) => ({
    manufacturer: one(manufacturers, {
        fields: [deviceTypes.manufacturerId],
        references: [manufacturers.id],
    }),
    devices: many(devices),
}));

export const devicesRelations = relations(devices, ({ one }) => ({
    deviceType: one(deviceTypes, {
        fields: [devices.deviceTypeId],
        references: [deviceTypes.id],
    }),
    rack: one(racks, {
        fields: [devices.rackId],
        references: [racks.id],
    }),
    tenant: one(tenants, {
        fields: [devices.tenantId],
        references: [tenants.id],
    }),
}));

// Audit relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
    }),
}));
