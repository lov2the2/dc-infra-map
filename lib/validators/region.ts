import { z } from "zod/v4";
import { slugSchema } from "./shared";

export const regionCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: slugSchema,
    description: z.string().nullable().optional(),
});

export const regionUpdateSchema = regionCreateSchema.partial();

export type RegionCreateInput = z.infer<typeof regionCreateSchema>;
export type RegionUpdateInput = z.infer<typeof regionUpdateSchema>;
