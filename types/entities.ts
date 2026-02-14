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
