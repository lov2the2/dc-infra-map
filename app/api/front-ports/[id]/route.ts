import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { frontPorts } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";
import { frontPortUpdateSchema } from "@/lib/validators/cable";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { id } = await context.params;
        const port = await db.query.frontPorts.findFirst({
            where: eq(frontPorts.id, id),
            with: { device: true, rearPort: true },
        });

        if (!port) return errorResponse("Front port not found", 404);
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
        const parsed = frontPortUpdateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await db.query.frontPorts.findFirst({ where: eq(frontPorts.id, id) });
        if (!existing) return errorResponse("Front port not found", 404);

        const { reason, ...data } = parsed.data;
        const [updated] = await db
            .update(frontPorts)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(frontPorts.id, id))
            .returning();

        await logAudit(session.user.id, "update", "front_ports", id, existing as Record<string, unknown>, updated as Record<string, unknown>, reason);

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
        const existing = await db.query.frontPorts.findFirst({ where: eq(frontPorts.id, id) });
        if (!existing) return errorResponse("Front port not found", 404);

        const [deleted] = await db
            .update(frontPorts)
            .set({ deletedAt: new Date() })
            .where(eq(frontPorts.id, id))
            .returning();

        await logAudit(session.user.id, "delete", "front_ports", id, existing as Record<string, unknown>, null);

        if (!deleted) return errorResponse("Front port not found", 404);
        return successResponse({ message: "Front port deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
