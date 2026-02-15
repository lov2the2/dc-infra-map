import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cables } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { cableUpdateSchema } from "@/lib/validators/cable";
import { checkPermission } from "@/lib/auth/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "cables", "read")) return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const cable = await db.query.cables.findFirst({
            where: eq(cables.id, id),
            with: { tenant: true },
        });

        if (!cable) return errorResponse("Cable not found", 404);
        return successResponse(cable);
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
        const parsed = cableUpdateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await db.query.cables.findFirst({ where: eq(cables.id, id) });
        if (!existing) return errorResponse("Cable not found", 404);

        const { reason, ...data } = parsed.data;
        const [updated] = await db
            .update(cables)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(cables.id, id))
            .returning();

        await logAudit(session.user.id, "update", "cables", id, existing as Record<string, unknown>, updated as Record<string, unknown>, reason);

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
        const existing = await db.query.cables.findFirst({ where: eq(cables.id, id) });
        if (!existing) return errorResponse("Cable not found", 404);

        const [deleted] = await db
            .update(cables)
            .set({ deletedAt: new Date() })
            .where(eq(cables.id, id))
            .returning();

        await logAudit(session.user.id, "delete", "cables", id, existing as Record<string, unknown>, null);

        if (!deleted) return errorResponse("Cable not found", 404);
        return successResponse({ message: "Cable deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
