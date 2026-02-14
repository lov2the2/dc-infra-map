import { NextRequest } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { locationCreateSchema } from "@/lib/validators/location";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { searchParams } = new URL(req.url);
        const siteId = searchParams.get("siteId");

        const conditions = [isNull(locations.deletedAt)];
        if (siteId) conditions.push(eq(locations.siteId, siteId));

        const result = await db.query.locations.findMany({
            where: and(...conditions),
            with: { site: true, tenant: true },
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
        const parsed = locationCreateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const { ...data } = parsed.data;
        const [location] = await db.insert(locations).values(data).returning();

        await logAudit(session.user.id, "create", "locations", location.id, null, location as Record<string, unknown>);

        return successResponse(location, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
