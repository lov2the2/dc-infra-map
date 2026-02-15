import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { powerPanels } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";
import { powerPanelUpdateSchema } from "@/lib/validators/power";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { id } = await context.params;
        const panel = await db.query.powerPanels.findFirst({
            where: eq(powerPanels.id, id),
            with: { powerFeeds: { with: { rack: true } }, site: true },
        });

        if (!panel) return errorResponse("Power panel not found", 404);
        return successResponse(panel);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "power_config", "update")) return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const body = await req.json();
        const parsed = powerPanelUpdateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await db.query.powerPanels.findFirst({ where: eq(powerPanels.id, id) });
        if (!existing) return errorResponse("Power panel not found", 404);

        const [updated] = await db
            .update(powerPanels)
            .set({ ...parsed.data, updatedAt: new Date() })
            .where(eq(powerPanels.id, id))
            .returning();

        await logAudit(session.user.id, "update", "power_panels", id, existing as Record<string, unknown>, updated as Record<string, unknown>);

        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "power_config", "delete")) return errorResponse("Forbidden", 403);

        const { id } = await context.params;
        const existing = await db.query.powerPanels.findFirst({ where: eq(powerPanels.id, id) });
        if (!existing) return errorResponse("Power panel not found", 404);

        await db
            .update(powerPanels)
            .set({ deletedAt: new Date() })
            .where(eq(powerPanels.id, id));

        await logAudit(session.user.id, "delete", "power_panels", id, existing as Record<string, unknown>, null);

        return successResponse({ message: "Power panel deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
