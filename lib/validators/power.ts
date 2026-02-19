import { z } from "zod/v4";
import { slugSchema } from "./shared";

export const powerPanelCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: slugSchema,
    siteId: z.string().min(1, "Site is required"),
    location: z.string().nullable().optional(),
    ratedCapacityKw: z.number().positive("Capacity must be positive"),
    voltageV: z.number().int().positive().optional(),
    phaseType: z.enum(["single", "three"]).optional(),
});

export const powerPanelUpdateSchema = powerPanelCreateSchema.partial();

export const powerFeedCreateSchema = z.object({
    panelId: z.string().min(1, "Panel is required"),
    rackId: z.string().nullable().optional(),
    name: z.string().min(1, "Name is required"),
    feedType: z.enum(["primary", "redundant"]).optional(),
    maxAmps: z.number().positive("Max amps must be positive"),
    ratedKw: z.number().positive("Rated kW must be positive"),
});

export const powerFeedUpdateSchema = powerFeedCreateSchema.partial();

export const powerReadingSchema = z.object({
    feedId: z.string().min(1),
    voltageV: z.number(),
    currentA: z.number(),
    powerKw: z.number(),
    powerFactor: z.number().optional(),
    energyKwh: z.number().optional(),
});

export const powerReadingBatchSchema = z.array(powerReadingSchema);

export type PowerPanelCreateInput = z.infer<typeof powerPanelCreateSchema>;
export type PowerPanelUpdateInput = z.infer<typeof powerPanelUpdateSchema>;
export type PowerFeedCreateInput = z.infer<typeof powerFeedCreateSchema>;
export type PowerFeedUpdateInput = z.infer<typeof powerFeedUpdateSchema>;
export type PowerReadingInput = z.infer<typeof powerReadingSchema>;
