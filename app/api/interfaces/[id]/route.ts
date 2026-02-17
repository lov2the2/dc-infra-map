import { eq } from "drizzle-orm";
import { db } from "@/db";
import { interfaces } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { interfaceUpdateSchema } from "@/lib/validators/cable";
import { withAuth, withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const iface = await db.query.interfaces.findFirst({
        where: eq(interfaces.id, id),
        with: { device: true },
    });

    if (!iface) return errorResponse("Interface not found", 404);
    return successResponse(iface);
});

export const PATCH = withAuth("cables", "update", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
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
});

export const DELETE = withAuth("cables", "delete", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
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
});
