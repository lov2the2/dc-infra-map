import { z } from "zod/v4";

export const interfaceCreateSchema = z.object({
    deviceId: z.string().min(1),
    name: z.string().min(1),
    interfaceType: z.enum([
        "rj45-1g", "rj45-10g", "sfp-1g", "sfp+-10g", "sfp28-25g",
        "qsfp+-40g", "qsfp28-100g", "console", "power",
    ]),
    speed: z.number().int().nullable().optional(),
    macAddress: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
    description: z.string().nullable().optional(),
    reason: z.string().optional(),
});

export const interfaceUpdateSchema = interfaceCreateSchema.partial().extend({
    reason: z.string().optional(),
});

export const consolePortCreateSchema = z.object({
    deviceId: z.string().min(1),
    name: z.string().min(1),
    portType: z.enum(["rj45", "usb", "serial"]),
    speed: z.number().int().nullable().optional(),
    description: z.string().nullable().optional(),
    reason: z.string().optional(),
});

export const consolePortUpdateSchema = consolePortCreateSchema.partial().extend({
    reason: z.string().optional(),
});

export const rearPortCreateSchema = z.object({
    deviceId: z.string().min(1),
    name: z.string().min(1),
    portType: z.enum(["front", "rear"]),
    positions: z.number().int().min(1).optional(),
    description: z.string().nullable().optional(),
    reason: z.string().optional(),
});

export const rearPortUpdateSchema = rearPortCreateSchema.partial().extend({
    reason: z.string().optional(),
});

export const frontPortCreateSchema = z.object({
    deviceId: z.string().min(1),
    name: z.string().min(1),
    portType: z.enum(["front", "rear"]),
    rearPortId: z.string().min(1),
    description: z.string().nullable().optional(),
    reason: z.string().optional(),
});

export const frontPortUpdateSchema = frontPortCreateSchema.partial().extend({
    reason: z.string().optional(),
});

export const cableCreateSchema = z.object({
    cableType: z.enum([
        "cat5e", "cat6", "cat6a", "fiber-om3", "fiber-om4", "fiber-sm",
        "dac", "power", "console",
    ]),
    status: z.enum(["connected", "planned", "decommissioned"]).optional(),
    label: z.string().min(1),
    length: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    terminationAType: z.enum([
        "interface", "frontPort", "rearPort", "consolePort", "powerPort", "powerOutlet",
    ]),
    terminationAId: z.string().min(1),
    terminationBType: z.enum([
        "interface", "frontPort", "rearPort", "consolePort", "powerPort", "powerOutlet",
    ]),
    terminationBId: z.string().min(1),
    tenantId: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    reason: z.string().optional(),
});

export const cableUpdateSchema = cableCreateSchema.partial().extend({
    reason: z.string().optional(),
});

export type InterfaceCreateInput = z.infer<typeof interfaceCreateSchema>;
export type ConsolePortCreateInput = z.infer<typeof consolePortCreateSchema>;
export type RearPortCreateInput = z.infer<typeof rearPortCreateSchema>;
export type FrontPortCreateInput = z.infer<typeof frontPortCreateSchema>;
export type CableCreateInput = z.infer<typeof cableCreateSchema>;
