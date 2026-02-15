import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accessLogs } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { accessLogCheckOutSchema } from "@/lib/validators/access";
import { checkPermission } from "@/lib/auth/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "access_logs", "read")) return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const accessLog = await db.query.accessLogs.findFirst({
            where: eq(accessLogs.id, id),
            with: {
                createdByUser: {
                    columns: { id: true, name: true, email: true },
                },
                site: true,
            },
        });

        if (!accessLog) return errorResponse("Access log not found", 404);
        return successResponse(accessLog);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "access_logs", "update")) return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const body = await req.json();
        const parsed = accessLogCheckOutSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await db.query.accessLogs.findFirst({
            where: eq(accessLogs.id, id),
        });
        if (!existing) return errorResponse("Access log not found", 404);

        const data = parsed.data;
        const [updated] = await db
            .update(accessLogs)
            .set({
                checkOutNote: data.checkOutNote ?? null,
                status: "checked_out",
                actualCheckOutAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(accessLogs.id, id))
            .returning();

        await logAudit(
            session.user.id,
            "update",
            "access_logs",
            id,
            existing as Record<string, unknown>,
            updated as Record<string, unknown>,
        );

        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
}
