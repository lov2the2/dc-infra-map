import { eq } from "drizzle-orm";
import { db } from "@/db";
import { regions } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { regionUpdateSchema } from "@/lib/validators/region";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("sites", "read", async (req, _session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const region = await db.query.regions.findFirst({
        where: eq(regions.id, id),
    });

    if (!region) return errorResponse("Region not found", 404);
    return successResponse(region);
});

export const PATCH = withAuth("sites", "update", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const body = await req.json();
    const parsed = regionUpdateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await db.query.regions.findFirst({ where: eq(regions.id, id) });
    if (!existing) return errorResponse("Region not found", 404);

    const { ...data } = parsed.data;
    const [updated] = await db
        .update(regions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(regions.id, id))
        .returning();

    await logAudit(session.user.id, "update", "regions", id, existing as Record<string, unknown>, updated as Record<string, unknown>);

    return successResponse(updated);
});

export const DELETE = withAuth("sites", "delete", async (req, session) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    const existing = await db.query.regions.findFirst({ where: eq(regions.id, id) });
    if (!existing) return errorResponse("Region not found", 404);

    const [deleted] = await db
        .update(regions)
        .set({ deletedAt: new Date() })
        .where(eq(regions.id, id))
        .returning();

    await logAudit(session.user.id, "delete", "regions", id, existing as Record<string, unknown>, null);

    if (!deleted) return errorResponse("Region not found", 404);
    return successResponse({ message: "Region deleted" });
});
