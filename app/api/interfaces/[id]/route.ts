import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { interfaces } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { interfaceUpdateSchema } from "@/lib/validators/cable";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { id } = await context.params;
        const iface = await db.query.interfaces.findFirst({
            where: eq(interfaces.id, id),
            with: { device: true },
        });

        if (!iface) return errorResponse("Interface not found", 404);
        return successResponse(iface);
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
        const parsed = interfaceUpdateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await db.query.interfaces.findFirst({ where: eq(interfaces.id, id) });
        if (!existing) return errorResponse("Interface not found", 404);

        const { reason, ...data } = parsed.data;
        const [updated] = await db
            .update(interfaces)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(interfaces.id, id))
            .returning();

        await logAudit(session.user.id, "update", "interfaces", id, existing as Record<string, unknown>, updated as Record<string, unknown>, reason);

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
        const existing = await db.query.interfaces.findFirst({ where: eq(interfaces.id, id) });
        if (!existing) return errorResponse("Interface not found", 404);

        const [deleted] = await db
            .update(interfaces)
            .set({ deletedAt: new Date() })
            .where(eq(interfaces.id, id))
            .returning();

        await logAudit(session.user.id, "delete", "interfaces", id, existing as Record<string, unknown>, null);

        if (!deleted) return errorResponse("Interface not found", 404);
        return successResponse({ message: "Interface deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
