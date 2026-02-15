import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { deviceTypes } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { id } = await context.params;
        const deviceType = await db.query.deviceTypes.findFirst({
            where: eq(deviceTypes.id, id),
            with: { manufacturer: true },
        });

        if (!deviceType) return errorResponse("Device type not found", 404);
        return successResponse(deviceType);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "devices", "update")) return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const body = await req.json();
        const [updated] = await db
            .update(deviceTypes)
            .set({ ...body, updatedAt: new Date() })
            .where(eq(deviceTypes.id, id))
            .returning();

        if (!updated) return errorResponse("Device type not found", 404);
        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "devices", "delete")) return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const [deleted] = await db
            .update(deviceTypes)
            .set({ deletedAt: new Date() })
            .where(eq(deviceTypes.id, id))
            .returning();

        if (!deleted) return errorResponse("Device type not found", 404);
        return successResponse({ message: "Device type deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
