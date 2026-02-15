import { NextRequest } from "next/server";
import { eq, isNull, and, ilike } from "drizzle-orm";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { deviceCreateSchema } from "@/lib/validators/device";
import { checkPermission } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);
        if (!checkPermission(session.user.role, "devices", "read")) return errorResponse("Forbidden", 403);

        const { searchParams } = new URL(req.url);
        const rackId = searchParams.get("rackId");
        const tenantId = searchParams.get("tenantId");
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const conditions = [isNull(devices.deletedAt)];
        if (rackId) conditions.push(eq(devices.rackId, rackId));
        if (tenantId) conditions.push(eq(devices.tenantId, tenantId));
        if (status) conditions.push(eq(devices.status, status as "active"));
        if (search) conditions.push(ilike(devices.name, `%${search}%`));

        const result = await db.query.devices.findMany({
            where: and(...conditions),
            with: { deviceType: true, rack: true, tenant: true },
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
        if (!checkPermission(session.user.role, "devices", "create")) return errorResponse("Forbidden", 403);

        const body = await req.json();
        const parsed = deviceCreateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const { reason, ...data } = parsed.data;
        const [device] = await db.insert(devices).values(data).returning();

        await logAudit(session.user.id, "create", "devices", device.id, null, device as Record<string, unknown>, reason);

        return successResponse(device, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
