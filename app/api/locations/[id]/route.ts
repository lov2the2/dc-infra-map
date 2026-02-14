import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { locationUpdateSchema } from "@/lib/validators/location";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { id } = await context.params;
        const location = await db.query.locations.findFirst({
            where: eq(locations.id, id),
            with: { site: true, racks: true, tenant: true },
        });

        if (!location) return errorResponse("Location not found", 404);
        return successResponse(location);
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
        const parsed = locationUpdateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await db.query.locations.findFirst({ where: eq(locations.id, id) });
        if (!existing) return errorResponse("Location not found", 404);

        const { ...data } = parsed.data;
        const [updated] = await db
            .update(locations)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(locations.id, id))
            .returning();

        await logAudit(session.user.id, "update", "locations", id, existing as Record<string, unknown>, updated as Record<string, unknown>);

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
        const existing = await db.query.locations.findFirst({ where: eq(locations.id, id) });
        if (!existing) return errorResponse("Location not found", 404);

        const [deleted] = await db
            .update(locations)
            .set({ deletedAt: new Date() })
            .where(eq(locations.id, id))
            .returning();

        await logAudit(session.user.id, "delete", "locations", id, existing as Record<string, unknown>, null);

        if (!deleted) return errorResponse("Location not found", 404);
        return successResponse({ message: "Location deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
