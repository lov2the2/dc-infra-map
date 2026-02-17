import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { rearPorts } from "@/db/schema";
import { successResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { rearPortCreateSchema } from "@/lib/validators/cable";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("cables", "read", async (req, _session) => {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");

    const conditions = [isNull(rearPorts.deletedAt)];
    if (deviceId) conditions.push(eq(rearPorts.deviceId, deviceId));

    const result = await db.query.rearPorts.findMany({
        where: and(...conditions),
        with: { device: true, frontPorts: true },
    });

    return successResponse(result);
});

export const POST = withAuth("cables", "create", async (req, session) => {
    const body = await req.json();
    const parsed = rearPortCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { reason, ...data } = parsed.data;
    const [port] = await db.insert(rearPorts).values(data).returning();

    await logAudit(session.user.id, "create", "rear_ports", port.id, null, port as Record<string, unknown>, reason);

    return successResponse(port, 201);
});
