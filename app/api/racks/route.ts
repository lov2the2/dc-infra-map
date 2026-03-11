import { NextRequest } from "next/server";
import { isNull, and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/db";
import { racks } from "@/db/schema";
import { successResponse, validationErrorResponse, handleApiError } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

const rackCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    locationId: z.string().min(1, "Location is required"),
    uHeight: z.number().int().min(1).max(100).default(42),
    tenantId: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
});

// GET /api/racks — list racks, optionally filtered by locationId
export const GET = withAuth("devices", "read", async (req: NextRequest) => {
    try {
        const locationId = req.nextUrl.searchParams.get("locationId");
        const conditions = [isNull(racks.deletedAt)];
        if (locationId) {
            conditions.push(eq(racks.locationId, locationId));
        }
        const result = await db.query.racks.findMany({
            where: and(...conditions),
            orderBy: (r, { asc }) => [asc(r.name)],
        });
        return successResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
});

// POST /api/racks — create a rack
export const POST = withAuth("devices", "create", async (req: NextRequest) => {
    try {
        const body = await req.json();
        const parsed = rackCreateSchema.safeParse(body);
        if (!parsed.success) {
            return validationErrorResponse(parsed.error);
        }

        const { name, locationId, uHeight, tenantId, description } = parsed.data;

        const [rack] = await db
            .insert(racks)
            .values({
                name,
                locationId,
                uHeight,
                tenantId: tenantId ?? null,
                description: description ?? null,
            })
            .returning();

        return successResponse(rack, 201);
    } catch (error) {
        return handleApiError(error);
    }
});
