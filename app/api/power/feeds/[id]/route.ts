import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { powerFeeds } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { powerFeedUpdateSchema } from "@/lib/validators/power";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { id } = await context.params;
        const feed = await db.query.powerFeeds.findFirst({
            where: eq(powerFeeds.id, id),
            with: { panel: true, rack: true, powerPorts: true },
        });

        if (!feed) return errorResponse("Power feed not found", 404);
        return successResponse(feed);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (session.user.role === "viewer") return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const body = await req.json();
        const parsed = powerFeedUpdateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await db.query.powerFeeds.findFirst({ where: eq(powerFeeds.id, id) });
        if (!existing) return errorResponse("Power feed not found", 404);

        const [updated] = await db
            .update(powerFeeds)
            .set({ ...parsed.data, updatedAt: new Date() })
            .where(eq(powerFeeds.id, id))
            .returning();

        await logAudit(session.user.id, "update", "power_feeds", id, existing as Record<string, unknown>, updated as Record<string, unknown>);

        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (session.user.role !== "admin") return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const existing = await db.query.powerFeeds.findFirst({ where: eq(powerFeeds.id, id) });
        if (!existing) return errorResponse("Power feed not found", 404);

        await db
            .update(powerFeeds)
            .set({ deletedAt: new Date() })
            .where(eq(powerFeeds.id, id));

        await logAudit(session.user.id, "delete", "power_feeds", id, existing as Record<string, unknown>, null);

        return successResponse({ message: "Power feed deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
