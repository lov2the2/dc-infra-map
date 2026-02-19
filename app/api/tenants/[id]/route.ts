import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, getRouteId } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { tenantUpdateSchema } from "@/lib/validators/tenant";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("sites", "read", async (req, _session) => {
    const id = getRouteId(req);
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, id),
        with: { devices: true, racks: true, sites: true },
    });

    if (!tenant) return errorResponse("Tenant not found", 404);
    return successResponse(tenant);
});

export const PATCH = withAuth("sites", "update", async (req, session) => {
    const id = getRouteId(req);
    const body = await req.json();
    const parsed = tenantUpdateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await db.query.tenants.findFirst({ where: eq(tenants.id, id) });
    if (!existing) return errorResponse("Tenant not found", 404);

    const [updated] = await db
        .update(tenants)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(tenants.id, id))
        .returning();

    await logAudit(session.user.id, "update", "tenants", id, existing as Record<string, unknown>, updated as Record<string, unknown>);

    return successResponse(updated);
});

export const DELETE = withAuth("sites", "delete", async (req, session) => {
    const id = getRouteId(req);
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
});
