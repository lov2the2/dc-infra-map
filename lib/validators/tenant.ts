import { z } from "zod/v4";
import { slugSchema } from "./shared";

export const tenantCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: slugSchema,
    description: z.string().nullable().optional(),
});

export const tenantUpdateSchema = tenantCreateSchema.partial();

export type TenantCreateInput = z.infer<typeof tenantCreateSchema>;
export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>;
