import { NextRequest } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { powerFeeds } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";
import { powerFeedCreateSchema } from "@/lib/validators/power";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "power_config", "read")) return errorResponse("Forbidden", 403);

        const { searchParams } = new URL(req.url);
        const panelId = searchParams.get("panelId");
        const rackId = searchParams.get("rackId");

        const conditions = [isNull(powerFeeds.deletedAt)];
        if (panelId) conditions.push(eq(powerFeeds.panelId, panelId));
        if (rackId) conditions.push(eq(powerFeeds.rackId, rackId));

        const result = await db.query.powerFeeds.findMany({
            where: and(...conditions),
            with: { panel: true, rack: true },
            orderBy: (t, { asc }) => [asc(t.name)],
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
        if (!checkPermission(session.user.role, "power_config", "create")) return errorResponse("Forbidden", 403);

        const body = await req.json();
        const parsed = powerFeedCreateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const [feed] = await db.insert(powerFeeds).values(parsed.data).returning();

        await logAudit(session.user.id, "create", "power_feeds", feed.id, null, feed as Record<string, unknown>);

        return successResponse(feed, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
