import { NextRequest } from "next/server";
import { eq, isNull, and, ilike } from "drizzle-orm";
import { db } from "@/db";
import { cables } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { cableCreateSchema } from "@/lib/validators/cable";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

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
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (session.user.role === "viewer") return errorResponse("Forbidden", 403);

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
    } catch (error) {
        return handleApiError(error);
    }
}
