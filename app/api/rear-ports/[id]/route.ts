import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rearPorts } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";
import { rearPortUpdateSchema } from "@/lib/validators/cable";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { id } = await context.params;
        const port = await db.query.rearPorts.findFirst({
            where: eq(rearPorts.id, id),
            with: { device: true, frontPorts: true },
        });

        if (!port) return errorResponse("Rear port not found", 404);
        return successResponse(port);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "cables", "update")) return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const body = await req.json();
        const parsed = rearPortUpdateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await db.query.rearPorts.findFirst({ where: eq(rearPorts.id, id) });
        if (!existing) return errorResponse("Rear port not found", 404);

        const { reason, ...data } = parsed.data;
        const [updated] = await db
            .update(rearPorts)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(rearPorts.id, id))
            .returning();

        await logAudit(session.user.id, "update", "rear_ports", id, existing as Record<string, unknown>, updated as Record<string, unknown>, reason);

        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "cables", "delete")) return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const existing = await db.query.rearPorts.findFirst({ where: eq(rearPorts.id, id) });
        if (!existing) return errorResponse("Rear port not found", 404);

        const [deleted] = await db
            .update(rearPorts)
            .set({ deletedAt: new Date() })
            .where(eq(rearPorts.id, id))
            .returning();

        await logAudit(session.user.id, "delete", "rear_ports", id, existing as Record<string, unknown>, null);

        if (!deleted) return errorResponse("Rear port not found", 404);
        return successResponse({ message: "Rear port deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
