import { NextRequest } from "next/server";
import { isNull, and, eq } from "drizzle-orm";
import { db } from "@/db";
import { deviceTypes } from "@/db/schema";
import { successResponse, handleApiError } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

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
