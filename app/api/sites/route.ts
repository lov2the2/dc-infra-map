import { NextRequest } from "next/server";
import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from "@/lib/api";
import { withAuth } from "@/lib/auth/with-auth";
import { siteCreateSchema } from "@/lib/validators/site";

// GET /api/sites — list all sites
export const GET = withAuth("sites", "read", async (_req: NextRequest) => {
    try {
        const result = await db.query.sites.findMany({
            where: isNull(sites.deletedAt),
            orderBy: (s, { asc }) => [asc(s.name)],
            with: { region: true, tenant: true },
        });
        return successResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
});

// POST /api/sites — create a site
export const POST = withAuth("sites", "create", async (req: NextRequest) => {
    try {
        const body = await req.json();
        const parsed = siteCreateSchema.safeParse(body);
        if (!parsed.success) {
            return validationErrorResponse(parsed.error);
        }

        const { name, slug, status, regionId, tenantId, facility, address, latitude, longitude, description, customFields } = parsed.data;

        const [site] = await db
            .insert(sites)
            .values({
                name,
                slug,
                status: status ?? "active",
                regionId: regionId ?? null,
                tenantId: tenantId ?? null,
                facility: facility ?? null,
                address: address ?? null,
                latitude: latitude ?? null,
                longitude: longitude ?? null,
                description: description ?? null,
                customFields: customFields ?? null,
            })
            .returning();

        return successResponse(site, 201);
    } catch (error) {
        return handleApiError(error);
    }
});
