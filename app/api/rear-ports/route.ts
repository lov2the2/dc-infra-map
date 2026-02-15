import { NextRequest } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { rearPorts } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { checkPermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";
import { rearPortCreateSchema } from "@/lib/validators/cable";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "cables", "read")) return errorResponse("Forbidden", 403);

        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get("deviceId");

        const conditions = [isNull(rearPorts.deletedAt)];
        if (deviceId) conditions.push(eq(rearPorts.deviceId, deviceId));

        const result = await db.query.rearPorts.findMany({
            where: and(...conditions),
            with: { device: true, frontPorts: true },
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
        const parsed = rearPortCreateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const { reason, ...data } = parsed.data;
        const [port] = await db.insert(rearPorts).values(data).returning();

        await logAudit(session.user.id, "create", "rear_ports", port.id, null, port as Record<string, unknown>, reason);

        return successResponse(port, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
