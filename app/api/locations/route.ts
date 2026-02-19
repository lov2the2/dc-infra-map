import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { successResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { locationCreateSchema } from "@/lib/validators/location";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("sites", "read", async (req, _session) => {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    const conditions = [isNull(locations.deletedAt)];
    if (siteId) conditions.push(eq(locations.siteId, siteId));

    const result = await db.query.locations.findMany({
        where: and(...conditions),
        with: { site: true, tenant: true },
    });

    return successResponse(result);
});

export const POST = withAuth("sites", "create", async (req, session) => {
    const body = await req.json();
    const parsed = locationCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const [location] = await db.insert(locations).values(parsed.data).returning();

    await logAudit(session.user.id, "create", "locations", location.id, null, location as Record<string, unknown>);

    return successResponse(location, 201);
});
