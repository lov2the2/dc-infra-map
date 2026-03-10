import { NextRequest } from "next/server";
import { isNull, and, eq } from "drizzle-orm";
import { db } from "@/db";
import { racks } from "@/db/schema";
import { successResponse, handleApiError } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

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
