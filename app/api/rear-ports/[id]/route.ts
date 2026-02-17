import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rearPorts } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { rearPortUpdateSchema } from "@/lib/validators/cable";
import { withAuth, withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const port = await db.query.rearPorts.findFirst({
        where: eq(rearPorts.id, id),
        with: { device: true, frontPorts: true },
    });

    if (!port) return errorResponse("Rear port not found", 404);
    return successResponse(port);
});

export const PATCH = withAuth("cables", "update", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const body = await req.json();
    const parsed = rearPortUpdateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await db.query.rearPorts.findFirst({ where: eq(rearPorts.id, id) });
    if (!existing) return errorResponse("Rear port not found", 404);

    const { reason, ...data } = parsed.data;
    const [updated] = await db
        .update(rearPorts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(rearPorts.id, id))
        .returning();

    await logAudit(session.user.id, "update", "rear_ports", id, existing as Record<string, unknown>, updated as Record<string, unknown>, reason);

    return successResponse(updated);
});

export const DELETE = withAuth("cables", "delete", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const existing = await db.query.rearPorts.findFirst({ where: eq(rearPorts.id, id) });
    if (!existing) return errorResponse("Rear port not found", 404);

    const [deleted] = await db
        .update(rearPorts)
        .set({ deletedAt: new Date() })
        .where(eq(rearPorts.id, id))
        .returning();

    await logAudit(session.user.id, "delete", "rear_ports", id, existing as Record<string, unknown>, null);

    if (!deleted) return errorResponse("Rear port not found", 404);
    return successResponse({ message: "Rear port deleted" });
});
