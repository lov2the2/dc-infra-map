import { z } from "zod/v4";

export const regionCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
    description: z.string().nullable().optional(),
});

export const regionUpdateSchema = regionCreateSchema.partial();

export type RegionCreateInput = z.infer<typeof regionCreateSchema>;
export type RegionUpdateInput = z.infer<typeof regionUpdateSchema>;
