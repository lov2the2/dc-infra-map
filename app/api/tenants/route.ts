import { NextRequest } from "next/server";
import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { successResponse, validationErrorResponse, handleApiError } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";
import { tenantCreateSchema } from "@/lib/validators/tenant";

// GET /api/tenants — list all tenants
export const GET = withAuth("sites", "read", async (_req: NextRequest) => {
    try {
        const result = await db.query.tenants.findMany({
            where: isNull(tenants.deletedAt),
            orderBy: (t, { asc }) => [asc(t.name)],
        });
        return successResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
});

// POST /api/tenants — create a tenant
export const POST = withAuth("sites", "create", async (req: NextRequest) => {
    try {
        const body = await req.json();
        const parsed = tenantCreateSchema.safeParse(body);
        if (!parsed.success) {
            return validationErrorResponse(parsed.error);
        }

        const { name, slug, description } = parsed.data;

        const [tenant] = await db
            .insert(tenants)
            .values({
                name,
                slug,
                description: description ?? null,
            })
            .returning();

        return successResponse(tenant, 201);
    } catch (error) {
        return handleApiError(error);
    }
});
