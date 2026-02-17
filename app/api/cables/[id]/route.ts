import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cables } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { cableUpdateSchema } from "@/lib/validators/cable";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("cables", "read", async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const cable = await db.query.cables.findFirst({
        where: eq(cables.id, id),
        with: { tenant: true },
    });

    if (!cable) return errorResponse("Cable not found", 404);
    return successResponse(cable);
});

export const PATCH = withAuth("cables", "update", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const body = await req.json();
    const parsed = cableUpdateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await db.query.cables.findFirst({ where: eq(cables.id, id) });
    if (!existing) return errorResponse("Cable not found", 404);

    const { reason, ...data } = parsed.data;
    const [updated] = await db
        .update(cables)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(cables.id, id))
        .returning();

    await logAudit(session.user.id, "update", "cables", id, existing as Record<string, unknown>, updated as Record<string, unknown>, reason);

    return successResponse(updated);
});

export const DELETE = withAuth("cables", "delete", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const existing = await db.query.cables.findFirst({ where: eq(cables.id, id) });
    if (!existing) return errorResponse("Cable not found", 404);

    const [deleted] = await db
        .update(cables)
        .set({ deletedAt: new Date() })
        .where(eq(cables.id, id))
        .returning();

    await logAudit(session.user.id, "delete", "cables", id, existing as Record<string, unknown>, null);

    if (!deleted) return errorResponse("Cable not found", 404);
    return successResponse({ message: "Cable deleted" });
});
