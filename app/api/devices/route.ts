import { eq, isNull, and, ilike, inArray } from "drizzle-orm";
import { db } from "@/db";
import { devices, racks, locations } from "@/db/schema";
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
    const siteId = searchParams.get("siteId");

    const conditions = [isNull(devices.deletedAt)];
    if (rackId) conditions.push(eq(devices.rackId, rackId));
    if (tenantId) conditions.push(eq(devices.tenantId, tenantId));
    if (status) conditions.push(eq(devices.status, status as "active"));
    if (search) conditions.push(ilike(devices.name, `%${search}%`));

    // Filter by siteId: resolve rack IDs that belong to the given site
    if (siteId) {
        // Find all locations in the site, then all racks in those locations
        const siteLocations = await db
            .select({ id: locations.id })
            .from(locations)
            .where(eq(locations.siteId, siteId));

        if (siteLocations.length === 0) {
            return successResponse([]);
        }

        const locationIds = siteLocations.map((l) => l.id);
        const siteRacks = await db
            .select({ id: racks.id })
            .from(racks)
            .where(and(isNull(racks.deletedAt), inArray(racks.locationId, locationIds)));

        if (siteRacks.length === 0) {
            return successResponse([]);
        }

        const rackIds = siteRacks.map((r) => r.id);
        conditions.push(inArray(devices.rackId, rackIds));
    }

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
