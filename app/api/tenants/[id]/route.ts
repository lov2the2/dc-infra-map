import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { tenantUpdateSchema } from "@/lib/validators/tenant";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { id } = await context.params;
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, id),
            with: { devices: true, racks: true, sites: true },
        });

        if (!tenant) return errorResponse("Tenant not found", 404);
        return successResponse(tenant);
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
        const parsed = tenantUpdateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await db.query.tenants.findFirst({ where: eq(tenants.id, id) });
        if (!existing) return errorResponse("Tenant not found", 404);

        const { ...data } = parsed.data;
        const [updated] = await db
            .update(tenants)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(tenants.id, id))
            .returning();

        await logAudit(session.user.id, "update", "tenants", id, existing as Record<string, unknown>, updated as Record<string, unknown>);

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
        const existing = await db.query.tenants.findFirst({ where: eq(tenants.id, id) });
        if (!existing) return errorResponse("Tenant not found", 404);

        const [deleted] = await db
            .update(tenants)
            .set({ deletedAt: new Date() })
            .where(eq(tenants.id, id))
            .returning();

        await logAudit(session.user.id, "delete", "tenants", id, existing as Record<string, unknown>, null);

        if (!deleted) return errorResponse("Tenant not found", 404);
        return successResponse({ message: "Tenant deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
