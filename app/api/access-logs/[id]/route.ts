import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accessLogs } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { accessLogCheckOutSchema } from "@/lib/validators/access";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("access_logs", "read", async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const accessLog = await db.query.accessLogs.findFirst({
        where: eq(accessLogs.id, id),
        with: {
            createdByUser: {
                columns: { id: true, name: true, email: true },
            },
            site: true,
        },
    });

    if (!accessLog) return errorResponse("Access log not found", 404);
    return successResponse(accessLog);
});

export const PATCH = withAuth("access_logs", "update", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const body = await req.json();
    const parsed = accessLogCheckOutSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await db.query.accessLogs.findFirst({
        where: eq(accessLogs.id, id),
    });
    if (!existing) return errorResponse("Access log not found", 404);

    const data = parsed.data;
    const [updated] = await db
        .update(accessLogs)
        .set({
            checkOutNote: data.checkOutNote ?? null,
            status: "checked_out",
            actualCheckOutAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(accessLogs.id, id))
        .returning();

    await logAudit(
        session.user.id,
        "update",
        "access_logs",
        id,
        existing as Record<string, unknown>,
        updated as Record<string, unknown>,
    );

    return successResponse(updated);
});
