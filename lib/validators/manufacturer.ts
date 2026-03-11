import { z } from "zod/v4";
import { slugSchema } from "./shared";

export const manufacturerCreateSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    slug: slugSchema,
    description: z.string().nullable().optional(),
});

export const manufacturerUpdateSchema = manufacturerCreateSchema.partial();

export type ManufacturerCreateInput = z.infer<typeof manufacturerCreateSchema>;
export type ManufacturerUpdateInput = z.infer<typeof manufacturerUpdateSchema>;
