import { NextRequest } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { equipmentMovements } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { equipmentMovementCreateSchema } from "@/lib/validators/access";
import { checkPermission } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "access_logs", "read")) return errorResponse("Forbidden", 403);

        const { searchParams } = new URL(req.url);
        const siteId = searchParams.get("siteId");
        const status = searchParams.get("status");
        const movementType = searchParams.get("movementType");
        const limit = parseInt(searchParams.get("limit") ?? "50", 10);
        const offset = parseInt(searchParams.get("offset") ?? "0", 10);

        const conditions = [isNull(equipmentMovements.deletedAt)];
        if (siteId) conditions.push(eq(equipmentMovements.siteId, siteId));
        if (status) conditions.push(eq(equipmentMovements.status, status as "pending"));
        if (movementType) conditions.push(eq(equipmentMovements.movementType, movementType as "install"));

        const result = await db.query.equipmentMovements.findMany({
            where: and(...conditions),
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
            limit,
            offset,
            orderBy: (t, { desc }) => [desc(t.createdAt)],
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
        if (!checkPermission(session.user.role, "access_logs", "create")) return errorResponse("Forbidden", 403);

        const body = await req.json();
        const parsed = equipmentMovementCreateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const data = parsed.data;
        const [movement] = await db
            .insert(equipmentMovements)
            .values({
                ...data,
                requestedBy: session.user.id,
                status: "pending",
            })
            .returning();

        await logAudit(
            session.user.id,
            "create",
            "equipment_movements",
            movement.id,
            null,
            movement as Record<string, unknown>,
        );

        return successResponse(movement, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
