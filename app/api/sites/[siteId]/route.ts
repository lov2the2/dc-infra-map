import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, handleApiError, getRouteId } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";
import { siteUpdateSchema } from "@/lib/validators/site";

// GET /api/sites/[siteId]
export const GET = withAuth("sites", "read", async (req: NextRequest) => {
    try {
        const siteId = getRouteId(req);
        const site = await db.query.sites.findFirst({
            where: eq(sites.id, siteId),
            with: { region: true, tenant: true },
        });
        if (!site || site.deletedAt) {
            return errorResponse("Site not found", 404);
        }
        return successResponse(site);
    } catch (error) {
        return handleApiError(error);
    }
});

// PATCH /api/sites/[siteId]
export const PATCH = withAuth("sites", "update", async (req: NextRequest) => {
    try {
        const siteId = getRouteId(req);
        const body = await req.json();
        const parsed = siteUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return validationErrorResponse(parsed.error);
        }

        const [updated] = await db
            .update(sites)
            .set({ ...parsed.data, updatedAt: new Date() })
            .where(eq(sites.id, siteId))
            .returning();

        if (!updated) {
            return errorResponse("Site not found", 404);
        }
        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
});

// DELETE /api/sites/[siteId]
export const DELETE = withAuth("sites", "delete", async (req: NextRequest) => {
    try {
        const siteId = getRouteId(req);
        const [deleted] = await db
            .update(sites)
            .set({ deletedAt: new Date() })
            .where(eq(sites.id, siteId))
            .returning({ id: sites.id });

        if (!deleted) {
            return errorResponse("Site not found", 404);
        }
        return successResponse({ message: "Site deleted" });
    } catch (error) {
        return handleApiError(error);
    }
});
