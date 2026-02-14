import { NextRequest } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { powerPanels } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { powerPanelCreateSchema } from "@/lib/validators/power";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { searchParams } = new URL(req.url);
        const siteId = searchParams.get("siteId");

        const conditions = [isNull(powerPanels.deletedAt)];
        if (siteId) conditions.push(eq(powerPanels.siteId, siteId));

        const result = await db.query.powerPanels.findMany({
            where: and(...conditions),
            with: { powerFeeds: true, site: true },
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
        if (session.user.role === "viewer") return errorResponse("Forbidden", 403);

        const body = await req.json();
        const parsed = powerPanelCreateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const [panel] = await db.insert(powerPanels).values(parsed.data).returning();

        await logAudit(session.user.id, "create", "power_panels", panel.id, null, panel as Record<string, unknown>);

        return successResponse(panel, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
