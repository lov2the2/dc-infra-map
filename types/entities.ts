import type { InferSelectModel } from "drizzle-orm";
import {
    manufacturers,
    tenants,
    regions,
    sites,
    locations,
    racks,
} from "@/db/schema/core";
import { deviceTypes, devices } from "@/db/schema/devices";
import { auditLogs } from "@/db/schema/audit";
import { accessLogs, equipmentMovements } from "@/db/schema/access";
import { powerPanels, powerFeeds, powerPorts, powerOutlets } from "@/db/schema/power";

// Base entity types (inferred from Drizzle schema)
export type Manufacturer = InferSelectModel<typeof manufacturers>;
export type Tenant = InferSelectModel<typeof tenants>;
export type Region = InferSelectModel<typeof regions>;
export type Site = InferSelectModel<typeof sites>;
export type Location = InferSelectModel<typeof locations>;
export type Rack = InferSelectModel<typeof racks>;
export type DeviceType = InferSelectModel<typeof deviceTypes>;
export type Device = InferSelectModel<typeof devices>;
export type AuditLog = InferSelectModel<typeof auditLogs>;

// Composite types with relations
export interface DeviceTypeWithManufacturer extends DeviceType {
    manufacturer: Manufacturer;
}

export interface DeviceWithRelations extends Device {
    deviceType: DeviceType & { manufacturer?: Manufacturer };
    rack: Rack | null;
    tenant: Tenant | null;
}

export interface RackWithDevices extends Rack {
    devices: (Device & { deviceType: DeviceType })[];
    location?: Location;
    tenant?: Tenant | null;
}

export interface LocationWithRacks extends Location {
    racks: Rack[];
    site?: Site;
}

export interface SiteWithLocations extends Site {
    locations: Location[];
    region: Region | null;
    tenant: Tenant | null;
}

export interface AuditLogWithUser extends AuditLog {
    user: { id: string; name: string | null; email: string } | null;
}

// Rack elevation helpers
export interface RackSlot {
    position: number;
    device: (Device & { deviceType: DeviceType }) | null;
}

// Base entity types for Phase 2
export type AccessLog = InferSelectModel<typeof accessLogs>;
export type EquipmentMovement = InferSelectModel<typeof equipmentMovements>;
export type PowerPanel = InferSelectModel<typeof powerPanels>;
export type PowerFeed = InferSelectModel<typeof powerFeeds>;
export type PowerPort = InferSelectModel<typeof powerPorts>;
export type PowerOutlet = InferSelectModel<typeof powerOutlets>;

// Composite types
export interface AccessLogWithUser extends AccessLog {
    createdByUser: { id: string; name: string | null; email: string } | null;
    site: Site;
}

export interface EquipmentMovementWithRelations extends EquipmentMovement {
    site: Site;
    rack: Rack | null;
    device: (Device & { deviceType: DeviceType }) | null;
    requestedByUser: { id: string; name: string | null; email: string };
    approvedByUser: { id: string; name: string | null; email: string } | null;
}

export interface PowerPanelWithFeeds extends PowerPanel {
    site?: Site;
    powerFeeds: PowerFeed[];
}

export interface PowerFeedWithRelations extends PowerFeed {
    panel: PowerPanel;
    rack: Rack | null;
    powerPorts: PowerPort[];
}

export interface RackPowerSummary {
    rackId: string;
    rackName: string;
    feeds: {
        feedId: string;
        name: string;
        feedType: string;
        maxKw: number;
        currentKw: number;
        utilizationPercent: number;
    }[];
    totalMaxKw: number;
    totalCurrentKw: number;
    utilizationPercent: number;
}

export interface PowerReadingEvent {
    feedId: string;
    time: string;
    voltageV: number;
    currentA: number;
    powerKw: number;
    powerFactor: number;
    energyKwh: number;
}
