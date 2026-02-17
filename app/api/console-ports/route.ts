import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { consolePorts } from "@/db/schema";
import { successResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { consolePortCreateSchema } from "@/lib/validators/cable";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("cables", "read", async (req, _session) => {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");

    const conditions = [isNull(consolePorts.deletedAt)];
    if (deviceId) conditions.push(eq(consolePorts.deviceId, deviceId));

    const result = await db.query.consolePorts.findMany({
        where: and(...conditions),
        with: { device: true },
    });

    return successResponse(result);
});

export const POST = withAuth("cables", "create", async (req, session) => {
    const body = await req.json();
    const parsed = consolePortCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { reason, ...data } = parsed.data;
    const [port] = await db.insert(consolePorts).values(data).returning();

    await logAudit(session.user.id, "create", "console_ports", port.id, null, port as Record<string, unknown>, reason);

    return successResponse(port, 201);
});
