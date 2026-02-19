import { z } from "zod/v4";

export const slugSchema = z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens");
