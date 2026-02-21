import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { successResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { siteCreateSchema } from "@/lib/validators/site";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("sites", "read", async (_req, _session) => {
    const result = await db.query.sites.findMany({
        where: isNull(sites.deletedAt),
        with: { region: true, tenant: true },
    });

    return successResponse(result);
});

export const POST = withAuth("sites", "create", async (req, session) => {
    const body = await req.json();
    const parsed = siteCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const [site] = await db.insert(sites).values(parsed.data).returning();

    await logAudit(session.user.id, "create", "sites", site.id, null, site as Record<string, unknown>);

    return successResponse(site, 201);
});
