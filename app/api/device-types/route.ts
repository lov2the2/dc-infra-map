import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { deviceTypes } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("devices", "read", async (req, _session) => {
    const { searchParams } = new URL(req.url);
    const manufacturerId = searchParams.get("manufacturerId");

    const conditions = [isNull(deviceTypes.deletedAt)];
    if (manufacturerId) conditions.push(eq(deviceTypes.manufacturerId, manufacturerId));

    const result = await db.query.deviceTypes.findMany({
        where: and(...conditions),
        with: { manufacturer: true },
    });

    return successResponse(result);
});

export const POST = withAuth("devices", "create", async (req, _session) => {
    const body = await req.json();
    if (!body.name || !body.manufacturerId) {
        return errorResponse("name and manufacturerId are required", 422);
    }

    const [deviceType] = await db.insert(deviceTypes).values(body).returning();
    return successResponse(deviceType, 201);
});
