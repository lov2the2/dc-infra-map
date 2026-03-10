import { NextRequest } from "next/server";
import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { successResponse, validationErrorResponse, handleApiError } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";
import { locationCreateSchema } from "@/lib/validators/location";

// GET /api/locations?siteId=...
export const GET = withAuth("sites", "read", async (req: NextRequest) => {
    try {
        const siteId = req.nextUrl.searchParams.get("siteId");
        const result = await db.query.locations.findMany({
            where: siteId
                ? (loc, { and, eq: deq, isNull: dIsNull }) =>
                    and(deq(loc.siteId, siteId), dIsNull(loc.deletedAt))
                : isNull(locations.deletedAt),
            orderBy: (loc, { asc }) => [asc(loc.name)],
        });
        return successResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
});

// POST /api/locations — create a location
export const POST = withAuth("sites", "create", async (req: NextRequest) => {
    try {
        const body = await req.json();
        const parsed = locationCreateSchema.safeParse(body);
        if (!parsed.success) {
            return validationErrorResponse(parsed.error);
        }

        const { name, slug, siteId, tenantId, description } = parsed.data;

        const [location] = await db
            .insert(locations)
            .values({
                name,
                slug,
                siteId,
                tenantId: tenantId ?? null,
                description: description ?? null,
            })
            .returning();

        return successResponse(location, 201);
    } catch (error) {
        return handleApiError(error);
    }
});
