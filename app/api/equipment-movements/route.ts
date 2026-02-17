import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { equipmentMovements } from "@/db/schema";
import { successResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { equipmentMovementCreateSchema } from "@/lib/validators/access";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("access_logs", "read", async (req, _session) => {
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
});

export const POST = withAuth("access_logs", "create", async (req, session) => {
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
});
