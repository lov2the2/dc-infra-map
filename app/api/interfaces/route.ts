import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { interfaces } from "@/db/schema";
import { successResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { interfaceCreateSchema } from "@/lib/validators/cable";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("cables", "read", async (req, _session) => {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");

    const conditions = [isNull(interfaces.deletedAt)];
    if (deviceId) conditions.push(eq(interfaces.deviceId, deviceId));

    const result = await db.query.interfaces.findMany({
        where: and(...conditions),
        with: { device: true },
    });

    return successResponse(result);
});

export const POST = withAuth("cables", "create", async (req, session) => {
    const body = await req.json();
    const parsed = interfaceCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { reason, ...data } = parsed.data;
    const [iface] = await db.insert(interfaces).values(data).returning();

    await logAudit(session.user.id, "create", "interfaces", iface.id, null, iface as Record<string, unknown>, reason);

    return successResponse(iface, 201);
});
