import { z } from "zod/v4";
import { slugSchema } from "./shared";

export const siteCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: slugSchema,
    status: z.enum(["active", "planned", "staging", "decommissioning", "retired"]).optional(),
    regionId: z.string().nullable().optional(),
    tenantId: z.string().nullable().optional(),
    facility: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    description: z.string().nullable().optional(),
    customFields: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const siteUpdateSchema = siteCreateSchema.partial();

export type SiteCreateInput = z.infer<typeof siteCreateSchema>;
export type SiteUpdateInput = z.infer<typeof siteUpdateSchema>;
