import { eq, isNull, and, ilike } from "drizzle-orm";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { successResponse, validationErrorResponse } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { deviceCreateSchema } from "@/lib/validators/device";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth("devices", "read", async (req, _session) => {
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
});

export const POST = withAuth("devices", "create", async (req, session) => {
    const body = await req.json();
    const parsed = deviceCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { reason, ...data } = parsed.data;
    const [device] = await db.insert(devices).values(data).returning();

    await logAudit(session.user.id, "create", "devices", device.id, null, device as Record<string, unknown>, reason);

    return successResponse(device, 201);
});
