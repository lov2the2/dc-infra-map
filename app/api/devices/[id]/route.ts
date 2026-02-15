import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { deviceUpdateSchema } from "@/lib/validators/device";
import { checkPermission } from "@/lib/auth/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "devices", "read")) return errorResponse("Forbidden", 403);

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
        if (!checkPermission(session.user.role, "devices", "update")) return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const body = await req.json();
        const parsed = deviceUpdateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await db.query.devices.findFirst({ where: eq(devices.id, id) });
        if (!existing) return errorResponse("Device not found", 404);

        const { reason, ...data } = parsed.data;
        const [updated] = await db
            .update(devices)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(devices.id, id))
            .returning();

        await logAudit(session.user.id, "update", "devices", id, existing as Record<string, unknown>, updated as Record<string, unknown>, reason);

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
        const existing = await db.query.devices.findFirst({ where: eq(devices.id, id) });
        if (!existing) return errorResponse("Device not found", 404);

        const [deleted] = await db
            .update(devices)
            .set({ deletedAt: new Date() })
            .where(eq(devices.id, id))
            .returning();

        await logAudit(session.user.id, "delete", "devices", id, existing as Record<string, unknown>, null);

        if (!deleted) return errorResponse("Device not found", 404);
        return successResponse({ message: "Device deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
