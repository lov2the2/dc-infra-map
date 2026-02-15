import { NextRequest } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { consolePorts } from "@/db/schema";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { consolePortCreateSchema } from "@/lib/validators/cable";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return errorResponse("Unauthorized", 401);

        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get("deviceId");

        const conditions = [isNull(consolePorts.deletedAt)];
        if (deviceId) conditions.push(eq(consolePorts.deviceId, deviceId));

        const result = await db.query.consolePorts.findMany({
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
        if (session.user.role === "viewer") return errorResponse("Forbidden", 403);

        const body = await req.json();
        const parsed = consolePortCreateSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const { reason, ...data } = parsed.data;
        const [port] = await db.insert(consolePorts).values(data).returning();

        await logAudit(session.user.id, "create", "console_ports", port.id, null, port as Record<string, unknown>, reason);

        return successResponse(port, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
