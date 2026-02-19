import { z } from "zod/v4";

export const rackCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    locationId: z.string().min(1, "Location is required"),
    tenantId: z.string().nullable().optional(),
    type: z.enum(["server", "network", "power", "mixed"]).optional(),
    uHeight: z.number().int().min(1).max(60).optional(),
    posX: z.number().int().nullable().optional(),
    posY: z.number().int().nullable().optional(),
    rotation: z
        .number()
        .int()
        .refine((v) => [0, 90, 180, 270].includes(v), {
            message: "Rotation must be 0, 90, 180, or 270",
        })
        .optional(),
    description: z.string().nullable().optional(),
});

export const rackUpdateSchema = rackCreateSchema.partial();

export type RackCreateInput = z.infer<typeof rackCreateSchema>;
export type RackUpdateInput = z.infer<typeof rackUpdateSchema>;
