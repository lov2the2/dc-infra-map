import { eq, isNull, and, ilike } from "drizzle-orm";
import { db } from "@/db";
import { cables } from "@/db/schema";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { cableCreateSchema } from "@/lib/validators/cable";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("cables", "read", async (req, _session) => {
    const { searchParams } = new URL(req.url);
    const cableType = searchParams.get("cableType");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const conditions = [isNull(cables.deletedAt)];
    if (cableType) conditions.push(eq(cables.cableType, cableType as "cat5e"));
    if (status) conditions.push(eq(cables.status, status as "connected"));
    if (search) conditions.push(ilike(cables.label, `%${search}%`));

    const result = await db.query.cables.findMany({
        where: and(...conditions),
        with: { tenant: true },
    });

    return successResponse(result);
});

export const POST = withAuth("cables", "create", async (req, session) => {
    const body = await req.json();
    const parsed = cableCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { reason, ...data } = parsed.data;

    // Validate A termination != B termination
    if (data.terminationAType === data.terminationBType && data.terminationAId === data.terminationBId) {
        return errorResponse("A termination and B termination cannot be the same", 400);
    }

    const [cable] = await db.insert(cables).values(data).returning();

    await logAudit(session.user.id, "create", "cables", cable.id, null, cable as Record<string, unknown>, reason);

    return successResponse(cable, 201);
});
