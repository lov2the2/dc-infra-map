import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { manufacturers } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api";
import { withAuth, withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (_req, _session) => {
    const result = await db.query.manufacturers.findMany({
        where: isNull(manufacturers.deletedAt),
    });

    return successResponse(result);
});

export const POST = withAuth("devices", "create", async (req, _session) => {
    const body = await req.json();
    if (!body.name || !body.slug) {
        return errorResponse("name and slug are required", 422);
    }

    const [manufacturer] = await db.insert(manufacturers).values(body).returning();
    return successResponse(manufacturer, 201);
});
