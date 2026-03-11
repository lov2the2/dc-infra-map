import { NextRequest } from "next/server";
import { isNull, and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/db";
import { deviceTypes } from "@/db/schema";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

const deviceTypeCreateSchema = z.object({
    manufacturerId: z.string().min(1, "Manufacturer is required"),
    model: z.string().min(1, "Model is required"),
    slug: z.string().min(1, "Slug is required"),
    uHeight: z.number().int().min(1).default(1),
});

// GET /api/device-types — list device types, optionally filtered by manufacturerId
export const GET = withAuth("devices", "read", async (req: NextRequest) => {
    try {
        const manufacturerId = req.nextUrl.searchParams.get("manufacturerId");
        const conditions = [isNull(deviceTypes.deletedAt)];
        if (manufacturerId) {
            conditions.push(eq(deviceTypes.manufacturerId, manufacturerId));
        }
        const result = await db.query.deviceTypes.findMany({
            where: and(...conditions),
            orderBy: (dt, { asc }) => [asc(dt.model)],
            with: { manufacturer: true },
        });
        return successResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
});

// POST /api/device-types — create a new device type (quick-create)
export const POST = withAuth("devices", "create", async (req: NextRequest) => {
    try {
        const body = await req.json();
        const parsed = deviceTypeCreateSchema.safeParse(body);
        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0]?.message ?? "Validation failed", 400);
        }
        const { manufacturerId, model, slug, uHeight } = parsed.data;
        const [deviceType] = await db
            .insert(deviceTypes)
            .values({ manufacturerId, model, slug, uHeight })
            .returning();
        return successResponse(deviceType, 201);
    } catch (error) {
        return handleApiError(error);
    }
});
