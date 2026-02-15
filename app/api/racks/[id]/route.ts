import { NextRequest } from "next/server";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { racks, devices } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { rackUpdateSchema } from "@/lib/validators/rack";
import { checkPermission } from "@/lib/auth/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "racks", "read")) return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const rack = await db.query.racks.findFirst({
            where: eq(racks.id, id),
            with: {
                location: true,
                tenant: true,
                devices: {
                    where: isNull(devices.deletedAt),
                    with: { deviceType: true },
                },
            },
        });

        if (!rack) return errorResponse("Rack not found", 404);
        return successResponse(rack);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "racks", "update")) return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const body = await req.json();
        const parsed = rackUpdateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await db.query.racks.findFirst({ where: eq(racks.id, id) });
        if (!existing) return errorResponse("Rack not found", 404);

        const { ...data } = parsed.data;
        const [updated] = await db
            .update(racks)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(racks.id, id))
            .returning();

        const reason = body.reason as string | undefined;
        await logAudit(session.user.id, "update", "racks", id, existing as Record<string, unknown>, updated as Record<string, unknown>, reason);

        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "racks", "delete")) return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const existing = await db.query.racks.findFirst({ where: eq(racks.id, id) });
        if (!existing) return errorResponse("Rack not found", 404);

        const [deleted] = await db
            .update(racks)
            .set({ deletedAt: new Date() })
            .where(eq(racks.id, id))
            .returning();

        await logAudit(session.user.id, "delete", "racks", id, existing as Record<string, unknown>, null);

        if (!deleted) return errorResponse("Rack not found", 404);
        return successResponse({ message: "Rack deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
