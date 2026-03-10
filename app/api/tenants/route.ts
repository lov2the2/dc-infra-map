import { NextRequest } from "next/server";
import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { successResponse, handleApiError } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";

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
