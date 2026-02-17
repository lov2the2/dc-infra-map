import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { frontPorts } from "@/db/schema";
import { successResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { frontPortCreateSchema } from "@/lib/validators/cable";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("cables", "read", async (req, _session) => {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");

    const conditions = [isNull(frontPorts.deletedAt)];
    if (deviceId) conditions.push(eq(frontPorts.deviceId, deviceId));

    const result = await db.query.frontPorts.findMany({
        where: and(...conditions),
        with: { device: true, rearPort: true },
    });

    return successResponse(result);
});

export const POST = withAuth("cables", "create", async (req, session) => {
    const body = await req.json();
    const parsed = frontPortCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { reason, ...data } = parsed.data;
    const [port] = await db.insert(frontPorts).values(data).returning();

    await logAudit(session.user.id, "create", "front_ports", port.id, null, port as Record<string, unknown>, reason);

    return successResponse(port, 201);
});
