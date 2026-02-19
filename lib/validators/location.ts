import { z } from "zod/v4";
import { slugSchema } from "./shared";

export const locationCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: slugSchema,
    siteId: z.string().min(1, "Site is required"),
    tenantId: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
});

export const locationUpdateSchema = locationCreateSchema.partial();

export type LocationCreateInput = z.infer<typeof locationCreateSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
