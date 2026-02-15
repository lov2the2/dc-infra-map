import { NextRequest } from "next/server";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { racks } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "racks", "read")) return errorResponse("Forbidden", 403);

        const { searchParams } = new URL(req.url);
        const locationId = searchParams.get("locationId");

        const result = await db.query.racks.findMany({
            where: locationId
                ? eq(racks.locationId, locationId)
                : isNull(racks.deletedAt),
            with: { location: true, tenant: true },
        });

        return successResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "racks", "create")) return errorResponse("Forbidden", 403);

        const body = await req.json();
        const [rack] = await db.insert(racks).values(body).returning();

        return successResponse(rack, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
