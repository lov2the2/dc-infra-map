import { NextRequest } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { frontPorts } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { frontPortCreateSchema } from "@/lib/validators/cable";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get("deviceId");

        const conditions = [isNull(frontPorts.deletedAt)];
        if (deviceId) conditions.push(eq(frontPorts.deviceId, deviceId));

        const result = await db.query.frontPorts.findMany({
            where: and(...conditions),
            with: { device: true, rearPort: true },
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
        const parsed = frontPortCreateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const { reason, ...data } = parsed.data;
        const [port] = await db.insert(frontPorts).values(data).returning();

        await logAudit(session.user.id, "create", "front_ports", port.id, null, port as Record<string, unknown>, reason);

        return successResponse(port, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
