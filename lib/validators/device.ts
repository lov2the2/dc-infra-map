import { z } from "zod/v4";

export const deviceCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    deviceTypeId: z.string().min(1, "Device type is required"),
    rackId: z.string().nullable().optional(),
    tenantId: z.string().nullable().optional(),
    status: z.enum(["active", "planned", "staged", "failed", "decommissioning", "decommissioned"]).optional(),
    face: z.enum(["front", "rear"]).optional(),
    position: z.number().int().min(1).nullable().optional(),
    serialNumber: z.string().nullable().optional(),
    assetTag: z.string().nullable().optional(),
    primaryIp: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    reason: z.string().optional(),
});

export const deviceUpdateSchema = deviceCreateSchema.partial().extend({
    reason: z.string().optional(),
});

export type DeviceCreateInput = z.infer<typeof deviceCreateSchema>;
export type DeviceUpdateInput = z.infer<typeof deviceUpdateSchema>;
