import { NextRequest } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { interfaces } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";
import { interfaceCreateSchema } from "@/lib/validators/cable";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "cables", "read")) return errorResponse("Forbidden", 403);

        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get("deviceId");

        const conditions = [isNull(interfaces.deletedAt)];
        if (deviceId) conditions.push(eq(interfaces.deviceId, deviceId));

        const result = await db.query.interfaces.findMany({
            where: and(...conditions),
            with: { device: true },
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
        if (!checkPermission(session.user.role, "cables", "create")) return errorResponse("Forbidden", 403);

        const body = await req.json();
        const parsed = interfaceCreateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const { reason, ...data } = parsed.data;
        const [iface] = await db.insert(interfaces).values(data).returning();

        await logAudit(session.user.id, "create", "interfaces", iface.id, null, iface as Record<string, unknown>, reason);

        return successResponse(iface, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
