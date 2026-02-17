import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { successResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { tenantCreateSchema } from "@/lib/validators/tenant";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("sites", "read", async (_req, _session) => {
    const result = await db.query.tenants.findMany({
        where: isNull(tenants.deletedAt),
    });

    return successResponse(result);
});

export const POST = withAuth("sites", "create", async (req, session) => {
    const body = await req.json();
    const parsed = tenantCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { ...data } = parsed.data;
    const [tenant] = await db.insert(tenants).values(data).returning();

    await logAudit(session.user.id, "create", "tenants", tenant.id, null, tenant as Record<string, unknown>);

    return successResponse(tenant, 201);
});
