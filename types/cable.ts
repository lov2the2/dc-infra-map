import type { InferSelectModel } from "drizzle-orm";
import { interfaces, consolePorts, rearPorts, frontPorts, cables } from "@/db/schema/cables";
import type { Device, Tenant } from "@/types/entities";

// Base entity types
export type Interface = InferSelectModel<typeof interfaces>;
export type ConsolePort = InferSelectModel<typeof consolePorts>;
export type RearPort = InferSelectModel<typeof rearPorts>;
export type FrontPort = InferSelectModel<typeof frontPorts>;
export type Cable = InferSelectModel<typeof cables>;

// Composite types with relations
export interface InterfaceWithDevice extends Interface {
    device: Device;
}

export interface CableWithTenant extends Cable {
    tenant: Tenant | null;
}

export interface TraceStep {
    type: string;
    id: string;
    name: string;
    deviceName: string;
    cableLabel: string | null;
}

export interface FrontPortWithRearPort extends FrontPort {
    rearPort: RearPort;
    device: Device;
}

export interface RearPortWithFrontPorts extends RearPort {
    frontPorts: FrontPort[];
    device: Device;
}

export const CABLE_TYPES = [
    "cat5e", "cat6", "cat6a", "fiber-om3", "fiber-om4", "fiber-sm",
    "dac", "power", "console",
] as const;

export const CABLE_STATUSES = [
    "connected", "planned", "decommissioned",
] as const;

export const INTERFACE_TYPES = [
    "rj45-1g", "rj45-10g", "sfp-1g", "sfp+-10g", "sfp28-25g",
    "qsfp+-40g", "qsfp28-100g", "console", "power",
] as const;

export const TERMINATION_TYPES = [
    "interface", "frontPort", "rearPort", "consolePort", "powerPort", "powerOutlet",
] as const;
