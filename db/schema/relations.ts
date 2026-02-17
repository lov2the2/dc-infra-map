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
import { accessLogs, equipmentMovements } from "./access";
import { powerPanels, powerFeeds, powerPorts, powerOutlets, powerReadings } from "./power";
import { interfaces, consolePorts, rearPorts, frontPorts, cables } from "./cables";

// Auth relations
export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
    auditLogs: many(auditLogs),
    accessLogs: many(accessLogs),
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
    cables: many(cables),
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
    accessLogs: many(accessLogs),
    equipmentMovements: many(equipmentMovements),
    powerPanels: many(powerPanels),
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
    powerFeeds: many(powerFeeds),
    equipmentMovements: many(equipmentMovements),
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

export const devicesRelations = relations(devices, ({ one, many }) => ({
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
    powerPorts: many(powerPorts),
    interfaces: many(interfaces),
    consolePorts: many(consolePorts),
    frontPorts: many(frontPorts),
    rearPorts: many(rearPorts),
}));

// Audit relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
    }),
}));

// Access relations
export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
    site: one(sites, {
        fields: [accessLogs.siteId],
        references: [sites.id],
    }),
    createdByUser: one(users, {
        fields: [accessLogs.createdBy],
        references: [users.id],
    }),
}));

export const equipmentMovementsRelations = relations(equipmentMovements, ({ one }) => ({
    site: one(sites, {
        fields: [equipmentMovements.siteId],
        references: [sites.id],
    }),
    rack: one(racks, {
        fields: [equipmentMovements.rackId],
        references: [racks.id],
    }),
    device: one(devices, {
        fields: [equipmentMovements.deviceId],
        references: [devices.id],
    }),
    requestedByUser: one(users, {
        fields: [equipmentMovements.requestedBy],
        references: [users.id],
        relationName: "equipmentMovements_requestedBy",
    }),
    approvedByUser: one(users, {
        fields: [equipmentMovements.approvedBy],
        references: [users.id],
        relationName: "equipmentMovements_approvedBy",
    }),
}));

// Power relations
export const powerPanelsRelations = relations(powerPanels, ({ one, many }) => ({
    site: one(sites, {
        fields: [powerPanels.siteId],
        references: [sites.id],
    }),
    powerFeeds: many(powerFeeds),
    powerOutlets: many(powerOutlets),
}));

export const powerFeedsRelations = relations(powerFeeds, ({ one, many }) => ({
    panel: one(powerPanels, {
        fields: [powerFeeds.panelId],
        references: [powerPanels.id],
    }),
    rack: one(racks, {
        fields: [powerFeeds.rackId],
        references: [racks.id],
    }),
    powerPorts: many(powerPorts),
    powerReadings: many(powerReadings),
}));

export const powerReadingsRelations = relations(powerReadings, ({ one }) => ({
    feed: one(powerFeeds, {
        fields: [powerReadings.feedId],
        references: [powerFeeds.id],
    }),
}));

export const powerPortsRelations = relations(powerPorts, ({ one }) => ({
    feed: one(powerFeeds, {
        fields: [powerPorts.feedId],
        references: [powerFeeds.id],
    }),
    device: one(devices, {
        fields: [powerPorts.deviceId],
        references: [devices.id],
    }),
}));

export const powerOutletsRelations = relations(powerOutlets, ({ one }) => ({
    port: one(powerPorts, {
        fields: [powerOutlets.portId],
        references: [powerPorts.id],
    }),
    panel: one(powerPanels, {
        fields: [powerOutlets.panelId],
        references: [powerPanels.id],
    }),
}));

// Cable relations
export const interfacesRelations = relations(interfaces, ({ one }) => ({
    device: one(devices, {
        fields: [interfaces.deviceId],
        references: [devices.id],
    }),
}));

export const consolePortsRelations = relations(consolePorts, ({ one }) => ({
    device: one(devices, {
        fields: [consolePorts.deviceId],
        references: [devices.id],
    }),
}));

export const rearPortsRelations = relations(rearPorts, ({ one, many }) => ({
    device: one(devices, {
        fields: [rearPorts.deviceId],
        references: [devices.id],
    }),
    frontPorts: many(frontPorts),
}));

export const frontPortsRelations = relations(frontPorts, ({ one }) => ({
    device: one(devices, {
        fields: [frontPorts.deviceId],
        references: [devices.id],
    }),
    rearPort: one(rearPorts, {
        fields: [frontPorts.rearPortId],
        references: [rearPorts.id],
    }),
}));

export const cablesRelations = relations(cables, ({ one }) => ({
    tenant: one(tenants, {
        fields: [cables.tenantId],
        references: [tenants.id],
    }),
}));
