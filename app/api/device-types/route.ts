import { NextRequest } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { deviceTypes } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "devices", "read")) return errorResponse("Forbidden", 403);

        const { searchParams } = new URL(req.url);
        const manufacturerId = searchParams.get("manufacturerId");

        const conditions = [isNull(deviceTypes.deletedAt)];
        if (manufacturerId) conditions.push(eq(deviceTypes.manufacturerId, manufacturerId));

        const result = await db.query.deviceTypes.findMany({
            where: and(...conditions),
            with: { manufacturer: true },
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
        if (!checkPermission(session.user.role, "devices", "create")) return errorResponse("Forbidden", 403);

        const body = await req.json();
        if (!body.name || !body.manufacturerId) {
            return errorResponse("name and manufacturerId are required", 422);
        }

        const [deviceType] = await db.insert(deviceTypes).values(body).returning();
        return successResponse(deviceType, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
