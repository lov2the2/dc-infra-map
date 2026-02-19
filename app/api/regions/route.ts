import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { regions } from "@/db/schema";
import { successResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { regionCreateSchema } from "@/lib/validators/region";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("sites", "read", async (_req, _session) => {
    const result = await db.query.regions.findMany({
        where: isNull(regions.deletedAt),
    });

    return successResponse(result);
});

export const POST = withAuth("sites", "create", async (req, session) => {
    const body = await req.json();
    const parsed = regionCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const [region] = await db.insert(regions).values(parsed.data).returning();

    await logAudit(session.user.id, "create", "regions", region.id, null, region as Record<string, unknown>);

    return successResponse(region, 201);
});
