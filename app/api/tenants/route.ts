import { NextRequest } from "next/server";
import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { tenantCreateSchema } from "@/lib/validators/tenant";

export async function GET() {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const result = await db.query.tenants.findMany({
            where: isNull(tenants.deletedAt),
        });

        return successResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (session.user.role === "viewer") return errorResponse("Forbidden", 403);

        const body = await req.json();
        const parsed = tenantCreateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const { ...data } = parsed.data;
        const [tenant] = await db.insert(tenants).values(data).returning();

        await logAudit(session.user.id, "create", "tenants", tenant.id, null, tenant as Record<string, unknown>);

        return successResponse(tenant, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
