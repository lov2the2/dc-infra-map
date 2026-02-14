import { z } from "zod/v4";

export const accessLogCreateSchema = z.object({
    siteId: z.string().min(1, "Site is required"),
    personnelName: z.string().min(1, "Name is required"),
    company: z.string().nullable().optional(),
    contactPhone: z.string().nullable().optional(),
    accessType: z.enum(["visit", "maintenance", "delivery", "emergency", "tour"]),
    purpose: z.string().nullable().optional(),
    escortName: z.string().nullable().optional(),
    badgeNumber: z.string().nullable().optional(),
    expectedCheckOutAt: z.string().nullable().optional(),
});

export const accessLogCheckOutSchema = z.object({
    checkOutNote: z.string().nullable().optional(),
});

export const equipmentMovementCreateSchema = z.object({
    siteId: z.string().min(1, "Site is required"),
    rackId: z.string().nullable().optional(),
    deviceId: z.string().nullable().optional(),
    movementType: z.enum(["install", "remove", "relocate", "rma"]),
    description: z.string().nullable().optional(),
    serialNumber: z.string().nullable().optional(),
    assetTag: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});

export const equipmentMovementUpdateSchema = z.object({
    status: z.enum(["pending", "approved", "in_progress", "completed", "rejected"]).optional(),
    notes: z.string().nullable().optional(),
});

export type AccessLogCreateInput = z.infer<typeof accessLogCreateSchema>;
export type AccessLogCheckOutInput = z.infer<typeof accessLogCheckOutSchema>;
export type EquipmentMovementCreateInput = z.infer<typeof equipmentMovementCreateSchema>;
export type EquipmentMovementUpdateInput = z.infer<typeof equipmentMovementUpdateSchema>;
