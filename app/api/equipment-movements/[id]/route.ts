import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { equipmentMovements } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { equipmentMovementUpdateSchema } from "@/lib/validators/access";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { id } = await context.params;
        const movement = await db.query.equipmentMovements.findFirst({
            where: eq(equipmentMovements.id, id),
            with: {
                site: true,
                rack: true,
                device: {
                    with: { deviceType: true },
                },
                requestedByUser: {
                    columns: { id: true, name: true, email: true },
                },
                approvedByUser: {
                    columns: { id: true, name: true, email: true },
                },
            },
        });

        if (!movement) return errorResponse("Equipment movement not found", 404);
        return successResponse(movement);
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
        const parsed = equipmentMovementUpdateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await db.query.equipmentMovements.findFirst({
            where: eq(equipmentMovements.id, id),
        });
        if (!existing) return errorResponse("Equipment movement not found", 404);

        const data = parsed.data;
        const updateValues: Record<string, unknown> = {
            ...data,
            updatedAt: new Date(),
        };

        if (data.status === "approved") {
            updateValues.approvedBy = session.user.id;
            updateValues.approvedAt = new Date();
        }

        if (data.status === "completed") {
            updateValues.completedAt = new Date();
        }

        const [updated] = await db
            .update(equipmentMovements)
            .set(updateValues)
            .where(eq(equipmentMovements.id, id))
            .returning();

        await logAudit(
            session.user.id,
            "update",
            "equipment_movements",
            id,
            existing as Record<string, unknown>,
            updated as Record<string, unknown>,
        );

        return successResponse(updated);
    } catch (error) {
        return handleApiError(error);
    }
}
