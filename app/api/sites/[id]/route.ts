import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, getRouteId } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { siteUpdateSchema } from "@/lib/validators/site";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("sites", "read", async (req, _session) => {
    const id = getRouteId(req);
    const site = await db.query.sites.findFirst({
        where: eq(sites.id, id),
        with: { region: true, tenant: true, locations: true },
    });

    if (!site) return errorResponse("Site not found", 404);
    return successResponse(site);
});

export const PATCH = withAuth("sites", "update", async (req, session) => {
    const id = getRouteId(req);
    const body = await req.json();
    const parsed = siteUpdateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await db.query.sites.findFirst({ where: eq(sites.id, id) });
    if (!existing) return errorResponse("Site not found", 404);

    const [updated] = await db
        .update(sites)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(sites.id, id))
        .returning();

    const reason = body.reason as string | undefined;
    await logAudit(session.user.id, "update", "sites", id, existing as Record<string, unknown>, updated as Record<string, unknown>, reason);

    return successResponse(updated);
});

export const DELETE = withAuth("sites", "delete", async (req, session) => {
    const id = getRouteId(req);
    const existing = await db.query.sites.findFirst({ where: eq(sites.id, id) });
    if (!existing) return errorResponse("Site not found", 404);

    const [deleted] = await db
        .update(sites)
        .set({ deletedAt: new Date() })
        .where(eq(sites.id, id))
        .returning();

    await logAudit(session.user.id, "delete", "sites", id, existing as Record<string, unknown>, null);

    if (!deleted) return errorResponse("Site not found", 404);
    return successResponse({ message: "Site deleted" });
});
