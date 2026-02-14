import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { id } = await context.params;
        const device = await db.query.devices.findFirst({
            where: eq(devices.id, id),
            with: { deviceType: true, rack: true, tenant: true },
        });

        if (!device) return errorResponse("Device not found", 404);
        return successResponse(device);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (session.user.role === "viewer") return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const body = await req.json();
        const [updated] = await db
            .update(devices)
            .set({ ...body, updatedAt: new Date() })
            .where(eq(devices.id, id))
            .returning();

        if (!updated) return errorResponse("Device not found", 404);
        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (session.user.role !== "admin") return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const [deleted] = await db
            .update(devices)
            .set({ deletedAt: new Date() })
            .where(eq(devices.id, id))
            .returning();

        if (!deleted) return errorResponse("Device not found", 404);
        return successResponse({ message: "Device deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
